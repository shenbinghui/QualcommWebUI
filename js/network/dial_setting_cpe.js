/**
 * 联网设置模块
 * @module dial_setting
 * @class dial_setting
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

function($, ko, config, service, _) {
	var dialModes = _.map(config.pppoeModes, function(item) {
		return new Option(item.name, item.value);
	});
	
	var dialActions = _.map(config.dialActions, function(item){
		return new Option(item.name, item.value);
	});

    /**
     * 联网设置view model
     * @class PPPoEViewModel
     */
	function PPPoEViewModel() {
		var dataObj = service.getOpMode();
		var pppObj = service.getPppoeParams();
		setInterval(function(){
			var obj = service.getStatusInfo();
			pppObj.ppp_status = obj.connectStatus;
		}, 1000);
		
		var self = this;
		self.modes = ko.observableArray(dialModes);
		self.isPppoeMode = ko.observable(false);
		self.isStaticMode = ko.observable(false);
		self.action = ko.observable();
		self.btnTrans = ko.observable();
		self.enableFlag = ko.observable();
		
		self.currentMode = ko.observable(dataObj.opms_wan_mode);
		
		self.staticNoticeShow = ko.observable();
		self.dhcpNoticeShow = ko.observable();
		self.staticNotice = ko.observable();
		self.dhcpNotice = ko.observable();
		self.dhcpNoticeText = ko.observable();
		self.staticNoticeText = ko.observable();
		
		if(self.currentMode() == "DHCP"){
			switch(pppObj.dhcp_wan_status){
				case "0":
					self.dhcpNoticeShow(true);
					self.dhcpNotice("dyn_fail");
					self.dhcpNoticeText($.i18n.prop("dyn_fail"));
					break;
				case "1":
					self.dhcpNoticeShow(true);
					self.dhcpNotice("dyn_success");
					self.dhcpNoticeText($.i18n.prop("dyn_success"));
					break;
				default:
					self.dhcpNoticeShow(false);
					break;
			}
		}
		if(self.currentMode() == "STATIC"){
			switch(pppObj.static_wan_status){
				case "0":
					self.staticNoticeShow(true);
					self.staticNotice("static_fail");
					self.staticNoticeText($.i18n.prop("static_fail"));
					break;
				case "1":
					self.staticNoticeShow(true);
					self.staticNotice("static_success");
					self.staticNoticeText($.i18n.prop("static_success"));
					break;
				default:
					self.staticNoticeShow(false);
					break;
			}
		}
		
		
		//下拉框选择改变下面DIV模块
		self.changeModeDiv = function(){
			initContronler();
		};

		self.user = ko.observable(pppObj.pppoe_username);
		self.password = ko.observable(pppObj.pppoe_password);
		self.pppMode = ko.observable(pppObj.pppoe_dial_mode);
		initContronler();
			
		self.radioHandler = function(){
			initContronler();
			return true;
		};
		
		self.ipAddress = ko.observable(pppObj.static_wan_ipaddr);
		self.subnetMask = ko.observable(pppObj.static_wan_netmask);
		self.defaultGateway = ko.observable(pppObj.static_wan_gateway);
		self.primaryDNS = ko.observable(pppObj.static_wan_primary_dns);
		self.secondaryDNS = ko.observable(pppObj.static_wan_secondary_dns);
		addInterval(initContronler, 1000);
		
		self.save = function(){
			var requestParams = {};
			if($("#pppoe_mode").val() == "PPPOE") {
				requestParams = $.extend({}, {
					goformId: "WAN_GATEWAYMODE_PPPOE",
					pppoe_username: self.user(),
					pppoe_password: self.password(),
					dial_mode: self.pppMode(),
					action_link: self.action()
				});
			}else if($("#pppoe_mode").val() == "STATIC") {
				if(self.ipAddress() == self.defaultGateway()){
					showAlert("ip_gate_not_same");
					return;
				}
				requestParams = $.extend({}, {
					goformId: "WAN_GATEWAYMODE_STATIC",
					static_wan_ipaddr: self.ipAddress(),
					static_wan_netmask: self.subnetMask(),
					static_wan_gateway: self.defaultGateway(),
					static_wan_primary_dns: self.primaryDNS(),
					static_wan_secondary_dns: self.secondaryDNS(),
					WAN_MODE: "STATIC"
				});
			}else {
				requestParams = $.extend({}, {
					goformId: "WAN_GATEWAYMODE_DHCP"
				});
			}
			
			showLoading();
			service.setPppoeDialMode(requestParams, function(data){
				if(data.result){
					if(requestParams.goformId == "WAN_GATEWAYMODE_DHCP") {
						checkDhcpConnectionStatus();
					} else if(requestParams.goformId == "WAN_GATEWAYMODE_STATIC"){
						checkStaticConnectionStatus();
					} else {
						successOverlay();
					}
					$("#pppoeApply").translate();
                } else {
					if(requestParams.goformId == "WAN_GATEWAYMODE_STATIC") {
						self.staticNoticeShow(true);
						self.dhcpNoticeShow(false);
						self.staticNotice($.i18n.prop("static_fail"));
					} else if(requestParams.goformId == "WAN_GATEWAYMODE_DHCP"){
						self.dhcpNoticeShow(true);
						self.staticNoticeShow(false);
						self.dhcpNotice($.i18n.prop("dyn_fail"));
					}else {
						errorOverlay();
					}
                }
			});
			var counter = 0;
            var loadingIsShow = true;
			function checkDhcpConnectionStatus() {
				$.getJSON("/goform/goform_get_cmd_process", {
					cmd : "dhcp_wan_status",
					"_" : new Date().getTime()
				}, function(data) {
					if(counter < 1) {
						counter++;
						setTimeout(checkDhcpConnectionStatus, 3000);
					} else if (data.dhcp_wan_status == "1") {
						if(loadingIsShow) {
                            loadingIsShow = false;
                            hideLoading();
                        }
						if(self.currentMode() == "DHCP") {
							self.dhcpNoticeShow(true);
							self.staticNoticeShow(false);
							self.dhcpNotice("dyn_success");
							self.dhcpNoticeText($.i18n.prop("dyn_success"));
						}
					} else if( counter >= 2 || data.dhcp_wan_status == "0" || data.dhcp_wan_status == ""){
                        if(loadingIsShow) {
                            loadingIsShow = false;
                            hideLoading();
                        }
						if(self.currentMode() == "DHCP") {
							self.dhcpNoticeShow(true);
							self.staticNoticeShow(false);
							self.dhcpNotice("dyn_fail");
							self.dhcpNoticeText($.i18n.prop("dyn_fail"));
						}
						setTimeout(checkDhcpConnectionStatus, 3000);
						counter++;
					} else {
                        if(loadingIsShow) {
                            loadingIsShow = false;
                            hideLoading();
                        }
					}
				}).error(function() {
					callback(false);
				});
			}
			var staticCount = 0;
			function checkStaticConnectionStatus(){
				$.getJSON("/goform/goform_get_cmd_process", {
					cmd : "static_wan_status",
					"_" : new Date().getTime()
				}, function(data) {
					if(staticCount < 1) {
						staticCount++;
						setTimeout(checkStaticConnectionStatus, 3000);
					}else if(data.static_wan_status == "0" || data.static_wan_status == ""){
						hideLoading();
						self.staticNoticeShow(true);
						self.dhcpNoticeShow(false);
						self.staticNotice("static_fail");
						self.staticNoticeText($.i18n.prop("static_fail"));
					} else if (data.static_wan_status == "1" ) {
						hideLoading();
						self.staticNoticeShow(true);
						self.dhcpNoticeShow(false);
						self.staticNotice("static_success");
						self.staticNoticeText($.i18n.prop("static_success"));
					} else {
						hideLoading();
					}
				}).error(function() {
					callback(false);
				});
			}
		}
		
		function initContronler() {
			if(self.currentMode() == "PPPOE"){
				self.isPppoeMode(true);
				self.isStaticMode(false);
				self.staticNoticeShow(false);
				self.dhcpNoticeShow(false);
				if(pppObj.ppp_status == "ppp_connected" || pppObj.ppp_status =="ppp_connecting"){
					self.enableFlag(false);
				} else {
					self.enableFlag(true);
				}
				var status = pppObj.ppp_status == "ppp_connected" ? "disconnect" : "connect";
				self.action(status);
				if(self.pppMode() == "auto_dial"){
					self.btnTrans("apply");
				} else if(pppObj.ppp_status == "ppp_connected"){
					self.btnTrans("disconnect");
				}else{
					self.btnTrans("connect");
				}
				if((self.pppMode() == "auto_dial")&&(pppObj.ppp_status == "ppp_connected")){
				    $("input:submit").attr("disabled", true);
				}else {
				    $("input:submit").attr("disabled", false);
                }
			}else if(self.currentMode() == "STATIC"){
                if(service.getStatusInfo().opms_wan_mode == "PPPOE") {
                    if(pppObj.ppp_status == "ppp_connected"){
                        $("input:submit").attr("disabled", true);
                    }else {
                        $("input:submit").attr("disabled", false);
                    }
                }
                self.isStaticMode(true);
				self.isPppoeMode(false);
				self.btnTrans("apply");
				self.dhcpNoticeShow(false);
			} else {
				if(service.getStatusInfo().opms_wan_mode == "PPPOE") {
                    if(pppObj.ppp_status == "ppp_connected"){
                        $("input:submit").attr("disabled", true);
                    }else {
                        $("input:submit").attr("disabled", false);
                    }
                }
                self.isStaticMode(false);
				self.isPppoeMode(false);
				self.btnTrans("apply");
				self.staticNoticeShow(false);
			}
			$("#pppoeApply").translate();
		}
	}

    /**
     * 联网设置初始化
     * @method init
     */
	function init() {
		var container = $('#container');
		ko.cleanNode(container[0]);
		var vm = new PPPoEViewModel();
		ko.applyBindings(vm, container[0]);
		$("#pppoeApply").translate();
		
		$('#pppoeForm').validate({
			submitHandler : function() {
				vm.save();
			},
            rules: {
                txtPin: "wps_pin_check",
				txtIpAddress: "dmz_ip_check",
				txtSubnetMask: {
					ipv4: true,
                    subnetmask_check: true
				},
				txtDefaultGateway: {
					ipv4: true,
					gateway_check: true
				},
				txtPrimaryDNS: {
					ipv4: true
				},
				txtSecondaryDNS: {
					ipv4: true
				}
            }
		});
	}
	
	
//from 4.0
function validateNetmask(netmask) {
	var array = new Array();
	array = netmask.split(".");

	if (array.length != 4)
	{
		return false;
	}

	array[0] = parseInt(array[0]);
	array[1] = parseInt(array[1]);
	array[2] = parseInt(array[2]);
	array[3] = parseInt(array[3]);

	if (array[3] != 0)
	{
		if (array[2] != 255 || array[1] != 255 || array[0] != 255)
		{
			return false;
		}
		else
		{
			if (!isNetmaskIPValid(array[3]))
			{
				return false;
			}
		}
	}

	if (array[2] != 0)
	{
		if (array[1] != 255 || array[0] != 255)
		{
			return false;
		}
		else
		{
			if (!isNetmaskIPValid(array[2]))
			{
				return false;
			}
		}
	}

	if (array[1] != 0)
	{
		if (array[0] != 255)
		{
			return false;
		}
		else
		{
			if (!isNetmaskIPValid(array[1]))
			{
				return false;
			}
		}
	}
	if(array[0]!=255)
	{
		return false;
	}
	if ( "0.0.0.0" == netmask || "255.255.255.255" == netmask)
	{
		return false;
	}

	return true;
}

function isNetmaskIPValid(ip) {
	if (ip == 255 || ip == 254 || ip == 252 || ip == 248
		|| ip == 240 || ip == 224 || ip == 192 || ip == 128 || ip == 0)
	{
		return true;
	}
	else
	{
		return false;
	}
}
jQuery.validator.addMethod("subnetmask_check", function (value, element, param) {
	var result = validateNetmask(value);
    return this.optional(element) || result;
});

function validateGateway(wanIp, netmaskIp, gatewayIp) {
	if(myConcat(wanIp,netmaskIp) == myConcat(netmaskIp, gatewayIp)) {
		return true;
	} else {
		return false;
	}
}
function myConcat(ip1,ip2){
	var result = [];
	var iplArr = ip1.split(".");
	var ip2Arr = ip2.split(".");
	for(var i = 0; i < iplArr.length;i++){
		result[i] = (iplArr[i] & ip2Arr[i]);
	}
	return result.join(".");
}
jQuery.validator.addMethod("gateway_check", function (value, element, param) {
	var result = validateGateway($('#txtIpAddress').val(), $('#txtSubnetMask').val(), $("#txtDefaultGateway").val());
    return this.optional(element) || result;
});
	
	return {
		init: init
	};
});