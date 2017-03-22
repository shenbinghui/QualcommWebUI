//common function
/**
 * 
 *@class util
 */
var lastLoginStatus = 'UNREAL';
var manualLogout = false;

/**
* print the logging information to the console
*
* @method log
* @param {String} what log information
* @param {Object} param 参数数组
*/
function log(what, param) {
	_printLog("log", what, param);
}

/**
* print the debuging information to the console
*
* @method debug
* @param {String} what log information
* @param {Object} param 参数数组
*/
function debug(what, param) {
	_printLog("debug", what, param);
}

/**
* print the information to the console
*
* @method _printLog
* @param {String} level 调试日志等级：debug or info
* @param {String} what log information
* @param {Object} param 参数数组
*/
function _printLog(level, what, param){
	if ($.browser.msie)
		return;
	if (window.console) {
		if (param && typeof what === 'object' && typeof param === 'object') {
			var clone = what;
			$.extend(clone, param);
		}
		if(level == "debug"){
			window.console.debug(what);
		}else{
			window.console.info(what);
		}
	}
}

/**
* 判断对象是不是一个错误对象，包含errorType属性则为错误对象
*
* @method isErrorObject
* @param {Object} param 参数数组
* @return {Boolean} 是否为错误对象
*/
function isErrorObject(object) {
	return typeof object.errorType === 'string';
}

/**
 * 切换语言时,清除之前页面上的检核信息
 * @method clearValidateMsg
 */
function clearValidateMsg(areaId) {
    areaId = areaId || '*';
	$(areaId + ' span.error').remove();
}

/**
 * 翻译下拉列表中的选项
 * @method transOption
 * @param {String} transid 下拉列表中需要翻译的id
 * @param {String} isChannel 判断需要翻译的元素是否是channel
 * @return {Function}
 */
function transOption(transid, isChannel) {
	if (isChannel) {
		return function(item) {
			if (item.value != 0) {
				var val = item.value.split("_");
				return val[1] + "MHz " + $.i18n.prop(transid + '_' + val[0]);
			} else {
				return $.i18n.prop(transid + '_0');
			}
		};
	}
	return function(item) {
		return $.i18n.prop(transid + '_' + item.value);
	};
}

/**
 * 提示成功信息
 * @method successOverlay
 * @param {String} msg
 */
function successOverlay(msg,callback) {
    hideLoading();
    setTimeout(function () {
        showAlert(msg ? msg : 'success_info',callback);
    }, 100);

}

/**
 * 提示失败信息
 * @method errorOverlay
 * @param {String} msg
 */
function errorOverlay(msg,callback) {
    hideLoading();
    setTimeout(function(){
        showAlert(msg ? msg : 'error_info', callback );
    },100);
}

/**
 * 显示提示信息
 * @method showOverLay
 * @param {String} msg 提示信息对应的key
 * @param {String} className 提示信息样式名
 */
function showOverLay(msg, className,isHideLoading) {
    if(isHideLoading){
        hideLoading();
    }
	$('#msgDiv').html($.i18n.prop(msg)).removeClass().addClass(className);
	window.scroll(0, 0);
	$('#msgOverlay').slideDown();
	setTimeout(function() {
		$('#msgOverlay').slideUp();
	}, 2000);
}

function fixLoadingBackground(){
    /*$(".ui-popup-screen.in").css({
        left:"-9999px",
        width:"99999px"
    });*/
}
/**
 * 显示进度条
 * @method showProgressBar
 * @param {String} msg
 * @param {String} content loading 文本
 */
function showProgressBar(msg, content){
    if (msg) {
        $('#barMsg').html($.i18n.prop(msg));
    }
    /*$('#progress').modal({
        position : [ '30%' ],
        overlayId : 'confirm-overlay',
        containerId : 'confirm-container',
        minHeight : 140,
        persist : true,
        focus: false,
        escClose: false
    });*/

    if(content){
        $("#progress #progress_container").html(content);
    } else {
        $("#progress #progress_container").html("");
    }
    $("#progress").show().popup("open");
    fixLoadingBackground();
}

/**
 * 显示进度条百分比
 * @method setProgressBar
 * @param {int} percents 百分比
 */
function setProgressBar(percents) {
    var w = jQuery("#bar").parent().width();
    jQuery("#bar").width(w * percents / 100);
    jQuery("#barValue").text(percents + "%");
}

/**
 * 隐藏进度条
 * @method hideProgressBar
 */
function hideProgressBar() {
    // TODO
    $('#barMsg').html('');
}

/**
 * 显示等待遮罩
 * @method showLoading
 * @param {String} msg
 * @param {String} content loading 文本
 */
function showLoading(msg, content) {
    try{
        $.mobile.loading('hide');
        if (msg) {
            if(content){
                var defaultHtml = "" +
                    "<span class='ui-icon ui-icon-loading'></span>" +
                    "<h1>" + msg + "</h1>" +
                    "<div>" + content + "</div>";
                $.mobile.loading('show', {html: defaultHtml, text: msg, textVisible: true});
            } else {
                $.mobile.loading('show', {text: $.i18n.prop(msg), textVisible: true});
            }
        }else{
            $.mobile.loading('show', {text: $.i18n.prop('waiting'), textVisible: true});
        }
    }catch(e){}
    $("#loadingBackground").removeClass().addClass("ui-popup-screen in");
}

/**
 * 修改等待遮罩的信息
 * @method loadingMsgChange
 * @param {String} msg
 */
function loadingMsgChange(msg) {
	$('#loadMsg').html($.i18n.prop(msg));
}

/**
 * 隐藏等待遮罩
 * @method hideLoading
 */
function hideLoading() {
    try{
//        $("#progress").popup("close");
//        $("#popupCloseRight").popup("close");
        $("#dialog").popup("close");
        $.mobile.loading('hide');
    }catch (e){
    }
    $("#loadingBackground").removeClass().addClass("ui-screen-hidden ui-popup-screen");
}

/**
 * 获取随机数
 * @method getRandomInt
 * @param n
 * @return {Number}
 */
function getRandomInt(n) {
	return Math.round(Math.random() * n);
}

/**
 * 获取当前时间.格式如：2012-1-2 12:33:44
 * @method getCurrentDatetime
 * @return {String}
 */
function getCurrentDatetime() {
	var d = new Date();
	return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + " " + d.getHours() + ":" + d.getMinutes()
			+ ":" + d.getSeconds();
}

/**
 * 获取当前随机时间.格式如：2012-1-2 12:33:44
 * @method getRandomDatetime
 * @return {String}
 */
function getRandomDatetime() {
	var d = new Date();
	return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + " " + getRandomInt(24) + ":" + getRandomInt(60)
			+ ":" + getRandomInt(60);
}

/**
 * 获取逗号分割的当天时间.格式如：2012，1，2，12，33，44
 * @method getRandomDatetimeSep
 * @return {String}
 */
function getRandomDatetimeSep() {
	var d = new Date();
	return d.getFullYear() + "," + (d.getMonth() + 1) + "," + d.getDate() + "," + getRandomInt(24) + "," + getRandomInt(60)
			+ "," + getRandomInt(60);
}

/**
 * 获取当前时间.格式如：2012；01；02；12；33；44+800
 * @method getCurrentTimeString
 * @param {Date} theTime
 * @return {String}
 */
function getCurrentTimeString(theTime) {
	var time = "";
	var d = theTime ? theTime : new Date();
	time += (d.getFullYear() + "").substring(2) + ";";
	time += getTwoDigit((d.getMonth() + 1)) + ";" + getTwoDigit(d.getDate()) + ";" + getTwoDigit(d.getHours()) + ";"
			+ getTwoDigit(d.getMinutes()) + ";" + getTwoDigit(d.getSeconds()) + ";";

	if (d.getTimezoneOffset() < 0) {
		time += "+" + (0 - d.getTimezoneOffset() / 60);
	} else {
		time += (0 - d.getTimezoneOffset() / 60);
	}
	return time;
}

/**
 * 字符串长度不足两位，前面补零
 * @method getTwoDigit
 * @return {String}
 */
function getTwoDigit(num) {
	num += "";
	while (num.length < 2) {
		num = "0" + num;
	}
	return num;
}

function showTips(msgObj) {
    if (typeof msgObj == 'string') {
        $('#tips_message').html($.i18n.prop(msgObj));
    } else {
        var params = [msgObj.msg];
        params.push(msgObj.params);
        $('#tips_message').html($.i18n.prop.apply(null, _.flatten(params)));
    }
    $("#popupCloseRight").show().popup("open");
}

function showDirectionTips(msgObj){
    if (typeof msgObj == 'string') {
        $('#tips_message1').html($.i18n.prop(msgObj));
    } else {
        var params = [msgObj.msg];
        params.push(msgObj.params);
        $('#tips_message1').html($.i18n.prop.apply(null, _.flatten(params)));
    }
    $("#popupCloseRight-popup1").css('max-width', window.innerWidth).show();
    $("#popupCloseRight-screen1").show();
}

function hideDirectionTips(){
    $("#popupCloseRight-screen1, #popupCloseRight-popup1").hide();
}

/**
 * 弹出confirm提示框
 * @method showConfirm
 * @param {Object|String} msgObj
 * @param {Function} callback confirm确认后的回调函数
 * 		如果需要绑定Yes,No两个回调事件，传对象{ok: function(){}, no: function(){}}
 * @param {Number} minHeight
 */
function showConfirm(msgObj, callback, showCancelContinueButton) {
    var option = {
        img : 'img/confirm.png',
        msg : msgObj,
        callback : callback,
        type:"confirm",
        showCancelContinueButton:showCancelContinueButton
    };
    setTimeout(function () {
        popup(option);
    }, 100);
}

/**
 * 弹出Prompt提示框,供用户输入信息
 * @method showPrompt
 * @param {Object|String} msgObj
 * @param {Function} callback Prompt确认后的回调函数
 * @param {Number} minHeight
 * @param {String} defaultValue 输入框内默认值
 */
function showPrompt(msgObj, callback, minHeight, defaultValue) {
    var option = {
        title : 'prompt',
        msg : msgObj,
        minHeight : minHeight,
        showInput : true,
        defaultValue : defaultValue,
        type: "prompt",
        callback: callback
    };
    setTimeout(function () {
        popup(option);
    }, 100);
}

function showUpload(msgObj, callback) {
    var option = {
        img : 'img/confirm.png',
        msg : msgObj,
        callback : callback,
        type:"upload"
    };
    setTimeout(function () {
        popup(option);
    }, 100);
}

/**
 * 弹出alert提示框
 * @method showAlert
 * @param {Object|String} msgObj
 * @param {Function} callback alert确认后的回调函数
 * @param {Number} minHeight
 */
function showAlert(msgObj, callback, minHeight) {
    var option = {
        img : 'img/alert.png',
        msg : msgObj,
        callback : callback,
        type:"alert"
    };
    setTimeout(function () {
        popup(option);
    }, 100);
}

/**
 * 弹出info提示框
 * @method showInfo
 * @param {Object|String} msgObj
 * @param {Number} minHeight
 */
function showInfo(msgObj, minHeight) {
    var option = {
        img : 'img/info.png',
        msg : msgObj,
        callback : $.noop(),
        type:"info"
    };
    popup(option);
}

function showSmsReport(report) {
    var msg = "<div>" + report.content + "</div>" +
        "<div class='side-right margintop10'>" + report.datetime + "</div>";
    var option = {
        img : 'img/info.png',
        msg : msg,
        callback : $.noop(),
        type:"sms_report"
    };
    popup(option);
}

/**
 * 自定义弹出框
 * @method popup
 * @param option
 */
function popup(option) {
    hideLoading();
    if (typeof option.msg == 'string') {
        $('#dialog_message').html($.i18n.prop(option.msg));
    } else {
        var params = [option.msg.msg];
        params.push(option.msg.params);
        $('#dialog_message').html($.i18n.prop.apply(null, _.flatten(params)));
    }

    if (option.showInput) {
        $("div#dialog div.promptDiv").removeClass("hide");
        $("div#dialog div.promptDiv input#promptInput").val(option.defaultValue ? option.defaultValue : "");
        $(".promptErrorLabel", "div.promptDiv").empty();
    } else {
        $("div#dialog div.promptDiv").addClass("hide");
    }

    $('h1#title').html($.i18n.prop(option.type));
    var type = option.type;
    var callback = option.callback;
    var callbackIsFunction = $.isFunction(callback);
    var callbackIsPojo = $.isPlainObject(callback);

    $("#dialog_buttons div").hide();


    if (type == "confirm" || type == "prompt" || type == "upload") {
        var yesBtn = $('#yesbtn');
        var noBtn = $('#nobtn');
        if (option.showCancelContinueButton) {
            yesBtn = $('#continuebtn');
            noBtn = $('#cancelbtn');
        }
        if(type == "upload"){
            yesBtn = $('#uploadbtn');
            noBtn = $('#cancelbtn');
        }
        yesBtn.unbind('click').click(function () {
            $("#dialog").popup("close");
            if (callbackIsFunction) {
                callback();
            } else if (callbackIsPojo && $.isFunction(callback.ok)) {
                callback.ok();
            }
        }).show();

        noBtn.unbind('click').click(function () {
            $("#dialog").popup("close");
            if (callbackIsPojo && $.isFunction(callback.no)) {
                callback.no();
            }
        }).show();
    } else if (type == "info" || type == "alert" || type == "sms_report") {
        $("#okbtn").unbind("click").click(function () {
            $("#dialog").popup("close");
            if (callbackIsFunction) {
                callback();
            }
        }).show();
    }
    $("#dialog").popup("open");
    fixLoadingBackground();
}

var _timeoutStack = [];
var _intervalStack = [];
function addTimeout(code, delay) {
	var time = window.setTimeout(code, delay);
	_timeoutStack.push(time);
	return time;
}

function addInterval(code, delay) {
	var time = window.setInterval(code, delay);
	_intervalStack.push(time);
	return time;
}

function clearTimer() {
	clearTimeoutTimer();
	clearIntervalTimer();
}

function clearTimeoutTimer() {
	for ( var i = 0; i < _timeoutStack.length; i++) {
		window.clearTimeout(_timeoutStack[i]);
	}
    _timeoutStack = [];
}

function clearIntervalTimer() {
	for ( var i = 0; i < _intervalStack.length; i++) {
		window.clearInterval(_intervalStack[i]);
	}
	_intervalStack = [];
}

/**
 * 检查checkbox状态，重绘checkbox
 * @method renderCheckbox
 */
function renderCheckbox() {
    var checkboxToggle = $(".checkboxToggle");

    checkboxToggle.each(function() {
		checkBoxesSize($(this));
	});

    var checkboxes = $(".checkbox").not("[class*='checkboxToggle']").find("input:checkbox");
    if(checkboxes.length == 0){
        disableCheckbox(checkboxToggle);
    } else {
        enableCheckbox(checkboxToggle);
    }
    checkboxes.each(function() {
		checkCheckbox($(this));
	});
}

function checkBoxesSize(selectAll) {
	var target = selectAll.attr("target");
	var boxSize = $("#" + target + " .checkbox input:checkbox").length;
	var checkedBoxSize = $("#" + target + " .checkbox input:checkbox:checked").length;
	var checkbox = selectAll.find("input:checkbox");
	if (boxSize != 0 && boxSize == checkedBoxSize) {
		checkbox.attr("checked", "checked");
	} else {
		checkbox.removeAttr("checked");
	}
	checkP(checkbox);
}

function checkSelectAll(selectAll, target) {
    var theCheckbox = $("#" + target + " .checkbox input:checkbox");
	if (selectAll.attr("checked")) {
        theCheckbox.attr("checked", "checked");
	} else {
        theCheckbox.removeAttr("checked");
	}
    theCheckbox.each(function() {
		checkCheckbox($(this));
	});
}

function checkCheckbox(checkbox) {
	if (checkbox.closest("p.checkbox").hasClass("checkboxToggle")) {
		checkSelectAll(checkbox, checkbox.closest("p.checkbox").attr("target"));
	}
	checkP(checkbox);
	checkBoxesSize($("#" + checkbox.attr("target")));
}

function checkP(checkbox) {
	if (checkbox.attr("checked")) {
		checkbox.closest("p.checkbox").addClass("checkbox_selected");
	} else {
		checkbox.closest("p.checkbox").removeClass("checkbox_selected");
	}
}

function removeChecked(id) {
	$("#" + id).removeClass("checkbox_selected").find("input:checkbox").removeAttr("checked");
}

/**
 * 禁用checkbox
 * @method disableCheckbox
 * @param checkbox
 */
function disableCheckbox(checkbox){
    var chk = checkbox.find("input:checkbox");
    if (chk.attr("checked")) {
        checkbox.addClass('checked_disable');
    } else {
        checkbox.addClass('disable');
    }
}

/**
 * 启用checkbox
 * @method enableCheckbox
 * @param checkbox
 */
function enableCheckbox(checkbox){
    checkbox.removeClass('disable').removeClass("checked_disable");
}

/**
 * 尝试disable掉checkbox，如果len > 0就enable
 * @method tryToDisableCheckAll
 * @param checkbox
 * @param len
 */
function tryToDisableCheckAll(checkbox, len){
    if(len == 0){
        disableCheckbox(checkbox);
    } else {
        enableCheckbox(checkbox);
    }
}

function tryToDisableJqmCheckAll(checkbox,len) {
    try{
        if(len == 0){
            checkbox.attr({'data-disabled':'true','disabled':'disabled'}).addClass('disabled').checkboxradio('disable');
        } else {
            checkbox.attr({'data-disabled': false}).removeAttr('disabled').checkboxradio('enable');
        }
    }catch(e){};

}
// checkbox end
// encode start
/**
 * GSM7编码表
 * @attribute {Array} GSM7_Table
 */
var GSM7_Table = ["000A", "000C", "000D", "0020", "0021", "0022", "0023", "0024", "0025", "0026", "0027", "0028",
    "0029", "002A", "002B", "002C", "002D", "002E", "002F", "0030", "0031", "0032", "0033", "0034", "0035", "0036",
    "0037", "0038", "0039", "003A", "003A", "003B", "003C", "003D", "003E", "003F", "0040", "0041", "0042", "0043",
    "0044", "0045", "0046", "0047", "0048", "0049", "004A", "004B", "004C", "004D", "004E", "004F", "0050", "0051",
    "0052", "0053", "0054", "0055", "0056", "0057", "0058", "0059", "005A", "005B", "005C", "005D", "005E", "005F",
    "0061", "0062", "0063", "0064", "0065", "0066", "0067", "0068", "0069", "006A", "006B", "006C", "006D", "006E",
    "006F", "0070", "0071", "0072", "0073", "0074", "0075", "0076", "0077", "0078", "0079", "007A", "007B", "007C",
    "007D", "007E", "00A0", "00A1", "00A3", "00A4", "00A5", "00A7", "00BF", "00C4", "00C5", "00C6", "00C7", "00C9",
    "00D1", "00D6", "00D8", "00DC", "00DF", "00E0", "00E4", "00E5", "00E6", "00E8", "00E9", "00EC", "00F1", "00F2",
    "00F6", "00F8", "00F9", "00FC", "0393", "0394", "0398", "039B", "039E", "03A0", "03A3", "03A6", "03A8", "03A9",
    "20AC"];

/**
 * GSM7扩展编码表
    * @attribute {Array} GSM7_Table_Extend
    */
var GSM7_Table_Extend = ["007B", "007D", "005B", "005D", "007E", "005C", "005E", "20AC", "007C"];
    /**
     * 获取编码类型
     * @method getEncodeType
     * @param {String} strMessage 待编码字符串
     * @return {String}
     */
    function getEncodeType(strMessage) {
        var encodeType = "GSM7_default";
        var gsm7_extend_char_len = 0;
        if (!strMessage){
            return {encodeType: encodeType, extendLen: gsm7_extend_char_len};
        }
        for (var i = 0; i < strMessage.length; i++) {
            var charCode = strMessage.charCodeAt(i).toString(16).toUpperCase();
            while (charCode.length != 4) {
                charCode = "0" + charCode;
            }
            if ($.inArray(charCode, GSM7_Table_Extend) != -1) {
                gsm7_extend_char_len++;
            }
            if ($.inArray(charCode, GSM7_Table) == -1) {
                encodeType = "UNICODE";
                gsm7_extend_char_len = 0;
                break;
            }
        }
        return {encodeType: encodeType, extendLen: gsm7_extend_char_len};
}

/**
 * unicode编码
 * @method encodeMessage
 * @param textString {String}
 * @return {String} 
 */
function encodeMessage(textString) {
	var haut = 0;
	var result = '';
    if (!textString) return result;
	for ( var i = 0; i < textString.length; i++) {
		var b = textString.charCodeAt(i);
		if (haut != 0) {
			if (0xDC00 <= b && b <= 0xDFFF) {
				result += dec2hex(0x10000 + ((haut - 0xD800) << 10) + (b - 0xDC00));
				haut = 0;
				continue;
			} else {
				haut = 0;
			}
		}
		if (0xD800 <= b && b <= 0xDBFF) {
			haut = b;
		} else {
			cp = dec2hex(b);
			while (cp.length < 4) {
				cp = '0' + cp;
			}
			result += cp;
		}
	}
	return result;
}
var specialChars = ['000D','000A','0009','0000'];
var specialCharsIgnoreWrap = ['0009','0000'];
/**
 * unicode解码
 * @method decodeMessage
 * @param str
 * @param ignoreWrap {Boolean} 忽略回车换行
 * @return any 
 */
function decodeMessage(str, ignoreWrap) {
    if (!str) return "";
    var specials = specialCharsIgnoreWrap;//ignoreWrap ? specialCharsIgnoreWrap : specialChars;
    return str.replace(/([A-Fa-f0-9]{1,4})/g, function (matchstr, parens) {
        if($.inArray(parens, specials) == -1){
            return hex2char(parens);
        } else {
            return '';
        }
    });
}
function dec2hex(textString) {
	return (textString + 0).toString(16).toUpperCase();
}
function hex2char(hex) {
	var result = '';
	var n = parseInt(hex, 16);
	if (n <= 0xFFFF) {
		result += String.fromCharCode(n);
	} else if (n <= 0x10FFFF) {
		n -= 0x10000;
		result += String.fromCharCode(0xD800 | (n >> 10)) + String.fromCharCode(0xDC00 | (n & 0x3FF));
	}
	return result;
}

/**
 * 去除编码中的回车换行等特殊字符
 * @method escapeMessage
 * @param msg
 * @return any 
 */
function escapeMessage(msg) {
	//msg = msg.toUpperCase().replace(/000D|000A|0009|0000/g, "");
	return msg;
}
/**
 * 解析时间字符串
 * @method parseTime
 * @param date {String} 时间字符串
 * @return String
 * @example
 * "12;05;22;14;40;08"
 * OR
 * "12,05,22,14,40,08"
 * OR
 * "12;05;22;14;40;08;+8"
 * OR
 * "12,05,22,14,40,08;+8"
 */
function parseTime(date) {
	if(date.indexOf("+") > -1){
		date = date.substring(0, date.lastIndexOf("+"));
	}
	var dateArr;
	if(date.indexOf(",") > -1){
		dateArr = date.split(",");
	}else{
		dateArr = date.split(";");
	}
	if (dateArr.length == 0) {
		return "";
	} else {
		var time = dateArr[0] + "-" + dateArr[1] + "-" + dateArr[2] + " " + leftInsert(dateArr[3], 2, '0') + ":" + leftInsert(dateArr[4], 2, '0') + ":"
				+ leftInsert(dateArr[5], 2, '0');
		return time;
	}
}

function transTime(data){
    var dateArr = data.split(",");
    if (dateArr.length == 0 || ("," + data + ",").indexOf(",,") != -1) {
        return "";
    } else {
        var time = dateArr[0] + "-" + leftInsert(dateArr[1], 2, '0') + "-" + leftInsert(dateArr[2], 2, '0') + " " + leftInsert(dateArr[3], 2, '0') + ":" + leftInsert(dateArr[4], 2, '0') + ":"
            + leftInsert(dateArr[5], 2, '0');
        return time;
    }

}
// encode end

function getSmsCount(str){
    var encodeType = getEncodeType(str);
    var len = str.length,
        gsm7 = encodeType.encodeType != "UNICODE",
        needChunking = false,
        chunkSize = 0;
    if(gsm7){
        needChunking = (len + encodeType.extendLen) > 160;
        chunkSize = 153;
    }else{
        needChunking = len > 70;
        chunkSize = 67;
    }
    if (needChunking){
        return Math.ceil(len / chunkSize);
    } else {
        return 1;
    }
}

function getInsertPos(textbox) {
    var iPos = 0;
    if (textbox.selectionStart || textbox.selectionStart == "0") {
        iPos = textbox.selectionStart;
    } else if (document.selection) {
        textbox.focus();
        var range = document.selection.createRange();
        var rangeCopy = range.duplicate();
        rangeCopy.moveToElementText(textbox);
        while (range.compareEndPoints("StartToStart", rangeCopy) > 0) {
            range.moveStart("character", -1);
            iPos++;
        }
    }
    return iPos;
}
function setInsertPos(textbox, iPos) {
    textbox.focus();
    if (textbox.selectionStart || textbox.selectionStart == "0") {
        textbox.selectionStart = iPos;
        textbox.selectionEnd = iPos;
    } else if (document.selection) {
        var range = textbox.createTextRange();
        range.moveStart("character", iPos);
        range.collapse(true);
        range.select();
    }
}

function isIntNum(input, num) {
	for (var i = 1; i < 6; i++) {
		if (input == i * num) {
			return true;
		}
	}
	return false;
}
/**
 * 计算长度
 * 
 * @method updateLength
 * @param {String} sms_content 短信内容
 */
function updateLength(sms_content) {
    var length = 0;
    var tmpchr;
    var index = 0;
    for (var i = 0; i < sms_content.length; i++) {
        tmpchr = sms_content.charAt(i);
        length = length + 1;
        if ((tmpchr == "[") || (tmpchr == "]") || (tmpchr == "{") || (tmpchr == "}") || (tmpchr == "|")
            || (tmpchr == "\\") || (tmpchr == "^") || (tmpchr == "~") || (tmpchr == "€")) {
            length = length + 1;
        }
        index = i;
        if (length == 765) {
            break;
        }
        if (length > 765) {
            index = i - 1;
            length = length - 2;
            break;
        }
    }
    return {index:index, length:length};
}

/**
 * 转化协议
 * //from 4.0
 * @method transProtocol
 * @return {*}
 */
function transProtocol(proto) {
    var type = "NONE";
    if ("1" == proto)
        type = "TCP";
    else if ("2" == proto)
        type = "UDP";
    else if ("3" == proto)
        type = "TCP+UDP";
    else if ("4" == proto)
        type = "ICMP";
    else if ("5" == proto)
        type = "NONE";
    return type;
}

function transProtocolValue(proto) {
    switch(proto) {
        case "TCP":
        case "UDP":
        case "ICMP":
            return proto;
        case "TCP&UDP":
            return "TCP+UDP";
        case "None":
        default:
            return "NONE";
    }
}

/**
 * 检查数值范围
 * @method checkRange
 */
function checkRange(str, min, max) {
    var intVal = parseInt(str, 10);
    return !(intVal > max || intVal < min);
}

/**
 * 文件类型映射，现在支持：音频，视频，图片，普通文件
 * @attribute {JSON} extMap
 */
var extMap = {
	mp3 : [ "mp3", "wma", "wav" ],
	film : [ "mp4", "avi", "rm", "rmvb", "3gp", "mpeg" ],
	picture : [ "jpeg", "jpg", "gif", "bmp", "png" ],
	pdf : ['pdf'],
	rar : ['rar', '7z', 'zip', 'gzip', 'gz', 'tar'],
	doc : ['doc', 'docx'],
	ppt : ['ppt', 'pptx'],
	xls : ['xls', 'xlsx'],
	xml : ['xml']
};

/**
 * 获取文件类型
 * @method getFileType
 * @param {String} fileName 带扩展名的文件名
 */
function getFileType(fileName) {
	var ext = fileName.split('.').pop().toLowerCase();
	for (type in extMap) {
		if ($.inArray(ext, extMap[type]) != -1) {
			return type;
		}
	}
	return "file";
}

function transUnixTime(millisecond) {
    var time = new Date(parseInt(millisecond, 10));
    var year = time.getFullYear();
    var month = leftPad(time.getMonth() + 1, 2, "0");
    var date = leftPad(time.getDate(), 2, "0");
    var hour = leftPad(time.getHours(), 2, "0");
    var minute = leftPad(time.getMinutes(), 2, "0");
    var second = leftPad(time.getSeconds(), 2, "0");

    //2012-08-08 08:08:08
    return  year + "-" + month + "-" + date + " " + hour + ":" + minute + ":" + second;
}

function leftPad(value, length, placeholder) {
    var len = value.toString().length;
    for (; len < length; len++) {
        value = placeholder + value;
    }
    return value;
};

/**
 * 将电话号码中的+号转换成_.jquery选择器中不能有+号
 * @method convertNumberToId
 * @param number {String} 电话号码
 * @return {String}
 */
function convertNumberToId(number){
	return number.replace(/[\+\*#]/g, '_');
}

/**
 * 获取号码末8/11位
 * @method getLastNumber
 * @param number {String} 电话号码
 * @param len {String} 获取位数8或11
 * @return
 */
function getLastNumber(number, len){
	if(number.length > len){
		return convertNumberToId(number.substring(number.length - len, number.length));
	}
	return convertNumberToId(number);
}

/**
 * 调整ie8以下的table高度
 * @method fixTableHeight
 */
function fixTableHeight() {
    if($.browser.msie) {
        var heightTimer = setInterval(function() {
            var $table = $(".fixTableScroll")[0];
            if($table) {
                var scrollHeight = $table.scrollHeight;
                if(scrollHeight != 0) {
                    $table.style.height = scrollHeight + 20;
					window.clearInterval(heightTimer);
                }
            }
            else {
                //快速切换菜单需要清除定时器
				window.clearInterval(heightTimer);
            }
        }, 300);
    }
}

function refreshTableHeight() {
    if($.browser.msie) {
        $(".fixTableScroll")[0].style.height = $(".fixTableScroll .ko-grid-container")[0].scrollHeight + 35;
    }
}

/**
 * 速度及流量翻译
 * 
 * @method transUnit
 * @param {Number}
 *            data 速度值
 * @param {Boolean}
 *            isSpeed 是否是翻译速度
 */
function transUnit(data, isSpeed) {
    if (isSpeed) {
        return getDisplayBpsVolume(parseInt(data, 10)) || "0bps";
    } else {
        return getDisplayVolume(parseInt(data, 10)) || "0MB";
    }
}

/**
 * 翻译联网时长
 * 
 * @method transSecond2Time
 * @param {Number}
 *            secs 联网时间（秒）
 */
function transSecond2Time(secs) {
	var isNegative = false;
	if(secs < 0){
		isNegative = true;
		secs = 0 - secs;
	}
	var hour = Math.floor(secs / 3600);
	secs = secs % 3600;
	var minu = Math.floor(secs / 60);
	secs = secs % 60;
	return (isNegative ? '-' : '') + leftInsert(hour, 2, '0') + ":" + leftInsert(minu, 2, '0') + ":" + leftInsert(secs, 2, '0');
}

/**
 * 长度不足时，左侧插入特定字符
 * @param {String} value
 * @param {Integer} length
 * @param {String} placeholder
 * @return {String}
 */
function leftInsert(value, length, placeholder){
    var len = value.toString().length;
    for (; len < length; len++) {
        value = placeholder + value;
    }
    return value;
}

/**
 * 文件大小数值换算，并生成显示文字附带单位
 * @method getDisplayVolume
 * @param {Integer} volume 容量数值，单位B
 */
function getDisplayVolume(volume) {
	volume = parseInt(volume, 10);
	if (volume == "" || volume == "0") {
		return "";
	}
	var needReverse = false;
	if(volume < 0){
		needReverse = true;
		volume = 0 - volume;
	}
	var numberOfBytesInOneB = 1;
	var numberOfBytesInOneKB = numberOfBytesInOneB * 1024;
	var numberOfBytesInOneMB = numberOfBytesInOneKB * 1024;
	var numberOfBytesInOneGB = numberOfBytesInOneMB * 1024;
	var numberOfBytesInOneTB = numberOfBytesInOneGB * 1024;

	var labelForOneB = 'B';
	var labelForOneKB = 'KB';
	var labelForOneMB = 'MB';
	var labelForOneGB = 'GB';
	var labelForOneTB = 'TB';

	var vol = volume / numberOfBytesInOneTB;
	var displayString = roundToTwoDecimalNumber(vol) + labelForOneTB;
	if (vol < 0.5) {
		vol = volume / numberOfBytesInOneGB;
		displayString = roundToTwoDecimalNumber(vol) + labelForOneGB;
	
		if (vol < 0.5) {
			vol = volume / numberOfBytesInOneMB;
			displayString = roundToTwoDecimalNumber(vol) + labelForOneMB;
	
			//if (vol < 0.5) {
			//	vol = volume / numberOfBytesInOneKB;
			//	displayString = roundToTwoDecimalNumber(vol) + labelForOneKB;
            //
			//	if (vol < 0.5) {
			//		vol = volume;
			//		displayString = roundToTwoDecimalNumber(vol) + labelForOneB;
			//	}
			//}
		}
	}
	if(needReverse){
		displayString = "-" + displayString;
	}
	return displayString;
}

function getDisplayVolume_datausage(volume) {
    volume = parseFloat(volume)*1024*1024;
    if (volume == "" || volume == "0") {
        return "";
    }
    var needReverse = false;
    if(volume < 0){
        needReverse = true;
        volume = 0 - volume;
    }
    var numberOfBytesInOneB = 1;
    var numberOfBytesInOneKB = numberOfBytesInOneB * 1024;
    var numberOfBytesInOneMB = numberOfBytesInOneKB * 1024;
    var numberOfBytesInOneGB = numberOfBytesInOneMB * 1024;
    var numberOfBytesInOneTB = numberOfBytesInOneGB * 1024;

    var labelForOneB =  'B';
    var labelForOneKB = 'KB';
    var labelForOneMB = 'MB';
    var labelForOneGB = 'GB';
    var labelForOneTB = 'TB';

    var vol = volume / numberOfBytesInOneTB;
    var displayString = roundToTwoDecimalNumber(vol) + labelForOneTB;
    if (vol < 0.5) {
        vol = volume / numberOfBytesInOneGB;
        displayString = roundToTwoDecimalNumber(vol) + labelForOneGB;

        if (vol < 0.5) {
            vol = volume / numberOfBytesInOneMB;
            displayString = roundToTwoDecimalNumber(vol) + labelForOneMB;
            if (vol < 0.5) {
                vol = volume / numberOfBytesInOneKB;
                displayString = roundToTwoDecimalNumber(vol) + labelForOneKB;

                if (vol < 0.5) {
                    vol = volume;
                    displayString = roundToTwoDecimalNumber(vol) + labelForOneB;
                }
            }
        }
    }
    if(needReverse){
        displayString = "-" + displayString;
    }
    return displayString;
}

function getDisplayBpsVolume(volume){
    volume = parseInt(volume, 10);
    if (volume == "" || volume == "0") {
        return "";
    }
    volume = volume * 8;
    var needReverse = false;
    if(volume < 0){
        needReverse = true;
        volume = 0 - volume;
    }
    var numberOfBytesInOneB = 1;
    var numberOfBytesInOneKB = numberOfBytesInOneB * 1024;
    var numberOfBytesInOneMB = numberOfBytesInOneKB * 1024;
    var numberOfBytesInOneGB = numberOfBytesInOneMB * 1024;
    var numberOfBytesInOneTB = numberOfBytesInOneGB * 1024;

    var labelForOneB = 'bps';
    var labelForOneKB = 'Kbps';
    var labelForOneMB = 'Mbps';
    var labelForOneGB = 'Gbps';
    var labelForOneTB = 'Tbps';

    var vol = volume / numberOfBytesInOneTB;
    var displayString = roundToTwoDecimalNumber(vol) + labelForOneTB;
    if (vol < 0.5) {
        vol = volume / numberOfBytesInOneGB;
        displayString = roundToTwoDecimalNumber(vol) + labelForOneGB;

        if (vol < 0.5) {
            vol = volume / numberOfBytesInOneMB;
            displayString = roundToTwoDecimalNumber(vol) + labelForOneMB;

            if (vol < 0.5) {
                vol = volume / numberOfBytesInOneKB;
                displayString = roundToTwoDecimalNumber(vol) + labelForOneKB;

                if (vol < 0.5) {
                    vol = volume;
                    displayString = roundToTwoDecimalNumber(vol) + labelForOneB;
                }
            }
        }
    }
    if(needReverse){
        displayString = "-" + displayString;
    }
    return displayString;
}

/**
 * 将数字保留两位小数
 * @method roundToTwoDecimalNumber
 * @param {Integer} num 浮点数值
 */
function roundToTwoDecimalNumber(num) {
	return Math.round(num * 100) / 100;
}

/**
 * HTML编码转换
 * @method HTMLEncode
 * @param {String} html 待编码内容
 */
function HTMLEncode(html) {
    var temp = document.createElement("div");
    (temp.textContent != null) ? (temp.textContent = html) : (temp.innerText = html);
    var output = temp.innerHTML;
    output = output.replace(new RegExp(" ", "gm"), "&nbsp;");
    temp = null;
    return output;
}

/**
 * HTML解码转换
 * @method HTMLDecode
 * @param {String} text 待解码内容
 */
function HTMLDecode(text) {
    var temp = document.createElement("div");
    temp.innerHTML = text;
    var output = temp.innerText || temp.textContent;
    output = output.replace(new RegExp("&nbsp;", "gm"), " ");
    temp = null;
    return output;
}

/**
 * 获取两位精度的百分比，默认两位精度
 * @method getPercent
 * @param {Number} numerator 分子
 * @param {Number} denominator 分母
 * @param {Integer} accuracy 精度
 */
function getPercent(numerator, denominator, accuracy){
	
	if(accuracy){
		accuracy = accuracy * 10;
	} else {
		accuracy = 100;
	}
	return roundToTwoDecimalNumber(numerator / denominator * accuracy) + "%";
}

/**
 * 检查是否联网
 * "ppp_connected" || "ipv6_connected" || "ipv4_ipv6_connected"
 * @method checkConnectedStatus
 */
function checkConnectedStatus(currentConnStatus) {
    return currentConnStatus == "ppp_connected" || currentConnStatus == "ipv6_connected" || currentConnStatus == "ipv4_ipv6_connected";
}

/**
 * 禁用按钮
 * @method disableBtn
 */
function disableBtn($btn) {
    var parent = $btn.parent(".ui-input-btn");
    if(parent[0]) {
        if(!parent.hasClass('ui-state-disabled')) {
            parent.removeClass('ui-focus');
            $btn.button('disable');
        }
    } else {
        $btn.attr("disabled", true);
    }
}

/**
 * 按钮可用
 * @method enableBtn
 */
function enableBtn($btn) {
    var parent = $btn.parent(".ui-input-btn");
    if(parent[0]) {
        if(parent.hasClass('ui-state-disabled')) {
            $btn.button('enable');
        }
    } else {
        $btn.attr("disabled", false);
    }
}

function replaceSpaceWithNbsp(str){
    return str.replace(/ /g,'&nbsp;');
}
function syncSelectAndChosen(select, choices){
    var choicesNums = getSelectValFromChosen(choices);
    select.val(choicesNums);
    return choicesNums;
}
function getSelectValFromChosen(choices){
    var choicesNums = [];
    $.each(choices, function(i,n){
        var arr = $(n).text().split('/');
        choicesNums.push(arr[arr.length - 1]);
    });
    return choicesNums;
}

function setCookie(c_name, value, expiredays) {
    var exdate = new Date()
    exdate.setDate(exdate.getDate() + expiredays)
    document.cookie = c_name + "=" + escape(value) +
        ((expiredays == null) ? "" : ";expires=" + exdate.toGMTString())
}

function getCookie(c_name) {
    if (document.cookie.length > 0) {
        var c_start = document.cookie.indexOf(c_name + "=")
        if (c_start != -1) {
            c_start = c_start + c_name.length + 1
            var c_end = document.cookie.indexOf(";", c_start)
            if (c_end == -1) c_end = document.cookie.length
            return unescape(document.cookie.substring(c_start, c_end))
        }
    }
    return "";
}

function getCookieRememberPassword(){
    var r = getCookie("remember");
    if (r == 'true') {
        var p = getCookie("password");
        return {remember: true, password: p};
    } else {
        return {remember: false, password: ""};
    }
}

function setCookieRememberPassword(remember, password) {
    setCookie("remember", remember, 7);
    if (remember) {
        setCookie("password", password, 7);
    } else {
        setCookie("password", "", 7);
    }
}

function IsPC() {
    var userAgentInfo = window.navigator.userAgent;
    var Agents = new Array("Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod");
    var flag = true;
    for (var v = 0; v < Agents.length; v++) {
        if (userAgentInfo.indexOf(Agents[v]) > 0) {
            flag = false;
            break;
        }
    }
    return false;//flag;
}

function macCheck(value, element, param) {
    var isMac = /^([0-9a-fA-F][0-9a-fA-F]:){5}([0-9a-fA-F][0-9a-fA-F])$/.test(value);
    if(isMac) {
        var macArr = value.toUpperCase().split(':');
        var sub1 = '0x'+macArr[0];
        return !checkAllField(macArr, 'FF') && !checkAllField(macArr, '00') && ((sub1 & 1)!=1);
    }

    function checkAllField(itemArr, value) {
        return _.all(itemArr, function(item) {
            return item == value;
        });
    }

    //return this.optional(element) || isMac;
    return isMac;
}

function convertSignal(data) {
    var type_2g = ["GSM", "GPRS", "EDGE", "G", "E"];
    var type_3g = ["UMTS", "HSDPA", "HSUPA", "HSPA", "HSPA+", "DC-HSPA+", "WCDMA", "TD-SCDMA", "TD", "3G"];
    var type_4g = ["LTE", "4G", "FDD", "TDD"];
    if ($.inArray(data.network_type, type_2g) != -1) {
        return data.rssi;
    } else if ($.inArray(data.network_type, type_3g) != -1) {
        return data.rscp;
    } else if ($.inArray(data.network_type, type_4g) != -1) {
        return data.lte_rsrp;
    }
}
/**
 * 时间只能格式化
 * /y{4}|M{2}|d{2}|h{2}|H{2}|m{2}|s{2}/g
 * @param a 时间戳
 * @returns {String}
 */
function smartDate(a){
    var e = parseInt(a, 10),
        f = new Date(e),
        g = new Date,
        h = new Date(g.getDate()) - new Date(f.getDate());
    if (f.getFullYear() !== g.getFullYear() || f.getMonth() !== g.getMonth()) {
        var i = g.getFullYear() - f.getFullYear();
        return i > 0 ? FormatDate('yyyy-MM-dd', e) : FormatDate('MM-dd', e)
    }
    switch (h) {
        case 0:
            return FormatDate($.i18n.prop('today') + " HH:mm", e);
        case 1:
            return FormatDate($.i18n.prop('yesterday') + " " + 'MM-dd', e);
//            case 2:
//                return FormatDate($.i18n.prop('dayBeforeYesterday') + " " + 'MM-dd', e);
        default:
            return FormatDate('MM-dd', e);
    }
}

function smartTime(timestamp, format){
    return FormatDate(format ? format : "HH:mm:ss", timestamp);
}

/**
 *
 * @param a 格式
 * @param b 时间
 * @returns {Function}
 * @constructor
 */
function FormatDate(a, b) {
    b = b ? new Date(parseInt(b, 10)) : new Date;
    var c = a;
    return c = c.replace(/y{4}|M{2}|d{2}|h{2}|H{2}|m{2}|s{2}/g, function () {
        var a = arguments[0];
        switch (a) {
            case "yyyy":
                return b.getFullYear();
            case "MM":
                var c = b.getMonth() + 1;
                return c < 10 ? "0" + c : c;
            case "dd":
                var d = b.getDate();
                return d < 10 ? "0" + d : d;
            case "HH":
                var e = b.getHours();
                return e < 10 ? "0" + e : e;
            case "hh":
                var e = b.getHours();
                return e > 12 && (e -= 12),
                        e < 10 ? "0" + e : e;
            case "mm":
                var c = b.getMinutes();
                return c < 10 ? "0" + c : c;
            case "ss":
                var f = b.getSeconds();
                return f < 10 ? "0" + f : f
        }
    });
}

function confirmToPCView() {
    showConfirm('confirm_to_pcview', function() {
        window.location.href='../index.html'
    });
}