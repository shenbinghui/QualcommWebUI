define(['service', 'config/config'], function(service, config) {
    var $ssidTypeContainer;
    var $ssidType;
    var $securityMode;
    var $ssid;
    var $pass;

    var infoMap = {};

    function initWifiInfo() {
        var info = service.getWifiBasic();
        drawSSIDTypeOption(info);
        initInfoMap('SSID1', info);
        initInfoMap('SSID2', info);
        setFormValues('SSID1');
    }

    function initInfoMap(type, info) {
        var prefix = type == 'SSID1'? '' : 'm_';
        infoMap[type] = {
            "ssid": info[prefix + "SSID"],
            "securityMode": info[prefix + "AuthMode"],
            "password": info[prefix + "passPhrase"],
            "broadcast": info[prefix + "broadcast"] == "1"? "1" : "0",
            "apIsolation": info[prefix + "apIsolation"] == "1"? "1" : "0",
            "selectedStation": info[prefix + "MAX_Access_num"]
        };
    }

    function drawSSIDTypeOption(info) {
        $ssidType.append('<option value="SSID1" data-trans="multi_ssid_1"></option>');
        if(info.multi_ssid_enable == "1"){
            $ssidType.append('<option value="SSID2" data-trans="multi_ssid_2"></option>')
        }
        $ssidType.translate();
    }

    function saveSSID() {
        var status = service.getWpsInfo();
        if (status.wpsFlag == '1') {
            showAlert('wps_on_info');
            return true;
        }

        showConfirm('wifi_disconnect_confirm', function(){
            if($ssidType.val() == 'SSID1') {
                saveSSID1Action();
            } else {
                saveSSID2Action();
            }
        });
    }

    function saveSSID1Action() {
        showLoading();
        var params = {};
        infoMap.SSID1.ssid = $ssid.val();
        infoMap.SSID1.securityMode = $securityMode.val();
        infoMap.SSID1.password = $pass.val();
        params.AuthMode = infoMap.SSID1.securityMode;
        params.passPhrase = infoMap.SSID1.password;
        params.SSID = infoMap.SSID1.ssid;
        params.broadcast = infoMap.SSID1.broadcast;
        params.station = infoMap.SSID1.selectedStation;
        params.cipher = params.AuthMode == "WPA2PSK" ? 1: 2;
        params.NoForwarding = infoMap.SSID1.apIsolation;
        service.setWifiBasic(params, function (result) {
            if (result.result == "success") {
                successOverlay();
            } else {
                errorOverlay();
            }
        });
    }

    function saveSSID2Action() {
        showLoading();
        var params = {};
        infoMap.SSID2.ssid = $ssid.val();
        infoMap.SSID2.securityMode = $securityMode.val();
        infoMap.SSID2.password = $pass.val();
        params.m_AuthMode = infoMap.SSID2.securityMode;
        params.m_passPhrase = infoMap.SSID2.password;
        params.m_SSID = infoMap.SSID2.ssid;
        params.m_broadcast = infoMap.SSID2.broadcast;
        params.m_station = infoMap.SSID2.selectedStation;
        params.m_cipher = params.m_AuthMode == "WPA2PSK" ? 1: 2;
        params.m_NoForwarding = infoMap.SSID2.apIsolation;
        service.setWifiBasic4SSID2(params, function (result) {
            if (result.result == "success") {
                successOverlay();
            } else {
                errorOverlay();
            }
        });
    }

    function setFormValues(type) {
        $ssid.val(infoMap[type].ssid);
        $securityMode.val(infoMap[type].securityMode).trigger('change');
        $pass.val(infoMap[type].password);
    }

    function bindingEvent() {
        $ssidType.off('change').on('change', function() {
            var val = $(this).val();
            setFormValues(val);
        });

        $securityMode.off('change').on('change', function() {
            var val = $(this).val();
            var $passContainer = $('#passContainer');
            var $openInfo = $('#openInfo');
            if(val == 'OPEN') {
                $passContainer.hide();
                $openInfo.show();
                $pass.val('');
            } else {
                $passContainer.show();
                $openInfo.hide();
            }
        });
    }

    function init() {
        $ssidTypeContainer = $('#ssidTypeContainer');
        $ssidType = $('#ssidType');
        $securityMode = $('#securityMode');
        $ssid = $('#ssid');
        $pass = $('#pass');

        if(config.HAS_MULTI_SSID) {
            $ssidTypeContainer.show();
        } else {
            $ssidTypeContainer.hide();
        }

        bindingEvent();
        initWifiInfo();

        var $form = $('#frmWifi');
        $('#wifiSave').click(function() {
            $form.submit();
        });

        $form.validate({
            submitHandler:function () {
                saveSSID();
            },
            rules:{
                ssid:'ssid',
                pass:'wifi_password_check'
            }
        });
    }

    return {
        init: init
    }
});
