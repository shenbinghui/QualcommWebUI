define(['service', 'config/config'], function(service, config) {
    var $txtCurrentPassword;
    var $txtNewPassword;
    var $txtConfirmPassword;

    function changePassword() {
        var para = {
            oldPassword: $txtCurrentPassword.val(),
            newPassword: $txtNewPassword.val()
        };
        showLoading();
        service.changePassword(para, function (data) {
            cancel();
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

    function cancel() {
        $txtCurrentPassword.val('');
        $txtNewPassword.val('');
        $txtConfirmPassword.val('');
    }

    function init() {
        var $form = $('#frmPassword');
        $txtCurrentPassword = $('#txtCurrentPassword');
        $txtNewPassword = $('#txtNewPassword');
        $txtConfirmPassword = $('#txtConfirmPassword');

        $('#passwordSave').click(function() {
            $form.submit();
        });

        $form.validate({
            submitHandler:function () {
                changePassword();
            },
            rules:{
                txtCurrentPassword:"password_check",
                txtNewPassword:"password_check",
                txtConfirmPassword:{ equalToPassword:"#txtNewPassword"}
            }
        });
    }

    return {
        init: init
    }
});
