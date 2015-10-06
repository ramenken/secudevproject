'use strict';

angular.module('users').controller('ProfileController', ['$scope', '$stateParams', '$location', '$http', 'Authentication', 'Profile',
  function ($scope, $stateParams, $location, $http, Authentication, Profile) {
    $scope.authentication = Authentication;

    $scope.findOne = function () {
      $scope.profile = Profile.get({
        userId: $stateParams.userId
      });
    };
  }
]);
