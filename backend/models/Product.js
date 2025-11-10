const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  images: [{
    type: String,
    trim: true
  }],
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  brand: {
    type: String,
    trim: true
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  numReviews: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  attributes: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    values: [{
      type: String,
      required: true,
      trim: true
    }]
  }],
  flashSale: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FlashSale'
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: false
  },
  fulfillmentType: {
    type: String,
    enum: ['galyan', 'seller'],
    default: 'galyan'
  },
  shippingInfo: {
    origin: {
      type: String,
      trim: true
    },
    deliveryDays: {
      type: Number,
      min: 1,
      max: 90
    }
  }
}, {
  timestamps: true
});

// Index for search functionality
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);