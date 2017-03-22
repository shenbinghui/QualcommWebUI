define(['service', 'jquery', 'language', 'config/config'], function (service, $, language, config) {
    var trafficData = {};
    var smsUsed = 0;
    var hasSubUnread = false;
    var smsUsedLast = 0;

    /**
     * 获取当前网络状态
     *
     * @method getNetworkType
     */
    function getNetworkType(networkType, simStatus) {
        if(simStatus == "modem_sim_undetected") {
            return $.i18n.prop("sim_undetected_info");
        }

        var networkTypeTmp = networkType.toLowerCase();
        if (networkTypeTmp == '' || networkTypeTmp == 'limited service') {
            networkTypeTmp = 'limited_service';
        }
        if(networkTypeTmp == 'no service') {
            networkTypeTmp = 'no_service';
        }
        if (networkTypeTmp == 'limited_service' || networkTypeTmp == 'no_service') {
            return $.i18n.prop("network_type_" + networkTypeTmp);
        } else {
            return networkType;
        }
    }

    function getNetWorkProvider(spn_b1_flag,spn_name_data,spn_b2_flag,network_provider,roamStatus){
        if(spn_name_data==""){
            return network_provider;
        }else{
            spn_name_data=decodeMessage(spn_name_data);

            if(spn_b1_flag=="1" && spn_b2_flag=="1"){
                if(roamStatus){//漫游
                    return network_provider;
                }else{//不漫游
                    return network_provider+"  "+spn_name_data;
                }
            }else if(spn_b1_flag=="1"){
                if(roamStatus){//漫游
                    return network_provider+"  "+spn_name_data;
                }else{//不漫游
                    return network_provider+"  "+spn_name_data;
                }
            }else if(spn_b2_flag=="1"){
                if(roamStatus){//漫游
                    return network_provider;
                }else{//不漫游
                    return spn_name_data;
                }
            }else if(spn_b1_flag=="0" && spn_b2_flag=="0"){
                if(roamStatus){//漫游
                    return network_provider+"  "+spn_name_data;
                }else{//不漫游
                    return spn_name_data;
                }
            }
            return "";
        }
    }

    function refreshHome() {
        var info = service.getStatusInfo();
        var roamStatus=info.roamingStatus?true:false;
        homeUtil.setData('networkOperator', getNetWorkProvider(info.spn_b1_flag,info.spn_name_data,info.spn_b2_flag,info.networkOperator,roamStatus));
        homeUtil.setData('network_type', getNetworkType(info.networkType, info.simStatus));
        homeUtil.setData('roaming', info.roamingStatus ? $.i18n.prop('roaming') : '');
        var signalCSS = homeUtil.getSignalCssClass(info.signalImg, info.networkType, info.simStatus);
        $("#signal_div").removeAttr('class').addClass(signalCSS);
        if (config.HAS_BATTERY) {
            homeUtil.showElement('battery_div');
            var batteryPers = homeUtil.convertBatteryPers(info.batteryPers, info.batteryStatus);
            var $batteryDiv = $("img", "#battery_div");
            if ($batteryDiv.attr('src') != batteryPers) {
                $batteryDiv.attr('src', batteryPers);
            }
        } else {
            homeUtil.hideElement('battery_div');
        }

        homeUtil.setData('speed_up', transUnit(info.data_counter.uploadRate || 0, true));
        homeUtil.setData('speed_down', transUnit(info.data_counter.downloadRate || 0, true));
        if (info.limitVolumeEnable) {
            homeUtil.showElement('traffic_div');
            homeUtil.showElement(info.limitVolumeType == '1' ? 'traffic_data_div' : 'traffic_time_div');
            var monthlyTraffic = parseInt(info.data_counter.monthlySent, 10) + parseInt(info.data_counter.monthlyReceived, 10);
            homeUtil.setData('data_used', $.i18n.prop('data_used', transUnit(monthlyTraffic, false)));
            homeUtil.setData('data_total', $.i18n.prop('data_total', transUnit(trafficData.limitDataMonth, false)));
            homeUtil.setData('time_used', $.i18n.prop('time_used', transSecond2Time(info.data_counter.monthlyConnectedTime)));
            homeUtil.setData('time_total', $.i18n.prop('time_total', trafficData.limitTimeMonth / 60 / 60));
        } else {
            homeUtil.hideElement('traffic_div');
        }

        homeUtil.setData('wireless_size', $.i18n.prop('n_wireless_devices', info.attachedDevices.length));

        if (hasSubUnread) {
            homeUtil.setData('sms_used', $.i18n.prop('sms_total_count', parseInt(smsUsedLast + info.smsUnreadCount, 10)));
        } else {
            smsUsedLast = smsUsed - info.smsUnreadCount;
            homeUtil.setData('sms_used', $.i18n.prop('sms_total_count', smsUsed));
            hasSubUnread = true;
        }
//        homeUtil.setData('sms_unread', $.i18n.prop('sms_unread_count', info.smsUnreadCount));

        if(info.smsUnreadCount == 0) {
            homeUtil.getEle('smsNewCount').hide();
        } else {
            homeUtil.getEle('smsNewCount').text(info.smsUnreadCount).show();
        }
    }

    var homeUtil = {
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
        convertBatteryPers: function (pers, status) {
            var src = null;
            if ("0" == status) {
                if ("1" == pers) {
                    src = "img/battery_one.png";
                } else if ("2" == pers) {
                    src = "img/battery_two.png";
                } else if ("3" == pers) {
                    src = "img/battery_three.png";
                } else if ("4" == pers) {
                    src = "img/battery_full.png";
                } else { //"5" == pers || "0" == pers
                    src = "img/battery_out.png";
                }
            } else {
                src = "img/battery_charging.gif";
            }
            return src;
        },
        getSignalCssClass: function (siganl, networkType, simStatus) {
            networkType = networkType.toLowerCase();
            simStatus = simStatus ? simStatus.toLowerCase() : '';
            if (networkType == '' || networkType == 'limited_service' || networkType == 'no_service' || networkType == 'limited service' || networkType == 'no service'
                || simStatus != 'modem_init_complete') {
                siganl = '_none';
            }
            return "signal" + siganl;
        }
    };


    function init() {
        $('#logout').off('click').on('click', function() {
            showConfirm("confirm_logout", function () {
                manualLogout = true;
                service.logout({}, function(){
                    window.location = 'index.html';
                });
            });
        });

        $('#trafficGo').off('click').on('click', function() {
            if(config.isTrafficAlertSet) {
                window.location.hash = '#/traffic/view';
            } else {
                window.location.hash = '#/traffic/traffic_setting';
            }
        });

        hasSubUnread = false;
        trafficData = service.getConnectionInfo();
        service.getSmsCapability({}, function (capa) {
            smsUsed = capa.nvUsed;
        });
        addInterval(function () {
            trafficData = service.getConnectionInfo();
            refreshHome();
        }, 1000);
    }

    return {
        init: init
    }
});
