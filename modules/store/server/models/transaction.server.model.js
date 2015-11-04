'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;
  
/**
 * Transaction Schema
 */
var TransactionSchema = new Schema({
  items: [
    {
      item : {
        type: Schema.ObjectId,
        ref: 'Item'
      },
      quantity: {
        type: Number,
        required: 'Quantity cannot be blank'
      },
      totalPrice: {
        type: Number,
        required: 'Total Price must be computed'
      }
    }
  ],
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    default: '0'
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  created: {
    type: Date,
    default: Date.now
  },
  updated: {
    type: Date,
    default: Date.now
  }
});

mongoose.model('Transaction', TransactionSchema);