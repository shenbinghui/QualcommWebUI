define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

function($, ko, config, service, _) {

    function FirewallVM() {
        var self = this;
        self.isCPE = config.PRODUCT_TYPE == 'CPE';
		self.hasUssd = config.HAS_USSD;
		self.hasUsb = config.HAS_USB;
		self.hasUrlFilter = config.HAS_URL;
		self.hasUpdateCheck = config.HAS_UPDATE_CHECK;
    }

	function init() {
        var container = $('#container');
        ko.cleanNode(container[0]);
        var vm = new FirewallVM();
        ko.applyBindings(vm, container[0]);
    }

	return {
		init : init
	};
});