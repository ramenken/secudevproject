'use strict';

// Configuring the Store module
angular.module('store').run(['Menus',
  function (Menus) {
    // Add the donate item
    Menus.addMenuItem('topbar', {
      title: 'Donate',
      state: 'donate',
      roles: ['user','admin']
    });

    // Add the stores dropdown item
    Menus.addMenuItem('topbar', {
      title: 'Store',
      state: 'store',
      type: 'dropdown',
      roles: ['user','admin']
    });

    // Add the dropdown list item
    Menus.addSubMenuItem('topbar', 'store', {
      title: 'View Cart',
      state: 'store.cart',
      roles: ['user','admin']
    });
    Menus.addSubMenuItem('topbar', 'store', {
      title: 'Add Item',
      state: 'store.add',
      roles: ['admin']
    });
    Menus.addSubMenuItem('topbar', 'store', {
      title: 'Purchase Items',
      state: 'store.list',
      roles: ['user','admin']
    });
  }
]);
