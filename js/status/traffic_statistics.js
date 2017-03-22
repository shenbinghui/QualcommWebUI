/**
 * 流量统计模块
 * @module TrafficStatistics
 * @class TrafficStatistics
 */
define(['jquery', 'knockout', 'config/config', 'service'], function($, ko, config, service) {
	/**
	 * 定时更新流量统计view model, 时间间隔1秒钟
	 * @method timerUpdate
	 * @param {Object} trafficVM
	 */
	function timerUpdate(trafficVM){
		addInterval(function(){
			var info = getDataInfo();
			trafficVM.currentSent(transUnit(info.data_counter.currentSent, false));
			trafficVM.currentReceived(transUnit(info.data_counter.currentReceived, false));
			trafficVM.currentConnectedTime(transSecond2Time(info.data_counter.currentConnectedTime));
			trafficVM.currentTraffic(transUnit(parseInt(info.data_counter.currentReceived, 10) + parseInt(info.data_counter.currentSent, 10), false));
			trafficVM.monthlySent(transUnit(info.data_counter.monthlySent, false));
			trafficVM.monthlyReceived(transUnit(info.data_counter.monthlyReceived, false));
			trafficVM.monthlyConnectedTime(transSecond2Time(info.data_counter.monthlyConnectedTime));
			var monthlyTraffic = parseInt(info.data_counter.monthlySent, 10) + parseInt(info.data_counter.monthlyReceived, 10);
			trafficVM.monthlyTraffic(transUnit(monthlyTraffic, false));
			trafficVM.up_Speed(transUnit(info.data_counter.uploadRate, true));
			trafficVM.down_Speed(transUnit(info.data_counter.downloadRate, true));

			trafficVM.limitVolumeEnable(info.limitVolumeEnable);
			trafficVM.dataLimitTypeChecked(info.limitVolumeType);
			trafficVM.dataUsed(trafficVM.monthlyTraffic() + getPercentWithBracket(monthlyTraffic, info.limitDataMonth));
			trafficVM.dataLeft(transUnit(info.limitDataMonth - monthlyTraffic, false) + getPercentWithBracket(info.limitDataMonth - monthlyTraffic, info.limitDataMonth));
			trafficVM.dataMonthly(transUnit(info.limitDataMonth, false));
			trafficVM.timeUsed(trafficVM.monthlyConnectedTime() + getPercentWithBracket(info.data_counter.monthlyConnectedTime, info.limitTimeMonth));
			trafficVM.timeLeft(transSecond2Time(info.limitTimeMonth - info.data_counter.monthlyConnectedTime) + getPercentWithBracket(info.limitTimeMonth - info.data_counter.monthlyConnectedTime, info.limitTimeMonth));
			trafficVM.timeMonthly(info.limitTimeMonth / 60 / 60);

            if(trafficVM.dataLimitTypeChecked() == '1'){
                if(trafficVM.dataLeft().indexOf('-') != -1){
                    trafficVM.leftMonthTrans('traffic_exceeded_month');
                    trafficVM.dataLeft(trafficVM.dataLeft().replace(/\-/g, ''));
                } else {
                    trafficVM.leftMonthTrans('traffic_left_month');
                }
            }
            if(trafficVM.dataLimitTypeChecked() == '0'){
                if(trafficVM.timeLeft().indexOf('-') != -1){
                    trafficVM.leftMonthTrans('traffic_exceeded_month');
                    trafficVM.timeLeft(trafficVM.timeLeft().replace(/\-/g, ''));
                } else {
                    trafficVM.leftMonthTrans('traffic_left_month');
                }
            }
            $("#traffic_info_note").translate();
		}, 1000);
	} 
	
	/**
	 * 获取两位精度的百分比
	 * @method getPercentWithBracket
	 */
	function getPercentWithBracket(numerator, denominator){
		return "(" + getPercent(numerator, denominator) + ")";
	}
	/**
	 * 获取流量数据
	 * @method getDataInfo
	 */
	function getDataInfo(){
		return service.getConnectionInfo();
	}
	/**
	 * 流量统计ViewModel
	 * @class TrafficVM
	 */
	function TrafficVM(){
		var self = this;
		var info = getDataInfo();
        self.supportClearData = ko.observable(config.CLEAR_DATA_SUPPORT);
		self.currentSent = ko.observable(transUnit(info.data_counter.currentSent, false));
		self.currentReceived = ko.observable(transUnit(info.data_counter.currentReceived, false));
		self.currentConnectedTime = ko.observable(transSecond2Time(info.data_counter.currentConnectedTime));
		self.currentTraffic = ko.observable(transUnit(parseInt(info.data_counter.currentReceived, 10) + parseInt(info.data_counter.currentSent, 10), false));
		self.monthlySent = ko.observable(transUnit(info.data_counter.monthlySent, false));
		self.monthlyReceived = ko.observable(transUnit(info.data_counter.monthlyReceived, false));
		self.monthlyConnectedTime = ko.observable(transSecond2Time(info.data_counter.monthlyConnectedTime));
		self.monthlyTraffic = ko.observable(transUnit(parseInt(info.data_counter.monthlySent, 10) + parseInt(info.data_counter.monthlyReceived, 10), false));
		self.up_Speed = ko.observable(transUnit(info.data_counter.uploadRate, true));
		self.down_Speed = ko.observable(transUnit(info.data_counter.downloadRate, true));

		self.dataUsed = ko.observable(self.monthlyTraffic() + "(0%)");
		self.dataLeft = ko.observable(transUnit(info.data_counter.downloadRate, false) + "(100%)");
		self.dataMonthly = ko.observable('0B');
		self.timeUsed = ko.observable(self.monthlyConnectedTime() + "(0%)");
		self.timeLeft = ko.observable(transSecond2Time(info.data_counter.downloadRate) + "(100%)");
		self.timeMonthly = ko.observable('0');
		self.limitVolumeEnable = ko.observable(info.limitVolumeEnable);
		self.dataLimitTypeChecked = ko.observable(info.limitVolumeType);
        self.leftMonthTrans = ko.observable('traffic_left_month');
        self.clearTraffic = function(){
            showLoading();
            service.clearTraffic({}, function(data){
                hideLoading();
                if(data.result=="success"){
                    successOverlay();
                }else{
                    errorOverlay();
                }
            });
        }
	}
	/**
	 * 流量统计初始化函数
	 * @method init
	 */
	function init(){
		var container = $('#container');
		ko.cleanNode(container[0]);
		var vm = new TrafficVM();
		ko.applyBindings(vm, container[0]);
		timerUpdate(vm);
	}
	
	return {
		init: init
	};
});