'use strict';

/**
 * Module dependencies.
 */
var storePolicy = require('../policies/store.server.policy'),
  store = require('../controllers/store.server.controller');

module.exports = function (app) {
  app.route('/api/store/additem').all(storePolicy.isAllowed)
    .post(store.create);

  app.route('/api/store/cart/newcart').all(storePolicy.isAllowed)
    .get(store.isCartExists)
    .post(store.resetCart);

  app.route('/api/store/page/:pageNo').get(store.limitedList);
  app.route('/api/store/count').get(store.getCount);

  app.route('/api/store/cart/checkout').all(storePolicy.isAllowed)
    .get(store.checkout);

  app.route('/api/store/cart/confirmcheckout').all(storePolicy.isAllowed)
    .post(store.confirmCheckout);

  app.route('/api/store/cart').all(storePolicy.isAllowed)
    .get(store.viewCart)
    .post(store.addToCart);

  // Single item routes
  app.route('/api/store/item/:itemId').all(storePolicy.isAllowed)
    .get(store.read)
    .put(store.update)
    .delete(store.delete);

  // Finish by binding the item middleware
  app.param('itemId', store.itemByID);
};
