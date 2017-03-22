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
            if (window.console.debug) {
                window.console.debug(what);
            } else if (window.console.warn) {
                window.console.warn(what);
            }
        } else {
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
	$(areaId + ' label.error').remove();
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
function successOverlay(msg, isContinueLoading) {
	showOverLay(msg ? msg : 'success_info', 'overlay-success', !isContinueLoading);
}

/**
 * 提示失败信息
 * @method errorOverlay
 * @param {String} msg
 */
function errorOverlay(msg, isContinueLoading) {
    showOverLay(msg ? msg : 'error_info', 'overlay-error', !isContinueLoading);
}

/**
 * 显示提示信息
 * @method showOverLay
 * @param {String} msg 提示信息对应的key
 * @param {String} className 提示信息样式名
 */
function showOverLay(msg, className,isHideLoading) {
    $.modal.close();
    if (msg) {
        $('#result-image', '#result-overlay').removeClass().addClass(className);
        $('#result_wording').html('<h2>' + $.i18n.prop(msg) + '</h2>');
    }
    $('#result-overlay').modal({
        zIndex: 3000,
        position : [ '30%' ],
        overlayId : 'confirm-overlay',
        containerId : 'confirm-container',
        minHeight : 140,
        persist : true,
        focus: false,
        escClose: false
    });

    var count = 3;
    var overlayTimer = setInterval(function () {
        count--;
        if (count == 0) {
			clearInterval(overlayTimer);
           	if($('#result-overlay:visible').length > 0) {
				$.modal.close();
			}
        }
    }, 1000);
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
    $('#progress').modal({
        zIndex: 3000,
        position : [ '30%' ],
        overlayId : 'confirm-overlay',
        containerId : 'confirm-container',
        minHeight : 140,
        persist : true,
        focus: false,
        escClose: false
    });

    if(content){
        $("#progress #progress_container").html(content);
    } else {
        $("#progress #progress_container").html("");
    }
}

/**
 * 显示进度条百分比
 * @method setProgressBar
 * @param {int} percents 百分比
 */
function setProgressBar(percents){
    jQuery("#bar").width(400*percents/100);
    jQuery("#barValue").text(percents + "%");
}

/**
 * 隐藏进度条
 * @method hideProgressBar
 */
function hideProgressBar() {
    $.modal.close();
    setProgressBar(0);
    $('#barMsg').html('');
}
/**
 * 显示等待遮罩
 * @method showLoading
 * @param {String} msg
 * @param {String} content loading 文本
 * @param {String} content alert 文本
 */
function showLoading(msg, content, contentAlert) {
	if (msg) {
		$('#loadMsg').html($.i18n.prop(msg));
	} else {
		$('#loadMsg').html('');
	}
	$('#loading').modal({
        zIndex: 3000,
		position : [ '30%' ],
		overlayId : 'confirm-overlay',
		containerId : 'confirm-container',
		minHeight : 140,
		persist : true,
        focus: false,
        escClose: false
	});
    var loading = $("#loading #loading_container");
    var a = "<a href='javascript:void(0)'>&nbsp;</a>";
	if(content){
		loading.html(content + a);
	} else {
		loading.html(a);
	}
	
	if(contentAlert) {
		$('#loading #loading_wording').html($.i18n.prop(contentAlert));
	} else {
		$("#loading #loading_wording").html("");
	}
    $("a:last", loading).focus().hide();
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
	$('#confirm-overlay').css("cursor","default");
	$.modal.close();
	$('#loadMsg').html('');
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

/**
 * 弹出confirm提示框
 * @method showConfirm
 * @param {Object|String} msgObj
 * @param {Function} callback confirm确认后的回调函数
 * 		如果需要绑定Yes,No两个回调事件，传对象{ok: function(){}, no: function(){}}
 * @param {Number} minHeight
 */
function showConfirm(msgObj, callback, minHeight,yesTrans,noTrans) {
    if (yesTrans) {
        $('#yesbtn').attr("data-trans", yesTrans);
    } else {
        $('#yesbtn').attr("data-trans", "yes");
    }
    if (noTrans) {
        $('#nobtn').attr("data-trans", noTrans);
    } else {
        $('#nobtn').attr("data-trans", "no");
    }
    $('#yesbtn, #nobtn').translate();
	var option = {
		title : 'confirm',
		img : 'img/confirm.png',
		msg : msgObj,
		minHeight : minHeight
	};

	popup(option);
	
	$('#yesbtn, #nobtn').show();
	$('#okbtn').hide();
	
	var callbackIsFunction = $.isFunction(callback);
	var callbackIsPojo = $.isPlainObject(callback);
	$('#yesbtn').unbind('click').click(function() {
		$.modal.close();
		if (callbackIsFunction) {
			callback();
		} else if(callbackIsPojo && $.isFunction(callback.ok)){
			callback.ok();
		}
	});

	$('#nobtn').unbind('click').click(function() {
		$.modal.close();
		if(callbackIsPojo && $.isFunction(callback.no)){
			callback.no();
		}
	});
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
		img : 'img/confirm.png',
		msg : msgObj,
		minHeight : minHeight,
		showInput : true,
		defaultValue : defaultValue
	};

	popup(option);
	
	$('#yesbtn, #nobtn').unbind('click').show();
	$('#okbtn').hide();
	
	$('#yesbtn').click(function() {
		if ($.isFunction(callback)) {
			if(callback()){
				$.modal.close();
			}
		}
	});
	
	$('#nobtn').click(function() {
		$.modal.close();
	});

    $("#promptInput", "#confirm").unbind('keypress').bind('keypress', function(event){
        if(event.keyCode == 13){
            $('#yesbtn').trigger("click");
        }
    });
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
		title : 'alert',
		img : 'img/alert.png',
		msg : msgObj,
		minHeight : minHeight
	};
	popup(option);
	
	$('#yesbtn, #nobtn').hide();
	$('#okbtn').unbind('click').click(function() {
        $.modal.close();
        if ($.isFunction(callback)) {
            callback();
        }
    }).show();

}
//为CPE的弹出窗口进行设置模式设计
function showSettingWindow(title, htmlPath, jsPath, minWidth, minHeight, callback) {
	var option = {
		title : title,
		htmlPath : htmlPath,
		jsPath : jsPath,
		minHeight : minHeight,
		minWidth : minWidth
	};

	var callbackIsFunction = $.isFunction(callback);
	var callbackIsPojo = $.isPlainObject(callback);

	popupSettingWindow(option);
}

function popupSettingWindow(option){
	$.modal.close();
	var minHeight = option.minHeight || 140;
	var minWidth = option.minWidth || 400;
	//$('#settingTitle').html($.i18n.prop(option.title));
	var subContainer = $("#htmlContainer");
	
	var tmplPath = 'text!tmpl/' + option.htmlPath + '.html';
	require([tmplPath, option.jsPath], function(tmpl, viewModel) {
		subContainer.stop(true, true);
		subContainer.hide();
		subContainer.html(tmpl);
		viewModel.init();
		$('#htmlContainer').translate();
		subContainer.show();
		$('#htmlContainer').css("opacity", 50);
	});

    $('#popupSettingWindow').modal({
        zIndex: 3000,
        position : [ "30%" ],
        escClose : false,
        minWidth: minWidth,
        minHeight : minHeight,
        maxWidth: 400,
        opacity: 50
    });
}

function hidePopupSettingWindow(){
	$("#popupSettingWindow").remove();
	$.modal.close();
}

/**
 * 弹出info提示框
 * @method showInfo
 * @param {Object|String} msgObj
 * @param {Number} minHeight
 */
function showInfo(msgObj, minHeight) {
	var option = {
		title : 'info',
		img : 'img/info.png',
		msg : msgObj,
		minHeight : minHeight
	};
	popup(option);
	
	$('#yesbtn, #nobtn').hide();
	$('#okbtn').unbind('click').click(function() {
        $.modal.close();
    }).show();
}

/**
 * 自定义弹出框
 * @method popup
 * @param option
 */
function popup(option) {
    $.modal.close();
	var minHeight = option.minHeight || 140;
    $('#confirm').modal({
        zIndex: 3000,
        position : [ "30%" ],
        overlayId : 'confirm-overlay',
        containerId : 'confirm-container',
        escClose: false,
        minHeight : minHeight
    });
    var $confirmDiv = $('div#confirm');
	$('#confirmImg', $confirmDiv).attr('src', option.img);
	$('#popTitle', $confirmDiv).html($.i18n.prop(option.title));
	if (typeof option.msg == 'string') {
		$('.message', $confirmDiv).html($.i18n.prop(option.msg));
	} else {
        var params = [option.msg.msg];
        params.push(option.msg.params);
		$('.message', $confirmDiv).html($.i18n.prop.apply(null, _.flatten(params)));
	}
    var $promptDiv = $("div.promptDiv", $confirmDiv);
	if (option.showInput === true){
        $promptDiv.show();
		$("input#promptInput", $promptDiv).val(option.defaultValue ? option.defaultValue : "");
        $(".promptErrorLabel", $promptDiv).empty();
	} else {
        $promptDiv.hide();
	}

	window.setTimeout(function() {
		$(':input:enabled:visible:first', '#confirm-container').focus();
	} ,0);
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
// checkbox start
$(document).ready(function() {
	// checkbox 绑定有click事件，需要手动处理时，需要增加 manualControl=“true"
	$("[manualControl!=true].checkbox").live("click", function(event) {
        var $this = $(this);
        if($this.hasClass('disable')){
            return false;
        }
		var checkbox = $this.find("input:checkbox");
		if (checkbox.attr("checked")) {
			checkbox.removeAttr("checked");
		} else {
			checkbox.attr("checked", "checked");
		}
		checkCheckbox(checkbox);
		event.stopPropagation();
		return true;
	});
	$('input[type="text"][noAction!="true"],input[type="password"][noAction!="true"],select').live("focusin", function(event) {
		$(this).addClass("focusIn");
	}).live("focusout", function(event) {
		$(this).removeClass("focusIn");
	});
	
	/*$('table.colorHoverTable tr').live('mouseover', function(){
		$(this).addClass('trMouseover');
	}).live('mouseout', function(){
		$(this).removeClass('trMouseover');
	});*/

	$(".form-note .notes-title").live('click', function(){
		var $this = $(this);
		$this.siblings("ul.notes-content:first").slideToggle();
		$this.toggleClass("notes-dot");
	});
});

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
        var time = dateArr[0] + "/" + dateArr[1] + "/" + dateArr[2] + " " + leftInsert(dateArr[3], 2, '0') + ":" + leftInsert(dateArr[4], 2, '0') + ":"
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
        return Math.ceil((len + encodeType.extendLen) / chunkSize);
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
    var type = "ALL";
    if ("1" == proto)
        type = "TCP";
    else if ("2" == proto)
        type = "UDP";
    else if ("3" == proto)
        type = "TCP+UDP";
    else if ("4" == proto)
        type = "ICMP";
    else if ("5" == proto)
        type = "ALL";
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
            return "ALL";
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
    var result = getDisplayVolume(data, isSpeed);
    if (result == "") {
        result = isSpeed ? "0b" : "0MB";
    }
    if (isSpeed) {
        result += "/s";
    }
    return result;
}

function transTimeUnit(data) {
	data = parseFloat(data);
    if (data == "") {
        return result = "0hour";
    }
	var needReverse = false;
	if(data < 0){
		needReverse = true;
		data = 0 - data;
	}

    var labelForOneMinute = 'minute';
    var labelForOneHour = 'hour';
	
    var vol = data / 3600;
	var result = roundToTwoDecimalNumber(vol) + labelForOneHour;
	if (vol < 1) {
		vol = data / 60;
		result = roundToTwoDecimalNumber(vol) + labelForOneMinute;
	}
	if(needReverse){
		result = "-" + result;
	}
    return result;
}

/**
 * 翻译联网时长
 * 
 * @method transSecond2Time
 * @param {Number}
 *            secs 联网时间（秒）
 */
function transSecond2Time(secs) {
	secs = parseInt(secs, 10);
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
 * @param volume 容量数值，单位B
 * @param isSpeed 是计算速度
 * @returns {string}
 */
function getDisplayVolume(volume, isSpeed) {
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

    var labelForOneB = isSpeed ? 'b' : 'B';
    var labelForOneKB = isSpeed ? 'Kb' : 'KB';
    var labelForOneMB = isSpeed ? 'Mb' : 'MB';
    var labelForOneGB = isSpeed ? 'Gb' : 'GB';
    var labelForOneTB = isSpeed ? 'Tb' : 'TB';

    if (isSpeed) {
        volume = volume * 8;
    }
    var vol = volume / numberOfBytesInOneTB;
	var displayString = roundToTwoDecimalNumber(vol) + labelForOneTB;
	if (vol < 0.5) {
		vol = volume / numberOfBytesInOneGB;
		displayString = roundToTwoDecimalNumber(vol) + labelForOneGB;
	
		if (vol < 0.5) {
			vol = volume / numberOfBytesInOneMB;
			displayString = roundToTwoDecimalNumber(vol) + labelForOneMB;
	        if(isSpeed) {
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
   
    return Escape.html(html);
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

var Escape = {
    html: function (string) {
        return (string + '').replace(/[&<>"'\/`]/g, Escape._htmlReplacer);
    },
    regex: function (string) {
        return (string + '').replace(/[\-$\^*()+\[\]{}|\\,.?\s]/g, '\\$&');
    },
    _htmlReplacer: function (match) {
        return Escape.HTML_CHARS[match];
    },
    HTML_CHARS: {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
        '`': '&#x60;'
    }
};

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
function disableBtn(ele){
	ele.attr("disabled", "disabled").removeClass("focusIn").addClass("disabled");
}

/**
 * 按钮可用
 * @method enableBtn
 */
function enableBtn(ele){
	ele.removeAttr("disabled").removeClass("disabled");
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
function renderCustomElement(container){
    if(!container){
        container = $("#container");
    }
    var radios = container.find("input[type='radio']");//var radios = $(":radio", container).radio();
    var checkboxes = container.find("input[type='checkbox']");//var checkboxes = $(":checkbox", container).checkbox();
    $.each(radios, function(i,n){
        var $el = $(n),
            ch = 'checked',
            checkAction = $el.prop('checked') ? true : false;
        $el.closest('.radio')[checkAction ? 'addClass' : 'removeClass'](ch) && checkAction ? $el.attr(ch, true) : $el.removeAttr(ch);
    });
    $.each(checkboxes, function(i,n){
        var $el = $(n),
            ch = 'checked',
            checkAction = $el.prop('checked') ? true : false;
        $el.closest('.checkbox')[checkAction ? 'addClass' : 'removeClass'](ch) && checkAction ? $el.attr(ch, true) : $el.removeAttr(ch);
    });
    //$("select", container).selectpicker({style: 'btn-info'});
}

/*
	去除字符串左右两边的空格
*/
function trim(stringToTrim)
{
    return stringToTrim.replace(/^\s+|\s+$/g,"");
}
function isWifiConnected(user_ip_addr, station_list){
    return !!_.find(station_list, function(station){
        return station.ip_addr == user_ip_addr;
    });
}

var popover = {
    popoverEle: null,
    _init: function(){
        if(this.popoverEle == null){
            $("body").append('<div class="popover"></div>');
            this.popoverEle = $(".popover");
        }
    },
    open: function(opt){
        this._init();
        var offset = opt.target.offset();
        var top = offset.top + opt.target.outerHeight();
        this.popoverEle.html(opt.html)
            .css({width: opt.width, left: offset.left, top: top})
            .data({source: opt.target[0].id}).translate();
        setTimeout(function(){
            popover.popoverEle.show();
        }, 100);
        this.popoverEle.translate();
        opt.validation && opt.validation.apply();
    },
    close: function(){
        this.popoverEle && this.popoverEle.fadeOut();
    },
    show: function(){
        this.popoverEle && this.popoverEle.show();
    },
    hide: function(){
        this.popoverEle && this.popoverEle.hide();
    }
};

$(document).ready(function(){
    $("body").click(function(evt){
        var $popover = $(".popover");
        var $target = $(evt.target);
        if((evt.target.id != $popover.data('source') && $target.parents('.popover').length == 0)
            || $target.hasClass("popover-close")) {
            popover.close();
        }
    });
});

function verifyDeviceInfo(field) {
    if (field && field != "" && field != "0.0.0.0") {
        return field;
    } else {
        return "— —";
    }
}
function signalFormat(signal) {
    if (signal) {
        if (signal > 0) {
            return "-" + signal + " dBm";
        } else {
            return signal + " dBm";
        }
    } else {
        return "— —";
    }
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

//add by shenbh  20160323 左菜单点击事件
function leftMenuClick(menu){	
	var getEls = $('.' + menu + ' li ');
	$.each(getEls, function(i) {
		$(this).click(function() {
			if ($(this).hasClass('sub') && $(this).hasClass('click')) {
				$(this).removeClass('click');
			}
			else if ($(this).hasClass('nosub')) {
				return true;
			}
			else {
				$(getEls).removeClass('click');
				$(this).addClass('click');
			}
		});
		if ("menu_pb" != menu)
		{
			$(this).mouseover(function() {
				$(this).addClass('menu_hover');
			});
			$(this).mouseout(function() {
				$(this).removeClass('menu_hover');
			});
		}
	});
}