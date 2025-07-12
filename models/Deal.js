const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
  // Vehicle Information
  vin: {
    type: String,
    required: true,
    length: 17,
    uppercase: true
  },
  year: {
    type: Number,
    required: true,
    min: 1900,
    max: new Date().getFullYear() + 2
  },
  make: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    required: true,
    trim: true
  },
  mileage: {
    type: Number,
    min: 0
  },
  exteriorColor: String,
  interiorColor: String,
  numberOfKeys: {
    type: Number,
    min: 0,
    max: 10
  },
  
  // Deal Information
  dealType: {
    type: String,
    required: true,
    enum: ['wholesale-d2d', 'wholesale-private', 'wholesale-flip', 'retail-pp', 'retail-auction', 'retail-dtod', 'auction']
  },
  fundingSource: {
    type: String,
    required: true,
    enum: ['flpn-retail', 'flpn-wholesale', 'cash', 'flooring-line', 'consignment']
  },
  purchaseDate: {
    type: Date,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['check', 'wire', 'ach', 'cash', 'financed']
  },
  currentStage: {
    type: String,
    required: true,
    enum: ['initial-contact', 'price-negotiated', 'inspection-scheduled', 'inspection-complete', 'purchased', 'title-processing', 'title-received', 'ready-to-list', 'listed', 'sold', 'delivered'],
    default: 'initial-contact'
  },
  
  // Financial Information
  financial: {
    purchasePrice: {
      type: Number,
      min: 0
    },
    listPrice: {
      type: Number,
      min: 0
    },
    killPrice: {
      type: Number,
      min: 0
    },
    wholesalePrice: {
      type: Number,
      min: 0
    },
    commissionRate: {
      type: Number,
      min: 0,
      max: 100
    },
    brokerageFee: {
      type: Number,
      min: 0
    },
    brokeerageFeePaidTo: String,
    payoffBalance: {
      type: Number,
      min: 0
    },
    amountDueToCustomer: Number,
    amountDueToRP: Number
  },
  
  // Seller Information
  seller: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    company: String,
    address: String,
    phone: String,
    email: {
      type: String,
      lowercase: true,
      validate: {
        validator: function(v) {
          return !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: 'Please enter a valid email'
      }
    }
  },
  
  // RP Information
  rpStockNumber: {
    type: String
  },
  vehicleDescription: String,
  generalNotes: String,
  
  // Documentation
  documentation: {
    contractRequired: {
      type: Boolean,
      default: false
    },
    titlePresent: {
      type: Boolean,
      default: false
    },
    driverLicensePresent: {
      type: Boolean,
      default: false
    },
    odometerPresent: {
      type: Boolean,
      default: false
    },
    dealerLicensePresent: {
      type: Boolean,
      default: false
    }
  },
  
  // System Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isDraft: {
    type: Boolean,
    default: false
  },
  
  // VIN Decode Data
  vinDecodeData: {
    trim: String,
    bodyStyle: String,
    engine: String,
    transmission: String,
    driveType: String,
    decodedAt: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
dealSchema.index({ vin: 1 });
dealSchema.index({ rpStockNumber: 1 });
dealSchema.index({ createdBy: 1 });
dealSchema.index({ currentStage: 1 });
dealSchema.index({ dealType: 1 });
dealSchema.index({ isDraft: 1 });

// Virtual for profit calculation
dealSchema.virtual('profit').get(function() {
  if (this.financial.listPrice && this.financial.purchasePrice) {
    return this.financial.listPrice - this.financial.purchasePrice;
  }
  return null;
});

// Pre-save middleware to generate stock number
dealSchema.pre('save', async function(next) {
  if (!this.rpStockNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      rpStockNumber: { $regex: `^RP${year}` }
    });
    this.rpStockNumber = `RP${year}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});



module.exports = mongoose.model('Deal', dealSchema); 