define(['service', 'jquery', 'status_check'], function(service, $, status) {
    var $adjustByTime;
    var $adjustByData;
    var $frmAdjust;
    var packageType;
    var $timeAdjust;
    var $dataAdjust;
    var $dataUnit;

    function initData() {
        var info = service.getTrafficAlertInfo();
        packageType = info.dataLimitTypeChecked;
        if(packageType == "1") {
            var usedData = transUnit(parseInt(info.monthlySent, 10) + parseInt(info.monthlyReceived, 10), false);
            var dataInfo = getDataInfo(usedData);
            $dataAdjust.val(Math.round(dataInfo.data));
            $dataUnit.val(getUnitValue(dataInfo.unit));
            $adjustByData.show();
        } else {
            $timeAdjust.val(Math.round(info.monthlyConnectedTime/3600));
            $adjustByTime.show();
        }
    }

    function getDataInfo(value) {
        return {
            data: /\d+(.\d+)?/.exec(value)[0],
            unit: /[A-Z]{1,2}/.exec(value)[0]
        }
    }

    function getUnitValue(unit) {
        unit = unit.toUpperCase();
        if (unit == 'GB') {
            return '1024';
        } else if (unit == 'TB') {
            return '1048576';
        } else {
            return '1';
        }
    }

    function init() {
        $adjustByTime = $('#adjustByTime');
        $adjustByData = $('#adjustByData');
        $frmAdjust = $('#frmAdjust');
        $timeAdjust = $('#timeAdjust');
        $dataAdjust = $('#dataAdjust');
        $dataUnit = $('#dataUnit');

        initData();

        $('#adjustSave').off('click').on('click', function() {
            $frmAdjust.submit();
        });

        $frmAdjust.validate({
            submitHandler : function() {
                adjustSave();
            },
            rules : {
                timeAdjust : {
                    digits : true,
                    min : 1
                },
                dataAdjust : {
                    digits : true,
                    min : 1
                }
            }
        });
    }

    function adjustSave() {
        showLoading();
        service.trafficCalibration({
            way: packageType,
            timeAdjust: $timeAdjust.val(),
            dataAdjust: $dataAdjust.val() * $dataUnit.val()
        }, function(data){
            if(data.result == 'success'){
                status.setTrafficAlertPopuped(false);
                successOverlay();
            } else {
                errorOverlay();
            }
        }, function(data){
            errorOverlay();
        })
    }

    return {
        init: init
    }
});
