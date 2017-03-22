/**
 * voipSupplementaryServiveForm
 * @module
 * @class
 */
define([ 'jquery', 'knockout', 'config/config', 'service'],
    function ($, ko, config, service) {
        var forwardingModes = _.map(config.FORWARDING_MODES, function (item) {
            return new Option(item.name, item.value);
        });
        function voipSupplementaryServiceVM() {
            var self = this;
            var info = service.getVoipSupplementaryService();
            self.voip_forwarding_modes = ko.observableArray(forwardingModes);
            self.selectedMode = ko.observable(info.selectedMode);
            self.voipForwardingUri = ko.observable(info.voipForwardingUri);
            self.sipProtocolIncomingCallMode = ko.observable(info.sipProtocolIncomingCallMode);
            self.sipProtocolCallWaitingMode = ko.observable(info.sipProtocolCallWaitingMode);

            self.save = function() {
                showLoading();
                var params = {};
                params.goformId = "SIP_SUPPLEMENTARY1";
                params.voip_forwarding_mode = self.selectedMode();
                params.voip_forwarding_uri = self.voipForwardingUri();
                params.voip_not_disturb_enable = self.sipProtocolIncomingCallMode();
                params.voip_call_waiting_in_enable = self.sipProtocolCallWaitingMode();

                service.setVoipSupplementaryService(params, function(result) {
                        if (result.result == "success") {
                            successOverlay();
							showAlert("warn_information");
                        } else {
                            errorOverlay();
                        }
                    }
                );
            };
		}

        function init() {
            var container = $('#container');
            ko.cleanNode(container[0]);
            var vm = new voipSupplementaryServiceVM();
            ko.applyBindings(vm, $('#container')[0]);

            $('#voipSupplementaryServiveForm').validate({
                submitHandler:function () {
                    vm.save();
                },
                rules:{
                    voip_forwarding_uri: {
                        forwarding_uri_check : true
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
})



