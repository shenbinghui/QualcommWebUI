/**
 * home 模块
 * @module home
 * @class home
 */

define(['knockout', 'service', 'jquery', 'config/config', 'underscore', 'status/statusBar', 'echarts', 'echarts/chart/pie'],
    function (ko, service, $, config, _, statusBar, echarts) {
        var CONNECT_STATUS = {CONNECTED: 1, DISCONNECTED: 2, CONNECTING: 3, DISCONNECTING: 4};
        var myChart = null;
        var refreshCount = 0;
        var chartOptions = {
			tooltip: {
                //trigger: 'item',
                formatter: "{b}"
            },
            title: {
                text: '',
                x: 'center',
                y: 'center',
                itemGap: 0,
                textStyle: {
                    color: '#FFF',
                    fontFamily: '微软雅黑',
                    fontSize: 20,
                    fontWeight: 'bolder'
                },
                subtextStyle: {
                    color: '#FFF',
                    fontFamily: '微软雅黑',
                    fontSize: 16,
                    fontWeight: 'bolder'
                }
            },
            animation: false,
            series: [
                {
                    name: '流量控制',
                    type: 'pie',
                    radius: ['0', '75'],
                    itemStyle: {
                        normal: {
                            label: {
                                show: false
                            },
                            labelLine: {
                                show: false
                            }
                        }
                    },
                    data: [

                    ],
                    selectedOffset: 3
                }
            ],
            color: ['red', 'red', 'red', 'red', 'red']
        };
		
        /**
         * HomeViewMode
         * @class HomeViewMode
         */

        function HomeViewMode() {
            var self = this;
            self.cpeMode = null;
			/* lewis added for show the operator */
			var info = service.getStatusInfo();
			self.networkOperator = ko.observable(info.networkOperator);
			
			/* lewis added show signal */
			self.signalImgSrc = ko.observable(getSignalImgSrc(info.signalImg, info.networkType, info.simStatus));
			
			/* lewis added show wifiStatus */
			self.wifi_enable = ko.observable(getWifiStatus(info.wifiStatus));

			
			// lewis added for apn show on home page
			var apn_settings = service.getApnSettings();
			
			self.apn_home = ko.observable(apn_settings.wanApn);
			self.apn_username_home = ko.observable(apn_settings.username);
			self.apn_password_home = ko.observable(apn_settings.password);
			self.apn_wan_dial_home = ko.observable(apn_settings.wanDial);
			
			self.apnv6_home = ko.observable(apn_settings.wanApnV6);
			self.apnv6_username_home = ko.observable(apn_settings.usernameV6);
			self.apnv6_password_home = ko.observable(apn_settings.passwordV6);


			self.network_mode_home = ko.observable(getNetworkType(service.getNetSelectInfo().net_select));
            /////////////////////////
            self.hasSms = config.HAS_SMS;
            self.hasPhonebook = config.HAS_PHONEBOOK;
            self.isSupportSD = config.SD_CARD_SUPPORT;
            self.visibility = config.INCLUDE_MOBILE? "visible" : "hidden";
            self.isCPE = config.PRODUCT_TYPE == 'CPE';
            self.hasRj45 = config.RJ45_SUPPORT;
            self.notDataCard = config.PRODUCT_TYPE != 'DATACARD';
			
			if(config.WIFI_SUPPORT_QR_SWITCH){
				var wifiInfo = service.getWifiBasic();
				self.showQRCode = config.WIFI_SUPPORT_QR_CODE && wifiInfo.show_qrcode_flag;
			}else{
				self.showQRCode = config.WIFI_SUPPORT_QR_CODE;
			}            
            self.qrcodeSrc = './img/qrcode_ssid_wifikey.png?_=' + $.now();			
			
            if(self.isCPE || self.hasRj45){
                var opModeObj = service.getOpMode();
                self.cpeMode = opModeObj.opms_wan_mode;
                self.isShowHomeConnect = ko.observable(homeUtil.showHomeConnect(opModeObj.opms_wan_mode));
            } else {
                self.isShowHomeConnect = ko.observable(true);
            }
            self.showTraffic =  config.TRAFFIC_SUPPORT && (!self.hasRj45 || (self.hasRj45 && self.cpeMode == 'PPP'));
            self.isSupportQuicksetting = config.HAS_QUICK_SETTING && (!self.hasRj45 || (self.hasRj45 && self.cpeMode == 'PPP'));//wifi APN 是否支持有关
            if(config.PRODUCT_TYPE == 'DATACARD') {
                $('#home_image').addClass('data-card');
            }

            var info = service.getConnectionInfo();
            self.networkType = ko.observable(homeUtil.getNetworkType(info.networkType));
            self.connectStatus = ko.observable(info.connectStatus);
			
			// lewis added for statictis show 
			self.recieved_home = ko.observable(transUnit(parseInt(info.data_counter.monthlyReceived, 10), false));
			self.sent_home = ko.observable(transUnit(parseInt(info.data_counter.monthlySent, 10), false));
			
			/* lewis add for show wan status*/			
			//self.connectStatus_info = ko.observable(getConnectStatus_info(info.connectStatus));
			
			self.canConnect = ko.observable(false);
            self.cStatus = ko.computed(function () {
                if (self.connectStatus().indexOf('_connected') != -1) {
                	$("#wanConnectStatus").attr("data-trans","home_connected").text($.i18n.prop("home_connected"));
                    return CONNECT_STATUS.CONNECTED;
                } else if (self.connectStatus().indexOf('_disconnecting') != -1) {
                	$("#wanConnectStatus").attr("data-trans","home_disconnecting").text($.i18n.prop("home_disconnecting"));
                    return CONNECT_STATUS.DISCONNECTING;
                } else if (self.connectStatus().indexOf('_connecting') != -1) {
                	$("#wanConnectStatus").attr("data-trans","home_connecting").text($.i18n.prop("home_connecting"));
                    return CONNECT_STATUS.CONNECTING;
                } else {
                	$("#wanConnectStatus").attr("data-trans","home_disconnected").text($.i18n.prop("home_disconnected"));
                    return CONNECT_STATUS.DISCONNECTED;
                }
            });

            self.current_Flux = ko.observable(transUnit(0, false));
            self.connected_Time = ko.observable(transSecond2Time(0));
            self.up_Speed = ko.observable(transUnit(0, true));
            self.down_Speed = ko.observable(transUnit(0, true));
            //////////////////////////

            self.isLoggedIn = ko.observable(false);
            self.enableFlag = ko.observable(true);

            self.deviceStatus = ko.observable('');
            self.simSerialNumber = ko.observable('');
            self.imei = ko.observable('');
            self.imsi = ko.observable('');
            self.wifiLongMode = ko.observable('');

            self.trafficAlertEnable = ko.observable(false);
            self.trafficUsed = ko.observable('');
            self.trafficLimited = ko.observable('');

            self.wireDeviceNum = ko.observable(service.getAttachedCableDevices().attachedDevices.length);
            self.wirelessDeviceNum = ko.observable(service.getStatusInfo().attachedDevices.length);

            self.showOpModeWindow = function () {
				if(self.enableFlag()){
					return;
				}
                showSettingWindow("change_mode", "opmode/opmode_popup", "opmode/opmode_popup", 400, 300, function () {
                });
            };
            self.currentOpMode = ko.observable("0");

			var wifiInfo = service.getWifiBasic();
            if(config.PRODUCT_TYPE != 'DATACARD') {
                var hSSID = $('#h_ssid');
                wifiInfo.wifi_enable == "1" ? hSSID.show() : hSSID.hide();
                hSSID.html($.i18n.prop('ssid_title') + ':' + wifiInfo.SSID);
            }
			
            var popoverShown = false;
            $('#showDetailInfo').popover({
                html: true,
                placement: 'top',
                trigger: 'focus',
                title: function () {
                    return $.i18n.prop('device_info')
                },
                content: function () {
                    return getDetailInfoContent();
                }
            }).on('shown.bs.popover', function () {
                popoverShown = true;
                //var scrollTopHeight = $("#topContainer").outerHeight();
                //if ($(window).scrollTop() > scrollTopHeight) {
                //    $(window).scrollTop(scrollTopHeight);
                //}
            }).on('hidden.bs.popover', function () {
                popoverShown = false;
            });

            function fetchDeviceInfo() {
                var data = service.getDeviceInfo();
                self.simSerialNumber(verifyDeviceInfo(data.simSerialNumber));
                self.deviceStatus("device_status_" + data.deviceStatus);
                self.imei(verifyDeviceInfo(data.imei));
                self.imsi(verifyDeviceInfo(data.imsi));
                self.wifiLongMode("wifi_des_" + data.wifiRange);
                return data;
            }

            fetchDeviceInfo();

            function getDetailInfoContent() {
                var data = fetchDeviceInfo();
                homeUtil.initShownStatus(data);
                var addrInfo = homeUtil.getWanIpAddr(data);
                var compiled = _.template($("#detailInfoTmpl").html());
                var tmpl = compiled({
                    deviceStatus: "device_status_" + data.deviceStatus,
                    simSerialNumber: verifyDeviceInfo(data.simSerialNumber),
                    imei: verifyDeviceInfo(data.imei),
                    imsi: verifyDeviceInfo(data.imsi),
                    signal: signalFormat(data.signal),
                    hasWifi: config.HAS_WIFI,
                    isCPE: config.PRODUCT_TYPE == 'CPE',
                    hasRj45: config.RJ45_SUPPORT,
                    showMultiSsid: config.HAS_MULTI_SSID && data.multi_ssid_enable == "1",
                    ssid: verifyDeviceInfo(data.ssid),
                    max_access_num: verifyDeviceInfo(data.max_access_num),
                    m_ssid: verifyDeviceInfo(data.m_ssid),
                    m_max_access_num: verifyDeviceInfo(data.m_max_access_num),
                    wifi_long_mode: "wifi_des_" + data.wifiRange,
                    lanDomain: verifyDeviceInfo(data.lanDomain),
                    ipAddress: verifyDeviceInfo(data.ipAddress),
                    showMacAddress: config.SHOW_MAC_ADDRESS,
                    macAddress: verifyDeviceInfo(data.macAddress),
                    showIpv4WanIpAddr: homeUtil.initStatus.showIpv4WanIpAddr,
                    wanIpAddress: addrInfo.wanIpAddress,
                    showIpv6WanIpAddr: homeUtil.initStatus.showIpv6WanIpAddr,
                    ipv6WanIpAddress: addrInfo.ipv6WanIpAddress,
                    sw_version: verifyDeviceInfo(data.sw_version),
                    fw_version: verifyDeviceInfo(data.fw_version),
                    hw_version: verifyDeviceInfo(data.hw_version)
                });
                return  $(tmpl).translate();
            }

            if (self.isCPE || self.hasRj45) {
                service.getOpMode({}, function (data) {
                    self.isLoggedIn(data.loginfo == "ok");
                    if (data.opms_wan_mode == "DHCP") {
                        self.enableFlag(true);
                    } else if (data.ppp_status != "ppp_disconnected") {
                        self.enableFlag(false);
                    } else {
                        self.enableFlag(true);
                    }
                    var mode = (data.opms_wan_mode == "DHCP" || data.opms_wan_mode == "STATIC") ? "PPPOE" : data.opms_wan_mode;
                    var currentOpMode = "";
                    switch (mode) {
                        case "BRIDGE":
                            currentOpMode = "opmode_bridge";
                            break;
                        case "PPPOE":
                            currentOpMode = "opmode_cable";
                            break;
                        case "PPP":
                            currentOpMode = "opmode_gateway";
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
                    } else if (obj.connectStatus != "ppp_disconnected") {
                        self.enableFlag(false);
                    } else {
                        self.enableFlag(true);
                    }
                    var mode = (obj.opms_wan_mode == "DHCP" || obj.opms_wan_mode == "STATIC") ? "PPPOE" : obj.opms_wan_mode;
                    var currentOpMode = "";
                    switch (mode) {
                        case "BRIDGE":
                            currentOpMode = "opmode_bridge";
                            break;
                        case "PPPOE":
                            currentOpMode = "opmode_cable";
                            break;
                        case "PPP":
                            currentOpMode = "opmode_gateway";
                            break;
                        default:
                            break;
                    }
                    $("#opmode").attr("data-trans", currentOpMode).text($.i18n.prop(currentOpMode));
                }, 1000);
            }

            self.connectHandler = function () {
                if (checkConnectedStatus(self.connectStatus())) {
                    showLoading('disconnecting');
                    service.disconnect({}, function (data) {
                        if (data.result) {
                            successOverlay();
//                            opmode.init();
                        } else {
                            errorOverlay();
                        }
                    });
                } else {
                    if (service.getStatusInfo().roamingStatus) {
                        showConfirm('dial_roaming_connect', function () {
                            self.connect();
//                            opmode.init();
                        });

                    } else {
                        self.connect();
//                        opmode.init();
                    }
                }
            };

            self.connect = function () {
                var statusInfo = service.getStatusInfo();
                var trafficResult = statusBar.getTrafficResult(statusInfo);
                if (statusInfo.limitVolumeEnable && trafficResult.showConfirm) {
                    var confirmMsg = null;
                    if (trafficResult.usedPercent > 100) {
                        confirmMsg = {msg: 'traffic_beyond_connect_msg'};
                        statusBar.setTrafficAlertPopuped(true);
                    } else {
                        confirmMsg = {msg: 'traffic_limit_connect_msg', params: [trafficResult.limitPercent]};
                        statusBar.setTrafficAlert100Popuped(false);
                    }
                    showConfirm(confirmMsg, function () {
                        homeUtil.doConnect();
                    });
                } else {
                    homeUtil.doConnect();
                }
            };

			service.getSignalStrength({}, function (data) {
                var signalTxt = signalFormat(config.PRODUCT_TYPE == "CPE"? data.rssi : convertSignal(data));
                $("#fresh_signal_strength").text(signalTxt);
                if (popoverShown) {
                    $("#popoverSignalTxt").text(signalTxt);
                }
            });
            homeUtil.refreshHomeData(self);
            addInterval(function () {
                service.getSignalStrength({}, function (data) {
                    var signalTxt = signalFormat(config.PRODUCT_TYPE == "CPE"? data.rssi : convertSignal(data));
                    $("#fresh_signal_strength").text(signalTxt);
                    if (popoverShown) {
                        $("#popoverSignalTxt").text(signalTxt);
                    }
                });
                homeUtil.refreshHomeData(self);
            }, 1000);
            
            self.showNetworkSettingsWindow = function () {
                service.getOpMode({}, function (data) {
                    var mode = (data.opms_wan_mode == "DHCP" || data.opms_wan_mode == "STATIC") ? "PPPOE" : data.opms_wan_mode;
                    switch (mode) {
                        case "BRIDGE":
                            window.location.hash = '#home';
                            break;
                        case "PPPOE":
                            window.location.hash = '#net_setting';
                            break;
                        default:
                            window.location.hash = '#dial_setting';
                            break;
                    }
                });				
            };
            
            if($("#home_menu").hasClass("active") == false){
            	$("#home_menu").addClass('active');
				$("#sms_menu").removeClass('active');
				$("#statistic_menu").removeClass('active');
				$("#quick_setting_menu").removeClass('active');
				$("#sdcard_menu").removeClass('active');
            }
            		
        }

        var homeUtil = {
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
            },
            showHomeConnect: function (opms_wan_mode) {
                return "PPP" == opms_wan_mode;
            },
            cachedAPStationBasic: null,
            cachedConnectionMode: null,
            getCanConnectNetWork: function () {
                var status = service.getStatusInfo();
				if (status.deviceStatus != "0") {
                    return false;
                }
                if (status.simStatus != "modem_init_complete") {
                    return false;
                }
                var networkTypeTmp = status.networkType.toLowerCase();
                if (networkTypeTmp == '' || networkTypeTmp == 'limited service') {
                    networkTypeTmp = 'limited_service';
                }
                if (networkTypeTmp == 'no service') {
                    networkTypeTmp = 'no_service';
                }
                if(networkTypeTmp == 'limited_service' || networkTypeTmp == 'no_service') {
                    return false;
                }

                if (checkConnectedStatus(status.connectStatus)) {
                    if (config.AP_STATION_SUPPORT) {
                        if (status.ap_station_enable == true) {
                            if (status.dialMode == "auto_dial") {
                                return false;
                            }
                        }
                    }
                }

                if (config.AP_STATION_SUPPORT) {
                    if (status.connectWifiStatus == "connect") {
                        if (status.ap_station_mode == "wifi_pref") {
							return false;
                        }
                    }
                }
                return true;
            },
            doConnect: function () {
                showLoading('connecting');
                service.connect({}, function (data) {
                    if (data.result) {
                        successOverlay();
                    } else {
                        errorOverlay();
                    }
                });
            },
            refreshHomeData: function (vm) {
				var wifiInfo = service.getWifiBasic();
                if(config.PRODUCT_TYPE != 'DATACARD') {
                    var hSSID = $('#h_ssid');
                    wifiInfo.wifi_enable == "1" ? hSSID.show() : hSSID.hide();
                    hSSID.html($.i18n.prop('ssid_title') + ':' + wifiInfo.SSID);
                }
                var info = service.getConnectionInfo();
                vm.connectStatus(info.connectStatus);
                vm.canConnect(this.getCanConnectNetWork());
                vm.networkType(homeUtil.getNetworkType(info.networkType));
                if (checkConnectedStatus(info.connectStatus)) {
                    vm.current_Flux(transUnit(parseInt(info.data_counter.currentReceived, 10) + parseInt(info.data_counter.currentSent, 10), false));
                    vm.connected_Time(transSecond2Time(info.data_counter.currentConnectedTime));
                    vm.up_Speed(transUnit(info.data_counter.uploadRate, true));
                    vm.down_Speed(transUnit(info.data_counter.downloadRate, true));
                } else {
                    vm.current_Flux(transUnit(0, false));
                    vm.connected_Time(transSecond2Time(0));
                    vm.up_Speed(transUnit(0, true));
                    vm.down_Speed(transUnit(0, true));
                }

                vm.trafficAlertEnable(info.limitVolumeEnable);
                if (info.limitVolumeEnable) {
                    if (info.limitVolumeType == '1') { // Data
						vm.recieved_home(transUnit(parseInt(info.data_counter.monthlyReceived, 10), false));
						vm.sent_home(transUnit(parseInt(info.data_counter.monthlySent, 10), false));
                        vm.trafficUsed(transUnit(parseInt(info.data_counter.monthlySent, 10) + parseInt(info.data_counter.monthlyReceived, 10), false));
                        vm.trafficLimited(transUnit(info.limitDataMonth, false));
                    } else { // Time
                        vm.trafficUsed(transSecond2Time(info.data_counter.monthlyConnectedTime));
                        vm.trafficLimited(transSecond2Time(info.limitTimeMonth));
                    }
                }
                if(vm.showTraffic) {
                    homeUtil.updateEcharts(info);
                } else {
                    homeUtil.allFreeEcharts();
                }

                homeUtil.refreshStationInfo(vm);
            },
            allFreeEcharts: function() {
                var usedData = homeUtil.data.free;
                usedData.value = 1;
                usedData.selected = false;
				usedData.name = $.i18n.prop("echarts_no");
                chartOptions.series[0].data = [usedData];
                chartOptions.title.text = '';
                homeUtil.setEcharts(chartOptions,$.i18n.prop("echarts_no"));
            },
            getNetworkType: function (networkType) {
                var networkTypeTmp = networkType.toLowerCase();
                if (networkTypeTmp == '' || networkTypeTmp == 'limited service') {
                    networkTypeTmp = 'limited_service';
                }
                if (networkTypeTmp == 'no service') {
                    networkTypeTmp = 'no_service';
                }
                if (networkTypeTmp == 'limited_service' || networkTypeTmp == 'no_service') {
//                   $('#h_connect_btn:visible').hide();
                    return $.i18n.prop("network_type_" + networkTypeTmp);
                } else {
//                   $('#h_connect_btn:hidden').show();
                    return networkType;
                }
            },
            data: {
                start: {
                    value: 50,
                    name: '提醒值内未使用',
                    itemStyle: {
                        normal: {
                            color: '#D8D8D8'
                        }
                    }
                },
                alarm: {
                    value: 19.7,
                    name: '警戒区',
                    itemStyle: {
                        normal: {
                            color: '#8CC916'
                        }
                    }
                },
                alert: {
                    value: 1,
                    name: '提醒值',
                    itemStyle: {
                        normal: {
                            color: '#FF5500'
                        }
                    }
                },
                free: {
                    value: 50,
                    name: '未使用',
                    itemStyle: {
                        normal: {
                            color: '#D8D8D8'
                        }
                    }
                },
                left1: {
                    value: 50,
                    name: '提醒值内未使用',
                    itemStyle: {
                        normal: {
                            color: '#D8D8D8'
                        }
                    }
                },
                used: {
                    value: 30,
                    name: '已使用',
                    itemStyle: {
                        normal: {
                            color: '#8CC916'
                        }
                    }
                },
                full: {
                    value: 30,
                    name: '流量超出',
                    itemStyle: {
                        normal: {
                            color: '#DF4313'
                        }
                    }
                }
            },
            oldUsedData: null,
            oldAlarmData: null,
            updateEcharts: function (info) {
                var startName = $.i18n.prop("echarts_no");
                refreshCount++;
                if (refreshCount % 10 != 2) {
                    return false;
                }
                var total = 0, used = 0, reach = 0, left = 0, alarm = 0, left1 = 0;
                if (info.limitVolumeEnable) { //开启
                    startName = $.i18n.prop("echarts_used");
                    chartOptions.series[0].data = [];
                    if (info.limitVolumeType == '1') { // 数据
                        var limitedDataFormatted = transUnit(info.limitDataMonth, false);
                        //chartOptions.title.text = limitedDataFormatted;
                        chartOptions.series[0].data = [];
                        if (info.limitDataMonth == 0) {
                            var usedData = homeUtil.data.used;
                            usedData.value = 1;
                            usedData.selected = false;
							usedData.name = $.i18n.prop("echarts_used");
                            chartOptions.series[0].data.push(usedData);
                        } else {
                            var dataInfo = homeUtil.getDataInfo(limitedDataFormatted);
                            total = dataInfo.data * homeUtil.getUnitValue(dataInfo.unit) * 1048576;
                            used = parseInt(info.data_counter.monthlySent, 10) + parseInt(info.data_counter.monthlyReceived, 10);
                            reach = total * info.limitVolumePercent / 100;
                            if (used >= total) {
                                //used = total;
                                var fullData = homeUtil.data.full;
                                fullData.value = 100;
								fullData.name = $.i18n.prop("echarts_full");
                                chartOptions.series[0].data.push(fullData);
                                startName = $.i18n.prop("echarts_full");
                            } else {
                                if (reach - used > 0) {
                                    left1 = reach - used;
                                    left = total - reach;
                                } else {
                                    alarm = used - reach;
                                    left = total - used;
                                }
                                var freeData = homeUtil.data.free;
                                freeData.value = left;
								freeData.name = $.i18n.prop("echarts_free");
                                chartOptions.series[0].data.push(freeData);
                                if (alarm > 0) {
                                    var alarmData = homeUtil.data.alarm;
                                    alarmData.value = alarm;
									alarmData.name = $.i18n.prop("echarts_alarm");
                                    chartOptions.series[0].data.push(alarmData);
                                }
                                var alertData = homeUtil.data.alert;
                                alertData.value = total / 200;
								alertData.name = $.i18n.prop("echarts_alert");
                                chartOptions.series[0].data.push(alertData);
                                if (left1 > 0) {
                                    var left1Data = homeUtil.data.left1;
                                    left1Data.value = left1;
									left1Data.name = $.i18n.prop("echarts_left1");
                                    chartOptions.series[0].data.push(left1Data);
                                }
                                var usedData = homeUtil.data.used;
                                if (reach - used > 0) {
                                    usedData.value = used;
                                } else {
                                    usedData.value = reach;
                                }
								usedData.name = $.i18n.prop("echarts_used");
                                chartOptions.series[0].data.push(usedData);
                            }
                        }
                    } else { //时间
                        //chartOptions.title.text = (info.limitTimeMonth / 3600) + $.i18n.prop('hours');
                        chartOptions.series[0].data = [];
                        if (info.limitTimeMonth == 0) {
                            var usedData = homeUtil.data.used;
                            usedData.value = 1;
                            usedData.selected = false;
							usedData.name = $.i18n.prop("echarts_used");
                            chartOptions.series[0].data.push(usedData);
                        } else {
                            total = info.limitTimeMonth;
                            used = info.data_counter.monthlyConnectedTime;
                            reach = total * info.limitVolumePercent / 100;
                            if (used >= total) {
                                //used = total;
                                var fullTime = homeUtil.data.full;
                                fullTime.value = 100;
								fullTime.name = $.i18n.prop("echarts_full");
                                chartOptions.series[0].data.push(fullTime);
                                startName = $.i18n.prop("echarts_full");
                            } else {
                                if (reach - used > 0) {
                                    left1 = reach - used;
                                    left = total - reach;
                                } else {
                                    alarm = used - reach;
                                    left = total - used;
                                }
                                var freeTime = homeUtil.data.free;
                                freeTime.value = left;
								freeTime.name = $.i18n.prop("echarts_free");
                                chartOptions.series[0].data.push(freeTime);
                                if (alarm > 0) {
                                    var alarmTime = homeUtil.data.alarm;
                                    alarmTime.value = alarm;
									alarmTime.name = $.i18n.prop("echarts_alarm");
                                    chartOptions.series[0].data.push(alarmTime);
                                }
                                var alertTime = homeUtil.data.alert;
                                alertTime.value = total / 200;
								alertTime.name = $.i18n.prop("echarts_alert");
                                chartOptions.series[0].data.push(alertTime);
                                if (left1 > 0) {
                                    var left1Time = homeUtil.data.left1;
                                    left1Time.value = left1;
									left1Time.name = $.i18n.prop("echarts_left1");
                                    chartOptions.series[0].data.push(left1Time);
                                }
                                var usedTime = homeUtil.data.used;
                                if (reach - used > 0) {
                                    usedTime.value = used;
                                } else {
                                    usedTime.value = reach;
                                }
								usedTime.name = $.i18n.prop("echarts_used");
                                chartOptions.series[0].data.push(usedTime);
                            }
                        }
                    }
                } else {
                    var usedData = homeUtil.data.used;
                    usedData.value = 1;
                    usedData.selected = false;
                    usedData.name = $.i18n.prop("echarts_no");
                    chartOptions.series[0].data = [usedData];
                    chartOptions.title.text = '';
                }
                var firstEle = _.find(chartOptions.series[0].data, function (n) {
                    return n.name == $.i18n.prop("echarts_used");
                });

                var alarmEle = _.find(chartOptions.series[0].data, function (n) {
                    return n.name == $.i18n.prop("echarts_alarm");
                });

                if(!alarmEle) {
                    alarmEle = {value: 0};
                }

                if(typeof firstEle == "undefined"){
                    homeUtil.setEcharts(chartOptions, startName);
                } else if(homeUtil.oldUsedData != firstEle.value || homeUtil.oldAlarmData != alarmEle.value) {
                    homeUtil.oldUsedData = firstEle.value;
                    homeUtil.oldAlarmData = alarmEle.value;
                    homeUtil.setEcharts(chartOptions, startName);
                }
            },
            setEcharts: function (options, startName) {
                var startPart = homeUtil.data.start;
                startPart.value = 0;
                startPart.name = startName;
                startPart.selected = false;
                var arr = [startPart].concat(options.series[0].data);
                options.series[0].data = arr;
                myChart.setOption(options, true);
                addTimeout(function () {
                    //$(window).trigger('resize');
                    myChart.resize();
                }, 1000);
            },
            getUnit: function (val) {
                if (val == '1024') {
                    return 'GB';
                } else if (val == '1048576') {
                    return 'TB';
                } else {
                    return 'MB';
                }
            },
            getUnitValue: function (unit) {
                unit = unit.toUpperCase();
                if (unit == 'GB') {
                    return '1024';
                } else if (unit == 'TB') {
                    return '1048576';
                } else {
                    return '1';
                }
            },
            getDataInfo: function (value) {
                return {
                    data: /\d+(.\d+)?/.exec(value)[0],
                    unit: /[A-Z]{1,2}/.exec(value)[0]
                }
            },
            refreshStationInfo: function (vm) {
                vm.wirelessDeviceNum(service.getStatusInfo().attachedDevices.length);
                if (refreshCount % 10 == 2) {
                    service.getAttachedCableDevices({}, function (data) {
                        vm.wireDeviceNum(data.attachedDevices.length);
                    });
                }
				/* lewis add refresh */
				vm.signalImgSrc(getSignalImgSrc(service.getStatusInfo().signalImg, service.getStatusInfo().networkType, service.getStatusInfo().simStatus));
				vm.wifi_enable(getWifiStatus(service.getStatusInfo().wifiStatus));
				vm.apn_home(service.getApnSettings().wanApn);
				vm.apn_username_home(service.getApnSettings().username);
				vm.apn_password_home(service.getApnSettings().password);
				vm.apn_wan_dial_home(service.getApnSettings().wanDial);
				vm.apnv6_home(service.getApnSettings().wanApnV6);
				vm.apnv6_username_home(service.getApnSettings().usernameV6);
				vm.apnv6_password_home(service.getApnSettings().passwordV6);
				
            }
        };

	/**
	 * 获取信号量的CSS样式
	 * @method getSignalImgSrc
	 *	lewis added  return src
	 */
    function getSignalImgSrc(siganl, networkType, simStatus) {
    	networkType = networkType.toLowerCase();
    	simStatus = simStatus ? simStatus.toLowerCase() : '';
    	if(networkType == '' || networkType == 'limited_service' || networkType == 'no_service' || networkType == 'limited service' || networkType == 'no service'
            || simStatus != 'modem_init_complete'){
    		siganl = '0';
    	}
		//alert(siganl);
        return "./img_mifi/icon_signal_0" + siganl + ".png";
    }
	
	/**
	 * 获取wifi开启/关闭状态
	 * @method getWifiStatus
	 *	lewis added  return data-trans
	 */
    function getWifiStatus(wifiStatus) {
    	if(wifiStatus == true){
    		return "home_wifi_on"
    	}
		else
			return "home_wifi_off"		
    }
	
	/**
	 * 获取拨号状态
	 * @method getConnectStatus_info
	 *	lewis added  return data-trans
	 */
/*	function getConnectStatus_info(connectStatus) {
		if (connectStatus.indexOf('_connected') != -1) {
			return "home_connected";
		} else if (connectStatus.indexOf('_disconnecting') != -1) {
			return "home_disconnecting";
		} else if (connectStatus.indexOf('_connecting') != -1) {
			return "home_connecting";
		} else {
			return "home_disconnected";
		}
	}
*/	
	 /**
     * 网络类型转换
     * @method getNetworkType
     * @param {String} type "GSM", "GPRS", "EDGE", "WCDMA", "HSDPA", "HSPA", "HSPA+", "DC-HSPA+", "LTE"
     * @return {String}
     */
	function getNetworkType(type)
	{
	    if("Only_GSM" == type || "GSM" == type || "GPRS" == type ||"EDGE" ==type) {
			return "2G";
		}else if ("TD_W" == type || "WCDMA" == type || "HSDPA" == type || "HSDPA+" == type || "DC-HSPA+" == type || "Only_WCDMA"==type){
			return "3G";
		}else if ("Only_LTE" == type){
            return "4G";
        }else if ("NETWORK_auto" == type ){
			return "4G/3G/2G";
		}else{
			return "Unknown";
		}
	}
        /**
         * 初始化 ViewModel，并进行绑定
         * @method init
         */
        function init() {
            refreshCount = 0;
            homeUtil.oldUsedData = null;
            homeUtil.oldAlarmData = null;
            myChart = echarts.init($("#traffic_graphic")[0]);
            //window.onresize = myChart.resize;
            var container = $('#container')[0];
            ko.cleanNode(container);
            var vm = new HomeViewMode();
            ko.applyBindings(vm, container);
            //ko.applyBindings(new HomeViewMode(), $("#currentOpMode")[0]);
        }

        return {
            init: init
        };
    });
