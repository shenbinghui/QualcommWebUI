/**
 * @module router
 * @class router
 */
define(['jquery', 'config/config', 'director'],
    function($, config) {
        var $container = $('#container');
        var router;
        var routes = {
            "/home": loadResources,
            "/login": loadResources,
            "/network/view": loadResources,
            "/network/mode": loadResources,
            "/sms/list": loadResources,
            '/others/view': loadResources,
            '/others/password': loadResources,
            '/wifi/view': loadResources,
            '/wifi/wps': loadResources,
            '/wifi/wifi_setting': loadResources,
            '/nosimcard': loadResources,
            '/traffic/view': loadResources,
            '/traffic/traffic_adjust': loadResources,
            '/traffic/traffic_setting': loadResources,
            '/network_lock': loadResources
        };

        var modeLimitHash = ["network/view", "network/mode", "traffic/view", "traffic/traffic_adjust", "traffic/traffic_setting"];
        var needPinHash = ["network/view", "network/mode", "traffic/view", "traffic/traffic_adjust", "traffic/traffic_setting"];

        /**
         * @method init
         */
        function init() {
            //TODO: routes will be a module to export the menu and the router config

            router = Router(routes);
            router.configure({
                notfound: function() {
                    if(config.isLogin) {
                        redirectTo(config.homeRoute);
                    } else {
                        redirectTo(config.defaultRoute);
                    }

                },
                before: function(){
                    return true;
                }
            });
            router.init();
            if(window.location.hash == "") {
                redirectTo(config.defaultRoute);
            }
        }

        function checkModeLimit(currentPath) {
            if(_.indexOf(modeLimitHash, currentPath) != -1) {
                return "mode_limit";
            }
            return currentPath;
        }

        function checkSimStatus(currentPath) {
            if(_.indexOf(needPinHash, currentPath) != -1) {
                var simStatusArr = ["modem_sim_undetected", "modem_sim_destroy", "modem_waitpin", "modem_waitpuk"];
                var simstatus = _.indexOf(simStatusArr, config.SIM_CARD_STATUS) != -1;
                var temporary = _.indexOf(config.TEMPORARY_MODEM_MAIN_STATE, config.SIM_CARD_STATUS) != -1;
                if(simstatus || temporary) {
                    return "nosimcard";
                }

                if(config.SIM_CARD_STATUS == "modem_imsi_waitnck") {
                    return "network_lock";
                }
            }
            return currentPath;
        }

        /**
         * 根据当前hash加载页面
         */
        function loadResources() {
            clearTimer();
            //util.hideLoading();
			config.lastHash = window.location.hash;
            var modulePath = config.lastHash.slice(2);

            //login check
            if(!config.isLogin && modulePath != config.defaultRoute) {
                redirectTo(config.defaultRoute);
                return;
            } else if(config.isLogin && modulePath == config.defaultRoute) {
                redirectTo(config.homeRoute);
                return;
            }

            if(config.DEVICE_TYPE == 'CPE' && config.DEVICE_MODE != 'PPP') {
                modulePath = checkModeLimit(modulePath);
            }

            modulePath = checkSimStatus(modulePath);

            var tmplPath = 'text!views/' + modulePath + '.html';
            require([tmplPath, modulePath], function (tmpl, viewModel) {
                $container.stop(true, true);
                $container.hide();
                $container.html(tmpl);
                viewModel.init();
                $container.translate();
                $("form").attr("autocomplete", "off");
                //$loading.hide();
				$container.enhanceWithin();
                $container.show();
            });

        }

        function redirectTo(path) {
            router.setRoute(path);
        }

        return {
            init: init,
            redirectTo: redirectTo,
            loadResources: loadResources
        };
    });