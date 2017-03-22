define(['service'], function(service) {
    var $fastboot;

    function init() {
        $fastboot = $('#fastboot');
//        service.getDeviceInfo({}, function(data) {
//            $('#version').text(data.fw_version);
//        });

        var info = service.getFastbootSetting();
        if(info.fastbootEnabled == "1") {
            $fastboot.prop("checked", true);
        }

        $fastboot.off('click').on('click', function() {
            showLoading();
            var params = {};
            params.fastbootEnabled = $fastboot.is(':checked')? "1" : "0";
            service.setFastbootSetting(params, function(result) {
                if (result.result == "success") {
                    successOverlay();
                } else {
                    errorOverlay();
                }
            });
        });

        $('#restartDevice').off('click').on('click', function() {
            showConfirm('restart_confirm', function() {
                showLoading("restarting");
                service.restart({}, function (data) {
                    if (data && data.result == "success") {
                        successOverlay();
                    } else {
                        errorOverlay();
                    }
                }, $.noop);
            });
        });

        $('#shutDownDevice').off('click').on('click', function() {
            showConfirm('restart_confirm', function() {
                //TODO: 暂时无接口
//                service.shutdown({}, function (data) {
//
//                }, $.noop);
            });

        });
    }


    return {
        init: init
    }
});
