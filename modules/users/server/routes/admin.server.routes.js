'use strict';

/**
 * Module dependencies.
 */
var adminPolicy = require('../policies/admin.server.policy'),
  admin = require('../controllers/admin.server.controller');

module.exports = function (app) {
  // User route registration first. Ref: #713
  require('./users.server.routes.js')(app);

  // Single user routes
  app.route('/api/users/:userId')
    .get(adminPolicy.isAllowed, admin.read)
    .put(adminPolicy.isAllowed, admin.update)
    .delete(adminPolicy.isAllowed, admin.delete);

  app.route('/api/admin/signup')
    .post(adminPolicy.isAllowed, admin.signup);

  app.route('/api/admin/isadmin')
    .get(adminPolicy.isAllowed, admin.read);

  app.route('/api/admin/backup')
    .get(adminPolicy.isAllowed, admin.backuplist)
    .post(adminPolicy.isAllowed, admin.createNewBackUp);

  app.route('/api/admin/download/:filename')
    .get(adminPolicy.isAllowed, admin.download);

  // This is a temporary route to load files. For testing purposes only!
  // app.route('/api/admin/loaddata')
  //  .get(adminPolicy.isAllowed, admin.loadCSV);

  // Finish by binding the user middleware
  app.param('userId', admin.userByID);
};
