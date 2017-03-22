define(["language", "router", "service",  "status_check", "login"], function(language, router, service, status) {
    function init() {
        language.init();
        service.timerUpdater(function() {
            router.init();
            status.init();
        });

        $("#container").on("click", ".show-password", function(event){
            var $this = $(this);
            $this.toggleClass('show-password-on');
            var $input = $('#' + $this.attr('data-for'), '#container');
            if($this.hasClass('show-password-on')) {
                $input.attr('type', 'text');
            } else {
                $input.attr('type', 'password');
            }
        });
    }

    return {
        init: init
    }
});
