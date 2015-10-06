'use strict';

angular.module('users.admin').controller('BackUpController', ['$scope', '$http', '$state', '$window', 'Authentication', 'Backup',
  function ($scope, $http, $state, $window, Authentication, Backup) {
    Backup.query(function(data){
    	$scope.backups = data;
    });

    $scope.authentication = Authentication;

    $scope.createBackup = function() {
    	$http.post('/api/admin/backup').success(function(data){
            $window.location.reload();
    	});
    };

    $scope.findBackups = function() {
        Backup.query(function(data){
            $scope.backups = data;
        });
    };

    $scope.downloadFile = function(file) {
    	console.log('Downloading file ' + file.name);
    	$http.get('/api/admin/download/' + file.name).success(function(data){
    		var element = angular.element('<a/>');
            element.attr({
                href: 'data:application/csv,' + encodeURIComponent(data),
                target: '_blank',
                download: file.name
            })[0].click();
    	});
    };
  }
]);
