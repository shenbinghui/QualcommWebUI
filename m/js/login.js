define(['service', 'config/config', 'router', 'language'], function(service, config, router, language) {
    var loginLockTimer = 0;
    var leftSeconds;
    var uiLoginTimer;
    var loginCount;
    var $lockContainer;
    var $leftUnlockTime;
    var $password;
    var $savePassword;
    var $language;

    var timer = startLoginStatusInterval();
    function startLoginStatusInterval() {
        return setInterval(function () {
            var info = service.getStatusInfo();
            if (!info.isLoggedIn) {
                gotoLogin();
                return;
            }
            lastLoginStatus = service.getStatusInfo().isLoggedIn ? "1" : "0";
        }, 1000);
    }

    function gotoLogin() {
        if (window.location.hash != '#/login') {
            if (!manualLogout && lastLoginStatus == "1") {
                manualLogout = false;
                lastLoginStatus = 'UNREAL';
                showAlert('need_login_again', function () {
                    window.location = "index.html";
                });
            }
            else if (lastLoginStatus == 'UNREAL') {
                //do nothing, only popup need_login_again alert one time
                return;
            }
            else {
                window.location = "index.html";
            }
        }
    }

    function initLanguage() {
        var currentLan = language.getLanguage().Language;
        language.setLocalization(currentLan);
        $language.val(currentLan);

        $language.off('change').on('change', function() {
            var lan = $(this).val();
            service.setLanguage({Language: lan}, function() {
                language.setLocalization(lan);
            });
        })
    }

    function init() {
        var $container = $('#container');

        $lockContainer = $('#lockContainer', $container);
        $leftUnlockTime = $('#leftUnlockTime', $container);
        $password = $('#password', $container);
        $savePassword = $('#savePassword', $container);
        $language = $('#language');

        leftSeconds = 0;
        uiLoginTimer = 0;
        loginCount = 0;
        $lockContainer.hide();

        initLanguage();

        $('#loginBtn').off('click').on('click', function() {
            $('#formLogin').submit();
        });

        $('#formLogin').validate({
            submitHandler:function () {
                doLogin();
            }
        });

        checkLoginData('init');
    }

    function doLogin() {
        if(loginCount == config.MAX_LOGIN_COUNT && leftSeconds != '-1'){
            showAlert("password_error_account_lock_time");
            $password.val("");
            return false;
        }

        window.clearInterval(timer);
        service.login({
           password: $password.val(),
           save_login: $savePassword.is(':checked')? "1" : "0"
        }, function(data) {
            setTimeout(function () {
                timer = startLoginStatusInterval();
            }, 1300);
            if (data.result) {
                //setCookieRememberPassword(self.rememberPassword(), self.password());
                config.isLogin = true;
                loginCount = 0;
                uiLoginTimer= 300;
                window.clearInterval(loginLockTimer);
                if(config.SIM_CARD_STATUS == "modem_imsi_waitnck") {
                    router.redirectTo('network_lock');
                } else {
                    router.redirectTo('nosimcard');
                }
            } else {
                $password.val("");
                checkLoginData(function(){
                    if (loginCount == config.MAX_LOGIN_COUNT) {
                        showAlert("password_error_five_times");
                        startLoginLockInterval();
                    } else {
                        showAlert({msg: 'password_error_left', params: [config.MAX_LOGIN_COUNT - loginCount]});
                    }
                });
            }
        });
    }

    function checkLoginData(cb){
        service.getLoginData({}, function(r){
            var failTimes = parseInt(r.psw_fail_num_str, 10);
            loginCount = config.MAX_LOGIN_COUNT - failTimes;
            leftSeconds = r.login_lock_time;
            uiLoginTimer = r.login_lock_time;

            if(cb == 'init') {
                var saveLogin = r.save_login;
                if(saveLogin == "1") {
                    $password.val(r.psw_save);
                    $savePassword.prop('checked', true).checkboxradio('refresh');
                }
            }

            if($.isFunction(cb)){
                cb();
            } else if (loginCount == config.MAX_LOGIN_COUNT) {
                startLoginLockInterval();
            }
        });
    }

    function startLoginLockInterval() {
        loginLockTimer = setInterval(function () {
            service.getLoginData({}, function (data) {
                if (data.login_lock_time <= 0 || data.psw_fail_num_str == 3) {
                    loginCount = 0;
                    window.clearInterval(loginLockTimer);
                }
                if(leftSeconds != data.login_lock_time){
                    leftSeconds = data.login_lock_time;
                    uiLoginTimer = data.login_lock_time;
                } else {
                    uiLoginTimer = uiLoginTimer > 0 ? uiLoginTimer - 1 : 0;
                }

                showLockTimeInfo();
            });
        }, 1000);
    }

    function showLockTimeInfo() {
        if(loginCount == config.MAX_LOGIN_COUNT && leftSeconds != '-1') {
            $lockContainer.show();
            var formatted = transSecond2Time(uiLoginTimer);
            $leftUnlockTime.text(formatted.substring(formatted.indexOf(':') + 1, formatted.length));
        } else {
            $lockContainer.hide();
        }
    }

    return {
        init: init
    }
});

