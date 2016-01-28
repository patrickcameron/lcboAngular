var filterData = function(data) {
	for (var i in data.result) {

		// cut out "Region Not Specified" from country of origin result fields
		if (data.result[i].origin.substring(data.result[i].origin.length-0, data.result[i].origin.length-22) == ", Region Not Specified") {
			data.result[i].origin = data.result[i].origin.slice(0, data.result[i].origin.length-22);
			data.result[i].origin = data.result[i].origin;
		};

		// add spaces around 'x' in quantity information (eg. "2x250 ml --> 2 x 250 ml")
		if (data.result[i].package !== null && data.result[i].package.charAt(1) == 'x') {
			data.result[i].package = data.result[i].package.charAt(0) + ' ' + data.result[i].package.charAt(1) + ' ' + data.result[i].package.substring(2);
		};
	};
};

var app = angular.module('lcboSearch', ['ngGeolocation']);

app.controller('searchController', ['$geolocation', '$scope', function ($geolocation, $scope) {

	$scope.nearestStores = [];

	$scope.storeIsFound = false;

	$scope.selectedStoreID;

	$scope.searchOrder = "";

	//use browser location to find closest LCBO stores
	$geolocation.getCurrentPosition({
			timeout: 60000
		}).then(function (position) {
			console.log(position);
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
			    	console.log(data);
			    	$scope.nearestStores = data.result;
			    	console.log($scope.nearestStores);
			    	$scope.selectedStoreID = data.result[0].id;
			    	$scope.storeIsFound = true;
			    	$scope.randomSearch();
			    	$scope.searchStore();
			    	$scope.$digest();
				});
		});

	$scope.randomSearch = function() {
		$scope.search = suggestedSearches[Math.floor(Math.random()*suggestedSearches.length)];
		$scope.newSearch();
	}


	// search store inventory and return results

	$scope.searchStore = function() {

		$scope.store_data = [];
		$scope.lcbo_data = [];

		$scope.modifyStockCount = false;

		var searchOptionsString = [];

		for (var i in $scope.checkboxes) {
			if ($scope.checkboxes[i].checked === true) {
				searchOptionsString.push($scope.checkboxes[i].searchCode);
			}
		};

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
		        per_page: 100,
		        where: searchOptionsString,
		        order: $scope.searchOrder,
		        q: $scope.search
		    	}
		    }).then(function(data) {
		    	console.log(data);
		    	filterData(data);
		    	$scope.store_data = data.store;
		    	for (var i in data.result) {
					$scope.lcbo_data.push(data.result[i]);
				};
		    	$scope.pager_data = data.pager;

		    	$scope.$apply();

		    	$scope.$digest();

		    	if ($scope.pager_data.total_pages > 1) {
		    		if($(window).scrollTop() + $(window).height() > $(document).height() - 100) {
		    		       alert("near bottom!");
		    		   }
		    	};
			});
	};


	// automatically update search when new input is entered into search bar

	var pendingTask;

	$scope.newSearch = function() {

		$('.result').empty();
		
		if ($scope.searchOrder === "limited_time_offer_savings_in_cents.desc") {
			$scope.onSale = true;
		}

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

    $scope.loadMoreResults = function() {
    	$(window).scroll(function() {
    	   if($(window).scrollTop() + $(window).height() > $(document).height() - 100) {
    	       alert("near bottom!");
    	   }
    	});
    }
    // }
}]);