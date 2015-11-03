'use strict';

angular.module('users.admin').controller('CartAdminController', ['$scope', '$filter', '$http', 'Carts',
  function ($scope, $filter, $http, Carts) {
    Carts.query(function(data) {
      $scope.transactions = data;
      console.log(data);
      $scope.startDate = new Date();
      $scope.endDate = new Date();
      $scope.buildPager();
    });

    $scope.isDisabled = false;
    $scope.isOpen = false;

    $scope.filterCarts = function() {
      var dateRange = {
        startDate: $scope.startDate,
        endDate: $scope.endDate
      };
      $http.post('/api/admin/viewcarts', dateRange).success(function(response){
        $scope.transactions = response;
      });
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

    $scope.buildPager = function () {
      $scope.pagedItems = [];
      $scope.itemsPerPage = 15;
      $scope.currentPage = 1;
      $scope.figureOutItemsToDisplay();
    };

    $scope.figureOutItemsToDisplay = function () {
      $scope.filteredItems = $filter('filter')($scope.transactions, {
        $: $scope.search
      });
      $scope.filterLength = $scope.filteredItems.length;
      var begin = (($scope.currentPage - 1) * $scope.itemsPerPage);
      var end = begin + $scope.itemsPerPage;
      $scope.pagedItems = $scope.filteredItems.slice(begin, end);
    };

    $scope.pageChanged = function () {
      $scope.figureOutItemsToDisplay();
    };
  }
]);
