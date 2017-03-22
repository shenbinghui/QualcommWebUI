/**
 * VoipÉèÖÃ
 * @module lan
 * @class lan
 */
define([ 'jquery', 'knockout', 'config/config', 'service'],
    function ($, ko, config, service) {

        function voipVM() {
            var self = this;
            var info = service.getVoipUserDetails();
            self.sipRegisterServer = ko.observable(info.sipRegisterServer);
            self.sipDomain = ko.observable(info.sipDomain);
            self.sipRealm = ko.observable(info.sipRealm);
            self.sipProxyMode = ko.observable(info.sipProxyMode);
            self.voipSipProxyServer = ko.observable(info.voipSipProxyServer);
            self.displayName = ko.observable(info.displayName);
            self.authorizedUserName = ko.observable(info.authorizedUserName);
            self.authorizedPassword = ko.observable(info.authorizedPassword);
            self.registerStatusTrans = ko.observable();
			self.isRegisterSuccess = ko.observable(false);
			var trans = "";
			switch(info.voipRegisterStatus) {
				case "register_failed":
					trans = $.i18n.prop("register_failed");
					self.isRegisterSuccess(false);
					break;
				case "register_success":
					trans = $.i18n.prop("register_success");
					self.isRegisterSuccess(true);
					break;
				case "Unregister":
					trans = $.i18n.prop("unregister");
					self.isRegisterSuccess(false);
					break;
				case "register_connecting":
					trans = $.i18n.prop("register_connecting");
					self.isRegisterSuccess(false);
					break;
				default:
					break;
			}
			self.registerStatusTrans(trans);
			updateRegisterStatus();
			
            self.refreshStatus = function() {
                var connInfo = service.getConnectionInfo();
                if(checkConnectedStatus(connInfo.connectStatus)) {
                    $('#voioUserDetailsForm input').each(function() {
                        $(this).attr("disabled", false);
                    });
                } else {
                    $('#voioUserDetailsForm input').each(function() {
                        $(this).attr("disabled", true);
                    });
                    clearValidateMsg();
                }
            };

            self.clear = function() {
                clearTimer();
                init();
                clearValidateMsg();
            };
			
			function updateRegisterStatus() {
				var counter = 0;
				var trans = "";
				var timer = setInterval(function(){
					counter++;
					var data = service.getVoipUserRegisterStatus();
					switch(data.voipRegisterStatus) {
						case "register_failed":
							trans = "register_failed";
							self.isRegisterSuccess(false);
							break;
						case "register_success":
							trans = "register_success";
							self.isRegisterSuccess(true);
							break;
						case "Unregister":
							trans = "unregister";
							self.isRegisterSuccess(false);
							break;
						case "register_connecting":
							trans = "register_connecting";
							self.isRegisterSuccess(false);
							break;
						default:
							break;
					}
					self.registerStatusTrans($.i18n.prop(trans));
					if(counter >= 60) {
						clearInterval(timer);
					}
				}, 1000);
			}
			
			function submitUserDetails(isRegister){
				showLoading();
                var params = {};
				params.goformId = "SIP_PROC1";
                params.voip_sip_register_server = self.sipRegisterServer();
                params.voip_sip_domain = self.sipDomain();
               // params.voip_sip_proxy_enable = self.sipProxyMode();
                params.voip_sip_realm = self.sipRealm();
                params.voip_account_display_account1 = self.displayName();
                params.voip_sip_proxy_server = self.voipSipProxyServer();
                params.voip_account_auth1 = self.authorizedUserName();
                params.voip_account_password1 = self.authorizedPassword();
				params.deregister = isRegister ? "" : "deregister";

               service.setVoipUserDetails(params, function(result) {
                   if (result.result == "success") {
                       successOverlay();
					   //updateRegisterStatus();
                   } else {
                       errorOverlay();
                   }
               });
			}

            self.save = function() {
                submitUserDetails(true);
            };
			
			self.deregister = function(){
				submitUserDetails(false);
			}

            self.refreshStatus();
        }
		
        function init() {
            var container = $('#container');
            ko.cleanNode(container[0]);
            var vm = new voipVM();
            ko.applyBindings(vm, $('#container')[0]);

            addInterval(vm.refreshStatus, 1000);

            $('#voioUserDetailsForm').validate({
                submitHandler:function () {
                    vm.save();
                },
                rules:{
                    sip_register_server: {
                        sntp_invalid_server_name: true
                    },
                    voip_sip_domain: {
                        sip_domain_check: true
                    },
                    voip_sip_realm: {
                        sip_realm_check: true
                    },
                    voip_sip_proxy_server: {
                        sip_proxy_server_check: true
                    },
                    voip_account_display_account2:{
                        display_name_check:true
                    },
                    voip_account_auth2:{
                        authorized_username_check:true
                    },

                    voip_account_password2:{
                        account_password_check:true
                    }
                },

                errorPlacement: function(error, element) {
                    error.insertAfter(element);
                }
            });
        }
        return {
            init:init
        }
    }
)



