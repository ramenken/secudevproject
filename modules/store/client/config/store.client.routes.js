'use strict';

// Setting up route
angular.module('store').config(['$stateProvider',
  function ($stateProvider) {
    // Articles state routing
    $stateProvider
      .state('donate', {
        url: '/donate',
        templateUrl: 'modules/store/client/views/donate.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      })
      .state('store', {
        abstract: true,
        url: '/store',
        template: '<ui-view/>'
      })
      .state('store.view', {
        url: '/item/:itemId',
        templateUrl: 'modules/store/client/views/view-item.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      })
      .state('store.edit', {
        url: '/item/edit/:itemId',
        templateUrl: 'modules/store/client/views/edit-item.client.view.html',
        data: {
          roles: ['admin']
        }
      })
      .state('store.list', {
        url: '',
        templateUrl: 'modules/store/client/views/view-store.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      })
      .state('store.add', {
        url: '/newitem',
        templateUrl: 'modules/store/client/views/create-item.client.view.html',
        data: {
          roles: ['admin']
        }
      })
      .state('store.cart', {
        url: '/cart',
        templateUrl: 'modules/store/client/views/view-cart.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      })
      .state('confirm', {
        url: '/checkout/confirm',
        templateUrl: 'modules/store/client/views/confirm-cart.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      })
      .state('cancel', {
        url: '/checkout/cancel',
        templateUrl: 'modules/store/client/views/cancel-cart.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      });
  }
]);
