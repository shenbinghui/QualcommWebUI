define(function() {
    var config = {
        homeRoute: 'home',
        defaultRoute: 'login',
        isLogin: false,
        isTrafficAlertSet: false, //是否设置了流量提醒
        DEVICE_MODE: '',
        DEVICE_TYPE: 'UFI',
        MAX_LOGIN_COUNT: 5,//最大登录次数，密码输入错误次数到了以后会账户冻结一定时间
        NETWORK_UNLOCK_SUPPORT: false,
        SIM_CARD_STATUS: '',
        HAS_LOGIN: true,
        HAS_BATTERY: true,
        HAS_SMS: true,
        HAS_PHONEBOOK: true,
        HAS_MULTI_SSID: false,
        PASSWORD_ENCODE: true,
        AP_STATION_SUPPORT: false,
		SMS_MATCH_LENGTH: 11,//短信联系人号码匹配位数，11国内项目，8国际项目
        DEVICE_NAME: '',
        TEMPORARY_MODEM_MAIN_STATE:["modem_undetected", "modem_detected", "modem_sim_state", "modem_handover", "modem_imsi_lock", "modem_online", "modem_offline"]
    };

    return config;
});
