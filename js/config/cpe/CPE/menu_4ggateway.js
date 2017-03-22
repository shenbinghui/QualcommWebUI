define(function() {
    var needLogin = true;
    var menu = [
        //switch port
        {
            hash: '#switch',
            path: 'switch_port',
            level: '',
            parent: '',
            requireLogin:false
        },
        // level 1 menu
        {
            hash:'#login',
            path:'login',
            level:'1',
            requireLogin:false,
            checkSIMStatus:false
        } ,
        {
            hash:'#home',
            path:'home',
            level:'1',
            requireLogin:needLogin,
            checkSIMStatus:true
        } ,
        {
            hash:'#status',
            path:'status/device_info',
            level:'1',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#sms',
            path:'sms/smslist',
            level:'1',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#phonebook',
            path:'phonebook/phonebook',
            level:'1',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#setting',
            path:'network/dial_setting',
            level:'1',
            requireLogin:needLogin,
            checkSIMStatus:true
        },
        // level 2 menu        
        {
            hash:'#net_setting',
            path:'network/dial_setting',
            level:'2',
            parent:'#setting',
            requireLogin:needLogin,
            checkSIMStatus:true
        },
        {
            hash:'#wifi',
            path:'wifi/wifi_basic',
            level:'2',
            parent:'#setting',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#device_setting',
            path:'adm/password',
            level:'2',
            parent:'#setting',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#firewall',
            path:'firewall/port_filter',
            level:'2',
            parent:'#setting',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#router_setting',
            path:'adm/lan',
            level:'2',
            parent:'#setting',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#group_all',
            path:'phonebook/phonebook',
            level:'2',
            parent:'#phonebook',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#group_common',
            path:'phonebook/phonebook',
            level:'2',
            parent:'#phonebook',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#group_family',
            path:'phonebook/phonebook',
            level:'2',
            parent:'#phonebook',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#group_friend',
            path:'phonebook/phonebook',
            level:'2',
            parent:'#phonebook',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#group_colleague',
            path:'phonebook/phonebook',
            level:'2',
            parent:'#phonebook',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#device_info',
            path:'status/device_info',
            level:'2',
            parent:'#status',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
		{
			hash:'#traffic_statistics',
			path:'status/traffic_statistics',
			level:'2',
			parent:'#status',
			requireLogin:needLogin,
            checkSIMStatus:false
		},
		{
			hash:'#traffic_alert',
			path:'status/traffic_alert',
			level:'2',
			parent:'#status',
			requireLogin:needLogin,
            checkSIMStatus:false
		},
        {
            hash:'#smslist',
            path:'sms/smslist',
            level:'2',
            parent:'#sms',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#sim_messages',
            path:'sms/sim_messages',
            level:'2',
            parent:'#sms',
            requireLogin:needLogin,
            checkSIMStatus:true
        },
        {
            hash:'#sms_setting',
            path:'sms/sms_setting',
            level:'2',
            parent:'#sms',
            requireLogin:needLogin,
            checkSIMStatus:true
        },
        // level 3 menu
        {
            hash:'#dial_setting',
            path:'network/dial_setting',
            level:'3',
            parent:'#net_setting',
            requireLogin:needLogin,
            checkSIMStatus:true
        },
        {
            hash:'#net_select',
            path:'network/net_select',
            level:'3',
            parent:'#net_setting',
            requireLogin:needLogin,
            checkSIMStatus:true
        },
        {
            hash:'#apn_setting',
            path:'network/apn_setting',
            level:'3',
            parent:'#net_setting',
            requireLogin:needLogin,
            checkSIMStatus:true
        },
        {
            hash:'#wifi_basic',
            path:'wifi/wifi_basic',
            level:'3',
            parent:'#wifi',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
		/*{
			hash: '#wds',
			path: 'wifi/wds',
			level: '3',
			parent: '#wifi',
			requireLogin:needLogin,
            checkSIMStatus:false
		},*/
        {
            hash:'#wifi_advance',
            path:'wifi/wifi_advance',
            level:'3',
            parent:'#wifi',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
		{
            hash:'#black_list',
            path:'wifi/mac_filter',
            level:'3',
            parent:'#wifi',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#wps',
            path:'wifi/wps',
            level:'3',
            parent:'#wifi',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#password_management',
            path:'adm/password',
            level:'3',
            parent:'#device_setting',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#pin_management',
            path:'adm/pin',
            level:'3',
            parent:'#device_setting',
            requireLogin:needLogin,
            checkSIMStatus:true
        },
        {
            hash:'#restore',
            path:'adm/restore',
            level:'3',
            parent:'#device_setting',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
		{
            hash:'#restart',
            path:'adm/restart',
            level:'3',
            parent:'#device_setting',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#dlna_setting',
            path:'adm/dlna',
            level:'3',
            parent:'#device_setting',
            requireLogin:needLogin
        },
		{
            hash:'#SNTP',
            path:'adm/sntp',
            level:'3',
            parent:'#device_setting',
            requireLogin:needLogin
        },
		{
			hash: "#sys_log",
			path: "adm/sys_log",
			level: '3',
			parent: '#device_setting',
			requireLogin:needLogin
		},
		{
			hash: '#tr069config',
			path: 'adm/tr069config',
			level: '3',
			parent: '#device_setting',
			requireLogin:needLogin
		},
        {
            hash:'#port_filter',
            path:'firewall/port_filter',
            level:'3',
            parent:'#firewall',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
		{
		 hash:'#port_forward',
		 path:'firewall/port_forward',
		 level:'3',
		 parent:'#firewall',
		 requireLogin:needLogin
		},
		{
		 hash:'#url_filter',
		 path:'firewall/url_filter',
		 level:'3',
		 parent:'#firewall',
		 requireLogin:needLogin
		},
	   /*{
			hash:'#port_map',
			path:'firewall/port_map',
			level:'3',
			parent:'#firewall',
			requireLogin:needLogin,
			checkSIMStatus:false
		},
	
		 {
		 hash:'#system_security',
		 path:'firewall/system_security',
		 level:'3',
		 parent:'#firewall',
		 requireLogin:needLogin
		 },*/
        {
            hash:'#upnp',
            path:'firewall/upnp_setting',
            level:'3',
            parent:'#firewall',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#dmz',
            path:'firewall/dmz_setting',
            level:'3',
            parent:'#firewall',
            requireLogin:needLogin,
            checkSIMStatus:false
        },       
        {
            hash:'#update_management',
            path:'update/update_info',
            level:'3',
            parent:'#device_setting',
            requireLogin:needLogin
        }
    ];

    return menu;
});