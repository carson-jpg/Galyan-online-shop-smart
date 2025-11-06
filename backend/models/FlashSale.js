const mongoose = require('mongoose');

const flashSaleSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  flashPrice: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  soldQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'sold_out'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
flashSaleSchema.index({ status: 1, endTime: 1 });
flashSaleSchema.index({ product: 1 });

// Virtual for remaining quantity
flashSaleSchema.virtual('remainingQuantity').get(function() {
  return this.quantity - this.soldQuantity;
});

// Virtual for isExpired
flashSaleSchema.virtual('isExpired').get(function() {
  return new Date() > this.endTime;
});

// Virtual for isSoldOut
flashSaleSchema.virtual('isSoldOut').get(function() {
  return this.soldQuantity >= this.quantity;
});

// Pre-save middleware to set endTime to 1 hour from startTime
flashSaleSchema.pre('save', function(next) {
  if (this.isNew && !this.endTime) {
    this.endTime = new Date(this.startTime.getTime() + 60 * 60 * 1000); // 1 hour
  }
  next();
});

// Static method to update expired flash sales
flashSaleSchema.statics.updateExpiredSales = async function() {
  const now = new Date();
  await this.updateMany(
    { endTime: { $lt: now }, status: 'active' },
    { status: 'expired' }
  );
};

// Static method to update sold out flash sales
flashSaleSchema.statics.updateSoldOutSales = async function() {
  await this.updateMany(
    { $expr: { $gte: ['$soldQuantity', '$quantity'] }, status: 'active' },
    { status: 'sold_out' }
  );
};

module.exports = mongoose.model('FlashSale', flashSaleSchema);