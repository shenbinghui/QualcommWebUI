define(['service', 'config/config'], function(service, config) {
    var currentMode;
    var $rangeMode;
    var $newName;
    var $macAddress;
    var $popupEditName;
    var hostNameList;
    var $attachedDevices;
    var devicesTmplCompiled;

    function fetchAttachedDevices(cb) {
        service.getCurrentlyAttachedDevicesInfo({}, function (data) {
            var attachedDevices =  _.map(data.attachedDevices, function (ele, idx) {
                ele.hostName = getHostName(ele);
                return ele;
            });

            $attachedDevices.empty();
            $attachedDevices.append(devicesTmplCompiled({devices: attachedDevices}));
            $attachedDevices.enhanceWithin();

            if (_.isFunction(cb)) {
                cb();
            }
        });
    }

    function getHostName(ele) {
        var device = _.find(hostNameList, function (host) {
            return host.mac == ele.macAddress;
        });
        return device? device.hostname : ele.hostName;
    }

    function editName() {
        $popupEditName.popup('close', { transition: "pop" });
        showLoading();
        service.editHostName({
            hostname: $newName.val(),
            mac: $macAddress.val()
        }, function () {
            service.getHostNameList({}, function(data){
                hostNameList = data.devices;
                fetchAttachedDevices(function() {
                    hideLoading();
                })
            });
        }, function () {
            errorOverlay();
        });
    }

    function init() {
        $rangeMode = $('#rangeMode');
        $newName = $('#newName');
        $macAddress = $('#macAddress');
        $popupEditName = $('#popupEditName');
        $attachedDevices = $('#attachedDevices');
        devicesTmplCompiled = _.template($("#devicesTmpl").html());

        initWifiRange();

        hostNameList = service.getHostNameList({}).devices;
        fetchAttachedDevices();

        $('#frmName').validate({
            submitHandler:function () {
                editName();
            }
        });
    }

    function initWifiRange() {
        if(config.DEVICE_TYPE == 'CPE') {
            $.i18n.map["wifi_short_mode"] = $.i18n.prop("wifi_short_mode_cpe");
            $.i18n.map["des_short_mode"] = $.i18n.prop("des_short_mode_cpe");
        }

        currentMode = service.getWifiRange({}).wifiRangeMode;
        $("#popupCoverage :radio[value="+ currentMode +"]").prop( "checked", true );
        $rangeMode.text($.i18n.prop("des_" + currentMode));

        $('#coverageCancel').off('click').on('click', function() {
            $("#popupCoverage").popup("close");
            setTimeout(function() {
                $("#popupCoverage :radio[value="+ currentMode +"]").prop( "checked", true );
                $("#popupCoverage :radio").checkboxradio('refresh');
            }, 100);
        });

        $('#coverageOK').off('click').on('click', function() {
            var mode = $('#popupCoverage :checked').val();
            service.setWifiRange({wifiRangeMode: mode}, function() {
                currentMode = mode;
                $rangeMode.text($.i18n.prop("des_" + mode));
                $("#popupCoverage").popup("close");
            });
        });
    }

    window.devicesUtil = {
        showEditNamePopup: function(hostName, macAddress) {
            $newName.val(hostName);
            $macAddress.val(macAddress);
            $('#frmName span.error').remove();
            $popupEditName.popup('open', { transition: "pop" });
        }
    };

    return {
        init: init
    }
});
