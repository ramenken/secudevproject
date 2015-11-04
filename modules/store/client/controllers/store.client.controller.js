'use strict';

// Store controller
angular.module('store').controller('StoreController', ['$scope', '$stateParams', '$rootScope', '$location', '$http', 'Users', 'Authentication', 'FileUploader', 'Store', 'CartItem', '$timeout', '$state', '$window',
  function ($scope, $stateParams, $rootScope, $location, $http, Users, Authentication, FileUploader, Store, CartItem, $timeout, $state, $window) {
  	$scope.user = Authentication.user;
    $scope.imageURL = '/modules/store/client/img/items/default.png';
    $scope.hasItemFocus = false;
    $scope.item = {};
    $scope.item.types = [{'name': 'Item'  , 'value': 'item'},
                         {'name': 'Donation', 'value': 'donation'}];
    $scope.item.type = $scope.item.types[0].value;
    $scope.name = '5 Donation Pack';

    $scope.verifyUser = function() {
      $window.alert('Hello');
      $window.stop();
      $location.path('store');
    };

    $scope.findDonationPacks = function() {
      $http.get('/api/store/getpacks').success(function(response){
        console.log(response);
        $scope.donation = {};
        $scope.donation.packs = [];

        // Push all donation packs in selection box
        for(var i in response) {
          $scope.donation.packs.push({'name': response[i].name, 'value': response[i]});
        }

        $scope.donation.pack = $scope.donation.packs[0].value;
        $scope.donation.quantity = 1;
      });
    };

    $scope.updateAmount = function(item) {
    	if(item.quantity > 0) {
	    	$http.post('/api/cart/updateitem', item).success(function(response){
	    		console.log(response);
	    		for (var i in $scope.cart.items) {
            	if ($scope.cart.items[i].item._id === response.itemId) {
           			$scope.cart.items[i].totalPrice = response.totalPrice;
           			$scope.cart.totalAmount = response.totalAmount;
            	}
        	}
	    	});
	    } else {
        var deleteItem = $window.confirm('Any value lower than 1 will be deleted continue?');
        
        if(deleteItem) {
          $scope.removeCartItem(item.item._id);
        } else {
          for (var i in $scope.cart.items) {
            if ($scope.cart.items[i].item._id === item.item._id) {
              $scope.cart.items[i].quantity = 1;
            }
          }
        }
      }
    };

    $scope.hideItem = function() {
      $http.delete('/api/store/item/' + $scope.preview._id).success(function(response){
        $location.path('store');
      });
    };

    $scope.newCart = function() {
    	// Temporary Function
    	$http.get('/api/cart/newcart');
    };

    $scope.addPacktoCart = function() {
    	console.log('Adding (' + $scope.donation.pack + ' - ' + $scope.donation.quantity + ') item to cart');
      
  	  var cartItem = new CartItem({
      	item: $scope.donation.pack,
      	quantity: $scope.donation.quantity,
      	displayedUser: $scope.user
    	});

    	cartItem.$save(function (response) {
      	// Clear form fields
      	$scope.donation.quantity = 1;
      	$scope.donation.pack = $scope.donation.packs[0].value;
    	}, function (errorResponse) {
      	$scope.error = errorResponse.data.message;
    	});
    };

    $scope.addToCart = function() {
      console.log('Adding (' + $scope.quantity + ') items to cart.');
	    $scope.error = null;

      // Create new Message object
      var cartItem = new CartItem({
      	displayedUser: $scope.user, // Validation of user
      	quantity: $scope.quantity,
        item: $scope.preview
      });

      // Don't Redirect after save
      cartItem.$save(function (response) {
        // Clear form fields
        $scope.quantity = 1;
        $scope.preview = '';
        $scope.hasItemFocus = false;
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    $scope.removeCartItem = function(itemId) {
    	var cartItem = {
    		'itemId': itemId,
    		'displayedUser': $scope.user
    	};

    	$http.post('/api/cart/deleteitem', cartItem).success(function(response){
    		for (var i in $scope.cart.items) {
          if ($scope.cart.items[i].item._id === itemId) {
         		$scope.cart.items.splice(i, 1);
         		$scope.cart.totalAmount = response.totalAmount;
          }
        }
    	});
    };

    $scope.findCartItems = function() {
    	$http.get('/api/cart').success(function(cart){
    		$scope.cart = cart;
    		console.log($scope.cart);
    	});
    };

    $scope.checkout = function() {
    	var price = {totalAmount: $scope.cart.totalAmount};
    	console.log("Checking out: " + price);

    	var checkout = {
          items: $scope.cart.items,
	      	totalAmount: $scope.cart.totalAmount,
	      	displayedUser: $scope.user
      	};

  		$http.post('/api/cart/checkout', checkout).success(function (response) {
  			console.log(response);
        if(response.continue)
  			  $window.location = response.link;
  		});

      // 	checkout.$save(function (response) {
      //   	// Clear cart
      //   	console.log(response);
    		// //$window.location = response;
      // 	}, function (errorResponse) {
      //   	$scope.error = errorResponse.data.message;
      // 	});
    };

    $scope.confirmCheckout = function() {
    	console.log("Confirming Checkout!");
    	var params = $location.search();
      params.displayedUser = $scope.user;

    	$http.post('api/cart/confirmcheckout', params).success(function(response){
    		$state.go('store.cart');
    	});
    };

    $scope.cancelCheckout = function() {
      console.log("Cancelled Checkout!");

      var params = $location.search();
      params.displayedUser = $scope.user;

      $http.post('api/cart/cancelcheckout', params).success(function(response){
        console.log('Successfully Cancelled!');
      });
    };

  	$scope.addItem = function(isValid) {
    	$scope.error = null;

      if($scope.itemForm.itemName.$error.required) {
        $scope.error = 'Item name cannot be blank. ';
      } else if($scope.itemForm.itemPrice.$error.required) {
        $scope.error = 'Item price cannot be blank. ';
      } else if($scope.itemForm.itemDescription.$error.required) {
        $scope.error = 'Item description cannot be blank. ';
      }

      if($scope.uploader.queue.length === 0) {
        $scope.error = 'Item image cannot be blank.';
      }

    	if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'itemForm');
      	return false;
    	}

	    $scope.addImage();
      if($scope.uploader.queue.length !== 0) {
        $timeout(function(){
          $location.path('store');
        }, 3000);
      }
    };

    // Find a list of Items
    $scope.find = function () {
      	$scope.items = $scope.loadItems();

      	// Cart item count
      	$http.get('/api/cart/countitems').success(function(response) {
	      $scope.totalCartItems = response.totalCartItems;
	      console.log($scope.totalCartItems);
	    });

	    // Store item count
	    $http.get('/api/store/count').success(function(response) {
	      $scope.totalShopItems = response.count;
	    });
    };

    // Find existing Message
    $scope.findOne = function () {
      $scope.preview = Store.get({
        itemId: $stateParams.itemId
      });
    };

    var getImageName = function () {
      console.log($scope.preview);
    };

    // Find existing item
    $scope.displayItem = function (item) {
	  	$scope.preview = item;
	  	$scope.hasItemFocus = true;
	  	$scope.quantity = 1;
    };

    $scope.currentPage = 1;
    $scope.maxSize = 5;

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
      		'price': $scope.item.price,
          'type': $scope.item.type,
          'displayedUserId': $scope.user._id
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
      $scope.uploader.clearQueue();

      // Clear upload buttons
      $scope.cancelUpload();
    };

    // Called after the user has failed to uploaded a new picture
    $scope.uploader.onErrorItem = function (fileItem, response, status, headers) {
      // Clear upload buttons
      $scope.cancelUpload();
      $scope.uploader.clearQueue();
      // Show error message
      $scope.error = response.message;
    };

    // Change user profile picture
    $scope.addImage = function () {
      // Clear messages
      $scope.success = $scope.error = null;

      // Start upload
      $scope.uploader.uploadAll();
    };

    // Cancel the upload process
    $scope.cancelUpload = function () {
      $scope.uploader.clearQueue();
    };
  }
]);