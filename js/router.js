/**
 * @module router
 * @class router
 */
define([
    'config/menu',
    'jquery',
    'config/config',
    'service',
    'underscore'],
function(menu, $, config, service,_) {
	var currentHash = '';
	var container = $('#container');

    /**
     * 默认入口页面为#home, 定时检查hash状态
     * @method init
     */
	function init() {
		checkSimCardStatus();
		window.location.hash = window.location.hash || "#home";
		//if(window.location.hash == "#home"){
			//初始化第一个页面菜单class			
			//alert(window.location.hash.substr(1));		
			//if(window.location.hash.substr(1) == "sim_messages" || window.location.hash.substr(1) == "sms_setting"){				
			//	$("#sms_menu").addClass('active');
			//}
			if(window.location.hash.substr(1)=="dial_setting"||window.location.hash.substr(1)=="apn_setting"||window.location.hash.substr(1)=="net_select"||window.location.hash.substr(1)=="wifi_main"){
				$("#home_menu").removeClass('active');
				$("#sms_menu").removeClass('active');
				$("#statistic_menu").removeClass('active');
				$("#quick_setting_menu").addClass('active');
				$("#sdcard_menu").removeClass('active');
			}
			else if(window.location.hash.substr(1)=="wifi_advance"||window.location.hash.substr(1)=="black_list"||window.location.hash.substr(1)=="port_map"){
				$("#home_menu").removeClass('active');
				$("#sms_menu").removeClass('active');
				$("#statistic_menu").removeClass('active');
				$("#quick_setting_menu").addClass('active');
				$("#sdcard_menu").removeClass('active');
			}
			else if(window.location.hash.substr(1)=="router_setting"||window.location.hash.substr(1)=="wps"||window.location.hash.substr(1)=="pin_management"||window.location.hash.substr(1)=="port_filter"){
				$("#home_menu").removeClass('active');
				$("#sms_menu").removeClass('active');
				$("#statistic_menu").removeClass('active');
				$("#quick_setting_menu").addClass('active');
				$("#sdcard_menu").removeClass('active');
			}
			else if(window.location.hash.substr(1)=="deviceinformation"||window.location.hash.substr(1)=="modifypassword"||window.location.hash.substr(1)=="devicerestore"||window.location.hash.substr(1)=="reboot"){
				$("#home_menu").removeClass('active');
				$("#sms_menu").removeClass('active');
				$("#statistic_menu").removeClass('active');
				$("#quick_setting_menu").addClass('active');
				$("#sdcard_menu").removeClass('active');			
			}
			else if(window.location.hash.substr(1)=="quick_setting"){
				$("#home_menu").removeClass('active');
				$("#sms_menu").removeClass('active');
				$("#statistic_menu").removeClass('active');
				$("#quick_setting_menu").addClass('active');
				$("#sdcard_menu").removeClass('active');			
			}
			else if(window.location.hash.substr(1) == "sms" || window.location.hash.substr(1) == "sim_messages" || window.location.hash.substr(1) == "sms_setting"){	
				$("#home_menu").removeClass('active');
				$("#sms_menu").addClass('active');
				$("#statistic_menu").removeClass('active');
				$("#quick_setting_menu").removeClass('active');
				$("#sdcard_menu").removeClass('active');
			}	
			else if(window.location.hash.substr(1)=="httpshare"){
				$("#home_menu").removeClass('active');
				$("#sms_menu").removeClass('active');
				$("#statistic_menu").removeClass('active');
				$("#quick_setting_menu").removeClass('active');
				$("#sdcard_menu").addClass('active');
			}
			else if(window.location.hash.substr(1)=="statistic"){
				$("#home_menu").removeClass('active');
				$("#sms_menu").removeClass('active');
				$("#statistic_menu").addClass('active');
				$("#quick_setting_menu").removeClass('active');
				$("#sdcard_menu").removeClass('active');
			}
			else if(window.location.hash.substr(1)=="home"){
				$("#home_menu").addClass('active');
				$("#sms_menu").removeClass('active');
				$("#statistic_menu").removeClass('active');
				$("#quick_setting_menu").removeClass('active');
				$("#sdcard_menu").removeClass('active');
			}
			//if(window.location.hash.substr(1) =="dial_setting" || window.location.hash.substr(1) =="quick_setup"){
			//$("#quick_setting").addClass('active');
			//}
			else{
				$("#"+window.location.hash.substr(1)+"_menu").addClass('active');
			}
			
		//}
        //if support onhashchange then use. If ie8 in ie7 mode, it doesn't trigger onhashchange.
        if(('onhashchange' in window) && ((typeof document.documentMode==='undefined') || document.documentMode==8)) {
            window.onhashchange = hashCheck;
            hashCheck();
        } else {
            setInterval(hashCheck, 200);
        }

        //如果修改了页面内容, 离开时给出提示
        $("a[href^='#']").die('click').live('click', function() {
            var $this = $(this);
            config.CONTENT_MODIFIED.checkChangMethod();
            return checkFormContentModify($this.attr('href'));
        });
	}

    checkFormContentModify = function(href){
        if(config.CONTENT_MODIFIED.modified && window.location.hash != href) {
            if(config.CONTENT_MODIFIED.message == 'sms_to_save_draft'){
                config.CONTENT_MODIFIED.callback.ok(config.CONTENT_MODIFIED.data);
                config.resetContentModifyValue();
                window.location.hash = href;
            } else {
                showConfirm(config.CONTENT_MODIFIED.message, {ok: function() {
                    config.CONTENT_MODIFIED.callback.ok(config.CONTENT_MODIFIED.data);
                    config.resetContentModifyValue();
                    window.location.hash = href;
                }, no: function(){
                    var result = config.CONTENT_MODIFIED.callback.no(config.CONTENT_MODIFIED.data);
                    if(!result) {
                        window.location.hash = href;
                        config.resetContentModifyValue();
                    }
                }});
            }
            return false;
        } else {
			//移除本次菜单的class 新增下个菜单的class
			$("#"+window.location.hash.substr(1)+"_menu").removeClass('active');
			if(href=="#dial_setting"||href=="#apn_setting"||href=="#net_select"||href=="#wifi_main"||href=="#wifi_advance"){
				$("#home_menu").removeClass('active');
				$("#sms_menu").removeClass('active');
				$("#statistic_menu").removeClass('active');
				$("#quick_setting_menu").addClass('active');
				$("#sdcard_menu").removeClass('active');
			}
			else if(href=="#black_list"||href=="#router_setting"||href=="#wps"||href=="#pin_management"||href=="#port_filter"){
				$("#home_menu").removeClass('active');
				$("#sms_menu").removeClass('active');
				$("#statistic_menu").removeClass('active');
				$("#quick_setting_menu").addClass('active');
				$("#sdcard_menu").removeClass('active');
			}
			else if(href=="#port_map"||href=="#deviceinformation"||href=="#modifypassword"||href=="#devicerestore"||href=="#reboot"){
				$("#home_menu").removeClass('active');
				$("#sms_menu").removeClass('active');
				$("#statistic_menu").removeClass('active');
				$("#quick_setting_menu").addClass('active');
				$("#sdcard_menu").removeClass('active');				
			}
			else if(href=="#quick_setting"){
				$("#home_menu").removeClass('active');
				$("#sms_menu").removeClass('active');
				$("#statistic_menu").removeClass('active');
				$("#quick_setting_menu").addClass('active');
				$("#sdcard_menu").removeClass('active');			
			}
			else if(href == "#sms" || href == "#sim_messages" || href == "#sms_setting"){	
				$("#home_menu").removeClass('active');
				$("#sms_menu").addClass('active');
				$("#statistic_menu").removeClass('active');
				$("#quick_setting_menu").removeClass('active');
				$("#sdcard_menu").removeClass('active');
			}	
			else if(href=="#statistic"){
				$("#home_menu").removeClass('active');
				$("#sms_menu").removeClass('active');
				$("#statistic_menu").addClass('active');
				$("#quick_setting_menu").removeClass('active');
				$("#sdcard_menu").removeClass('active');
			}
			else if(href=="#httpshare"){
				$("#home_menu").removeClass('active');
				$("#sms_menu").removeClass('active');
				$("#statistic_menu").removeClass('active');
				$("#quick_setting_menu").removeClass('active');
				$("#sdcard_menu").addClass('active');
			}
			else if(href=="#home"){
				$("#home_menu").addClass('active');
				$("#sms_menu").removeClass('active');
				$("#statistic_menu").removeClass('active');
				$("#quick_setting_menu").removeClass('active');
				$("#sdcard_menu").removeClass('active');
			}
			$(href+"_menu").addClass('active');			
            return true;
        }
    };

    /**
     * 定时查看SIM卡的状态，若当前SIM卡状态不为就绪状态且未显示
     * nosimcard页面，则显示nosimcard页面
     * 以避免不关闭webui，重新插拔设备后，不再判断SIM卡状态的问题
     * @method checkSimCardStatus
     */
    function checkSimCardStatus(){
        setInterval(function(){
            var data = service.getStatusInfo();
            var match = menu.findMenu();
            if(match.length == 0){
                return false;
            }
            var requirePinHash = ["phonebook/phonebook", "sms/smslist"];
            var isRequirePin = ($.inArray(match[0].path, requirePinHash) != -1);
            if (match[0].checkSIMStatus === true) {
                var simstatus = data.simStatus == "modem_sim_undetected"
                    || data.simStatus == "modem_sim_destroy" || data.simStatus == "modem_waitpin"
                    || data.simStatus == "modem_waitpuk";
                var netlockstatus = data.simStatus == "modem_imsi_waitnck";
                if (data.isLoggedIn && (
                        ($('#div-nosimcard')[0] == undefined && simstatus)
                        || ($('#div-network-lock')[0] == undefined && netlockstatus)
                    ||(($('#div-nosimcard')[0] != undefined || $('#div-network-lock')[0] != undefined)&&data.simStatus == "modem_init_complete"))
                    ) {
                    //fixedLoadResources(match[0], data.simStatus, isRequirePin);
                }
            }
        }, 1000);
    }

	/**
	 * 检查登录页面背景
	 * @method checkLoginPageBg
	 */
	function checkLoginPageBg(){
        var h = window.location.hash;
       // if (h == '#login' || _.indexOf(config.GUEST_HASH, h) != -1) {
       //     $("#themeContainer").attr("style","margin-top:-36px;");
	   //		$("#indexContainer").attr("style","margin-top:30px;");			
       // }else{
            $("#themeContainer").attr("style","margin-top:0px;");
       // }

		if(window.location.hash == '#login'){
			$("#mainContainer").addClass('loginBackgroundBlue');
		} else {
			var mainContainer = $("#mainContainer");
			if(mainContainer.hasClass('loginBackgroundBlue')){
				$("#container").css({margin: 0});
				mainContainer.removeClass('loginBackgroundBlue').height('auto');
			}
		}
	}

    /**
     * 比对hash状态, 如果变化则根据新的hash匹配菜单配置,
     * 匹配不上时跳转到home页面, 匹配上时记录hash值并动态加载
     * 对应的资源文件
     * @method hashCheck
     */
    function hashCheck() {
		if(window.location.hash != currentHash) {
            //解决登陆后后退问题, 登陆用户访问非登录用户时页面不跳转
            var info = service.getStatusInfo();
            if (window.location.hash == config.defaultRoute || _.indexOf(config.GUEST_HASH, window.location.hash) != -1) {
                if (info.isLoggedIn) {
                    window.location.hash = currentHash == "" ? "#home" : currentHash;
                    return;
                }
            }

			var match = menu.findMenu();
			if(match.length == 0) {
				window.location.hash = config.defaultRoute;
			} else {
                //TODO: 二级菜单与对应三级菜单第一项互相切换时不重新加载数据, 与下面的TODO: click the same menu 实现方式互斥
                var oldMenu = menu.findMenu(currentHash);
                currentHash = match[0].hash;
                if(currentHash == "#login") {
                    $('#indexContainer').addClass('login-page-bg');
                    menu.rebuild();
                } else {
                    $('#indexContainer').removeClass('login-page-bg');
                }

                if(oldMenu.length != 0 && match[0].path == oldMenu[0].path && match[0].level != oldMenu[0].level && match[0].level != '1' && oldMenu[0].level != '1') {
                    return;
                }

                //TODO: click the same menu
//                $('a[href=' + currentHash + ']').die('click').live('click', function() {
//                    if(window.location.hash == currentHash) {
//                        require([match[0].path], function(vm) {
//                            clearValidateMsg();
//                            vm.init();
//                        });
//                    }
//                });

                checkLoginPageBg();
                var requirePinHash = ["phonebook/phonebook", "sms/smslist"];
                var isRequirePin = ($.inArray(match[0].path, requirePinHash) != -1);
                if (match[0].checkSIMStatus === true || isRequirePin) {
                    //simStatus is undefined when refreshing page
                    if (info.simStatus == undefined) {
                        showLoading('waiting');
                        function checkSIM() {
                            var data = service.getStatusInfo();
                            if (data.simStatus == undefined || $.inArray(data.simStatus, config.TEMPORARY_MODEM_MAIN_STATE) != -1) {
                                addTimeout(checkSIM, 500);
                            } else {
                                fixedLoadResources(match[0], data.simStatus, isRequirePin);
                                hideLoading();
                            }
                        }

                        checkSIM();
                    } else {
                        fixedLoadResources(match[0], info.simStatus, isRequirePin);
                    }
                } else {
                    loadResources(match[0]);
                }
            }
		}
	}

    function fixedLoadResources(menuItem, simStatus, isRequirePin) {
        var item = {};
        $.extend(item, menuItem);
        //没有SIM卡时，针对home页面不做处理。
        //网络被锁时，home页面显示解锁页面
        if (simStatus == "modem_sim_undetected" || simStatus == "modem_sim_destroy") {
            if (!isRequirePin) {
                item.path = "nosimcard";
            }
        } else if (simStatus == "modem_waitpin" || simStatus == "modem_waitpuk") {
          //  item.path = "nosimcard";
        } else if (simStatus == "modem_imsi_waitnck") {
            item.path = "network_lock";
        }
        //load tmpl and controller js
        loadResources(item);
    }

    //TODO: prevent first menu click cover the second menu content, need test with device
    //var loadInterrupt;
    /**
     * 根据菜单配置item加载对应的资源
     * @method loadResources
     * @param {Object} item 菜单对象
     */
    function loadResources(item) {
        var pId = item.path.replace(/\//g, '_');
        var $body = $('body').removeClass();
        if (pId != 'login' && pId != 'home') {
            $body.addClass('beautiful_bg page_' + pId);
        } else {
            $body.addClass('page_' + pId);
        }
        clearTimer();
        hideLoading();
        var tmplPath = 'text!tmpl/' + item.path + '.html';
        //TODO: prevent first menu click cover the second menu content, need test with device
        //loadInterrupt = false;
        require([tmplPath, item.path], function (tmpl, viewModel) {
            //TODO: prevent first menu click cover the second menu content, need test with device
//            if(loadInterrupt) {
//                return;
//            }
//            loadInterrupt = true;
            //window.document.title = $.i18n.prop(window.location.hash.substring(1)) + ' - ' + config.WEBUI_TITLE;
            container.stop(true, true);
            container.hide();
            container.html(tmpl);
            viewModel.init();
            //support backward/forward
            menu.refreshMenu();
            $('#container').translate();
            menu.activeSubMenu();

            $("form").attr("autocomplete", "off");
            container.fadeIn();
            //$('input:visible:enabled:first', '#container').focus();
		});
	}

	return {
		init: init
	};
});