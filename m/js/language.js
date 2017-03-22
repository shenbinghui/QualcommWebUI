/**
 * @module language
 * @class language
 */
define(['service',
        'jquery'],
function(service, $) {

    /**
     * 根据语言项加载语言资源并翻译页面上的body部分
     * @method setLocalization
     * @param {String} locale 语言项:zh-cn
     */
    function setLocalization(locale){
        $.i18n.properties({
            name:'Messages',
            path:'i18n/',
            mode:'map',
            cache: true,
            language:locale,
            callback: function() {
                $.validator.messages = $.i18n.map;
//                window.document.title =
                $('body').translate();
            }
        });
    }

    /**
     * 获取语言项
     * @method getLanguage
     */
    function getLanguage() {
        return service.getLanguage();
    }

    /**
     * 初始化语言VM并绑定
     * @method init
     */
    function init() {
        var currentLan = getLanguage().Language;
        setLocalization(currentLan);
    }

    return {
        init: init,
        getLanguage: getLanguage,
        setLocalization: setLocalization
    };
});
