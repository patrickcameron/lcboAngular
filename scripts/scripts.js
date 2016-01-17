var storeID = 6;

var searchOptions = '';

var isOnSale = '';

var whereStringResult = '';

var app = angular.module('lcboSearch', []);

app.controller('searchController', function($scope) {

	$scope.searchAPI = function() {
		$.ajax({
		    url: 'http://lcboapi.com/stores/' + storeID + '/products',
		    dataType: 'jsonp',
		    method: 'GET',
		    data: {
		          key: lcboKey,
		          per_page: 100,
		          where: whereStringResult,
		          q: $scope.search
		    	}
		    }).then(function(data) {
		    	console.log(data);
		    	$scope.lcbo_data = data.result;
		    	$scope.$apply();
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