/**
 * tr069 configuration模块
 * @module tr069 config
 * @class tr069 config
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore','lib/jquery/jQuery.fileinput'],

function($, ko, config, service, _, fileinput) {
    var sntpYears = [];
    var sntpMonths = [];
    var sntpDates = []
    var sntpHours = [];
    var sntpMinutes = [];
    var sntpSecond = [];

    var bigMonth = [1, 3, 5, 7, 8, 10, 12];
    var smallMonth = [4, 6, 9, 11];

    function produceArray(start, end, arrName) {
        var item = {};
        for(var i = start; i <= end; i++) {
            item.name = i;
            item.value = i;
            arrName.push(new Option(item.name, item.value));
        }
    }

    //生成年、月、时、分的数组
    produceArray(2000, 2020, sntpYears);
    produceArray(1, 12, sntpMonths);
    produceArray(0, 23, sntpHours);
    produceArray(0, 59, sntpMinutes);
    produceArray(0, 59, sntpSecond);

	/**
     * tr069 configuration view model
     * @class tr069ConfigViewModel
     */
	function TR069ConfigViewModel() {
		var timer;
        if ($(".customfile").length == 0) {
            $("#fileField").customFileInput();
        }
		var info = service.getTR069Config();
		setInterval(function(){
			var obj = service.getConnectionInfo();
			info.connectStatus = obj.connectStatus;
		}, 1000);
		var self = this;
		self.serverUrl = ko.observable(info.serverUrl);
		self.serverUserName = ko.observable(info.serverUserName);
		self.serverPassword = ko.observable(info.serverPassword);
		var requestUrl = "http://" + info.wanIpAddress + ":" + info.tr069_CPEPortNo;
		self.requestUrl = ko.observable(requestUrl);
		self.requestUserName = ko.observable(info.requestUserName);
		self.requestPassword = ko.observable(info.requestPassword);
        self.informSetting = ko.observable(info.tr069_PeriodicInformEnable);
        self.informInterval = ko.observable(info.tr069_PeriodicInformInterval);
        self.certificateSetting = ko.observable(info.tr069_CertEnable);
        var currentManualSetTime = info.tr069_PeriodicInformTime;
        var currentDay = currentManualSetTime.split("T")[0].split("-");
        var currentTime = currentManualSetTime.split("T")[1].split(":");
        self.currentYear = ko.observable(parseInt(currentDay[0], 10));
        self.currentMonth = ko.observable(parseInt(currentDay[1], 10));
        self.currentDate = ko.observable(parseInt(currentDay[2], 10));
        self.currentHour = ko.observable(parseInt(currentTime[0], 10));
        self.currentMinute = ko.observable(parseInt(currentTime[1], 10));
        self.currentSecond = ko.observable(parseInt(currentTime[2], 10));

        self.years = ko.observableArray(sntpYears);
        self.months = ko.observableArray(sntpMonths);
        /*
         当用户选择月份的时候改变日期选择框的选项
         */
        self.initDateList = function(){
            initDateList();
            self.dates(sntpDates);
        }
        //初始化日期列表
        initDateList();
        self.dates = ko.observableArray(sntpDates);
        self.hours = ko.observableArray(sntpHours);
        self.minutes = ko.observableArray(sntpMinutes);
        self.seconds = ko.observableArray(sntpSecond);
        function initDateList(){
            sntpDates = [];
            if($.inArray(parseInt(self.currentMonth(), 10), bigMonth) != -1) {
                produceArray(1, 31, sntpDates);
            } else if($.inArray(parseInt(self.currentMonth(), 10), smallMonth) != -1) {
                produceArray(1, 30, sntpDates);
            } else if(parseInt(self.currentYear(), 10)%4 == 0) {
                produceArray(1, 29, sntpDates);
            } else {
                produceArray(1, 28, sntpDates);
            }
        }

		self.apply = function() {
			if(!checkConnectedStatus(info.connectStatus)) {
				showAlert("connect_alert");
				return false;
			}
            var manualSetInformTime = self.currentYear() + "-" +self.currentMonth()+ "-" +self.currentDate()+ "T" +self.currentHour()+ ":" +self.currentMinute()+ ":" +self.currentSecond();
			service.setTR069Configuration({
				goformId: "setTR069Config",
				serverURL: self.serverUrl(),
				serverusername: self.serverUserName(),
				serveruserpassword: self.serverPassword(),
				connrequestname: self.requestUserName(),
				connrequestpassword: self.requestPassword(),
                tr069_PeriodicInformEnable: self.informSetting(),
                tr069_PeriodicInformInterval: self.informInterval(),
                tr069_CertEnable: self.certificateSetting(),
                tr069_PeriodicInformTime: manualSetInformTime
			}, function(data){
				if(data.result == "success") {
					successOverlay();
					init();
				} else {
					errorOverlay();
				}
			});
		}
		
	}

    certificateUploadSubmitClickHandler = function(){
        var fileName = $(".customfile span.customfile-feedback").text();
        if (fileName == $.i18n.prop("no_file_selected")) {
            return false;
        }

        if(fileName != "ca-cert.crt"){
            showAlert("certificate_file_nomatch");
            return false;
        }

        $('#certificateUploadIframe').load(function() {
            var txt = $('#certificateUploadIframe').contents().find("body").html();
            if (txt.toLowerCase().indexOf('success') != -1) {
                successOverlay();
               // init();
            } else {
                errorOverlay();
            }

            $("#uploadBtn").attr("data-trans", "browse_btn");
            $("#uploadBtn").html($.i18n.prop('browse_btn'));
            $(".customfile span.customfile-feedback").text('');
        });
        document.getElementById('UploadCertificate').submit();
    }

    /**
     * tr069设置初始化
     * @method init
     */
	function init() {
		var container = $('#container');
		ko.cleanNode(container[0]);
		var vm = new TR069ConfigViewModel();
		ko.applyBindings(vm, container[0]);
		
		$("#tr069Form").validate({
			submitHandler: function(){
				vm.apply();
			},
			rules: {
				serverusername: "tr069_name_check",
				serveruserpassword: "tr069_password_check",
				connrequestname: "tr069_name_check",
				connrequestpassword: "tr069_password_check",
                txtInformInterval: {
                    digits: true,
                    range: [1,4294967295]
                }
			}
		});
	}
	
	return {
		init: init
	};
});