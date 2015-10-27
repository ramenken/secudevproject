'use strict';

// Configuring the Articles module
angular.module('users').run(['Menus',
  function (Menus) {
    Menus.addMenuItem('topbar', {
      title: 'Profile',
      state: 'profile',
      type: 'dropdown',
      roles: ['user','admin']
    });
    /*
    Menus.addSubMenuItem('topbar', 'profile', {
      title: 'View Profile',
      state: 'profile.view'
    });*/
    Menus.addSubMenuItem('topbar', 'profile', {
      title: 'Users Page',
      state: 'users'
    });
  }
]);
