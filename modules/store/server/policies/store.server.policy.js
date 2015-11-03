'use strict';

/**
 * Module dependencies.
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke Store Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: ['admin'],
    allows: [{
      resources: '/api/store/item',
      permissions: '*'
    }, {
      resources: '/api/store/item/:itemId',
      permissions: '*'
    }, {
      resources: '/api/store/additem',
      permissions: '*'
    }, {
      resources: '/api/store/getpacks',
      permissions: '*'
    }, {
      resources: '/api/store/updatepicture',
      permissions: '*'
    }]
  }, {
    roles: ['user'],
    allows: [{
      resources: '/api/store/items',
      permissions: ['get']
    }, {
      resources: '/api/store/item',
      permissions: ['get']
    }, {
      resources: '/api/store/getpacks',
      permissions: ['get']
    }, {
      resources: '/api/store/item/:itemId',
      permissions: ['get']
    }, {
      resources: '/api/cart/newcart',
      permissions: ['get', 'post']
    }, {
      resources: '/api/cart/checkout',
      permissions: ['post']
    }, {
      resources: '/api/cart/confirmcheckout',
      permissions: ['post']
    }, {
      resources: '/api/cart/cancelcheckout',
      permissions: ['post']
    }, {
      resources: '/api/cart',
      permissions: ['get', 'post']
    }, {
      resources: '/api/cart/countitems',
      permissions: ['get']
    }, {
      resources: '/api/cart/deleteitem',
      permissions: ['post']
    }, {
      resources: '/api/cart/updateitem',
      permissions: ['post']
    }, {
      resources: '/api/cart/updatequantity',
      permissions: ['post']
    }]
  }]);
};

/**
 * Check If Store Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : ['guest'];

  // Check for user roles
  acl.areAnyRolesAllowed(roles, req.route.path, req.method.toLowerCase(), function (err, isAllowed) {
    if (err) {
      // An authorization error occurred.
      return res.status(500).send('Unexpected authorization error');
    } else {
      if (isAllowed) {
        // Access granted! Invoke next middleware
        return next();
      } else {
        return res.status(403).json({
          message: 'User is not authorized'
        });
      }
    }
  });
};
