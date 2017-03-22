/**
 * phoneBoook 模块
 * @module phoneBoook
 * @class phoneBoook
 */

define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore', 'lib/jquery/chosen.jquery','config/menu','status/statusBar'],
    function ($, ko, config, service, _, chosen,menu, status) {
        var myChart = null;
        var   chartOptions = {
            tooltip: {
                //trigger: 'item',
                formatter: "{b}"
            },
            title: {
                text: '',
                x: 'center',
                y: 'center',
                itemGap: 0,
                textStyle: {
                    color: '#FFF',
                    fontFamily: '微软雅黑',
                    fontSize: 20,
                    fontWeight: 'bolder'
                },
                subtextStyle: {
                    color: '#FFF',
                    fontFamily: '微软雅黑',
                    fontSize: 16,
                    fontWeight: 'bolder'
                }
            },
            animation: false,
            series: [
                {
                    name: '流量控制',
                    type: 'pie',
                    radius: ['0', '75'],
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

        /**
         * 获取流量提醒数据
         * @method getTrafficAlertInfo
         */
        function getTrafficAlertInfo() {
            return service.getTrafficAlertInfo();
        }


        var dataUsedModified = false;

        /**
         * phoneBookViewModel
         * @class phoneBookVM
         */
        function phoneBookVM() {
            var self = this;
            self.trafficLimited = ko.observable("");
            dataUsedModified = false;

            /*++++++++++++设置流量总数，并保存++++++++++++++*/
            var statictisInfo = trafficAlertUtil.fetchTrafficAlertInfo();

            self.dataLimitChecked = ko.observable(statictisInfo.dataLimitChecked == '0' ? '0' : '1');
            console.log("dataLimitChecked = "+self.dataLimitChecked());

            self.dataLimitTypeChecked = ko.observable(statictisInfo.dataLimitTypeChecked == '0' ? '0' : '1');
            var dataMonth = statictisInfo.limitDataMonth.split("_");
            self.limitDataMonth = ko.observable(dataMonth[0] || 0);
            self.selectedDataUnit = ko.observable(dataMonth[1] || 1);

            self.alertDataReach = ko.observable(statictisInfo.alertDataReach || 0);
            self.limitTimeMonth = ko.observable(statictisInfo.limitTimeMonth || 0);
            self.alertTimeReach = ko.observable(statictisInfo.alertTimeReach || 0);

            //判断是否已经设置过套餐流量
            trafficAlertUtil.showTrafficView(self);

            var  timeInfo2 = trafficAlertUtil.getTimeInfo(transTimeUnit(parseFloat(self.limitTimeMonth()) * 3600));
            self.selectedTimeUnit = ko.observable(trafficAlertUtil.getUnitValue(timeInfo2.unit));

            //保存信息按钮
            self.save = function(){
                if (trafficAlertUtil.checkFormEditValid(self) && self.dataLimitChecked() == '1') {
                    return false;
                }
                $("#sms_dialog").css("display","none");
                showLoading();
                service.setTrafficAlertInfo({
                    dataLimitChecked: self.dataLimitChecked(),
                    dataLimitTypeChecked: self.dataLimitTypeChecked(),
                    limitDataMonth: self.limitDataMonth() + "_" + self.selectedDataUnit(),
                    alertDataReach: parseInt(self.alertDataReach(), 10),
                    limitTimeMonth: self.selectedTimeUnit() == "60" ? self.limitTimeMonth()/60 : self.limitTimeMonth(),//save by hours
                    alertTimeReach: parseInt(self.alertTimeReach(), 10)
                }, function (data) {
                    if (data.result == 'success') {
                        if(self.dataLimitTypeChecked() == "1" && dataUsedModified) {
                            self.saveUsedData();
                        } else if(self.dataLimitTypeChecked() == "0" && timeUsedModified) {
                            self.saveUsedTime();
                        } else {
                            trafficAlertUtil.updateEcharts(self);
                            status.setTrafficAlertPopuped(false);
                            trafficAlertUtil.showTrafficView(self);
                            successOverlay();
                        }
                    } else {
                        errorOverlay();
                    }
                }, function () {
                    trafficAlertUtil.updateEcharts(self);
                    errorOverlay();
                });
            };
            /*----------- 设置流量总数，并保存 -----------*/



            /*++++++++++++定时刷新web 时间 流量++++++++++++++*/
            var info = service.getConnectionInfo();
            self.connectStatus = ko.observable(info.connectStatus);
            self.connected_Time= ko.observable(transSecond2Time(0)); //连接时间
            //假设已经连上网络 此处需要判断是否开起网络
            //stationUtil.doConnect();
            addInterval(function(){
                stationUtil.refreshHomeData(self);
            },1000);

            self.trafficUsed = ko.observable(''); //使用总流量
            /*-----------定时刷新web 时间 流量 -----------*/


            /*++++++++++++++++界面上几个按钮操作+++++++++++++++++++++*/
            self.setting_month_data = function(){
                $("#sms_dialog").css("display","block");
            };

            self.setting_month_data_cancel = function(){
                $("#sms_dialog").css("display","none");
            };

            self.setting_history_data = function(){
                $("#history_setting_dialog").css("display","block");
            };

            self.setting_history_data_cancel = function(){
                $("#history_setting_dialog").css("display","none");
            };

           
            /*-------------界面上几个按钮操作-------------------*/


            /*+++++++++++ 用户信息 ++++++++++++++++++*/
            var originalData = {
                ACL_mode: 2,
                user_ip: '',
                macList: '',
                hostnameList: ''
            };
            self.showCableDiv = config.PRODUCT_TYPE == 'CPE' || config.RJ45_SUPPORT;
            self.supportBlock = config.STATION_BLOCK_SUPPORT;
            var pcMenu = menu.findMenu('#parental_control');
            self.showPCLink = pcMenu && pcMenu.length > 0;

            self.deviceInfo = ko.observableArray([]);
            self.cableDeviceInfo = ko.observableArray([]);
            self.blackDevices = ko.observableArray([]);
            self.blackDevicesMac = ko.computed(function () {
                return _.map(self.blackDevices(), function (ele) {
                    return ele.macAddress;
                });
            });

            ko.computed(function () {
                self.deviceInfo();
                self.cableDeviceInfo();
                self.blackDevices();
                $("#station_info_div").translate();
            }).extend({ notify: 'always', throttle: 300 });

            var hostNameList = service.getHostNameList({}).devices;

            self.fetchAttachedDevices = function (cb) {
                service.getCurrentlyAttachedDevicesInfo({}, function (data) {
                    if (editingHostname) {
                        return false;
                    }
                    self.deviceInfo(_.map(data.attachedDevices, function (ele, idx) {
                        ele.idx = _.uniqueId('wireless_');
                        ele.hostName = stationUtil.getHostName(ele.hostName, ele.macAddress, hostNameList);
                        ele.inBlackGroup = _.contains(self.blackDevicesMac(), ele.macAddress);
                        ele.type = 1;
                        return ele;
                    }));
                    if (_.isFunction(cb)) {
                        cb.apply(this);
                    }
                });
            };

            self.fetchAttachedCableDevices = function (cb) {
                service.getAttachedCableDevices({}, function (data) {
                    if (editingHostname) {
                        return false;
                    }
                    self.cableDeviceInfo(_.map(data.attachedDevices, function (ele, idx) {
                        ele.idx = _.uniqueId('cable_');
                        ele.hostName = stationUtil.getHostName(ele.hostName, ele.macAddress, hostNameList);
                        ele.type = 2;
                        return ele;
                    }));
                    if (_.isFunction(cb)) {
                        cb.apply(this);
                    }

                    //alert(self.cableDeviceInfo());
                });
            };

            self.fetchBlacklist = function (cb) {
                service.getMacFilterInfo({}, function (data) {
                    originalData.ACL_mode = data.ACL_mode;
                    originalData.macList = data.wifi_mac_black_list;
                    originalData.hostnameList = data.wifi_hostname_black_list;
                    originalData.user_ip = data.user_ip_addr;
                    var blackDevices = stationUtil.parseBlackString(data.wifi_mac_black_list, data.wifi_hostname_black_list);
                    self.blackDevices(_.map(blackDevices, function (ele, idx) {
                        ele.idx = _.uniqueId('black_');
                        ele.hostName = stationUtil.getHostName(ele.hostName, ele.macAddress, hostNameList);
                        ele.type = 3;
                        return ele;
                    }));
                    if (_.isFunction(cb)) {
                        cb.apply(this);
                    }

                }, $.noop);
            };
            self.fetchBlacklist();
            self.fetchAttachedDevices();
            if (self.showCableDiv) {
                self.fetchAttachedCableDevices();
            }

            var editingHostname = 0;
            addInterval(function () {
                if (editingHostname == 0) {
                    self.fetchAttachedDevices();
                }
            }, 3000);

            if (self.showCableDiv) {
                addInterval(function () {
                    if (editingHostname == 0) {
                        self.fetchAttachedCableDevices();
                    }
                }, 5000);
            }

            self.wirelessBlockHandler = function (eleData) {
                if(eleData.ipAddress == originalData.user_ip){
                    showAlert('black_yourself_tip');
                    return false;
                }
                if(originalData.macList.split(';').length == 32){
                    showAlert('black_list_max');
                    return false;
                }
                if (originalData.macList.indexOf(eleData.macAddress) != -1) {
                    return false;
                }
                showLoading();
                var newHostnameList = originalData.hostnameList == '' ? eleData.hostName : originalData.hostnameList + ';' + eleData.hostName;
                var newMacList = originalData.macList == '' ? eleData.macAddress : originalData.macList + ';' + eleData.macAddress;
                var params = {
                    ACL_mode: '2',//originalData.ACL_mode,
                    wifi_hostname_black_list: newHostnameList,
                    wifi_mac_black_list: newMacList
                };
                self.updateMacFilterList(params);
            };

            self.editHostNameHandler = function (eleData) {
                editingHostname++;
                $("#hostname_input_" + eleData.idx).val(eleData.hostName);
                stationUtil.dealElement(true, eleData.idx);
                return false;
            };

            self.saveHostNameHandler = function (eleData) {
                var $input = $("#hostname_input_" + eleData.idx);
                var newHostname = $input.val();
                if (newHostname == '') {
                    $(".promptErrorLabel", "#confirm-message-container").text($.i18n.prop("required"));
                    var $closestTD = $input.closest('td').addClass('has-error');
                    addTimeout(function () {
                        $closestTD.removeClass('has-error');
                    }, 5000);
                    showAlert('required');
                    return false;
                } else if(newHostname.indexOf(" ") == 0 || newHostname.lastIndexOf(" ") == (newHostname.length - 1) || /[\*\$\[&:,;<>'"\\`\]￥]{1,32}/.test(newHostname)) {
                    showAlert('device_rename');
                    return false;
                }
                showLoading();
                eleData.hostName = newHostname;
                service.editHostName({
                    hostname: eleData.hostName,
                    mac: eleData.macAddress
                }, function () {
                    editingHostname = 0;
                    service.getHostNameList({}, function(data){
                        hostNameList = data.devices;
                        if (eleData.type == 1) {
                            self.fetchAttachedDevices(function () {
                                hideLoading();
                                successOverlay();
                            });
                        } else if (eleData.type == 2) {
                            self.fetchAttachedCableDevices(function () {
                                hideLoading();
                                successOverlay();
                            });
                        } else if (eleData.type == 3) {
                            self.fetchBlacklist(function () {
                                hideLoading();
                                successOverlay();
                            });
                        }
                    });
                }, function () {
                    errorOverlay();
                });
            };

            self.cancelEditHostNameHandler = function (eleData) {
                stationUtil.dealElement(false, eleData.idx);
                editingHostname--;
            };

            self.blacklistRemoveHandler = function (eleData) {
                if (originalData.macList.indexOf(eleData.macAddress) == -1) {
                    return false;
                }
                showLoading();
                var macArr = [];
                var hostnameArr = [];
                $.each(self.blackDevices(), function (i, n) {
                    if (n.macAddress != eleData.macAddress) {
                        macArr.push(n.macAddress);
                        hostnameArr.push(n.hostName);
                    }
                });
                var params = {
                    ACL_mode: '2', //originalData.ACL_mode
                    wifi_hostname_black_list: hostnameArr.join(';'),
                    wifi_mac_black_list: macArr.join(';')
                };
                self.updateMacFilterList(params);
            };
			self.submit_trafficAlertForm = function(){
				 $("#trafficAlertForm").submit();
			};
			
            self.updateMacFilterList = function (params) {
                service.setMacFilter(params, function (data) {
                    if (data.result == "success") {
                        self.blackDevices([]);
                        self.fetchBlacklist(function () {
                            self.fetchAttachedDevices(function(){
                                successOverlay();
                            });
                        });
                    }
                }, function () {
                    errorOverlay();
                });
            };
             //清除历史数据
             
            self.setting_history_data_save = function(){         
               $("#history_setting_dialog").css("display","none");               
               service.trafficCalibration({
	                way: 'data',
	                value: 0
	            });
	            successOverlay();
            };

            /*------------   用户信息  ----------*/
        }

        //功能函数
        var stationUtil = {
            dealElement: function (showEdit, idx) {
                if (showEdit) {
                    $("#edit_btn_" + idx + ",#hostname_txt_" + idx).hide();
                    $("#save_btn_" + idx + ",#cancel_btn_" + idx + ",#hostname_input_" + idx).show();
                } else {
                    $("#edit_btn_" + idx + ",#hostname_txt_" + idx).show();
                    $("#save_btn_" + idx + ",#cancel_btn_" + idx + ",#hostname_input_" + idx).hide();
                }
            },
            parseBlackString: function (macStr, hostnameStr) {
                if (macStr == "") {
                    return [];
                }
                var tempHostName = hostnameStr.split(';');
                var tempMac = macStr.split(';');
                var result = [];
                for (var i = 0; i < tempMac.length; i++) {
                    var obj = {};
                    obj.hostName = tempHostName[i];
                    obj.macAddress = tempMac[i];
                    result.push({
                        hostName: tempHostName[i],
                        macAddress: tempMac[i]
                    });
                }
                return result;
            },
            getHostName: function (hostName, mac, hostNameList) {
                var ele = _.find(hostNameList, function (ele) {
                    return ele.mac == mac;
                });
                return ele ? ele.hostname : hostName;
            },
            refreshHomeData:function(vm){
                //alert("refresh");
                var info = service.getConnectionInfo();

                if(checkConnectedStatus(info.connectStatus))
                {
                    //连接时间
                    vm.connected_Time(transSecond2Time(info.data_counter.currentConnectedTime));
                    //套餐流量
                    vm.trafficLimited(transUnit(info.limitDataMonth, false));
                    //已使用流量
                    vm.trafficUsed(transUnit(parseInt(info.data_counter.monthlySent, 10) + parseInt(info.data_counter.monthlyReceived, 10), false));
                    //vm.trafficUsed(transSecond2Time(info.data_counter.monthlyConnectedTime));

                    var totalTraffic = info.limitDataMonth;
                    var haveUsed = parseInt(info.data_counter.monthlySent, 10)+parseInt(info.data_counter.monthlyReceived, 10);
                    var per_width = parseInt($('.agile_progress_bar').width(), 10);

                    if(totalTraffic > haveUsed)
                    {
                        var persent = haveUsed / totalTraffic;
                        var img_persent = per_width * persent;
                        $("#agile_used_volume").css({"width":img_persent});
                    }
                    else{
                        //流量已经超过了设定值
                        $("#agile_used_volume").css({"width":per_width});
                    }
                }


            },
            doConnect: function () {
                showLoading('connecting');
                service.connect({}, function (data) {
                    if (data.result) {
                        successOverlay();
                    } else {
                        errorOverlay();
                    }
                });
            }
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
            getUnitValue: function (unit) {
                unit = unit.toUpperCase();
                if (unit == 'GB') {
                    return '1024';
                } else if (unit == 'TB') {
                    return '1048576';
                } else if(unit == 'HOUR'){
                    return '3600';
                } else if(unit == 'MINUTE'){
                    return '60';
                } else {
                    return '1';
                }
            },
            getDataInfo: function (value) {
                return {
                    data: /\d+(.\d+)?/.exec(value)[0],
                    unit: /[A-Z]{1,2}/.exec(value)[0]
                }
            },
            getTimeInfo: function (value) {
                return {
                    data: /\d+(.\d+)?/.exec(value)[0],
                    unit: /[a-z]{4,6}/.exec(value)[0]
                }
            },
            getTimeHours: function (time) {
                var t = time.split(':');
                return {
                    h: parseInt(t[0], 10),
                    m: parseInt(t[1], 10),
                    s: parseInt(t[2], 10)
                }
            },
            getSecondsFromTime: function (time) {
                var th = this.getTimeHours(time);
                return th.h * 3600 + th.m * 60 + th.s;
            },
            fetchTrafficAlertInfo: function(){
                originalInfo = getTrafficAlertInfo();
                return originalInfo;
            },
            //显示设置流量套餐显示
            showTrafficView:function(vm){

                if(vm.limitDataMonth() > 0 ){
                    $(".agile_station").css("display","none");
                    $("#button_set_package").css("display","none");
                    $("#agile_lgtab").css("display","inline");
                }
                else{
                    $(".agile_station").css("display","block");
                    $("#button_set_package").css("display","inline-block");
                    $("#agile_lgtab").css("display","none");
                }

            },
            checkFormEditValid: function (vm) {
//                var dataPageEditState = vm.dataLimitTypeChecked() == '1' && (vm.viewEditUsedData() || vm.viewEditAlertData() || vm.viewEditTotalData());
//                var timePageEditState = vm.dataLimitTypeChecked() == '0' && (vm.viewEditUsedTime() || vm.viewEditAlertTime() || vm.viewEditTotalTime());
//                if (dataPageEditState || timePageEditState) {
//                    $('.border-color-transition:visible').addClass('attention-focus');
//                    addTimeout(function () {
//                        $('.border-color-transition:visible').removeClass('attention-focus');
//                    }, 1500);
//                    return true;
//                } else {
//                    var r = false;
//                    if (vm.dataLimitTypeChecked() == 1) {
//                        if (vm.alertDataReach() == '0') {
//                            vm.editAlertDataHandler();
//                            r = true;
//                        }
//                        if (vm.limitDataMonth() == '0') {
//                            vm.editTotalDataHandler();
//                            r = true;
//                        }
//                    } else {
//                        if (vm.alertTimeReach() == '0') {
//                            vm.editAlertTimeHandler();
//                            r = true;
//                        }
//                        if (vm.limitTimeMonth() == '0') {
//                            vm.editTotalTimeHandler();
//                            r = true;
//                        }
//                    }
//                    if (r) {
//                        $('.border-color-transition:visible').addClass('attention-focus');
//                        addTimeout(function () {
//                            $('.border-color-transition:visible').removeClass('attention-focus');
//                        }, 1500);
//                    }
//                    return r;
//                }
                return false;
            },
            data: {
                start: {
                    value: 50,
                    name: '提醒值内未使用',
                    itemStyle: {
                        normal: {
                            color: '#D8D8D8'
                        }
                    }
                },
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
            updateEcharts: function (vm) {
                var total = 0, used = 0, reach = 0, left = 0, alarm = 0, left1 = 0;
                var startName = $.i18n.prop("echarts_no");
                if (vm.dataLimitChecked() == '1') { //开启
                    chartOptions.series[0].data = [];
                    startName = $.i18n.prop("echarts_used");
                    if (vm.dataLimitTypeChecked() == '1') { // 数据
                        chartOptions.title.text = "";
                        //chartOptions.title.text = vm.limitDataMonth() + trafficAlertUtil.getUnit(vm.selectedDataUnit());
                        chartOptions.series[0].data = [];
                        if (vm.limitDataMonth() == 0) {
                            var usedData = trafficAlertUtil.data.used;
                            usedData.value = 1;
                            usedData.name = $.i18n.prop("echarts_used");
                            usedData.selected = false;
                            chartOptions.series[0].data.push(usedData);
                        } else {
                            total = vm.limitDataMonth() * vm.selectedDataUnit() * 1048576;
                            used = parseInt(originalInfo.monthlySent, 10) + parseInt(originalInfo.monthlyReceived, 10);
                            reach = total * vm.alertDataReach() / 100;
                            if (used >= total) {
                                /*used = total;
                                 alarm = total - reach;
                                 overTotal = true;*/
                                var fullData = trafficAlertUtil.data.full;
                                fullData.value = 100;
                                fullData.name = $.i18n.prop("echarts_full");
                                chartOptions.series[0].data.push(fullData);
                                startName = $.i18n.prop("echarts_full");
                            } else {
                                if (reach > used) { // left, alert, left1, used
                                    left1 = reach - used;
                                    left = total - reach;
                                } else { // left, alarm, alert, reach
                                    alarm = used - reach;
                                    left = total - used;
                                }

                                var freeData = trafficAlertUtil.data.free;
                                freeData.value = left;
                                freeData.name = $.i18n.prop("echarts_free");
                                chartOptions.series[0].data.push(freeData);
                                if(alarm > 0){
                                    var alarmData = trafficAlertUtil.data.alarm;
                                    alarmData.value = alarm;
                                    alarmData.name = $.i18n.prop("echarts_alarm");
                                    chartOptions.series[0].data.push(alarmData);
                                }
                                var alertData = trafficAlertUtil.data.alert;
                                alertData.value = total / 200;
                                alertData.name = $.i18n.prop("echarts_alert");
                                chartOptions.series[0].data.push(alertData);
                                if(left1 > 0){
                                    var left1Data = trafficAlertUtil.data.left1;
                                    left1Data.value = left1;
                                    left1Data.name = $.i18n.prop("echarts_left1");
                                    chartOptions.series[0].data.push(left1Data);
                                }
                                var usedData = trafficAlertUtil.data.used;
                                if (reach - used > 0) {
                                    usedData.value = used;
                                } else {
                                    usedData.value = reach;
                                }
                                usedData.name = $.i18n.prop("echarts_used");
                                chartOptions.series[0].data.push(usedData);
                            }
                        }
                    } else { //时间
                        //chartOptions.title.text = vm.limitTimeMonth() + $.i18n.prop('hours');
                        chartOptions.series[0].data = [];
                        if (vm.limitTimeMonth() == 0) {
                            var usedData = trafficAlertUtil.data.used;
                            usedData.value = 1;
                            usedData.selected = false;
                            usedData.name = $.i18n.prop("echarts_used");
                            chartOptions.series[0].data.push(usedData);
                        } else {
                            total = vm.limitTimeMonth() * vm.selectedTimeUnit();
                            used = originalInfo.monthlyConnectedTime;
                            reach = total * vm.alertTimeReach() / 100;
                            if (used >= total) {
                                /*used = total;
                                 alarm = total - reach;
                                 overTotal = true;*/
                                var fullTime = trafficAlertUtil.data.full;
                                fullTime.value = 100;
                                fullTime.name = $.i18n.prop("echarts_full");
                                chartOptions.series[0].data.push(fullTime);
                                startName = $.i18n.prop("echarts_full");
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
                                freeTime.name = $.i18n.prop("echarts_free");
                                chartOptions.series[0].data.push(freeTime);
                                if(alarm > 0) {
                                    var alarmTime = trafficAlertUtil.data.alarm;
                                    alarmTime.value = alarm;
                                    alarmTime.name = $.i18n.prop("echarts_alarm");
                                    chartOptions.series[0].data.push(alarmTime);
                                }
                                var alertTime = trafficAlertUtil.data.alert;
                                alertTime.value = total / 200;
                                alertTime.name = $.i18n.prop("echarts_alert");
                                chartOptions.series[0].data.push(alertTime);
                                if(left1 > 0) {
                                    var left1Time = trafficAlertUtil.data.left1;
                                    left1Time.value = left1;
                                    left1Time.name = $.i18n.prop("echarts_left1");
                                    chartOptions.series[0].data.push(left1Time);
                                }
                                var usedTime = trafficAlertUtil.data.used;
                                if (reach - used > 0) {
                                    usedTime.value = used;
                                } else {
                                    usedTime.value = reach;
                                }
                                usedTime.name = $.i18n.prop("echarts_used");
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
                trafficAlertUtil.setEcharts(chartOptions, startName);
            },
            setEcharts: function (options, startName) {
                var startPart = trafficAlertUtil.data.start;
                startPart.value = 0;
                startPart.selected = false;
                startPart.name = startName;
                var arr = [startPart].concat(options.series[0].data);
                options.series[0].data = arr;
                //myChart.setOption(options, true);
                addTimeout(function () {
                    //$(window).trigger('resize');
                   // myChart.resize();
                }, 1000);
            }
        };

        /**
         * 初始化ViewModel并进行绑定
         * @method init
         */
        function init() {
            var container = $('#container');
            ko.cleanNode(container[0]);
            var vm = new phoneBookVM();
            ko.applyBindings(vm, container[0]);
            $("#txtSmsContent").die().live("contextmenu", function () {
                return false;
            });
            $('#frmPhoneBook').validate({
                submitHandler:function () {
                    vm.save();
                },
                rules:{
                    txtMail:"email_check",
                    txtName:"name_check",
                    txtMobile:"phonenumber_check",
                    txtHomeNumber:"phonenumber_check",
                    txtOfficeNumber:"phonenumber_check"
                }
            });

            $('#trafficAlertForm').validate({
                submitHandler: function () {
                    vm.save();
                },
                rules: {
                    dataUsed: {
                        decimalRange : true,
                        range : [ 0, 9999 ]
                        //digits: true
                    },
                    usedTime: {
                        decimalRange : true,

                        range : [ 0, 9999 ]
                        //digits: true
                    },
                    limitDataMonth: {
                        decimalRange : true,
                        range : [ 1, 9999 ]
                        //digits: true
                    },
                    limitTimeMonth: {
                        decimalRange : true,
                        range : [ 1, 9999 ]
                        //digits: true
                    },
                    alertDataReach: {
                        digits: true,
                        range: [ 1, 100 ]
                    },
                    alertTimeReach: {
                        digits: true,
                        range: [ 1, 100 ]
                    }
                },
                errorPlacement: function (error, element) {
                    if (element.attr("name") == "limitDataMonth") {
                        error.insertAfter("#editTotalDataDiv");
                    } else if (element.attr("name") == "alertDataReach") {
                        error.insertAfter("#editAlertDataDiv");
                    } else if (element.attr("name") == "limitTimeMonth") {
                        error.insertAfter("#editTotalTimeDiv");
                    } else if (element.attr("name") == "alertTimeReach") {
                        error.insertAfter("#editAlertTimeDiv");
                    } else if (element.attr("name") == "dataUsed") {
                        error.insertAfter("#editUsedDataDiv");
                    } else if (element.attr("name") == "usedTime") {
                        error.insertAfter("#editUsedTimeDiv");
                    } else {
                        error.insertAfter(element);
                    }
                }
            });
        }

        return {
            init:init
        };
    }); 