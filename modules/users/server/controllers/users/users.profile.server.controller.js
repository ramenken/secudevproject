'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  fs = require('fs'),
  path = require('path'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  mongoose = require('mongoose'),
  sanitizeHtml = require('sanitize-html'),
  User = mongoose.model('User'),
  Item = mongoose.model('Item'),
  Message = mongoose.model('Message'),
  Cart = mongoose.model('Cart');

var isValidDate = function(dateObject) {
  var newDate = (dateObject.getMonth() + 1) + '/' + dateObject.getDate() + '/' + dateObject.getFullYear();
  console.log('Testing date : ' + newDate);
  var matches = /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/.exec(newDate);
  if (matches === null) {
    console.log('Printing hello from matches');
    return false;
  }
  var d = parseInt(matches[2]);
  var m = matches[1] - 1;
  var y = parseInt(matches[3]);
  var composedDate = new Date(y, m, d);

  return composedDate.getDate() === d && composedDate.getMonth() === m & composedDate.getFullYear() === y;
};

var calculateAge = function(year) {
  var now = new Date();
  var current_year = now.getFullYear();
  console.log(current_year + ' - ' + year);
  return current_year - year;
};

var computeDonation = function(userId, amount, callback) {
  var promise = User.findOne({'_id': userId}).exec(); //Look for the current active cart (Not paid)

  promise.then(function(user){
    var total = amount;

    if(user) {
      total = total + user.contribution;
      total = parseFloat(Math.round(total * 100) / 100).toFixed(2);
      callback(total);
    }
  });
};

/**
 * Show the current user
 */
exports.read = function (req, res) {
  res.json(req.model);
};

var searchCandidates = function(userId, callback) {
  var promise = Message.find({'user': userId}).exec();

  promise.then(function(messages){
    User.findOne({'_id': userId})
    .exec(function(err, user){
      if (err) {
        return false;
      } else {
        var postCount, purchaseCount, donationCount;

        purchaseCount = donationCount = 0;
        if(user) {
          postCount = messages.length;
          donationCount = user.contribution;
          purchaseCount = user.totalpurchase;
        }
        callback(postCount, purchaseCount, donationCount);
      } 
    });
  });
  
};

exports.updateBadges = function (req, res) {

  console.log('Crafting your lovely badges...');
  console.log(req.params);

  var badges = [
    {'name': 'Participant Badge', 'badgeImageURL': 'modules/users/client/img/badges/participant.png', 'type': 'post', 'description': 'Awarded to those who reach 3 posts'},
    {'name': 'Chatter Badge', 'badgeImageURL': 'modules/users/client/img/badges/chatter.png', 'type': 'post', 'description': 'Awarded to those who reach 5 posts'},
    {'name': 'Socialite Badge', 'badgeImageURL': 'modules/users/client/img/badges/socialite.png', 'type': 'post', 'description': 'Awarded to those who reach 10 posts'},
    {'name': 'Supporter Badge', 'badgeImageURL': 'modules/users/client/img/badges/supporter.png', 'type': 'donation', 'description': 'Contributed at least $5 of donation'},
    {'name': 'Contributor Badge', 'badgeImageURL': 'modules/users/client/img/badges/contributor.png', 'type': 'donation', 'description': 'Contributed at least $20 of donation'},
    {'name': 'Pillar Badge', 'badgeImageURL': 'modules/users/client/img/badges/pillar.png', 'type': 'donation', 'description': 'Contributed at least $100 of donation'},
    {'name': 'Shopper Badge', 'badgeImageURL': 'modules/users/client/img/badges/shopper.png', 'type': 'store', 'description': 'Reached at least $5 of purchase'},
    {'name': 'Promoter Badge', 'badgeImageURL': 'modules/users/client/img/badges/promoter.png', 'type': 'store', 'description': 'Reached at least $20 of purchase'},
    {'name': 'Elite Badge', 'badgeImageURL': 'modules/users/client/img/badges/elite.png', 'type': 'store', 'description': 'Reached at least $100 of purchase'},
    {'name': 'Explorer Badge', 'badgeImageURL': 'modules/users/client/img/badges/explorer.png', 'type': 'collector', 'description': 'Collected Participant, Support, and Shopper badges'},
    {'name': 'Backer Badge', 'badgeImageURL': 'modules/users/client/img/badges/backer.png', 'type': 'collector', 'description': 'Collected Contributor and Promoter badges'},
    {'name': 'Evangelist Badge', 'badgeImageURL': 'modules/users/client/img/badges/evangelist.png', 'type': 'collector', 'description': 'Collected Socialite, Pillar, and Elite badges'}
  ];

  var postTotal, purchaseTotal, donationTotal;
  postTotal = purchaseTotal = donationTotal = 0;

  var myBadges = [];

  searchCandidates(req.params.userId, function(postCount, purchaseCount, donationCount){
    var explorer = [0,0,0];
    var backer = [0,0,0];
    var evangelist = [0,0,0];

    if(postCount >= 3) {
      myBadges.push(badges[0]);
      explorer[0] = 1;

      if(postCount >= 5) {
        myBadges.push(badges[1]);
        backer[0] = 1;

        if(postCount >= 10) {
          myBadges.push(badges[2]);
          evangelist[0] = 1;
        }
      }
    }

    if(donationCount >= 3) {
      myBadges.push(badges[3]);
      explorer[1] = 1;

      if(donationCount >= 20) {
        myBadges.push(badges[4]);
        backer[1] = 1;

        if(donationCount >= 100) {
          myBadges.push(badges[5]);
          evangelist[1] = 1;
        }
      }
    }

    if(purchaseCount >= 5) {
      myBadges.push(badges[6]);
      explorer[2] = 1;

      if(purchaseCount >= 20) {
        myBadges.push(badges[7]);
        backer[2] = 1;

        if(purchaseCount >= 100) {
          myBadges.push(badges[8]);
          evangelist[2] = 1;
        }
      }
    }

    if(explorer[0] + explorer[1] + explorer[2] === 3)
      myBadges.push(badges[9]);

    if(backer[1] + backer[2] === 2)
      myBadges.push(badges[10]);

    if(evangelist[0] + evangelist[1] + evangelist[2] === 3)
      myBadges.push(badges[11]);

    console.log('Post Count: ' + postCount);
    console.log('Purchase Count: ' + purchaseCount);
    console.log('Donation Count: ' + donationCount);  

    console.log('My ' + myBadges.length + ' Badges are : ');
    for(var i in myBadges) {
      console.log(myBadges[i]);
    }

    res.status(200).send({'badges': myBadges, 'donationCount': donationCount, 'postCount': postCount, 'purchaseCount': purchaseCount});
  });
};

/**
 * Update user details
 */
exports.update = function (req, res) {
  var displayedUser = req.body.displayedUser;
  delete req.body.displayedUser;

  //console.log(typeof (req.session.passport.user).toString());
  var tempId = JSON.stringify(displayedUser._id).replace(/\"/g, "");
  var authId = JSON.stringify(req.user._id).replace(/\"/g, "");
  console.log(tempId + ' ' + authId);
  if(tempId !== authId) {
    return res.status(400).send({message: 'Logged in as another user. Please refresh the page.'});
  }

  // Init Variables
  var user = req.user;
  //console.log(req);
  // For security measurement we remove the roles from the req.body object
  delete req.body.roles;

  if (user) {
    // Merge existing user
    user = _.extend(user, req.body);
    user.updated = Date.now();

    var dateObj = new Date(user.birthDate);

    if(!isValidDate(dateObj))
      return res.status(400).send({message: 'Birthday format is not valid! Please use MM/DD/YYYY'});

    var current_age = calculateAge(dateObj.getFullYear());

    if(current_age < 18) {
      return res.status(400).send({message: 'You cannot downgrade your age.'});
    }

    //Update missing fields
    user.age = current_age;

    var maleItems = ['Mr','Sir','Senior','Count'];
    var femaleItems = ['Miss','Ms','Mrs','Madame','Majesty','Seniora'];

    console.log(maleItems.indexOf(user.salutation));
    if((maleItems.indexOf(user.salutation) >= 0 && user.gender.toLowerCase() === 'male') ||
       (femaleItems.indexOf(user.salutation) >= 0 && user.gender.toLowerCase() === 'female')) {
      console.log('Your gender is eligible');
    } else {
      return res.status(400).send({message: 'Incorrect Gender!'});
    }

    var clean = sanitizeHtml(user.aboutme, {
      allowedTags: [ 'b', 'i' ]
    });
    user.aboutme = clean;

    user.save(function (err) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        req.login(user, function (err) {
          if (err) {
            res.status(400).send(err);
          } else {
            res.json(user);
          }
        });
      }
    });
  } else {
    res.status(400).send({
      message: 'User is not signed in'
    });
  }
};

/**
 * Update profile picture
 */
exports.changeProfilePicture = function (req, res) {
  var displayedUserId = req.body.displayedUserId;
  console.log(displayedUserId);
  delete req.body.displayedUserId;

  var tempId = displayedUserId;
  var authId = JSON.stringify(req.user._id).replace(/\"/g, "");
  console.log(tempId + ' ' + authId);
  if(tempId !== authId) {
    return res.status(400).send({message: 'Logged in as another user. Please refresh the page.'});
  } else {
    console.log('User ' + authId + ' changed. ');
  }

  var user = req.user;
  var message = null;

  if (user) {
    fs.writeFile('./modules/users/client/img/profile/uploads/' + req.files.file.name, req.files.file.buffer, function (uploadError) {
      if (uploadError) {
        return res.status(400).send({
          message: 'Error occurred while uploading profile picture'
        });
      } else {
        user.profileImageURL = 'modules/users/client/img/profile/uploads/' + req.files.file.name;

        user.save(function (saveError) {
          if (saveError) {
            return res.status(400).send({
              message: errorHandler.getErrorMessage(saveError)
            });
          } else {
            req.login(user, function (err) {
              if (err) {
                res.status(400).send(err);
              } else {
                res.json(user);
              }
            });
          }
        });
      }
    });
  } else {
    res.status(400).send({
      message: 'User is not signed in'
    });
  }
};

exports.list = function (req, res) {
  User.find({}, '-salt -password').sort('-created').populate('user', 'firstName').exec(function (err, users) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    res.json(users);
  });
};

/**
 * Send User
 */
exports.me = function (req, res) {
  res.json(req.user || null);
};
