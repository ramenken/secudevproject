'use strict';

// Messages controller
angular.module('messages').controller('MessagesController', ['$scope', '$stateParams', '$rootScope', '$location', '$http', 'Users', 'Authentication', 'Messages', '$window',
  function ($scope, $stateParams, $rootScope, $location, $http, Users, Authentication, Messages, $window) {
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
        $scope.messages = $scope.loadMessages();
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
      $scope.currentUser = $scope.getUser();
      $scope.loadMessages();
    };

    $scope.getUser = function() {
      $http.get('/api/messages/user').success(function(response) {
        $scope.currentUser = response;
      });
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
  }
]);
