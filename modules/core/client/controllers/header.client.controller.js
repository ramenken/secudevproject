'use strict';

angular.module('core').controller('HeaderController', ['$scope', '$state', '$http', '$window', 'Authentication', 'Menus',
  function ($scope, $state, $http, $window, Authentication, Menus) {
    // Expose view variables
    $scope.$state = $state;
    $scope.authentication = Authentication;
    
    // Get the topbar menu
    $scope.menu = Menus.getMenu('topbar');

    // Toggle the menu items
    $scope.isCollapsed = false;
    $scope.toggleCollapsibleMenu = function () {
      $scope.isCollapsed = !$scope.isCollapsed;
    };

    // Collapsing the menu after navigation
    $scope.$on('$stateChangeSuccess', function () {
      $scope.isCollapsed = false;
    });

    $scope.signout = function () {
      $http.post('/api/auth/signout').success(function(){
        $window.location.reload();
      });
    };
  }
]);
