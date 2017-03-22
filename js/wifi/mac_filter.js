/**
 * mac filter ģ��
 * @module mac filter
 * @class mac filter
 */

define(['knockout', 'service', 'jquery', 'config/config', 'underscore'],
    function (ko, service, $, config, _) {
		/**
         * macFilterVM
         * @class macFilterVM
         */
        function macFilterVM() {
        	leftMenuClick("menu_settings");
			var info = service.getMacFilterInfo();
            var self = this;            
			self.macFilterEnable = ko.observable(info.ACL_mode);
			self.blackListEnabled = ko.observable(info.ACL_mode == "2");
			self.blackList = ko.observable(parseStringToArray(info.wifi_hostname_black_list,info.wifi_mac_black_list));
			self.deviceInfo = ko.observable([]);
			refreshDeviceInformation();
				
			addInterval(function(){
				refreshDeviceInformation();
			}, 3000);

			self.setMacFilter = function() {
				var macStr = "";
				var hostNameStr = "";
				_.map(self.blackList(), function(item){
					hostNameStr = hostNameStr==""?item.hostName:hostNameStr+';'+item.hostName;
					macStr = macStr==""?item.macAddress:macStr+';'+item.macAddress;
				});
				var requestParams = {
					ACL_mode: self.macFilterEnable(),
					wifi_hostname_black_list: hostNameStr,
					wifi_mac_black_list: macStr
				};
				apply(requestParams);
			}
			
			addToBlackList = function(hostName,mac,ipAddr,id) {
                if(info.user_ip_addr == ipAddr) {
                    showAlert("black_yourself_tip");
                    return false;
                }

                if(self.blackList().length >= 32) {
					showAlert("black_list_max");
					return false;
				}
				var hostNameStr = info.wifi_hostname_black_list == "" ?  hostName: hostName + ';' + info.wifi_hostname_black_list;
				var macStr = info.wifi_mac_black_list == "" ?  mac : mac + ';' + info.wifi_mac_black_list;
				var requestParams = {
					ACL_mode: self.macFilterEnable(),
					wifi_hostname_black_list: hostNameStr,
					wifi_mac_black_list: macStr
				};
				apply(requestParams,id);
			};
			
			removeFromBlackList = function(id){
				var hostNameStr = "";
				var macStr = "";
				var tempArray = self.blackList();
				tempArray.splice(parseInt(id, 10), 1);
				_.map(tempArray, function(item){
					hostNameStr = hostNameStr == ''?item.hostName:hostNameStr+';'+item.hostName;
					macStr = macStr== ''?item.macAddress:macStr+';'+item.macAddress;
				});
				var requestParams = {
					ACL_mode: self.macFilterEnable(),
					wifi_hostname_black_list: hostNameStr,
					wifi_mac_black_list: macStr
				};
				apply(requestParams);
			}
			
			//�ύ����
			function apply(params, id) {
				/*if(info.RadioOff == "0") {
					showAlert("wps_wifi_off");
					return false;
				}*/
				var wpsState = service.getWpsInfo();
				if(wpsState.wpsFlag == "1") {
					showAlert('wps_on_info');
					return false;
				}
				var requestParams = $.extend({
				},params);
				service.setMacFilter(requestParams, function(data){
					if(data.result == "success") {
						successOverlay();
						self.macFilterEnable(requestParams.ACL_mode);
						self.blackList(parseStringToArray(requestParams.wifi_hostname_black_list,requestParams.wifi_mac_black_list));
						self.blackListEnabled(requestParams.ACL_mode == "2");
						info.ACL_mode = requestParams.ACL_mode;
						info.wifi_hostname_black_list = requestParams.wifi_hostname_black_list;
						info.wifi_mac_black_list = requestParams.wifi_mac_black_list;
						$('#blacklist').translate();
						$('#'+id).attr("disabled", true);
					} else {
						errorOverlay();
					}
				});
			}
			
			function parseStringToArray(strHostName,strMac) {
				if(strMac == "") {
					return [];
				}
				var tempHostName = strHostName.split(';');
				var tempMac = strMac.split(';');
				var result = [];
				for(var i = 0; i < tempMac.length; i++) {
					var obj = {};
					obj.hostName = tempHostName[i];
					obj.macAddress = tempMac[i];
					result.push(obj);
				}
				return result;
			}
			
			function refreshDeviceInformation() {
				if(info.ACL_mode == "2") {
					service.getCurrentlyAttachedDevicesInfo({}, function(devices){
						//self.deviceInfo(devices.attachedDevices);
						var resultArray = [];
						var deviceInfoArr = [];
						_.map(devices.attachedDevices,function(item){
							deviceInfoArr.push(item.macAddress);
							var obj = $.extend({
								enabled: true
							}, item);
							resultArray.push(obj);
						});
						var blackMacArr = info.wifi_mac_black_list.split(';');
						for(var i = 0;i < blackMacArr.length; i++){
							var index = $.inArray(blackMacArr[i], deviceInfoArr);
							if(index != -1){
								resultArray[index].enabled = false;
							}
						}
						self.deviceInfo(resultArray);
						$('#deviceInfo').translate();
					});
				}
			}
			
			self.submit_macFilterForm = function() {
                $("#macFilterForm").submit();
            };
		}

        /**
         * ��ʼ�� ViewModel�������а�
         * @method init
         */
        function init() {
			var container = $("#container");
			ko.cleanNode(container[0]);
			var vm = new macFilterVM();
            ko.applyBindings(vm, container[0]);
			
			$('#macFilterForm').validate({
				submitHandler:function () {
                    vm.setMacFilter();
                }
			});
        }

        return {
            init:init
        };
    });
