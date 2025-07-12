const mongoose = require('mongoose');

const dealerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['dealer', 'private', 'auction', 'wholesaler'],
    default: 'dealer'
  },
  contact: {
    phone: String,
    email: {
      type: String,
      lowercase: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      zip: String
    }
  },
  dealHistory: [{
    dealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deal'
    },
    date: Date,
    amount: Number,
    vehicle: String
  }],
  notes: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Text index for search
dealerSchema.index({ 
  name: 'text', 
  company: 'text',
  'contact.email': 'text'
});

module.exports = mongoose.model('Dealer', dealerSchema); 