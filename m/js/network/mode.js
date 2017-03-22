/**
 * 联网设置模块
 * @module dial_setting
 * @class dial_setting
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],
    function ($, ko, config, service, _) {

        var $modeApply;
        var $widgetState;

        /**
         * 联网设置view model
         * @class DialVM
         */
        function DialVM() {
            var mode = service.getConnectionMode();
            var self = this;

            self.selectMode = ko.observable(mode.connectionMode);
            self.enableFlag = ko.observable(true);
            self.isAllowedRoaming = ko.observable(mode.isAllowedRoaming == 'on');
            var originalRoaming = mode.isAllowedRoaming;

            self.setAllowedRoaming = function () {
                if (!$("#roamBtn").hasClass("disable")) {
                    var checkbox = $("#isAllowedRoaming:checked");
                    if (checkbox && checkbox.length == 0) {
                        self.isAllowedRoaming("on");
                    } else {
                        self.isAllowedRoaming("off");
                    }
                }
            };

            /**
             * 修改联网模式
             * @method save
             */
            self.save = function () {
                if (!self.enableFlag()) {
                    return false;
                }
                showLoading();
                var selectMode = self.selectMode();
                //当选择自动时，下发原先的勾选状态
                if (selectMode == 'auto_dial') {
                    originalRoaming = self.isAllowedRoaming();
                } else {
                    self.isAllowedRoaming(originalRoaming);
                }
                service.setConnectionMode({
                    connectionMode: selectMode,
                    isAllowedRoaming: (self.isAllowedRoaming()=='on'||self.isAllowedRoaming()==true) ? 'on' : 'off'
                }, function (result) {
                    if (result.result == "success") {
                        successOverlay();
                    } else {
                        errorOverlay();
                    }
                });
            };

            self.checkEnable = function () {
                var status = service.getStatusInfo();
                if (checkConnectedStatus(status.connectStatus) || status.connectStatus == "ppp_connecting") {
                    $modeApply.addClass('ui-state-disabled');
                    try {
                        $widgetState.checkboxradio("disable");
                    } catch (ex) {
                        $widgetState.attr("disabled", true);
                    }
                } else {
                    $modeApply.removeClass('ui-state-disabled');
                    try {
                        $widgetState.checkboxradio("enable");
                    } catch (ex) {
                        $widgetState.attr("disabled", false);
                    }
                }
            };

        }

        /**
         * 联网设置初始化
         * @method init
         */
        function init() {
            var container = $('#container');
            ko.cleanNode(container[0]);
            var vm = new DialVM();
            ko.applyBindings(vm, container[0]);

            $modeApply = $('#modeApply');
            $widgetState = $('.widget-state');
            vm.checkEnable();
            addInterval(vm.checkEnable, 1000);
        }

        return {
            init: init
        };
    });