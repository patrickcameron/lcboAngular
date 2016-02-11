// configure progress bar
NProgress.configure({ showSpinner: false });

// display current year in footer
var currentTime = new Date();
var currentYear = currentTime.getFullYear();
$(function() {
	$('span.year').text(currentYear);
});

var app = angular.module('lcboSearch', ['ngGeolocation', 'ui.router']);

app.config(function ($stateProvider) {
	$stateProvider.state('index', {
		url: '',
		controller: 'mainController',
		templateUrl: 'scripts/templates/mainCtrl.html'
	}).state('single', {
		url: '/:id',
		controller: 'singleProduct',
		templateUrl: 'scripts/templates/singleCtrl.html'
	});
});

app.controller('mainController', ['$geolocation', '$scope', function ($geolocation, $scope) {

	$scope.nearestStores = [];
	$scope.storeIsFound = false;
	$scope.selectedStoreID;
	$scope.searchOrder = "";
	$scope.showNoResultsMessage = false;
	var loadMoreResults = false;
	$scope.store_data = [];
	$scope.lcbo_data = [];

	// various data filters for raw API data
	var filterData = function(data) {

		var resultsCounter = false;
		$scope.showNoResultsMessage = false;

		for (var i in data.result) {

			// cut out "Region Not Specified" from country of origin result fields
			if (data.result[i].origin.substring(data.result[i].origin.length-0, data.result[i].origin.length-22) == ", Region Not Specified") {
				data.result[i].origin = data.result[i].origin.slice(0, data.result[i].origin.length-22);
				data.result[i].origin = data.result[i].origin;
			}

			if (data.result[i].origin.substring(data.result[i].origin.length-0, data.result[i].origin.length-5) == ", N/A" ) {
				data.result[i].origin = data.result[i].origin.slice(0, data.result[i].origin.length-5);
			}

			// add spaces around 'x' in quantity information (eg. "2x250 ml --> 2 x 250 ml")
			if (data.result[i].package !== null && data.result[i].package.charAt(1) == 'x') {
				data.result[i].package = data.result[i].package.charAt(0) + ' ' + data.result[i].package.charAt(1) + ' ' + data.result[i].package.substring(2);
			}

			if (data.result[i].quantity > 0) {
				resultsCounter = true;
			}

			if (data.result[i].secondary_category === "Bags & Boxes") {
				data.result[i].quantity = 0;
			}
			
		}

		if (data.pager.total_record_count === 0) {
			resultsCounter = false;
		}

		if (resultsCounter === false) {
			$scope.showNoResultsMessage = true;
			$scope.$digest();
			$scope.$apply();
		}
	};

	//use browser location to find closest LCBO stores
	$scope.getUserLocation = function() {
		NProgress.start();
		$geolocation.getCurrentPosition({
				timeout: 60000
			}).then(function(position) {
				$('h2.loadingMessage').text('Finding nearby LCBO stores...');
				$.ajax({
				    url: 'http://lcboapi.com/stores',
				    dataType: 'jsonp',
				    method: 'GET',
				    data: {
				        key: lcboKey,
				        per_page: 5,
				        lat: position.coords.latitude,
				        lon: position.coords.longitude
				    }
			    }).then(function(data) {
			    	$scope.nearestStores = data.result;
			    	$scope.selectedStoreID = data.result[0].id;
			    	$scope.storeIsFound = true;
			    	$('.loadingMoreResultsMessage').addClass('displayNone');
			    	$('section.loadingMessage').removeClass('displayFlex');
			    	$('section.loadingMessage').addClass('displayNone');
				    $scope.randomSearch();
			    	$scope.$digest();
			    	NProgress.done();
				});
			});
	};

	$scope.getUserLocation();

	// search store inventory and return results
	$scope.searchStore = function() {

		NProgress.start();

		$scope.modifyStockCount = false;

		var searchOptionsString = [];

		if ($scope.searchOrder === "limited_time_offer_savings_in_cents.desc") {
			$scope.onSale = true;
		}

		for (var i in $scope.checkboxes) {
			if ($scope.checkboxes[i].checked === true) {
				searchOptionsString.push($scope.checkboxes[i].searchCode);
			}
		}

		if ($scope.onSale === true) {
			searchOptionsString.push('has_limited_time_offer');
		}

		searchOptionsString = searchOptionsString.toString();

		$.ajax({
	    url: 'http://lcboapi.com/stores/' + $scope.selectedStoreID + '/products',
	    dataType: 'jsonp',
	    method: 'GET',
	    data: {
	        key: lcboKey,
	        page: pageNumber,
	        per_page: 100,
	        where: searchOptionsString,
	        order: $scope.searchOrder,
	        q: $scope.search
	    	}
	    }).then(function(data) {
	    	filterData(data);		
	    	if (data.pager.is_final_page === false) {
	    		loadMoreResults = true;
	    		// $scope.loadMoreProducts();
	    	} else if (data.pager.is_final_page === true) {
	    		loadMoreResults = false;
	    	}
	    	$scope.store_data = data.store;
	    	for (var i in data.result) {
				$scope.lcbo_data.push(data.result[i]);
			}
	    	$scope.$apply();
	    	$scope.$digest();
	    	NProgress.done();
		});
	};


	//reset all params and start new API call when new input is entered into search bar
	var pendingTask;
	$scope.newSearch = function() {
		$scope.lcbo_data = [];
		pageNumber = 1;
		$('.loadingMoreResultsMessage').addClass('displayNone');
		$scope.showNoResultsMessage = false;
		$('.result').empty();
		if (pendingTask) {
			clearTimeout(pendingTask);
		}
		pendingTask = setTimeout($scope.searchStore, 800);
	};


	//data for search options checkboxes
	$scope.checkboxes = [{
          name: 'VQA',
          searchCode: 'is_vqa',
          checked: false
        }, {
          name: 'Ontario Craft Brew',
          searchCode: 'is_ocb',
          checked: false
        }, {
          name: 'Kosher',
          searchCode: 'is_kosher',
          checked: false
        }
    ];

    $scope.onSale = false;

    //only one search checkbox can be selected at a time
	$scope.updateSelection = function(position, checkboxes) {
        angular.forEach(checkboxes, function(item, index) {
          if (position != index) 
            item.checked = false;
        });
      };


	// search a random locally stored keyword
	$scope.randomSearch = function() {
		$scope.search = suggestedSearches[Math.floor(Math.random()*suggestedSearches.length)];

		$scope.newSearch();
	};

}]);

app.controller('singleProduct', ['$geolocation', '$scope', '$stateParams', function($geolocation, $scope, $stateParams) {
	NProgress.start();
 	$geolocation.getCurrentPosition({
 			timeout: 10000
 		}).then(function(position) {
 			$.ajax({
 			    url: 'http://lcboapi.com/stores',
 			    dataType: 'jsonp',
 			    method: 'GET',
 			    data: {
 			        key: lcboKey,
 			        per_page: 5,
 			        lat: position.coords.latitude,
 			        lon: position.coords.longitude,
 			        product_id: $stateParams.id
 			    }
 		    }).then(function(data) {
 		    	$scope.singleData = data;
 		    	$scope.$digest();
 		    	NProgress.done();
 			});
 		});
}]);

app.directive('searchBar', function() {
	return {
		restrict: 'E',
		templateUrl: "scripts/templates/searchBar.html"
	};
});

app.directive('resultsSection', function() {
	return {
		restrict: 'E',
		templateUrl: "scripts/templates/resultsSection.html"
	};
});

app.directive('singleResult', function() {
	return {
		restrict: 'E',
		templateUrl: "scripts/templates/searchResult.html"
	};
});
