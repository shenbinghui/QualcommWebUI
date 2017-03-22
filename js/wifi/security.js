/**
 * @module security
 * @class security
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

function($, ko, config, service, _) {

	var securityModes = _.map(config.AUTH_MODES, function(item) {
		return new Option(item.name, item.value);
	});

    /**
     * wifi安全view model
     * @class SecurityVM
     */
	function SecurityVM() {
		var self = this;
		var info = getSecurityInfo();

		self.modes = ko.observableArray(securityModes);
		self.selectedMode = ko.observable(info.AuthMode);
		self.passPhrase = ko.observable(info.passPhrase);
        self.wpsFlag = ko.observable('');

		self.clear = function() {
            clearTimer();
			init();
			clearValidateMsg();
		};

		self.save = function() {
            if(self.wpsFlag() == '1') {
                showAlert('wps_on_info');
                return;
            }

			showLoading();
			var params = {};
			params.AuthMode = self.selectedMode();
			params.passPhrase = self.passPhrase();
			service.setSecurityInfo(params, function(result) {
				if (result.result == "success") {
					successOverlay();
                    self.clear();
				} else {
					errorOverlay();
				}
			});
		};

        /**
         * 刷新wps信息
         * @method refreshStatus
         *
         */
        self.refreshStatus = function() {
            var status = getWpsInfo();
            self.wpsFlag(status.wpsFlag);
        };

        self.refreshStatus();
	}

    /**
     * 获取wifi安全信息
     * @method getSecurityInfo
     * @return {Object}
     */
	function getSecurityInfo() {
		return service.getSecurityInfo();
	}

    /**
     * 获取wps信息
     * @method getWpsInfo
     */
    function getWpsInfo() {
        return service.getWpsInfo();
    }

    /**
     * 初始化wifi安全view model
     * @method init
     */
	function init() {
		var container = $('#container');
		ko.cleanNode(container[0]);
		var vm = new SecurityVM();
		ko.applyBindings(vm, container[0]);
		$('#securityForm').validate({
			submitHandler : function() {
				vm.save();
			}
		});

        addInterval(vm.refreshStatus, 1000);
	}

	return {
		init : init
	};
});