/**
 * 工作模式切换 模块
 * @module opmode
 * @class opmode
 */
define([ 'jquery', 'config/config', 'service', 'knockout' ], function($, config, service, ko) {
	/**
	 * opModeViewModel
	 * @class opModeViewModel
	 */
	function opModeViewModel() {
		var self = this;
		self.selectedMode = ko.observable("0");
		self.selectedPort = ko.observable("0");
		self.port1Class = ko.observable("image_white");
		self.port2Class = ko.observable("image_white");
		self.port3Class = ko.observable("image_white");
		self.port4Class = ko.observable("image_white");
		service.getOpMode({}, function(data){
			var mode = (data.opms_wan_mode == "DHCP" || data.opms_wan_mode == "STATIC") ? "PPPOE" : data.opms_wan_mode;
			self.selectedMode(mode);
			switch(data.port_status){
				case "1000":
					self.port1Class("image_green");
					break;
				case "0100":
					self.port2Class("image_green");
					break;
				case "0010":
					self.port3Class("image_green");
					break;
				case "0001":
					self.port4Class("image_green");
					break;
				default:
					break;
			}
		});
		
	}
		
	function init() {
		var container = $('#container')[0];
		ko.cleanNode(container);
		var vm = new opModeViewModel();
		ko.applyBindings(vm, container);
		
	};

	return {
		init : init
	};
});