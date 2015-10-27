'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;
  
/**
 * Article Schema
 */
var ItemSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  name: {
    type: String,
    default: '',
    trim: true,
    required: 'Item name cannot be blank'
  },
  description: {
    type: String,
    default: '',
    trim: true,
    required: 'Description cannot be blank'
  },
  itemImageURL: {
    type: String,
    default: 'modules/store/client/img/items/default.png'
  },
  price: {
    type: Number,
    default: 0,
    required: 'Price cannot be blank'
  },
});

mongoose.model('Item', ItemSchema);
