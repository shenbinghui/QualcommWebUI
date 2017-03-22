/**
 * voip设置模块
 * @module voip
 * @class voip
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

function($, ko, config, service, _) {
	/**
     * voip设置view model
     * @class voipSettings view model
     */
	function VoipSettingsViewModel() {		
		var self = this;
		var data = 	service.getVoipSettings();
		self.outboundEnable = ko.observable(data.outboundEnable);
		self.showOutboundDiv = ko.observable(false);
		self.outboundServer = ko.observable(data.outboundServer);
		self.outboundPort = ko.observable(data.outboundPort);
		initOutboundDiv();
		
		self.stunModeEnable = ko.observable(data.stunModeEnable);
		self.showStunDiv = ko.observable();
		initStunDiv();
		self.stunServer = ko.observable(data.stunServer);
		
		self.registerTime = ko.observable(data.registerTime);
		
		self.changeOutboundSwitchHandler = function() {
			initOutboundDiv();
			return true;
		};
		
		self.changeStunSwitchHandler = function() {
			initStunDiv();
			return true;
		}
		
		self.sipPort = ko.observable(data.sipPort);
		self.rtpPortMin = ko.observable(data.rtpPortMin);
		self.rtpPortMax = ko.observable(data.rtpPortMax);
		
		self.apply = function() {
			var requestParams = {
				goformId: "SIP_ADV_SET",
				voip_sip_outbound_enable: self.outboundEnable(),
				voip_sip_outbound_port: self.outboundPort(),
				voip_sip_outbound_server: self.outboundServer(),
				voip_sip_port: self.sipPort(),
				voip_sip_register_time: self.registerTime(),
				voip_sip_rtp_port_min: self.rtpPortMin(),
				voip_sip_rtp_port_max: self.rtpPortMax(),
				voip_sip_stun_enable: self.stunModeEnable(),
				voip_sip_stun_server: self.stunServer()
			};
			
			service.setVoipSettings(requestParams, function(data){
				if(data.result == "success") {
					successOverlay();
					showAlert("warn_information");
				} else {
					errorOverlay();
				}
			});
		}
		
		function initOutboundDiv() {
			if(self.outboundEnable() == "1") {
				self.showOutboundDiv(true);
			} else {
				self.showOutboundDiv(false);
			}
		}
		
		function initStunDiv() {
			if(self.stunModeEnable() == "1") {
				self.showStunDiv(true);
			} else {
				self.showStunDiv(false);
			}
		}	
		
	}

    /**
     * sntp设置初始化
     * @method init
     */
	function init() {
		var container = $('#container');
		ko.cleanNode(container[0]);
		var vm = new VoipSettingsViewModel();
		ko.applyBindings(vm, container[0]);	
		
		$("#voipSettingsForm").validate({
			submitHandler: function(){
				vm.apply();
			},
			rules: {
				outbound_server: {
					sntp_invalid_server_name: true
				},
				outbound_port: {
					voip_outbound_port_check: true
				},
				stun_server: {
					sntp_invalid_server_name: true
				},
				register_time: {
					voip_time_check: true
				},
				sip_port: {
					voip_sip_port_check: true
				},
				sip_rtp_port_min: {
					digits: true,
                    range: [1026, 65535],
                    voip_port_compare: "#sip_rtp_port_max"
				},
				sip_rtp_port_max: {
					digits: true,
                    range: [1026, 65535],
                    voip_port_compare: "#sip_rtp_port_min"
				}
			},
			groups: {
				range: "sip_rtp_port_min sip_rtp_port_max"
			},
			errorPlacement: function(error, element) {
				if(element.attr("name") == "outbound_port") {
					error.insertAfter("#outbound_port_label");
				} else if (element.attr("name") == "register_time") {
					error.insertAfter("#register_time_label");
				} else if (element.attr("name") == "sip_port") {
					error.insertAfter("#sip_port_label");
				} else if (element.attr("name") == "sip_rtp_port_min" || element.attr("name") == "sip_rtp_port_max") {
					error.insertAfter("#rtp_port_label");
				} else {
					error.insertAfter(element); 
				}
			}
		});
	}
	
	return {
		init: init
	};
});