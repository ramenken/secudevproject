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
  Transaction = mongoose.model('Transaction'),
  paypal = require('paypal-rest-sdk'),
  ipnVerify = require('paypal-ipn'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));


var verifyUser = function(user1, user2) {

  var tempId = JSON.stringify(user1).replace(/\"/g, "");
  var authId = JSON.stringify(user2).replace(/\"/g, "");
  // Verify if the user creating the new cart is the one login.

  if(tempId !== authId)
    return true;
  
  return false;
};

var rejectUserId = function(userId1, userId2) {
  var authId = JSON.stringify(userId2).replace(/\"/g, "");

  if(userId1 !== authId)
    return true;
  
  return false;
};

var computeItems = function(userId, newItemPrice, callback) {
  var promise = Cart.findOne({'user': userId, $or: [{'status': '0'},{'status': '2'}]}).exec(); //Look for the current active cart (Not paid)

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
  Cart.findOne({'user': userId, $or: [{'status': '0'},{'status': '2'}]}) //Look for the current active cart (Not paid)
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
  if(rejectUserId(req.body.displayedUserId, req.user._id)){
    return res.status(400).send({message: 'Logged in as another user. Please refresh the page.'});
  }
  delete req.body.displayedUserId;

  var item = new Item(req.body);

  if(isNaN(item.price)) {
    return res.status(400).send({message: 'Invalid item price.'});
  }

  if(item.price <= 0) {
    return res.status(400).send({message: 'Price cannot be 0 and below.'});
  }
  else if(item.price >= 1000) {
    return res.status(400).send({message: 'Item price is too high! Limit it to $1 ~ $999.'});
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

  Cart.findOne({'user': user._id, $or: [{'status': '0'},{'status': '2'}]}) //Look for the current active cart (Not paid)
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
  console.log('Verifying Checkout Transaction');
  console.log(req.body);

  ipnVerify.verify(req.body, {'allow_sandbox': true}, function(err, msg) {
    if(err)
      return res.send({'message': err});

    console.log('IPN is valid!');

    if(req.body.item_number === 'secudevdonation5' || req.body.item_number === 'secudevdonation10' || 
      req.body.item_number === 'secudevdonation20') {
        if(req.body.payment_status === 'Completed') {
          console.log('You donated $' + req.body.payment_gross);
          
          // Add to total donations
          computeDonation(req.body.custom, req.body.payment_gross, function(amount) {
            User.update({'_id': req.body.custom}, 
              { $set: 
                { 
                  'contribution': amount
                }
              }).exec(function(err, user){
                  if (err)
                    return res.status(400).send({message: errorHandler.getErrorMessage(err)});
                  else
                    res.json(user);
                });
          });
        }
    } else {

      if(req.body.payment_status === 'Completed') {
        //Save Checkout!
      }
      res.status(200).send({'message': 'I received your Checkout IPN!'});
    }
  });
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

  Cart.update({'user': req.user._id, $or: [{'status': '0'},{'status': '2'}]}, {
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
          Cart.update({'user': req.user._id, $or: [{'status': '0'},{'status': '2'}]}, 
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
  if(isNaN(req.body.quantity)) {
    return res.status(400).send({message: 'Item quantity is invalid.'});
  }
  
  newItem.item.price = parseFloat(Math.round(newItem.item.price * 100) / 100).toFixed(2);
  
  var totalPrice = newItem.item.price * newItem.quantity;
  console.log('Updating total price: ' + totalPrice);

  Cart.update({'user': req.user._id, $or: [{'status': '0'},{'status': '2'}], 'items.item': newItem.item._id}, {
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
          Cart.update({'user': req.user._id, $or: [{'status': '0'},{'status': '2'}]}, 
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
    return res.status(400).send({message: 'No item selected.'});
  }

  console.log('Quantity: ' + req.body.quantity);
  if(req.body.quantity <= 0 || req.body.quantity === null || req.body.quantity === undefined || isNaN(req.body.quantity)) {
    return res.status(400).send({message: 'Invalid item quantity.'});
  }

  var cartItem = {item: '', quantity: 0, totalPrice: 0};
  var item = new Item(req.body.item);

  cartItem.item = item;
  cartItem.quantity = req.body.quantity;

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
          Cart.update({'user': req.user._id, $or: [{'status': '0'}, {'status': '2'}], 'items.item': itemId }, {'$set': {
            'items.$.quantity': newQty,
            'items.$.totalPrice': newTotalPrice,
            'totalAmount': totalAmount
          }}).exec(function (err, item) {
            if (err) {
              return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
              });
            } else {
              console.log(item);
              res.json(item);
            }
          });
        } else {
          console.log('Item does not exist. Creating another row for it.');

          Cart.update({'user': req.user._id, $or: [{'status': '0'}, {'status': '2'}]}, {
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
    return res.status(400).send({'message': 'Cannot checkout when cart is empty! - 1', 'continue': false});
  }

  Cart.findOne({'user': req.user._id, $or: [{'status': '0'},{'status': '2'}]}) //Look for the current active cart (Not paid)
    .exec(function (err, cart) {
      if (err)
        return res.send({'message': 'Error when checking for items in the server', 'continue': false});
      else {
        console.log(cart.items.length);
        if(!cart.items.length)
          return res.status(400).send({'message': 'Cannot checkout when cart is empty! - 2', 'continue': false});
        else {

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
  
  paypalPayment.redirect_urls.return_url = 'https://107.170.72.7/checkout/confirm';
  paypalPayment.redirect_urls.cancel_url = 'https://107.170.72.7/checkout/cancel';
  paypal.payment.create(paypalPayment, {}, function (err, response) { 
    if (err) {
      return res.send({'message': 'There seems to be an error in the payment API request. Please try again.',
                'issue': err.response, 'continue': false});
    }
    else if (response) {
      console.log('THIS IS A RESPONSE=========');
      console.log(typeof response.id + ' ' + response.id);
      var str = response.links[1].href;
      var token = str.substr(str.indexOf("token=") + 6);
      console.log(token);
      console.log('THIS IS A RESPONSE=========');
      var link = response.links;

      Cart.findOne({'user': req.user._id, $or:[{'status': 0},{'status': 2}]}).exec(function(err, cart) {
        var transaction = new Transaction();
        transaction.items = cart.items;
        transaction.user = cart.user;
        transaction.status = 0;
        transaction.totalAmount = cart.totalAmount;
        transaction.paymentId = response.id;
        transaction.tokenId = token;
        transaction.created = cart.created;
        transaction.updated = new Date();

        transaction.save(function (err) {
          if (err) {
            return res.status(400).send({ message: 'New transaction failed.'});
          }
        });
      });

      for (var i = 0; i < link.length; i++) {
          if (link[i].rel === 'approval_url') {
            console.log(link[i].href);
            return res.send({'message': 'Link through paypal has been created!', 'link': link[i].href, 'continue': true});
          }
      }
    }
  });
        } // else
      }
    });
};

exports.cancelCheckout = function(req, res) {
  if(verifyUser(req.body.displayedUser._id, req.user._id)){
    return res.status(400).send({message: 'Logged in as another user. Please refresh the page.'});
  }
  delete req.body.displayedUser;

  if(req.body.token !== null) {
    Cart.update({'user': req.user._id, $or: [{'status': '0'},{'status': '2'}]}, { 
        $set: { 
          'status': 2
        }
      }).exec(function (err, cart) {
        if (err) {
          return res.status(400).send({message: errorHandler.getErrorMessage(err)});
        }
      });

      // Verify if transaction is cancelled
      Transaction.findOne({'user': req.user._id, 'tokenId': req.body.token, 'status': 2}).exec(function(err, response){
        if (err) {
          return res.status(400).send({message: errorHandler.getErrorMessage(err)});
        } else {
          console.log(response);
          if(response)
            return res.send({'message': 'This transaction (' + response.tokenId + ') was already cancelled.'});
          else {
            Transaction.update({'user': req.user._id, 'tokenId': req.body.token}, {
              $set: { 
                'status': 2
              }
            }).exec(function (err, tr) {
              if (err) {
                console.log('There is no existing token like that!');
                return res.status(400).send({message: errorHandler.getErrorMessage(err)});
              } else {
                if(tr.nModified)
                  return res.send({'message': 'Cancelled Transaction.'});
                else
                  return res.send({'message': 'Nothing has been cancelled.'});
              }
            });
          }
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
    if (err) {
      console.log('Error in executing your payment!');
      return res.status(400).send({ 'message': err.response.message });
    }
    else {
      console.log(response);

      /*var transaction = Transaction.findOne({'user': req.user._id}).sort({'updated': -1}).limit(1);
      transaction.then(function(response){
        Transaction.update({'_id': response._id}, {
            $set: { 
              'status': 1
            }
          }).exec(function (err, tr) {
            if (err) {
              return res.status(400).send({message: errorHandler.getErrorMessage(err)});
            }
          });
      });*/

      // Verify if transaction is cancelled
      Transaction.findOne({'user': req.user._id, 'tokenId': req.body.token, 'status': 1}).exec(function(err, response){
        if (err) {
          return res.status(400).send({message: errorHandler.getErrorMessage(err)});
        } else {
          console.log(response);
          if(response)
            return res.send({'message': 'This transaction (' + response.tokenId + ') was already paid.'});
          else {
            console.log('updating transaction');
            Transaction.update({'user': req.user._id, 'tokenId': req.body.token}, {
              $set: { 
                'status': 1
              }
            }).exec(function (err, tr) {
              if (err) {
                console.log('There is no existing token like that!');
                return res.status(400).send({message: errorHandler.getErrorMessage(err)});
              } else {
                if(tr.nModified)
                  console.log('Paid transaction!');
                else
                  return res.send({'message': 'The transaction is already paid.'});
              }
            });
          }
        }
      });

      // Add all purchase / donation packs to total contribution / purchase of User
      var donationPackSum = 0;
      var purchaseSum = 0;

      Cart.find({'user': req.user._id, $or:[{'status': 0},{'status': 2}]})
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
                  }).exec(function(err, user){
                      if (err) {
                        return res.status(400).send({
                          message: errorHandler.getErrorMessage(err)
                        });
                      } else {
                        console.log(user);
                      } 
                    });
              });
            }
          }
        });

      Cart.update({'user': req.user._id, $or: [{'status': '0'},{'status': '2'}]}, { 
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
          return res.json(response);
        }
      });
    }
  });
};

exports.getCount = function(req, res) {
  Item.find({'isHidden': false}).count(function(err, count) {
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
  if(rejectUserId(req.body.displayedUserId, req.user._id)){
    return res.status(400).send({message: 'Logged in as another user. Please refresh the page.'});
  }
  delete req.body.displayedUserId;
  var item = req.item;

  item.price = req.body.price;
  item.name = sanitizeHTML(req.body.name);
  item.description = sanitizeHTML(req.body.description);

  if(isNaN(item.price)) {
    return res.status(400).send({message: 'Invalid item price.'});
  }

  if(item.price <= 0) {
    return res.status(400).send({message: 'Price cannot be 0 and below.'});
  } else if(item.price >= 1000) {
    return res.status(400).send({message: 'Item price is too high! Limit it to $1 ~ $999.'});
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
  if(rejectUserId(req.body.displayedUserId, req.user._id)){
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
