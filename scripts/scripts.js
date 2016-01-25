var storeID = 3;

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

var app = angular.module('lcboSearch', ['ngGeolocation']);

app.controller('getUserLocation', ['$geolocation', '$scope', function($geolocation, $scope) {
		$geolocation.getCurrentPosition({
			timeout: 60000
		}).then(function(position) {
			$scope.userPosition = position;
			console.log($scope.userPosition);
		});
}]);


app.controller('searchController', function($scope) {

	$scope.showResultCount = false;

	$scope.searchAPI = function() {

		var searchOptionsString = [];

		for (var i in $scope.checkboxes) {
			if ($scope.checkboxes[i].checked === true) {
				searchOptionsString.push($scope.checkboxes[i].searchCode);
			}
		};

		if ($scope.onSale === true) {
			searchOptionsString.push('has_limited_time_offer');
			console.log(typeof searchOptionsString);
		}

		searchOptionsString = searchOptionsString.toString();

		console.log('search options string = ' + searchOptionsString);

		$.ajax({
		    url: 'http://lcboapi.com/stores/' + storeID + '/products',
		    dataType: 'jsonp',
		    method: 'GET',
		    data: {
		        key: lcboKey,
		        per_page: 100,
		        where: searchOptionsString,
		        q: $scope.search
		    	}
		    }).then(function(data) {
		    	console.log(data);
		    	filterData(data);
		    	$scope.lcbo_data = data.result;
		    	$scope.totalResults = data.pager.total_record_count;
		    	$scope.$apply();

		    	$scope.itemsTotal = $('.result').length;
		    	$scope.itemsInStock = $('.result:visible').length;

		    	$scope.showResultCount = true;

		    	$scope.$digest();
			});
	};

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

	$scope.updateSelection = function(position, checkboxes) {
        angular.forEach(checkboxes, function(item, index) {
          if (position != index) 
            item.checked = false;
        });
      };

	$('input.searchCheckbox').on('change', function() {
	    $('input.searchCheckbox').not(this).prop('checked', false);
	});

	if ($scope.search === undefined) {
		$scope.search = suggestedSearches[Math.floor(Math.random()*suggestedSearches.length)];
	};

	$scope.searchAPI();

});