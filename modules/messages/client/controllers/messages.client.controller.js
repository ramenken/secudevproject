'use strict';

// Messages controller
angular.module('messages').controller('MessagesController', ['$scope', '$stateParams', '$rootScope', '$location', '$http', 'Users', 'Authentication', 'Store', 'Messages', '$window',
  function ($scope, $stateParams, $rootScope, $location, $http, Users, Authentication, Store, Messages, $window) {
    $scope.authentication = Authentication;

    $scope.imagePopover = {
      imageUrl: '',
      templateUrl: 'imagePopoverTemplate.html',
      opened: false
    };

    $scope.stylePopover = {
      templateUrl: 'stylePopoverTemplate.html',
      opened: false
    };

    $scope.addUrl = function() {
      $rootScope.$broadcast('addStyle', $scope.imagePopover.imageUrl);
      $scope.imagePopover.imageUrl = '';
      $scope.imagePopover.opened = 'false';
    };

    $scope.addStyle = function(value) {
      $rootScope.$broadcast('addStyle', value);
      $scope.stylePopover.opened = 'false';
    };

    // Create new Message
    $scope.create = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'messageForm');

        return false;
      }

      // Create new Message object
      var message = new Messages({
        content: this.content
      });

      // Pass the current user to prevent exploits
      message.displayedUser = $scope.authentication.user;

      // Don't Redirect after save
      message.$save(function (response) {
        // Clear form fields
        $scope.content = '';
        $scope.messages.splice($scope.messages.length-1,1);
        $scope.messages.splice(0,0, response);
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
        //$window.location.reload();
      });
    };

    // Create new Message
    $scope.share = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'messageForm');

        return false;
      }

      // Create new Message object
      var message = new Messages({
        content: this.content,
        attachments: $scope.attachedItems
      });

      // Pass the current user to prevent exploits
      message.displayedUser = $scope.authentication.user;

      // Don't Redirect after save
      message.$save(function (response) {
        // Clear form fields
        $scope.content = '';
        $location.path('store');
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
        //$window.location.reload();
      });
    };

    // Remove existing Message
    $scope.remove = function (message) {
      if (message) {
        message.$remove(function(){
          $location.path('messages/');
        });

        for (var i in $scope.messages) {
          if ($scope.messages[i] === message) {
            $scope.messages.splice(i, 1);
          }
        }
      } else {
        $scope.message.$remove(function () {
          $location.path('messages/');
        }, function (errorResponse) {
          $scope.error = errorResponse.data.message;
        });
      }
    };

    // Update existing Message
    $scope.update = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'messageForm');

        return false;
      }

      var message = $scope.message;

      message.$update(function () {
        $location.path('messages/' + message._id);
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Find a list of Messages
    $scope.find = function () {
      $scope.loadMessages();
    };

    // Find existing Message
    $scope.findOne = function () {
      $scope.message = Messages.get({
        messageId: $stateParams.messageId
      });
    };

    $scope.currentPage = 1;
    $scope.maxSize = 5;

    $http.get('/api/messages/count').success(function(response) {
      $scope.totalItems = response.count;
    });

    $scope.setPage = function(value) {
    	$scope.currentPage = value;
    };

    $scope.pageChanged = function() {
    	$scope.loadMessages();
    };

    $scope.loadMessages = function() {
    	$http.get('/api/messages/page/' + $scope.currentPage).success(function(response) {
    		$scope.messages = response;
    	});
    };

    $scope.findItems = function() {
      $http.get('/api/store/items').success(function(response) {
        $scope.items = response;
        $scope.selectedItem = $scope.items[0]._id;
      });
    };

    $scope.removeItem = function (data) {
      for (var i in $scope.items) {
        if ($scope.items[i]._id === data._id) {
          $scope.items.splice(i, 1);
          if($scope.items.length >= 1)
            $scope.selectedItem = $scope.items[0]._id;
        }
      }
    };

    // Find existing Message
    $scope.findInit = function () {
      $scope.findItems();
      $scope.preview = Store.get({
        itemId: $stateParams.itemId
      });
      $scope.attachedItems = [];

      $scope.preview.$promise.then(function(data){
        $scope.attachedItems.push(data);
        $scope.removeItem(data);
      });
    };

    $scope.attachItem = function () {
      for(var j in $scope.items) {
        if($scope.items[j]._id === $scope.selectedItem) {
          $scope.attachedItems.push($scope.items[j]);
          $scope.removeItem($scope.items[j]);
          $scope.selectedItem = $scope.items[0]._id;
        }
      }
    };
  }
]);
