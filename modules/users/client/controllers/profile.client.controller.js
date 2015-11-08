'use strict';

angular.module('users').controller('ProfileController', ['$scope', '$stateParams', '$location', '$http', 'Authentication', 'Profile',
  function ($scope, $stateParams, $location, $http, Authentication, Profile) {
    $scope.authentication = Authentication;

    $scope.findOne = function () {
	    if($stateParams.userId.length >= 12) {
	        $scope.profile = Profile.get({	
	           userId: $stateParams.userId
	        });
	   		$http.post('/api/profile/badges/' + $stateParams.userId).success(function(response){
	   			$scope.profileInfo = response;
	   		});
	   	} else {
	   		$scope.profile = Profile.get({	
	           userId: $scope.authentication.user._id
	        });
	   		$http.post('/api/profile/badges/' + $scope.authentication.user._id).success(function(response){
	   			$scope.profileInfo = response;
	   		});
	        $location.path('profile/');
	   	}
    };
  }
]);
