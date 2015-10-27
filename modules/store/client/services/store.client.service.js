'use strict';

//Item service used for communicating with the store REST endpoints
angular.module('store').factory('Store', ['$resource',
  function ($resource) {
    return $resource('api/store/item/:itemId', {
      itemId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
]);

angular.module('cart').factory('CartItem', ['$resource',
  function ($resource) {
    return $resource('api/store/cart/:itemId', {
      itemId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
]);
