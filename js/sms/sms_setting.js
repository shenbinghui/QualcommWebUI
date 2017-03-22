/**
 * 短信参数设置
 * @module sms_setting
 * @class sms_setting
 */
define([ 'underscore', 'jquery', 'knockout', 'config/config', 'service' ],
    function(_, $, ko, config, service) {

        var validityModes = _.map(config.SMS_VALIDITY, function(item) {
            return new Option(item.name, item.value);
        });

/**
     	  * 短信容量信息
     	  * @attribute {Object} smsCapability
     	  */
        smsCapability = {};
        
        function SmsSettingVM() {
            var self = this;
            var setting = getSmsSetting();
            self.modes = ko.observableArray(validityModes);
            self.selectedMode = ko.observable(setting.validity);
            self.centerNumber = ko.observable(setting.centerNumber);
            self.deliveryReport = ko.observable(setting.deliveryReport);

            self.clear = function() {
                init();
                clearValidateMsg();
            };

            self.save = function() {
                showLoading('waiting');
                var params = {};
                params.validity = self.selectedMode();
                params.centerNumber = self.centerNumber();
                params.deliveryReport = self.deliveryReport();
                service.setSmsSetting(params, function(result) {
                    if (result.result == "success") {
                        successOverlay();
                    } else {
                        errorOverlay();
                    }
                });
            };
            
            self.submit_smsSettingForm = function() {
                $("#smsSettingForm").submit();
            };

        }
//xsk
		/**
		 * 初始化短信容量状态
		 * @method initSimSmsCapability
		 */
		function initSimSmsCapability(){
			var capabilityContainer = $("#simSmsCapability");
			updateSimSmsCapabilityStatus(capabilityContainer);
			addInterval(function(){
				updateSimSmsCapabilityStatus(capabilityContainer);
			}, 5000);
		}
		
		/**
		 * 更新短信容量状态
		 * @method updateSimSmsCapabilityStatus
		 * @param capabilityContainer {Object} 放置容量信息的容器
		 */
		function updateSimSmsCapabilityStatus(capabilityContainer){
			service.getSmsCapability({}, function(capability){
				if(capabilityContainer != null){
					capabilityContainer.text("(" + capability.simUsed + "/" + capability.simTotal + ")");
				}
			});
		}
//xsk
//xsk
  
    
    /**
	 * 删除草稿1105
	 * @method deleteDraftSms
	 * @param ids
	 * @param numbers
	 */
	function deleteDraftSms(ids, numbers){
        stopNavigation();
		service.deleteMessage({
			ids: ids
		}, function(data){
            updateSmsCapabilityStatus(null, function(){
                draftListener();
                restoreNavigation();
            });
			for(var i = 0; i < numbers.length; i++){
				updateMsgList(getPeopleLatestMsg(numbers[i]), numbers[i], ids.length);
			}
            synchSmsList(null, ids);
            tryToDisableCheckAll($("#smslist-checkAll", "#smsListForm"), $(".smslist-item", "#smslist-table").length);
		}, function(error){
            restoreNavigation();
			// Do nothing
		});
	}
	
	/**1347
	 * 初始化短信容量状态
	 * @method initSmsCapability
	 */
	function initSmsCapability(){
		var capabilityContainer = $("#smsCapability");
		updateSmsCapabilityStatus(capabilityContainer);
		//checkSimStatusForSend();
		addInterval(function(){
			updateSmsCapabilityStatus(capabilityContainer);
			//checkSimStatusForSend();
		}, 5000);
	}
	
		/**
	 * 更新短信容量状态1379
	 * @method updateSmsCapabilityStatus
	 * @param capabilityContainer {Object} 放置容量信息的容器
	 */
	function updateSmsCapabilityStatus(capabilityContainer, callback){
		service.getSmsCapability({}, function(capability){
            if(capabilityContainer != null){
                capabilityContainer.text("(" + (capability.nvUsed > capability.nvTotal ? capability.nvTotal : capability.nvUsed) + "/" + capability.nvTotal + ")");
            }
			hasCapability = capability.nvUsed < capability.nvTotal;
            smsCapability = capability;
            if($.isFunction(callback)){
                callback();
            }
		});
	}
	
	//1691
	  function checkSmsCapacityAndAlert(){
        var capabilityContainer = $("#smsCapability");
        updateSmsCapabilityStatus(capabilityContainer);
        addTimeout(function(){
            if(!hasCapability){
                showAlert("sms_capacity_is_full_for_send");
            }
        }, 2000);
    }
//xsk 
        /**
         * 获取短信设置参数
         * @method getSmsSetting
         * @return {Object}
         */
        function getSmsSetting() {
            return service.getSmsSetting();
        }

        function init() {
            var container = $('#container');
            ko.cleanNode(container[0]);
            var vm = new SmsSettingVM();
            ko.applyBindings(vm, container[0]);
            $('#smsSettingForm').validate({
                submitHandler : function() {
                    vm.save();
                },
                rules: {
                    txtCenterNumber: "sms_service_center_check"
                }
            });
            initSimSmsCapability();
            initSmsCapability();
        }

        return {
            init : init
        };
    }
);
