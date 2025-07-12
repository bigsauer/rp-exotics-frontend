const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const Deal = require('../models/Deal');
const DocumentType = require('../models/DocumentType');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/documents');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and images are allowed.'), false);
    }
  }
});

// ============================================================================
// GET ROUTES
// ============================================================================

// Get all deals for back office with filtering
router.get('/deals', async (req, res) => {
  try {
    const { 
      search, 
      stage, 
      priority, 
      assignedTo, 
      dateFrom, 
      dateTo,
      page = 1, 
      limit = 20 
    } = req.query;

    let query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { vehicle: new RegExp(search, 'i') },
        { stockNumber: new RegExp(search, 'i') },
        { vin: new RegExp(search, 'i') },
        { 'seller.name': new RegExp(search, 'i') }
      ];
    }

    // Filters
    if (stage) query.currentStage = stage;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;
    
    if (dateFrom || dateTo) {
      query.purchaseDate = {};
      if (dateFrom) query.purchaseDate.$gte = new Date(dateFrom);
      if (dateTo) query.purchaseDate.$lte = new Date(dateTo);
    }

    const deals = await Deal.find(query)
      .populate('assignedTo', 'profile.displayName email')
      .populate('seller.dealerId', 'name company')
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Deal.countDocuments(query);

    // Transform deals for frontend
    const transformedDeals = deals.map(deal => ({
      id: deal._id.toString(),
      vehicle: deal.vehicle,
      vin: deal.vin,
      stockNumber: deal.stockNumber,
      purchaseDate: deal.purchaseDate,
      purchasePrice: deal.purchasePrice,
      currentStage: deal.currentStage,
      priority: deal.priority,
      assignedTo: deal.assignedTo,
      seller: deal.seller,
      completionPercentage: deal.completionPercentage,
      pendingDocumentsCount: deal.pendingDocumentsCount,
      overdueDocuments: deal.overdueDocuments,
      titleInfo: deal.titleInfo,
      financial: deal.financial,
      compliance: deal.compliance,
      createdAt: deal.createdAt,
      updatedAt: deal.updatedAt
    }));

    res.json({
      success: true,
      data: transformedDeals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting deals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific deal with full documentation details
router.get('/deals/:id', async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id)
      .populate('assignedTo', 'profile.displayName email')
      .populate('seller.dealerId', 'name company contact')
      .populate('documents.uploadedBy', 'profile.displayName')
      .populate('documents.approvedBy', 'profile.displayName')
      .populate('workflowHistory.changedBy', 'profile.displayName')
      .populate('activityLog.userId', 'profile.displayName');

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    // Transform deal for frontend
    const transformedDeal = {
      id: deal._id.toString(),
      vehicle: deal.vehicle,
      vin: deal.vin,
      year: deal.year,
      make: deal.make,
      model: deal.model,
      stockNumber: deal.stockNumber,
      purchasePrice: deal.purchasePrice,
      purchaseDate: deal.purchaseDate,
      listPrice: deal.listPrice,
      killPrice: deal.killPrice,
      seller: deal.seller,
      dealType: deal.dealType,
      fundingSource: deal.fundingSource,
      paymentMethod: deal.paymentMethod,
      currentStage: deal.currentStage,
      priority: deal.priority,
      assignedTo: deal.assignedTo,
      documents: deal.documents,
      titleInfo: deal.titleInfo,
      financial: deal.financial,
      compliance: deal.compliance,
      workflowHistory: deal.workflowHistory,
      activityLog: deal.activityLog,
      completionPercentage: deal.completionPercentage,
      pendingDocumentsCount: deal.pendingDocumentsCount,
      overdueDocuments: deal.overdueDocuments,
      createdAt: deal.createdAt,
      updatedAt: deal.updatedAt,
      createdBy: deal.createdBy,
      updatedBy: deal.updatedBy
    };

    res.json({ success: true, data: transformedDeal });
  } catch (error) {
    console.error('Error getting deal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get document types configuration
router.get('/document-types', async (req, res) => {
  try {
    const documentTypes = await DocumentType.find({ isActive: true })
      .sort({ order: 1, name: 1 });
    
    res.json({ success: true, data: documentTypes });
  } catch (error) {
    console.error('Error getting document types:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get back office dashboard statistics
router.get('/dashboard/stats', async (req, res) => {
  try {
    const stats = await Deal.aggregate([
      {
        $group: {
          _id: '$currentStage',
          count: { $sum: 1 }
        }
      }
    ]);

    const pendingTasks = await Deal.aggregate([
      {
        $match: {
          currentStage: { $ne: 'completion' }
        }
      },
      {
        $project: {
          pendingDocs: {
            $size: {
              $filter: {
                input: '$documents',
                cond: { $and: [{ $eq: ['$$this.required', true] }, { $eq: ['$$this.approved', false] }] }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          totalPendingTasks: { $sum: '$pendingDocs' }
        }
      }
    ]);

    const priorityStats = await Deal.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        stageDistribution: stats,
        pendingTasks: pendingTasks[0]?.totalPendingTasks || 0,
        priorityDistribution: priorityStats
      }
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// POST ROUTES
// ============================================================================

// Upload document for a deal
router.post('/deals/:id/documents/:documentType/upload',
  upload.single('document'),
  async (req, res) => {
    try {
      const { id, documentType } = req.params;
      const { notes } = req.body;

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const deal = await Deal.findById(id);
      if (!deal) {
        return res.status(404).json({ error: 'Deal not found' });
      }

      // Get document type configuration
      const docTypeConfig = await DocumentType.findOne({ type: documentType });
      if (!docTypeConfig) {
        return res.status(400).json({ error: 'Invalid document type' });
      }

      // Check if document already exists and update or create new
      const existingDocIndex = deal.documents.findIndex(doc => doc.type === documentType);
      
      const newDocument = {
        type: documentType,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploaded: true,
        uploadedAt: new Date(),
        uploadedBy: req.user?.id || null,
        approved: false,
        required: docTypeConfig.required,
        notes: notes || '',
        version: existingDocIndex >= 0 ? deal.documents[existingDocIndex].version + 1 : 1
      };

      if (existingDocIndex >= 0) {
        deal.documents[existingDocIndex] = newDocument;
      } else {
        deal.documents.push(newDocument);
      }

      // Add activity log entry
      deal.activityLog.push({
        action: 'document_uploaded',
        timestamp: new Date(),
        userId: req.user?.id || null,
        description: `Uploaded ${docTypeConfig.name}`,
        metadata: { documentType, fileName: req.file.originalname }
      });

      deal.updatedAt = new Date();
      deal.updatedBy = req.user?.id || null;

      await deal.save();

      res.json({ 
        success: true,
        message: 'Document uploaded successfully', 
        data: newDocument 
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ============================================================================
// PUT ROUTES
// ============================================================================

// Update deal stage
router.put('/deals/:id/stage', async (req, res) => {
  try {
    const { id } = req.params;
    const { stage, notes } = req.body;

    const validStages = ['documentation', 'verification', 'processing', 'completion'];
    if (!validStages.includes(stage)) {
      return res.status(400).json({ error: 'Invalid stage' });
    }

    const deal = await Deal.findById(id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const previousStage = deal.currentStage;
    deal.currentStage = stage;

    // Add to workflow history
    deal.workflowHistory.push({
      stage,
      timestamp: new Date(),
      changedBy: req.user?.id || null,
      notes: notes || '',
      previousStage
    });

    // Add activity log entry
    deal.activityLog.push({
      action: 'stage_changed',
      timestamp: new Date(),
      userId: req.user?.id || null,
      description: `Stage changed from ${previousStage} to ${stage}`,
      metadata: { previousStage, newStage: stage, notes }
    });

    deal.updatedAt = new Date();
    deal.updatedBy = req.user?.id || null;

    await deal.save();

    res.json({ 
      success: true,
      message: 'Deal stage updated successfully', 
      data: deal 
    });
  } catch (error) {
    console.error('Error updating deal stage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve or reject document
router.put('/deals/:id/documents/:documentType/approval', async (req, res) => {
  try {
    const { id, documentType } = req.params;
    const { approved, notes } = req.body;

    const deal = await Deal.findById(id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const documentIndex = deal.documents.findIndex(doc => doc.type === documentType);
    if (documentIndex === -1) {
      return res.status(404).json({ error: 'Document not found' });
    }

    deal.documents[documentIndex].approved = approved;
    deal.documents[documentIndex].approvedAt = new Date();
    deal.documents[documentIndex].approvedBy = req.user?.id || null;
    if (notes) {
      deal.documents[documentIndex].notes = notes;
    }

    // Add activity log entry
    deal.activityLog.push({
      action: approved ? 'document_approved' : 'document_rejected',
      timestamp: new Date(),
      userId: req.user?.id || null,
      description: `${approved ? 'Approved' : 'Rejected'} ${documentType}`,
      metadata: { documentType, approved, notes }
    });

    deal.updatedAt = new Date();
    deal.updatedBy = req.user?.id || null;

    await deal.save();

    res.json({ 
      success: true,
      message: `Document ${approved ? 'approved' : 'rejected'} successfully`, 
      data: deal.documents[documentIndex] 
    });
  } catch (error) {
    console.error('Error updating document approval:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update title information
router.put('/deals/:id/title', async (req, res) => {
  try {
    const { id } = req.params;
    const titleData = req.body;

    const deal = await Deal.findById(id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    // Update title information
    deal.titleInfo = { ...deal.titleInfo, ...titleData };

    // Add activity log entry
    deal.activityLog.push({
      action: 'title_updated',
      timestamp: new Date(),
      userId: req.user?.id || null,
      description: 'Title information updated',
      metadata: titleData
    });

    deal.updatedAt = new Date();
    deal.updatedBy = req.user?.id || null;

    await deal.save();

    res.json({ 
      success: true,
      message: 'Title information updated successfully', 
      data: deal.titleInfo 
    });
  } catch (error) {
    console.error('Error updating title info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Assign deal to user
router.put('/deals/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;

    const deal = await Deal.findById(id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const previousAssignee = deal.assignedTo;
    deal.assignedTo = assignedTo;

    // Add activity log entry
    deal.activityLog.push({
      action: 'deal_assigned',
      timestamp: new Date(),
      userId: req.user?.id || null,
      description: `Deal assigned to user`,
      metadata: { previousAssignee, newAssignee: assignedTo }
    });

    deal.updatedAt = new Date();
    deal.updatedBy = req.user?.id || null;

    await deal.save();

    res.json({ 
      success: true,
      message: 'Deal assigned successfully', 
      data: deal 
    });
  } catch (error) {
    console.error('Error assigning deal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update compliance information
router.put('/deals/:id/compliance', async (req, res) => {
  try {
    const { id } = req.params;
    const complianceData = req.body;

    const deal = await Deal.findById(id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    // Update compliance information
    deal.compliance = { ...deal.compliance, ...complianceData };

    // Add activity log entry
    deal.activityLog.push({
      action: 'compliance_updated',
      timestamp: new Date(),
      userId: req.user?.id || null,
      description: 'Compliance information updated',
      metadata: complianceData
    });

    deal.updatedAt = new Date();
    deal.updatedBy = req.user?.id || null;

    await deal.save();

    res.json({ 
      success: true,
      message: 'Compliance information updated successfully', 
      data: deal.compliance 
    });
  } catch (error) {
    console.error('Error updating compliance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// DELETE ROUTES
// ============================================================================

// Delete document
router.delete('/deals/:id/documents/:documentType', async (req, res) => {
  try {
    const { id, documentType } = req.params;

    const deal = await Deal.findById(id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const documentIndex = deal.documents.findIndex(doc => doc.type === documentType);
    if (documentIndex === -1) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Remove file from filesystem
    const filePath = deal.documents[documentIndex].filePath;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove document from array
    deal.documents.splice(documentIndex, 1);

    // Add activity log entry
    deal.activityLog.push({
      action: 'document_deleted',
      timestamp: new Date(),
      userId: req.user?.id || null,
      description: `Deleted ${documentType} document`,
      metadata: { documentType }
    });

    deal.updatedAt = new Date();
    deal.updatedBy = req.user?.id || null;

    await deal.save();

    res.json({ 
      success: true,
      message: 'Document deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// UTILITY ROUTES
// ============================================================================

// Get document file
router.get('/deals/:id/documents/:documentType/download', async (req, res) => {
  try {
    const { id, documentType } = req.params;

    const deal = await Deal.findById(id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const document = deal.documents.find(doc => doc.type === documentType);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.download(document.filePath, document.fileName);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 