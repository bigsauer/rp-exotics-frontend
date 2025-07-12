const express = require('express');
const router = express.Router();
const axios = require('axios');
const Dealer = require('../models/Dealer');
const Deal = require('../models/Deal');

// Helper function to find or create dealer in MongoDB
async function findOrCreateDealer(dealerInfo) {
  try {
    if (!dealerInfo.name || dealerInfo.name === 'Private Seller' || dealerInfo.name === 'Private Buyer') {
      return dealerInfo;
    }

    // Check if dealer already exists in MongoDB
    let existingDealer = await Dealer.findOne({
      $or: [
        { name: new RegExp(`^${dealerInfo.name}$`, 'i') },
        { 'contact.email': dealerInfo.email?.toLowerCase() },
        { 'contact.phone': dealerInfo.phone }
      ]
    });

    if (existingDealer) {
      // Update existing dealer with any new info
      let updated = false;
      if (dealerInfo.contactPerson && !existingDealer.contact?.phone) {
        existingDealer.contact = existingDealer.contact || {};
        existingDealer.contact.phone = dealerInfo.phone;
        updated = true;
      }
      if (dealerInfo.phone && !existingDealer.contact?.phone) {
        existingDealer.contact = existingDealer.contact || {};
        existingDealer.contact.phone = dealerInfo.phone;
        updated = true;
      }
      if (dealerInfo.email && !existingDealer.contact?.email) {
        existingDealer.contact = existingDealer.contact || {};
        existingDealer.contact.email = dealerInfo.email.toLowerCase();
        updated = true;
      }
      
      if (updated) {
        await existingDealer.save();
      }
      
      return {
        id: existingDealer._id,
        name: existingDealer.name,
        contactPerson: dealerInfo.contactPerson || '',
        phone: existingDealer.contact?.phone || dealerInfo.phone || '',
        email: existingDealer.contact?.email || dealerInfo.email || '',
        company: existingDealer.company || '',
        type: existingDealer.type || 'dealer'
      };
    }

    // Create new dealer in MongoDB
    const newDealer = new Dealer({
      name: dealerInfo.name.trim(),
      company: dealerInfo.company || '',
      type: dealerInfo.type || 'dealer',
      contact: {
        phone: dealerInfo.phone || '',
        email: dealerInfo.email?.toLowerCase() || ''
      },
      notes: `Auto-created from deal on ${new Date().toLocaleDateString()}`,
      isActive: true
    });

    await newDealer.save();
    console.log(`✅ Auto-created new dealer in MongoDB: ${newDealer.name}`);

    return {
      id: newDealer._id,
      name: newDealer.name,
      contactPerson: dealerInfo.contactPerson || '',
      phone: newDealer.contact?.phone || '',
      email: newDealer.contact?.email || '',
      company: newDealer.company || '',
      type: newDealer.type || 'dealer'
    };
  } catch (error) {
    console.error('Error in findOrCreateDealer:', error);
    return dealerInfo; // Return original info if dealer creation fails
  }
}

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Deals routes working!' });
});

// VIN Decode endpoint
router.post('/vin/decode', async (req, res) => {
  try {
    const { vin } = req.body;
    
    if (!vin || vin.length !== 17) {
      return res.status(400).json({ 
        error: 'Valid 17-character VIN required' 
      });
    }

    // Using NHTSA free API
    const response = await axios.get(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`,
      { timeout: 10000 }
    );

    if (response.data?.Results) {
      const results = response.data.Results;
      
      const extractValue = (variable) => {
        const result = results.find(r => r.Variable === variable);
        return result?.Value && result.Value !== 'Not Applicable' ? result.Value : null;
      };

      const decodedData = {
        year: extractValue('Model Year'),
        make: extractValue('Make'),
        model: extractValue('Model'),
        trim: extractValue('Trim'),
        bodyStyle: extractValue('Body Class'),
        engine: extractValue('Engine Model'),
        transmission: extractValue('Transmission Style'),
        driveType: extractValue('Drive Type')
      };

      res.json({
        success: true,
        data: decodedData,
        decodedAt: new Date()
      });
    } else {
      res.status(400).json({ error: 'Unable to decode VIN' });
    }
  } catch (error) {
    console.error('VIN decode error:', error);
    res.status(500).json({ error: 'VIN decode service temporarily unavailable' });
  }
});

// Enhanced dealer search endpoint - now uses MongoDB
router.get('/dealers/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ dealers: [] });
    }
    
    // Search dealers in MongoDB using text search
    const dealers = await Dealer.find(
      { $text: { $search: q } },
      { score: { $meta: "textScore" } }
    ).sort({ score: { $meta: "textScore" } }).limit(10);
    
    // Format dealers for frontend
    const formattedDealers = dealers.map(dealer => ({
      id: dealer._id,
      name: dealer.name,
      company: dealer.company || '',
      contactPerson: dealer.contact?.phone ? 'Contact Available' : '',
      phone: dealer.contact?.phone || '',
      email: dealer.contact?.email || '',
      type: dealer.type || 'dealer'
    }));
    
    res.json({ dealers: formattedDealers });
  } catch (error) {
    console.error('Dealer search error:', error);
    res.status(500).json({ error: 'Search temporarily unavailable' });
  }
});

// Enhanced Deals CRUD endpoints with MongoDB dealer auto-creation
router.post('/deals', async (req, res) => {
  try {
    const dealData = req.body;
    
    // Validate required fields
    if (!dealData.vin || !dealData.seller) {
      return res.status(400).json({ 
        error: 'VIN and seller information are required' 
      });
    }

    // Auto-create seller if it's a new dealer
    let seller = dealData.seller;
    if (seller.name && seller.name !== 'Private Seller') {
      seller = await findOrCreateDealer({
        name: seller.name,
        contactPerson: seller.contactPerson || seller.contact,
        phone: seller.phone,
        email: seller.email,
        company: seller.company,
        type: 'dealer'
      });
    }

    // Auto-create buyer if it's a new dealer
    let buyer = dealData.buyer;
    if (buyer && buyer.name && buyer.name !== 'Private Buyer') {
      buyer = await findOrCreateDealer({
        name: buyer.name,
        contactPerson: buyer.contactPerson || buyer.contact,
        phone: buyer.phone,
        email: buyer.email,
        company: buyer.company,
        type: 'dealer'
      });
    }

    // Create the deal using the Deal Mongoose model
    const newDeal = new Deal({
      vin: dealData.vin,
      year: dealData.year,
      make: dealData.make,
      model: dealData.model,
      trim: dealData.trim,
      rpStockNumber: dealData.rpStockNumber,
      currentStage: dealData.currentStage || 'purchased',
      dealType: dealData.dealType || 'wholesale-d2d',
      fundingSource: dealData.fundingSource || 'cash',
      purchaseDate: dealData.purchaseDate || new Date(),
      paymentMethod: dealData.paymentMethod || 'check',
      financial: {
        purchasePrice: dealData.purchasePrice,
        listPrice: dealData.salePrice
      },
      seller: {
        name: seller.name,
        company: seller.company || '',
        phone: seller.phone || '',
        email: seller.email || ''
      },
      buyer: buyer ? {
        name: buyer.name,
        company: buyer.company || '',
        phone: buyer.phone || '',
        email: buyer.email || ''
      } : undefined,
      vehicleDescription: dealData.notes,
      generalNotes: dealData.notes,
      createdBy: dealData.createdBy || null, // Will be null for system-created deals
      isDraft: dealData.isDraft || false
    });

    await newDeal.save();
    
    console.log(`✅ Deal created in MongoDB: ${newDeal.make} ${newDeal.model} (${newDeal.vin})`);
    
    res.status(201).json({
      success: true,
      message: dealData.isDraft ? 'Draft saved successfully' : 'Deal created successfully',
      data: newDeal
    });
  } catch (error) {
    console.error('Create deal error:', error);
    res.status(500).json({ error: 'Failed to create deal' });
  }
});

router.get('/deals', async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};

    // Apply filters
    if (status) {
      query.currentStage = status;
    }

    if (search) {
      query.$or = [
        { vin: new RegExp(search, 'i') },
        { make: new RegExp(search, 'i') },
        { model: new RegExp(search, 'i') },
        { rpStockNumber: new RegExp(search, 'i') },
        { 'seller.name': new RegExp(search, 'i') },
        { 'buyer.name': new RegExp(search, 'i') }
      ];
    }

    const deals = await Deal.find(query).sort({ createdAt: -1 });

    res.json({ 
      success: true,
      deals: deals,
      count: deals.length
    });
  } catch (error) {
    console.error('Get deals error:', error);
    res.status(500).json({ error: 'Failed to retrieve deals' });
  }
});

router.get('/deals/:id', async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    res.json({
      success: true,
      data: deal
    });
  } catch (error) {
    console.error('Get deal error:', error);
    res.status(500).json({ error: 'Failed to retrieve deal' });
  }
});

router.put('/deals/:id', async (req, res) => {
  try {
    const dealData = req.body;
    
    // Auto-create new dealers if deal is updated with new dealer info
    let seller = dealData.seller;
    if (seller && seller.name && seller.name !== 'Private Seller') {
      seller = await findOrCreateDealer({
        name: seller.name,
        contactPerson: seller.contactPerson || seller.contact,
        phone: seller.phone,
        email: seller.email,
        company: seller.company,
        type: 'dealer'
      });
    }

    let buyer = dealData.buyer;
    if (buyer && buyer.name && buyer.name !== 'Private Buyer') {
      buyer = await findOrCreateDealer({
        name: buyer.name,
        contactPerson: buyer.contactPerson || buyer.contact,
        phone: buyer.phone,
        email: buyer.email,
        company: buyer.company,
        type: 'dealer'
      });
    }

    // Update the deal
    const updatedDeal = await Deal.findByIdAndUpdate(
      req.params.id,
      {
        ...dealData,
        seller: seller || dealData.seller,
        buyer: buyer || dealData.buyer
      },
      { new: true, runValidators: true }
    );

    if (!updatedDeal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    res.json({
      success: true,
      message: 'Deal updated successfully',
      data: updatedDeal
    });
  } catch (error) {
    console.error('Update deal error:', error);
    res.status(500).json({ error: 'Failed to update deal' });
  }
});

router.delete('/deals/:id', async (req, res) => {
  try {
    const deletedDeal = await Deal.findByIdAndDelete(req.params.id);
    
    if (!deletedDeal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    res.json({
      success: true,
      message: 'Deal deleted successfully',
      data: deletedDeal
    });
  } catch (error) {
    console.error('Delete deal error:', error);
    res.status(500).json({ error: 'Failed to delete deal' });
  }
});

module.exports = router; 