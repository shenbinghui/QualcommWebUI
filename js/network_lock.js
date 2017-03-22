/**
 * network_lock 模块
 * @module network_lock
 * @class network_lock
 */
define(['knockout', 'service', 'jquery', 'config/config', 'home'], function (ko, service, $, config, home) {

    function lockVM() {
        var self = this;
        self.isCPE = config.PRODUCT_TYPE == 'CPE';
        self.hasRj45 = config.RJ45_SUPPORT;
        self.hasSms = config.HAS_SMS;
        self.hasPhonebook = config.HAS_PHONEBOOK;
        self.isSupportSD = config.SD_CARD_SUPPORT;
        self.deviceInfo = ko.observable([]);
        if(config.WIFI_SUPPORT_QR_SWITCH){
            var wifiInfo = service.getWifiBasic();
            self.showQRCode = config.WIFI_SUPPORT_QR_CODE && wifiInfo.show_qrcode_flag;
        }else{
            self.showQRCode = config.WIFI_SUPPORT_QR_CODE;
        }
        self.qrcodeSrc = './img/qrcode_ssid_wifikey.png?_=' + $.now();
        self.isHomePage = ko.observable(false);
        if(window.location.hash=="#home"){
            self.isHomePage(true);
        }

        self.supportUnlock = config.NETWORK_UNLOCK_SUPPORT;
        self.unlockCode = ko.observable();

        var info = service.getNetworkUnlockTimes();
        self.times = ko.observable(info.unlock_nck_time);

        self.unlock = function () {
            showLoading();
            service.unlockNetwork({
                unlock_network_code: self.unlockCode()
            }, function (data) {
                self.unlockCode("");
                if (data && data.result == "success") {
                    successOverlay();
                    if (window.location.hash == "#home") {
                        setTimeout(function () {
                            window.location.reload();
                        }, 500);
                    } else {
                        window.location.hash = "#home";
                    }
                } else {
                    var info = service.getNetworkUnlockTimes();
                    self.times(info.unlock_nck_time);
                    errorOverlay();
                }
            })
        };
		
        self.showOpModeWindow = function () {
            showSettingWindow("change_mode", "opmode/opmode_popup", "opmode/opmode_popup", 400, 300, function () {
            });
        };
        self.isLoggedIn = ko.observable(false);
        self.enableFlag = ko.observable(false);
        self.showNetSettings = ko.observable(false);
        if (self.isCPE || self.hasRj45) {
            service.getOpMode({}, function (data) {
                self.isLoggedIn(data.loginfo == "ok");
                    if (data.opms_wan_mode == "DHCP") {
                        self.enableFlag(true);
                    } else if ((data.opms_wan_mode == "PPP" && data.ppp_status != "ppp_disconnected") || (data.opms_wan_mode != "PPP" && data.rj45_state != "idle" && data.rj45_state != "dead")) {
                        self.enableFlag(false);
                    } else {
                        self.enableFlag(true);
                    }
                    var mode = (data.opms_wan_mode == "DHCP" || data.opms_wan_mode == "STATIC") ? "PPPOE" : data.opms_wan_mode;
                    var currentOpMode = "";
                    switch (mode) {
                        case "BRIDGE":
                            currentOpMode = "opmode_bridge";
							self.showNetSettings(false);
                            break;
                        case "PPPOE":
                            currentOpMode = "opmode_cable";
							self.showNetSettings(true);
                            break;
                        case "PPP":
                            currentOpMode = "opmode_gateway";
							self.showNetSettings(false);
                            break;
                        default:
                            break;
                    }
                    $("#opmode").attr("data-trans", currentOpMode).text($.i18n.prop(currentOpMode));
                });
        
		    addInterval(function () {
                var obj = service.getConnectionInfo();
                if (obj.opms_wan_mode == "DHCP") {
                    self.enableFlag(true);
                } else if ((obj.opms_wan_mode == "PPP" && obj.connectStatus != "ppp_disconnected") && (obj.opms_wan_mode != "PPP" && obj.rj45ConnectStatus != "idle" && obj.rj45ConnectStatus != "dead")) {
                    self.enableFlag(false);
                } else {
                    self.enableFlag(true);
                }
                var mode = (obj.opms_wan_mode == "DHCP" || obj.opms_wan_mode == "STATIC") ? "PPPOE" : obj.opms_wan_mode;
                var currentOpMode = "";
                switch (mode) {
                    case "BRIDGE":
                        currentOpMode = "opmode_bridge";
                        self.showNetSettings(false);
                        break;
                    case "PPPOE":
                        currentOpMode = "opmode_cable";
                        self.showNetSettings(true);
                        break;
                    case "PPP":
                        currentOpMode = "opmode_gateway";
                        self.showNetSettings(false);
                        break;
                    default:
                        break;
                }
                $("#opmode").attr("data-trans", currentOpMode).text($.i18n.prop(currentOpMode));
            }, 1000);
        }
	}

    function init() {
        var container = $('#container')[0];
        ko.cleanNode(container);
        var vm = new lockVM();
        ko.applyBindings(vm, container);

        $("#frmNetworkLock").validate({
            submitHandler: function () {
                vm.unlock();
            },
            rules: {
                txtLockNumber: "unlock_code_check"
            }
        });
    }

    return {
        init: init
    };
});