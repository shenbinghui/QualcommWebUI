/**
 * operation mode popup ģ��
 * @module opmode
 * @class opmode
 */

define(['knockout', 'service', 'jquery', 'config/config', 'underscore'],
    function (ko, service, $, config, _) {

    /**
	 * opModeViewModel
	 * @class opModeViewModel
	 */
     
    function opModeViewModel() {
		var self = this;
		var mode = "";
		self.selectedMode = ko.observable("0");	
		
		service.getOpMode({}, function(data){
			mode = (data.opms_wan_mode == "DHCP" || data.opms_wan_mode == "STATIC") ? "PPPOE" : data.opms_wan_mode;
			self.selectedMode(mode);
		});
		
		self.changeOpMode = function(){
			var userSelectedMode = $('input:radio[name="opMode"]:checked').val();
			if(userSelectedMode == mode) {
				hidePopupSettingWindow();
				return;
			}
			showConfirm("opmode_msg2", function(){
				service.SetOperationMode({
					opMode: userSelectedMode
				},function(data){
					if (data && data.result == "success") {
						var currentOpMode = "";
						switch(userSelectedMode){
							case "BRIDGE":
								currentOpMode = "opmode_bridge"
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
						successOverlay();						
					} else {
						errorOverlay();
					}
				});
			});
			
		}
		
	}

	/**
	 * ��ʼ�� ViewModel�������а�
	 * @method init
	 */
	function init() {
		var vm = new opModeViewModel();
		ko.applyBindings(vm, $('#popupSettingWindow')[0]);
		
		$("#opmode_form").validate({
			submitHandler: function(){
				vm.changeOpMode();
			}
		});
	}

	return {
		init:init
	};
});
