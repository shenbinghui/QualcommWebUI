/**
 * SD卡 HttpShare模块
 * @module HttpShare
 * @class HttpShare
 */
define([ 'jquery', 'underscore','lib/jquery/jQuery.fileinput', 'config/config', 'service', 'knockout' ], function($, _, fileinput, config, service, ko) {
	// var fileSet = [];
	// var fileTypes = [ 'file', 'music', 'picture', 'folder-close' ];
	/**
	 * 每页记录条数
	 * 现在9x15平台不能够设置每页数据个数，默认为10个。目前此变量不能够修改
	 * @attribute {Integer} perPage
	 */
	var perPage = 10;
	/**
	 * 当前页
	 * @attribute {Integer} activePage
	 */
	var activePage = 1;
	/**
	 * 当前目录，默认根目录""
	 * @attribute {String} currentPath
	 */
	var currentPath = "";
	/**
	 * 基目录。感觉此根目录不显示给用户会更友好
	 * @attribute {String} basePath
	 */
	var basePath = config.SD_BASE_PATH;
	/**
	 * 前置路径，发现有的设备会将sd卡数据显示在web目录
	 * @attribute {String} prePath
	 * @example
	 * prePath = "/usr/zte/zte_conf/web";
	 */
	var prePath = "";// "/usr/zte/zte_conf/web";
	/**
	 * 是否隐藏重命名按钮
	 * @attribute {Boolean} readwrite
	 */
	var readwrite = true;
	/**
	 * 文件列表模板
	 * @attribute {Object} sdFileItemTmpl
	 */
	var sdFileItemTmpl = null,
	/**
	 * 分页模板
	 * @attribute {Object} pagerTmpl
	 */
		pagerTmpl = null,
    /**
     * 配置信息原始状态
     * @attribute {Object} originalStatus
     */
        originalStatus = null;

    var zoneOffsetSeconds = new Date().getTimezoneOffset() * 60;

    var shareFilePath = '';

	/**
	 * 生成分页数据数组
	 * @method generatePager
	 * @param {Integer} totalSize 总记录数
	 * @param {Integer} perPageNum 每页记录条数
	 * @param {Integer} currentPage 当前页
	 * @return {Array} 分页数据数组
	 */
	function generatePager(totalSize, perPageNum, currentPage) {
        if (totalSize == 0) {
            return [];
        }
        var pagersArr = [];
        var totalPages = getTotalPages(totalSize, perPageNum);
        pagersArr.push({
            pageNum: currentPage - 1,
            isActive: false,
            isPrev: true,
            isNext: false,
            isDot: false
        });
        if (currentPage == 6) {
            pagersArr.push({
                pageNum: 1,
                isActive: false,
                isPrev: false,
                isNext: false,
                isDot: false
            });
        } else if (currentPage > 5) {
            pagersArr.push({
                pageNum: 1,
                isActive: false,
                isPrev: false,
                isNext: false,
                isDot: false
            });
            pagersArr.push({
                pageNum: 0,
                isPrev: false,
                isNext: false,
                isActive: false,
                isDot: true
            });
        }
        var i;
        var startPage = currentPage - 4 > 0 ? currentPage - 4 : 1;
        var endPage = currentPage + 4;
        for (i = startPage; i <= endPage && i <= totalPages; i++) {
            pagersArr.push({
                pageNum: i,
                isActive: i == currentPage,
                isPrev: false,
                isNext: false,
                isDot: false
            });
        }
        if (currentPage + 5 == totalPages) {
            pagersArr.push({
                pageNum: totalPages,
                isPrev: false,
                isNext: false,
                isActive: false,
                isDot: false
            });
        } else if (currentPage + 3 <= totalPages && i - 1 != totalPages) {
            pagersArr.push({
                pageNum: 0,
                isPrev: false,
                isNext: false,
                isActive: false,
                isDot: true
            });
            pagersArr.push({
                pageNum: totalPages,
                isPrev: false,
                isNext: false,
                isActive: false,
                isDot: false
            });
        }
        pagersArr.push({
            pageNum: parseInt(currentPage, 10) + 1,
            isPrev: false,
            isNext: true,
            isActive: false,
            isDot: false
        });
        return pagersArr;
	}

	function getTotalPages(total, perPage){
		var totalPages = Math.floor(total / perPage);
		if (total % perPage != 0) {
			totalPages++;
		}
		return totalPages;
	}

	/**
	 * 整理文件列表数据，并用模板显示
	 * @method showFileSet
	 * @param {Array} files 列表数据
	 */
	function showFileSet(files) {
		var i = 0;
		var shownFiles = $.map(files, function(n) {
			var obj = {
				fileName : n.fileName,
				fileType : n.attribute == 'document' ? 'folder' : getFileType(n.fileName),
				fileSize : getDisplayVolume(n.size, false),
				filePath : basePath + getCurrentPath() + "/" + n.fileName,
                lastUpdateTime : transUnixTime((parseInt(n.lastUpdateTime, 10) + zoneOffsetSeconds) * 1000),
				trClass : i % 2 == 0 ? "even" : "",
				readwrite : readwrite
			};
			i++;
			return obj;
		});

		if(sdFileItemTmpl == null){
			sdFileItemTmpl = $.template("sdFileItemTmpl", $("#sdFileItemTmpl"));
		}
		$("#fileList_container").html($.tmpl("sdFileItemTmpl", {data: shownFiles}));
	}

	/**
	 * HttpShareViewModel
	 * 
	 * @class HttpShareViewModel
	 */
	function HttpShareViewModel() {
		var isGuest = false;
		var selff = this;
		var data = service.getSDConfiguration();
        selff.selectedMode = ko.observable(data.sd_mode);
		selff.orignalMode = ko.observable(data.sd_mode);
		selff.sdStatus = ko.observable(data.sd_status);
		selff.selectedShareEnable = ko.observable(data.share_status);
		selff.selectedFileToShare = ko.observable(data.file_to_share);
		selff.selectedAccessType = ko.observable(data.share_auth);
		var path = data.share_file.substring(basePath.length);
		selff.pathToShare = ko.observable(path);
		selff.isInvalidPath = ko.observable(false);
		selff.sdStatusInfo = ko.observable($.i18n.prop("sd_card_status_info_" + data.sd_status));
		selff.checkEnable = ko.observable(true);
		if(window.location.hash == "#httpshare_guest"){
			isGuest = true;
		}

		selff.disableApplyBtn = ko.computed(function(){
            return selff.selectedMode() == selff.orignalMode() && selff.selectedMode() == '1';
        });
        
		readwrite = true;
		activePage = 1;
        setCurrentPath('');
		basePath = config.SD_BASE_PATH;
		showLoading('waiting');
		service.getSDConfiguration({}, function(data){
            originalStatus = data;
            shareFilePath = data.share_file;
            if(shareFilePath.charAt(shareFilePath.length - 1) == '/'){//如果路径中有/，则去掉
            	shareFilePath = shareFilePath.substring(0, shareFilePath.length - 1);
            }
			//alert(data.sd_mode);//xsk
			if(data.sd_status == '1' && data.sd_mode == '0'){ //共享
				if(isGuest && data.share_status == '1'){// guest and share
					basePath = shareFilePath;
					if(data.share_auth == '0'){ // readonly
						readwrite = false;
						$("#uploadSection, #delete_file_button, .sd_guest_hide_th", "#httpshare_form").hide();
					}else{
                        $("#uploadSection, #delete_file_button, .sd_guest_hide_th", "#httpshare_form").show();
                    }
					$("#go_to_login_button").removeClass("hide");
					$('#sd_menu').hide();
					$('.form-note').hide();
					if ($(".customfile").length == 0) {
						$("#fileField").customFileInput();
					}
					pagerItemClickHandler(1);
				} else if(isGuest && data.share_status == '0'){ // guest not share
					$(".form-body .content", "#httpshare_form").hide().remove();
					$(".form-title", "#httpshare_form").attr("data-trans", "httpshare").html($.i18n.prop("httpshare"));
					$(".form-note", "#httpshare_form").attr("data-trans", "note_http_share_cannot_access").html($.i18n.prop("note_http_share_cannot_access"));
                    hideLoading();
				} else {
					if ($(".customfile").length == 0) {
						$("#fileField").customFileInput();
					}
					pagerItemClickHandler(1);
				}
			} else { // usb
				$(".form-body .content", "#httpshare_form").hide().remove();
				$(".form-title", "#httpshare_form").attr("data-trans", "httpshare").html($.i18n.prop("httpshare"));
				$(".form-note", "#httpshare_form").attr("data-trans", "note_http_share_usb_access").html($.i18n.prop("note_http_share_usb_access"));
                $(".form-note", "#httpshare_form").addClass("margintop10");
				hideLoading();
			}
		}, function(){
            errorOverlay();
            $(".form-body .content", "#httpshare_form").hide().remove();
            $(".form-title", "#httpshare_form").attr("data-trans", "httpshare").html($.i18n.prop("httpshare"));
            $(".form-note", "#httpshare_form").attr("data-trans", "note_http_share_cannot_access").html($.i18n.prop("note_http_share_cannot_access"));
        });

       //add by shenbh 20160418
       //add upload dialog
       selff.upload_dialog_cancel = function(){
           $("#upload_dialog").css('display','none');
       };

		/**
		 * 文件共享方式radio点击事件
		 * @event modeChangeHandler
		 */
		selff.fileToShareClickHandle = function(){
			if(selff.selectedFileToShare() == "1"){
				selff.pathToShare("/");
			}
			return true;
		};
		
	     /**
         * 检查共享路径是否有效
         * @method checkPathIsValid
         */
        selff.checkPathIsValid = ko.computed(function () {
            if (selff.orignalMode() == 0 && selff.selectedShareEnable() == '1' && selff.selectedFileToShare() == '0'
                && selff.pathToShare() != '' && selff.pathToShare() != '/') {
                service.checkFileExists({
                    "path": basePath + selff.pathToShare()
                }, function (data) {
                    if (data.status != "exist") {
                        selff.isInvalidPath(true);
                    } else {
                        selff.isInvalidPath(false);
                    }
                });
            } else {
                selff.isInvalidPath(false);
            }
        });
		
	
	
	/**
		 * 保存详细配置信息
		 * @method saveShareDetailConfig
		 */
        function saveShareDetailConfig() {
			var param = {
				share_status : selff.selectedShareEnable(),
				share_auth : selff.selectedAccessType(),
				share_file : basePath + selff.pathToShare()
			};
			if (selff.selectedShareEnable() == "0") {
				setSdCardSharing(param);
			} else {
				service.checkFileExists({
					"path" : param.share_file
				}, function(data) {
					if (data.status != "exist" && data.status != "processing") {
						errorOverlay("sd_card_share_setting_" + data.status);
					} else {
                        setSdCardSharing(param);
                    }
				}, function(){
                    errorOverlay();
                });
			}
		}

		/**
		 * 设置SD卡共享信息
		 * @method setSdCardSharing
		 */
        function setSdCardSharing(param){
			service.setSdCardSharing(param, function(result) {
				if (isErrorObject(result)) {
					if (result.errorType == "no_sdcard") {
						errorOverlay("sd_card_share_setting_no_sdcard");
					} else {
						errorOverlay();
					}
				} else {
					successOverlay();
				}
			});
		}

    		/**
		 * 表单submit事件处理
		 * @event save
		 */
		selff.save = function(){
			//alert(111);
			showLoading('waiting');
			//alert(2222);
			selff.checkEnable(false);
			//alert(3333);
			if(selff.orignalMode() == selff.selectedMode() && selff.selectedMode() == '0'){
				saveShareDetailConfig();
			} else {
				service.setSdCardMode({
					mode : selff.selectedMode()
				}, function(data) {
					if(data.result){
                        selff.orignalMode(selff.selectedMode());
						if (selff.selectedMode() == "0") {
							saveShareDetailConfig();
						} else {
							if(data.result == "processing"){
								errorOverlay("sd_usb_forbidden");
							}else{								
							    successOverlay();
							}
						}
					} else {
						if (selff.selectedMode() == "0") {
							errorOverlay("sd_not_support");
						} else {
						    errorOverlay();
						}
					}
				}, function(error) {
					if (selff.selectedMode() == "0") {
						errorOverlay("sd_not_support");
					} else {
					    errorOverlay();
					}
				});
			}
			selff.checkEnable(true);
			var data = service.getSDConfiguration();
			if(data.sd_mode == '1')
			{
				init();
			}
			return true;
		};
		

		
		/**
		 * T卡热插拔时状态监控，拔插卡重刷界面
		 * @event checkSimStatus
		 */
		selff.checkSimStatus = function(){
			if(selff.checkEnable()){
				var data = service.getSDConfiguration();
			    if(data.sd_status && (data.sd_status != selff.orignalSdStatus())){
				    if(data.sd_status != '1'){
						selff.sdStatusInfo($.i18n.prop("sd_card_status_info_" + data.sd_status));
						selff.sdStatus(data.sd_status);
		                selff.orignalSdStatus(data.sd_status);
					}else{
						clearTimer();
					    clearValidateMsg();
					    init();
					}
			    }
			}			
		}

	}


    //add by shenbh 20160418
    //从本地上传文件到sd卡
    upLoad2SdCardBtn = function(){
        $("#upload_dialog").css("display","block");
    };


    function button_enable(button_id, enable) {
        var parent = $('#' + button_id);

        if (enable == '1') {
            parent.removeClass('disable_btn');

        }
        else if (enable == '0') {
            parent.removeClass('disable_btn');
            parent.addClass('disable_btn');

        }
    }

     fileFieldChanged = function() {
        if ($('#fileField2').val().length > 0)
        {
            button_enable('pop_Upload', 1);
        }
        else
        {
            button_enable('pop_Upload', 0);
        }
    };



	/**
	 * 页码点击事件处理
	 * @event pagerItemClickHandler
	 * @param {Integer} num 页码
	 */
	pagerItemClickHandler = function(num) {
		activePage = num;
		refreshFileList(getCurrentPath(), activePage);
	};

    function checkConfiguration(){
        var data = service.getSDConfiguration();
        if(!_.isEqual(originalStatus, data)){
            showAlert('sd_config_changed_reload', function(){
                init();
            });
            return false;
        }
        return true;
    }

    /**
     * 检查操作路径是否为共享路径，如果是共享路径，给用户提示
     * @param path
     * @param wording
     * @returns {boolean}
     */
    function inSharePath(path, wording) {
        var tmpShareFilePath = shareFilePath + '/';
        var tmpPath = path + '/';
        if (originalStatus.share_status == '1' && shareFilePath != '' && shareFilePath != '/' && tmpShareFilePath.indexOf(tmpPath) != -1) {
            showAlert(wording);
            return true;
        }
        return false;
    }

	/**
	 * 进入文件夹
	 * @method enterFolder
	 * @param {String} name 文件夹名
	 */
	enterFolder = function(name) {
        if(!checkConfiguration()){
            return false;
        }
		var path;
		if (name == "") {
			path = "";
		} else {
			path = getCurrentPath() + '/' + name;
		}
		refreshFileList(path, 1);
        return true;
	};

	/**
	 * 回到上一级目录
	 * @method backFolder
	 */
	backFolder = function() {
        if(!checkConfiguration()){
            return false;
        }
        if(document.getElementById("backBtnLi").disabled == true){
        	return;
        }
        
		var path = getCurrentPath().substring(0, getCurrentPath().lastIndexOf("/"));
		refreshFileList(path, 1);
        return true;
	};

	/**
	 * 刷新文件列表
	 * @method refreshFileList
	 * @param {String} path 文件夹名,"/"开头
     * @param {Integer} index 页码
     * @param {Boolean} alertShown alert是否已经显示
	 */
	refreshFileList = function(path, index, alertShown) {
		if(!alertShown){
            showLoading('waiting');
        }
		service.getFileList({
			path : prePath + basePath + path,
			index : index
		}, function(data) {
			if (isErrorObject(data)) {
				showAlert(data.errorType);
				return;
            }
            setCurrentPath(path);
			$("#sd_path").val(path);
			activePage = index;
			totalSize = data.totalRecord;
			showFileSet(data.details);
			pagination(totalSize); //测试分页时可以将此处totalSize调大
			refreshBtnsStatus();
			updateSdMemorySizes();
            if(!alertShown){
			    hideLoading();
            }
		});
	};

	/**
	 * 更新按钮状态
	 * @method refreshBtnsStatus
	 */
	refreshBtnsStatus = function() {
		if (getCurrentPath() == "") {
			//$("#rootBtnLi, #backBtnLi").hide();
			$("#backBtnLi").addClass('disable_btn');
			document.getElementById("backBtnLi").disabled=true;
		} else {
			$("#backBtnLi").removeClass('disable_btn');
			$("#rootBtnLi, #backBtnLi").show();
			document.getElementById("backBtnLi").disabled=false;
		}
		if (readwrite) {
			$("#createNewFolderLi").hide();
			$("#newFolderBtnLi").show();
			$("#newFolderName").val('');
			$("#createNewFolderErrorLabel").removeAttr('data-trans').text('');
		} else {
			$("#newFolderBtnLi, #createNewFolderLi").hide().remove();
		}
        checkDeleteBtnStatus();
	};

	/**
	 * 显示新建文件夹按钮点击事件
	 * @event openCreateNewFolderClickHandler
	 */
	openCreateNewFolderClickHandler = function() {
		//$("#newFolderBtnLi").hide();
		$("#createNewFolderLi").show();
	};


	/**
	 * 取消显示新建文件夹按钮点击事件
	 * @event cancelCreateNewFolderClickHandler
	 */
	cancelCreateNewFolderClickHandler = function() {
		$("#createNewFolderLi").hide();
        $("#newFolderName").val('');
		$("#newFolderBtnLi").show();
	};

	/**
	 * 新建文件夹按钮点击事件
	 * @event createNewFolderClickHandler
	 */
	createNewFolderClickHandler = function() {
        if(!checkConfiguration()){
            return false;
        }
		var newFolderName = $.trim($("#newFolderName").val());
		if (newFolderName == "") {
			$("#createNewFolderErrorLabel").attr('data-trans', 'sd_card_folder_name_is_null').text($.i18n.prop("sd_card_folder_name_is_null"));
			$("#newFolderName").focus();
			return false;
		}
		var newPath = prePath + basePath + getCurrentPath() + "/" + newFolderName;

		if (newPath.length >= 200) {
			$("#createNewFolderErrorLabel").attr('data-trans', 'sd_card_path_too_long').text($.i18n.prop("sd_card_path_too_long"));
			$("#newFolderName").focus();
			return false;
		}
		if (!checkFileNameChars(newFolderName, false)) {
			$("#createNewFolderErrorLabel").attr('data-trans', 'check_file_path').text($.i18n.prop("check_file_path"));
			$("#newFolderName").focus();
			return false;
		}
        showLoading('creating');
		service.checkFileExists({
			path : newPath
		}, function(data1) {
			if (data1.status == "noexist" || data1.status == "processing") {
				service.createFolder({
					path : newPath
				}, function(data) {
					if (isErrorObject(data)) {
						showAlert(data.errorType);
						return false;
					} else {
                        successOverlay();
                        refreshFileList(getCurrentPath(), 1);
                    }
				});
			} else if (data1.status == "no_sdcard") {
                showAlert("no_sdcard", function(){
                    window.location.reload();
                });
			} else if (data1.status == "exist") {
				$("#createNewFolderErrorLabel").attr('data-trans', 'sd_card_share_setting_exist').text($.i18n.prop("sd_card_share_setting_exist"));
				hideLoading();
			}
		}, function(){
            errorOverlay();
        });
        return true;
	};

	/**
	 * 重命名按钮点击事件
	 * @event renameBtnClickHandler
	 * @param {String} oldName 原文件名
	 */
	renameBtnClickHandler = function(oldName) {
        var oldPath = prePath + basePath + getCurrentPath() + "/" + oldName;
        if(inSharePath(oldPath, 'sd_share_path_cant_rename')){
            return false;
        }
		showPrompt("sd_card_folder_name_is_null", function() {
            if(!checkConfiguration()){
                return false;
            }
            var promptInput = $("div#confirm div.promptDiv input#promptInput");
            var newFolderName = $.trim(promptInput.val());
            var newPath = prePath + basePath + getCurrentPath() + "/" + newFolderName;
			if (newFolderName == "") {
				$(".promptErrorLabel").text($.i18n.prop("sd_card_folder_name_is_null"));
				promptInput.focus();
				return false;
			}

			if (newPath.length >= 200) {
				$(".promptErrorLabel").text($.i18n.prop("sd_card_path_too_long"));
				promptInput.focus();
				return false;
			}
			if (!checkFileNameChars(newFolderName, false)) {
				$(".promptErrorLabel").text($.i18n.prop("check_file_path"));
				promptInput.focus();
				return false;
			}
			service.checkFileExists({
				path : newPath
			}, function(data1) {
				if (data1.status == "noexist" || data1.status == "processing") {
					hideLoadingButtons();
					var oldPath = prePath + basePath + getCurrentPath() + "/" + oldName;
					service.fileRename({
						oldPath : oldPath,
						newPath : newPath,
						path : prePath + basePath + getCurrentPath()
					}, function(data) {
						if (isErrorObject(data)) {							
							showAlert($.i18n.prop(data.errorType));
							if(data.errorType == "no_exist"){
								var alertShown = true;
								refreshFileList(getCurrentPath(), 1, alertShown);
							} else if(data.errorType == "processing"){
								//var alertShown = true;
								//refreshFileList(getCurrentPath(), 1, alertShown);
							}							
						} else {
                            refreshFileList(getCurrentPath(), 1);
                            successOverlay();
                        }
                        showLoadingButtons();
						return true;
					});
				} else if (data1.status == "no_sdcard") {
					showAlert("no_sdcard", function(){
                        window.location.reload();
                    });
					return false;
				} else if (data1.status == "exist") {
					$(".promptErrorLabel").text($.i18n.prop("sd_card_share_setting_exist"));
					return false;
				}
                return true;
			}, function(){
                errorOverlay();
            });
            return false;
		}, 160, oldName);
	};

    hideLoadingButtons = function () {
        $(".buttons", "#confirm").hide();
    };

    showLoadingButtons = function () {
        $(".buttons", "#confirm").show();
    };

	/**
	 * 删除按钮点击事件
	 * @event deleteBtnClickHandler
	 */
	deleteBtnClickHandler = function() {
        if(!checkConfiguration()){
            return false;
        }
		var files = $("input:checkbox:checked", "#fileList_container");
		var fileNames = "";
		if (!files || files.length == 0) {
			return false;
		}
        var hasSharePath = false;
        $.each(files, function (i, n) {
            var theFile = $(n).val();
            if (inSharePath(prePath + basePath + getCurrentPath() + "/" + theFile, {msg: 'sd_share_path_cant_delete', params: [theFile]})) {
                hasSharePath = true;
                return false;
            }
            return true;
        });
        if (hasSharePath) {
            return false;
        }
		showConfirm("confirm_data_delete", function(){
			$.each(files, function(i, n) {
				fileNames += $(n).val() + "*";
			});
			var thePath = prePath + basePath + getCurrentPath();
			service.deleteFilesAndFolders({
				path : thePath,
				names : fileNames
			}, function(data) {
				if (data.status == "failure") {
					showAlert("delete_folder_failure");
				}
				else if(data.status == "no_sdcard"){
					showAlert("no_sdcard");
				}
				else if(data.status == "processing"){
					showAlert("sd_file_processing_cant_delete");
				}
				else if(data.status == "success"){
					successOverlay();
				}
				refreshFileList(getCurrentPath(), 1);
			}, function(){
                errorOverlay();
            });
		});
        return true;
	};

	
	function getFileSize(obj){
		var isIE = /msie/i.test(navigator.userAgent) && !window.opera; 
		if (isIE) {  //如果是ie
			var objValue = obj.value;
			try {  
				var fso = new ActiveXObject("Scripting.FileSystemObject");  
				fileLenth = parseInt(fso.GetFile(objValue).size);
				//alert("ie len="+fileLenth);
				} catch (e) {  
				//alert('IE内核取不到长度,升级即将继续，下次升级前请尝试将安全级别调低'); 
				fileLenth	= 1;					
			} 
		}else{  //其他
			try{
				//对于非IE获得要上传文件的大小
				fileLenth = parseInt(obj.files[0].size);
				}catch (e) {
				fileLenth=1;  //获取不到取-1
			}
		}
		return fileLenth;
	} 
	
	/**
	 * 文件上传按钮点击事件
	 * @event deleteBtnClickHandler
	 */
	fileUploadSubmitClickHandler = function() {

        if($("#pop_Upload").hasClass("disable_btn")){
            return;
        }

        if(!checkConfiguration()){
            return false;
        }

        //changed by shenbh 20160418
		//var fileName = $(".customfile").attr('title');
        var path =  $('#fileField2').val();
        var names = path.split('\\');
        var fileName = names[names.length-1];

		if (typeof fileName == "undefined" || fileName == '' || fileName == $.i18n.prop("no_file_selected")) {
            showAlert("sd_no_file_selected");
			return false;
		}
		var newPath = (basePath + getCurrentPath() + "/" + fileName).replace("//", "/");
		if (newPath.length >= 200) {
			showAlert("sd_card_path_too_long");
			return false;
		}
		
		var fileSize = getFileSize($("#fileField")[0]);
		if (fileSize/1024/1024/1024 > 2){  //no more than 2G
			showAlert("sd_file_size_too_big");
			return false;
		}		
		
		service.getSdMemorySizes({}, function(data) {
			if (isErrorObject(data)) {
				showAlert(data.errorType);
				return false;
			}
			if (data.availableMemorySize < fileSize) {
				showAlert("sd_upload_space_not_enough");
				return false;
			}
			showLoading('uploading', '<span data-trans="note_uploading_not_refresh">' + $.i18n.prop('note_uploading_not_refresh') + '</span>');
			service.checkFileExists({
				path : newPath
			}, function(data1) {
				if (data1.status == "noexist") {
					$("#fileUploadForm").attr("action", "/cgi-bin/" + fileName);
					var currentTime = new Date().getTime();
					$("#path_SD_CARD_time").val(transUnixTime(currentTime));
					$("#path_SD_CARD_time_unix").val(Math.round((currentTime - zoneOffsetSeconds * 1000) / 1e3));
					if(!iframeLoadBinded){
						bindIframeLoad();
					}
					$("#fileUploadForm").submit();
				} else if (data1.status == "no_sdcard") {
					showAlert("no_sdcard", function(){
						window.location.reload();
					});
				} else if (data1.status == "processing") {
					showAlert("sd_upload_file_is_downloading");//("system is downloading,try later!");
				}else if (data1.status == "exist") {
					showAlert("sd_card_share_setting_exist");
				}
			}, function(){
				errorOverlay();
			});
        		return true;
		});
	};
	
    var iframeLoadBinded = false;
    function bindIframeLoad(){
        iframeLoadBinded = true;
        $('#fileUploadIframe').load(function() {
            var txt = $('#fileUploadIframe').contents().find("body").html().toLowerCase();
            $("#fileField").closest('.customfile').before('<input id="fileField" name="filename" maxlength="200" type="file" dir="ltr"/>').remove();
            addTimeout(function(){
                $("#fileField").customFileInput();
            }, 0);
            var alertShown = false;
            if (txt.indexOf('success') != -1) {
                successOverlay();
            } else if (txt.indexOf('space_not_enough') != -1) {
                alertShown = true;
                showAlert('sd_upload_space_not_enough');
            } else if (txt.indexOf('data_lost') != -1) {
                alertShown = true;
                showAlert('sd_upload_data_lost');
            } else {
                errorOverlay();
            }

            $("#uploadBtn", "#uploadSection").attr("data-trans", "browse_btn").html($.i18n.prop('browse_btn'));
            $(".customfile", "#uploadSection").removeAttr("title");
            $(".customfile span.customfile-feedback", "#uploadSection")
                .html('<span data-trans="no_file_selected">'+$.i18n.prop('no_file_selected')+'</span>')
                .attr('class', 'customfile-feedback');
            refreshFileList(getCurrentPath(), 1, alertShown);
        });
    }
	
	/**
	 * 更新SD卡容量显示数据
	 * @method updateSdMemorySizes
	 */
	updateSdMemorySizes = function() {
		service.getSdMemorySizes({}, function(data) {
			if (isErrorObject(data)) {
				showAlert(data.errorType);
				return false;
			}
			var total = getDisplayVolume(data.totalMemorySize, false);
			var used = getDisplayVolume(data.totalMemorySize - data.availableMemorySize, false);
			$("#sd_volumn_used").text(used);
			$("#sd_volumn_total").text(total);

            //add by shenbh 进度条容量显示
            var per_width=parseInt($(".agile_progress_bar").width(),10);
            var total_size = data.totalMemorySize;
            var available_size = data.availableMemorySize;
            var used_size = total_size - available_size;

            if(used_size > 0){
                if(used_size <= total_size){
                    var persent = used_size / total_size;
                    var img_persent = per_width * persent;
                    $("#agile_used_volume").css({"width":img_persent});
                }else{
                    //流量已经超过了设定值
                    $("#agile_used_volume").css({"width":per_width});
                }
            }
            
            return true;
		});
	};

	/**
	 * 翻页
	 * @method pagination
	 */
	pagination = function(fileTotalSize) {
		var pagers = generatePager(fileTotalSize, perPage, parseInt(activePage, 10));
		if(pagerTmpl == null){
			pagerTmpl = $.template("pagerTmpl", $("#pagerTmpl"));
		}
		$(".pager", "#fileListButtonSection").html($.tmpl("pagerTmpl", {data: {pagers : pagers, total : getTotalPages(fileTotalSize, perPage)}}));
		renderCheckbox();
		$(".content", "#httpshare_form").translate();
	};

	/**
	 * 文件名特殊字符检查
	 * @method checkFileNameChars
	 * @param {String} filename 文件名
	 * @param {Boolean} isIncludePath 是否包含路径
	 */
	function checkFileNameChars(filename, isIncludePath) {
		var invalidASCStr = '+/:*?<>\"\'\\|#&`~';
		if(isIncludePath){
			invalidASCStr = '+:*?<>\"\'\\|#&`~';
		}
		var flag = false;
		var dotFlag = false;
		var reg = /^\.+$/;
		for ( var k = 0; k < filename.length; k++) {
			for ( var j = 0; j < invalidASCStr.length; j++) {
				if (filename.charAt(k) == invalidASCStr.charAt(j)) {
					flag = true;
					break;
				}
			}
			if (reg.test(filename)) {
				dotFlag = true;
			}
			if (flag || dotFlag) {
				return false;
			}
		}
		return true;
	}
	
	/**
	 * 下载文件是检查文件路径是否包含特殊字符
	 * @method checkFilePathForDownload
	 * @param {String} path 文件路径
	 */
	checkFilePathForDownload = function(path){
        if(!checkConfiguration()){
            return false;
        }
		var idx = path.lastIndexOf('/');
		var prePath = path.substring(0, idx+1);
		var name = path.substring(idx+1, path.length);
		if(checkFileNameChars(prePath, true) && checkFileNameChars(name, false)){
			return true;
		}
		showAlert('sd_card_invalid_chars_cant_download');
		return false;
	};
	
	gotoLogin = function(){
		window.location.href="#login";
	};

    function bindEvent(){
        $("p.checkbox", "#httpshare_form").die().live('click', function () {
            addTimeout(function () {
                checkDeleteBtnStatus();
            }, 100);
        });
        $(".icon-download", "#httpshare_form").die().live("click", function () {
            return checkFilePathForDownload($(this).attr("filelocal"));
        });
        $(".folderTd", "#httpshare_form").die().live("click", function () {
            return enterFolder($(this).attr("filename"));
        });
        $(".fileRename", "#httpshare_form").die().live("click", function () {
            return renameBtnClickHandler($(this).attr("filename"));
        });
        iframeLoadBinded = false;
    }

    function checkDeleteBtnStatus(){
        var checkedItem = $("p.checkbox.checkbox_selected", '#fileListSection');
        if(checkedItem.length > 0){
        	$("#delete_file_button").removeClass('disable_btn');
            enableBtn($('#delete_file_button'));
        } else {
        	$("#delete_file_button").addClass('disable_btn');
            disableBtn($('#delete_file_button'));
        }
    }

    function getCurrentPath(){
        return currentPath;
    }

    function setCurrentPath(path){
        if(path.lastIndexOf("/") == path.length - 1){
            currentPath = path.substring(0, path.length - 1);
        } else {
            currentPath = path;
        }
    }

	function init() {
		var container = $('#container')[0];
		ko.cleanNode(container);
		var vm = new HttpShareViewModel();
		ko.applyBindings(vm, container);
		$('#sd_form').validate({
			submitHandler : function() {
				vm.save();
			},
			rules : {
				path_to_share : "check_file_path"
			}
		});
        bindEvent();
	}

	return {
		init : init
	};
});