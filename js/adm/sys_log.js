/**
 * sys log设置模块
 * @module sysLog
 * @class sysLog
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

function($, ko, config, service, _) {
	var sysLogModes = _.map(config.sysLogModes, function(item) {
		return new Option(item.name, item.value);
	});
	

    /**
     * sysLog设置view model
     * @class sysLogViewModel
     */
	function sysLogViewModel() {
		var info = service.getSyslogInfo();
		var self = this;
		self.logModes = ko.observableArray(sysLogModes);
		self.currentMode = ko.observable(info.currentMode);
		self.showLogInfomation = ko.observable(false);
		self.showDivForLog = ko.observable(false);
		self.debugLevel = ko.observable();
		self.logInfomation = ko.observable();
		
		initLogInfomation();
		
		function initLogInfomation() {
			if(info.debugLevel == "7") {
				self.debugLevel("open");
				self.showLogInfomation(true);
				self.showDivForLog(true);
				showLogInfomation();
			} else {
				self.debugLevel("close");
				self.showLogInfomation(false);
			}
		}		
		
		self.FlagOnChange = function(){
			if(self.debugLevel() == "open") {				
				self.showDivForLog(true);
			} else {
				self.showDivForLog(false);
			}
		}
		
		self.apply = function(){
			service.setSysLog({
				goformId : "SYSLOG",
				syslog_flag : self.debugLevel(),
				syslog_mode : self.currentMode()
			}, function(data){
				if(data.result == "success") {
					if(self.debugLevel() == "open") {
						self.showLogInfomation(true);
						showLogInfomation();
					} else {
						successOverlay();
						self.showLogInfomation(false);
						clearTimer();
					}
				} else {
					errorOverlay();
				}
			});
		}
		
		self.deleteLog = function() {
			service.setSysLog({
				goformId : "SYSLOG",
				syslog_flag : "delete",
				syslog_mode : self.currentMode()
			}, function(data){
				if(data.result == "success") {					
					successOverlay();
					showLogInfomation();
				} else {
					errorOverlay();
				}
			});
		}
		
		function showLogInfomation(){
			//addInterval(function(){
				$.ajax({
					url : "messages",
					cache : false,
					success : function(data) {
						self.logInfomation(data);
					},
					error : function() {
					
					}
				});
			//}, 1000);
		}
		
	}

    /**
     * sys log初始化
     * @method init
     */
	function init() {
		var container = $('#container');
		ko.cleanNode(container[0]);
		var vm = new sysLogViewModel();
		ko.applyBindings(vm, container[0]);
		
		
		$("#sysLogForm").validate({
			submitHandler: function(){
				vm.apply();
			}			
		});
	}
	
	return {
		init: init
	};
});