/**
 * network_lock 模块
 * @module network_lock
 * @class network_lock
 */
define(['service', 'jquery', 'config/config'], function (service, $, config) {
    var $divLogo;
    var $txtUnlockCode;
    var $unlockTime;
    var $frmNetworkLock;
    var $divNoTimes;

    function unlock() {
        showLoading();
        service.unlockNetwork({
            unlock_network_code: $txtUnlockCode.val()
        }, function (data) {
            $txtUnlockCode.val("");
            if (data && data.result == "success") {
                if(window.location.hash == '#/network_lock') {
                    hideLoading();
                    window.location.hash = '#/home';
                } else {
                    window.location.reload();
                }
            } else {
                var info = service.getNetworkUnlockTimes();
                changePage(info.unlock_nck_time);
                errorOverlay();
            }
        });
    }

    function changePage(leftTimes) {
        if(leftTimes == 0) {
            $divNoTimes.show();
            $divLogo.hide();
            $frmNetworkLock.hide();
        } else {
            $unlockTime.text(leftTimes);
            $divNoTimes.hide();
            $divLogo.show();
            $frmNetworkLock.show();
        }
    }

    function init() {
        $divLogo = $('#divLogo');
        $txtUnlockCode = $('#txtUnlockCode');
        $unlockTime = $('#unlockTime');
        $frmNetworkLock = $('#frmNetworkLock');
        $divNoTimes = $('#divNoTimes');
        $divNoTimes.hide();
        $divLogo.hide();
        $frmNetworkLock.hide();

        if(config.SIM_CARD_STATUS != "modem_imsi_waitnck") {
            if(window.location.hash == '#/network_lock') {
                hideLoading();
                window.location.hash = '#/home';
                return;
            } else {
                window.location.reload();
                return;
            }
        }

        if(!config.NETWORK_UNLOCK_SUPPORT) {
            changePage(0);
        } else {
            var info = service.getNetworkUnlockTimes();
            changePage(info.unlock_nck_time);
        }

        $('#btnUnlockApply').off('click').on('click', function() {
            $frmNetworkLock.submit();
        });

        $frmNetworkLock.validate({
            submitHandler: function () {
                unlock();
            },
            rules: {
                txtUnlockCode: "unlock_code_check"
            }
        });
    }

    return {
        init: init
    };
});