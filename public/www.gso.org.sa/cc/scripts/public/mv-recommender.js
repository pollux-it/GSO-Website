var nameToIdRegex = /\s+|\(|\)/g;
var selectedFiltersComponent;
var supportedQueryParams = ["brand", "brand.keyword", "commercial_name", "transmission", "engine_type",
    "fuel_economy", "body_type", "model_year", "passenger_count", "fuel_economy_grade"];

$(function(){
    initPagination(pageCount, pageNo);

    selectedFiltersComponent = new Vue({
        el: "#selected-filters",
        data: function(){
            return {
                selectedFilters: []
            }
        },
        methods:{
            addSelectedFilter: function(key, value){
                var idx = _.findIndex(this.selectedFilters, {"key": key, "value": value});
                if ( idx < 0){
                    this.selectedFilters.push({key: key, value: value});
                }
                $("#"+value.replace(nameToIdRegex, '_')).prop("checked", true);
            },
            removeSelectedFilter: function(key, value){
                var idx = _.findIndex(this.selectedFilters, {"key": key, "value": value});
                this.selectedFilters.splice(idx, 1);
                $("#"+value.replace(nameToIdRegex, '_')).prop("checked", false);
                //$("#"+value+"Model").collapse('toggle');
                removeFilterFromQueryString(key, value);
                refreshMvList();
            },
            clearSelectedFilter: function(){
                this.selectedFilters = [];
                $("input.custom-control-input").prop("checked", false);

            },
        }
    });

    markTheFacetsFromQueryStringOnLoad();
});

function initPagination(pageCount, currentPage ){
	if(pageCount <= 0){
		return;
	}
	var boopageObj = {
			total: pageCount,
			page: currentPage,
			maxVisible: pageCount > 0 ? 3 : 0,
			prev:"Previous",
			next: "Next"
		};

	$('.pagination-template').bootpag(boopageObj)
	    .on('page', function(event, page_no){
            queryString['pageNo'] = page_no;
            refreshMvList();
        });
    $('.pagination li').addClass('page-item');
    $('.pagination a').addClass('page-link');
}

function updatePageSize(event){
    queryString["pageSize"] = $(event.srcElement).val();
    refreshMvList();
}

function getQueryStringValueArray(key){
    if (_.has(queryString, key)){
        var existingValue = queryString[key];
        var existingValueArr = existingValue.split(",");
        existingValueArr = _.filter(existingValueArr, function(v) { return v.length > 0; });
        return existingValueArr;
    }
    return [];
}

function removeFilterFromQueryString(key, value){
    console.log("Removing " + key+", " + value);
    var existingValueArr = getQueryStringValueArray(key);
    if ( existingValueArr.length > 0){
        var idx = _.findIndex(existingValueArr, function(v) { return v == value; });
        if ( idx >= 0){
            existingValueArr.splice(idx, 1);
            if (existingValueArr.length == 0 ){
                _.unset(queryString, key);
            }else{
                var newValue = _.join(existingValueArr, ",");
                queryString[key] = newValue;
            }
        }
    }
}

//Event handler for facet value selection
function selectFacetFilter(event, key, value){
    var srcElement = $(event.srcElement);
    if ( srcElement.is(":checked")){
        var existingValueArr = getQueryStringValueArray(key);
        if ( existingValueArr.length > 0){
            var idx = _.findIndex(existingValueArr, function(v) { return v == value; });
            if ( idx == -1 ){
                //existingValueArr.push(encodeURIComponent(value));
                existingValueArr.push(value);
                var newValue = _.join(existingValueArr, ",");
                queryString[key] = newValue;
            }
        }else{
            queryString[key] = value;
        }
        //selectedFiltersComponent.addSelectedFilter(key, value);
    }else{
        removeFilterFromQueryString(key, value);
        selectedFiltersComponent.removeSelectedFilter(key, value);
    }

    queryString['pageNo'] = 1;
    refreshMvList();

}

//Function to reload the facets by searching in the facet.
function searchInFacets(event){
    var srcElement = $(event.srcElement);
    var facetName = $(srcElement).attr("facet-name");
    var keyCharCode = event.charCode;
    var isEnterPressed = (keyCharCode == 13);
    if ( !isEnterPressed ){
        return;
    }
    var textEntered = $(srcElement).val();
    console.log("Text entered is " + textEntered);
    var requestParams = {};
    if ( textEntered ){
        requestParams[facetName] = textEntered;
    }else{
        _.unset(requestParams, facetName);
    }
    fetchMvFacetBasedOnFilters(requestParams, facetName);
}

function refreshMvList(){
    if(headless){
    	queryString['headless'] = headless;
    }
    pushToHistory(queryString, false);
    var requestParams = queryString;
    fetchMvsBasedOnFilters(requestParams);
    fetchMvFacetsBasedOnFilters(requestParams);
}

function markTheFacetsFromQueryStringOnLoad(){

    _.each(queryString, function(value, key){

        var idx = _.findIndex(supportedQueryParams, function(v) { return v == key; });

        if ( idx < 0 ) { return ; }

        var existingValueArr = getQueryStringValueArray(key);
        _.each(existingValueArr, function(value){
            console.log("Marking From Query string " + key +" = " + value);
            selectedFiltersComponent.addSelectedFilter(key, value);

            //$("#"+value+"Model").collapse('toggle');
        });
    });

    /* to load slimScroll for facets list groups */
    $.each($('.slimScroll'), function(index, item){
		var $el = $(item);
		var count = $el.data('count');
		if(count > 10){
			gsoSlimScroll($el)
		}
	});
    
}



function clearAllFilters(){
    queryString = {};
    selectedFiltersComponent.clearSelectedFilter();
    refreshMvList();
}

function fetchMvsBasedOnFilters(requestParams){
    var url = appContext + '/mv-recommender/search';

    $.ajax({
        url: url,
        method: "GET",
        data: requestParams,
        dataType: 'html',
        error: function(response){
        },
        success: function(response){
            $("#searchResultsContainer").html(response);
            var pageNo = $("#searchResultsBox").attr("pageno");
            var pageCount = $("#searchResultsBox").attr("pagecount");
            initPagination(pageCount, pageNo);
        }
    });
}

function fetchMvFacetsBasedOnFilters(requestParams){
    var url = appContext + '/mv-recommender/facets';

    $.ajax({
        url: url,
        method: "GET",
        data: requestParams,
        dataType: 'html',
        error: function(response){
        },
        success: function(response){
            $("#searchFacetsContainer").html(response);
            markTheFacetsFromQueryStringOnLoad();
        }
    });
}

function fetchMvFacetBasedOnFilters(requestParams, facetName){
     var url = appContext + '/mv-recommender/facets/' + facetName;
     $.ajax({
         url: url,
         method: "GET",
         data: requestParams,
         dataType: 'html',
         error: function(response){
         },
         success: function(response){
             var facetNameAsId = facetName.replaceAll(".", "_");
             $("#"+facetNameAsId+"-facet-list").html(response);
             markTheFacetsFromQueryStringOnLoad();
         }
     });
} 