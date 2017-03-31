(function ($, Hammer) {
    var containerWidth = Math.round(Math.min(document.body.clientWidth, document.body.clientHeight) * .75);
    var containerHeight = containerWidth//-50*2+20+30;
    $('#work-main').width(containerWidth).height(containerHeight);

    var inputImage = $('#input-image');
    var btnMain = $('#btn-main');
    var imgSpace = $('#img-workspace');
    var swiperWrapper = $('.swiper-wrapper');
    var preview = $('#preview');

    function getQueryJson(query) {
        query = query.trim();
        if (query[0] == '?') {
            query = query.substr(1);
        }

        var kvStrs = query.split('&');
        var queryJson = {};
        kvStrs.map(function (kv) {
            kv = kv.split('=');
            queryJson[kv[0]] = decodeURIComponent(kv[1]);
        })
        return queryJson;
    }


    function App(btnMain, imgSpace, swiperWrapper) {
        this.inputImage = $('<input type="file" accept="image/*"/>');
        this.btnMain = btnMain;
        this.imgSpace = imgSpace;
        this.swiperWrapper = swiperWrapper;

        this._init();
    }

    document.addEventListener('WeixinJSBridgeReady', function(){
        //如果执行到这块的代码,就说明是在微信内部浏览器内打开的.
        // 只有微信下才发起ajsx请求获取微信头像
        /*$.ajax({
            type: 'GET',
            url: '/game/gameAjax/GetHeadimgUrl',
            // data to be added to query string:
            dataType: 'json',
            timeout: 10000,
            success: function(data){
                if(data&&data.data&&data.data.head_img_url){

                }else{

                }
            },
            error:function(data){
                setTimeout(function(){

                },5000)
            }
        });*/
    });

    App.prototype.isWeixinHack = (/MicroMessenger/i).test(window.navigator.userAgent);
    App.prototype.started = false;
    App.prototype.setRole = function (url) {
        var self = this;
        self.imgSpace.css('background-image', 'url('+ url +')');
        var img = new Image();
        img.src = url;
        img.crossOrigin = 'anonymous';
        self.editor = new ImgEditor(self.imgSpace, img, self.images, self.swiper.realIndex, self.started)._updateTransform();
    };

    App.prototype._init = function () {
        var self = this;
        this.inputImage.on('change', function (evt) {
            var file = self.inputImage.prop('files')[0];
            if (!file) return;
            var url = URL.createObjectURL(file);
            self.setRole(url);
        });

        this.btnMain.off('click').on('click', function (evt) {
            switch ($(evt.target).prop('id')) {
                case 'btn-select': {
                    this.inputImage.click();
                    break;
                }
                case 'btn-expert': {
                    this.editor && this.showing(this.editor.createCanvas());
                    break;
                }
                case 'btn-reset': {

                }
            }
        }.bind(this));
    }

    App.prototype.setBgs = function (bgs) {
        this.images = [];
        this.swiperWrapper.empty();
        bgs.forEach(function (src) {
            var im = new Image();
            im.src = src;
            im.crossOrigin = 'anonymous';
            this.images.push(im);
            var scene = $('<div class="swiper-slide"></div>');
            scene.css('background-image', 'url('+src+')');
            this.swiperWrapper.append(scene);
        }.bind(this));

        this.initSwiper();
        return this;
    };

    App.prototype.initSwiper = function () {
        this.swiper = new Swiper('.swiper-container', {
            pagination: '.swiper-pagination',
            paginationClickable: true,
            grabCursor: true,
            nextButton: '.swiper-button-next',
            // loop: true,
            prevButton: '.swiper-button-prev',
            // effect: 'flip',
            // allowSwipeToNext: false,
            // allowSwipeToPrev: false,
            spaceBetween: 30
        });
        var self = this;
        this.swiper.lockSwipeToNext();
        this.swiper.lockSwipeToPrev();
        $(this.swiper.bullets).map(function (i) {

            $(this).off('click').on('click', function () {
                if (self.swiper.realIndex != i) {
                    self.swiper.unlockSwipeToNext();
                    self.swiper.unlockSwipeToPrev();
                    self.swiper.unlockSwipes();
                    self.swiper.slideTo(+i);
                    self.swiper.lockSwipes();
                }
            })
        });
        this.swiper.nextButton.off('click').on('click', function () {
            var index = this.swiper.realIndex + 1;
            if (this.images[index].width) {
                // var c = this.swiperWrapper.children().eq(index);
                // var size = this._getComputedSize(c, this.images[index])
                // c.css(size);
                // this.swiperWrapper.css(size).css('margin', 'auto');
            }
            this.swiper.unlockSwipeToNext();
            this.swiper.slideNext();
            this.swiper.lockSwipeToNext();
        }.bind(this));
        this.swiper.prevButton.off('click').on('click', function () {
            var index = this.swiper.realIndex - 1;
            if (this.images[index].width) {
                // var c = this.swiperWrapper.children().eq(index);
                // c.css(this._getComputedSize(c, this.images[index]))
                // this.swiper.update();
            }

            this.swiper.unlockSwipeToPrev();
            this.swiper.slidePrev();
            this.swiper.lockSwipeToPrev();
        }.bind(this))
    };
    
    App.prototype._getComputedSize = function (container, imageSize) {
        var cHeight = container[0].clientHeight,
            cWidth = container[0].clientWidth;
        if (!imageSize || imageSize.width<=100) {
            return {width: '200px', height: '200px'};
        }
        var iWidth = imageSize.width,
            iHeight = imageSize.height;
        var width = iWidth, height = iHeight;
        if (iWidth/iHeight >= cWidth/cHeight) {
            if (iWidth >= cWidth) {
                width = cWidth;
                height = iHeight/iWidth*cWidth;
            }
        } else {
            if (iHeight >= cHeight) {
                height = cHeight;
                width = iWidth/iHeight*cHeight;
            }
        }
        console.log('img size: height: %d, width: %d', iHeight, iWidth);
        console.log('container size: height: %d, width: %d', cHeight, cWidth);
        console.log('computed container size: height: %d, width: %d', height, width);
        return {
            height: height+'px',
            width: width+'px'
        }
    };

    App.prototype.showing = function(canvas) {
        var data = canvas.toDataURL("image/jpeg", 1.0);
        var src = canvas.toDataURL();
        var str = '';
        str += '<span class="close">x</span>'
        str += '<img src="';
        str += src;
        str += '" class="img"/>';
        str += '<p class="create-text">长按图片<a download="pic.jpeg" href="'+src+'">保存</a></p>';
        preview.empty();
        preview.removeClass('animated fadeOut');
        preview.append(str);
        preview.find('.close').on('click', function () {
            preview.fadeOut('normal');
            // preview.addClass('animated fadeOut');
        });
        // console.log({src: src});
        preview.fadeIn('normal');
        // preview.addClass('animated fadeIn');
    };




    var app = new App(btnMain, imgSpace, swiperWrapper)
        .setBgs(new Array(5).fill("asset/3910148730215781452.png"))

    var json = getQueryJson(location.search);
    var head_img_url = json && json.headimgurl;
    if (head_img_url) {
        //TODO
        app.setRole('/__hrs__/forward?url='+head_img_url);
    }

    $('.known-btn').click(function () {
        $(this).parent().addClass('animated fadeOutUp');

        app.started = true;
        app.editor && app.editor._bindEvent();

    })



})(window.Zepto || window.jQuery, window.Hammer);