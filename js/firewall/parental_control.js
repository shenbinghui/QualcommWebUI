/**
 * @module ParentalControlVM
 * @class ParentalControlVM
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

    function ($, ko, config, service, _) {
        var PAGES = {MAIN: 0, MANAGE: 1};

        function ParentalControlVM() {
            var self = this;
            var hostNameList = service.getHostNameList({}).devices;
            self.currentPage = ko.observable(PAGES.MAIN);
            self.pages = PAGES;

            self.currentUserInChildGroup = ko.observable(true);

            self.childGroupList = ko.observable([]);
            self.childGroupMac = ko.computed(function(){
                return _.map(self.childGroupList(), function(ele){
                    return ele.mac;
                });
            });

            self.fetchChildGroupList = function(cb){
                service.childGroupList({}, function(data){
                    self.currentUserInChildGroup(service.checkCurrentUserInChildGroup(data.devices).result);
                    self.childGroupList([]);
                    _.map(data.devices, function(ele, idx){
                        ele.idx = idx;
                        ele.hostname = pcUtil.getHostName(ele.hostname, ele.mac, hostNameList);
                    });
                    self.childGroupList(data.devices);
                    if(_.isFunction(cb)){
                        cb.apply(this);
                    }
                });
            };
            self.fetchChildGroupList();

            self.attachedDevices = ko.observable([]);
            self.manageHandler = function () {
                self.currentPage(PAGES.MANAGE);
                self.fetchAttachedDevices();
            };

            self.fetchAttachedDevices = function(cb){
                self.attachedDevices([]);
                var currentDevices = [];
                var counter = 0;
                service.getCurrentlyAttachedDevicesInfo({}, function (data) {
                    counter++;
                    var devices = _.map(data.attachedDevices, function (ele) {
                        ele.idx = _.uniqueId('wireless_');
                        ele.hostName = pcUtil.getHostName(ele.hostName, ele.macAddress, hostNameList);
                        ele.inChildGroup = _.contains(self.childGroupMac(), ele.macAddress);
                        return ele;
                    });
                    if (counter == 1) {
                        currentDevices = devices;
                    } else {
                        self.attachedDevices(_.flatten([currentDevices, devices]));
                        if (_.isFunction(cb)) {
                            cb.apply(this);
                        }
                    }
                });
                service.getAttachedCableDevices({}, function (data) {
                    counter++;
                    var devices = _.map(data.attachedDevices, function (ele) {
                        ele.idx = _.uniqueId('wireless_');
                        ele.hostName = pcUtil.getHostName(ele.hostName, ele.macAddress, hostNameList);
                        ele.inChildGroup = _.contains(self.childGroupMac(), ele.macAddress);
                        return ele;
                    });
                    if (counter == 1) {
                        currentDevices = devices;
                    } else {
                        self.attachedDevices(_.flatten([currentDevices, devices]));
                        if (_.isFunction(cb)) {
                            cb.apply(this);
                        }
                    }
                });
            };

            ko.computed(function () {
                self.attachedDevices();
                self.childGroupList();
                $("#pc_children_group_form").translate();
            }).extend({ notify: 'always', throttle: 300 });

            self.backToMainHandler = function () {
                self.currentPage(PAGES.MAIN);
            };

            self.addChildGroupHandler = function(eleData){
                showLoading();
                service.addChildGroup(eleData, function(data){
                    self.fetchChildGroupList(function(){
                        self.fetchAttachedDevices(function(){
                            hideLoading();
                        });
                    });
                }, function(data){
                    errorOverlay();
                });
            };

            self.removeChildGroupHandler = function(eleData){
                showLoading();
                service.removeChildGroup(eleData, function(data){
                    self.fetchChildGroupList(function(){
                        self.fetchAttachedDevices(function(){
                            hideLoading();
                        });
                    });
                }, function(data){
                    errorOverlay();
                });
            };

            self.dealElement = function(showEdit, idx){
                if(showEdit){
                    $("#edit_btn_" + idx + ",#hostname_txt_" + idx).hide();
                    $("#save_btn_" + idx + ",#cancel_btn_" + idx + ",#hostname_input_" + idx).show();
                }else{
                    $("#edit_btn_" + idx + ",#hostname_txt_" + idx).show();
                    $("#save_btn_" + idx + ",#cancel_btn_" + idx + ",#hostname_input_" + idx).hide();
                }
            };

            self.editHostNameHandler = function(eleData){
                $("#hostname_input_" + eleData.idx).val(eleData.hostname);
                self.dealElement(true, eleData.idx);
                return false;
            };

            self.saveHostNameHandler = function(eleData){
                var $input = $("#hostname_input_" + eleData.idx);
                var newHostname = $.trim($input.val());
                if(newHostname == ''){
                    $(".promptErrorLabel", "#confirm-message-container").text($.i18n.prop("required"));
                    var $closestTD = $input.closest('td').addClass('has-error');
                    addTimeout(function(){
                        $closestTD.removeClass('has-error');
                    }, 5000);
                    showAlert('required');
                    return false;
                }
                showLoading();
                eleData.hostname = newHostname;
                service.editHostName(eleData, function(){
                    service.getHostNameList({}, function(hostNameData){
                        hostNameList = hostNameData.devices;
                        self.fetchChildGroupList(function(){
                            hideLoading();
                        });
                        self.fetchAttachedDevices();
                    });
                }, function(){
                    errorOverlay();
                });
            };

            self.cancelEditHostNameHandler = function(eleData){
                self.dealElement(false, eleData.idx);
            };

        }

        var pcUtil = {
            getHostName: function (hostName, mac, hostNameList) {
                var ele = _.find(hostNameList, function (ele) {
                    return ele.mac == mac;
                });
                return ele ? ele.hostname : hostName;
            }
        };

        function init() {
            var container = $('#container');
            ko.cleanNode(container[0]);
            var vm = new ParentalControlVM();
            ko.applyBindings(vm, container[0]);
        }

        return {
            init: init
        };
    });