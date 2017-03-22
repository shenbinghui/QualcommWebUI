/**
 * PIN管理模块
 * @module pin
 * @class pin
 */

define([ 'jquery', 'knockout', 'config/config', 'service'],

    function ($, ko, config, service) {
        var pageState = {common:0, requirePin:1, modifyPin:2, requirePuk:3, destroyed:4};
        var pinStatus = {enable:"1", disable:"0"};

        /**
         * pinViewModel
         * @class pinModel
         */
        function pinModel() {
            var self = this;
            leftMenuClick("menu_settings");
            var data = service.getPinData();
            self.isDataCard = config.PRODUCT_TYPE == 'DATACARD';
            self.originPinStatus = ko.observable(data.pin_status);
            self.pinStatus = ko.observable(data.pin_status);
            self.pinNumber = ko.observable(data.pinnumber);
            self.pukNumber = ko.observable(data.puknumber);
            self.currentPin = ko.observable();
            self.newPin = ko.observable();
            self.confirmPin = ko.observable();
            self.puk = ko.observable();
            self.pageState = ko.observable();
            //请求操作后成功标志位
            self.optSuccess = true;

            /**
             * 确定按钮事件处理，包括修改PIN，根据PUK设置PIN，设置PIN的使能状态
             * @event changePin
             */
            self.changePin = function () {
                if (self.isConnectedNetWork()) {
                    showAlert("cannot_operate_when_connected");
                    return;
                }

                if (self.pageState() == pageState.common) {
                    return;
                }

                var para = {
                    oldPin:self.currentPin(),
                    newPin:self.newPin()
                };
                showLoading();

                if (self.pageState() == pageState.modifyPin) {
                    service.changePin(para, self.callback);
                } else if (self.pageState() == pageState.requirePuk) {
                    para = {
                        PinNumber:self.newPin(),
                        PUKNumber:self.puk()
                    };
                    service.enterPUK(para, self.callback);
                } else {
                    if (self.pinStatus() == pinStatus.enable) {
                        service.enablePin(para, self.callback);
                    } else {
                        service.disablePin(para, self.callback);
                    }
                }
            };
            /**
             * 回调函数
             * @method callback
             */
            self.callback = function (data) {
                if (data && data.result == true) {
                    self.optSuccess = true;
                    successOverlay();
                } else {
                    self.optSuccess = false;
                    //最后一次时要弹框提示
                    if(self.pinNumber() == 2){
                      showAlert("last_enter_pin");    
                    }
                    else if(self.pukNumber() == 2){
                      showAlert("last_enter_puk");    
                    }
                    else{
                      errorOverlay();      
                    }   
                }
                init(self);
            };
            /**
             * 进入PIN修改状态事件处理
             * @event displayModifyPinPage
             */
            self.displayModifyPinPage = function () {            
            	if ($("#btnBGMP").hasClass("disable_btn")){
            		return;
            	}
            		
                if (self.isConnectedNetWork()) {
                    showAlert("cannot_operate_when_connected");
                    return;
                }
                self.pinStatus(self.originPinStatus());
                self.pageState(pageState.modifyPin);
                self.clear();
            };
            /**
             * 取消事件处理
             * @event cancel
             */
            self.cancel = function () {
                self.pageState(pageState.common);
                self.pinStatus(self.originPinStatus());
                self.clear();
            };
            /**
             * 清除页面输入和检测消息
             * @event clear
             */
            self.clear = function () {
                self.currentPin("");
                self.newPin("");
                self.confirmPin("");
                self.puk("");
                clearValidateMsg();
            };
            /**
             * PIN使能改变时事件处理
             * @method pinStatusChangeEvent
             */
            self.pinStatusChangeEvent = ko.dependentObservable(function () {
                if (self.pinStatus() == self.originPinStatus()) {
                    self.pageState(pageState.common);
                } else {
                    self.pageState(pageState.requirePin);
                }
                self.clear();
            }, this);
            /**
             * 根据数据，设置当前的页面状态
             * @method computePageState
             */
            self.computePageState = function (data) {
                if (data.pinnumber > 0) {
                    //操作成功页面回到初始状态，操作失败并且pinnumber>0,页面不跳转
                    if (self.optSuccess) {
                        self.cancel();
                    } else {
                        self.clear();
                    }
                } else {
                    self.clear();
                    if (data.puknumber > 0) {
                        self.pageState(pageState.requirePuk);
                    } else {
                        self.pageState(pageState.destroyed);
                    }
                }
            };
            self.computePageState(data);

            /**
             * 是否已联网
             * @method isConnectedNetWork
             */
            self.isConnectedNetWork = function () {
                var info = service.getConnectionInfo();
                return checkConnectedStatus(info.connectStatus);
            }

            /**
             * 处理页面元素的可用状态
             * @method fixPageEnable
             */
            self.fixPageEnable = function () {
                if (self.isConnectedNetWork()) {
                    $('#frmPin :input').each(function () {
                        disableBtn($(this));
                    });
                    clearValidateMsg();
                } else {
                    $('#frmPin :input').each(function () {
                        if (this.id == "txtPin" || this.id == "btnPinApply") {
                            if (self.pageState() == pageState.common) {
                                disableBtn($(this));
                                return;
                            }
                        }
                        if (this.id == "btnModifyPin") {
                            if (self.originPinStatus() != pinStatus.enable) {
                                disableBtn($(this));
                                return;
                            }
                        }
                        if (this.id == "pinEnable" || this.id == "pinDisable") {
                            if (self.pageState() == pageState.modifyPin) {
                                disableBtn($(this));
                                return;
                            }
                        }
                        enableBtn($(this));
                    });

                }
            }
        }

        /**
         * 初始化ViewModel并进行绑定
         * @method init
         */
        function init(oldVM) {
            var vm = oldVM;
            if (vm) {
                var data = service.getPinData();
                vm.originPinStatus(data.pin_status);
                vm.pinNumber(data.pinnumber);
                vm.pukNumber(data.puknumber);
                vm.computePageState(data);
            } else {
                vm = new pinModel();
                addInterval(function () {
                    vm.fixPageEnable();
                }, 1000);
            }
            ko.applyBindings(vm, $('#container')[0]);
            vm.fixPageEnable();

//			$('#btnPinApply').click(function(){
//				if(vm.pageState() == 0){
//					return;
//				}
//				else{
//					$('#frmPin').submit();
//				}
//
//			});
			
            $('#frmPin').validate({
                submitHandler:function () {
                    vm.changePin();
                },
                rules:{
                    txtPuk:"puk_check",
                    txtPin:"pin_check",
                    txtNewPin:"pin_check",
                    txtConfirmPin:{equalToPin:"#txtNewPin"}
                }
            });

        }
		pinsubmit = function(){
			$('#frmPin').submit();
			}
		
        return {
            init:init
        }
    });
