const express = require('express');
const router = express.Router();
const Dealer = require('../models/Dealer');

// GET /api/dealers - Get all dealers with filtering, sorting, and pagination
router.get('/', async (req, res) => {
  try {
    const { 
      search, 
      type, 
      status, 
      state, 
      rating, 
      sortBy = 'name', 
      sortOrder = 'asc',
      page = 1,
      limit = 50
    } = req.query;

    let query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { 'contact.location': { $regex: search, $options: 'i' } },
        { specialties: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Filter by type
    if (type) {
      query.type = type;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by state
    if (state) {
      query['contact.location'] = { $regex: state, $options: 'i' };
    }

    // Filter by rating
    if (rating) {
      query['performance.rating'] = { $gte: parseFloat(rating) };
    }

    // Build sort object
    let sort = {};
    switch (sortBy) {
      case 'name':
        sort.name = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'rating':
        sort['performance.rating'] = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'deals':
        sort['performance.totalDeals'] = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'volume':
        sort['performance.totalVolume'] = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'lastDeal':
        sort['recentDeals.date'] = sortOrder === 'desc' ? -1 : 1;
        break;
      default:
        sort.name = 1;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const dealers = await Dealer.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Dealer.countDocuments(query);

    // Transform dealers to match frontend expectations
    const transformedDealers = dealers.map(dealer => ({
      id: dealer._id.toString(),
      name: dealer.name,
      company: dealer.company || dealer.name,
      type: dealer.type,
      status: dealer.status,
      contact: dealer.contact,
      location: dealer.contact?.location || '',
      phone: dealer.contact?.phone || '',
      email: dealer.contact?.email || '',
      address: dealer.contact?.address || '',
      rating: dealer.performance?.rating || 0,
      totalDeals: dealer.performance?.totalDeals || 0,
      totalVolume: dealer.performance?.totalVolume || 0,
      avgDealSize: dealer.performance?.avgDealSize || 0,
      responseTime: dealer.performance?.responseTime || 'N/A',
      successRate: dealer.performance?.successRate || 0,
      specialties: dealer.specialties || [],
      notes: dealer.notes || '',
      recentDeals: dealer.recentDeals || [],
      lastDeal: dealer.lastDeal,
      createdAt: dealer.createdAt,
      updatedAt: dealer.updatedAt,
      createdBy: dealer.createdBy
    }));

    res.json({
      success: true,
      data: transformedDealers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting dealers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/dealers/search - Search dealers for autocomplete
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === '') {
      return res.json({ dealers: [] });
    }

    // Search by name, company, or contact info
    const dealers = await Dealer.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { company: { $regex: q, $options: 'i' } },
        { 'contact.email': { $regex: q, $options: 'i' } },
        { 'contact.phone': { $regex: q, $options: 'i' } }
      ]
    }).limit(10).sort({ name: 1 });

    // Transform dealers to match frontend expectations
    const transformedDealers = dealers.map(dealer => ({
      id: dealer._id.toString(),
      name: dealer.name,
      company: dealer.company || dealer.name,
      location: dealer.contact?.location || '',
      phone: dealer.contact?.phone || '',
      email: dealer.contact?.email || ''
    }));

    res.json({ dealers: transformedDealers });
  } catch (error) {
    console.error('Error searching dealers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/dealers/:id - Get dealer by ID
router.get('/:id', async (req, res) => {
  try {
    const dealer = await Dealer.findById(req.params.id);
    if (!dealer) {
      return res.status(404).json({ error: 'Dealer not found' });
    }

    // Transform dealer to match frontend expectations
    const transformedDealer = {
      id: dealer._id.toString(),
      name: dealer.name,
      company: dealer.company || dealer.name,
      type: dealer.type,
      status: dealer.status,
      contact: dealer.contact,
      location: dealer.contact?.location || '',
      phone: dealer.contact?.phone || '',
      email: dealer.contact?.email || '',
      address: dealer.contact?.address || '',
      rating: dealer.performance?.rating || 0,
      totalDeals: dealer.performance?.totalDeals || 0,
      totalVolume: dealer.performance?.totalVolume || 0,
      avgDealSize: dealer.performance?.avgDealSize || 0,
      responseTime: dealer.performance?.responseTime || 'N/A',
      successRate: dealer.performance?.successRate || 0,
      specialties: dealer.specialties || [],
      notes: dealer.notes || '',
      recentDeals: dealer.recentDeals || [],
      lastDeal: dealer.lastDeal,
      createdAt: dealer.createdAt,
      updatedAt: dealer.updatedAt,
      createdBy: dealer.createdBy
    };

    res.json({ success: true, data: transformedDealer });
  } catch (error) {
    console.error('Error getting dealer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/dealers/:id/deals - Get dealer's deal history
router.get('/:id/deals', async (req, res) => {
  try {
    const dealer = await Dealer.findById(req.params.id);
    if (!dealer) {
      return res.status(404).json({ error: 'Dealer not found' });
    }

    res.json({
      success: true,
      data: dealer.recentDeals || []
    });
  } catch (error) {
    console.error('Error getting dealer deals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/dealers - Create new dealer
router.post('/', async (req, res) => {
  try {
    const { 
      name, 
      company, 
      type, 
      contact, 
      performance, 
      status, 
      specialties, 
      notes 
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Dealer name is required' });
    }

    // Check for existing dealer by name/email
    const existing = await Dealer.findOne({
      $or: [
        { name: new RegExp(`^${name}$`, 'i') },
        { 'contact.email': contact?.email?.toLowerCase() }
      ]
    });

    if (existing) {
      return res.status(409).json({ error: 'Dealer already exists' });
    }

    const dealer = new Dealer({
      name,
      company,
      type,
      contact,
      performance,
      status,
      specialties,
      notes,
      createdBy: req.user?.id || null
    });

    await dealer.save();

    // Transform dealer for response
    const transformedDealer = {
      id: dealer._id.toString(),
      name: dealer.name,
      company: dealer.company || dealer.name,
      type: dealer.type,
      status: dealer.status,
      contact: dealer.contact,
      location: dealer.contact?.location || '',
      phone: dealer.contact?.phone || '',
      email: dealer.contact?.email || '',
      address: dealer.contact?.address || '',
      rating: dealer.performance?.rating || 0,
      totalDeals: dealer.performance?.totalDeals || 0,
      totalVolume: dealer.performance?.totalVolume || 0,
      avgDealSize: dealer.performance?.avgDealSize || 0,
      responseTime: dealer.performance?.responseTime || 'N/A',
      successRate: dealer.performance?.successRate || 0,
      specialties: dealer.specialties || [],
      notes: dealer.notes || '',
      recentDeals: dealer.recentDeals || [],
      lastDeal: dealer.lastDeal,
      createdAt: dealer.createdAt,
      updatedAt: dealer.updatedAt
    };

    res.status(201).json({
      success: true,
      message: 'Dealer created successfully',
      data: transformedDealer
    });
  } catch (error) {
    console.error('Error creating dealer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/dealers/:id - Update dealer
router.put('/:id', async (req, res) => {
  try {
    const dealer = await Dealer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!dealer) {
      return res.status(404).json({ error: 'Dealer not found' });
    }

    // Transform dealer for response
    const transformedDealer = {
      id: dealer._id.toString(),
      name: dealer.name,
      company: dealer.company || dealer.name,
      type: dealer.type,
      status: dealer.status,
      contact: dealer.contact,
      location: dealer.contact?.location || '',
      phone: dealer.contact?.phone || '',
      email: dealer.contact?.email || '',
      address: dealer.contact?.address || '',
      rating: dealer.performance?.rating || 0,
      totalDeals: dealer.performance?.totalDeals || 0,
      totalVolume: dealer.performance?.totalVolume || 0,
      avgDealSize: dealer.performance?.avgDealSize || 0,
      responseTime: dealer.performance?.responseTime || 'N/A',
      successRate: dealer.performance?.successRate || 0,
      specialties: dealer.specialties || [],
      notes: dealer.notes || '',
      recentDeals: dealer.recentDeals || [],
      lastDeal: dealer.lastDeal,
      createdAt: dealer.createdAt,
      updatedAt: dealer.updatedAt,
      createdBy: dealer.createdBy
    };

    res.json({
      success: true,
      message: 'Dealer updated successfully',
      data: transformedDealer
    });
  } catch (error) {
    console.error('Error updating dealer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/dealers/:id - Delete dealer
router.delete('/:id', async (req, res) => {
  try {
    const dealer = await Dealer.findByIdAndDelete(req.params.id);
    if (!dealer) {
      return res.status(404).json({ error: 'Dealer not found' });
    }

    res.json({
      success: true,
      message: 'Dealer deleted successfully',
      data: { id: dealer._id.toString() }
    });
  } catch (error) {
    console.error('Error deleting dealer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 