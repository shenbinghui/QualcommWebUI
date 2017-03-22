/**
 * @module app
 * @class app
 */
define([
    'config/menu',
    'language',
    'logout',
    'status/statusBar',
    'router',
    'login'],
function(menu, language, logout, statusBar, router, login) {

    /**
     * 初始化系统相关模块
     * @method init
     */
	function init() {
        menu.init();
        language.init();
        router.init();
        logout.init();
		statusBar.init();
	}

	return {
		init: init
	};
});