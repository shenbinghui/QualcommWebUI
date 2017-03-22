/**
 * @module SiteWhiteListVM
 * @class SiteWhiteListVM
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

    function ($, ko, config, service, _) {
        var MAX_ITEM = 10;

        function SiteWhiteListVM() {
            var self = this;

            self.siteList = ko.observable([]);
            self.selectedIds = ko.observableArray([]);
            self.disableAdd = ko.computed(function(){
                return self.siteList().length == MAX_ITEM;
            });
            showLoading();
            self.currentUserInChildGroup = ko.observable(service.checkCurrentUserInChildGroup().result);
            self.fetchSiteWhiteList = function (cb) {
                service.getSiteWhiteList({}, function (data) {
                    self.selectedIds([]);
                    self.siteList(data.siteList);
                    _.isFunction(cb) && cb.apply(this);
                }, function () {
                    self.siteList([]);
                    _.isFunction(cb) && cb.apply(this);
                });
            };
            ko.computed(function () {
                self.siteList();
                self.selectedIds();
                setTimeout(function () {
                    renderCheckbox();
                }, 100);
                $("#pc_site_white_list_form").translate();
            });
            self.fetchSiteWhiteList(function(){
                hideLoading();
            });

            self.checkboxClickHandler = function (eleData, evt) {
                addTimeout(function () {
                    self.selectedIds(getSelectedCheckboxValues());
                }, 100);
            };

            self.openAddSitePopoverHandler = function(){
                var addNewSiteTmpl = $("#addNewSiteTmpl").html();
                popover.open({
                    target: $("#openAddSiteBtn"),
                    html: addNewSiteTmpl,
                    width: "300px",
                    validation: addValidation
                });
            };

            self.removeWhiteSite = function(eleData, evt){
                removeSiteWhiteItem([eleData.id]);
            };

            self.removeSelectedWhiteSite = function(){
                removeSiteWhiteItem(getSelectedCheckboxValues());
            };

            self.removeAllWhiteSite = function(){
                removeSiteWhiteItem(getAllCheckboxValues());
            };

            function removeSiteWhiteItem(ids){
                showConfirm('confirm_data_delete', function(){
                    showLoading();
                    service.removeSiteWhite({ids: ids}, function(data){
                        self.fetchSiteWhiteList(function(){
                            successOverlay();
                        });
                    }, function(data){
                        self.fetchSiteWhiteList(function(){
                            errorOverlay();
                        });
                    });
                });
            }

            self.saveSiteWhite = function(name, site){
                popover.hide();
                var matched = _.find(self.siteList(), function(one){
                    return one.site == site;
                });
                if(matched){
                    showAlert("pc_link_exist", function(){
                        setTimeout(function(){
                            popover.show();
                        }, 200);
                    });
                    return false;
                }

                showLoading();
                service.saveSiteWhite({
                    name: name,
                    site: site
                }, function(){
                    self.fetchSiteWhiteList(function(){
                        popover.close();
                        successOverlay();
                    });
                }, function(){
                    self.fetchSiteWhiteList(function(){
                        errorOverlay();
                        popover.show();
                    });
                });
            };

        }

        function getSelectedCheckboxValues() {
            return getCheckboxValues(true);
        }

        function getAllCheckboxValues() {
            return getCheckboxValues(false);
        }

        function getCheckboxValues(isChecked) {
            var selectedSites = [];
            $(":checkbox" + (isChecked ? ":checked" : ""), "#pb_white_list").each(function (i, n) {
                selectedSites.push(n.value)
            });
            return selectedSites;
        }

        var vm = null;
        function addValidation(){
            $('#whiteSiteAddForm').validate({
                submitHandler: function () {
                    var name = $("#siteName").val();
                    var site = $("#siteLink").val();
                    vm.saveSiteWhite(name, site);
                }
            });
        }
        function init() {
            var container = $('#container');
            ko.cleanNode(container[0]);
            vm = new SiteWhiteListVM();
            ko.applyBindings(vm, container[0]);
        }

        return {
            init: init
        };
    });