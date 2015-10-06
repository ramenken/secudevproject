'use strict';

//Messages service used for communicating with the messages REST endpoints
angular.module('messages').factory('Messages', ['$resource',
  function ($resource) {
    return $resource('api/messages/:messageId', {
      messageId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
]);
