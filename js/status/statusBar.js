/**
 * statusBar 模块
 * @module statusBar
 * @class statusBar
 */
define([ 'knockout', 'jquery', 'underscore', 'service', 'config/config', 'config/menu', 'tooltip'], function (ko, $, _, service, config, menu, tooltip) {
    var msgPopStack = {};
    var trafficAlertPopuped = false;
    var trafficAlert100Popuped = false;
    var resetTrafficAlertPopuped = false;
    var _smsInitComplete = false;
	var _hasCheckedSmsCapacity = false;
    var _smsNewMessageInDealing = false;
    var _otaUpdateCancelFlag = null;
    var _checkTimes = 0;
    var smsListTmpl = null;
    var simMsgListTmpl = null;

    /**
     * 初始化ViewModel
     * @method init
     */
    function init() {
        if(config.PRODUCT_TYPE == 'DATACARD') {
            $('#statusBar').addClass('padding-right-90');
            $('#language').addClass('data-card-language');
        }
        window.setTimeout(function () {
            var vm = new statusViewModel();
            ko.applyBindings(vm, $('#statusBar')[0]);
            window.setInterval(function () {
                var info = getStatusInfo();
                //if(config.PRODUCT_TYPE != 'DATACARD') {
                //    var hSSID = $('#h_ssid');
                //    info.wifiStatus? hSSID.show(): hSSID.hide();
                //    hSSID.html($.i18n.prop('ssid_title') + ':' + info.ssid);
                //}

		        vm.OTAStatus(info.new_version_state);
				vm.OTADownloadStatus(info.fota_package_already_download != "yes");
				vm.isShowConnectionIcon(config.PRODUCT_TYPE != 'CPE' || (info.opms_wan_mode != "STATIC" && info.opms_wan_mode != "BRIDGE" && info.opms_wan_mode != "DHCP"));
                vm.networkType(getNetworkType(info.networkType));
                vm.signalCssClass(getSignalCssClass(info.signalImg, info.networkType, info.simStatus));
                vm.getConnectionSignalImg(getSignalImg(info.signalImg, info.networkType, info.simStatus));
                vm.isShowSignalStrength(info.simStatus == "modem_init_complete");
                var roamStatus = info.roamingStatus ? true : false;
                vm.networkOperator(getNetWorkProvider(info.spn_b1_flag,info.spn_name_data,info.spn_b2_flag,info.networkOperator,roamStatus));
                vm.roamingStatus(info.roamingStatus ? "R" : "");
                vm.wifiStatusImg(getWifiStatusImg(info.wifiStatus, info.attachedDevices.length));
                vm.wifiStatusCssClass(getWifiStatusCssClass(info.wifiStatus, info.attachedDevices.length));
                vm.simStatus(convertSimStatus(info.simStatus));
                vm.isShowSimStatus(info.simStatus != "modem_init_complete");
                vm.batteryPers(convertBatteryPers(info.batteryPers, info.batteryStatus));
                vm.batteryLevel(info.batteryLevel + '%');
                vm.pinStatus(info.pinStatus);
                vm.batteryStatus(info.batteryStatus);
                vm.attachedDevices(info.attachedDevices);
                vm.showAttachedDevices(info.wifiStatus);
                vm.isLoggedIn(info.isLoggedIn);
                if(config.HAS_SMS && _smsInitComplete && !simStatusInvalid(info.simStatus)){
					if(!_hasCheckedSmsCapacity && info.isLoggedIn){
						checkSmsCapacity(info.smsUnreadCount);
					} else {
						vm.smsUnreadCount(info.smsUnreadCount);
					}
                }
                getConnectionCssClass(vm, info.connectStatus, info.data_counter, info.connectWifiSSID, info.connectWifiStatus);
                vm.getConnectionStatusImg(getConnectionImg(info.connectStatus));
                refreshConnectStatus(vm, info.connectStatus,info.connectWifiSSID,info.connectWifiStatus);
                checkTrafficLimitAlert(vm, info);
                updateStatusBarTrans({simStatus: info.simStatus, wifiStatus: info.wifiStatus, deviceSize: info.attachedDevices.length, networkType: info.networkType});
                var $langLogoBar = $("#langLogoBar");
                if(info.isLoggedIn){
                	if(!$langLogoBar.hasClass("langborderBg")){
                        $langLogoBar.addClass("langborderBg");
                	}
                	$("#statusBar:hidden").show();
                } else {
                	if($langLogoBar.hasClass("langborderBg")){
                        $langLogoBar.removeClass("langborderBg");
                	}
                	$("#statusBar:visible").hide();
                }
            }, 500);

            if(config.HAS_SMS){
                window.setInterval(function(){
                    if(vm.isLoggedIn()){
                        checkSmsCapacity();
                    }
                }, 10000);

                checkSmsModelReady();
            }

            window.setInterval(function() {
                if (vm.isLoggedIn() == true && !($("#progress").is(":visible"))){
                    var data = getStatusInfo();
                    if(data.current_upgrade_state == 'connecting_server' || data.current_upgrade_state == 'upgrading'
                        || data.current_upgrade_state == 'accept' || data.current_upgrade_state == 'connect_server_success' ){
                        if(null == _otaUpdateCancelFlag){
                            if(!data.is_mandatory){
                                $.modal.close();
                            }
                            showOtaStatus();
                        }else if(false == _otaUpdateCancelFlag){
                            _otaUpdateCancelFlag = null;
                        }
                    }
                }
            }, 1000);

            var checkOtaResult = function () {
                if (config.UPGRADE_TYPE == "FOTA" || config.UPGRADE_TYPE == "OTA") {
                    var info = service.getStatusInfo();
                    if (info.isLoggedIn) {
                        service.getUpgradeResult({}, function (data) {
                            if (data.upgrade_result == "success") {
                                showOtaResult(true);
                            } else if (data.upgrade_result == "fail") {
                                showOtaResult(false);
                            } else {
                                window.setTimeout(checkOtaResult, 1000);
                            }
                        }, function () {
                            window.setTimeout(checkOtaResult, 1000);
                        });
                    } else {
                        window.setTimeout(checkOtaResult, 1000);
                    }
                }
            };
            checkOtaResult();


            if (config.UPGRADE_TYPE == "TWO_PORTION" || config.UPGRADE_TYPE == "FOTA") {
                window.setInterval(function () {
                    var info = getStatusInfo();
                    if (info.isLoggedIn) {
                    //if (checkConnectedStatus(info.connectStatus) && info.isLoggedIn) {只有在联网中才给予新版本提示  
                        if (!config.ALREADY_NOTICE) {
                            //service.getUpdateInfoWarning({}, function (notice) {
                               if (vm.OTAStatus() && vm.OTADownloadStatus()) {
                               //if (vm.notice.upgrade_notice_flag == 2) {
                                    config.ALREADY_NOTICE = true;
                                    //showAlert("update_notice");
                                    showOTAAlert();
                                }
                           // });
                        }
                    }
                }, 1000);
            }

            var OTAInterval = window.setInterval(function () {
                if (!config.ALREADY_OTA_NOTICE && config.HAS_OTA_NEW_VERSION) {
                    if (_checkTimes > 3) {
                        window.clearInterval(OTAInterval);
                    }
                    _checkTimes++;
                    if (checkConnectedStatus(vm.connectStatus())) {
                        window.clearInterval(OTAInterval);
                        config.ALREADY_OTA_NOTICE = true;
                        var data = getStatusInfo();
                        if (!data.is_mandatory) {
                            showOTAConfirm(data);
                        }
                    }
                }
            }, 1000);

			function checkSmsCapacity(unreadCount){
				service.getSmsCapability({}, function(info){
					var showSmsConfirm = false;
					if(info.nvTotal != 0 && info.nvUsed >= info.nvTotal){
						$("#sms_unread_count").attr("tipTitle", "sms_capacity_is_full");
						showSmsConfirm = true;
					} else if(info.nvTotal != 0 && info.nvUsed + 5 >= info.nvTotal) {
						$("#sms_unread_count").attr("tipTitle", "sms_capacity_will_full");
						showSmsConfirm = true;
					} else {
						$("#sms_unread_count").attr("tipTitle", "sms_unread_count");
					}
					vm.showSmsDeleteConfirm(showSmsConfirm);
					if(typeof unreadCount != "undefined"){
						vm.smsUnreadCount(unreadCount);
					}
					_hasCheckedSmsCapacity = true;
				});
			}
        }, 1200);
        
        tooltip.init();
        
        /**
         * 检查短息模块初始化状态
         * @method checkSmsModelReady
         */
        function checkSmsModelReady(){
            var info = getStatusInfo();
            if(info.isLoggedIn){
                service.getSMSReady({}, function (data) {
                    if (data.sms_cmd_status_result == "1") {
                        window.setTimeout(function(){checkSmsModelReady();}, 1000);
                    } else {
                        _smsInitComplete = true;
                    }
                });
            } else {
                window.setTimeout(function(){checkSmsModelReady();}, 1000);
            }
        }
        
        /**
         * 检查浏览提醒状态
         * @method checkTrafficLimitAlert
         */
        checkTrafficLimitAlert = function(vm, info){
	    if(window.location.hash == '#login'){
                return false;
            }
            var APStationEnabled = config.AP_STATION_SUPPORT ? service.getStatusInfo().ap_station_enable : 'undefined';
            //先确定Ap Station使能状态再确定用什么方式来提醒
            if (config.AP_STATION_SUPPORT && (typeof APStationEnabled == "undefined" || APStationEnabled === '')) {
                service.refreshAPStationStatus({}, $.noop());
                return false;
            }
            APStationEnabled = APStationEnabled == 1;
            var inShow = $("#confirm-container:visible").length > 0;
            var notPPP = (config.PRODUCT_TYPE == 'CPE' && info.opms_wan_mode != "PPP") ? true : false;
            if (!info.isLoggedIn || inShow || (trafficAlertPopuped && trafficAlert100Popuped) || !info.limitVolumeEnable || (!APStationEnabled && !checkConnectedStatus(info.connectStatus)) || notPPP) {
                return false;
            }
            if(resetTrafficAlertPopuped){
                window.setTimeout(function () {
                    resetTrafficAlertPopuped = false;
                }, 2000);
                return false;
            }
            var trafficResult = getTrafficResult(info);
        	if(trafficResult.showConfirm){
                var confirmMsg = null;
                if(trafficResult.usedPercent > 100 && !trafficAlert100Popuped){
                    trafficAlertPopuped = trafficAlert100Popuped = true;
                    confirmMsg = {msg: APStationEnabled ? 'traffic_beyond_msg' : 'traffic_beyond_disconnect_msg'};
                } else if (!trafficAlertPopuped) {
                    trafficAlertPopuped = true;
                    trafficAlert100Popuped = false;
                    confirmMsg = {msg: APStationEnabled ? 'traffic_limit_msg' : 'traffic_limit_disconnect_msg',
                        params: [trafficResult.limitPercent]};
                }
                if (confirmMsg != null) {
                    if (APStationEnabled) {
                        showAlert(confirmMsg);
                    } else {
                        showConfirm(confirmMsg, function () {
                            showLoading("disconnecting");
                            service.disconnect({}, function (data) {
                                if (data.result) {
                                    successOverlay();
                                } else {
                                    errorOverlay();
                                }
                            });
                        });
                    }
                }
            }
            return true;
        };
        
        /**
         * 更新状态中的tooltip
         * @method updateStatusBarTrans
         * @param {String} status
         */
        function updateStatusBarTrans(status){
    		$("#statusItemSimStatus").attr("tipTitle", "sim_status_" + status.simStatus);
    		if (status.wifiStatus) {
				if (status.deviceSize == 0) {
					$("#wifi_status").attr("tipTitle","wifi_status_on");
				} else {
					$("#wifi_status").attr("tipTitle","wifi_status" + status.deviceSize);
				}
			} else {
				$("#wifi_status").attr("tipTitle","wifi_status_off");
			}
        }


        /**
    	 * 刷新联网状态
    	 * 
    	 * @method refreshConnectStatus
    	 */
        function refreshConnectStatus(vm, status, wifiSSID, wifiStatus) {
            /*
    		 * if (vm.connectStatus() == status) { return; }
    		 */
            vm.connectStatus(status);
            if (status == "ppp_connecting") {
                vm.connectStatusTrans("connecting");
                vm.connectStatusText($.i18n.prop("connecting"));
            } else if (checkConnectedStatus(status)) {
                vm.connectStatusTrans("connected");
                vm.connectStatusText($.i18n.prop("connected"));
            } else if (status == "ppp_disconnecting") {
                vm.connectStatusTrans("disconnecting");
                vm.connectStatusText($.i18n.prop("disconnecting"));
            } else if(wifiSSID){
                if(wifiStatus =="connect"){
                    vm.connectStatus("wifi_connect");
                    vm.connectStatusTrans("connected");
                    vm.connectStatusText($.i18n.prop("connected"));
                }else if(wifiStatus =="connecting"){
                    vm.connectStatus("wifi_connecting");
                    vm.connectStatusTrans("connecting");
                    vm.connectStatusText($.i18n.prop("connecting"));
                }else{
                    vm.connectStatus("ppp_disconnected");
                    vm.connectStatusTrans("disconnected");
                    vm.connectStatusText($.i18n.prop("disconnected"));
                }
            }else{
                vm.connectStatusTrans("disconnected");
                vm.connectStatusText($.i18n.prop("disconnected"));
            }
        }
        
        /**
    	 * 获取当前网络状态
    	 * 
    	 * @method getNetworkType
    	 */
        getNetworkType = function(networkType) {
			var networkTypeTmp = networkType.toLowerCase();
			if (networkTypeTmp == '' || networkTypeTmp == 'limited service') {
				networkTypeTmp = 'limited_service';
			}
			if(networkTypeTmp == 'no service') {
				networkTypeTmp = 'no_service';
			}
			if (networkTypeTmp == 'limited_service' || networkTypeTmp == 'no_service') {
				$("#networkType", "#statusBar").attr("data-trans", "network_type_" + networkTypeTmp);
				return $.i18n.prop("network_type_" + networkTypeTmp);
			} else {
                $("#networkType", "#statusBar").removeAttr("data-trans");
                return networkType;
            }
		};
        
		if(config.HAS_SMS && menu.checkIsMenuExist("sms/smslist")){
            window.setInterval(function () {
                var info = getStatusInfo();
        		if(window.location.hash == "#login" || simStatusInvalid(info.simStatus)){
        			return;
        		}
        		for(key in msgPopStack){
        			var val = msgPopStack[key];
        			if($.now() - val > 5000){
        				delete(msgPopStack["m" + val]);
        				var node = $(".bubbleItem#m" + val, "#buttom-bubble");
        				node.fadeOut(1000, function(){
        					$(this).remove();
        				});
        			}
        		}
        		if(info.isLoggedIn){
        			if(info.newSmsReceived && !_smsNewMessageInDealing){
                        _smsNewMessageInDealing = true;
        				service.resetNewSmsReceivedVar();
        				checkNewMessages();
        			}
        			if(info.smsReportReceived){
        				service.resetSmsReportReceivedVar();
        				responseSmsReport();
        			}
        		}
			}, 1000);

            if(config.SMS_DATABASE_SORT_SUPPORT){
                window.setInterval(function(){
                    if(menu.checkIsMenuExist("sms/smslist")){
                        var info = getStatusInfo();
                        if(info.isLoggedIn && _smsInitComplete && !_smsNewMessageInDealing && !simStatusInvalid(info.simStatus)){
                            _smsNewMessageInDealing = true;
                            checkNewMessages();
                        }
                    }
                }, 20001);
            }
		}

    	function checkNewMessages(){
            var smsCount = 5;
            var tags = 1;
            if(!config.dbMsgs || config.dbMsgs.length == 0){
                smsCount = 500;
                tags = 10;
            }
            service.getSMSMessages({
                page : 0,
                smsCount : smsCount,
                nMessageStoreType : 0,
                tags : tags,
                orderBy : "order by id desc"
            }, function(data){
                if(data && data.messages){
                    filterNewMsg(data.messages, 0);
                }
                _smsNewMessageInDealing = false;
            });	
            service.getSMSMessages({
                page : 0,
                smsCount : smsCount,
                nMessageStoreType : 1,
                tags : tags,
                orderBy : "order by id desc"
            }, function(data){
                if(data && data.messages){
                    filterNewMsg(data.messages, 1);
                }
                _smsNewMessageInDealing = false;
            });
    	}

        if(config.HAS_SMS){
            $(".bubbleItem", "#buttom-bubble").live("mouseover", function(){
                var $this = $(this);
                delete(msgPopStack[$this.attr("id")]);
            }).live("mouseout", function(){
                    var $this = $(this);
                    var now = $.now();
                    msgPopStack["m" + now] = now;
                    $this.attr("id", "m" + now);
                    $(".bubbleItem h3 a.bubbleCloseBtn", "#buttom-bubble").data("targetid", "m" + now);
                });

            $(".bubbleItem h3 a.bubbleCloseBtn", "#buttom-bubble").die().live("click", function(){
                var id = $(this).data("targetid");
                delete(msgPopStack[id]);
                var node = $(".bubbleItem#" + id, "#buttom-bubble");
                node.fadeOut(1000, function(){
                    $(this).remove();
                });
            });
        }
    }

    /**
     * 获取网络、SIM、WIFI等状态
     * @method getStatusInfo
     */
    var getStatusInfo = function () {
        return service.getStatusInfo();
    };

	
    /**
     * statusViewModel
     * @class statusViewModel
     */
    function statusViewModel() {
        var self = this;
        var info = getStatusInfo();
        //if(config.PRODUCT_TYPE != 'DATACARD') {
        //    var hSSID = $('#h_ssid');
        //    info.wifiStatus ? hSSID.show() : hSSID.hide();
        //    hSSID.html($.i18n.prop('ssid_title') + ':' + info.ssid);
        //}

        self.OTAStatus = ko.observable(info.new_version_state);
        self.OTADownloadStatus = ko.observable(info.fota_package_already_download != "yes");
        self.isShowConnectionIcon = ko.observable(false);
        self.hasWifi = ko.observable(config.HAS_WIFI);
        self.hasBattery = ko.observable(config.HAS_BATTERY);
        self.networkType = ko.observable(getNetworkType(info.networkType));
        self.signalCssClass = ko.observable(getSignalCssClass(info.signalImg, info.networkType, info.simStatus));
        /* ================ */
        self.getConnectionSignalImg = ko.observable(getSignalImg(info.signalImg, info.networkType, info.simStatus));
        self.isShowSignalStrength = ko.observable(info.simStatus == "modem_init_complete");
        var roamStatus = info.roamingStatus ? true : false;
        self.networkOperator = ko.observable(getNetWorkProvider(info.spn_b1_flag,info.spn_name_data,info.spn_b2_flag,info.networkOperator,roamStatus));
        self.roamingStatus = ko.observable(info.roamingStatus ? "R" : "");
        self.wifiStatusImg = ko.observable(getWifiStatusImg(info.wifiStatus, info.attachedDevices.length));
        self.wifiStatusCssClass = ko.observable(getWifiStatusCssClass(info.wifiStatus, info.attachedDevices.length));
        self.simStatus = ko.observable(convertSimStatus(info.simStatus));
        self.isShowSimStatus = ko.observable(false);
        self.pinStatus = ko.observable(info.pinStatus);
        self.pinStatusText = ko.observable();
        self.batteryStatus = ko.observable(info.batteryStatus);
        self.batteryPers = ko.observable(convertBatteryPers(info.batteryPers, info.batteryStatus));
        self.batteryLevel = ko.observable(info.batteryLevel + '%');
        self.connectStatus = ko.observable(info.connectStatus);
        self.connectStatusText = ko.observable();
        self.connectStatusTrans = ko.observable();
        self.attachedDevices = ko.observable(info.attachedDevices);
        self.showAttachedDevices = ko.observable(info.wifiStatus);
        self.isLoggedIn = ko.observable(info.isLoggedIn);
        self.showSmsDeleteConfirm = ko.observable(false);
        self.smsUnreadCount = ko.observable(0);
        self.connectionCssClass = ko.observable("");
        getConnectionCssClass(self, info.connectStatus, info.data_counter, info.connectWifiSSID, info.connectWifiStatus);
        self.getConnectionStatusImg = ko.observable(getConnectionImg(info.connectStatus));
        var $langLogoBar = $("#langLogoBar");
        if(info.isLoggedIn){
        	if(!$langLogoBar.hasClass("langborderBg")){
                $langLogoBar.addClass("langborderBg");
        	}
        	$("#statusBar:hidden").show();
        } else {
        	if($langLogoBar.hasClass("langborderBg")){
                $langLogoBar.removeClass("langborderBg");
        	}
        	$("#statusBar:visible").hide();
        }
        /**
         * 联网事件处理
         * @event connect
         */
        self.connect = function () {
            showLoading("connecting");
            service.connect({}, function (data) {
                if (data.result) {
                    refreshConnectStatus(self, data.status);
                }
                successOverlay();
            }, function (data) {
                errorOverlay();
            });
        };
        /**
         * 断网事件处理
         * @event disconnect
         */
        self.disconnect = function () {
            showLoading("disconnecting");
            service.disconnect({}, function (data) {
                if (data.result) {
                    refreshConnectStatus(self, data.status);
                }
                successOverlay();
            }, function (data) {
                errorOverlay();
            });
        };
    }

    function getNetWorkProvider(spnB1Flag, spnNameData, spnB2Flag, networkProvider, roamStatus) {
        if (spnNameData == "") {
            return networkProvider;
        } else {
            spnNameData = decodeMessage(spnNameData);
            if (spnB1Flag == "1" && spnB2Flag == "1") {
                if (roamStatus) {//漫游
                    return networkProvider;
                } else {//不漫游
                    return spnNameData == networkProvider ? networkProvider : (spnNameData + '  ' + networkProvider);
                }
            } else if (spnB1Flag == "1") {
                return spnNameData == networkProvider ? networkProvider : (spnNameData + '  ' + networkProvider);
            } else if (spnB2Flag == "1") {
                if (roamStatus) {//漫游
                    return networkProvider;
                } else {//不漫游
                    return spnNameData;
                }
            } else if (spnB1Flag == "0" && spnB2Flag == "0") {
                if (roamStatus) {//漫游
                    return spnNameData == networkProvider ? networkProvider : (spnNameData + '  ' + networkProvider);
                } else {//不漫游
                    return spnNameData;
                }
            }
            return "";
        }
    }
    var dbMsgIds = [];
    /**
     * 过滤最新的5条短消息，将未添加到短信列表中的弹出提示
     * @method filterNewMsg
     * @param {Array} msgs
     */
    function filterNewMsg(msgs, type){
    	if(!config.dbMsgs){
    		config.dbMsgs = [];
    	}
    	if(dbMsgIds.length == 0){
    		$.each(config.dbMsgs, function(i, e){
    			dbMsgIds.push(e.id);
    		});
    	}
    	$.each(msgs, function(j, e){
    		if($.inArray(e.id, dbMsgIds) == -1){//增加新短信
    			dbMsgIds.push(e.id);
    			config.dbMsgs.push(e);
    			if(e.tag == '1'){
    				addNewMsg(e, false, type);
    			}
    		}else{
    			for(var i = 0; i < config.dbMsgs.length; i++){//更新级联短信
    				if(config.dbMsgs[i].id == e.id && config.dbMsgs[i].content != e.content && e.tag == '1'){
    					config.dbMsgs[i].content = e.content;
    					addNewMsg(e, true, type);
    					break;
    				}
    			}
    		}
    	});
    }
    
    var isFirstLoadNewMsg = true;
    var newMessagePopTmpl = null;
    /**
     * 添加新短消息提示，并更新相关内容
     * @method addNewMsg
     * @param {Object} msg
     */
    function addNewMsg(msg, isUpdate, type){
    	config.smsMaxId = msg.id;
    	var now = $.now();
    	msgPopStack["m" + now] = now;
    	var name = msg.number;
    	if(isFirstLoadNewMsg && config.phonebook && config.phonebook.length == 0){
    		isFirstLoadNewMsg = false;
    		if(config.HAS_PHONEBOOK){
				getPhoneBooks();
			}else{
				config.phonebook = [];
			}
    	}
    	for(i in config.phonebook){
    		if(getLastNumber(config.phonebook[i].pbm_number, config.SMS_MATCH_LENGTH) == getLastNumber(msg.number, config.SMS_MATCH_LENGTH)){
    			name = config.phonebook[i].pbm_name;
    			break;
    		}
    	}
		var newMsg = {
			mark : "m" + now,
			name: name,
			title: $.i18n.prop("sms"),
			titleTrans: "sms",
			tag: msg.tag,
			content : msg.content,
			datetime : msg.time
		};
		if(newMessagePopTmpl == null){
			newMessagePopTmpl = $.template("newMessagePopTmpl", $("#newMessagePopTmpl"));
		}
        $(".bubbleItem:not(.report)", "#buttom-bubble").remove();
        $.tmpl("newMessagePopTmpl", newMsg).appendTo("#buttom-bubble");
		if((window.location.hash == "#sms" || window.location.hash == "#smslist") && type == "1"){
            //dealChosenNumber(newMsg.name, msg.number);
			var inChating = config.currentChatObject && config.currentChatObject == getLastNumber(msg.number, config.SMS_MATCH_LENGTH);
			var itemId = getLastNumber(msg.number, config.SMS_MATCH_LENGTH);
			var item = $("#smslist-item-" + itemId);
			if(item && item.length > 0){
                // 已存在内容，更新内容调整顺序
				for(var i = 0; config.listMsgs && i < config.listMsgs.length; i++){
					if(getLastNumber(config.listMsgs[i].number, config.SMS_MATCH_LENGTH) == getLastNumber(msg.number, config.SMS_MATCH_LENGTH)){
						config.listMsgs[i].id = msg.id;
						config.listMsgs[i].latestId = msg.id;
						config.listMsgs[i].latestSms = msg.content;
						config.listMsgs[i].latestTime = msg.time;
						if(!isUpdate){
							config.listMsgs[i].newCount++;
							config.listMsgs[i].totalCount++;
						}
						break;
					}
				}
				item.find(".smslist-item-checkbox p.checkbox").attr("id", msg.id);
				item.find(".smslist-item-checkbox input:checkbox").val(msg.id).attr("id", "checkbox" + msg.id);
				if(!isUpdate){
					var count = item.find(".smslist-item-total-count").text();
					count = Number(count.substring(1, count.length - 1));
					item.find(".smslist-item-total-count").text("(" + (count + 1) + ")");
					if(!config.currentChatObject || config.currentChatObject != getLastNumber(msg.number, config.SMS_MATCH_LENGTH)){
						var newNum = item.find(".smslist-item-new-count").removeClass("hide");
						if(newNum && newNum.text().length > 0){
							newNum.text(Number(newNum.text()) + 1);
						}else{
							newNum.text(1);
						}
					}
				}
				var msgContent = item.find(".smslist-item-msg span").text(msg.content);
                msgContent.closest('td').prop('title', msg.content);
				if (config.currentChatObject && config.currentChatObject == getLastNumber(msg.number, config.SMS_MATCH_LENGTH)) {
					msgContent.closest('tr').removeClass("font-weight-bold");
				} else {
					msgContent.closest('tr').addClass("font-weight-bold");
				}
				item.find(".smslist-item-repeat span").die().click(function() {
					forwardClickHandler(msg.id);
				});
				item.find("span.clock-time").text(msg.time);
				var tmpItem = item;
				item.hide().remove();
				$("#smslist-table").prepend(tmpItem.show());
			} else {
                // 如果短信列表中不存在相应的联系人短息，应在短信列表中新增数据
				var theName = "";
				if(config.phonebook && config.phonebook.length > 0) {
					for(i in config.phonebook){
						if(getLastNumber(config.phonebook[i].pbm_number, config.SMS_MATCH_LENGTH) == getLastNumber(msg.number, config.SMS_MATCH_LENGTH)){
							theName = config.phonebook[i].pbm_name;
							break;
						}
					}
				}
				var theNewMsg = {
					id : msg.id,
					name : theName,
					number : msg.number,
					latestId : msg.id,
					totalCount : 1,
					newCount : inChating ? 0 : 1,
					latestSms : msg.content,
					latestTime : msg.time,
					checked : false,
					hasDraft : false,
					itemId : getLastNumber(msg.number, config.SMS_MATCH_LENGTH)
				};
				if(smsListTmpl == null){
					smsListTmpl = $.template("smsTableTmpl", $("#smsTableTmpl"));
				}
				$.tmpl("smsTableTmpl", {data: [theNewMsg]}).prependTo("#smslist-table");
            }
            if(config.HAS_PHONEBOOK){
                $(".sms-add-contact-icon").removeClass("hide");
            }else{
                $(".sms-add-contact-icon").addClass("hide");
            }
			if(inChating){
				var talkItem = $("#talk-item-" + msg.id, "#chatlist");
				if (talkItem && talkItem.length > 0) {// 更新级联短信内容
					$(".J_content pre", talkItem).html(dealContent(msg.content));
					$(".time .smslist-item-time", talkItem).text(msg.time);
					$(".smslist-item-repeat", talkItem).die().click(
							function() {
								forwardClickHandler(msg.id);
							});
					$(".smslist-item-delete", talkItem).die().click(
							function() {
								deleteSingleItemClickHandler(msg.id);
							});
				} else {// 增加新的回复内容
					$("#smsOtherTmpl").tmpl(msg).appendTo("#chatlist");
					$(".clear-container", "#chatpanel").animate({
						scrollTop : $("#chatlist").height()
					});
				}
                if (!config.SMS_SET_READ_WHEN_COMPLETE) {
                    service.setSmsRead({ids: [msg.id]}, $.noop);
                } else if (config.SMS_SET_READ_WHEN_COMPLETE && msg.receivedAll) {
                    service.setSmsRead({ids: [msg.id]}, $.noop);
                }
			}
            enableCheckbox($("#smslist-checkAll"));
		}
		if(window.location.hash == "#sim_messages" && type == "0"){
			// 如果短信列表中不存在相应的联系人短息，应在短信列表中新增数据
				var theName = "";
				if(config.phonebook && config.phonebook.length > 0) {
					for(i in config.phonebook){
						if(getLastNumber(config.phonebook[i].pbm_number, config.SMS_MATCH_LENGTH) == getLastNumber(msg.number, config.SMS_MATCH_LENGTH)){
							theName = config.phonebook[i].pbm_name;
							break;
						}
					}
				}
				var theNewMsg = {
					id : msg.id,
					name : theName,
					number : msg.number,
					content : msg.content,
					time : msg.time,
					tag: msg.tag,
					checked : false,
					itemId : getLastNumber(msg.number, config.SMS_MATCH_LENGTH)
				};
				if(isUpdate){
					var item = $(".simMsgList-item-class-" + theNewMsg.id);
				    item.hide().remove();				
				}
				if(simMsgListTmpl == null){
					simMsgListTmpl = $.template("simMsgListTmpl", $("#simMsgListTmpl"));
				}
				$.tmpl("simMsgListTmpl", {data: [theNewMsg]}).prependTo("#simMsgList_container");
		}
	}

    function dealChosenNumber(name, num) {
        setTimeout(function () {
            var chosen = $("#chosenUserSelect");
            var options = $("option", chosen);
            for (var i = 0; i < options.length; i++) {
                if (getLastNumber(num, config.SMS_MATCH_LENGTH) == options[i].value) {
                    options[i].value = num;
                    options[i].text = name + '/' + num;
                    break;
                }
            }
            chosen.trigger("liszt:updated");
        }, 0);
    }

    /**
     * 处理短信发送报告
     * @method responseSmsReport
     */
    function responseSmsReport(){
    	if(isFirstLoadNewMsg && config.phonebook && config.phonebook.length == 0){
    		isFirstLoadNewMsg = false;
    		if(config.HAS_PHONEBOOK){
				getPhoneBooks();
			}else{
				config.phonebook = [];
			}
    	}
    	service.getSMSDeliveryReport({
    		page: 0,
    		smsCount: 10
    	}, function(data){
    		var messages = data.messages;
    		var nums = [];
    		$.each(messages, function(i, msg){
    			if($.inArray(msg.number, nums) == -1){
    				nums.push(msg.number);
                    window.setTimeout(function(){
    					var now = $.now();
    					msgPopStack["m" + now] = now;
    					msg.name = msg.number;
    					for(i in config.phonebook){
    						if(getLastNumber(config.phonebook[i].pbm_number, config.SMS_MATCH_LENGTH) == getLastNumber(msg.number, config.SMS_MATCH_LENGTH)){
    							msg.name = config.phonebook[i].pbm_name;
    							break;
    						}
    					}
    					var msgContent = $.i18n.prop("sms_delivery_report_" + msg.content);
    					var newMsg = {
    							mark : "m" + now,
    							name: msg.name,
    							title: $.i18n.prop("sms_report"),
    							titleTrans: "sms_report",
    							content : msgContent,
    							datetime : msg.time,
    							report : 'report'
    					};
    					if(newMessagePopTmpl == null){
    						newMessagePopTmpl = $.template("newMessagePopTmpl", $("#newMessagePopTmpl"));
    					}
                        $(".report", "#buttom-bubble").remove();
    					$.tmpl("newMessagePopTmpl", newMsg).appendTo("#buttom-bubble");
    				}, 100);
    			}
    		});
    	}, function(){
    		//No Deal
    	});
    }

	/**
	 * 获取电话本信息
	 * @method getPhoneBooks
	 */
	function getPhoneBooks() {
		var books = service.getPhoneBooks({
            page : 0,
            data_per_page : 2000,
            orderBy : "id",
            isAsc : false
		});
		dealPhoneBooksResult(books);
	}

	/**
	 * 双异步获取设备侧和sim卡测得短信息，并将其合并
	 * @method dealPhoneBooksResult
	 * @param {Array} books 电话本
	 */
	function dealPhoneBooksResult(books){
		if($.isArray(books.pbm_data) && books.pbm_data.length > 0){
			config.phonebook = books.pbm_data;
		}
	}
	
	/**
	 * 获取信号量的CSS样式
	 * @method getSignalCssClass
	 */
    function getSignalCssClass(siganl, networkType, simStatus) {
    	networkType = networkType.toLowerCase();
    	simStatus = simStatus ? simStatus.toLowerCase() : '';
    	if(networkType == '' || networkType == 'limited_service' || networkType == 'no_service' || networkType == 'limited service' || networkType == 'no service'
            || simStatus != 'modem_init_complete'){
    		siganl = '_none';
    	}
        return "signal signal" + siganl;
    }
    
    /**
	 * 获取信号量的图片
	 * @method getSignalImg
	 */
    function getSignalImg(siganl, networkType, simStatus) {
    	networkType = networkType.toLowerCase();
    	simStatus = simStatus ? simStatus.toLowerCase() : '';
    	if(networkType == '' || networkType == 'limited_service' || networkType == 'no_service' || networkType == 'limited service' || networkType == 'no service'
            || simStatus != 'modem_init_complete'){
    		siganl = '_none';
    	}
        if ( siganl <= 4)
        	return "./img_mifi/signal_" + siganl + ".png";
        else
        return "./img_mifi/signal_5.gif";
    }
    

    function simStatusInvalid(simStatus){
        return simStatus == 'modem_sim_undetected' || simStatus == 'modem_undetected' || simStatus == 'modem_sim_destroy'
            || simStatus == 'modem_waitpin' || simStatus == 'modem_waitpuk' || simStatus == 'modem_imsi_waitnck';
    }
    
    /**
	 * 获取联网状态的CSS样式
	 * @method getConnectionCssClass
	 */
    function getConnectionCssClass(vm, status, data_counter, wifiSSID, wifiStatus) {
        var connectionStatus = "icon_connection ";
        if (status == "ppp_disconnected") {
            if (wifiSSID && wifiStatus == "connect") {
                service.getHotspotList({}, function (data) {
                    var cssName = "icon_connection ";
                    var css = "connecting ";
                    for (var i = 0, len = data.hotspotList.length; i < len; i++) {
                        if (data.hotspotList[i].connectStatus == "1") {
                            css = "wifi_connected";
                            break;
                        }
                    }
                    cssName += css;
                    vm.connectionCssClass(cssName);
                });
                return;
            } else if (wifiSSID && wifiStatus == "connecting") {
                connectionStatus += "connecting";
            } else {
                connectionStatus += "disconnect";
            }
        } else if (status == "ppp_connecting" || status == "wifi_connecting") {
            connectionStatus += "connecting";
        } else if(checkConnectedStatus(status)) {//CPE ppp_status为none ready等值
            if (data_counter.uploadRate != '0' && data_counter.downloadRate != '0') {
                connectionStatus += "connectionBoth";
            } else if (data_counter.uploadRate != '0' && data_counter.downloadRate == '0') {
                connectionStatus += "connectionUp";
            } else if (data_counter.uploadRate == '0' && data_counter.downloadRate != '0') {
                connectionStatus += "connectionDown";
            } else {
                connectionStatus += "connectionNone";
            }
        } else {
			connectionStatus += "disconnect";
		}
        vm.connectionCssClass(connectionStatus);
    }
    
    /**
	 * 获取联网状态的图片
	 * @method getConnectionImg
	 */
    function getConnectionImg(status) {
        var connectionStatus = "icon_connection ";
        if (status == "ppp_disconnected") {
        	return "./img_mifi/wan_902.png";
        } else if (status == "ppp_connecting" || status == "wifi_connecting") {
            return "./img_mifi/wan_902.png";
        } else if(checkConnectedStatus(status)) {//CPE ppp_status为none ready等值
            return "./img_mifi/wan_901.png";
        } else {
			return "./img_mifi/wan_902.png";
		}
    }
    
    /**
     * 根据wifi状态获取wifi的图片资源
     * @method getWifiStatusImg
     */
    /*
    function getWifiStatusImg(status, deviceSize) {
		if (status) {
			if (deviceSize == 0) {
				return "./img/wifi0.png";
			} else {
				return "./img/wifi" + deviceSize + ".png";
			}
		} else {
			return "./img/wifi_off.png";
		}
	}*/
	 function getWifiStatusImg(status, deviceSize) {
		if (status) {
			return "./img_mifi/wifi_1.png";			
		} else {
			return "./img_mifi/wifi_0.png";
		}
	}
    function getWifiStatusCssClass(status, deviceSize) {
        if (status) {
            if (deviceSize == 0) {
                return "wifi_status0";
            } else {
                return "wifi_status" + deviceSize;
            }
        } else {
            return "wifi_status_off";
        }
    }

    /**
     * 将SIM卡状态转化为响应的文字描述
     * @method convertSimStatus
     * @return {String}
     */
    function convertSimStatus(status) {
        //modem_sim_undetected, modem_imsi_waitnck, modem_sim_destroy, modem_init_complete, modem_waitpin, modem_waitpuk
        var result;
        switch (status) {
            case "modem_init_complete":
            	result = "./img_mifi/sim_disable.png";
                //result = "./img/sim_detected.png";//$.i18n.prop("sim_status_ready");
                break;
            case "modem_waitpin":
            	result = "./img_mifi/sim_disable.png";
                //result = "./img/sim_undetected.png";//$.i18n.prop("sim_status_waitpin");
                break;
            case "modem_waitpuk":
           		result = "./img_mifi/sim_disable.png"; 
                //result = "./img/sim_undetected.png";//$.i18n.prop("sim_status_waitpuk");
                break;
            case "modem_sim_undetected":
            	result = "./img_mifi/sim_disable.png";
                //result = "./img/sim_undetected.png";//$.i18n.prop("sim_status_undetected");
                break;
            case "modem_undetected":
            	result = "./img_mifi/sim_disable.png";
                //result = "./img/sim_undetected.png";
                break;
            case "modem_imsi_waitnck":
            	result = "./img_mifi/sim_disable.png";
                //result = "./img/sim_undetected.png";//$.i18n.prop("sim_status_waitnck");
                break;
            case "modem_sim_destroy":
            	result = "./img_mifi/sim_disable.png";
                //result = "./img/sim_undetected.png";//$.i18n.prop("sim_status_destroy");
                break;
            case "modem_destroy":
            	result = "./img_mifi/sim_disable.png";
                //result = "./img/sim_undetected.png";//$.i18n.prop("sim_status_destroy");
                break;
            default:
            	result = "./img_mifi/sim_disable.png";
                //result = "./img/sim_detected.png";//$.i18n.prop("sim_status_ready");
                break;
        }
        return result;
    }

    /**
     * 将电量转化为对应图片
     * @method convertBatteryPers
     * @param pers
     * @param status
     */
    function convertBatteryPers(pers, status) {
    	var src = null;
		if ("0" == status) {
			if ("1" == pers) {
				//src = "img/battery_one.png";
				src = "img_mifi/battery_level_1.png";
			} else if ("2" == pers) {
				//src = "img/battery_two.png";
				src = "img_mifi/battery_level_2.png";
			} else if ("3" == pers) {
				//src = "img/battery_three.png";
				src = "img_mifi/battery_level_3.png";
			} else if ("4" == pers) {
				//src = "img/battery_full.png";
				src = "img_mifi/battery_level_4.png";
			} else { //"5" == pers || "0" == pers
				//src = "img/battery_out.png";
				src = "img_mifi/battery_low.gif";
			}
		} else {
			//src = "img/battery_charging.gif";
			src = "img_mifi/battery_elect.gif";
		}
		return src;
    }
    
    gotoSmsList = function(){
        var href = '#sms';
        if(window.location.hash == '#sms'){
            href = '#smslist';
        }
        if(checkFormContentModify(href)){
            window.location.hash = href;
        }
    };

    /**
     * 显示OTA升级结果
     * @method showOtaResult
     */
    function showOtaResult(otaResult) {
        if ((!($("#loading").is(":visible"))) && (!($("#confirm").is(":visible")))) {
            var msg = otaResult ? "ota_update_success" : "ota_update_failed";
            showAlert(msg, function () {
                if (config.UPGRADE_TYPE == "OTA") {
                    service.clearUpdateResult({}, $.noop());
                }
            });
        } else {
            window.setTimeout(function () {
                showOtaResult(otaResult)
            }, 1000);
        }
    }

	var checkBatteryTimer = 0;
	
	function CheckBatteryStatus(){
	  var state = service.getCurrentUpgradeState();
	  if(state.current_upgrade_state == 'low_battery'){
			showInfo('ota_low_battery');
			clearInterval(checkBatteryTimer);
		}
	}

    var timer = 0;
    /**
     * 显示升级状态
     * @method showOtaStatus
     */
    function showOtaStatus() {
        _otaUpdateCancelFlag = true;
        function showProgress() {
            var upgradingState = ["upgrade_pack_redownload", "upgrade_prepare_install", "low_battery"
                , "connecting_server", "connect_server_success", "upgrading", "accept"];
            var info = service.getCurrentUpgradeState();
            if(info.current_upgrade_state.toLowerCase() == "fota_idle") {
                addTimeout(showProgress, 1000);
            } else if($.inArray(info.current_upgrade_state, upgradingState) != -1) {
                hideLoading();
                showOTAUpgradeStatus();
            }
        }
        if (!($("#progress").is(":visible"))) {
            showProgress();
        }
        var times = 0;
        var getOTAUpgradeState = function () {
            var data = null;
            if (times <= 3) {
                times = times + 1;
                data = service.getCurrentUpgradeState();
            } else {
                data = getStatusInfo();
            }
            var state = data.current_upgrade_state;
            if(_otaUpdateCancelFlag){
                if(state == 'connecting_server'){
                }else if(state == 'connect_server_failed') {
                    _otaUpdateCancelFlag = false;
                    window.clearTimeout(timer);
                    hideProgressBar();
                    showAlert('ota_connect_server_failed');
                    return;
                }else if(state == 'connect_server_success') {
                }else if(state == 'upgrading') {
                    getDownloadSize();
                }else if(state == 'download_success') {
                }else if(state == 'upgrade_pack_check_ok') {
                }else if(state == 'download_failed') {
                    hideProgressBar();
                    _otaUpdateCancelFlag = false;
                    showAlert('ota_download_failed');
                    window.clearTimeout(timer);
                    return;
                }else if(state == 'server_unavailable'){
                    hideProgressBar();
                    _otaUpdateCancelFlag = false;
                    showAlert('ota_connect_server_failed');
                    window.clearTimeout(timer);
                    return;
                }else if(state == 'network_unavailable'){
                    hideProgressBar();
                    _otaUpdateCancelFlag = false;
                    showAlert('ota_no_network');
                    window.clearTimeout(timer);
                    return;
                }else if(state == 'pkg_exceed'){
                    hideProgressBar();
                    _otaUpdateCancelFlag = false;
                    showAlert('ota_pkg_exceed');
                    window.clearTimeout(timer);
                    return;
                }else if(state == 'accept'){
                }else if(state == 'low_battery'){
                    hideProgressBar();
                    _otaUpdateCancelFlag = false;
                    showInfo('ota_low_battery');
                    window.clearTimeout(timer);
                    return;
                }else if(state == 'upgrade_pack_error'){
                    hideProgressBar();
                    _otaUpdateCancelFlag = false;
                    showInfo('ota_md5_error');
                    window.clearTimeout(timer);
                    return;
                }else if(state == 'upgrade_prepare_install'){
                    hideProgressBar();
                    _otaUpdateCancelFlag = false;
                    service.removeTimerThings('current_upgrade_state',function(){});
                    showInfo('ota_download_success');
                    window.clearTimeout(timer);
					checkBatteryTimer = setInterval(function () {
                            CheckBatteryStatus();
                        }, 1000);
                    return;
                }else if(state == 'checking' || state == "fota_idle"){
                }else if(state == 'upgrade_pack_redownload'){
                }else{
                    _otaUpdateCancelFlag = false;
                    hideProgressBar();
                    window.clearTimeout(timer);
                    return;
                }
                timer = window.setTimeout(getOTAUpgradeState , 1000);
            }
        };

        if(_otaUpdateCancelFlag){
            timer = window.setTimeout(getOTAUpgradeState , 100);
        }else{
            window.clearTimeout(timer);
        }
    }

    function getUserSelector(choice){
        var selector = service.getUserChoice();
        if(choice){
            var info = getStatusInfo();
            if (!checkConnectedStatus(info.connectStatus) && info.connectWifiStatus != "connect") {
                showAlert("ota_network_disconnected");
                return;
            }

            if(selector.if_has_select == 'none'){
                startOTAUpgrade();
            }else if(selector.if_has_select == 'accept'){
                showOtaStatus();
            }else if(selector.if_has_select == 'cancel'){
                showAlert("ota_have_cancel");
            }else if(selector.if_has_select == 'downloading_cancel'){
                showAlert("ota_have_cancel");
            }
        }else{
            if(selector.if_has_select == 'none'){
                cancelOTAUpgrade();
            }else if(selector.if_has_select == 'accept'){
                showOtaStatus();
            }else if(selector.if_has_select == 'cancel'){

            }else if(selector.if_has_select == 'downloading_cancel'){

            }
        }
    }

    function getDownloadSize(){
        service.getPackSizeInfo({}, function (data) {
            var percents;
            if (parseInt(data.pack_total_size) == 0) {
                percents = 0;
            } else {
                percents = parseInt(parseInt(data.download_size) * 100 / parseInt(data.pack_total_size));
            }
            if (percents > 100) {
                percents = 100;
            }
            if (percents > 0) {
                if (percents > 95) {
                    showProgressBar("ota_update", "<br/>" + $.i18n.prop("ota_update_warning"));
                }
                setProgressBar(percents);
            }
        });
    }

    function startOTAUpgrade(){
        service.setUpgradeSelectOp({selectOp:'1'},function(result){
            if (result.result == "success"){
                showOtaStatus();
            }});
    }

    function cancelOTAUpgrade(){
        service.setUpgradeSelectOp({selectOp:'0'},function(result){ });
    }

    function showOTAUpgradeStatus() {
        var data = service.getMandatory();
        var isMandatory = data.is_mandatory;
        if (isMandatory) {
            showProgressBar("ota_update", "<br/>" + $.i18n.prop("ota_update_warning"));
        } else {
            var cancelHtml = "";
            if (config.UPGRADE_TYPE == "OTA") {
                cancelHtml = "<br/><br/><button id='btnStopUpgrade' onclick='stopOTAUpgrade();' class='btn-1 btn-primary'>" + $.i18n.prop("cancel") + "</button>";
            }
            showProgressBar("ota_update", "<br/>" + $.i18n.prop("ota_update_warning") + cancelHtml);
        }
        setProgressBar(0);
    }

    function showOTAConfirm(upgradeState) {
        var upgState = upgradeState.current_upgrade_state;
        if (upgState == 'upgrade_pack_redownload') {
            showConfirm("ota_interrupted", {ok: function () {
                getUserSelector(1);
            }, no: function () {
                getUserSelector(0);
            }});
        } else {
            var upgradingState = ["upgrade_prepare_install", "low_battery",
                "connecting_server", "connect_server_success", "upgrading", "accept"];
            if ($.inArray(upgState, upgradingState) != -1) {
                showOtaStatus();
            } else {
                var info = service.getNewVersionInfo();
                var version = "";
                if (info.version) {
                    version = "<br/>" + $.i18n.prop('ota_version') + info.version;
                }
                showConfirm($.i18n.prop('ota_new_version') + version, {ok: function () {
                    getUserSelector(1);
                }, no: function () {
                    getUserSelector(0);
                }});
            }
        }
    }

    showOTAAlert = function () {
        var is_mandatory = service.getMandatory().is_mandatory;
        if (is_mandatory) {
            showOtaStatus();
        } else {
            var upgradeState = {};
            upgradeState = service.getCurrentUpgradeState();
            showOTAConfirm(upgradeState);
        }
    };

    /**
     * 终止OTA升级
     * @method stopOTAUpgrade
     */
    stopOTAUpgrade = function () {
        service.setUpgradeSelectOp({selectOp:'2'},function(result){ });
        _otaUpdateCancelFlag = false;
        window.clearTimeout(timer);
        hideLoading();
        showAlert('ota_cancel');
    };

    /**
     * 设置流量提醒是否提醒过
     * @method setTrafficAlertPopuped
     * @param {Boolean} val
     */
    function setTrafficAlertPopuped(val){
    	trafficAlertPopuped = !!val;
        trafficAlert100Popuped = !!val;
        if(!val){
            resetTrafficAlertPopuped = true;
        }
    }

    function setTrafficAlert100Popuped(val){
        trafficAlert100Popuped = !!val;
        if(!val){
            resetTrafficAlertPopuped = true;
        }
    }

    /**
     * 计算流量结构
     * @method getTrafficResult
     * @param {Object} info service.getStatusInfo()
     */
    function getTrafficResult(info){
        var trafficResult = {
            showConfirm : false,
            limitPercent : info.limitVolumePercent
        };
        if(info.limitVolumeType == '1'){
            var monthlyTraffic = parseInt(info.data_counter.monthlySent, 10) + parseInt(info.data_counter.monthlyReceived, 10);
            trafficResult.usedPercent = monthlyTraffic / info.limitVolumeSize * 100;
            if(trafficResult.usedPercent > trafficResult.limitPercent){
                trafficResult.showConfirm = true;
                trafficResult.type = 'data';
            }
        }else{
            trafficResult.usedPercent = info.data_counter.monthlyConnectedTime / info.limitVolumeSize * 100;
            if(trafficResult.usedPercent > trafficResult.limitPercent){
                trafficResult.showConfirm = true;
                trafficResult.type = 'time';
            }
        }
        return trafficResult;
    }

    return {
        init:init,
        setTrafficAlertPopuped: setTrafficAlertPopuped,
        setTrafficAlert100Popuped: setTrafficAlert100Popuped,
        getTrafficResult: getTrafficResult,
        showOTAAlert:showOTAAlert
    };
});
