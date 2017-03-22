define(['service', 'config/config'], function(service, config) {
    var $multiSSID;
    var $wpsMode;
    var $wpsPin;
    var wpsFlag;
    var radioFlag;
    var wpsSSID;
    var $multiSSIDContainer;


    function initWpsInfo() {
        var info = service.getWpsInfo();
        wpsFlag = info.wpsFlag;
        radioFlag = info.radioFlag;
        drawMulSSIDOption(info);
        wpsSSID = getCurrentWpsSsid(info);
        $wpsMode.val(info.wpsType == 'PIN' ? 'PIN' : 'PBC').trigger('change');
    }

    function drawMulSSIDOption(info) {
        $multiSSID.append('<option value="SSID1">' + info.ssid + '</option>');
        if(info.ssidEnable == "1"){
            $multiSSID.append('<option value="SSID2">' + info.multiSSID + '</option>')
        }
    }

    function enableWps() {
        var info = service.getWpsInfo();

        if(info.radioFlag == '0') {
            showAlert('wps_wifi_off');
            return;
        }

        if(info.wpsFlag == '1') {
            showAlert('wps_on_info');
            return true;
        }

        wpsSSID = $multiSSID.val();
        var wpsIndex;
        if(wpsSSID == "SSID1") {
            wpsSSID = info.ssid;
            wpsIndex = 1;
        } else {
            wpsSSID = info.multiSSID;
            wpsIndex = 2;
        }

        var basic=service.getWifiBasic();
        if(wpsSSID==basic.SSID && wpsIndex == 1){
            if(basic.broadcast=='1'){
                showAlert('wps_ssid_broadcast_disable');
                return ;
            }
        }else if(wpsSSID==basic.m_SSID && wpsIndex == 2){
            if(basic.m_broadcast=='1'){
                showAlert('wps_ssid_broadcast_disable');
                return ;
            }
        }

        showLoading();
        var params = {};
        params.wpsType = $wpsMode.val();
        params.wpsPin = change9bitPIN($wpsPin.val());
        params.wpsSSID = wpsSSID;
        params.wpsIndex = wpsIndex;

        service.openWps(params, function(result) {
            if (result.result == "success") {
                $wpsPin.val('');
                clearValidateMsg();
                successOverlay();
            } else {
                errorOverlay();
            }
        });
    }

    function change9bitPIN(value){
        if(value.length == 9) {
            return value.substring(0,4) + value.substring(5);
        } else {
            return value;
        }
    }

    /**
     * 获取当前开启wps的ssid
     * @param info
     * @returns {string}
     */
    function getCurrentWpsSsid(info) {
        if(info.ssid == info.multiSSID) {
            if(info.wifi_wps_index == '2') {
                return "SSID2";
            }else {
                return "SSID1";
            }
        }else {
            return info.wpsSSID == info.multiSSID ? "SSID2" : "SSID1";
        }
    }

    function init() {
        $wpsMode = $('#wpsMode');
        $wpsPin = $('#txtPin');
        $multiSSID = $('#multiSSID');
        $multiSSIDContainer = $('#multiSSIDContainer');
        if(config.HAS_MULTI_SSID) {
            $multiSSIDContainer.show();
        } else {
            $multiSSIDContainer.hide();
        }

        $wpsMode.off('change').on('change', function() {
            var val = $(this).val();
            var $pinContainer = $('#pinContainer');
            if(val == 'PIN') {
                $pinContainer.show();
            } else {
                $pinContainer.hide();
            }
        });

        initWpsInfo();

        var $form = $('#frmWps');
        $('#wpsSave').click(function() {
            $form.submit();
        });

        $form.validate({
            submitHandler : function() {
                enableWps();
            },
            rules: {
                txtPin: {
                    "wps_pin_validator": true
                }
            }
        });
    }

    return {
        init: init
    }
});
