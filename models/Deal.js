const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
  // Basic Deal Information
  vehicle: {
    type: String,
    required: true,
    trim: true
  },
  vin: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  year: {
    type: Number,
    required: true
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
  stockNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  // Purchase Information
  purchasePrice: {
    type: Number,
    required: true
  },
  purchaseDate: {
    type: Date,
    required: true
  },
  listPrice: {
    type: Number,
    required: true
  },
  killPrice: {
    type: Number,
    required: true
  },

  // Seller Information
  seller: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['dealer', 'private', 'auction'],
      default: 'dealer'
    },
    contact: {
      address: String,
      phone: String,
      email: String
    },
    dealerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dealer'
    }
  },

  // Deal Classification
  dealType: {
    type: String,
    enum: ['wholesale', 'retail', 'consignment'],
    default: 'retail'
  },
  fundingSource: String,
  paymentMethod: String,

  // Back Office Workflow
  currentStage: {
    type: String,
    enum: ['documentation', 'verification', 'processing', 'completion'],
    default: 'documentation'
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Document Tracking
  documents: [{
    type: {
      type: String,
      required: true
    },
    fileName: String,
    filePath: String,
    fileSize: Number,
    mimeType: String,
    uploaded: {
      type: Boolean,
      default: false
    },
    uploadedAt: Date,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approved: {
      type: Boolean,
      default: false
    },
    approvedAt: Date,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    required: {
      type: Boolean,
      default: true
    },
    notes: String,
    expirationDate: Date,
    version: {
      type: Number,
      default: 1
    }
  }],

  // Title Information
  titleInfo: {
    status: {
      type: String,
      enum: ['clean', 'lien', 'salvage', 'flood', 'pending'],
      default: 'pending'
    },
    state: String,
    titleNumber: String,
    lienHolder: String,
    lienAmount: Number,
    titleReceived: {
      type: Boolean,
      default: false
    },
    titleReceivedDate: Date,
    titleNotes: String
  },

  // Financial Status
  financial: {
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'partial'],
      default: 'pending'
    },
    payoffBalance: Number,
    amountDueToCustomer: Number,
    amountDueToRP: Number,
    commission: {
      rate: Number,
      amount: Number,
      paidTo: String
    }
  },

  // Compliance & Legal
  compliance: {
    contractSigned: {
      type: Boolean,
      default: false
    },
    contractDate: Date,
    driversLicenseVerified: {
      type: Boolean,
      default: false
    },
    odometerVerified: {
      type: Boolean,
      default: false
    },
    dealerLicenseVerified: {
      type: Boolean,
      default: false
    },
    insuranceVerified: {
      type: Boolean,
      default: false
    },
    inspectionCompleted: {
      type: Boolean,
      default: false
    },
    inspectionDate: Date
  },

  // Workflow History
  workflowHistory: [{
    stage: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    notes: String,
    previousStage: String
  }],

  // Activity Log
  activityLog: [{
    action: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    description: String,
    metadata: mongoose.Schema.Types.Mixed
  }],

  // System Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for performance
dealSchema.index({ vin: 1 });
dealSchema.index({ stockNumber: 1 });
dealSchema.index({ currentStage: 1 });
dealSchema.index({ assignedTo: 1 });
dealSchema.index({ purchaseDate: -1 });
dealSchema.index({ 'seller.name': 'text', vehicle: 'text' });

// Virtual for completion percentage
dealSchema.virtual('completionPercentage').get(function() {
  const requiredDocuments = this.documents.filter(doc => doc.required);
  const approvedDocuments = requiredDocuments.filter(doc => doc.approved);
  
  if (requiredDocuments.length === 0) return 0;
  return Math.round((approvedDocuments.length / requiredDocuments.length) * 100);
});

// Virtual for pending documents count
dealSchema.virtual('pendingDocumentsCount').get(function() {
  return this.documents.filter(doc => doc.required && !doc.approved).length;
});

// Virtual for overdue documents
dealSchema.virtual('overdueDocuments').get(function() {
  const now = new Date();
  return this.documents.filter(doc => 
    doc.required && 
    !doc.approved && 
    doc.expirationDate && 
    doc.expirationDate < now
  );
});

// Ensure virtuals are serialized
dealSchema.set('toJSON', { virtuals: true });
dealSchema.set('toObject', { virtuals: true });

// Pre-save middleware to add workflow history
dealSchema.pre('save', function(next) {
  if (this.isModified('currentStage')) {
    this.workflowHistory.push({
      stage: this.currentStage,
      timestamp: new Date(),
      changedBy: this.updatedBy || this.createdBy,
      notes: 'Stage updated',
      previousStage: this._original?.currentStage || 'initial'
    });
  }
  next();
});

module.exports = mongoose.model('Deal', dealSchema); 