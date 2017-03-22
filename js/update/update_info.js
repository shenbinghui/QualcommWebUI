define([ 'jquery', 'service', 'knockout', 'config/config', 'lib/jquery/jQuery.fileinput'], function($, service, ko, config, fileinput) {

	function UpdateInformationViewModel(){
        self.wanMode = config.opms_wan_mode;
		if ($(".customfile").length == 0) {
			$("#fileField").customFileInput();
		}
	}
		
		fileUploadSubmitClickHandler = function(){
			var fileName = $(".customfile span.customfile-feedback").text();
			if (fileName == $.i18n.prop("no_file_selected")) {
				return false;
			}
			
			if(fileName != "root_uImage" && fileName != "modem.zip" && fileName != "root_uImage.bin"){
				showAlert("upgrade_file_nomatch");
				return false;
			}
			
			showConfirm("upgrade_confirm", function () {//goformIdΪCPE_UPGRADE��ʾΪ��������Ϊmodem��,time��ʾ�����õ�ʱ��
				var upgradeFile = (fileName == "root_uImage" || fileName == "root_uImage.bin") ? {goformId: "CPE_UPGRADE", time: 180000} : {goformId: "MODEM_UPGRADE", time: 265000};
				$('#fileUploadIframe').load(function() {
					var txt = $('#fileUploadIframe').contents().find("body").html();
					if (txt.toLowerCase().indexOf('success') != -1) {
						var param = {goformId : upgradeFile.goformId};
						service.SendUpgradeMessage(param, function(data){
							if(data.result == "success"){
								setTimeout(function(){
									window.location.href="#login";
								}, upgradeFile.time);
								document.getElementById("form_update").submit();
							}else{
								errorOverlay();
							}
						});
						
					} else {
						errorOverlay();
					}

                    $("#uploadBtn").attr("data-trans", "browse_btn");
                    $("#uploadBtn").html($.i18n.prop('browse_btn'));
					$(".customfile span.customfile-feedback").text('');
				});
				showLoading("upgrading", "", "upgrading_alert");
				document.UploadFirmware.submit();
			});	
			
		}
	
		function init()
		{
			var container = $('#container')[0];
			ko.cleanNode(container);
			var vm = new UpdateInformationViewModel();
			ko.applyBindings(vm, container);
		}
		
		return {
			init : init
		};
});