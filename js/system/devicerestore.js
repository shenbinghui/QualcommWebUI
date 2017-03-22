/**
 * devicerestore 模块
 * @module devicerestore
 * @class devicerestore
 */

define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

    function ($, ko, config, service, _) {
        /**
         * devicerestoreViewModel
         * @class devicerestoreVM
         */
        function devicerestoreVM(){
            var self = this;
            leftMenuClick("menu_settings");
            /**
             * 恢复出厂设置
             * @event restore
             */
            self.restore = function () {
//                var connectStatus = service.getConnectionInfo().connectStatus;
//                if (checkConnectedStatus(connectStatus)) {
//                    showAlert("restore_when_connected");
//                    return;
//                }
                showConfirm("restore_confirm", function () {
                    showLoading("restoring");
                    service.restoreFactorySettings({}, function (data) {
                        if (data && data.result == "success") {
                            successOverlay();
                        } else {
                            errorOverlay();
                        }
                    }, function (result) {
                        if (isErrorObject(result) && result.errorType == 'no_auth') {
                            errorOverlay();
                        }
                    });
                });
            };

        }

        /**
         * 初始化 ViewModel，并进行绑定
         * @method init
         */
        function init() {
            var vm = new devicerestoreVM();
            ko.applyBindings(vm, $('#container')[0]);
        }

        return {
            init:init
        }
    });
