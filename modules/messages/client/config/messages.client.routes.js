'use strict';

// Setting up route
angular.module('messages').config(['$stateProvider',
  function ($stateProvider) {
    // Messages state routing
    $stateProvider
      .state('messages', {
        abstract: true,
        url: '/messages',
        template: '<ui-view/>'
      })
      .state('messages.list', {
        url: '/',
        templateUrl: 'modules/messages/client/views/messages.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      })
      .state('messages.view', {
        url: '/:messageId',
        templateUrl: 'modules/messages/client/views/view-message.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      })
      .state('messages.edit', {
        url: '/:messageId/edit',
        templateUrl: 'modules/messages/client/views/edit-message.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      })
      .state('search', {
        url: '/search',
        templateUrl: 'modules/messages/client/views/search-message.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      })
      .state('share', {
        url: '/share/:itemId',
        templateUrl: 'modules/messages/client/views/share-item.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      });
  }
]);
