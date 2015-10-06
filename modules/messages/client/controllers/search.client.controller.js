'use strict';

// Messages controller
angular.module('messages').controller('SearchController', ['$scope', '$stateParams', '$filter', '$http', 'Authentication', 'Messages', '$window',
  function ($scope, $stateParams, $filter, $http, Authentication, Messages, $window) {
    $scope.user = Authentication.user;

    $scope.isCollapsed = true;
    $scope.status = {
      isAdvanced: true,
      isopen: false
    };

    $scope.buildPager = function () {
      $scope.pagedItems = [];
      $scope.itemsPerPage = 5;
      $scope.currentPage = 1;
      $scope.figureOutItemsToDisplay();
    };

    $scope.figureOutItemsToDisplay = function () {
      $scope.filterLength = $scope.filteredItems.length;
      var begin = (($scope.currentPage - 1) * $scope.itemsPerPage);
      var end = begin + $scope.itemsPerPage;
      $scope.pagedItems = $scope.filteredItems.slice(begin, end);
    };

    $scope.pageChanged = function () {
      $scope.figureOutItemsToDisplay();
    };

    $scope.searchPosts = function() {
      console.log($scope.status.isAdvanced);
      if(!$scope.status.isAdvanced) {
        console.log('Basic Search');
        if($scope.fields.keyword)
          $http.get('/api/messages/basicsearch/' + $scope.fields.keyword).success(function(response){
            $scope.messages = response;
          });
      } else {
        console.log('Advanced Search');
        $http.get('/api/messages/advancedsearch/' + JSON.stringify($scope.fields)).success(function(response){
          $scope.messages = response;
        });
      }
    };

    $scope.items = [{value: 'Username', text: 'Search by Username'},
                    {value: 'Date', text: 'Search by Date'},
                    {value: 'Name', text: 'Search by Name'}];

    $scope.date_items = [{value: '=', text: 'Equals to'},
                         {value: '>=', text: 'Greather than or equal to'},
                         {value: '<=', text: 'Less than or equal to'},
                         {value: 'between', text: 'To'}];

    $scope.date = {date: '', range: '', type: 1};
    $scope.post = {username: '', firstName: '', type: 1};
    $scope.fields = {keyword: '',
                     additionalFields: [{name: 'Date',
                                         values: {date_start: new Date(), date_end: new Date(), range: '=', type: 1},
                                         template: 'field-date.html'}
                                        /*{name: 'Username',
                                         values: {name: '', type: 1},
                                         template: 'field-text.html'}*/]
                    };

    $scope.check = function() {
    };

    $scope.addField = function(option) {
      var filter = {name: '',
                    values: null,
                    template: ''};

      filter.name = option;
      if(option === 'Username' || option === 'Name') {
        filter.values = {name: '', type: 1};
        filter.template = 'field-text.html';
      } else if(option === 'Date') {
        filter.values = {date_start: new Date(), date_end: new Date(), range: '=', type: 1};
        filter.template = 'field-date.html';
      }

      if(filter.values)
        $scope.fields.additionalFields.push(filter);
    };

    $scope.removeField = function(index) {
      $scope.fields.additionalFields.splice(index, 1);
    };

  }
]);
