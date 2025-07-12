const express = require('express');
const router = express.Router();
const Dealer = require('../models/Dealer');

// GET /api/dealers - Get all dealers
router.get('/', async (req, res) => {
  try {
    const { search, type, status } = req.query;
    let query = {};

    if (search) {
      query.$text = { $search: search };
    }
    if (type) {
      query.type = type;
    }
    if (status) {
      query.isActive = status === 'active';
    }

    const dealers = await Dealer.find(query).sort({ name: 1 });
    res.json({
      success: true,
      data: dealers,
      count: dealers.length
    });
  } catch (error) {
    console.error('Error getting dealers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/dealers/search - Search dealers (must come before /:id route)
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === '') {
      return res.json({
        success: true,
        data: [],
        count: 0
      });
    }

    // Search by name, company, or contact info
    const dealers = await Dealer.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { company: { $regex: q, $options: 'i' } },
        { 'contact.person': { $regex: q, $options: 'i' } },
        { 'contact.email': { $regex: q, $options: 'i' } }
      ]
    }).limit(10).sort({ name: 1 });

    res.json({
      success: true,
      data: dealers,
      count: dealers.length
    });
  } catch (error) {
    console.error('Error searching dealers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/dealers/:id - Get dealer by ID (must come after /search route)
router.get('/:id', async (req, res) => {
  try {
    const dealer = await Dealer.findById(req.params.id);
    if (!dealer) {
      return res.status(404).json({ error: 'Dealer not found' });
    }
    res.json({ success: true, data: dealer });
  } catch (error) {
    console.error('Error getting dealer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/dealers - Create new dealer
router.post('/', async (req, res) => {
  try {
    const { name, company, type, contact, notes } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Dealer name is required' });
    }
    // Check for existing dealer by name/email
    const existing = await Dealer.findOne({
      name: new RegExp(`^${name}$`, 'i'),
      'contact.email': contact?.email?.toLowerCase() || undefined
    });
    if (existing) {
      return res.status(409).json({ error: 'Dealer already exists' });
    }
    const dealer = new Dealer({
      name,
      company,
      type,
      contact,
      notes
    });
    await dealer.save();
    res.status(201).json({
      success: true,
      message: 'Dealer created successfully',
      data: dealer
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
    res.json({
      success: true,
      message: 'Dealer updated successfully',
      data: dealer
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
      data: dealer
    });
  } catch (error) {
    console.error('Error deleting dealer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 