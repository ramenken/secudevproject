'use strict';

angular.module('users').controller('AuthenticationController', ['$scope', '$state', '$http', '$location', '$window', 'Authentication',
  function ($scope, $state, $http, $location, $window, Authentication) {
    $scope.authentication = Authentication;

    // Get an eventual error defined in the URL query string:
    $scope.error = $location.search().err;

    // If user is signed in then redirect back home
    if ($scope.authentication.user) {
      $location.path('/messages/');
    }

    var maleItems = ['Mr','Sir','Senior','Count'];
    var femaleItems = ['Miss','Ms','Mrs','Madame','Majesty','Seniora'];

    $scope.gender = {};
      	  $scope.gender.names = [{'name': 'Male'  , 'value': 'male'},
      		     	                 {'name': 'Female', 'value': 'female'}];

    $scope.gender.salutations = maleItems;

	  // Setting first option as selected in gender names and salutations
	  $scope.gender.name = $scope.gender.names[0].value;
    $scope.gender.salutation = $scope.gender.salutations[0];

    // Update salutation combobox if gender.name scope variable changed
    $scope.$watch('gender.name', function (gender) {
      if(gender.toLowerCase() === 'male') {
        $scope.gender.salutations = maleItems;
      } else if(gender.toLowerCase() === 'female') {
        $scope.gender.salutations = femaleItems;
      }
      $scope.gender.salutation = $scope.gender.salutations[0];
    });

    $scope.signup = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'userForm');
        return false;
      }

      $scope.credentials.gender = $scope.gender.name;
      $scope.credentials.salutation = $scope.gender.salutation;

      $http.post('/api/auth/signup', $scope.credentials).success(function (response) {
        // If successful we assign the response to the global user model
        $scope.authentication.user = response;

        // And redirect to the previous or home page
        //$state.go($state.previous.state.name || 'home', $state.previous.params);
        console.log('redirected!');
        $location.path('/');
        //$state.go('messages.list');
      }).error(function (response) {
        $scope.error = response.message;
      });
    };

    $scope.signin = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'userForm');

        return false;
      }

      $http.post('/api/auth/signin', $scope.credentials).success(function (response) {
        // If successful we assign the response to the global user model
        $scope.authentication.user = response;

        // And redirect to the previous or home page
        //$state.go($state.previous.state.name || 'messages.list', $state.previous.params);
        $state.go('messages.list');
      }).error(function (response) {
        $scope.error = response.message;
      });
    };

    // OAuth provider request
    $scope.callOauthProvider = function (url) {
      if ($state.previous && $state.previous.href) {
        url += '?redirect_to=' + encodeURIComponent($state.previous.href);
      }

      // Effectively call OAuth authentication route:
      $window.location.href = url;
    };
  }
]);

angular.module('users').controller('DatePickerController', ['$scope',
	function($scope, $http, $location) {
    $scope.today = function() {
      $scope.dt = new Date();
    };
    $scope.today();

    $scope.clear = function () {
      $scope.dt = null;
    };

    $scope.toggleMin = function() {
      $scope.minDate = $scope.minDate ? null : new Date();
    };
    $scope.toggleMin();

    $scope.open = function($event) {
      $scope.status.opened = true;
    };

    $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'MM/dd/yyyy', 'shortDate'];
    $scope.format = $scope.formats[2];

    $scope.status = {
      opened: false
    };

    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    var afterTomorrow = new Date();
    afterTomorrow.setDate(tomorrow.getDate() + 2);
    $scope.events =
      [
        {
          date: tomorrow,
          status: 'full'
        },
        {
          date: afterTomorrow,
          status: 'partially'
        }
      ];

    $scope.getDayClass = function(date, mode) {
      if (mode === 'day') {
        var dayToCheck = new Date(date).setHours(0,0,0,0);

        for (var i=0;i<$scope.events.length;i++){
          var currentDay = new Date($scope.events[i].date).setHours(0,0,0,0);

          if (dayToCheck === currentDay) {
            return $scope.events[i].status;
          }
        }
      }

      return '';
    };
	}
]);
