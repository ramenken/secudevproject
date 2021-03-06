'use strict';

/**
 * Module dependencies.
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke Messages Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: ['admin'],
    allows: [{
      resources: '/api/messages',
      permissions: '*'
    }, {
      resources: '/api/messages/:messageId',
      permissions: '*'
    }, {
      resources: '/api/messages/basicsearch/:keyword',
      permissions: ['get']
    }, {
      resources: '/api/messages/advancedsearch/:fields',
      permissions: ['get']
    }]
  }, {
    roles: ['user'],
    allows: [{
      resources: '/api/messages',
      permissions: ['get', 'post', 'put', 'delete']
    }, {
      resources: '/api/messages/:messageId',
      permissions: ['get', 'put', 'delete']
    }, {
      resources: '/api/messages/basicsearch/:keyword',
      permissions: ['get']
    }, {
      resources: '/api/messages/advancedsearch/:fields',
      permissions: ['get']
    }]
  }, {
    roles: ['guest'],
    allows: [{
      resources: '/api/messages',
      permissions: []
    }, {
      resources: '/api/messages/:messageId',
      permissions: []
    }]
  }]);
};

/**
 * Check If Messages Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : ['guest'];

  // If an message is being processed and the current user created it then allow any manipulation
  if (req.message && req.user && req.message.user.id === req.user.id) {
    return next();
  }

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
