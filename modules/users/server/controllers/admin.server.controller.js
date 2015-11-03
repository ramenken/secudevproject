  'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  sanitizeHtml = require('sanitize-html'),
  sanitizeMongo = require('mongo-sanitize'),
  User = mongoose.model('User'),
  Message = mongoose.model('Message'),
  Cart = mongoose.model('Cart'),
  fs = require('fs-extra'),
  csv = require('fast-csv'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

var isValidDate = function(dateObject) {
  console.log(dateObject);
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

exports.filterCarts = function(req, res) {

  // Get the start and end dates from the controller and sanitize
  var startDate = sanitizeMongo(req.body.startDate);
      startDate = new Date(startDate);
  var date_start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  var endDate = sanitizeMongo(req.body.endDate);
      endDate = new Date(endDate);
  var date_end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()+1);

  console.log('Filter: ' + date_start + ' to ' + date_end);

  if(date_start > date_end)
    return res.status(400).send({message: 'Start date should not be greater than the specified end date.'});

  Cart.find({
    'created': { $gt: date_start, $lt: date_end }
  }).sort('-created')
    .populate('user', 'username firstName lastName')
    .populate('items.item', 'name price itemImageURL')
    .exec(function (err, carts) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      console.log(carts);
      res.json(carts);
    }
  });
};

/**
 * Add Data
 */
exports.loadCSV = function(req, res) {
  var stream = fs.createReadStream("SECUDEV_Entries.csv");
 
  var csvStream = csv
      .fromStream(stream, {'headers' : ['Username', 'Content', 'Date_Created']})
      .on('data', function(data) {
          /*var user = new User();

          user.username = data.Username;
          user.password = data.Password;
          user.firstName = data.FirstName;
          user.lastName = data.LastName;
          user.gender = data.Gender;
          user.salutation = data.Salutation;
          user.aboutme = data.AboutMe;
          user.birthDate = new Date(data.BirthDate);
          user.age = data.Age;
          user.provider = 'local';

          
          user.save(function (err) {
            if (err) {
              console.log(err);
              return false;
            } else {
              // Remove sensitive data before login
              user.password = undefined;
              user.salt = undefined;
            }
          });*/
          
          User.find({'username': data.Username}).exec(function (err, user) {
            if (err) {
              return err;
            } else if (!user) {
              return false;
            } else if(user) {

              var message = new Message();

              message.content = data.Content;
              var date = new Date(data.Date_Created);
              message.created = date;
              message.username = data.Username;
              message.user = user[0];

              //console.log(message.created + ' ' + message.user);
              if(message.user)
                message.save(function (err) {
                  if (err) {
                    console.log(err);
                    return false;
                  }
                  console.log('Saved!');
                });
            }
        });
      })
      .on("end", function() {
          console.log("done");
      });
   
  //stream.pipe(csvStream);
  res.sendStatus(200);
};

exports.viewTransactions = function(req, res) {
  Cart.find().sort('-created')
    .populate('user', 'username firstName lastName')
    .populate('items.item', 'name price itemImageURL').exec(function (err, carts) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      console.log(carts);
      res.json(carts);
    }
  });
};

var dir = './modules/messages/server/files/backup/';

exports.download = function(req, res) {
  var file_url = path.resolve(__dirname, '../../../messages/server/files/backup/', req.params.filename);
  delete req.params.filename;

  res.download(file_url, 'report.csv');
  //var filestream = fs.createReadStream(file_url);
  //filestream.pipe(fs.createOutputStream('./helloworld.csv'));
};

exports.backuplist = function (req, res) {
  console.log('Backup list');

  var fileArray = [];
  var fileWithStats = {name: '', size: '', created: ''};
  var filesWithStats = [];
  var c = 0;

  fs.readdir(dir, function(err, files){
    files.forEach(function(file){
      fs.stat(dir + file, function(err, stats){
        c++;  
        if(err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        }

        fileWithStats = {'name': file, 'size': stats.size, 'created': stats.birthtime};
        filesWithStats.push(fileWithStats);

        if(c === files.length)
          res.json(filesWithStats);
      });
    });
  });
};

exports.createNewBackUp = function (req, res) {
  var user = req.user, fileWithStats;

  console.log('Creating Backup!');

  Message.find().then(function(docs, err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    var today = new Date();
    today = today.toISOString();
    var fileName = today + 'WEB-POSTS.csv';

    Message.csvReadStream(docs)
      .pipe(fs.createOutputStream(dir + fileName));

      var  filesWithStats = [];
    fs.readdir(dir, function(err, files){
      fs.stat(dir + files[0], function(err, stats){
        if(err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        }

        fileWithStats = {'name': files[0], 'size': stats.size, 'created': stats.birthtime};
        filesWithStats.push(fileWithStats);

        res.json(filesWithStats[0]);
      });
    });

    //res.json({'file': 'dsadsad'});
  });
};

exports.signup = function (req, res) {
  // For security measurement we remove the roles from the req.body object
  var roles;
  if (req.body.roles) {
    if(req.body.roles.length === 2) {
      roles = req.body.roles;
      delete req.body.roles;
    }
    delete req.body.roles;
  }

  var dateObj = new Date(req.body.birthDate);

  if(!isValidDate(dateObj))
    return res.status(400).send({message: 'Birthday format is not valid! Please use MM/DD/YYYY'});

  var current_age = calculateAge(dateObj.getFullYear());

  if(current_age < 18) {
    return res.status(400).send({message: 'You must be at least 18 years old to register.'});
  }

  // Init Variables
  var user = new User(req.body);
  var message = null;

  // Add missing user fields
  user.provider = 'local';
  user.age = current_age;

  var maleItems = ['Mr','Sir','Senior','Count'];
  var femaleItems = ['Miss','Ms','Mrs','Madame','Majesty','Seniora'];

  if((maleItems.indexOf(user.salutation) >= 0 && user.gender.toLowerCase() === 'male') ||
     (femaleItems.indexOf(user.salutation) >= 0 && user.gender.toLowerCase() === 'female')) {
    console.log('Your gender is eligible');
  } else {
    return res.status(400).send({message: 'Incorrect Gender!'});
  }
  console.log(roles);
  if(roles)
    if(roles[1] === 'admin') {
      console.log('New Admin Registration!');
      user.roles = roles;
    }

  var clean = sanitizeHtml(user.aboutme, {
    allowedTags: [ 'b', 'i' ]
  });
  user.aboutme = clean;

  // Then save the user
  user.save(function (err) {
    if (err) {
      console.log(err);
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      // Remove sensitive data before login
      user.password = undefined;
      user.salt = undefined;

      res.sendStatus(200);
      /*
      req.login(user, function (err) {
        if (err) {
          res.status(400).send(err);
        } else {
          res.json(user);
        }
      });
      */
    }
  });
};

/**
 * Show the current user
 */
exports.read = function (req, res) {
  res.json(req.model);
};

/**
 * Update a User
 */
exports.update = function (req, res) {
  var user = req.model;

  //For security purposes only merge these parameters
  user.firstName = req.body.firstName;
  user.lastName = req.body.lastName;
  user.roles = req.body.roles;

  user.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    res.json(user);
  });
};

/**
 * Delete a user
 */
exports.delete = function (req, res) {
  var user = req.model;

  user.remove(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    res.json(user);
  });
};

/**
 * List of Users
 */
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
 * User middleware
 */
exports.userByID = function (req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'User is invalid'
    });
  }

  User.findById(id, '-salt -password').exec(function (err, user) {
    if (err) {
      return next(err);
    } else if (!user) {
      return next(new Error('Failed to load user ' + id));
    }

    req.model = user;
    next();
  });
};
