'use strict';

/**
 * Module dependencies.
 */
var storePolicy = require('../policies/store.server.policy'),
  store = require('../controllers/store.server.controller');

module.exports = function (app) {
  app.route('/api/store/additem').all(storePolicy.isAllowed)
    .post(store.create);

  // Batch routes
  app.route('/api/store/items').all(storePolicy.isAllowed)
    .get(store.list);

  app.route('/ipn_handler')
    .post(store.ipnHandler);

  app.route('/api/store/getpacks').all(storePolicy.isAllowed)
    .get(store.getPacks);

  app.route('/api/store/page/:pageNo').get(store.limitedList);
  app.route('/api/store/count').get(store.getCount);

  // Single item routes
  app.route('/api/store/item/:itemId').all(storePolicy.isAllowed)
    .get(store.read)
    .put(store.update)
    .delete(store.delete);

  app.route('/api/store/updatepicture').all(storePolicy.isAllowed)
    .post(store.updateItemPicture);

  app.route('/api/cart/newcart').all(storePolicy.isAllowed)
    .get(store.isCartExists);

  app.route('/api/cart').all(storePolicy.isAllowed)
    .get(store.viewCart)
    .post(store.addToCart);

  app.route('/api/cart/countitems').all(storePolicy.isAllowed)
    .get(store.countCartItems);

  app.route('/api/cart/deleteitem').all(storePolicy.isAllowed)
    .post(store.deleteCartItem);

  app.route('/api/cart/updateitem').all(storePolicy.isAllowed)
    .post(store.updateCartItem);

  app.route('/api/cart/checkout').all(storePolicy.isAllowed)
    .post(store.checkout);

  app.route('/api/cart/confirmcheckout').all(storePolicy.isAllowed)
    .post(store.confirmCheckout);

  app.route('/api/cart/cancelcheckout').all(storePolicy.isAllowed)
    .post(store.cancelCheckout);

  // Finish by binding the item middleware
  app.param('itemId', store.itemByID);
};
