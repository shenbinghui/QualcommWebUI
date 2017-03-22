/**
 * modifypassword 模块
 * @module modifypassword
 * @class modifypassword
 */

define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

    function ($, ko, config, service, _) {
        /**
         * modifypassword
         * @class modifypasswordVM
         */
        function modifypasswordVM(){
            var self = this;
            leftMenuClick("menu_settings");

            self.currentPassword = ko.observable("");
            self.newPassword = ko.observable("");
            self.confirmPassword = ko.observable("");
            
            //提交保存
            self.changePassword = function(){
                var para = {
                    oldPassword:self.currentPassword(),
                    newPassword:self.newPassword()
                };
                showLoading();
                service.changePassword(para, function (data) {
                    self.cancel();
                    if (data && data.result == true) {
                        successOverlay();
                    } else {
                        if (data && data.errorType == "badPassword") {
                            hideLoading();
                            showAlert("current_password_error",function(){
                                $("#txtCurrentPassword").focus();
                            });
                        } else {
                            errorOverlay();
                        }
                    }
                });
            }

            /**
             * 清除输入的密码
             * @event cancel
             */
            self.cancel = function () {
                self.currentPassword("");
                self.newPassword("");
                self.confirmPassword("");
            };
            
            self.submit_frmPassword = function(){
            	$("#frmPassword").submit();  
            	var txtNewPassword = document.getElementById("txtNewPassword").value;
            	var txtConfirmPassword = document.getElementById("txtConfirmPassword").value;
            	if(txtNewPassword == txtConfirmPassword && txtNewPassword != null && txtConfirmPassword != null){
            		service.logout();
            	}
            };

        }

function checkPWStrength(passValue) {
    function charMode(iN){  
        if (iN>=48 && iN <=57) {  
            return 1;  
        }    
        else if ((iN>=65 && iN <=90) || (iN>=97 && iN <=122)) {  
            return 2;  
        } else { 
        return 4;  
        }        
    }  
    function bitTotal(num){  
        var modes=0;
        var i = 0;        
        for (i=0;i<3;i++){  
            if (num & 1) {
                modes++;  
            }
            num>>>=1;  
        }  
        return modes;  
    }  
    var ret = 0;
    var sPWLength = passValue.length;
    var sPWModes = 0;
    var i= 0;
    for (i= 0; i < sPWLength; i++){  
        sPWModes|=charMode(passValue.charCodeAt(i));  
    } 
    sPWModes = bitTotal(sPWModes); 
    
    if(sPWLength < 6 || (sPWModes == 1 && sPWLength < 10)) {
        ret = 1;
    } 
    else if((sPWModes == 2 && sPWLength >= 6) || (sPWModes == 1 && sPWLength >= 10)) {
        ret = 2;
    }
    else if(sPWModes == 3 && sPWLength >= 6) {
        ret = 3;
    }
    else {
        ret = 1;
    }    
    return ret;
}   
        
function setPWStrengthColor(PWStrength) {
    if(1 == PWStrength) {
        $('#psw_strength_low').css({
            "background-color": "red"
        });
        $('#psw_strength_mid, #psw_strength_hig').css({
            "background-color": "gray"
        });
    } else if(2 == PWStrength) {
        $('#psw_strength_low, #psw_strength_mid').css({
            "background-color": "orange"
        });
        $('#psw_strength_hig').css({
            "background-color": "gray"
        });
    } else if(3 == PWStrength) {
        $('#psw_strength_low, #psw_strength_mid, #psw_strength_hig').css({
            "background-color": "green"
        });
    } else {
        $('#psw_strength_low, #psw_strength_mid, #psw_strength_hig').css({
            "background-color": "gray"
        });
    }
}

/*
$(document).ready( function() {
	$("#txtNewPassword").keypress(function(){
			if($("#txtNewPassword").val().length > 0) {
				setPWStrengthColor(checkPWStrength($("#txtNewPassword").val()));
       		} else {
          	setPWStrengthColor(0);
     		}	
	});
});
*/

        /**
         * 初始化 ViewModel，并进行绑定
         * @method init
         */
        function init() {
            var vm = new modifypasswordVM();
            ko.applyBindings(vm, $('#container')[0]);
			
			$("#txtNewPassword").keydown(function(){
				if($("#txtNewPassword").val().length > 0) {
					setPWStrengthColor(checkPWStrength($("#txtNewPassword").val()));
		        } else {
		            setPWStrengthColor(0);
		        }
			});
			$("#txtNewPassword").keyup(function(){
				if($("#txtNewPassword").val().length > 0) {
					setPWStrengthColor(checkPWStrength($("#txtNewPassword").val()));
		        } else {
		            setPWStrengthColor(0);
		        }
			});
            $('#frmPassword').validate({
                submitHandler:function () {
                    vm.changePassword();
                },
                rules:{
                    txtCurrentPassword:"password_check",
                    txtNewPassword:"password_check",
                    txtConfirmPassword:{ equalToPassword:"#txtNewPassword"}
                }
            });
			
        }

        return {
            init:init
        }
    });
