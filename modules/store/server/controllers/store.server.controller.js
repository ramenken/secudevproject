'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  fs = require('fs'),
  mongoose = require('mongoose'),
  Item = mongoose.model('Item'),
  Cart = mongoose.model('Cart'),
  paypal = require('paypal-rest-sdk'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));


var verifyUser = function(user1, user2) {

  var tempId = JSON.stringify(user1).replace(/\"/g, "");
  var authId = JSON.stringify(user2).replace(/\"/g, "");
  // Verify if the user creating the new cart is the one login.

  if(tempId !== authId)
    return true;
  
  return false;
};

/**
 * Create a item
 */
exports.create = function (req, res) {
  var item = new Item(req.body);
  console.log(item);

  if(item.price <= 0) {
    return res.status(400).send({message: 'Price cannot be 0 and below.'});
  }

  if(req.files.file.name === null) {
    return res.status(400).send({message: 'Blank image detected.'});
  }
  
  fs.writeFile('./modules/store/client/img/items/' + req.files.file.name, req.files.file.buffer, function (uploadError) {
    if (uploadError) {
      return res.status(400).send({
        message: 'Error occurred while uploading item picture'
      });
    } else {
      item.itemImageURL = 'modules/store/client/img/items/' + req.files.file.name;
      item.price = parseFloat(Math.round(item.price * 100) / 100).toFixed(2);

      item.save(function (err) {
        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        } else {
          res.json(item);
        }
      });
    }
  });
};


/**
 * Delete an item
 */
exports.delete = function (req, res) {
  var item = req.item;

  item.remove(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(item);
    }
  });
};

exports.isCartExists = function(req, res, next) {
  //Find if the user has an active cart
  var user = req.user;

  Cart.find({'user': user._id, 'status': '0'}) //Look for the current active cart (Not paid)
    .exec(function (err, carts) {
      if (err)
        return false;
      else {
        if(carts.length <= 0) {
          console.log('User has no active cart. Created a new cart.');

          var cart = new Cart();
          cart.user = user;
          cart.items = [];

          cart.save(function (err) {
            if (err) {
              return false;
            } else {
              return true;
            }
          });
        } else {
          console.log('User has an existing cart. Do you wish to create a new cart?');
          return true;
        }
      }
    });
};

exports.resetCart = function(req, res) {

};

var computeItems = function(userId, itemId, newItemPrice, callback) {
  
  var promise = Cart.findOne({'user': userId, 'status': '0'}).exec(); //Look for the current active cart (Not paid)

  promise.then(function(cart){
    var total = newItemPrice;
    console.log('Plus:' + total);
    for(var i = 0, n = cart.items.length; i < n; i++) {
      total += cart.items[i].totalPrice;
      console.log(' + ' + cart.items[i].totalPrice + ' = ' + total);
    }
    callback(total);
  });
};

var isItemExists = function(userId, itemName, callback) {       
  return Cart.findOne({'user': userId, 'status': '0'}) //Look for the current active cart (Not paid)
    .exec(function (err, cart) {
      if (err)
        return false;
      else {
        var index = -1;
        var quantity = -1;
        for(var i = 0, n = cart.items.length; i < n; i++) {
          if (cart.items[i].name === itemName) {
              index = i;
              quantity = cart.items[i].quantity;
              break;
          }
        }
        callback(userId, itemName, index, quantity);
      }
    });
};

exports.addToCart = function(req, res) {
  if(verifyUser(req.body.displayedUser._id, req.user._id)){
    return res.status(400).send({message: 'Logged in as another user. Please refresh the page.'});
  }
  delete req.body.displayedUser;

  //TODO Further Error Checking
  if(req.body._itemId === null) {
    res.status(400).send({message: 'No item selected.'});
  }

  if(req.body.quantity <= 0) {
    res.status(400).send({message: 'Invalid item quantity.'});
  }

  var totalPrice = req.body.quantity * req.body.price;
  console.log('Total Price: ' + totalPrice);
  var totalAmount = computeItems(req.user._id, req.body._itemId, totalPrice, 
    function(totalAmount){
      isItemExists(req.user._id, req.body.name, function(userId, itemName, index, quantity){
        console.log(index);

        if (index >= 0) {
          console.log('Item exists! Will merge with the similar item.');

          var newQty = quantity + req.body.quantity;
          var newTotalPrice = newQty * req.body.price;
          Cart.update({'items.name': itemName }, {'$set': {
            'items.$.quantity': newQty,
            'items.$.totalPrice': newTotalPrice,
            'totalAmount': totalAmount
          }}).exec(function (err, item) {
            if (err) {
              return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
              });
            } else {
              res.json(item);
            }
          });
        } else {
          console.log('Item does not exist. Creating another row for it.');

          Cart.update({'user': req.user._id, 'status': '0'}, {
            $push: {
              'items': {
                '_itemId': req.body._itemId,
                'name': req.body.name,
                'itemImageURL': req.body.itemImageURL,
                'price': req.body.price,
                'quantity': req.body.quantity,
                'totalPrice': totalPrice
              }
            }, $set: { 
              'totalAmount': totalAmount }
          }).exec(function (err, item) {
            if (err) {
              return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
              });
            } else {
              res.json(item);
            }
          });
        }
      });
    });
};

exports.viewCart = function(req, res) {
  Cart.findOne({'user': req.user._id, 'status': '0'}) //Look for the current active cart (Not paid)
    .exec(function (err, cart) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        res.json(cart);
      }
    });
};

exports.checkout = function(req, res) {
  paypal.configure({
     'host': 'api.sandbox.paypal.com',
     'port': '',
     'client_id': 'Aa2foN3ZExeMXuxWux2Gkl8iduwMXOlAnnpC-OrYJhTiHVhJWu4x3IlutNsURxp6AKVJhZS96lxSLbKi',
     'client_secret': 'EECn76ie2MkHV5152dwIMPdBzvsYOq3HYUXAa6tMRLhA9qKGI37PRRkJlJgVEQgKdBnfxiIfZhPh3Fjm'
  });

  var paypalPayment = {
      'intent': 'sale',
      'payer': { 'payment_method': 'paypal' },
      'redirect_urls': {},
      'transactions': [{
          'amount': {
              'currency': 'PHP'
          }
      }]
  };

  paypalPayment.transactions[0].amount.total = 50;
  // paypalPayment.redirect_urls.return_url = 'http://localhost:3000/store/cart';
  // paypalPayment.redirect_urls.cancel_url = 'http://localhost:3000/store/cart';
  paypalPayment.redirect_urls.return_url = 'https://107.170.72.7/store/cart';
  paypalPayment.redirect_urls.cancel_url = 'http://107.170.72.7/store/cart';
  paypalPayment.transactions[0].description = 'Total Price: PHP ' + 50;
  paypal.payment.create(paypalPayment, {}, function (err, response) {
   if (err) {
   //res.render('order-failure', { message: [{desc: 'Payment API call failed', type: 'error'}]});
   }

   if (response) {
   var link = response.links;

    for (var i = 0; i < link.length; i++) {
       if (link[i].rel === 'approval_url') {
         console.log(link[i]);
         res.redirect(link[i].href);
       }
    }
   }
  });
};

exports.confirmCheckout = function(req, res) {
  console.log('Confirming your Checkout...');

  var payer = {
    payer_id: req.body.PayerID
  };

  paypal.payment.execute(req.body.paymentId, payer, {}, function (err, response) {
    if (err) return res.status(400).send({ message: 'An error occured while executing your transaction' });
   
    res.send({ message: 'Successfully performed payment' });
  }); // Closing of paypal.payment.execute()
};

exports.getCount = function(req, res) {
  Item.count(function(err, count) {
    if (err)
      return res.status(400).send({
          message:errorHandler.getErrorMessage(err)
        });
    else {
      res.json({'count': count});
    }
  });
};

exports.limitedList = function(req, res) {
  var page;

  if (!req.params.pageNo)
    page = 1;
  else
    page = req.params.pageNo;

  Item.find().sort('-created').skip((page - 1) * 8).limit(8)
    .exec(function (err, items) {
      if (err)
        return res.status(400).send({
          message:errorHandler.getErrorMessage(err)
        });
      else
        res.json(items);
    });
};

/**
 * Show the current item
 */
exports.read = function (req, res) {
  res.json(req.item);
};

/**
 * Update a item
 */
exports.update = function (req, res) {
  var item = req.item;

  item.title = req.body.title;
  item.content = req.body.content;

  item.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(item);
    }
  });
};

/**
 * List of Items
 */
exports.list = function (req, res) {
  Item.find().sort('-created').exec(function (err, items) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(items);
    }
  });
};

/**
 * Item middleware
 */
exports.itemByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Item is invalid'
    });
  }

  Item.findById(id).exec(function (err, item) {
    if (err) {
      return next(err);
    } else if (!item) {
      return res.status(404).send({
        message: 'No item with that identifier has been found'
      });
    }
    req.item = item;
    next();
  });
};
