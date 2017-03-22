define(function() {
    var config = {
        INCLUDE_MOBILE: false,
        HAS_LOGIN:false,
        HAS_WIFI: false,
        HAS_BATTERY: false,
        GUEST_HASH: [],
        maxApnNumber: 10,
        WEBUI_TITLE: '4G Hostless Modem',
        WIFI_SUPPORT_QR_CODE: false,
        AP_STATION_SUPPORT:false,
        AUTO_MODES: [ {
            name: 'Automatic',
            value: 'NETWORK_auto'
        }, {
            name: '4G Only',
            value: 'Only_LTE'
        }, {
            name: '3G Only',
            value: 'Only_WCDMA'
        }, {
            name: '2G Only',
            value: 'Only_GSM'
        }]
    };

    return config;
});
