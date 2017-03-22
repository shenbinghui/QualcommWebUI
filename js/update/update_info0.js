define([ 'jquery', 'service', 'knockout', 'config/config' ], function($, service, ko, config) {
	
	var currentVersion = "";//当前版本
	var newVersion="";//新版本
	
	var updateLog = "";	//更新日志
	
	var updateFileList = [];//更新文件名
	var updateFileLinkList = [];//更新超链接
	
	var fileRoute="description.xml";
	
	function UpdateInformationViewModel(){
	
		var self = this;
		self.updateInfo=ko.observable();
		self.updateNoInfo=ko.observable();				
		self.currentVersion=ko.observable();
		self.newVersion=ko.observable();
		self.updateLog=ko.observable();
		self.linkString=ko.observable();
		self.isSkipedWarning=ko.observable(0);
		
		var dealURL = function(url){
			if(url.length==0){
				return url;
			}
			var returnValue="http://";
			var temp=url.split("@");
			
			if(temp.length==1){
				return url;
			}
			returnValue+=(temp[1].split("/")[0]).split(":")[0]+"/";
			var server=temp[0].split("//")[1];
			returnValue+=server.split(":")[0]+"/";
			var tempValue=temp[1].split("/");
			for(var i=1;i<tempValue.length;i++){
				if(i==tempValue.length-1){
					returnValue+=tempValue[i];
				}else{
					returnValue+=tempValue[i]+"/";
				}
			}
			return returnValue;
		}

		setUpdateInfoWarning = function(){			
			showLoading();
			
			var upgrade_notice_flag=self.isSkipedWarning();
			var params = {};
                params.upgrade_notice_flag = upgrade_notice_flag;
			
			service.setUpdateInfoWarning(params, function(result){
				hideLoading();				
				if(result){
					successOverlay();
				}else{					
					errorOverlay();
				}
				initSkipedWarning();
			});
		}

		setIsSkipedWarning = function(){
			var checkbox = $("#isSkipedWarning:checked");
			if(checkbox && checkbox.length == 0){
				self.isSkipedWarning(1);
			}else{
				self.isSkipedWarning(0);
			}
		}
		
		var fixLog = function(updateLogIn){
			if(updateLogIn.length > 0)
			{
				var iCheckIfOldFormat=-1;
				iCheckIfOldFormat=updateLogIn.indexOf("\\n\\r");
				if(-1 == iCheckIfOldFormat)
				{
					return updateLogIn;
				}
				var strAdd = ["<p>", "</p><p>", "</p>"];
				var strForWrite="";
				var iAddPos=0;
				var iLastFoundPos=-1;
				
				while(1)
				{
					iLastFoundPos=updateLogIn.indexOf("\\n\\r");
					if(-1 == iLastFoundPos)
					{
						if( 1 == iAddPos){
							strForWrite=strForWrite+strAdd[0];
						}else{
							strForWrite=strForWrite+strAdd[1];
						}							
						strForWrite=strForWrite+updateLogIn;
						strForWrite=strForWrite+strAdd[2];
						break;
					}
					if(0 == iAddPos)
					{
						continue;
					}else if(1 == iAddPos){
						strForWrite=strForWrite+strAdd[0];
					}
					else{
						strForWrite=strForWrite+strAdd[1];
					}
					
					strForWrite=strForWrite+updateLogIn.substr(0, iLastFoundPos);
					iAddPos++;
					updateLogIn=updateLogIn.substr(iLastFoundPos+4);
				}
				return strForWrite;
			}
			return "";
		}
		
		var initUpdateInfo = function(){		
			if(currentVersion==newVersion){
				self.updateInfo(0);
			}else{
				self.updateInfo(1);
				
				self.currentVersion(currentVersion);
				self.newVersion(newVersion);
				self.updateLog(updateLog);
				
				var linkString="";
				for(var tmp=0;tmp<updateFileList.length;tmp++)
				{
					if(0 == tmp)
					{
						linkString += "<p>";
					}
					linkString += "<a target='_blank' href=\"";
					linkString += dealURL(updateFileLinkList[tmp]);
					linkString += "\" >";
					linkString += updateFileList[tmp];
					if("" == updateFileList[tmp])
					{
						linkString += "</a></p>";
						break;
					}
					else
					{
						linkString += "</a></p><p>";
					}
				}
				self.linkString(linkString);
			}
		}
		
		var loadDescription = function(){
			$.ajax({
				url: fileRoute,
				dataType: 'xml',
				success: function(xml){
					$(xml).find("PackageDescription").each(function(index, ele) {
						//currentVersion = $(ele).find("SoftwareVersion").text();
						updateLog = fixLog($(ele).find("Log").text());
						newVersion = $(ele).find("FirmwareVersion").text();
					});
					
					$(xml).find("UpdateFile").each(function(index, ele) {
						var field = $(ele);
						updateFileList[index]=field.text();
						updateFileLinkList[index]=field.attr("URL");
					});
					
					currentVersion=service.getDeviceInfo().fw_version;
					
					initUpdateInfo();
				},error:function(){
					self.updateInfo(0);
				}
			});			
		};
		
		var initSkipedWarning = function(){			
			var notice=service.getUpdateInfoWarning();
			if(notice.upgrade_notice_flag){
				self.isSkipedWarning(notice.upgrade_notice_flag==2?1:notice.upgrade_notice_flag);
			}
		};
		
		loadDescription();
		initSkipedWarning();
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