define([ 'jquery', 'service', 'knockout', 'config/config' ], function($, service, ko, config) {

	function DeviceInformationViewModel() {
		var self = this;
		var data = service.getDeviceInfo();
		self.ssid = ko.observable(verifyDeviceInfo(data.ssid));
        self.passPhrase = ko.observable();
        self.showPassPhrase = ko.observable(data.authMode != "OPEN");
        if(self.showPassPhrase()){
            self.passPhrase(verifyDeviceInfo(data.passPhrase));
        }

        self.m_ssid = ko.observable(verifyDeviceInfo(data.m_ssid));
        self.m_passPhrase = ko.observable();
        self.m_showPassPhrase = ko.observable(data.m_authMode != "OPEN");
        if(self.m_showPassPhrase()){
            self.m_passPhrase(verifyDeviceInfo(data.m_passPhrase));
        }
        self.m_max_access_num = ko.observable(verifyDeviceInfo(data.m_max_access_num));
        self.showMssid = ko.observable(data.multi_ssid_enable == "1" && config.HAS_MULTI_SSID);
		self.ipAddress = ko.observable(verifyDeviceInfo(data.ipAddress));		
		self.wanIpAddress = ko.observable();
		self.ipv6WanIpAddress = ko.observable();
		self.macAddress = ko.observable(verifyDeviceInfo(data.macAddress));
		self.simSerialNumber = ko.observable(verifyDeviceInfo(data.simSerialNumber));
		self.lanDomain = ko.observable(verifyDeviceInfo(data.lanDomain));
		self.imei = ko.observable(verifyDeviceInfo(data.imei));
		self.sw_version = ko.observable(verifyDeviceInfo(data.sw_version));
		self.fw_version = ko.observable(verifyDeviceInfo(data.fw_version));
		self.hw_version = ko.observable(verifyDeviceInfo(data.hw_version));
		self.max_access_num = ko.observable(verifyDeviceInfo(data.max_access_num));
        self.showMacAddress = ko.observable(config.SHOW_MAC_ADDRESS);
        self.hasWifi = ko.observable(config.HAS_WIFI);
        var ipv6Mode = data.ipv6PdpType.toLowerCase().indexOf("v6") > 0;
        //self.showIpv6WanIpAddr = ko.observable(config.IPV6_SUPPORT && ipv6Mode);
		self.showIpv6WanIpAddr = ko.observable();
		self.showIpv4WanIpAddr = ko.observable();
		self.imsi = ko.observable(verifyDeviceInfo(data.imsi));
        self.signal = ko.observable(signalFormat(data.signal));
		
		if(data.opms_wan_mode == "BRIDGE"){
			self.showIpv6WanIpAddr(false);
			self.showIpv4WanIpAddr(false);
		} else if(data.opms_wan_mode == "DHCP" || data.opms_wan_mode == "PPPOE"){
			self.showIpv6WanIpAddr(false);
			self.showIpv4WanIpAddr(true);
			self.wanIpAddress(verifyDeviceInfo(data.wanIpAddress));
		}else if(data.opms_wan_mode == "STATIC"){
			self.showIpv6WanIpAddr(false);
			self.showIpv4WanIpAddr(true);
			self.wanIpAddress(verifyDeviceInfo(data.staticWanIpAddress));
		}else if (config.IPV6_SUPPORT) {//支持IPV6
			if(data.pdpType=="IP"){//ipv4
				self.showIpv6WanIpAddr(false);
				self.showIpv4WanIpAddr(true);
			}else if(ipv6Mode){//ipv6(&ipv4)
				if(data.ipv6PdpType=="IPv6"){
					self.showIpv6WanIpAddr(true);
					self.showIpv4WanIpAddr(false);
				}else{
					self.showIpv6WanIpAddr(true);
					self.showIpv4WanIpAddr(true);
				}
			}
		}else{//不支持IPV6
			self.showIpv6WanIpAddr(false);
			self.showIpv4WanIpAddr(true);
		}
		//联网时显示万网地址，否则为空
		if(data.opms_wan_mode == "PPP") {
			var connectStatus=getConnectStatus(data.connectStatus);
			if(connectStatus==1){
				self.wanIpAddress(verifyDeviceInfo(data.wanIpAddress));
				self.ipv6WanIpAddress("— —");
			}else if(connectStatus==2){
				self.wanIpAddress("— —");
				self.ipv6WanIpAddress(verifyDeviceInfo(data.ipv6WanIpAddress));
			}else if(connectStatus==3){
				self.wanIpAddress(verifyDeviceInfo(data.wanIpAddress));
				self.ipv6WanIpAddress(verifyDeviceInfo(data.ipv6WanIpAddress));
			}else{
				self.wanIpAddress("— —");
				self.ipv6WanIpAddress("— —");
			}
		}

        self.wifiRange = ko.observable("wifi_" + data.wifiRange);
	}
	
	function getConnectStatus(status){
		if (status == "ppp_disconnected" || status == "ppp_connecting" || status == "ppp_disconnecting") {
			return 0;
		} else if (status == "ppp_connected") {
			return 1;
		} else if(status == "ipv6_connected"){
			return 2;
		}else if(status == "ipv4_ipv6_connected"){
			return 3;
		}
	}

    function init() {
        var container = $('#container')[0];
        ko.cleanNode(container);
        var vm = new DeviceInformationViewModel();
        ko.applyBindings(vm, container);

        addInterval(function () {
            service.getDeviceInfo({}, function (data) {
                vm.signal(signalFormat(data.signal));
            });
        }, 1000);
    }

	return {
		init : init
	};
});