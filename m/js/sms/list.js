define(['service', 'config/config'], function (service, config) {
    var PAGES = {LIST: 1, DELETE: 2, CHAT: 3};
    var LOCATION = {DEVICE: 1, SIM: 0};
    var currentLocation = LOCATION.DEVICE;
    var currentChatSession = '';

    var smsUtil = {
        cacheEle: {},
        getEle: function (id) {
            if (this.cacheEle.hasOwnProperty('id')) {
                return this.cacheEle[id];
            } else {
                this.cacheEle[id] = $("#" + id);
                return this.cacheEle[id];
            }
        },
        switchPage: function (page) {
            switch (page) {
                case PAGES.LIST:
                    $('.in-delete,.in-chat').hide();
                    $('.in-list').show();
                    $(window).scrollTop(0);
                    break;
                case PAGES.DELETE:
                    $('.in-list,.in-chat').hide();
                    $('.in-delete').show();
                    $(window).scrollTop(0);
                    break;
                case PAGES.CHAT:
                    $('.in-list,.in-delete').hide();
                    $('.in-chat').show();
                    $(window).scrollTop(9999);
                    break;
            }
        },
        getSmartDate: function (time) {
            var dateTime = time.split(' ');
            var dates = dateTime[0].split('-');
            var times = dateTime[1].split(':');
            return smartDate(new Date(dates[0], dates[1] - 1, dates[2], times[0], times[1], times[2]).getTime())
        },
        phonebookReady: false,
        messageReady: false,
        loadCounter: config.HAS_PHONEBOOK ? 1 : 2,
        canMergeData: !config.HAS_PHONEBOOK,
        contacts: [],
        messages: [],
        loadData: function () {
            showLoading();
            if (config.HAS_PHONEBOOK && this.phonebookReady == false) {
                this.checkPhonebookReady();
            } else if (config.HAS_PHONEBOOK) {
                smsUtil.loadPhonebook();
            }
            if (this.messageReady == false) {
                this.checkMessageReady();
            } else {
                smsUtil.loadMessage();
            }
        },
        checkPhonebookReady: function () {
            service.getPhoneBookReady({}, function (data) {
                if (data.pbm_init_flag == "6") {
                    smsUtil.loadCounter++;
                } else if (data.pbm_init_flag != "0") {
                    addTimeout(function () {
                        smsUtil.checkPhonebookReady();
                    }, 1000);
                } else {
                    smsUtil.phonebookReady = true;
                    smsUtil.loadPhonebook(true);
                }
            });
        },
        loadPhonebook: function () {
            service.getPhoneBooks({
                page: 0,
                data_per_page: 2000,
                orderBy: "name",
                isAsc: true
            }, function (books) {
                if ($.isArray(books.pbm_data) && books.pbm_data.length > 0) {
                    smsUtil.contacts = books.pbm_data;
                }
                if (smsUtil.canMergeData) {
                    smsUtil.mergeData();
                } else {
                    smsUtil.canMergeData = true;
                }
            }, function () {
                if (smsUtil.canMergeData) {
                    smsUtil.mergeData();
                } else {
                    smsUtil.canMergeData = true;
                }
            });
        },
        checkMessageReady: function () {
            service.getSMSReady({}, function (data) {
                if (data.sms_cmd_status_result == "2") {
                    //$("input:button", "#smsListForm .smslist-btns").attr("disabled", "disabled");
                    hideLoading();
                    showAlert("sms_init_fail");
                } else if (data.sms_cmd_status_result == "1") {
                    addTimeout(function () {
                        smsUtil.checkMessageReady();
                    }, 1000);
                } else {
                    smsUtil.messageReady = true;
                    smsUtil.loadMessage();
                }
            });
        },
        loadMessage: function (cb) {
            return service.getSMSMessages({
                page: 0,
                smsCount: 500,
                nMessageStoreType: currentLocation,
                tags: 10,
                orderBy: "order by id desc"
            }, function (data) {
                smsUtil.messages = data.messages;
                if (smsUtil.canMergeData) {
                    smsUtil.mergeData();
                } else {
                    smsUtil.canMergeData = true;
                }
                _.isFunction(cb) && cb.apply(this);
            }, function () {

            });
        },
        nameMap: {},
        listMessage: {},
        mergeData: function () {
            smsUtil.nameMap = {};
            smsUtil.listMessage = {};
            for (var i = 0; i < smsUtil.contacts.length; i++) {
                var contact = smsUtil.contacts[i];
                if (!smsUtil.nameMap[getLastNumber(contact.pbm_number, config.SMS_MATCH_LENGTH)]) {
                    smsUtil.nameMap[getLastNumber(contact.pbm_number, config.SMS_MATCH_LENGTH)] = contact.pbm_name;
                }
            }
            var draftGroup = {};
            var messages = {};
            for (var j = 0; j < smsUtil.messages.length; j++) {
                var msg = smsUtil.messages[j];
                msg.smartDate = smsUtil.getSmartDate(msg.time); //smartDate(new Date(msg.time.replace(' ', 'T') + '.000Z').getTime());
                msg.name = smsUtil.nameMap[msg.number8] || '';
                msg.shortContent = smsUtil.subString(msg.content, 28);
                if (msg.groupId == '') {
                    if (messages[msg.number8]) {
                        messages[msg.number8].msgs.push(msg);
                        messages[msg.number8].count++;
                        if (msg.isNew) {
                            messages[msg.number8].newCount++;
                        }
                        if (msg.tag == '4') {
                            messages[msg.number8].hasDraft = true;
                        }
                    } else {
                        messages[msg.number8] = {
                            msgs: [msg],
                            title: msg.name || msg.number,
                            shortTitle: smsUtil.subString(msg.name || msg.number, 15),
                            count: 1,
                            newCount: msg.isNew ? 1 : 0,
                            hasDraft: msg.tag == '4',
                            groupId: ''
                        };
                    }
                } else {
                    if (draftGroup[msg.groupId]) {
                        draftGroup[msg.groupId].msgs.push(msg);
                        draftGroup[msg.groupId].count++;
                        draftGroup[msg.groupId].title += ',' + (msg.name || msg.number)
                    } else {
                        draftGroup[msg.groupId] = {
                            msgs: [msg],
                            title: msg.name || msg.number,
                            count: 1,
                            newCount: 0,
                            hasDraft: true,
                            groupId: msg.groupId
                        };
                    }
                }
            }

            var draftGroupTmp = {};
            for (var key in draftGroup) {
                var item = draftGroup[key];
                item.shortTitle = smsUtil.subString(item.title, 15);
                draftGroupTmp[key] = item;
            }

            smsUtil.listMessage = _.extend(messages, draftGroupTmp);
            var smsItemTmplCompiled = _.template($("#smsItemTmpl").html());
            smsUtil.getEle('sms-list-ul').html(smsItemTmplCompiled({messages: smsUtil.listMessage})).listview('refresh');
            addTimeout(function () {
                var smsDeleteTmplCompiled = _.template($("#smsDeleteTmpl").html());
                smsUtil.getEle('sms-delete-fieldset').controlgroup("container").html(smsDeleteTmplCompiled({messages: smsUtil.listMessage}));
                $(':checkbox').checkboxradio();
            }, 100);
            this.setSelectCount();
            hideLoading();
        },
        setSelectCount: function () {
            setTimeout(function () {
                var len = $("[name='contactCheckbox']:checked").length;
                if (len) {
                    smsUtil.getEle('smsDelete').removeClass('ui-state-disabled');
                    smsUtil.getEle('sms-header-title').hide();
                    smsUtil.getEle('sms-header-title-selected').html($.i18n.prop('sms_n_selected', len)).show();
                } else {
                    smsUtil.getEle('smsDelete').addClass('ui-state-disabled');
                    smsUtil.getEle('sms-header-title').show();
                    smsUtil.getEle('sms-header-title-selected').hide();
                }
            }, 0);
        },
        subString: function (str, len) {
            if('UNICODE' == getEncodeType(str).encodeType) {
                len = len / 2;
            }
            if (str.length < len) {
                return str;
            } else {
                return str.substring(0, len) + '...';
            }
        }
    };

    window.smsEvtHandler = {
        backToList: function () {
            smsUtil.switchPage(PAGES.LIST);
        },
        switchToDeletePage: function () {
            smsUtil.switchPage(PAGES.DELETE);
            $("[name='contactCheckbox']").prop('checked', false).checkboxradio('refresh');
            smsUtil.setSelectCount();
        },
        deleteActionHandler: function () {
            var checkboxes = $("[name='contactCheckbox']:checked");
            if (checkboxes.length) {
                showConfirm('confirm_data_delete', function () {
                    showLoading();
                    var last8Array = [];
                    var multiDraftArray = [];
                    checkboxes.each(function (i, n) {
                        if (n.value.length > SMS_NUMBER_CUT_LENGTH) {
                            multiDraftArray.push(n.value);
                        } else {
                            last8Array.push(n.value);
                        }
                    });
                    var selectedMessages = _.filter(smsUtil.messages, function (item) {
                        return _.indexOf(last8Array, item.number8) != -1 || _.indexOf(multiDraftArray, item.groupId) != -1;
                    });
                    var ids = _.map(selectedMessages, function (item) {
                        return item.id;
                    });
                    service.deleteMessage({
                        ids: ids
                    }, function () {
                        smsUtil.loadMessage(function () {
                            successOverlay();
                            addTimeout(function () {
                                smsUtil.setSelectCount();
                            }, 1000);
                        });
                    }, function (error) {
                        errorOverlay(error.errorText);
                    });
                });
            }
        },
        cancelHandler: function () {
            this.backToList();
        },
        smsCheckboxChangeHandler: function () {
            smsUtil.setSelectCount();
        },
        checkAllChangeHandler: function (ele) {
            if ($(ele).is(':checked')) {
                $("[name='contactCheckbox']").prop('checked', true).checkboxradio('refresh');
            } else {
                $("[name='contactCheckbox']").prop('checked', false).checkboxradio('refresh');
            }
            smsUtil.setSelectCount();
        },
        locationChangeHandler: function (ele) {
            currentLocation = ele.value;
            showLoading();
            smsUtil.loadMessage(function () {
                hideLoading();
            });
        },
        smsItemClickHandler: function (value) {
            currentChatSession = value;
            var selectedMessages = _.filter(smsUtil.messages, function (item) {
                return item.number8 == currentChatSession || item.groupId == currentChatSession;
            });
            var unreadSmsId = [];
            _.map(selectedMessages, function (n) {
                n.position = (n.tag == '0' || n.tag == '1') ? 'left' : 'right';
                if (n.tag == '3') {
                    n.desc = $.i18n.prop('send_fail');
                } else if (n.tag == '4') {
                    n.desc = $.i18n.prop('draft');
                } else {
                    n.desc = '';
                }
                if (n.tag == '1') {
                    n.tag = '0';
                    unreadSmsId.push(n.id);
                }
                return n;
            });
            service.setSmsRead({ids: unreadSmsId}, function () {
                $(".sms-new-count", "#smsListItem" + value).remove();
            });
            var smsChatTmplCompiled = _.template($("#smsChatTmpl").html());
            smsUtil.getEle('sms-chat-div').html(smsChatTmplCompiled({messages: selectedMessages}));
            if (selectedMessages[0].name == '') {
                smsUtil.getEle('sms-chat-name').html(selectedMessages[0].number);
                smsUtil.getEle('sms-chat-number').html('');
            } else {
                smsUtil.getEle('sms-chat-name').html(selectedMessages[0].name);
                smsUtil.getEle('sms-chat-number').html(selectedMessages[0].number);
            }
            smsUtil.switchPage(PAGES.CHAT);
        },
        deleteChatActionHandler: function () {
            showConfirm('confirm_data_delete', function () {
                showLoading();
                var selectedMessages = _.filter(smsUtil.messages, function (item) {
                    return item.number8 == currentChatSession || item.groupId == currentChatSession;
                });

                var ids = _.map(selectedMessages, function (item) {
                    return item.id;
                });
                service.deleteMessage({
                    ids: ids
                }, function () {
                    smsUtil.loadMessage(function () {
                        smsUtil.switchPage(PAGES.LIST);
                        successOverlay();
                    });
                }, function (error) {
                    errorOverlay(error.errorText);
                });
            });
        }
    };

    function init() {
		currentLocation = LOCATION.DEVICE;
        smsUtil.switchPage(PAGES.LIST);
        smsUtil.loadData();
    }

    return {
        init: init
    }
});