define(['service', 'config/config', 'status_check'], function (service, config, status) {

    var networkViewUtil = {
        cacheEle: {},
        getEle: function (id) {
            if (this.cacheEle.hasOwnProperty('id')) {
                return this.cacheEle[id];
            } else {
                this.cacheEle[id] = $("#" + id);
                return this.cacheEle[id];
            }
        },
        setData: function (id, data) {
            return this.getEle(id).html(data);
        },
        showElement: function (id) {
            return this.getEle(id).show();
        },
        hideElement: function (id) {
            return this.getEle(id).hide();
        },
        setConnectionMode: function (mode) {
            if (mode == 'auto_dial') {
                this.setData('connection_mode', $.i18n.prop('auto_select'));
                this.getEle('connection_mode').attr('data-trans', 'auto_select');
            } else {
                this.setData('connection_mode', $.i18n.prop('manual_select'));
                this.getEle('connection_mode').attr('data-trans', 'manual_select');
            }
        },
        getConnectStatus: function (status) {
            if (status == "ppp_connected" || status == "ipv6_connected" || status == "ipv4_ipv6_connected") {
                return 1;
            } else if (status == "ppp_disconnecting") {
                return 2;
            } else if (status == "ppp_connecting") {
                return 3;
            } else { //ppp_disconnected
                return 4;
            }
        },
        getTrafficResult: function (info) {
            var trafficResult = {
                showConfirm: false,
                limitPercent: info.limitVolumePercent
            };
            if (info.limitVolumeType == '1') {
                var monthlyTraffic = parseInt(info.data_counter.monthlySent, 10) + parseInt(info.data_counter.monthlyReceived, 10);
                trafficResult.usedPercent = monthlyTraffic / info.limitVolumeSize * 100;
                if (trafficResult.usedPercent > trafficResult.limitPercent) {
                    trafficResult.showConfirm = true;
                    trafficResult.type = 'data';
                }
            } else {
                trafficResult.usedPercent = info.data_counter.monthlyConnectedTime / info.limitVolumeSize * 100;
                if (trafficResult.usedPercent > trafficResult.limitPercent) {
                    trafficResult.showConfirm = true;
                    trafficResult.type = 'time';
                }
            }
            return trafficResult;
        },
        isDoing: false,
        doConnect: function () {
//            showLoading('connecting');
            $('img', '#connection_img').attr('src', './img/connecting.gif');
            networkViewUtil.setData('connection_status', $.i18n.prop('connecting'));
            networkViewUtil.setData('connection_desc', '');
            service.connect({}, function (data) {
                if (data.result) {
//                    successOverlay();
                    networkViewUtil.isDoing = false;
                } else {
                    errorOverlay();
                    networkViewUtil.isDoing = false;
                }
            });
        },
        connect: function () {
            var statusInfo = service.getStatusInfo();
            var trafficResult = this.getTrafficResult(statusInfo);
            var self = this;
            if (statusInfo.limitVolumeEnable && trafficResult.showConfirm) {
                var confirmMsg = null;
                if (trafficResult.usedPercent > 100) {
                    confirmMsg = {msg: 'traffic_beyond_connect_msg'};
                    status.setTrafficAlertPopuped(true);
                } else {
                    confirmMsg = {msg: 'traffic_limit_connect_msg', params: [trafficResult.limitPercent]};
                    status.setTrafficAlert100Popuped(false);
                }
                networkViewUtil.isDoing = false;
                showConfirm(confirmMsg, function () {
                    networkViewUtil.isDoing = true;
                    self.doConnect();
                });
            } else {
                this.doConnect();
            }
        },
        disconnect: function () {
//            showLoading('disconnecting');
            $('img', '#connection_img').attr('src', './img/disconnecting.gif');
            networkViewUtil.setData('connection_status', $.i18n.prop('disconnecting'));
            networkViewUtil.setData('connection_desc', '');
            service.disconnect({}, function (data) {
                if (data.result) {
                    networkViewUtil.isDoing = false;
//                    successOverlay();
                } else {
                    errorOverlay();
                    networkViewUtil.isDoing = false;
                }
            });
        }
    };

    function refreshStatus() {
        if(networkViewUtil.isDoing) {
            return;
        }
        var info = service.getStatusInfo();
        var status = networkViewUtil.getConnectStatus(info.connectStatus);
        if (status == 1) {
            $('img', '#connection_img').attr('src', './img/connected.png');
            networkViewUtil.setData('connection_status', $.i18n.prop('connected'));
            networkViewUtil.setData('connection_desc', $.i18n.prop('click_to_disconnect'));
        } else if (status == 2) {
            $('img', '#connection_img').attr('src', './img/disconnecting.gif');
            networkViewUtil.setData('connection_status', $.i18n.prop('disconnecting'));
            networkViewUtil.setData('connection_desc', '');
        } else if (status == 3) {
            $('img', '#connection_img').attr('src', './img/connecting.gif');
            networkViewUtil.setData('connection_status', $.i18n.prop('connecting'));
            networkViewUtil.setData('connection_desc', '');
        } else if (status == 4) {
            $('img', '#connection_img').attr('src', './img/disconnected.png');
            networkViewUtil.setData('connection_status', $.i18n.prop('disconnected'));
            networkViewUtil.setData('connection_desc', $.i18n.prop('click_to_connect'));
        }
    }

    function bindEvent() {
        $("#connection_status_div").unbind('click').click(function () {
            if (networkViewUtil.isDoing) {
                return false;
            }
            networkViewUtil.isDoing = true;
            var info = service.getStatusInfo();
            var status = networkViewUtil.getConnectStatus(info.connectStatus);
            if (status == 1) {
                networkViewUtil.disconnect();
            } else if (status == 4) {
                if (info.roamingStatus) {
                    networkViewUtil.isDoing = false;
                    showConfirm('dial_roaming_connect', function () {
                        networkViewUtil.isDoing = true;
                        networkViewUtil.connect();
                    });
                } else {
                    networkViewUtil.connect();
                }
            }
        });
        $("#password_div").unbind('click').click(function (evt) {
            var id = $('.ui-block-b:visible', $(this)).attr('id');
            if (id == 'pwd_mask') {
                networkViewUtil.hideElement('pwd_mask');
                networkViewUtil.showElement('pwd');
            } else {
                networkViewUtil.hideElement('pwd');
                networkViewUtil.showElement('pwd_mask');
            }
        })
    }

    function init() {
        networkViewUtil.isDoing = false;
        service.getConnectionMode({}, function (mode) {
            networkViewUtil.setConnectionMode(mode.connectionMode);
        });
        service.getApnSettings({}, function (apn) {
            var apnModeTransKey = apn.apnMode == 'manual' ? 'apn_manual_apn' : 'apn_auto_apn';
            networkViewUtil.setData('apnMode', $.i18n.prop(apnModeTransKey)).attr('data-trans', apnModeTransKey);
            networkViewUtil.setData('profileName', apn.profileName);
            networkViewUtil.setData('pdpType', apn.pdpType);
            networkViewUtil.setData('apn', apn.wanApn);
            networkViewUtil.setData('authType', apn.authMode);
            networkViewUtil.setData('user', apn.username);
            networkViewUtil.setData('pwd', apn.password);
            networkViewUtil.setData('pwd_mask', leftInsert('', apn.password.length, '*'));
        });
        addInterval(function () {
            refreshStatus();
        }, 1000);
        bindEvent();
    }

    return {
        init: init
    }
});
