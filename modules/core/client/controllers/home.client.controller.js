'use strict';

angular.module('core').controller('HomeController', ['$scope', '$state', 'Authentication',
  function ($scope, $state, Authentication) {
    // This provides Authentication context.
    $scope.authentication = Authentication;

    if($scope.authentication.user) {
      $state.go('messages.list');
    } else {
      $state.go('signin');
    }
  }
]);
