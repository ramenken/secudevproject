'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  crypto = require('crypto'),
  validator = require('validator');

/**
 * A Validation function for local strategy properties
 */
var validateLocalStrategyProperty = function (property) {
  return ((this.provider !== 'local' && !this.updated) || property.length);
};

/**
 * A Validation function for local strategy password
 */
var validateLocalStrategyPassword = function (password) {
  return (this.provider !== 'local' || validator.isLength(password, 6));
};

/**
 * A Validation function for local strategy email
 */
//var validateLocalStrategyEmail = function (email) {
//  return ((this.provider !== 'local' && !this.updated) || validator.isEmail(email));
//};

/**
 * A Validation function for local strategy birthday
 */
var validateLocalStrategyBirthday = function (birthday) {
  return ((this.provider !== 'local' && !this.updated) || validator.isDate(birthday));
};

var isNameValid = function(name) {
  if(name.length <= 50 && name.length && /^[A-Za-z\d\s]+$/.test(name)) {
    return true;
  }
  return false;
};

var isValidAboutMe = function(aboutme) {
  // For display purposes
  var bannedTags = ['<script>', '/api/auth/signout', 'javascript', 'onclick'];

  for(var i = 0; i < bannedTags.length; i++) {
    if(aboutme.toLowerCase().indexOf(bannedTags[i]) >= 0) {
      return false;
    }
  }
  return true;
};

var isValidUsername = function(username) {
  if(/^[a-zA-Z0-9_]+$/.test(username) && username.length <= 50) {
    return true;
  }
  return false;
};

var isEighteen = function(age) {
  return age >= 18;
};

/**
 * User Schema
 */
var UserSchema = new Schema({
  firstName: {
    type: String,
    trim: true,
    default: '',
    validate: [isNameValid, 'Please enter a valid first name'],
    required: 'Please enter first name'
  },
  lastName: {
    type: String,
    trim: true,
    default: '',
    validate: [isNameValid, 'Please enter a valid last name'],
    required: 'Please enter first name'
  },
  gender: {
		type: String,
		default: 'Male'
	},
	salutation: {
		type: String,
		default: 'Mr.',
		required: 'Please select a salutation'
	},
  birthDate: {
    type: Date,
    required: 'Please specify the date'
  },
  age: {
    type: Number,
    validate: [isEighteen, 'You must be at least 18 years old to register.'],
    required: 'No age detected'
  },
	aboutme: {
		type: String,
		default: '',
    trim: true,
    validate: [isValidAboutMe, 'Malicious code found!'],
    required: 'Please enter a short description'
	},
  username: {
    type: String,
    unique: 'Username already exists',
    trim: true,
    validate: [isValidUsername, 'Please enter a valid username'],
    required: 'Please fill in a username'
  },
  password: {
    type: String,
    default: ''
  },
  salt: {
    type: String
  },
  profileImageURL: {
    type: String,
    default: 'modules/users/client/img/profile/default.png'
  },
  provider: {
    type: String,
    required: 'Provider is required'
  },
  providerData: {},
  additionalProvidersData: {},
  roles: {
    type: [{
      type: String,
      enum: ['user', 'admin']
    }],
    default: ['user'],
    required: 'Please provide at least one role'
  },
  updated: {
    type: Date
  },
  created: {
    type: Date,
    default: Date.now
  },
  /* For reset password */
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  }
});

/**
 * Hook a pre save method to hash the password
 */
UserSchema.pre('save', function (next) {
  if (this.password && this.isModified('password') && this.password.length >= 6) {
    this.salt = crypto.randomBytes(16).toString('base64');
    this.password = this.hashPassword(this.password);
  }

  next();
});

/**
 * Create instance method for hashing a password
 */
UserSchema.methods.hashPassword = function (password) {
  if (this.salt && password) {
    return crypto.pbkdf2Sync(password, new Buffer(this.salt, 'base64'), 10000, 64).toString('base64');
  } else {
    return password;
  }
};

/**
 * Create instance method for authenticating user
 */
UserSchema.methods.authenticate = function (password) {
  return this.password === this.hashPassword(password);
};

/**
 * Find possible not used username
 */
UserSchema.statics.findUniqueUsername = function (username, suffix, callback) {
  var _this = this;
  var possibleUsername = username.toLowerCase() + (suffix || '');

  _this.findOne({
    username: possibleUsername
  }, function (err, user) {
    if (!err) {
      if (!user) {
        callback(possibleUsername);
      } else {
        return _this.findUniqueUsername(username, (suffix || 0) + 1, callback);
      }
    } else {
      callback(null);
    }
  });
};

mongoose.model('User', UserSchema);
