'use strict';

// Configuring the Messages module
angular.module('messages').run(['Menus',
  function (Menus) {
    // Add the messages dropdown item
    Menus.addMenuItem('topbar', {
      title: 'Messages',
      state: 'messages.list',
      roles: ['user', 'admin']
    });
    Menus.addMenuItem('topbar', {
      title: 'Search',
      state: 'search',
      roles: ['user', 'admin']
    });
  }
]);