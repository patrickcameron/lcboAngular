var storeID = 3;

var searchOptions = '';

var isOnSale = '';

var whereStringResult = '';

var pageNumber = 1;

var app = angular.module('lcboSearch', []);

var filterData = function(data) {
	for (var i in data.result) {
		// cut out "Region Not Specified" from search results
		var temp = data.result[i].origin
		if (temp.substring(temp.length-0, temp.length-22) == ", Region Not Specified") {
			temp = temp.slice(0, temp.length-22);
			data.result[i].origin = temp;
		};
		// add spaces around 'x' in quantity information (eg. "2x250 ml --> 2 x 250 ml")
		var temp2 = data.result[i].package;
		if (temp2.charAt(1) == 'x') {
			temp2 = temp2.charAt(0) + ' ' + temp2.charAt(1) + ' ' + temp2.substring(2);
			data.result[i].package = temp2;
		};
	};
};

app.controller('searchController', function($scope) {
	
	$scope.searchAPI = function() {
		$.ajax({
		    url: 'http://lcboapi.com/stores/' + storeID + '/products',
		    dataType: 'jsonp',
		    method: 'GET',
		    data: {
		    	page: pageNumber,
		        key: lcboKey,
		        per_page: 100,
		        where: whereStringResult,
		        q: $scope.search
		    	}
		    }).then(function(data) {
		    	console.log(data);
		    	filterData(data);
		    	$scope.lcbo_data = data.result;
		    	$scope.totalResults = data.pager.total_record_count;
		    	$scope.$apply();
		    	if (data.pager.is_final_page == false) {
		    		pageNumber++;
		    		$scope.searchAPI;
		    	};
		    	$scope.itemsTotal = $('.result').length;
		    	$scope.itemsInStock = $('.result:visible').length;
		    	$scope.$digest();
			});
	};

	$scope.vqa = function() {
		if (searchOptions != "is_vqa") {
			searchOptions = 'is_vqa';
		} else {
			searchOptions = '';
		}
		console.log('clicked');
		console.log(searchOptions);
	};

	$scope.ocb = function() {
		if (searchOptions != "is_ocb") {
			searchOptions = 'is_ocb';
		} else {
			searchOptions = '';
		}
	};

	$scope.kosher = function() {
		if (searchOptions != "is_kosher") {
			searchOptions = 'is_kosher';
		} else {
			searchOptions = '';
		}
	};

	$scope.glutenFree = function() {
		$scope.search = "gluten free";
	};

	$scope.onSale = function() {
		if (isOnSale !== "has_limited_time_offer") {
			isOnSale = 'has_limited_time_offer';
		} else if (isOnSale === "has_limited_time_offer") {
			isOnSale = '';
		}
		console.log(isOnSale);
		$scope.whereString();
	}

	$scope.whereString = function() {
		if (searchOptions !== '' && isOnSale !== '') {
			whereStringResult = searchOptions + ',' + isOnSale
		} else if (searchOptions === '' && isOnSale !== '') {
			whereStringResult = isOnSale
		} else if (searchOptions !== '' && isOnSale === '') {
			whereStringResult = searchOptions
		};
		console.log(whereStringResult);
		$scope.searchAPI();
	};

	$scope.reload = function() {
		$scope.whereString();
	};

	if ($scope.search === undefined) {
		$scope.search = suggestedSearches[Math.floor(Math.random()*suggestedSearches.length)];
	};

	$scope.whereString();
});

$(function(){
	//if a search checkbox is clicked, unselect the others
	$('input.searchCheckbox').on('change', function() {
	    $('input.searchCheckbox').not(this).prop('checked', false);  
	});
});