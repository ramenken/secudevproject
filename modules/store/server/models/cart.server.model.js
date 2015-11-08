'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;
  
/**
 * Article Schema
 */
var CartSchema = new Schema({
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
      /*
      _itemId: {
        type: Schema.Types.ObjectId
      },
      name: {
        type: String,
        trim: true,
        required: 'Item name cannot be blank'
      },
      itemImageURL: {
        type: String,
        required: 'Item image cannot be blank'
      },
      price: {
        type: Number,
        required: 'Price cannot be blank'
      },
      quantity: {
        type: Number,
        required: 'Quantity cannot be blank'
      },
      totalPrice: {
        type: Number,
        required: 'Total Price must be computed'
      }*/
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
  }
});

mongoose.model('Cart', CartSchema);