'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  sanitizeHtml = require('sanitize-html'),
  sanitizeMongo = require('mongo-sanitize'),
  Message = mongoose.model('Message'),
  User = mongoose.model('User'),
  Item = mongoose.model('Item'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

var isAllowedToPerform = function(message, user) {
  if(user._id.toString() === message.user._id.toString() ||
     user.roles[1] === 'admin') {
    console.log('You can update this');
    return true;
  } else
    return false;
};

exports.basicsearch = function(req, res) {
  var keyword = sanitizeMongo(req.params.keyword);
  delete req.params.keyword;

  if(!keyword)
    return res.status(400).send({message: 'Please enter a string'});

  Message.find({'content': new RegExp(keyword, 'i')})
    .populate('user', 'firstName lastName username profileImageURL created')
    .populate('attachedItems.item', 'name price itemImageURL')
    .sort('-created')
    .exec(function (err, messages) {
      if (err)
        return res.status(400).send({
          message:errorHandler.getErrorMessage(err)
        });
      else {
        console.log(JSON.stringify(messages, null, "\t"));
        res.json(messages);
      }
    });
};

// Advanced Search for Models with Referenced Objects

exports.advancedsearch = function(req, res) {
  // mainquery handles Messages
  // userquery handles 'match' property for populated User
  var mainquery, userquery;

  try {
    var parsedField = JSON.parse(req.params.fields);

    console.log('Advanced Search!');
    var keyword = sanitizeMongo(parsedField.keyword);
    var fields = parsedField.additionalFields;

    if(!keyword && !fields.length) {
      console.log('NPF');
      return res.status(400).send({message: 'No parameters found.'});
    }

    mainquery = Message.find();
    mainquery.where('content', new RegExp(keyword, 'i')); // Perform Basic Search

    userquery = {};

    // Sample Push
    // userquery.$or.push({'username': 'name'}); (OR) Searches for username with value of 'name'
    // userquery.$and.push({'firstName': 'firstname'}); (AND) Searches for firstName with value of 'firstname'

    // Initialize AND / OR
    userquery.$or = [];
    userquery.$and = [];

    // Iterate all additional fields

    for (var i = 0; i < fields.length; i++) {
      var field = fields[i];
      var dateObj1, date_end1, date_end2, dateObj2, date_start, currdate1, currdate2;

      if(field.values.type) { // AND
        if(field.name === 'Username') {
          userquery.$and.push({'username': sanitizeMongo(field.values.name)});
        } else if(field.name === 'Name') {
          userquery.$and.push({'firstName': sanitizeMongo(field.values.name)});
        } else if(field.name === 'Date') {
          currdate1 = sanitizeMongo(field.values.date_end);
          dateObj1 = new Date(currdate1);
          date_end1 = new Date(dateObj1.getFullYear(), dateObj1.getMonth(), dateObj1.getDate());
          date_end2 = new Date(dateObj1.getFullYear(), dateObj1.getMonth(), dateObj1.getDate()+1);

          if(field.values.range === '=') {
            mainquery.and([{'created': { $gte: date_end1, $lt: date_end2 }}]);
          } else if(field.values.range === '<=') {
            mainquery.and([{'created': { $lte: date_end2 }}]);
          } else if(field.values.range === '>=') {
            mainquery.and([{'created': { $gte: date_end1 }}]);
          } else if(field.values.range === 'between') {
            currdate2 = sanitizeMongo(field.values.date_start);
            dateObj2 = new Date(currdate2);
            date_start = new Date(dateObj2.getFullYear(), dateObj2.getMonth(), dateObj2.getDate());

            console.log(date_start + ' to ' + date_end1);

            if(date_start > date_end1)
              return res.status(400).send({message: 'Begin date should not be greater than the specified end date.'});

            mainquery.and([{'created': { $gt: date_start, $lt: date_end2 }}]);
          }
        }
      } else { // OR
        if(field.name === 'Username') {
          userquery.$or.push({'username': sanitizeMongo(field.values.name)});
        } else if(field.name === 'Name') {
          userquery.$or.push({'firstName': sanitizeMongo(field.values.name)});
        } else if(field.name === 'Date') {
          currdate1 = sanitizeMongo(field.values.date_end);
          dateObj1 = new Date(currdate1);
          date_end1 = new Date(dateObj1.getFullYear(), dateObj1.getMonth(), dateObj1.getDate());
          date_end2 = new Date(dateObj1.getFullYear(), dateObj1.getMonth(), dateObj1.getDate()+1);

          if(field.values.range === '=') {
            mainquery.or([{'created': { $gte: date_end1, $lt: date_end2 }}]);
          } else if(field.values.range === '<=') {
            mainquery.or([{'created': { $lte: date_end2 }}]);
          } else if(field.values.range === '>=') {
            mainquery.or([{'created': { $gte: date_end1 }}]);
          } else if(field.values.range === 'between') {
            currdate2 = sanitizeMongo(field.values.date_start);
            dateObj2 = new Date(currdate2);
            date_start = new Date(dateObj2.getFullYear(), dateObj2.getMonth(), dateObj2.getDate());

            console.log(date_start + ' to ' + date_end1);

            // Check first date start and date end before pushing to Main Query
            if(date_start > date_end1)
              return res.status(400).send({message: 'Begin date should not be greater than the specified end date.'});

            mainquery.or([{'created': { $gt: date_start, $lt: date_end2 }}]);
          }
        }
      }
    }

    // Delete ununsed fields (AND / OR)
    if(!userquery.$or.length)
      delete userquery.$or;
    if(!userquery.$and.length)
      delete userquery.$and;

    // Display Query in Console
    console.log(mainquery._conditions);
    console.log(userquery);

  } catch(exception) {
      console.log('Exception: ' + exception);
  }

  mainquery.populate({
    path: 'user',
    match: userquery, // Perform user queries
    select: 'firstName lastName username profileImageURL created'
  }).populate('attachedItems.item', 'name price itemImageURL')
    .sort('-created')
    .exec(function (err, messages) {
      if (err)
        return res.status(400).send({
          message:errorHandler.getErrorMessage(err)
        });
      else {
        // Remove user that are not matched
        for(var i = 0; i < messages.length; i++) {
          if(!messages[i].user) {
            messages.splice(i, 1);
            i--; // Splice reduce the array size so 'i' should be decremented
          }
        }
        res.json(messages);
      }
    });
};


/*
// For embedded fields
exports.advancedsearch = function(req, res) {
  var query;

  try {
    var parsedField = JSON.parse(req.params.fields);

    console.log('Advanced Search!');
    var keyword = parsedField.keyword;
    var fields = parsedField.additionalFields;

    if(!keyword && !fields.length) {
      console.log('NPF');
      return res.status(400).send({message: 'No parameters found.'});
    }

    // Generate dynamic query
    query = Message.find();
    query.where('content', new RegExp(keyword, 'i')); // Perform basic search

    for (var i = 0; i < fields.length; i++) {
      var field = fields[i];
      var dateObj1, date_end1, date_end2, dateObj2, date_start;

      if(field.values.type) { //AND
        if(field.name === 'Username') {
          //query['user.username'] = field.values.name;
          query.and([{'user.username': field.values.name}]);
        } else if(field.name === 'Name') {
          //query['user.firstName'] = field.values.name;
          query.and([{'user.firstName': field.values.name}]);
        } else if(field.name === 'Date') {
          dateObj1 = new Date(field.values.date_end);
          date_end1 = new Date(dateObj1.getFullYear(), dateObj1.getMonth(), dateObj1.getDate());
          date_end2 = new Date(dateObj1.getFullYear(), dateObj1.getMonth(), dateObj1.getDate()+1);

          if(field.values.range === '=') {
            query.and([{'created': { $gte: date_end1, $lt: date_end2 }}]);
          } else if(field.values.range === '<=') {
            query.and([{'created': { $lte: date_end2 }}]);
          } else if(field.values.range === '>=') {
            query.and([{'created': { $gte: date_end1 }}]);
          } else if(field.values.range === 'between') {
            dateObj2 = new Date(field.values.date_start);
            date_start = new Date(dateObj2.getFullYear(), dateObj2.getMonth(), dateObj2.getDate());

            console.log(date_start + ' to ' + date_end1);

            if(date_start > date_end1)
              return res.status(400).send({message: 'Begin date should not be greater than the specified end date.'});

            query.and([{'created': { $gt: date_start, $lt: date_end2 }}]);
          }
          //query.where('created').gte(new Date(2015, 8, 25)).lte(new Date(2015, 8, 27));
        }
      } else {// OR
        if(field.name === 'Username') {
          query.or([{'user.username': field.values.name}]);
        } else if(field.name === 'Name') {
          query.or([{'user.firstName': field.values.name}]);
          // query.$or.push({
          //  'user.firstName': field.values.name
          //});
        } else if(field.name === 'Date') {
          dateObj1 = new Date(field.values.date_end);
          date_end1 = new Date(dateObj1.getFullYear(), dateObj1.getMonth(), dateObj1.getDate());
          date_end2 = new Date(dateObj1.getFullYear(), dateObj1.getMonth(), dateObj1.getDate()+1);

          if(field.values.range === '=') {
            query.or([{'created': { $gte: date_end1, $lt: date_end2 }}]);
          } else if(field.values.range === '<=') {
            query.or([{'created': { $lte: date_end2 }}]);
          } else if(field.values.range === '>=') {
            query.or([{'created': { $gte: date_end1 }}]);
          } else if(field.values.range === 'between') {
            dateObj2 = new Date(field.values.date_start);
            date_start = new Date(dateObj2.getFullYear(), dateObj2.getMonth(), dateObj2.getDate());

            console.log(date_start + ' to ' + date_end1);

            if(date_start > date_end1)
              return res.status(400).send({message: 'Begin date should not be greater than the specified end date.'});

            query.or([{'created': { $gt: date_start, $lt: date_end2 }}]);
          }
        }
      }
    }
  } catch (exception) {
    console.log('Error (JSON Parse): ' + exception);
  }

  console.log(query._conditions);

  query.sort('-created')
    .exec(function (err, messages) {
      if (err)
        return res.status(400).send({
          message:errorHandler.getErrorMessage(err)
        });
      else {
        res.json(messages);
      }
    });
};
*/

exports.getUser = function(req, res) {
  var id = req.user._id;

  User.findById(id).select('firstName lastName salutation aboutme username gender birthDate profileImageURL created').exec(function (err, user) {
    if (err) {
      return res.status(400).send({
        message:errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(user);
    }
  });
};

exports.getCount = function(req, res) {
	Message.count(function(err, count) {
		if (err)
			return res.status(400).send({
					message:errorHandler.getErrorMessage(err)
				});
		else
			res.json({'count': count});
	});
};

exports.limitedList = function(req, res) {
	var page;

	if (!req.params.pageNo)
		page = 1;
	else
		page = req.params.pageNo;

	Message.find().sort('-created').skip((page - 1) * 10).limit(10)
		.populate('user', 'firstName lastName profileImageURL created username')
    .populate('attachedItems.item', 'name price itemImageURL').exec(
    function (err, messages) {
			if (err)
				return res.status(400).send({
					message:errorHandler.getErrorMessage(err)
				});
			else
				res.json(messages);
		});
};

exports.create = function (req, res) {
  var displayedUser = req.body.displayedUser;
  delete req.body.displayedUser;

  //console.log(typeof (req.session.passport.user).toString());
  var tempId = JSON.stringify(displayedUser._id).replace(/\"/g, "");
  var authId = JSON.stringify(req.user._id).replace(/\"/g, "");
  //console.log(tempId + ' ' + authId);

  // Verify if the user posting is the one displayed, Otherwise force a refresh.
  if(tempId !== authId) {
    return res.status(400).send({message: 'Logged in as another user. Please refresh the page.'});
  }

  var message = new Message(req.body);
  message.user = req.user;
  message.username = req.user.username;
  message.attachedItems = [];

  var attachments = req.body.attachments;
  for(var index in attachments) {
    var newItem = new Item(attachments[index]);
    message.attachedItems.push({'item': newItem});
  }

  console.log(message);

  var clean = sanitizeHtml(message.content, {
    allowedTags: [ 'b', 'i', 'u', 'em', 'strong', 'img' ],
    allowedAttributes: {
      'img': [ 'src' ]
    }
  });
  message.content = clean;

  // For display purposes
  var bannedTags = ['<script>', '/api/auth/signout', 'javascript', 'onclick'];

  for(var i = 0; i < bannedTags.length; i++) {
    if(message.content.toLowerCase().indexOf(bannedTags[i]) >= 0) {
      return res.status(400).send({message: 'Malicious code found!'});
    }
  }

  message.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(message);
    }
  });
};

/**
 * Show the current message
 */
exports.read = function (req, res) {
  /*
  if(req.user._id.toString() === req.message.user._id.toString()){
    return res.status(403).send({message: 'forbidden'});
  }*/

  if(!isAllowedToPerform(req.message, req.user))
    return res.status(403).send({message: 'You cannot access this link!'});

  res.json(req.message);
};

/**
 * Update a message
 */
exports.update = function (req, res) {
  var message = req.message;

  message.content = req.body.content;
  message.editedDate = Date.now();

  // For safety puarposes to ngSanitize /\<+(/?)([b|i|u|img])+(/?)+>/g
  var bannedTags = ['<script>', '</script>', '<script', '/api/auth/signout', 'javascript.', 'onclick'];

  for(var i = 0; i < bannedTags.length; i++) {
    if(message.content.toLowerCase().indexOf(bannedTags[i]) >= 0) {
      return res.status(400).send({message: 'Malicious HTML found!'});
    }
  }

  if(!isAllowedToPerform(req.message, req.user))
    return res.status(400).send({message: 'I\'m sorry you have no privelege to do this!'});

  message.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(message);
    }
  });
};

/**
 * Delete an message
 */
exports.delete = function (req, res) {
  var message = req.message;

  if(!isAllowedToPerform(req.message, req.user))
    return res.status(400).send({message: 'I\'m sorry you have no privelege to do this!'});

  message.remove(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(message);
    }
  });
};

/**
 * List of Messages
 */
exports.list = function (req, res) {
  Message.find().sort('-created')
  .populate('user', 'firstName username profileImageURL created')
  .populate('attachedItems.item', 'name price itemImageURL')
  .exec(function (err, messages) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(messages);
    }
  });
};

/**
 * Message middleware
 */
exports.messageByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Message is invalid'
    });
  }

  Message.findById(id)
  .populate('user', 'firstName username profileImageURL created')
  .populate('attachedItems.item', 'name price itemImageURL')
  .exec(function (err, message) {
    if (err) {
      return next(err);
    } else if (!message) {
      return res.status(404).send({
        message: 'No message with that identifier has been found'
      });
    }
    req.message = message;
    next();
  });
};
