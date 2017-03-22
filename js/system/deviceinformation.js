/**
 * deviceinformation 模块
 * @module deviceinformation
 * @class deviceinformation
 */

define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

    function ($, ko, config, service, _) {
        /**
         * deviceinformationViewModel
         * @class deviceinformationVM
         */
        function deviceinformationVM(){
            var self = this;
            leftMenuClick("menu_settings");

            self.imei=ko.observable("");
            self.imsi=ko.observable("");
            self.macAddress = ko.observable("");
            self.sw_version = ko.observable("");
            self.hw_version = ko.observable("");
            self.fw_version = ko.observable(""); //固件版本号
            self.wanIpAddress = ko.observable("");
            self.connected_Time = ko.observable(transSecond2Time(0));

            //显示设备信息
            var data = service.getDeviceInfo();
            deviceInformationUtil.initShownStatus(data);
            var addrInfo = deviceInformationUtil.getWanIpAddr(data);
            var info = service.getConnectionInfo();

            self.imei(verifyDeviceInfo(data.imei));
            self.imsi(verifyDeviceInfo(data.imsi));
            self.macAddress(verifyDeviceInfo(data.macAddress));
            self.sw_version(verifyDeviceInfo(data.sw_version));
            self.hw_version(verifyDeviceInfo(data.hw_version));
            self.fw_version(verifyDeviceInfo(data.fw_version));
            self.wanIpAddress(addrInfo.wanIpAddress);
            self.connected_Time(transSecond2Time(info.data_counter.currentConnectedTime));   //device connected time




        }


        var deviceInformationUtil = {
            initStatus: null,

            initShownStatus: function (data) {
                this.initStatus = {};
                var ipv6Mode = data.ipv6PdpType.toLowerCase().indexOf("v6") > 0;
                if(config.PRODUCT_TYPE == 'CPE') {
                    if (data.opms_wan_mode == "BRIDGE") {
                        this.initStatus.showIpv6WanIpAddr = false;
                        this.initStatus.showIpv4WanIpAddr = false;
                    } else if (data.opms_wan_mode == "DHCP" || data.opms_wan_mode == "PPPOE") {
                        this.initStatus.showIpv6WanIpAddr = false;
                        this.initStatus.showIpv4WanIpAddr = true;
                    } else if (data.opms_wan_mode == "STATIC") {
                        this.initStatus.showIpv6WanIpAddr = false;
                        this.initStatus.showIpv4WanIpAddr = true;
                    } else if (config.IPV6_SUPPORT) {//支持IPV6
                        if (data.pdpType == "IP") {//ipv4
                            this.initStatus.showIpv6WanIpAddr = false;
                            this.initStatus.showIpv4WanIpAddr = true;
                        } else if (ipv6Mode) {//ipv6(&ipv4)
                            if (data.ipv6PdpType == "IPv6") {
                                this.initStatus.showIpv6WanIpAddr = true;
                                this.initStatus.showIpv4WanIpAddr = false;
                            } else {
                                this.initStatus.showIpv6WanIpAddr = true;
                                this.initStatus.showIpv4WanIpAddr = true;
                            }
                        }
                    } else {//不支持IPV6
                        this.initStatus.showIpv6WanIpAddr = false;
                        this.initStatus.showIpv4WanIpAddr = true;
                    }
                } else {
                    if (config.IPV6_SUPPORT) {//支持IPV6
                        if (data.pdpType == "IP") {//ipv4
                            this.initStatus.showIpv6WanIpAddr = false;
                            this.initStatus.showIpv4WanIpAddr = true;
                        } else if (ipv6Mode) {//ipv6(&ipv4)
                            if (data.ipv6PdpType == "IPv6") {
                                this.initStatus.showIpv6WanIpAddr = true;
                                this.initStatus.showIpv4WanIpAddr = false;
                            } else {
                                this.initStatus.showIpv6WanIpAddr = true;
                                this.initStatus.showIpv4WanIpAddr = true;
                            }
                        }
                    } else {//不支持IPV6
                        this.initStatus.showIpv6WanIpAddr = false;
                        this.initStatus.showIpv4WanIpAddr = true;
                    }
                }
            },
            getWanIpAddr: function (data) {
                var addrInfo = {
                    wanIpAddress: '',
                    ipv6WanIpAddress: ''
                };
                if (data.opms_wan_mode == "DHCP" || data.opms_wan_mode == "PPPOE") {
                    addrInfo.wanIpAddress = verifyDeviceInfo(data.wanIpAddress);
                } else if (data.opms_wan_mode == "STATIC") {
                    addrInfo.wanIpAddress = verifyDeviceInfo(data.staticWanIpAddress);
                } else/* if (data.opms_wan_mode == "PPP")*/ {
                    var connectStatus = this.getConnectStatus(data.connectStatus, data.wifiConStatus);
                    if (connectStatus == 1) {
                        addrInfo.wanIpAddress = verifyDeviceInfo(data.wanIpAddress);
                        addrInfo.ipv6WanIpAddress = "— —";
                    } else if (connectStatus == 2) {
                        addrInfo.wanIpAddress = "— —";
                        addrInfo.ipv6WanIpAddress = verifyDeviceInfo(data.ipv6WanIpAddress);
                    } else if (connectStatus == 3) {
                        addrInfo.wanIpAddress = verifyDeviceInfo(data.wanIpAddress);
                        addrInfo.ipv6WanIpAddress = verifyDeviceInfo(data.ipv6WanIpAddress);
                    }
                    else if (connectStatus == 4) {
                        addrInfo.wanIpAddress = verifyDeviceInfo(data.wanIpAddress);
                        addrInfo.ipv6WanIpAddress = "— —";
                    }else {
                        addrInfo.wanIpAddress = "— —";
                        addrInfo.ipv6WanIpAddress = "— —";
                    }
                }
                return addrInfo;
            },

            getConnectStatus: function (status, wifiStatus) {
                if ((status == "ppp_disconnected" || status == "ppp_connecting" || status == "ppp_disconnecting") && (wifiStatus != "connect")){
                    return 0;
                } else if (status == "ppp_connected") {
                    return 1;
                } else if (status == "ipv6_connected") {
                    return 2;
                } else if (status == "ipv4_ipv6_connected") {
                    return 3;
                }
                else if (wifiStatus == "connect") {
                    return 4;
                }
            }

        };

        /**
         * 初始化 ViewModel，并进行绑定
         * @method init
         */
        function init() {
            var vm = new deviceinformationVM();
            ko.applyBindings(vm, $('#container')[0]);
        }

        return {
            init:init
        }
    });
