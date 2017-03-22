/**
 * reboot 模块
 * @module reboot
 * @class reboot
 */

define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

    function ($, ko, config, service, _) {
        /**
         * reboot
         * @class rebootVM
         */
        function rebootVM(){
            var self = this;
            leftMenuClick("menu_settings");

            //重启设备
            self.restart = function(){
                showConfirm("restart_confirm", function () {
                    showLoading("restarting");
                    service.restart({}, function (data) {
                        if (data && data.result == "success") {
                            successOverlay();
                        } else {
                            errorOverlay();
                        }
                    }, $.noop);
                });
            }
        }

        /**
         * 初始化 ViewModel，并进行绑定
         * @method init
         */
        function init() {
            var vm = new rebootVM();
            ko.applyBindings(vm, $('#container')[0]);
        }

        return {
            init:init
        }
    });
