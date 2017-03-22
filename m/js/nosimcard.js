/**
 * pin 模块
 */
define(['knockout', 'service', 'jquery', 'config/config'], function (ko, service, $, config) {

    var pageState = {NO_SIM: 0, WAIT_PIN: 1, WAIT_PUK: 2, PUK_LOCKED: 3, LOADING: 4};
    var currentState;

    var $pin;
    var $puk;
    var $newPin;
    var $confirmPIN;
    var $pinNumber;
    var $pukNumber;

    var $divNoSim;
    var $frmPIN;
    var $frmPUK;
    var $divPukLock;
    var $morePin;
    var $lastPin;
    var $morePuk;
    var $lastPuk;
    var $pinError;
    var $pukError;
    var $divLogo;
    var $copyright;

    /**
     * 验证输入PIN事件处理
     *
     * @event enterPIN
     */
    function enterPIN() {
        showLoading();
        currentState = pageState.LOADING;
        var pin = $pin.val();
        service.enterPIN({
            PinNumber: pin
        }, function (data) {
            if (!data.result) {
                hideLoading();
                refreshPage();
                $pinError.show();
                $pin.val('');
            }
            refreshPage();
            if (currentState == pageState.WAIT_PUK) {
                hideLoading();
            }
        });
    }

    /**
     * 输入PUK设置新PIN事件处理
     *
     * @event enterPUK
     */
    function enterPUK() {
        showLoading();
        currentState = pageState.LOADING;
        var params = {};
        params.PinNumber = $newPin.val();
        params.PUKNumber = $puk.val();
        service.enterPUK(params, function (data) {
            if (!data.result) {
                hideLoading();
                refreshPage();
                $pukError.show();
                $puk.val('');
                $newPin.val('');
                $confirmPIN.val('');
            } else {
                refreshPage();
                if (currentState == pageState.PUK_LOCKED) {
                    hideLoading();
                }
            }
        });
    }
    /**
     * 刷新页面状态
     *
     * @method refreshPage
     */
    function refreshPage() {
        var data = service.getLoginData();
        var state = computePageState(data);
        if (state == pageState.LOADING) {
            addTimeout(refreshPage, 500);
        } else {
            changePage(state, data.pinnumber, data.puknumber);
        }
    }

    function changePage(state, pinNumber, pukNumber) {
        currentState = state;
        $pinNumber.text(pinNumber);
        $pukNumber.text(pukNumber);
        $divNoSim.hide();
        $frmPIN.hide();
        $frmPUK.hide();
        $divPukLock.hide();
        $morePin.hide();
        $lastPin.hide();
        $morePuk.hide();
        $lastPuk.hide();
        $divLogo.hide();
        $copyright.hide();
        if(state == pageState.NO_SIM) {
            $divNoSim.show();
        } else if(state == pageState.WAIT_PIN) {
            $frmPIN.show();
            $divLogo.show();
            $copyright.show();
            if(pinNumber > 1) {
                $morePin.show();
            } else {
                $lastPin.show();
            }
        } else if(state == pageState.WAIT_PUK) {
            $frmPUK.show();
            $divLogo.show();
            $copyright.show();
            if(pukNumber > 1) {
                $morePuk.show();
            } else {
                $lastPuk.show();
            }
        } else if(state == pageState.PUK_LOCKED) {
            $divPukLock.show();
        }
    }

    /**
     * 根据登录状态和SIM卡状态设置页面状态
     * @method computePageState
     */
    function computePageState(data) {
        var state = data.modem_main_state;
        if (state == "modem_sim_undetected" || state == "modem_undetected" || state == "modem_sim_destroy") {
            return pageState.NO_SIM;
        } else if ($.inArray(state, config.TEMPORARY_MODEM_MAIN_STATE) != -1) {
            return pageState.LOADING;
        } else if (state == "modem_waitpin") {
            return pageState.WAIT_PIN;
        } else if ((state == "modem_waitpuk" || data.pinnumber == 0) && (data.puknumber != 0)) {
            return pageState.WAIT_PUK;
        } else if ((data.puknumber == 0 || state == "modem_sim_destroy")
            && state != "modem_sim_undetected" && state != "modem_undetected") {
            return pageState.PUK_LOCKED;
        } else {
            if(window.location.hash == '#/nosimcard') {
                hideLoading();
                window.location.hash = '#/home';
            } else {
                window.location.reload();
            }
        }
    }

    function init() {
        $pin = $('#txtPIN');
        $puk = $('#txtPUK');
        $newPin = $('#txtNewPIN');
        $confirmPIN = $('#txtConfirmPIN');
        $pinNumber = $('#pinNumber');
        $pukNumber = $('#pukNumber');

        $divNoSim = $('#divNoSim');
        $frmPIN = $('#frmPIN');
        $frmPUK = $('#frmPUK');
        $divPukLock = $('#divPukLock');
        $morePin = $('#morePin');
        $lastPin = $('#lastPin');
        $morePuk = $('#morePuk');
        $lastPuk = $('#lastPuk');
        $pinError = $('#pinError');
        $pukError = $('#pukError');
        $divLogo = $('#divLogo');
        $copyright = $('#copyright');

        var info = service.getLoginData();
        var state = computePageState(info);
        changePage(state, info.pinnumber, info.puknumber);

        if (state == pageState.LOADING) {
            addTimeout(refreshPage, 500);
        }

        $('#btnPinApply').off('click').on('click', function() {
            $frmPIN.submit();
        });

        $('#btnPUKApply').off('click').on('click', function() {
            $frmPUK.submit();
        });

        $frmPIN.validate({
            submitHandler: function () {
                enterPIN();
            },
            rules: {
                txtPIN: "pin_check"
            }
        });

        $frmPUK.validate({
            submitHandler: function () {
                enterPUK();
            },
            rules: {
                txtNewPIN: "pin_check",
                txtConfirmPIN: {equalToPin: "#txtNewPIN"},
                txtPUK: "puk_check"
            }
        });
    }

    return {
        init: init
    };
});