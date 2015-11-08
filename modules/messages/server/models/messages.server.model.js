'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  mongooseToCsv = require('mongoose-to-csv'),
  Schema = mongoose.Schema;

/**
 * Message Schema
 */
var MessageSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  content: {
    type: String,
    default: '',
    trim: true,
    required: 'You didn\'t supply any content for your post. It\'s also possible that your content was cleaned beucase of the following: unclosed tags, script tags, forbidden url, etc.'
  },
  attachedItems: [
    {
      item: {
        type: Schema.ObjectId,
        ref: 'Item'
      }
    }
  ],
  editedDate: {
    type: Date
  },
  username: {
    type: String,
    default: '',
    require: 'Username is required'
  },
  user: {
    /*
    _id: {
      type: Schema.ObjectId
      ref: 'User'
    },
    firstName: {
      type: String,
      trim: true
    },
    lastName: {
      type: String,
      trim: true
    },
    username: {
      type: String,
      trim: true
    },
    profileImageURL: {
      type: String
    },
    created: {
      type: Date
    }
    */
    type: Schema.ObjectId,
    ref: 'User'
  }
});

MessageSchema.plugin(mongooseToCsv, {
  headers: 'Username Content Date_Created',
  constraints: {
    'Username': 'username',
    'Content': 'content',
    'Date_Created': 'created'
  },
  //virtuals: {
  //  'username': function(doc) {
  //    return doc.user.username;
  //  }
  //}
});

mongoose.model('Message', MessageSchema);
