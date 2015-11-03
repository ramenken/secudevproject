'use strict';

angular.module('users.admin').controller('AdminAuthController', ['$scope', '$state', '$http', '$location', '$window', 'Authentication', 'Admin',
  function ($scope, $state, $http, $location, $window, Authentication, Admin) {
    Admin.Check.query();
    $scope.authentication = Authentication;

    // Get an eventual error defined in the URL query string:
    $scope.error = $location.search().err;

    var maleItems = ['Mr','Sir','Senior','Count'];
    var femaleItems = ['Miss','Ms','Mrs','Madame','Majesty','Seniora'];

    $scope.gender = {};
      	  $scope.gender.names = [{'name': 'Male'  , 'value': 'male'},
      		     	                 {'name': 'Female', 'value': 'female'}];

    $scope.gender.salutations = maleItems;

    $scope.access = {};
    $scope.access.levels = [{'name': 'User'  , 'value': 'user'},
                           {'name': 'Admin', 'value': 'admin'}];

	  // Setting first option as selected in gender names and salutations
	  $scope.gender.name = $scope.gender.names[0].value;
    $scope.gender.salutation = $scope.gender.salutations[0];
    $scope.access.level = $scope.access.levels[0].value;

    // Update salutation combobox if gender.name scope variable changed
    $scope.$watch('gender.name', function (gender) {
      if(gender.toLowerCase() === 'male') {
        $scope.gender.salutations = maleItems;
      } else if(gender.toLowerCase() === 'female') {
        $scope.gender.salutations = femaleItems;
      }
      $scope.gender.salutation = $scope.gender.salutations[0];
    });

    var roles;
    $scope.$watch('access.level', function(access) {
      if($scope.access.level.toString() === 'admin') {
        roles = ['user', 'admin'];
      } else if($scope.access.level.toString() === 'user') {
        roles = ['user'];
      }
    });

    $scope.signup = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'userForm');
        return false;
      }

      $scope.credentials.gender = $scope.gender.name;
      $scope.credentials.salutation = $scope.gender.salutation;
      $scope.credentials.roles = roles;

      $http.post('/api/admin/signup', $scope.credentials).success(function (response) {
        // And redirect to the previous or home page
        //$state.go($state.previous.state.name || 'home', $state.previous.params);
        $state.go('users');
      }).error(function (response) {
        $scope.error = response.message;
        if($scope.error.indexOf('authorized') >= 0)
          $window.location.reload();
      });
    };
  }
]);
