define(['service', 'config/config', 'status_check', 'echarts', 'echarts/chart/pie'], function(service, config, status, echarts) {
    var $trafficSwitchOn;
    var $trafficSwitchOff;
    var $flowSwitch;
    var $usedInfo;
    var $leftInfo;
    var $packageInfo;
    var originalInfo = null;

    var myChart = null;
    var chartOptions = {
        title: {
            text: '',
            x: 'center',
            y: 'center',
            itemGap: 0,
            textStyle: {
                color: '#D8D8D8',
                fontFamily: '微软雅黑',
                fontSize: 20,
                fontWeight: 'bolder'
            },
            subtextStyle: {
                color: '#D8D8D8',
                fontFamily: '微软雅黑',
                fontSize: 16,
                fontWeight: 'bolder'
            }
        },
        series: [
            {
                name: '流量控制',
                type: 'pie',
                radius: ['65', '93'],
                itemStyle: {
                    normal: {
                        label: {
                            show: false
                        },
                        labelLine: {
                            show: false
                        }
                    }
                },
                data: [

                ],
                selectedOffset: 3
            }
        ],
        color: ['red', 'red', 'red', 'red', 'red']
    };

    var trafficAlertUtil = {
        cacheEle: {},
        getEle: function (id) {
            if (this.cacheEle.hasOwnProperty('id')) {
                return this.cacheEle[id];
            } else {
                this.cacheEle[id] = $("#" + id);
                return this.cacheEle[id];
            }
        },
        getUnit: function (val) {
            if (val == '1024') {
                return 'GB';
            } else if (val == '1048576') {
                return 'TB';
            } else {
                return 'MB';
            }
        },
        data: {
            alarm: {
                value: 19.7,
                name: '警戒区',
                itemStyle: {
                    normal: {
                        color: '#8CC916'
                    }
                }
            },
            alert: {
                value: 1,
                name: '提醒值',
                itemStyle: {
                    normal: {
                        color: '#FF5500'
                    }
                }
            },
            free: {
                value: 50,
                name: '未使用',
                itemStyle: {
                    normal: {
                        color: '#D8D8D8'
                    }
                }
            },
            left1: {
                value: 50,
                name: '提醒值内未使用',
                itemStyle: {
                    normal: {
                        color: '#D8D8D8'
                    }
                }
            },
            used: {
                value: 30,
                name: '已使用',
                itemStyle: {
                    normal: {
                        color: '#8CC916'
                    }
                }
            },
            full: {
                value: 30,
                name: '流量超出',
                itemStyle: {
                    normal: {
                        color: '#DF4313'
                    }
                }
            }
        },
        updateEcharts: function (info) {
            var total = 0, used = 0, reach = 0, left = 0, alarm = 0, left1 = 0;
            var dataLimitChecked = info.dataLimitChecked == '0' ? '0' : '1';
            var dataMonth = info.limitDataMonth.split("_");
            var limitDataMonth = dataMonth[0] || 0;
            var selectedDataUnit = dataMonth[1] || 1;
            var alertDataReach = info.alertDataReach || 0;
            var limitTimeMonth = info.limitTimeMonth || 0;
            var alertTimeReach = info.alertTimeReach || 0;

            if (dataLimitChecked == '1') { //开启
                chartOptions.series[0].data = [];
                if (info.dataLimitTypeChecked == '1') { // 数据
                    chartOptions.title.text = limitDataMonth + trafficAlertUtil.getUnit(selectedDataUnit);
                    chartOptions.series[0].data = [];
                    if (limitDataMonth == 0) {
                        var usedData = trafficAlertUtil.data.used;
                        usedData.value = 1;
                        usedData.selected = false;
                        chartOptions.series[0].data.push(usedData);
                    } else {
                        total = limitDataMonth * selectedDataUnit * 1048576;
                        used = parseInt(info.monthlySent, 10) + parseInt(info.monthlyReceived, 10);
                        reach = total * alertDataReach / 100;
                        if (used >= total) {
                            /*used = total;
                            alarm = total - reach;
                            overTotal = true;  */
                            var fullData = trafficAlertUtil.data.full;
                            fullData.value = 100;
                            chartOptions.series[0].data.push(fullData);
                        } else {
                            if (reach - used > 0) {
                                left1 = reach - used;
                                left = total - reach;
                            } else {
                                alarm = used - reach;
                                left = total - used;
                            }
                            var freeData = trafficAlertUtil.data.free;
                            freeData.value = left;
                            chartOptions.series[0].data.push(freeData);
                            if(alarm > 0){
                                var alarmData = trafficAlertUtil.data.alarm;
                                alarmData.value = alarm;
                                chartOptions.series[0].data.push(alarmData);
                            }
                            var alertData = trafficAlertUtil.data.alert;
                            alertData.value = total / 200;
                            chartOptions.series[0].data.push(alertData);
                            if(left1 > 0){
                                var left1Data = trafficAlertUtil.data.left1;
                                left1Data.value = left1;
                                chartOptions.series[0].data.push(left1Data);
                            }
                            var usedData = trafficAlertUtil.data.used;
                            if (reach - used > 0) {
                                usedData.value = used;
                            } else {
                                usedData.value = reach;
                            }
                            chartOptions.series[0].data.push(usedData);
                        }
                    }
                } else { //时间
                    chartOptions.title.text = limitTimeMonth + $.i18n.prop('hours');
                    chartOptions.series[0].data = [];
                    if (limitTimeMonth == 0) {
                        var usedData = trafficAlertUtil.data.used;
                        usedData.value = 1;
                        usedData.selected = false;
                        chartOptions.series[0].data.push(usedData);
                    } else {
                        total = limitTimeMonth * 3600;
                        used = info.monthlyConnectedTime;
                        reach = total * alertTimeReach / 100;
                        if (used >= total) {
                           /* used = total;
                            alarm = total - reach;
                            overTotal = true;*/
                            var fullTime = trafficAlertUtil.data.full;
                            fullTime.value = 100;
                            chartOptions.series[0].data.push(fullTime);
                        } else {
                            if (reach - used > 0) {
                                left1 = reach - used;
                                left = total - reach;
                            } else {
                                alarm = used - reach;
                                left = total - used;
                            }
                            var freeTime = trafficAlertUtil.data.free;
                            freeTime.value = left;
                            chartOptions.series[0].data.push(freeTime);
                            if(alarm > 0) {
                                var alarmTime = trafficAlertUtil.data.alarm;
                                alarmTime.value = alarm;
                                chartOptions.series[0].data.push(alarmTime);
                            }
                            var alertTime = trafficAlertUtil.data.alert;
                            alertTime.value = total / 200;
                            chartOptions.series[0].data.push(alertTime);
                            if(left1 > 0) {
                                var left1Time = trafficAlertUtil.data.left1;
                                left1Time.value = left1;
                                chartOptions.series[0].data.push(left1Time);
                            }
                            var usedTime = trafficAlertUtil.data.used;
                            if (reach - used > 0) {
                                usedTime.value = used;
                            } else {
                                usedTime.value = reach;
                            }
                            chartOptions.series[0].data.push(usedTime);
                        }
                    }
                }
            } else {
                var usedData = trafficAlertUtil.data.used;
                usedData.value = 1;
                usedData.selected = false;
                chartOptions.series[0].data = [usedData];
                chartOptions.title.text = '';
            }
            trafficAlertUtil.setEcharts(chartOptions);
        },
        setEcharts: function (options) {
            myChart.setOption(options, true);
            addTimeout(function () {
                $(window).trigger('resize');
            }, 1000);
        }
    };

    function init() {
        myChart = echarts.init($("#trafficGraph")[0]);
        window.onresize = myChart.resize;

        $trafficSwitchOn = $('#trafficSwitchOn');
        $trafficSwitchOff = $('#trafficSwitchOff');
        $flowSwitch = $('#flowSwitch');
        $usedInfo = $('#usedInfo');
        $leftInfo = $('#leftInfo');
        $packageInfo = $('#packageInfo');

        $flowSwitch.change(function() {
            var flowSwitch = $(this).val();
            if(flowSwitch == "1") {
                $trafficSwitchOn.show();
                $trafficSwitchOff.hide();
            } else {
                $trafficSwitchOn.hide();
                $trafficSwitchOff.show();
            }

            showLoading();
            service.setTrafficAlertInfo({
                dataLimitChecked: flowSwitch,
                dataLimitTypeChecked: originalInfo.dataLimitTypeChecked,
                limitDataMonth: originalInfo.limitDataMonth,
                alertDataReach: originalInfo.alertDataReach,
                limitTimeMonth: originalInfo.limitTimeMonth,
                alertTimeReach: originalInfo.alertTimeReach
            }, function(data){
                if(data.result == 'success'){
                    status.setTrafficAlertPopuped(false);
                    service.getTrafficAlertInfo({}, function(info) {
                        originalInfo = info;
                        trafficAlertUtil.updateEcharts(info);
                        hideLoading();
                    });
                } else {
                    hideLoading();
                }
            }, function(data){
                hideLoading();
            });
        });

        initInfo();
    }

    function initInfo() {
        var info = service.getTrafficAlertInfo();
        originalInfo = info;
        var dataLimitChecked = info.dataLimitChecked == '0' ? '0' : '1';
        $flowSwitch.val(dataLimitChecked);
        var packageType = info.dataLimitTypeChecked;
        if(dataLimitChecked == '1') {
            $trafficSwitchOn.show();
            $trafficSwitchOff.hide();
        }  else {
            $trafficSwitchOn.hide();
            $trafficSwitchOff.show();
        }

        if(packageType == "1") {
            //by data
            var dataMonth = info.limitDataMonth.split("_");
            var limitDataMonth = dataMonth[0] || 0;
            var selectedDataUnit = dataMonth[1] || 1;
            $usedInfo.text(transUnit(parseInt(info.monthlySent, 10) + parseInt(info.monthlyReceived, 10), false));
            var leftValue = parseInt(limitDataMonth * selectedDataUnit * 1048576, 10) - (parseInt(info.monthlySent, 10) + parseInt(info.monthlyReceived, 10));
            if(leftValue < 0) {
                leftValue = 0;
            }
            $leftInfo.text(transUnit(leftValue));
            $packageInfo.text(transUnit(parseInt(limitDataMonth * selectedDataUnit * 1048576, 10)));

        } else {
            //by time
            var limitTimeMonth = info.limitTimeMonth || 0;
            var monthlyConnectedTime = transSecond2Time(info.monthlyConnectedTime);
            $usedInfo.text(monthlyConnectedTime);
            var leftTime = limitTimeMonth * 3600 - info.monthlyConnectedTime;
            if(leftTime < 0) {
                leftTime = 0;
            }
            $leftInfo.text(transSecond2Time(leftTime));
            $packageInfo.text(transSecond2Time(limitTimeMonth * 3600));
        }

       trafficAlertUtil.updateEcharts(info);
    }

    return {
        init: init
    }
});
