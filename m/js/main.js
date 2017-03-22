window.zte_web_ui_is_test = false;

require.config( {

    paths: {
        "views": "../views",
        "jquery": "lib/jquery/jquery-1.11.1.min",
        "jqm": "lib/jquery/jquery.mobile-1.4.3.min",
        "underscore": "lib/underscore/underscore-min",
        "knockout": "lib/knockout/knockout-3.0.0",
        "text": "lib/require/text",
        "director": "lib/director.min",
        "jq_i18n": 'lib/jquery/jquery.i18n.properties-1.0.9',
        "jq_translate": 'lib/jquery/translate',
        "jq_validate": 'lib/jquery/jquery.validate',
        "jq_additional": 'lib/jquery/additional-methods',
        "base64": 'lib/base64',
        "echarts": 'lib/echarts',
        "echarts/chart/pie": 'lib/echarts'
    },

    shim: {
        jq_translate: ['jq_i18n'],
        jq_additional: ['jq_validate'],
        util: ['jquery']
    }
    //,urlArgs: 'v=1.0'
} );

require(["jquery", "app", 'util'], function($, app, util) {

    $(document).on( "mobileinit",
        function() {
            $.mobile.ajaxEnabled = false;
            $.mobile.pushStateEnabled = false;
            //$.mobile.linkBindingEnabled = false; 注释掉后可以防止点击链接改变hash
            $.mobile.hashListeningEnabled = false;
            //$.mobile.autoInitializePage = false;
            $.mobile.pageContainer = $("body");
        }
    );

    require( [zte_web_ui_is_test? 'simulate' : '', "jqm", "jq_translate", "jq_additional", "base64"], function(simulate) {
        if(zte_web_ui_is_test) {
            window.simulate = simulate;
        }

        app.init();
        $('#main').removeClass('hide');
        //set the min-height
        $.mobile.resetActivePageHeight();
    });
} );
