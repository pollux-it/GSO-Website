jQuery.validator.prototype.checkForm = function () {
	this.prepareForm();
	
	for (var i = 0, elements = (this.currentElements = this.elements()); elements[i]; i++) {
		
		if (this.findByName(elements[i].name).length != undefined && this.findByName(elements[i].name).length > 1) {
			
			for (var cnt = 0; cnt < this.findByName(elements[i].name).length; cnt++) {
				this.check(this.findByName(elements[i].name)[cnt]);
			}
		} else {
			this.check(elements[i]);
		}
	}
	return this.valid();
}

$(function(){

		/** To Support message format like 'Registration {0}' */
		String.prototype.format = function() {
			var args = arguments[0];
			var argsLength = Array.isArray(args) ? args.length : 0;
			if ( args == '' || argsLength == 0 ) {
				return this;
			}
			return this.replace(/\{(\d+)\}/g, function(match, position, offset, string) {
				if ( argsLength > position ){
					return args[position];
				}else {
					return '';
				}
			});
		};
	
	$(".page-content").on('click', 'a.check-link', function(event){
		var returnVal = false;
		var ajaxCallCompleted = false;
		$.ajax({
			method: 'GET',
			url: event.target.href,
			success: function(data){
				returnVal = true;
				ajaxCallCompleted = true;
			},
			error: function(data){
				ajaxCallCompleted = true;
				showMessageFromApi(data);
				//show_error('Error!', data.responseText);
			},
			async: false
		});

		return returnVal;
	});
})
var queryString = (function(a) {
    if (a == "") return {};
    var b = {};
    for (var i = 0; i < a.length; ++i)
    {
        var p=a[i].split('=');
        if (p.length != 2) continue;
        b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
    }
    return b;
})(window.location.search.substr(1).split('&'));

function show_notification(note, message, type){
	$.gritter.add({
		title: note,
		// (string | mandatory) the text inside the notification
		text: message,
		sticky: false,
		time: '2000',
		class_name: 'gritter-'+type
	});

}

function show_success(note, message){
	show_notification(note, message, "success");
}

function show_error(note, message){
	show_notification(note, message, "error");
}

function show_warning(note, message){
	show_notification(note, message, "warning");
}

function getShortCertificateCategory(category){
	if(!category){
		return '';
	}
	if ( category == 'temporary-use-spare-tyre') {
		return 'S';
	}else{ 
		return category.substr(0,1).toUpperCase(); 
	}
}

function handleEmptyData(page, data, colspan,element_id){
	//console.log("empty");
	if ( page == 1 && data.length == 0){
		$("#" + element_id).html(no_data_message_func(colspan));
		return;
	}else if (data.length == 0){
		$("#" + element_id + "-" + page).html(no_data_message_func());
	}else if ( page > 1 ){
		$("#" + element_id + "-" + page).html('<center style="color:#ccc;font-weight:bold;">PAGE ' + page + '</center>' );
	}
}

function pushToHistory(data, on_load){
	if (history.pushState && on_load != true){
		history.pushState('ID-01', 'NO-TITLE', '?' + decodeURIComponent( $.param( data ) ) );
	}
}

function populateSelectedFilterValues(filters){
	$.each(filters, function(index, filter){
		var filterId = filter+"_filter";
		var clearId = filterId+"_clear";
		if ($('#'+filterId).val()){
			selectedFilters[filter] = $('#'+filterId).val();
			$(clearId).show();
		}else{
			delete selectedFilters[filter];
			$(clearId).hide();
		}
	});
}

function applySelectedFilterCss(filters){
	$.each(filters, function(idx, value){
		var filterId = '#'+value+'_filter';
		if($(filterId).val()){
			$(filterId).addClass('selected-filter');
		}else{
			$(filterId).removeClass('selected-filter');
		}
	});
}

function set_filters_from_query_string (filters) {
	$.each(filters, function(idx, value){
		if (queryString[value]){
			var filterId = '#' + value + "_filter";
			var clearId = filterId+"_clear";
			selectedFilters[value] = queryString[value];
			$(filterId).val(queryString[value]);
			$(clearId).show();
		}			
	});
}

function no_data_message_func(colspan, customMessage){
	if (!customMessage){
		customMessage = 'No data found';
	}
	if (undefined === colspan)
		return '<div style="text-align:center" class="alert alert-warning"> <i class="fa fa-exclamation-triangle"></i>' + customMessage + '</div>';
	return '<tr><td colspan='+colspan+'><div style="text-align:center" class="alert alert-warning"> <i class="fa fa-exclamation-triangle"></i> '+customMessage+'</div></td></tr>';
}

var no_data_message = function(colspan, customMessage){
	if (!customMessage){
		customMessage = 'No data found';
	}
	if (undefined === colspan)
		return '<div style="text-align:center" class="alert alert-warning"> <i class="fa fa-exclamation-triangle"></i>' + customMessage + '</div>';
	return '<tr><td colspan='+colspan+'><div style="text-align:center" class="alert alert-warning"> <i class="fa fa-exclamation-triangle"></i> '+customMessage+'</div></td></tr>';
}

function loadingComp(component, classToManage, doneLoading){
	if ( doneLoading ){
		$(component).removeClass("fa-spinner fa-spin").addClass(classToManage);
	}else{
		$(component).addClass("fa-spinner fa-spin").removeClass(classToManage);
	}
}

function showMessageFromApi(response){
	var responseObj = {};
	if ( response.responseJSON ){
		responseObj = response.responseJSON;
	}else if (response.responseText){
		if ( response.responseText.indexOf("\"message\"") > -1){
			responseObj = $.parseJSON(response.responseText);
		}else{
			responseObj = {'message': response.responseText};
		}
	}

	if ( 'message' in responseObj){
		if(responseObj["message"].constructor === Array){
			show_error("Error", responseObj["message"].join());
		}else{
			show_error("Error", responseObj["message"]);
		}
	}else{
		if ( response.status == 403){
			show_warning("Warning", "You are not authorized to perform this operation");
		}else{
			show_error("Error", "Error occurred while performing the operation");
		}
	}

}

function range(start, edge, step) {
	  // If only 1 number passed make it the edge and 0 the start
	  if (arguments.length === 1) {
	    edge = start;
	    start = 0;
	  }

	  // Validate edge/start
	  edge = edge || 0;
	  step = step || 1;

	  // Create array of numbers, stopping before the edge
	  let arr = [];
	  for (arr; (edge - start) * step > 0; start += step) {
	    arr.push(start);
	  }
	  return arr;
	}


function confirm_action(options){
	
	var btnCancel = {
		text: options.cancelLabel,
		value: null,
		visible: true,
		closeModal: true,
	};
	
	var btnOk = {
		text: options.okLabel,
		value: true,
		visible: true,
		closeModal: true
	};

	if(options.okClassName){
		btnOk['className'] = options.okClassName;
	}

	sweetAlert({
	    title: options.title,
		text: options.text,
		icon: options.icon ? options.icon : "warning",
		dangerMode: true,
		buttons: {
			cancel: btnCancel,
			confirm: btnOk
		}
	}).then(function(isConfirm){
		 if (isConfirm && typeof(options.ok) != "undefined") {
			  options.ok.call();
		  }
		 if(!isConfirm && typeof(options.cancel) != "undefined"){
			options.cancel.call();
		  }
	});
}
function formatDate(date, fmt){
	return !date ? '' : moment(date).format(!fmt ? appDateFormat : fmt);
}

function formatDateTime(date){
	return !date ? '' : moment(date).format(appDateFormat ? (appDateFormat + ' hh:mm a') : 'DD MMM YYYY hh:mm a');
}

function initWarningPopover(objToInitializePopover){
    var certId = objToInitializePopover.attr("certId");
    objToInitializePopover.webuiPopover({
        type:'async',
        title: 'Warnings',
        url:'/cc/api/certificates/'+certId+'/warnings',
        content:function(data){
            console.log(data);
            var html = '<ul>';
            for(var key in data){html+='<li>'+data[key]+'</li>';}
            html+='</ul>';
            return html;
        }
    });
}

function getFromDictionary(msg, params){
	var message = (msg && !_.isEmpty(dictionaryMessages)) ? dictionaryMessages[msg.toLowerCase()] : msg;
	if ( message){
		return message.format(params);
	}else if ( msg) {
		return msg.format(params);
	}else{
	    return msg;
	}
}
function getCategoryDispValue(category){
	if ( !category){ return ""; }
	if ( category == 'atv' ) {return "ATV"; }
	if ( category == 'utv' ) {return "UTV"; }
	if ( category == 'atv-tyre' ) {return "ATV Tyre"; }
	if ( category == 'truck-and-bus-tyre' ) {return "Truck and Bus Tyre"; }

	return category.split("-").join(" ").replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

function getCopyCertFormUrl(certId, certType, category, certNo, version){
	var baseUrl = "/cc/page/certificates/form?";
	var params = {
		ccr_tc_id: certId,
		copy: true,
		category: category,
		ccr_tc_no: certNo,
		version: version,
		cert_type: certType
	};
	return baseUrl + $.param(params);
}

/* slimScrolls */
function gsoSlimScroll(selector){
	if(!selector){
		selector = '.slimScroll';
	}
	
	$(selector).slimScroll({
        size: '7px',
        color: '#999',
        railVisible: true,
        alwaysVisible: true,
        //distance: '0px',
        railColor: '#ccc',
        railOpacity: 0.3,
        wheelStep: 10,
        allowPageScroll: false,
        disableFadeOut: false
    });
}

function initializeFileUploadControl(selector){

    $(selector).each(function() {
        var $input = $(this),
            $label = $input.next('label'),
            labelVal = $label.html();
        $input.on('change', function(e) {

            var fileName = '';

            if (this.files){
                if(this.files.length > 1){
                    fileName = (this.getAttribute('data-multiple-caption') || '').replace('{count}', this.files.length);
                }else{
                    fileName = e.target.files.length > 0 ? e.target.files[0].name.split('\\').pop() : '';
                }
            }

            if (fileName)
                $label.html(fileName);
            else
                $label.html(labelVal);
        });

        // Firefox bug fix
        $input
            .on('focus', function() { $input.addClass('has-focus'); })
            .on('blur', function() { $input.removeClass('has-focus'); });
    });
}

function getQueryStringValues(key, defaultValue) {
    var arrParamValues = [];
    var url = window.location.search.slice(window.location.search.indexOf('?') + 1).split('&');
 
    for (var i = 0; i < url.length; i++) {
        var arrParamInfo = url[i].split('=');
 
        if (arrParamInfo[0] == key || arrParamInfo[0] == key+'[]') {
            arrParamValues.push(decodeURIComponent(arrParamInfo[1]));
        }
    }
    return (arrParamValues.length > 0 ? (arrParamValues.length == 1 ? arrParamValues[0] : arrParamValues) : (typeof(defaultValue) !== 'undefined' ? defaultValue : null));
}

function updateMapWithQueryString(map, defaultValues){
  	$.each(map, function(k, v) {
    	map[k] = getQueryStringValues(k, defaultValues && defaultValues[k] ? defaultValues[k] : '');
  	});
}

/**
 * Update the pagination map in the VueJS data model.
 * @param map
 * @param defaultValues
 */
function updatePaginationMapWithQueryString(map, defaultValues){
  	map['size'] = getQueryStringValues('page_size', defaultValues && defaultValues[k] ? defaultValues[k] : '10');
  	map['page'] = getQueryStringValues('page_no', defaultValues && defaultValues[k] ? defaultValues[k] : '1');
}

/**
 * Handle the back button event from browser.
 * We invoke this method by passing `this` object from Vue.
 * @param vueVm
 */
function handleBackButton(vueVm, defaultValues){
	vueVm.filtersChangeEnable = false;
	updateMapWithQueryString(vueVm.filters, defaultValues);
	updatePaginationMapWithQueryString(vueVm.pagination);
	vueVm.currentPage = vueVm.pagination.page;
	vueVm.loadData(true);
}

function handleBackButtonNonVue(e, parameters, filters, callback){

	$.each(parameters, function(idx, value){
		var filterId = '#' + value + "_filter";
		var clearId = filterId+"_clear";
		var qVal = getQueryStringValues(value, '');
		if(qVal){
			queryString[value] = qVal;
			filters[value] = qVal;
			$(filterId).val(queryString[value]);
			if($(filterId).prop('type')=="select-one"){
				$(filterId).data('value', queryString[value]);
			}
			$(clearId).show();
		}else{
			delete queryString[value];
			delete filters[value];
			if(value == 'page_size'){
				$(filterId).val('25');
			}else{
				$(filterId).val('');
			}
			$(clearId).hide();
		}
	});
	
	callback();
}