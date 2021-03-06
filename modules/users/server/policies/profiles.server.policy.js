'use strict';

/**
 * Module dependencies.
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke Users Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: ['admin'],
    allows: [{
      resources: '/api/profile',
      permissions: '*'
    }, {
      resources: '/api/profile/:userId',
      permissions: '*'
    }, {
      resources: '/api/profile/badges/:userId',
      permissions: '*'
    }, {
      resources: '/api/users',
      permissions: '*'
    }]
  }, {
    roles: ['user'],
    allows: [{
      resources: '/api/profile',
      permissions: ['get']
    }, {
      resources: '/api/profile/:userId',
      permissions: ['get']
    }, {
      resources: '/api/profile/badges/:userId',
      permissions: ['post']
    }, {
      resources: '/api/users',
      permissions: ['get']
    }]
  }, {
    roles: ['guest'],
    allows: [{
      resources: '/api/profile',
      permissions: []
    }, {
      resources: '/api/profile/:userId',
      permissions: []
    }]
  }]);
};

/**
 * Check If User Policy Allows
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
