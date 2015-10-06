'use strict';

// Users service used for communicating with the users REST endpoint
angular.module('users').factory('Users', ['$resource',
  function ($resource) {
    return $resource('api/users', {}, {
      update: {
        method: 'PUT'
      }
    });
  }
]);

angular.module('users').factory('Profile', ['$resource',
  function ($resource) {
    return $resource('api/profile/:userId', {
      userId: '@_id'
    });
  }
]);

//TODO this should be Users service
angular.module('users.admin').factory('Admin', ['$resource',
  function ($resource) {
    return {
      Check: $resource('api/admin/isadmin'),
      View: $resource('api/users/:userId', {
        userId: '@_id'
      }, {
        update: {
          method: 'PUT'
        }
      })
    };
  }
]);

angular.module('users.admin').factory('Backup', ['$resource',
  function ($resource) {
    return $resource('api/admin/backup');
  }
]);