const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  businessName: {
    type: String,
    required: true,
    trim: true
  },
  businessDescription: {
    type: String,
    trim: true
  },
  contactPerson: {
    type: String,
    required: true,
    trim: true
  },
  businessPhone: {
    type: String,
    required: true,
    trim: true
  },
  businessEmail: {
    type: String,
    required: true,
    trim: true
  },
  businessAddress: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  kraPin: {
    type: String,
    required: true,
    trim: true
  },
  businessLicense: {
    type: String, // URL to uploaded license document
    trim: true
  },
  idDocument: {
    type: String, // URL to uploaded ID document
    trim: true
  },
  bankDetails: {
    bankName: String,
    accountNumber: String,
    accountHolderName: String
  },
  storeDescription: {
    type: String,
    trim: true
  },
  storeLogo: {
    type: String, // URL to store logo
    trim: true
  },
  storeBanner: {
    type: String, // URL to store banner
    trim: true
  },
  commissionRate: {
    type: Number,
    default: 10, // Default 10% commission
    min: 0,
    max: 100
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  totalSales: {
    type: Number,
    default: 0
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
    default: false // Only active after admin approval
  }
}, {
  timestamps: true
});

// Index for search
sellerSchema.index({ businessName: 'text', storeDescription: 'text' });

module.exports = mongoose.model('Seller', sellerSchema);