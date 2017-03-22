/**
 * @module system_security
 * @class system_security
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

function($, ko, config, service, _) {

    /**
     * system security VM
     * @class SysSecurityModeVM
     */
	function SysSecurityModeVM() {
        var self = this;
        var info = getSysSecurity();

        self.remoteFlag = ko.observable(info.remoteFlag);
        self.pingFlag = ko.observable(info.pingFlag);

        self.clear = function() {
            init();
        };

        self.save = function() {
            showLoading();
            var params = {};
            params.remoteFlag = self.remoteFlag();
            params.pingFlag = self.pingFlag();
            service.setSysSecurity(params, function(result) {
                if (result.result == "success") {
                    successOverlay();
                } else {
                    errorOverlay();
                }
            });

        };
    }

    /**
     * 获取system security 信息
     * @method getSysSecurity
     */
    function getSysSecurity() {
        return service.getSysSecurity();
    }

    /**
     * 初始化system security mode view model
     * @method init
     */
	function init() {
		var container = $('#container');
		ko.cleanNode(container[0]);
		var vm = new SysSecurityModeVM();
		ko.applyBindings(vm, container[0]);
        $('#sysSecurityForm').validate({
            submitHandler : function() {
                vm.save();
            }
        });
	}

	return {
		init : init
	};
});