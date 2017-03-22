/**
 * wifi basic 模块
 * @module wifi_basic
 * @class wifi_basic
 */
define([ 'underscore', 'jquery', 'knockout', 'config/config', 'service' ], function(_, $, ko, config, service) {

	// TODO: need check again
	/**
	 * 国家码与频道对应关系
	 * @attribute {JSON} countryChannel 
	 */
	var countryChannel = {
		"zh-cn" : 13,
		"zh-hk" : 13,
		mo : 13,
		"zh-tw" : 11
	};

	/**
	 * 速率表
	 * @attribute {Array} modeRate 
	 */
	var modeRate = [0, 
	                1, 2, 5.5, 6, 6.5, 
	                9, 11, 12, 13, 18, 
	                19.5, 24, 26, 36, 39, 
	                48, 52, 54, 58.5, 65
	                ];

	/**
	 * 删除重复的速率
	 * @method unionArr
	 * @param {Array} arr 速率
	 */
	function unionArr(arr) {
		var rates = [], result = [];
		for ( var i = 0; i < arr.length; i++) {
			for ( var j = 0; j < arr[i].length; j++) {
				if (ko.utils.arrayIndexOf(rates, arr[i][j]) == -1) {
					rates.push(arr[i][j]);
					result.push({index: arr[i][j], rate: modeRate[arr[i][j]]});
				}
			}
		}
		result.sort(function(a, b) {
			return a.rate - b.rate;
		});
		return result;

	}

	/**
	 * 根据模式生成Options
	 * @method rateOption
	 * @param {String} mode 模式 mode in 0, 1, 2, 3, 4
	 */
	function rateOption(mode) {
		var rates = [];
		var modeB = [ 0, 1, 2, 3, 7 ];
		var modeG = [ 0, 4, 6, 8, 10, 12, 14, 16, 18 ];
		var modeN = [ 0, 5, 9, 11, 13, 15, 17, 19, 20 ];

		switch (mode) {
		case '0':
			rates.push(modeB);
			break;
		case '1':
			rates.push(modeG);
			break;
		case '2':
			rates.push(modeN);
			break;
		case '3':
			rates.push(modeB);
			rates.push(modeG);
			break;
		case '4':
			rates.push(modeB);
			rates.push(modeG);
			rates.push(modeN);
			break;
		default:
			rates.push(modeN);
			break;
		}
		var result = unionArr(rates);
		return drawRateOption(result);
	}

	function drawRateOption(data) {
		var opts = [];
		for ( var i = 0; i < data.length; i++) {
			var rate = data[i].rate == 0 ? "Auto" : data[i].rate + " Mbps";
			opts.push(new Option(rate, data[i].index));
		}
		return opts;
	}

	/**
	 * 根据国家生成相应的频道
	 * @method channelOption
	 * @param {String} country 国家码
	 */
	function channelOption(country) {
		var options = [ new Option('Auto', '0') ];
		var channel = countryChannel[country];
		channel = channel ? channel : 13;
		for ( var i = 1; i <= channel; i++) {
			var txt = 2407 + i * 5 + "MHz (Channel " + i + ")";
			options.push(new Option(txt, i));
		}
		return options;
	}

	function countryOption() {
		// TODO: get the options from Server
		var options = [ new Option('中国', 'zh-cn'), new Option('香港', 'zh-hk'), new Option('台灣', 'zh-tw'),
				new Option('澳門', 'mo') ];
		return options;
	}

	function maxStationOption(max) {
		var options = [];
		for ( var i = 1; i <= max; i++) {
			options.push(new Option(i, i));
		}
		return options;
	}

	function getWifiBasic() {
		return service.getWifiBasic();
	}

    function getWpsInfo() {
        return service.getWpsInfo();
    }

	/**
	 * WifiBasicViewModel
	 * @class WifiBasicViewModel
	 */
	function WifiBasicViewModel() {
		// Data
		var self = this;
		var wifiInfo = getWifiBasic();
		var modeArr = [];
		for ( var i = 0; i < config.NETWORK_MODES.length; i++) {
			modeArr.push(new Option(config.NETWORK_MODES[i].name, config.NETWORK_MODES[i].value));
		}
		self.modes = ko.observableArray(modeArr);
		var countryOpts = countryOption();
		self.countries = ko.observableArray(countryOpts);
		self.channels = ko.observableArray(channelOption(countryOpts[0].value));
		self.rates = ko.observableArray(rateOption(wifiInfo.mode));
		self.maxStations = ko.observableArray(maxStationOption(wifiInfo.maxStation));

		// Init data
		self.selectedMode = ko.observable(wifiInfo.mode);
		self.ssid = ko.observable(wifiInfo.SSID);
		self.broadcast = ko.observable(wifiInfo.broadcast + "");
		self.selectedCountry = ko.observable(wifiInfo.countryCode);
		self.selectedChannel = ko.observable(wifiInfo.channel);
		self.selectedRate = ko.observable(wifiInfo.rate);
		self.selectedStation = ko.observable(wifiInfo.station);
        self.wpsFlag = ko.observable('');

		wifiInfo = $.extend(wifiInfo, self);

		// //////////////////////Event Handler
		/**
		 * 模式切换事件处理
		 * @event modeChangeHandler
		 */
		self.modeChangeHandler = function(data, event) {
			var opts = rateOption(self.selectedMode());
			self.rates(opts);
			self.selectedRate('0');
		};

		/**
		 * 国家切换事件处理
		 * @event countryChangeHandler
		 */
		self.countryChangeHandler = function(data, event) {
			var opts = channelOption(self.selectedCountry());
			self.channels(opts);
			self.selectedChannel('0');
		};

		/**
		 * 保存修改
		 * @event save
		 */
		self.save = function() {
            if(self.wpsFlag() == '1') {
                showAlert('wps_on_info');
                return;
            }

			showLoading();
			var params = {};
			params.mode = self.selectedMode();
			params.SSID = self.ssid();
			params.broadcast = self.broadcast() == "true";
			params.countryCode = self.selectedCountry();
			params.channel = self.selectedChannel();
			params.rate = self.selectedRate();
			params.station = self.selectedStation();
			service.setWifiBasic(params, function(result) {
				if (result.result == "success") {
					successOverlay();
				} else {
					errorOverlay();
				}
			});
			
		};

		/**
		 * reset form
		 * @event clear
		 */
		self.clear = function() {
            clearTimer();
			init();
			clearValidateMsg();
		};

        /**
         * 刷新wps信息
         * @method refreshStatus
         *
         */
        self.refreshStatus = function() {
            var status = getWpsInfo();
            self.wpsFlag(status.wpsFlag);
        };

        self.refreshStatus();
	}

	/**
	 * view model初始化
	 * @method init
	 */
	function init() {
		var container = $('#container');
		ko.cleanNode(container[0]);
		var vm = new WifiBasicViewModel();
		ko.applyBindings(vm, container[0]);
		$('#wifi_basic_form').validate({
			submitHandler : function() {
				vm.save();
			},
			rules : {
				ssid : "ssid"
			}
		});

        addInterval(vm.refreshStatus, 1000);
	}

	return {
		init : init
	};
});