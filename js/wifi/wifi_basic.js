/**
 * @module wifi basic
 * @class wifi basic
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

    function ($, ko, config, service, _) {
        var isWifi = false;

        var securityModes = _.map(config.AUTH_MODES, function (item) {
            return new Option(item.name, item.value);
        });

        function maxStationOption(max) {
            var options = [];
            for (var i = 1; i <= max; i++) {
                options.push(new Option(i, i));
            }
            return options;
        }

        /**
         * wifi basic view model
         * @class WifiBasicVM
         */
        function WifiBasicVM() {
            var self = this;
            var info = getWifiBasic();
			self.hasWifiSwitch = config.WIFI_SWITCH_SUPPORT;
			self.hasMultiSSID = config.HAS_MULTI_SSID;
			self.wifi_enable = ko.observable(info.wifi_enable);
			self.isShowSSIDInfoDiv = ko.observable(false);
			if(config.WIFI_SWITCH_SUPPORT) {
				if(info.wifi_enable == "1") {
					self.isShowSSIDInfoDiv(true);
				} else {
					self.isShowSSIDInfoDiv(false);
				}
			} else {
				self.isShowSSIDInfoDiv(true);//如果不支持软开关，整个SSID信息块显示
			}
         
            self.multi_ssid_enable = ko.observable(info.multi_ssid_enable);
            self.origin_multi_ssid_enable = info.multi_ssid_enable;

            self.maxStationNumber = ko.computed(function () {
                return config.MAX_STATION_NUMBER;
//            if (self.hasMultiSSID && self.origin_multi_ssid_enable == "1") {
//                return config.MAX_STATION_NUMBER - 1;
//            } else {
//                return config.MAX_STATION_NUMBER;
//            }
            });

            self.modes = ko.observableArray(securityModes);
            self.selectedMode = ko.observable(info.AuthMode);
            self.passPhrase = ko.observable(info.passPhrase);
            self.showPassword = ko.observable(false);
            self.ssid = ko.observable(info.SSID);
            self.broadcast = ko.observable(info.broadcast == '1' ? '1' : '0');
			self.apIsolation = ko.observable(info.apIsolation == '1' ? '1' : '0');
            self.cipher = info.cipher;
            self.selectedStation = ko.observable(info.MAX_Access_num);
            self.maxStations = ko.observableArray(maxStationOption(info.MAX_Station_num));

            self.m_modes = ko.observableArray(securityModes);
            self.m_selectedMode = ko.observable(info.m_AuthMode);
            self.m_passPhrase = ko.observable(info.m_passPhrase);
            self.m_showPassword = ko.observable(false);
            self.m_ssid = ko.observable(info.m_SSID);
            self.m_broadcast = ko.observable(info.m_broadcast == '1' ? '1' : '0');
			self.m_apIsolation = ko.observable(info.m_apIsolation == '1' ? '1' : '0');
            self.m_cipher = info.m_cipher;
            self.m_selectedStation = ko.observable(info.m_MAX_Access_num);
            self.m_maxStations = ko.observableArray(maxStationOption(info.MAX_Station_num));

            self.clear = function (option) {
                if (option == "switch") {
                    self.multi_ssid_enable(info.multi_ssid_enable);
					self.wifi_enable(info.wifi_enable);
                } else if (option == "ssid1") {
                    self.selectedMode(info.AuthMode);
                    self.passPhrase(info.passPhrase);
                    self.ssid(info.SSID);
                    self.broadcast(info.broadcast == '1' ? '1' : '0');
                    self.cipher = info.cipher;
                    self.selectedStation(info.MAX_Access_num);
                    self.apIsolation(info.apIsolation == '1' ? '1' : '0');
                } else if (option == "ssid2") {
                    self.m_selectedMode(info.m_AuthMode);
                    self.m_passPhrase(info.m_passPhrase);
                    self.m_ssid(info.m_SSID);
                    self.m_broadcast(info.m_broadcast == '1' ? '1' : '0');
                    self.m_cipher = info.m_cipher;
                    self.m_selectedStation(info.m_MAX_Access_num);
                    self.m_apIsolation(info.m_apIsolation == '1' ? '1' : '0');
                } else {
                    clearTimer();
                    clearValidateMsg();
                    init();
                }
            };

            /**
             * 检测wps是否开启，最大接入数是否超过最大值。
             *
             * @event checkSettings
             */
            self.checkSettings = function (ssid) {
                var status = getWpsInfo();
               /* if (!config.WIFI_SWITCH_SUPPORT && status.radioFlag == "0") {
                    showAlert('wps_wifi_off');
                    return true;
                }*/
				
                if (status.wpsFlag == '1') {
                    showAlert('wps_on_info');
                    return true;
                }
                if (config.HAS_MULTI_SSID && info.multi_ssid_enable == "1") {
                    if ((ssid == "ssid1" && parseInt(self.selectedStation()) + parseInt(info.m_MAX_Access_num) > info.MAX_Station_num)
                        || (ssid == "ssid2" && parseInt(self.m_selectedStation()) + parseInt(info.MAX_Access_num) > info.MAX_Station_num)) {
                        showAlert({msg:'multi_ssid_max_access_number_alert', params: info.MAX_Station_num});
                        return true;
                    }
                }

                return false;
            };
            self.saveSSID1 = function () {
                if (self.checkSettings("ssid1")) {
                    return;
                }
                showConfirm('wifi_disconnect_confirm', function(){
                    self.saveSSID1Action();
                });
            };
            /**
             * 保存SSID1的设置
             *
             * @event saveSSID1
             */
            self.saveSSID1Action = function () {

                showLoading();
                var params = {};
                params.AuthMode = self.selectedMode();
                params.passPhrase = self.passPhrase();
                params.SSID = self.ssid();
                params.broadcast = self.broadcast();
                params.station = self.selectedStation();
                params.cipher = self.selectedMode() == "WPA2PSK" ? 1: 2;
				params.NoForwarding = self.apIsolation();
                service.setWifiBasic(params, function (result) {
                    if (result.result == "success") {
                        setTimeout(function () {
                            successOverlay();
                            if (isWifi) {
                                setTimeout(function () {
                                    window.location.reload();
                                }, 1000);
                            }
                            self.clear();
                        }, isWifi ? 15000 : 0);
                    } else {
                        errorOverlay();
                    }
                });
            };

            self.saveSSID2 = function () {
                if (self.checkSettings("ssid2")) {
                    return;
                }
                showConfirm('wifi_disconnect_confirm', function(){
                    self.saveSSID2Action();
                });
            };
            /**
             * 保存SSID2的设置
             *
             * @event saveSSID2
             */
            self.saveSSID2Action = function () {
                showLoading();
                var params = {};
                params.m_AuthMode = self.m_selectedMode();
                params.m_passPhrase = self.m_passPhrase();
                params.m_SSID = self.m_ssid();
                params.m_broadcast = self.m_broadcast();
                params.m_station = self.m_selectedStation();
                params.m_cipher = self.m_selectedMode() == "WPA2PSK" ? 1: 2;
				params.m_NoForwarding = self.m_apIsolation();
                service.setWifiBasic4SSID2(params, function (result) {
                    if (result.result == "success") {
                        setTimeout(function () {
                            successOverlay();
                            if (isWifi) {
                                setTimeout(function () {
                                    window.location.reload();
                                }, 1000);
                            }
                            self.clear();
                        }, isWifi ? 15000 : 0);
                    } else {
                        errorOverlay();
                    }
                });
            };

            /**
             * 设置多SSID开关
             *
             * @event setMultiSSIDSwitch
             */
            self.setMultiSSIDSwitch = function () {
                if (self.checkSettings("switch")) {
                    return;
                }

                var setSwitch = function () {
                    showLoading();
                    var params = {};
                    params.m_ssid_enable = self.multi_ssid_enable();
					if(config.WIFI_SWITCH_SUPPORT) {
						params.wifiEnabled = self.wifi_enable();
					}					
                    service.setWifiBasicMultiSSIDSwitch(params, function (result) {
                        if (result.result == "success") {
                            setTimeout(function () {
                                successOverlay();
                                if (isWifi) {
                                    setTimeout(function () {
                                        window.location.reload();
                                    }, 1000);
                                }
								service.refreshAPStationStatus();
                                self.clear();
                            }, isWifi ? 15000 : 0);
                        } else {
                            errorOverlay();
                        }
                    });
                };

                if (self.multi_ssid_enable() == "1" && self.wifi_enable() == "1" && config.HAS_MULTI_SSID) {
                    if (config.AP_STATION_SUPPORT && self.origin_ap_station_enable == "1") {
                        showConfirm("multi_ssid_enable_confirm", function () {
                            setSwitch();
                        });
                    } else {
                        setSwitch();
                    }
                } else {
                    setSwitch();
                }
            };

            /**
             * SSID1密码显示事件
             *
             * @event showPasswordHandler
             */
            self.showPasswordHandler = function () {
                $("#passShow").parent().find(".error").hide();
                var checkbox = $("#showPassword:checked");
                if (checkbox && checkbox.length == 0) {
                    self.showPassword(true);
                } else {
                    self.showPassword(false);
                }
            };
            /**
             * SSID2密码显示事件
             *
             * @event m_showPasswordHandler
             */
            self.m_showPasswordHandler = function () {
                $("#m_passShow").parent().find(".error").hide();
                var checkbox = $("#m_showPassword:checked");
                if (checkbox && checkbox.length == 0) {
                    self.m_showPassword(true);
                } else {
                    self.m_showPassword(false);
                }
            }
        }

        /**
         * 获取wifi基本信息
         * @method getWifiBasic
         * @return {Object}
         */
        function getWifiBasic() {
            return service.getWifiBasic();
        }

        /**
         * 获取wps信息
         * @method getWpsInfo
         */
        function getWpsInfo() {
            return service.getWpsInfo();
        }

        function checkConnectedDevice(){
            service.getParams({nv: 'user_ip_addr'}, function (dataIp) {
                service.getParams({nv: 'station_list'}, function (dataList) {
                    isWifi = isWifiConnected(dataIp.user_ip_addr, dataList.station_list);
                });
            });
        }
        /**
         * 初始化wifi基本view model
         * @method init
         */
        function init() {
            var container = $('#container');
            ko.cleanNode(container[0]);
            var vm = new WifiBasicVM();
            ko.applyBindings(vm, container[0]);
            addTimeout(function(){
                checkConnectedDevice();
            }, 600);

            function checkWifiStatus() {
                var info = service.getAPStationBasic();
                if (info.ap_station_enable == "1") {
                    $('#frmMultiSSID :input').each(function () {
                        $(this).attr("disabled", true);
                    });
                } else {
                    $('#frmMultiSSID :input').each(function () {
                        $(this).attr("disabled", false);
                    });
                }
            }
			
			function checkWifiStatusAccordingToWDS() {
				var info = service.getWdsInfo();
				if(info.currentMode != "0") {
					$('#frmWifiSwitch :input').each(function () {
                        $(this).attr("disabled", true);
                    });
					$('#frmSSID1 :input').each(function () {
                        $(this).attr("disabled", true);
                    });	
					$('#frmSSID2 :input').each(function () {
                        $(this).attr("disabled", true);
                    });
				} else {
					$('#frmWifiSwitch :input').each(function () {
                        $(this).attr("disabled", false);
                    });
					$('#frmSSID1 :input').each(function () {
                        $(this).attr("disabled", false);
                    });	
					$('#frmSSID2 :input').each(function () {
                        $(this).attr("disabled", false);
                    });
				}
			}

            if(config.AP_STATION_SUPPORT) {
				checkWifiStatus();
			} else if(config.WDS_SUPPORT) {
				checkWifiStatusAccordingToWDS();
			}
			//clearTimer();
            //addInterval(checkWifiStatus, 1000);
			
			$('#frmWifiSwitch').validate({
				submitHandler:function () {
                    vm.setMultiSSIDSwitch();
                }
			});

            $('#frmMultiSSID').validate({
                submitHandler:function () {
                    vm.setMultiSSIDSwitch();
                }
            });
            $('#frmSSID1').validate({
                submitHandler:function () {
                    vm.saveSSID1();
                },
                rules:{
                    ssid:'ssid',
                    pass:'wifi_password_check',
                    passShow:'wifi_password_check'
                },
                errorPlacement:function (error, element) {
                    var id = element.attr("id");
                    if (id == "pass" || id == "passShow") {
                        error.insertAfter("#lblShowPassword");
                    } else {
                        error.insertAfter(element);
                    }
                }
            });
            $('#frmSSID2').validate({
                submitHandler:function () {
                    vm.saveSSID2();
                },
                rules:{
                    m_ssid:'ssid',
                    m_pass:'wifi_password_check',
                    m_passShow:'wifi_password_check'
                },
                errorPlacement:function (error, element) {
                    var id = element.attr("id");
                    if (id == "pass" || id == "passShow") {
                        error.insertAfter("#lblShowPassword");
                    } else if (id == "m_pass" || id == "m_passShow") {
                        error.insertAfter("#m_lblShowPassword");
                    } else {
                        error.insertAfter(element);
                    }
                }
            });
        }

        return {
            init:init
        };
    });