'use strict';

/**
 * Module dependencies.
 */
var messagesPolicy = require('../policies/messages.server.policy'),
  messages = require('../controllers/messages.server.controller');

module.exports = function (app) {
  // messages collection routes
  app.route('/api/messages').all(messagesPolicy.isAllowed)
    .get(messages.list)
    .post(messages.create);

  app.route('/api/messages/page/:pageNo').get(messages.limitedList);
  app.route('/api/messages/count').get(messages.getCount);
  app.route('/api/messages/user').get(messages.getUser);

  app.route('/api/messages/basicsearch/:keyword').all(messagesPolicy.isAllowed)
    .get(messages.basicsearch);
    
  app.route('/api/messages/advancedsearch/:fields').all(messagesPolicy.isAllowed)
    .get(messages.advancedsearch);

  // Single message routes
  app.route('/api/messages/:messageId').all(messagesPolicy.isAllowed)
    .get(messages.read)
    .put(messages.update)
    .delete(messages.delete);

  // Finish by binding the message middleware
  app.param('messageId', messages.messageByID);
};
