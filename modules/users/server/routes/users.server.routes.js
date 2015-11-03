'use strict';

module.exports = function (app) {
  // User Routes
  var users = require('../controllers/users.server.controller');
  var profilesPolicy = require('../policies/profiles.server.policy.js');

  // Users collection routes
  app.route('/api/users')
    .get(users.list);

  // Setting up the users profile api
  app.route('/api/users/me').get(users.me);
  app.route('/api/users').put(users.update);
  app.route('/api/users/accounts').delete(users.removeOAuthProvider);
  app.route('/api/users/password').post(users.changePassword);
  app.route('/api/users/picture').post(users.changeProfilePicture);

  app.route('/api/profile/:userId').get(profilesPolicy.isAllowed, users.read);

  app.route('/api/profile/badges/:userId').post(profilesPolicy.isAllowed, users.updateBadges);

  // Finish by binding the user middleware
  app.param('userId', users.userByID);
};
