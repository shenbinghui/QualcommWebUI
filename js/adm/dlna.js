/**
 * dlna 模块
 * @module dlna
 * @class dlna
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

function ($, ko, config, service, _) {

    var dlnaLanguages = _.map(config.DLNA_LANGUAGES, function(item) {
        return new Option(item.name, item.value);
    });

    /**
     * dlna ViewModel
     * @class dlnaModel
     */
    function dlnaModel() {
        var self = this;

        var info = getDlnaSetting();

        self.languages = ko.observableArray(dlnaLanguages);
        self.selectedLanguage = ko.observable(info.language);
        self.deviceName = ko.observable(info.deviceName);
        self.shareAudio = ko.observable(info.shareAudio);
        self.shareImage = ko.observable(info.shareImage);
        self.shareVideo = ko.observable(info.shareVideo);
        self.isScanTrans = ko.observable();
        //是否显示rescan按钮
        self.needRescan = ko.observable(info.needRescan);
        //dlna是否可用
        self.dlnaEnable = ko.observable(info.dlnaEnable);
        //扫描状态是否显示
        self.onScanning = ko.observable(false);

        var trans = "";
        if(info.dlna_scan == "0"){
            trans = "scanning";
            self.onScanning(true);
        } else if(info.dlna_scan == "1"){
            if(info.needRescan){
                trans = "need_rescan";
                self.onScanning(true);
            } else{
                trans = "scanned";
                self.onScanning(true);
            }
        } else{
            self.onScanning(false);
        }
        self.isScanTrans($.i18n.prop(trans));
        updateScanStatus();

        self.setShareAudio = function() {
            var checkbox = $("#shareAudio:checked");
            if(checkbox && checkbox.length == 0){
                self.shareAudio("on");
            }else{
                self.shareAudio("off");
            }
        };

        self.setShareImage = function() {
            var checkbox = $("#shareImage:checked");
            if(checkbox && checkbox.length == 0){
                self.shareImage("on");
            }else{
                self.shareImage("off");
            }
        };

        self.setShareVideo = function() {
            var checkbox = $("#shareVideo:checked");
            if(checkbox && checkbox.length == 0){
                self.shareVideo("on");
            }else{
                self.shareVideo("off");
            }
        };

        self.nameMaxLength = ko.computed(function () {
            if ("UNICODE" == getEncodeType(self.deviceName()).encodeType) {
                return 16;
            } else {
                return 32;
            }
        });

        var checkbox = $(".checkboxToggle");
        if(!self.dlnaEnable()) {
            $('#frmDlna input').each(function() {
                $(this).attr("disabled", true);
            });
            disableCheckbox(checkbox);
        }

        /**
         * 保存dlna设置
         * @method save
         */
        self.save = function() {
            self.isScanTrans($.i18n.prop("scanning"));
            self.onScanning(true);
            var params = {};
            params.language = self.selectedLanguage();
            params.deviceName = self.deviceName();
            params.shareAudio = self.shareAudio();
            params.shareImage = self.shareImage();
            params.shareVideo = self.shareVideo();
            service.setDlnaSetting(params, function(result) {
                if (result.result == "success") {
                    self.clear();
                    successOverlay();
                } else {
                    errorOverlay();
                }
            });
        };

        /**
         * 重新扫描dlna共享文件
         * @method rescan
         */
        self.rescan = function() {
            self.isScanTrans($.i18n.prop("scanning"));
            self.onScanning(true);
            var params = {};
            service.rescanDlna(params, function(result) {
                if (result.result == "success") {
                    self.clear();
                    successOverlay();
                } else {
                    errorOverlay();
                }
            });
        };
        /**
         * 实时刷新扫描状态
         * @method updateScanStatus
         */
        function updateScanStatus() {
            var counter = 0;
            var trans = "";
            var timer = setInterval(function(){
                counter++;
                var data = service.getDlnaSetting();
                if(data.dlna_scan == "0"){
                    trans = "scanning";
                    self.onScanning(true);
                } else if(data.dlna_scan == "1"){
                    if(data.needRescan){
                        trans = "need_rescan";
                        self.onScanning(true);
                    } else{
                        trans = "scanned";
                        self.onScanning(true);
                    }
                } else{
                    self.onScanning(false);
                }
                self.isScanTrans($.i18n.prop(trans));
                if(counter >= 1200) {
                    clearInterval(timer);
                }
            }, 1000);
        }
        /**
         * 清除状态
         * @method clear
         */
        self.clear = function() {
            init();
        };
    }

    /**
     * 获取dlna参数
     * @method getDlnaSetting
     */
    function getDlnaSetting() {
        return service.getDlnaSetting();
    }


    /**
     * 初始化 ViewModel，并进行绑定
     * @method init
     */
    function init() {
        var container = $('#container');
        ko.cleanNode(container[0]);
        var vm = new dlnaModel();
        ko.applyBindings(vm, container[0]);

        $('#frmDlna').validate({
            submitHandler:function () {
                vm.save();
            },
            rules :{
                txtDeviceName: 'dlna_name_check'
            }
        });
    }

    return {
        init:init
    }
});
