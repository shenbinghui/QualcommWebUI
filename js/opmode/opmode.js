/**
 * operation mode 模块
 * @module opmode
 * @class opmode
 */

define(['knockout', 'service', 'jquery', 'config/config', 'underscore'],
    function (ko, service, $, config, _) {
	
    /**
	 * CurrentOpModeViewMode
	 * @class CurrentOpModeViewMode
	 */   
	
	function CurrentOpModeViewMode(){
		var self = this;
		self.isLoggedIn = ko.observable(false);	
		self.enableFlag = ko.observable(false);

		self.showOpModeWindow = function () {
			showSettingWindow("change_mode", "opmode/opmode_popup", "opmode/opmode_popup", 400, 300, function () {
			});
		};
		self.currentOpMode = ko.observable("0");
		service.getOpMode({}, function(data){
			self.isLoggedIn(data.loginfo == "ok");
			if(data.opms_wan_mode == "DHCP"){
				self.enableFlag(true);
			} else if (data.ppp_status != "ppp_disconnected") {
				self.enableFlag(false);
			} else {
				self.enableFlag(true);
			}
			
			var mode = (data.opms_wan_mode == "DHCP" || data.opms_wan_mode == "STATIC") ? "PPPOE" : data.opms_wan_mode;
				
			var currentOpMode = "";
			switch(mode){
				case "BRIDGE":
					currentOpMode = "opmode_bridge";
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
		});
		setInterval(function(){
			var obj = service.getConnectionInfo();
			if(obj.opms_wan_mode == "DHCP") {
				self.enableFlag(true);
			} else if(obj.connectStatus != "ppp_disconnected") {
				self.enableFlag(false);
			} else {
				self.enableFlag(true);
			}
		}, 1000);
	}

	/**
	 * 初始化 ViewModel，并进行绑定
	 * @method init
	 */
	function init() {
		var container = $('#currentOpMode')[0];
        ko.cleanNode(container);
        var vm = new CurrentOpModeViewMode();
        ko.applyBindings(vm, container);
		//ko.applyBindings(new CurrentOpModeViewMode(), $("#currentOpMode")[0]);
	}

	return {
		init:init
	};
});
