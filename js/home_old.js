/**
 * HOME模块
 * @module Home
 * @class Home
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore','status/statusBar', 'opmode/opmode'],

function($, ko, config, service, _,statusBar, opmode) {
	/**
	 * connection information ViewModel
	 * 
	 * @class connectInfoVM
	 */
	function connectInfoVM() {
		var self = this;
		self.isShowHomeConnect = ko.observable();
		var opmodeObj = service.getOpMode();
		switch(opmodeObj.opms_wan_mode){
			case "BRIDGE":
			case "PPPOE":
			case "DHCP":
			case "STATIC":
				self.isShowHomeConnect(false);
				$("#div-station").removeClass("span9").addClass("span11");
				break;
			case "PPP":
				self.isShowHomeConnect(true);
				break;
			default:
				break;
		}
		var info = service.getConnectionInfo();
		self.connectStatus = ko.observable(info.connectStatus);
		if (checkConnectedStatus(info.connectStatus)) {
			self.current_Flux = ko.observable(transUnit(parseInt(info.data_counter.currentReceived, 10) + parseInt(info.data_counter.currentSent, 10), false));
			//self.total_Flux = ko.observable(transUnit(parseInt(info.data_counter.totalSent, 10) + parseInt(info.data_counter.totalReceived, 10), false));
			self.connected_Time = ko.observable(transSecond2Time(info.data_counter.currentConnectedTime));
			self.up_Speed = ko.observable(transUnit(info.data_counter.uploadRate, true));
			self.down_Speed = ko.observable(transUnit(info.data_counter.downloadRate, true));
		} else {
			self.current_Flux = ko.observable(transUnit(0, false));
			self.connected_Time = ko.observable(transSecond2Time(0));
			self.up_Speed = ko.observable(transUnit(0, true));
			self.down_Speed = ko.observable(transUnit(0, true));
		}
        self.hasWifi = ko.observable(config.HAS_WIFI);
		self.transText = ko.dependentObservable(function() {
			if (checkConnectedStatus(self.connectStatus())) {
				return "disconnect";
			} else {
				return "connect";
			}
		});
		
		self.canConnect = ko.observable(getCanConnectNetWork());
		self.connectStatusText = ko.dependentObservable(function() {
			self.canConnect();
			
			if (checkConnectedStatus(self.connectStatus())) {
				return $.i18n.prop("disconnect");
			} else {
				return $.i18n.prop("connect");
			}
		});
		self.imagePath = ko.dependentObservable(function() {
			if (checkConnectedStatus(self.connectStatus())) {
				return "img/connect.png";
			} else if(self.connectStatus() == 'ppp_disconnected'){
				return "img/disconnect.png";
			} else if(self.connectStatus() == 'ppp_connecting'){
				return "img/connecting.gif";
			} else {
				return "img/disconnecting.gif";
			}
		});

	
        self.deviceInfo = ko.observableArray([]);
		var templateColumns = [
                { headerTextTrans:"station_number", rowText:"index", width:"10%"},
                { headerTextTrans:"host_name", rowText:"hostName", width:"30%"},
                { headerTextTrans:"mac_address", rowText:"macAddress", width:"23%"},
                { headerTextTrans:"ip_address", rowText:"ipAddress", width:"22%"},
                { columnType:"button", headerTextTrans:"port_filter_action", rowText:"", width:"15%",needTrans:true}
            ]
		self.gridTemplate = new ko.simpleGrid.viewModel({
			data:self.deviceInfo(),
            idName:"index",
            columns:templateColumns,
			showPager:true,
			pageSize:10
		});

		/**
		 * 响应连接按钮事件
		 * 
		 * @event connectHandler
		 */
		self.connectHandler = function() {
			if (checkConnectedStatus(self.connectStatus())) {
                showLoading('disconnecting');
				service.disconnect({}, function(data) {
					if(data.result){
						successOverlay();
						opmode.init();
					} else {
						errorOverlay();
					}
				});
			} else {
                if(service.getStatusInfo().roamingStatus) {
                    showConfirm('dial_roaming_connect', function(){
                        self.connect();
			opmode.init();
                    });
					
                } else {
                    self.connect();
					opmode.init();
                }
			}
		};

        self.connect = function() {
            var statusInfo = service.getStatusInfo();
            var trafficResult = statusBar.getTrafficResult(statusInfo);
            if(statusInfo.limitVolumeEnable && trafficResult.showConfirm){
                var confirmMsg = null;
                if(trafficResult.usedPercent > 100){
                    confirmMsg = {msg: 'traffic_beyond_connect_msg'};
                    statusBar.setTrafficAlertPopuped(true);
                } else {
                    confirmMsg = {msg: 'traffic_limit_connect_msg', params: [trafficResult.limitPercent]};
                    statusBar.setTrafficAlert100Popuped(false);
                }
                showConfirm(confirmMsg, function(){
                    doConnect();
                });
            }else{
                doConnect();
            }
        };
	}

    function doConnect(){
        showLoading('connecting');
        service.connect({}, function(data) {
            if(data.result){
                successOverlay();
            } else {
                errorOverlay();
            }
        });
    }

    function getCanConnectNetWork(){
        var status = service.getStatusInfo();
        if (status.simStatus != "modem_init_complete") {
            return false;
        }
        
        if (checkConnectedStatus(status.connectStatus)) {
            if (config.AP_STATION_SUPPORT) {
                var ap = service.getAPStationBasic()
                if (ap.ap_station_enable == "1") {
                    var result = service.getConnectionMode();
                    if (result.connectionMode == "auto_dial") {
                        return false;
                    }
                }
            }
            return true;
        }
	
	//如果已联网，但是没有信号，断网按钮需要可以用
        if (status.signalImg == "0") {
            return false;
        }
        var networkTypeTmp = status.networkType.toLowerCase();
        if (networkTypeTmp == '' || networkTypeTmp == 'limited_service' || networkTypeTmp == 'no_service') {
            return false;
        }
        if("ppp_connecting"==status.connectStatus || "ppp_disconnecting"==status.connectStatus){
            return false;
        }
        if (config.AP_STATION_SUPPORT) {
            var ap = service.getAPStationBasic()

            if (status.connectWifiStatus == "connect") {
                if (ap.ap_station_mode == "wifi_pref") {
                    return false;
                }
            }
        }
        return true;
    }

    function refreshHomeData(connectionVM){
        var info = service.getConnectionInfo();
        connectionVM.connectStatus(info.connectStatus);
        if (checkConnectedStatus(info.connectStatus)) {
            connectionVM.current_Flux(transUnit(parseInt(info.data_counter.currentReceived, 10) + parseInt(info.data_counter.currentSent, 10), false));
            //connectionVM.total_Flux(transUnit(parseInt(info.data_counter.totalSent, 10) + parseInt(info.data_counter.totalReceived, 10), false));
            connectionVM.connected_Time(transSecond2Time(info.data_counter.currentConnectedTime));
            connectionVM.up_Speed(transUnit(info.data_counter.uploadRate, true));
            connectionVM.down_Speed(transUnit(info.data_counter.downloadRate, true));
        } else {
            connectionVM.current_Flux(transUnit(0, false));
            //connectionVM.total_Flux(transUnit(parseInt(info.data_counter.totalSent, 10) + parseInt(info.data_counter.totalReceived, 10), false));
            connectionVM.connected_Time(transSecond2Time(0));
            connectionVM.up_Speed(transUnit(0, true));
            connectionVM.down_Speed(transUnit(0, true));
        }
        connectionVM.canConnect(getCanConnectNetWork());
    }
	
	function refreshAttachedDevicesInfo(connectionVM) {
		service.getCurrentlyAttachedDevicesInfo({}, function (devices) {
            var resultDevices = devices.attachedDevices;
			if(resultDevices.length < 10) {
				var emptyInfo = {
					index:"",
					macAddress:" ",
					ipAddress:"",
					hostName:"",
					timeConnected:"",
					btnDisplay: false
				};
				var deviceNum = 0;
				if (resultDevices) {
					deviceNum = resultDevices.length;
				} else {
					resultDevices = [];
				}
				var emptyLen = 10- deviceNum;
				for (var i = 0; i < emptyLen; i++) {
					resultDevices.push(emptyInfo);
				}
			}
			service.getMacFilterInfo({},function(macFilterInfo){
				var blockBtnEnabled = macFilterInfo.ACL_mode == "2" ? true : false;
				$.each(resultDevices,function(i,val) {
					if(resultDevices[i].index != "") {
						resultDevices[i].index = i+1;
						resultDevices[i].btnDisplay = true;
						resultDevices[i].enabled = macFilterInfo.wifi_mac_black_list.indexOf(val.macAddress) == -1 ? blockBtnEnabled : false;
						resultDevices[i].actionTrans = "block";
						resultDevices[i].action = function(){
							blockToBlack(macFilterInfo,val.macAddress,val.hostName,val.ipAddress,connectionVM);
						};
					}
				});
				connectionVM.gridTemplate.data(resultDevices);
			});
        });
    }
	
	function blockToBlack(macFilterInfo,mac,hostName,ipAddr,vm){
		if(macFilterInfo.user_ip_addr == ipAddr) {
            showAlert("black_yourself_tip");
            return false;
        }
        if(macFilterInfo.wifi_mac_black_list.split(";").length >= 32) {
			showAlert("black_list_max");
			return false;
		}
		var wpsState = service.getWpsInfo();
		if(wpsState.wpsFlag == "1") {
			showAlert('wps_on_info');
			return false;
		}
		var hostNameStr = macFilterInfo.wifi_hostname_black_list == "" ?  hostName: hostName + ';' + macFilterInfo.wifi_hostname_black_list;
		var macStr = macFilterInfo.wifi_mac_black_list == "" ?  mac : mac + ';' + macFilterInfo.wifi_mac_black_list;
		var requestParams = {
			ACL_mode: "2",
			wifi_hostname_black_list: hostNameStr,
			wifi_mac_black_list: macStr
		};
		showLoading();
		service.setMacFilter(requestParams, function(data){
			if(data.result == "success") {
				successOverlay();
				refreshAttachedDevicesInfo(vm);
			} else {
				errorOverlay();
			}
		});
	}

    /**
	 * 初始化vm
	 * 
	 * @method init
	 */
	function init() {
		var container = $('#container')[0];
		ko.cleanNode(container);

		var connectionVM = new connectInfoVM();
		ko.applyBindings(connectionVM, container);
		
		$('#frmHome').validate({
			submitHandler : function() {
				connectionVM.connectHandler();
			}
		});

        refreshHomeData(connectionVM);
		refreshAttachedDevicesInfo(connectionVM);
		addInterval(function() {
            refreshHomeData(connectionVM);
        }, 1000);
		addInterval(function(){
			refreshAttachedDevicesInfo(connectionVM);
		},3000);
	}

    return {
        init:init,
        refreshAttachedDevicesInfo:refreshAttachedDevicesInfo
    };
});