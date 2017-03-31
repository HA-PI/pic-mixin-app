(function (window, Hammer) {
    const SIZE = {
        w: 320,
        h: 320
    };
    const N = 2;

    function ImgEditor(imgSpace, imgElem, imageList, index, eventAble, eventElem) {
        this.imgSpace = imgSpace;
        this.imgElem = imgElem;
        this.eventElem = eventElem || document.body;
        this.imageList = imageList;
        this.eventAble = eventAble;
        this.index = index;
        this.start = {
            x: 0,
            y: 0,
            scale: 1,
            rotation: 0
        };
        this.image = {
            x: 0,
            y: 0,
            scale: 1,
            rotation: 0,
            rotationCache: 0,
            centerX: SIZE.w,
            centerY: SIZE.h
        };
        this.roleSize = {
            width: $('.swiper-slide-active').width(),
            height: $('.swiper-slide-active').height(),
        }
        this.hammerManager = new Hammer.Manager(this.eventElem);
        if (this.eventAble) {
            this._bindEvent();
        }
    }

    ImgEditor.prototype = {
        constructor: ImgEditor,

        _bindEvent: function () {
            this.hammerManager.add(new Hammer.Pinch({pointers: 2, threshold: 0}));
            // threshold设置检测的最小阀值
            this.hammerManager.add(new Hammer.Pan({threshold: 0, pointers: 1}));
            // 改变pinch回调的this指向
            this.hammerManager.off('pinchstart pinchmove').on('pinchstart pinchmove', this._onPinch.bind(this));
            this.hammerManager.off('pinchend pinchcancel').on('pinchend pinchcancel', this._onPinchEnd.bind(this));
            this.hammerManager.off('panstart panmove').on('panstart panmove', this._onPan.bind(this));
        },

        _onPan: function (e) {
            if (this.pinchState) return;
            if (e.type == 'panstart') {
                this.start.x = this.image.x;
                this.start.y = this.image.y;
            }
            this.image.x = this.start.x + e.deltaX;
            this.image.y = this.start.y + e.deltaY;
            this._updateTransform();
        },

        // 缩放图片 以及旋转图片
        _onPinch: function (e) {
            // hrs_send && hrs_send('scale: '+ e.scale+', rotation: '+e.rotation);
            if (e.type == 'pinchstart') {
                this.start.scale = this.image.scale;
                this.startRotation = e.rotation;
                this.image.rotationCache = this.image.rotation;
            }

            this.image.rotation = (e.rotation - this.startRotation) + this.image.rotationCache;
            this.image.scale = this.start.scale * e.scale;
            if (this.image.scale <= 0.2) this.image.scale = 0.2;
            this._updateTransform();
            this.pinchState = true;
        },

        _onPinchEnd: function (e) {
            setTimeout(function () {
                this.pinchState = false;
            }.bind(this), 200);
        },

        _updateTransform: function () {
            // 每次更新都要更新translate以及scale 因为只更新一个会被覆盖
            var value = [
                'translate(' + this.image.x + 'px,' + this.image.y + 'px)',
                'scale(' + this.image.scale + ')',
                'rotate(' + this.image.rotation + 'deg)'
            ];
            $(this.imgSpace).css({
                'transform': value.join(''),
                '-webkit-transform': value.join('')
            });
            return this;
        },

        createCanvas: function(size) {
            size = size || SIZE;
            var canvas = $('<canvas></canvas>');
            // 高清适配
            // canvas.css('width', size.w<<1 + 'px');
            // canvas.css('height', size.h<<1 + 'px');
            canvas[0].width = size.w<<1;
            canvas[0].height = size.h<<1;

            //这部分只是为了显示canvas绘制的内容 用于测试
            // canvas.css('position', 'absolute');
            // canvas.css('left', '0');
            // canvas.css('top', '0');
            // canvas.css('border', '1px solid black')
            // $(document.body).append(canvas)

            var ctx = canvas[0].getContext('2d');
            this.drawRole(ctx, size);
            this.drawBg(ctx, size);
            return canvas[0];
        },

        drawRole: function(ctx, size) {
            // 绘制底色，白色
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, N * size.w, N * size.h);
            var self = this;

            // 要做图片的适配，以最大边为缩放参考，做到contain效果
            if (self.imgElem.width > self.imgElem.height) {
                var scaleRole = size.w * N / self.imgElem.width;
            } else {
                scaleRole = size.h * N / self.imgElem.height;
            }

            scaleRole = scaleRole * this.image.scale;

            //这是一段神奇的代码 x y 是修正缩放之后的位置差
            var width = self.imgElem.width * scaleRole;
            var height = self.imgElem.height * scaleRole;

            var x = this.image.centerX - width / 2;
            var y = this.image.centerY - height / 2;

            var imageX = this.image.x/this.roleSize.width * size.w*N;
            var imageY = this.image.y/this.roleSize.height * size.h*N;

            var scaleWidth=self.imgElem.width*scaleRole;
            var scaleHeight=self.imgElem.height*scaleRole;
            // console.log(imageX, x, scaleWidth, self.imgElem.width, self.imgElem.height);
            // 增加旋转的功能
            ctx.save();
            ctx.translate(imageX + x+scaleWidth/2,imageY + y+scaleHeight/2);
            ctx.rotate(this.image.rotation*Math.PI/180);

            this._draw(ctx, self.imgElem, -scaleWidth/2, -scaleHeight/2, scaleRole);

        },

        drawBg: function(ctx, size) {

            // 绘制前景 根据当前轮播的index绘制
            var name = (this.index);
            var self = this;
            if(self.imageList[name].width>self.imageList[name].height){
                var scaleBg = size.w * 2 / self.imageList[name].width;
            }else{
                scaleBg = size.h * 2 / self.imageList[name].height;
            }
            var x=(size.w*2-self.imageList[name].width*scaleBg)/2;
            var y=(size.h*2-self.imageList[name].height*scaleBg)/2;
            this._draw(ctx, self.imageList[name], x, y, scaleBg);
        },

        _draw: function (ctx, img, x, y, scale) {
            img = img.length?img[0]:img;
            ctx.drawImage(img, 0, 0, img.width, img.height, x, y, img.width * scale, img.height * scale);
            ctx.restore();
        },


    }

    window.ImgEditor = ImgEditor;

})(window, window.Hammer)