/**
 * Voip Advanced Settings
 * @module
 * @class
 */
define([ 'jquery', 'knockout', 'config/config', 'service'],
    function ($, ko, config, service) {
        var voipSipDtmfMethod = _.map(config.voipSipDtmfMethod, function(item) {
            return new Option(item.name, item.value);
        });
        var sipEncodeMethod = _.map(config.sipEncodeMethod, function(item) {
            return new Option(item.name, item.value);
        });

        function voipAdvancedVM() {
            var self = this;
            var info = service.getVoipAdvancedSettings();
            self.sipT38Mode = ko.observable(info.sipT38Mode);
            self.voip_sip_dtmf_method = ko.observableArray(voipSipDtmfMethod);
            self.currentDtmfMethod = ko.observable(info.currentDtmfMethod);
            self.voip_sip_encoder_method = ko.observableArray(sipEncodeMethod);
            self.currentVoipSipEncoderMethod = ko.observable(info.currentVoipSipEncoderMethod);
            self.sipVadMode = ko.observable(info.sipVadMode);
            self.sipCngMode = ko.observable(info.sipCngMode);


//            self.refreshStatus = function() {
//                var connInfo = service.getConnectionInfo();
//                if(connInfo.connectStatus == 'ppp_connected') {
//                    $('#voioUserDetailsForm input').each(function() {
//                        $(this).attr("disabled", false);
//                    });
//                } else {
//                    $('#voioUserDetailsForm input').each(function() {
//                        $(this).attr("disabled", true);
//                    });
//                    clearValidateMsg();
//                }
//            };

            self.clear = function() {
                clearTimer();
                init();
                clearValidateMsg();
            };

            self.save = function() {
                showLoading();
                var params = {};
                params.goformId = "SIP_ADV_PROC1";
                params.voip_sip_t38_enable = self.sipT38Mode();
                params.voip_sip_dtmf_method = self.currentDtmfMethod();
                params.voip_sip_encoder = self.currentVoipSipEncoderMethod();
                params.voip_sip_vad_enable1 = self.sipVadMode();
                params.voip_sip_cng_enable1 = self.sipCngMode();

                service.setVoipAdvancedSettings(params, function(result) {
                        if (result.result == "success") {
                            successOverlay();
							showAlert("warn_information");
                        } else {
                            errorOverlay();
                        }
                    }
                );
            };

            //self.refreshStatus();
        }
        // function getVoipInfo() {
        //     return service.getVoipInfo();
        // }
        function init() {
            var container = $('#container');
            ko.cleanNode(container[0]);
            var vm = new voipAdvancedVM();
            ko.applyBindings(vm, $('#container')[0]);

           // addInterval(vm.refreshStatus, 1000);

            $('#voipAdvancedSettingsForm').validate({
                submitHandler:function () {
                    vm.save();
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



