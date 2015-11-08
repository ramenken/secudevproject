'use strict';

angular.module('users.admin').controller('CartAdminController', ['$scope', '$filter', '$http', 'Carts',
  function ($scope, $filter, $http, Carts) {
    Carts.query(function(data) {
      $scope.loadCarts();
      console.log(data);
      $scope.startDate = new Date();
      $scope.endDate = new Date();
      // Store item count
      $http.get('/api/admin/cart/count').success(function(response) {
        $scope.totalCarts = response.count;
      });
      $scope.isFilter = false;
    });

    $scope.isDisabled = false;
    $scope.isOpen = false;

    $scope.filterCarts = function() {
      $scope.dateRange = {
        startDate: $scope.startDate,
        endDate: $scope.endDate,
        pageNo: 1
      };
      $scope.isFilter = true;
      $scope.loadCarts();
    };

    $scope.toggleOpen = function () {
      if(!$scope.isOpen)
        $scope.isOpen = true;
      else
        $scope.isOpen = false;
    };

    $scope.status = {
      isFirstOpen: true,
      isFirstDisabled: false
    };

    $scope.currentPage = 1;
    $scope.maxSize = 5;

    $scope.setPage = function(value) {
      $scope.currentPage = value;
    };

    $scope.pageChanged = function() {
      $scope.loadCarts();
    };

    $scope.loadCarts = function() {
      if(!$scope.isFilter) {
        $http.get('/api/admin/cart/page/' + $scope.currentPage).success(function(response) {
          $scope.transactions = response;
        });
      } else {
        $scope.dateRange.pageNo = $scope.currentPage;
        $http.post('/api/admin/viewcarts', $scope.dateRange).success(function(response){
          $scope.transactions = response.carts;
          $scope.totalCarts = response.count;
        });
      }
    };
  }
]);
