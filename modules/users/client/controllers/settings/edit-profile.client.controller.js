'use strict';

angular.module('users').controller('EditProfileController', ['$scope', '$http', '$location', 'Users', 'Authentication', '$window',
  function ($scope, $http, $location, Users, Authentication, $window) {
    $scope.user = Authentication.user;

    var flag = true;

    // Get an eventual error defined in the URL query string:
    $scope.error = $location.search().err;

    var maleItems = ['Mr','Sir','Senior','Count'];
    var femaleItems = ['Miss','Ms','Mrs','Madame','Majesty','Seniora'];

    $scope.gender = {};
    $scope.gender.names = [{'name': 'Male'  , 'value': 'male'},
      		     	           {'name': 'Female', 'value': 'female'}];
    $scope.gender.salutations = maleItems;

 	  // Setting first option as selected in gender names and salutations
 	  $scope.gender.name = $scope.user.gender;
    $scope.gender.salutation = $scope.user.salutation;

    $scope.user.birthDate = new Date($scope.user.birthDate);

     // Update salutation combobox if gender.name scope variable changed
    $scope.$watch('gender.name', function (gender) {
      if(gender.toLowerCase() === 'male') {
        $scope.gender.salutations = maleItems;
      } else if(gender.toLowerCase() === 'female') {
        $scope.gender.salutations = femaleItems;
      }
      if(!flag) {
        $scope.gender.salutation = $scope.gender.salutations[0];
      } else {
        flag = false;
      }
    });

    // Update a user profile
    $scope.updateUserProfile = function (isValid) {
      $scope.success = $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'userForm');
        return false;
      }

      $scope.user.gender = $scope.gender.name;
      $scope.user.salutation = $scope.gender.salutation;

      var user = new Users($scope.user);
      user.birthDate = new Date($scope.user.birthDate);

      user.displayedUser = $scope.user;

      user.$update(function (response) {
        $scope.$broadcast('show-errors-reset', 'userForm');

        $scope.success = true;
        //Authentication.user = response;
      }, function (response) {
        $scope.error = response.data.message;
        //$window.location.reload();
      });
    };
  }
]);
