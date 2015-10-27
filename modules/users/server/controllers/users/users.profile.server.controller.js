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
  User = mongoose.model('User');

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

/**
 * Show the current user
 */
exports.read = function (req, res) {
  res.json(req.model);
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
