'use strict';

// Setting up route
angular.module('users.admin.routes').config(['$stateProvider',
  function ($stateProvider) {
    $stateProvider
      .state('admin.users', {
        url: '/users',
        templateUrl: 'modules/users/client/views/admin/list-users.client.view.html',
        controller: 'UserListController'
      })
      .state('admin.create', {
        url: '/create',
        templateUrl: 'modules/users/client/views/admin/admin-signup.client.view.html',
        controller: 'AdminAuthController'
      })
      .state('admin.backup', {
        url: '/backup',
        templateUrl: 'modules/users/client/views/admin/admin-backup.client.view.html',
        controller: 'BackUpController'
      });/*
      .state('admin.user', {
        url: '/users/:userId',
        templateUrl: 'modules/users/client/views/admin/view-user.client.view.html',
        controller: 'UserController',
        resolve: {
          userResolve: ['$stateParams', 'Admin', function ($stateParams, Admin) {
            return Admin.View.get({
              userId: $stateParams.userId
            });
          }]
        }
      })
      .state('admin.user-edit', {
        url: '/users/:userId/edit',
        templateUrl: 'modules/users/client/views/admin/edit-user.client.view.html',
        controller: 'UserController',
        resolve: {
          userResolve: ['$stateParams', 'Admin', function ($stateParams, Admin) {
            return Admin.View.get({
              userId: $stateParams.userId
            });
          }]
        }
      });*/
  }
]);
