'use strict';

// Store controller
angular.module('store').controller('EditItemController', ['$scope', '$stateParams', '$rootScope', '$location', '$http', 'Users', 'Authentication', 'FileUploader', 'Store', '$timeout', '$state', '$window',
  function ($scope, $stateParams, $rootScope, $location, $http, Users, Authentication, FileUploader, Store, $timeout, $state, $window) {
  	$scope.user = Authentication.user;
 
    // Create file uploader instance
    $scope.findItem = function() {
      // Find existing Message
      $scope.item = Store.get({
        itemId: $stateParams.itemId
      });

      $scope.item.$promise.then(function(data) {
        $scope.imageURL = $scope.item.itemImageURL;
      });
    };

    $scope.uploader = new FileUploader({
      url: '/api/store/updatepicture'
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
          'itemId': $scope.item._id,
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


    $scope.updateImage = function () {
      // Clear messages
      $scope.success = $scope.error = null;

      // Start upload
      $scope.uploader.uploadAll();
    };

    $scope.updateItem = function() {
      $scope.error = null;

      var item = $scope.item;
      item.displayedUserId = $scope.user._id;

      item.$update(function () {
        $location.path('store/item/' + item._id);
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Cancel the upload process
    $scope.cancelUpload = function () {
      $scope.uploader.clearQueue();
      $scope.imageURL = $scope.item.itemImageURL;
    };
  }
]);