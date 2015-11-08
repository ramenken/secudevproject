'use strict';

// Configuring the Articles module
angular.module('users').run(['Menus',
  function (Menus) {
    Menus.addMenuItem('topbar', {
      title: 'Users',
      state: 'users',
      roles: ['user', 'admin']
    });
  }
]);
