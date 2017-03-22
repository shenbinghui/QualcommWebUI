define(function() {
    var config = {
        PRODUCT_TYPE: 'UFI',
        LOGIN_SECURITY_SUPPORT: true,
        PASSWORD_ENCODE: true,
        HAS_MULTI_SSID: false,
        IPV6_SUPPORT: true,
        WIFI_BANDWIDTH_SUPPORT: true,
        AP_STATION_SUPPORT: false,
        WIFI_BAND_SUPPORT: true,
        MAX_STATION_NUMBER: 8,
        WEBUI_TITLE: 'Mobile WiFi',
        HAS_USSD:false,// 是否支持USSD功能,
        WIFI_HAS_5G:false,
        FAST_BOOT_SUPPORT: true, //是否支持快速开机
        TURN_OFF_SUPPORT: true, //是否支持关机
        WIFI_SWITCH_SUPPORT: true,//是否支持wifi开关
		SD_CARD_SUPPORT: true,//是否支持SD卡
        SMS_MATCH_LENGTH: 11,//短信联系人号码匹配位数，11国内项目，8国际项目
        AUTO_MODES: [ {
            name: 'Automatic',
            value: 'NETWORK_auto'
        }, {
            name: '4G Only',
            value: 'Only_LTE'
        }, {
            name: '3G Only',
            value: 'TD_W'
        }, {
            name: '2G Only',
            value: 'Only_GSM'
        }]
    };

    return config;
});
