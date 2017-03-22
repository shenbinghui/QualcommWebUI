/**
 * @module ParentalControlVM
 * @class ParentalControlVM
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

    function ($, ko, config, service, _) {

        function TimeLimitedVM() {
            var self = this;
            initTableData();
            self.notSave = ko.observable(false);
            self.currentUserInChildGroup = ko.observable(service.checkCurrentUserInChildGroup().result);

            self.fetchTimeLimited = function () {
                service.getTimeLimited({}, function (data) {
                    for (var k in data) {
                        for (var i = 0; i < data[k].length; i++) {
                            var id = 'td_' + k + '_' + data[k][i];
                            $("#" + id).addClass('active');
                        }
                    }
                }, function () {
                });
            };
            self.fetchTimeLimited();

            self.saveTimeLimitedHandler = function () {
                showLoading();
                var tds = getSelectedTds();
                var timeStr = getSavedData(tds);
                service.saveTimeLimited({time: timeStr}, function () {
                    self.notSave(false);
                    successOverlay();
                }, function () {
                    errorOverlay();
                });
            };

            self.bindEvent = function () {
                $("td:not('.col-head')", "#pc_time_limited_tbody").addClass('cursorhand').die().click(function () {
                    self.notSave(true);
                    $(this).toggleClass('active');
                }).hover(function () {
                    var $this = $(this);
                    var w = $this.data('week');
                    var h = $this.data('hour');
                    $("tr:nth-child(" + (w + 1) + ") td:first-child", "#pc_time_limited_tbody").addClass('time_td_hover');
                    $("#col_" + h).addClass('time_td_hover');
                    if ($this.not('.active')) {
                        $this.addClass('time_td_hover');
                    }
                }, function () {
                    var $this = $(this);
                    var w = $this.data('week');
                    var h = $this.data('hour');
                    $("tr:nth-child(" + (w + 1) + ") td:first-child", "#pc_time_limited_tbody").removeClass('time_td_hover');
                    $("#col_" + h).removeClass('time_td_hover');
                    $this.removeClass('time_td_hover');
                });
            };

            if (!self.currentUserInChildGroup()) {
                self.bindEvent();
            }
        }

        function getSelectedTds() {
            var defaultValue = {
                '0': [], '1': [], '2': [], '3': [], '4': [], '5': [], '6': []
            };
            $("td.active", "#pc_time_limited_tbody").each(function (i, n) {
                var $this = $(n);
                var w = $this.data('week');
                var h = $this.data('hour');
                defaultValue[w].push(h);
            });
            return defaultValue;
        }

        function getSavedData(tds) {
            var result = '';
            for (var k in tds) {
                var hours = _.sortBy(tds[k], function (n) {
                    return n;
                });
                if (tds[k].length) {
                    result += k + '+';
                    result += hours.join(',');
                    result += ';'
                }
            }
            return result.substring(0, result.length - 1);
        }

        function initTableData() {
            $("tr", "#pc_time_limited_tbody").each(function (i, n) {
                var $tr = $(n);
                $("td:not(:first)", $tr).each(function (j, m) {
                    var $td = $(m);
                    var h = convertHour(j);
                    $td.attr({
                        id: 'td_' + i + '_' + h
                    }).data({week: i, hour: h});
                });
            });
            $("thead td:not(:first)", "#pc_time_limited_form").each(function (i, n) {
                var h = convertHour(i);
                $(n).attr({id: 'col_' + h});
            });
        }

        function convertHour(h) {
            if (h > 16) {
                return h - 17;
            } else {
                return h + 7;
            }
        }


        function init() {
            var container = $('#container');
            ko.cleanNode(container[0]);
            var vm = new TimeLimitedVM();
            ko.applyBindings(vm, container[0]);
        }

        return {
            init: init
        };
    });