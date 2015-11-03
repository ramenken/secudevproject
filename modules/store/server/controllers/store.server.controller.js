'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  fs = require('fs'),
  mongoose = require('mongoose'),
  sanitizeHTML = require('sanitize-html'),
  User = mongoose.model('User'),
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

var verifyUserId = function(userId1, userId2) {
  if(userId1 !== userId2)
    return true;
  
  return false;
};

var computeItems = function(userId, newItemPrice, callback) {
  
  var promise = Cart.findOne({'user': userId, 'status': '0'}).exec(); //Look for the current active cart (Not paid)

  promise.then(function(cart){
    var total = newItemPrice;
    console.log('Plus:' + total);

    if(cart) {
      for(var i = 0, n = cart.items.length; i < n; i++) {
        total += cart.items[i].totalPrice;
        console.log(' + ' + cart.items[i].totalPrice + ' = ' + total);
      }
      total = parseFloat(Math.round(total * 100) / 100).toFixed(2);
      callback(total);
    }
  });
};

var computeDonation = function(userId, amount, callback) {
  var promise = User.findOne({'_id': userId}).exec(); //Look for the current active cart (Not paid)

  console.log(typeof parseInt(amount) + ' Amount: ' + parseInt(amount));
  console.log('Computing donation for user : ' + userId);
  promise.then(function(user){
    var total = parseInt(amount);

    if(user) {
      total = total + user.contribution;
      total = parseFloat(Math.round(total * 100) / 100).toFixed(2);
      console.log('Total Callback :' + total);
      callback(total);
    }
  });
};

var computeBoth = function(userId, amount1, amount2, callback) {
  var promise = User.findOne({'_id': userId}).exec(); //Look for the current active cart (Not paid)

  console.log(amount1 + ' ' + amount2);
  console.log('Computing both donation and purchase for user : ' + promise);
  promise.then(function(user){
    var donation = amount1;
    var purchase = amount2;

    if(user) {
      donation = donation + user.contribution;
      purchase = purchase + user.totalpurchase;
      donation = parseFloat(Math.round(donation * 100) / 100).toFixed(2);
      purchase = parseFloat(Math.round(purchase * 100) / 100).toFixed(2);
      console.log('Total Donation :' + donation);
      console.log('Total Purchase :' + purchase);
      callback(donation, purchase);
    }
  });
};

var isItemExists = function(userId, itemId, callback) {       
  return Cart.findOne({'user': userId, 'status': '0'}) //Look for the current active cart (Not paid)
    .exec(function (err, cart) {
      if (err)
        return false;
      else {
        var index = -1;
        var quantity = -1;
        for(var i = 0, n = cart.items.length; i < n; i++) {
          console.log(JSON.stringify(cart.items[i].item) + ' ' + JSON.stringify(itemId));
          if (JSON.stringify(cart.items[i].item) === JSON.stringify(itemId)) {
              index = i;
              quantity = cart.items[i].quantity;
              break;
          }
        }
        callback(userId, itemId, index, quantity);
      }
    });
};

/**
 * Create a item
 */
exports.create = function (req, res) {
  var item = new Item(req.body);

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

exports.countCartItems = function(req, res) {
  var user = req.user;

  Cart.findOne({'user': user._id, 'status': '0'}) //Look for the current active cart (Not paid)
    .exec(function (err, cart) {
      if (err)
        return false;
      else {
        var totalCartItems = 0;
          if(cart) {
            for(var i = 0; i < cart.items.length; i++) {
              totalCartItems += cart.items[i].quantity;
              console.log(totalCartItems);
            }
          }
        res.send({'totalCartItems': totalCartItems});
      }
    });
};

exports.ipnHandler = function(req, res) {
  console.log(req.body);
  if(req.body.item_number === 'secudevdonation5' || req.body.item_number === 'secudevdonation10' || 
    req.body.item_number === 'secudevdonation20') {
    if(req.body.payment_status === 'Completed') {
      console.log('You donated $' + req.body.payment_gross);
      
      // Add to total donations
      computeDonation(req.body.custom, req.body.payment_gross, function(amount) {
        console.log(amount);
        User.update({'_id': req.body.custom}, { $set: 
            { 
              'contribution': amount
            }
          }).exec(function(err, user){
              if (err) {
                return res.status(400).send({
                  message: errorHandler.getErrorMessage(err)
                });
              } else {
                console.log(user);
                res.json(user);
              } 
            });
      });
    }
  } else {
    console.log('Verifying Transaction');
    console.log(req.body);

    res.status(200).send({'message': 'I received your Checkout IPN!'});
  }
};

/**
 * Delete an item
 */
exports.deleteCartItem = function (req, res) {
  if(verifyUser(req.body.displayedUser._id, req.user._id)){
    return res.status(400).send({message: 'Logged in as another user. Please refresh the page.'});
  }
  delete req.body.displayedUser;

  var itemId = req.body.itemId;
  
  console.log('Deleting item ' + itemId);

  Cart.update({'user': req.user._id, 'status': '0'}, {
    '$pull': {
        'items': {
          'item': itemId
        }
    }}).exec(function (err, item) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        computeItems(req.user._id, 0, function(totalAmount){
          Cart.update({'user': req.user._id, 'status': '0'}, 
            { $set: { 
                'totalAmount': totalAmount }
            }).exec(function (err, item) {
              if (err) {
                return res.status(400).send({
                  message: errorHandler.getErrorMessage(err)
                });
              } else {
                res.json({'item': item, 'totalAmount': totalAmount});
              }
            });
        });
      }
    });
};

exports.updateCartItem = function(req, res) {
  var newItem = req.body;
  
  console.log('Updating item ' + newItem.item._id);
  
  newItem.item.price = parseFloat(Math.round(newItem.item.price * 100) / 100).toFixed(2);
  
  var totalPrice = newItem.item.price * newItem.quantity;
  console.log('Updating total price: ' + totalPrice);

  Cart.update({'user': req.user._id, 'status': '0', 'items.item': newItem.item._id}, {
    '$set': {
        'items.$.price': newItem.item.price,
        'items.$.quantity': newItem.quantity,
        'items.$.totalPrice': totalPrice
    }}).exec(function (err, item) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        computeItems(req.user._id, 0, function(totalAmount){
          Cart.update({'user': req.user._id, 'status': '0'}, 
            { $set: { 
                'totalAmount': totalAmount }
            }).exec(function (err, item) {
              if (err) {
                return res.status(400).send({
                  message: errorHandler.getErrorMessage(err)
                });
              } else {
                res.json({'itemId': newItem.item._id, 'totalPrice': totalPrice, 'totalAmount': totalAmount});
              }
            });
        });
      }
    });
};

exports.isCartExists = function(req, res, next) {
  //Find if the user has an active cart
  var user = req.user;

  Cart.find({'user': user._id, $or:[{'status': '0'}, {'status': '2'}]}) //Look for the current active cart (Not paid)
    .exec(function (err, carts) {
      if (err)
        return false;
      else {
        if(carts.length <= 0) {
          console.log('User has no active cart. Creating a new cart.');

          var cart = new Cart();
          cart.user = user;
          cart.items = [];

          cart.save(function (err) {
            if (err) {
              return res.status(400).send({message: 'Failed to create a new cart'});
            } else {
              res.json({'message': 'User has an existing cart. Do you wish to create a new cart?'});
            }
          });
        } else {
          res.json({'message': 'User has an existing cart. Do you wish to create a new cart?'});
        }
      }
    });
};

exports.resetCart = function(req, res) {

};

exports.getPacks = function(req, res) {
  Item.find({'type': 'donation'}).exec(function(err, items){
    if (err) {
      console.log(err);
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(items);
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

  var cartItem = {item: '', quantity: 0, totalPrice: 0};
  var item = new Item(req.body.item);

  cartItem.item = item;
  cartItem.quantity = req.body.quantity;

  if(item.quantity <= 0) {
    res.status(400).send({message: 'Invalid item quantity.'});
  }

  cartItem.totalPrice = cartItem.quantity * cartItem.item.price;
  console.log('Total Price: ' + cartItem.totalPrice);
  console.log(cartItem);

  var totalAmount = computeItems(req.user._id, cartItem.totalPrice, 
    function(totalAmount){
      isItemExists(req.user._id, cartItem.item._id, function(userId, itemId, index, quantity) {
        console.log(index);

        if (index >= 0) {
          console.log('Item exists! Will merge with the similar item.');

          var newQty = quantity + cartItem.quantity;
          console.log(newQty);
          var newTotalPrice = newQty * cartItem.item.price;
          Cart.update({'items.item': itemId }, {'$set': {
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
                'item': cartItem.item,
                'quantity': cartItem.quantity,
                'totalPrice': cartItem.totalPrice
              }
            }, $set: { 
              'totalAmount': totalAmount }
          }).exec(function (err, item) {
            if (err) {
              console.log(err);
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
  Cart.findOne({'user': req.user._id, $or: [{'status': '0'}, {'status': '2'}]}) //Look for the current active cart (Not paid)
    .populate('items.item', 'name price itemImageURL type')
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
  if(verifyUser(req.body.displayedUser._id, req.user._id)){
    return res.status(400).send({message: 'Logged in as another user. Please refresh the page.', 'continue': false});
  }
  delete req.body.displayedUser;

  if(req.body.totalAmount <= 0) {
    return res.send({'message': 'Cannot checkout when there is no items!', 'continue': false});
  }

  paypal.configure({
     'host': 'api.sandbox.paypal.com',
     'port': '',
     'client_id': 'Aa2foN3ZExeMXuxWux2Gkl8iduwMXOlAnnpC-OrYJhTiHVhJWu4x3IlutNsURxp6AKVJhZS96lxSLbKi',
     'client_secret': 'EECn76ie2MkHV5152dwIMPdBzvsYOq3HYUXAa6tMRLhA9qKGI37PRRkJlJgVEQgKdBnfxiIfZhPh3Fjm'
  });

  var temp = req.body.items;
  var items = [];
  for(var i in temp) {
    items.push({
      'name': temp[i].item.name,
      'sku': temp[i].item._id,
      'price': temp[i].item.price,
      'currency': 'USD',
      'quantity': temp[i].quantity
    });
    console.log('hello world');
  }

  var paypalPayment = {
      'intent': 'sale',
      'payer': { 'payment_method': 'paypal' },
      'redirect_urls': {},
      'transactions': [{
          'item_list': {
              'items': items
          },
          'amount': {
              'currency': 'USD',
              'total': req.body.totalAmount
          },
          'description': 'Please review the details before checking out.'
      }]
  };

  var listPayment = {
    'count': '5',
    'start_index': '1'
  };
  
  console.log('Payment!');
  paypalPayment.redirect_urls.return_url = 'https://159.203.83.226/checkout/confirm';
  paypalPayment.redirect_urls.cancel_url = 'https://159.203.83.226/checkout/cancel';
  paypal.payment.create(paypalPayment, {}, function (err, response) { 
    if (err) {
      return res.send({'message': 'There seems to be an error in the payment API request. Please try again.',
                'error': err, 'continue': false});
    }
    else if (response) {
      console.log(response);
      var link = response.links;

      for (var i = 0; i < link.length; i++) {
          if (link[i].rel === 'approval_url') {
            console.log(link[i].href);
            return res.send({'message': 'Link through paypal has been created!', 'link': link[i].href, 'continue': true});
          }
      }
    }
  });
};

exports.cancelCheckout = function(req, res) {
  if(verifyUser(req.body.displayedUser._id, req.user._id)){
    return res.status(400).send({message: 'Logged in as another user. Please refresh the page.'});
  }
  delete req.body.displayedUser;

  if(req.body.token !== null) {
    Cart.update({'user': req.user._id, 'status': '0'}, { 
        $set: { 
          'status': 2
        }
      }).exec(function (err, cart) {
        if (err) {
          return res.status(400).send({message: errorHandler.getErrorMessage(err)});
        } else {
          res.json(cart);
        }
      });
  }
};

exports.confirmCheckout = function(req, res) {
  if(verifyUser(req.body.displayedUser._id, req.user._id)){
    return res.status(400).send({message: 'Logged in as another user. Please refresh the page.'});
  }
  delete req.body.displayedUser;
  console.log('Confirming your Checkout...');

  var payer = {
    payer_id: req.body.PayerID
  };

  paypal.payment.execute(req.body.paymentId, payer, {}, function (err, response) {
    if (err) 
      return res.status(400).send({ message: 'An error occured while executing your transaction' });
    else {
      console.log(response);

      // Add all purchase / donation packs to total contribution / purchase of User
      var donationPackSum = 0;
      var purchaseSum = 0;

      Cart.find({'user': req.user._id, 'status': 0})
        .populate('items.item','name price type') //Look for the current active cart (All paid)
        .exec(function (err, carts) {
          if (err)
            return res.status(400).send({message: errorHandler.getErrorMessage(err)});
          else {
            if(carts.length) {
              for(var i = 0; i < carts.length; i++) {
                for(var j = 0; j < carts[i].items.length; j++) {
                  if(carts[i].items[j].item.type === 'item')
                    purchaseSum += carts[i].items[j].totalPrice;
                  else if(carts[i].items[j].item.type === 'donation')
                    donationPackSum += carts[i].items[j].totalPrice;
                }
              }
              computeBoth(req.user._id, donationPackSum, purchaseSum, function(donationAmount, purchaseAmount) {
                console.log(donationAmount + ' ' + purchaseAmount);
                User.update({'_id': req.user._id}, { $set: 
                    { 
                      'contribution': donationAmount,
                      'totalpurchase': purchaseAmount
                    }
                  }).exec(function(err, response){
                      if (err) {
                        return res.status(400).send({
                          message: errorHandler.getErrorMessage(err)
                        });
                      } else {
                        console.log(response);
                      } 
                    });
              });
            }
          }
        });

      Cart.update({'user': req.user._id, 'status': '0'}, { 
          $set: { 
            'status': 1
          }
        }).exec(function (err, cart) {
          if (err) {
            return res.status(400).send({message: errorHandler.getErrorMessage(err)});
          }
        });

      var cart = new Cart();
      cart.user = req.user;
      cart.items = [];

      cart.save(function (err) {
        if (err) {
          return res.status(400).send({ message: 'Cart creation failed. Try to create cart manually in the cart page.'});
        } else {
          return res.status(200).send({ message: 'Payment has been created! New cart has been created! You may now shop again.'});
        }
      });
    }
  });
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

  Item.find({'isHidden': false}).sort('-created').skip((page - 1) * 8).limit(8)
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
 * Delete an item
 */
exports.delete = function (req, res) {
  var item = req.item;
  console.log('Deleting item ' + item.name);

  Item.update({'_id': item._id}, 
    { $set: { 
        'isHidden': true }
    }).exec(function (err, item) {
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
 * Update a item
 */
exports.update = function (req, res) {
  var item = req.item;

  item.price = req.body.price;
  item.name = sanitizeHTML(req.body.name);
  item.description = sanitizeHTML(req.body.description);

  if(item.price <= 0) {
    return res.status(400).send({message: 'Price cannot be 0 and below.'});
  }
  
  item.price = parseFloat(Math.round(item.price * 100) / 100).toFixed(2);
  // Update the date
  item.updated = new Date();

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

exports.updateItemPicture = function (req, res) {
  if(verifyUser(req.body.displayedUserId, req.user._id)){
    return res.status(400).send({message: 'Logged in as another user. Please refresh the page.'});
  }
  delete req.body.displayedUserId;
  var itemId = req.body.itemId;

  if(req.files.file.name === null) {
    return res.status(400).send({message: 'Blank image detected.'});
  }
  
  fs.writeFile('./modules/store/client/img/items/' + req.files.file.name, req.files.file.buffer, function (uploadError) {
    if (uploadError) {
      return res.status(400).send({
        message: 'Error occurred while uploading item picture'
      });
    } else {
      var itemImageURL = 'modules/store/client/img/items/' + req.files.file.name;

      Item.update({'_id': itemId}, 
      { $set: { 
          'itemImageURL': itemImageURL }
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
};

/**
 * List of Items
 */
exports.list = function (req, res) {
  Item.find({'isHidden': false}).sort('-created').exec(function (err, items) {
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

  // Find items that satisfies the Id and is not hidden / deleted
  Item.findOne({'_id': id, 'isHidden': false}).exec(function (err, item) {
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
