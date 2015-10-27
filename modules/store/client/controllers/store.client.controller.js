'use strict';

// Store controller
angular.module('store').controller('StoreController', ['$scope', '$stateParams', '$rootScope', '$location', '$http', 'Users', 'Authentication', 'FileUploader', 'Store', 'CartItem', '$timeout', '$state', '$window',
  function ($scope, $stateParams, $rootScope, $location, $http, Users, Authentication, FileUploader, Store, CartItem, $timeout, $state, $window) {
  	$scope.user = Authentication.user;
    $scope.imageURL = '/modules/store/client/img/items/default.png';

    $scope.newCart = function() {
    	// Temporary Function
    	$http.get('/api/store/cart/newcart');
    };

    $scope.addToCart = function() {
      console.log('Adding (' + $scope.quantity + ') items to cart.');
	  $scope.error = null;

	  // TO DO Error Checking

      // Create new Message object
      var cartItem = new CartItem({
      	_itemId: $scope.preview._id,
      	name: $scope.preview.name,
      	itemImageURL: $scope.preview.itemImageURL,
      	price: $scope.preview.price,
      	displayedUser: $scope.user, // Validation of user
      	quantity: $scope.quantity
      });

      console.log(cartItem);

      // Don't Redirect after save
      cartItem.$save(function (response) {
        // Clear form fields
        $scope.quantity = 1;
        $scope.preview = '';
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    $scope.findCartItems = function() {
    	$http.get('/api/store/cart').success(function(cart){
    		$scope.cart = cart;
    		console.log($scope.cart);
    	});
    };

    $scope.checkout = function() {
    	console.log("CHECKOUT");
    	$http.get('/api/store/cart/checkout').success(function(response){
    		$window.location = response;
    	});
    };

    $scope.confirmCheckout = function() {
    	console.log("Confirming Checkout!");
    	var params = $location.search();
    	$http.post('api/store/cart/confirmcheckout', params);
    };

  	$scope.addItem = function(isValid) {
    	$scope.error = null;

      	if (!isValid) {
	        $scope.$broadcast('show-errors-check-validity', 'itemForm');
        	return false;
      	}

	    $scope.uploadProfilePicture();
    };

    // Find a list of Items
    $scope.findItems = function () {
      	$scope.items = $scope.loadItems();
    };

    // Find existing item
    $scope.displayItem = function (item) {
	  	$scope.preview = item;
	  	$scope.quantity = 1;
    };

    $scope.currentPage = 1;
    $scope.maxSize = 5;

    $http.get('/api/store/count').success(function(response) {
      $scope.totalShopItems = response.count;
    });

    $scope.setPage = function(value) {
    	$scope.currentPage = value;
    };

    $scope.pageChanged = function() {
    	$scope.loadItems();
    };

    $scope.loadItems = function() {
    	$http.get('/api/store/page/' + $scope.currentPage).success(function(response) {
    		$scope.items = response;
    	});
    };

    // Create file uploader instance
    $scope.uploader = new FileUploader({
      url: '/api/store/additem'
    });

    // Set file uploader image filter
    $scope.uploader.filters.push({
      name: 'imageFilter',
      fn: function (item, options) {
        var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
        return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
      }
    });

    $scope.uploader.onBeforeUploadItem = function(item) {
      	item.formData.push({
      		'name': $scope.item.name, 
      		'description': $scope.item.description, 
      		'price': $scope.item.price
  		});
    };

    // Called after the user selected a new picture file
    $scope.uploader.onAfterAddingFile = function (fileItem) {
      if ($window.FileReader) {
        var fileReader = new FileReader();
        fileReader.readAsDataURL(fileItem._file);

        fileReader.onload = function (fileReaderEvent) {
          $timeout(function () {
            $scope.imageURL = fileReaderEvent.target.result;
          }, 0);
        };
      }
    };

    // Called after the user has successfully uploaded a new picture
    $scope.uploader.onSuccessItem = function (fileItem, response, status, headers) {
      // Show success message
      $scope.success = true;

      // Clear upload buttons
      $scope.cancelUpload();
    };

    // Called after the user has failed to uploaded a new picture
    $scope.uploader.onErrorItem = function (fileItem, response, status, headers) {
      // Clear upload buttons
      $scope.cancelUpload();

      // Show error message
      $scope.error = response.message;
    };

    // Change user profile picture
    $scope.uploadProfilePicture = function () {
      // Clear messages
      $scope.success = $scope.error = null;

      // Start upload
      $scope.uploader.uploadAll();
    };

    // Cancel the upload process
    $scope.cancelUpload = function () {
      $scope.uploader.clearQueue();
      $scope.imageURL = '/modules/store/client/img/items/default.png';
    };
  }
]);