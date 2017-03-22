define(['service', 'config/config'], function(service, config) {
    var trafficAlertPopuped = false;
    var trafficAlert100Popuped = false;
    var resetTrafficAlertPopuped = false;

    function init() {
        window.setInterval(function() {
            var info = service.getStatusInfo();
            checkTrafficLimitAlert(info);
        }, 1000);
    }

    function checkTrafficLimitAlert(info) {
        if(window.location.hash == '#/login'){
            return false;
        }

        var APStationEnabled = config.AP_STATION_SUPPORT ? service.getStatusInfo().ap_station_enable : 'undefined';
        //先确定Ap Station使能状态再确定用什么方式来提醒
        if (config.AP_STATION_SUPPORT && (typeof APStationEnabled == "undefined" || APStationEnabled ==  '')) {
            service.refreshAPStationStatus({}, $.noop());
            return false;
        }
        APStationEnabled = APStationEnabled == 1;

        var inShow = $(".ui-popup-active:visible").length > 0;
        //未登录，正在提示，已弹出，提醒未开启，（AP Station未开启并且没有联网）
        if (!info.isLoggedIn || inShow || (trafficAlertPopuped && trafficAlert100Popuped)
            || !info.limitVolumeEnable || (!APStationEnabled && !checkConnectedStatus(info.connectStatus))) {
            return false;
        }
        if (resetTrafficAlertPopuped) {
            window.setTimeout(function () {
                resetTrafficAlertPopuped = false;
            }, 2000);
            return false;
        }
        var trafficResult = getTrafficResult(info);
        if (trafficResult.showConfirm) {
            var confirmMsg = null;
            if (trafficResult.usedPercent > 100 && !trafficAlert100Popuped) {
                trafficAlertPopuped = trafficAlert100Popuped = true;
                confirmMsg = {msg: APStationEnabled ? 'traffic_beyond_msg' : 'traffic_beyond_disconnect_msg'};
            } else if (!trafficAlertPopuped) {
                trafficAlertPopuped = true;
                trafficAlert100Popuped = false;
                confirmMsg = {msg: APStationEnabled ? 'traffic_limit_msg' : 'traffic_limit_disconnect_msg',
                    params: [trafficResult.limitPercent]};
            }
            if (confirmMsg != null) {
                if (APStationEnabled) {
                    showAlert(confirmMsg);
                } else {
                    showConfirm(confirmMsg, function () {
                        showLoading("disconnecting");
                        service.disconnect({}, function (data) {
                            if (data.result) {
                                successOverlay();
                            } else {
                                errorOverlay();
                            }
                        });
                    });
                }
            }
        }
        return true;
    }

    function setTrafficAlertPopuped(val){
        trafficAlertPopuped = !!val;
        trafficAlert100Popuped = !!val;
        if(!val){
            resetTrafficAlertPopuped = true;
        }
    }

    function setTrafficAlert100Popuped(val){
        trafficAlert100Popuped = !!val;
        if(!val){
            resetTrafficAlertPopuped = true;
        }
    }

    function getTrafficResult(info){
        var trafficResult = {
            showConfirm : false,
            limitPercent : info.limitVolumePercent
        };
        if(info.limitVolumeType == '1'){
            var monthlyTraffic = parseInt(info.data_counter.monthlySent, 10) + parseInt(info.data_counter.monthlyReceived, 10);
            trafficResult.usedPercent = monthlyTraffic / info.limitVolumeSize * 100;
            if(trafficResult.usedPercent > trafficResult.limitPercent){
                trafficResult.showConfirm = true;
                trafficResult.type = 'data';
            }
        }else{
            trafficResult.usedPercent = info.data_counter.monthlyConnectedTime / info.limitVolumeSize * 100;
            if(trafficResult.usedPercent > trafficResult.limitPercent){
                trafficResult.showConfirm = true;
                trafficResult.type = 'time';
            }
        }
        return trafficResult;
    }

    return {
        init: init,
        setTrafficAlertPopuped: setTrafficAlertPopuped,
        setTrafficAlert100Popuped: setTrafficAlert100Popuped
    }
});
