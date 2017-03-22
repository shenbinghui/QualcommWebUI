/**
 * 选网模块
 * @module net_select
 * @class net_select
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

function($, ko, config, service, _) {
	
	var selectModes = _.map(config.AUTO_MODES, function(item) {
		return new Option(item.name, item.value);
	});
	
	var selectModes_nm = _.map(config.AUTO_MANUAL, function(item) {
		return new Option(item.name, item.value);
	});

    /**
     * 选网功能view model
     * @class NetSelectVM
     */
	function NetSelectVM() {
		var self = this;
		leftMenuClick("menu_settings");
        self.enableFlag = ko.observable(true);
        self.types = ko.observableArray(selectModes);
		self.selectedType = ko.observable();
		self.selectMode = ko.observable();
		self.networkList = ko.observableArray([]);
		self.selectNetwork = ko.observable('');
		
		self.networkmode_op = ko.observableArray(selectModes_nm);
//        self.currentNetwork = ko.observable('');

        self.networkStatus = function(data) {
            return $.i18n.prop(getNetworkStatus(data.nState));
        };

        self.networkStatusId = function(data) {
            return getNetworkStatus(data.nState);
        };

		self.networkText = function(data) {
			return data.strNumeric;
		};

        self.operatorName = function(data) {
            return data.strShortName;
        };

        self.networkType = function(data) {
            var result = getNetworkType(data.nRat);
            if(result == "auto")
                result = $.i18n.prop("auto");
            return result;
        };

        self.networkTypeId = function(data) {
            return getNetworkType(data.nRat);
        };

		self.networkValue = function(data) {
			var result = [];
			//strNumeric
			result.push(data.strNumeric);
			//nRat
			result.push(data.nRat);
			
			result.push(data.SubAct);
			return result.join(',');
		};

        /**
         * 自动选网时设置网络模式
         * @method save
         */
		self.save = function() {
			showLoading();
			
			//AutoSelect call SetBearerPreference
			var params = {};
			params.strBearerPreference = self.selectedType();
			service.setBearerPreference(params, function(result) {
				if (result.result == "success") {
                    self.networkList([]);
					successOverlay();
				} else {
					errorOverlay();
				}
                self.fetchCurrentNetwork();
			});
		};

        /**
         * 手动搜网
         * @method search
         */
		self.search = function() {
			showLoading('searching_net');
			service.scanForNetwork(function(result, networkList) {
				hideLoading();
				if (result) {
					self.networkList(networkList);
                    for (var i = 0; i < networkList.length; i++) {
                        var n = networkList[i];
                        if (n.nState == '2') {
                            self.selectNetwork(n.strNumeric + ',' + n.nRat);
                            return;
                        }
                    }
				} else {
					self.networkList([]);
				}
                self.fetchCurrentNetwork();
			});
		};

        /**
         * 注册选择的网络
         * @method register
         */
		self.register = function() {
			showLoading('registering_net');
			var networkToSet = self.selectNetwork().split(',');
			service.setNetwork(networkToSet[0], parseInt(networkToSet[1]), parseInt(networkToSet[2]), function(result) {
				if (result) {
					self.networkList([]);
					var autoType = getNetSelectInfo();
					self.selectedType(autoType.net_select);
					successOverlay();
				} else {
					errorOverlay();
				}
                self.fetchCurrentNetwork();
			});
		};

        self.checkEnable = function() {
            var status = service.getStatusInfo();
            if (checkConnectedStatus(status.connectStatus) || status.connectStatus == "ppp_connecting") {
                self.enableFlag(false);
            }
            else {
                self.enableFlag(true);
            }
        };

		//init data
		self.checkEnable();
        var info = getNetSelectInfo();
		if ("manual_select" == info.net_select_mode || "manual_select" == info.m_netselect_save){
			self.selectMode("manual_select");
		}
		else {
			self.selectMode("auto_select");
		}

        self.selectedType(info.net_select);


        self.fetchCurrentNetwork = function(){
//            service.getCurrentNetwork({}, function(data){
//                var currentString = self.operatorName(data) + ' - ' + data.strNumeric + ' - ' + self.networkTypeId(data);
//                self.currentNetwork(currentString);
//            }, $.noop);
        };
//        self.fetchCurrentNetwork();
	}


    /**
     * 获取网络选择信息
     * @method getNetSelectInfo
     */
	function getNetSelectInfo() {
		return service.getNetSelectInfo();
	}

    /**
     * 搜网结果中的状态转换为对应的语言项
     * @method getNetworkStatus
     * @param {String} status
     * @return {String}
     */
	function getNetworkStatus(status) {
		if ("0" == status){		
			return "unknown";
		}else if ("1" == status){
			return "available";
		}else if ("2" == status){
			return "current";
		}else if ("3" == status){
			return "forbidden";
		}
	}

    /**
     * 网络类型转换
     * @method getNetworkType
     * @param {String} type
     * @return {String}
     */
	function getNetworkType(type)
	{
	    if("0" == type) {
			return "2G";
		}else if ("2" == type){
			return "3G";
		}else if("7" == type){
            return "4G";
        }else{
			return "auto";
		}
	}

    /**
     * 初始化选网功能view model
     * @method init
     */
	function init() {
		var container = $('#container');
		ko.cleanNode(container[0]);
		var vm = new NetSelectVM();
		ko.applyBindings(vm, container[0]);
		
		addInterval( vm.checkEnable, 1000);
	}

	return {
		init : init
	};
});