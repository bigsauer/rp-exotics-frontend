const express = require('express');
const router = express.Router();
const axios = require('axios');

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

// Dealer search endpoint (mock data for now)
router.get('/dealers/search', (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ dealers: [] });
    }
    
    // Mock dealers (replace with actual database query later)
    const mockDealers = [
      { 
        id: 1, 
        name: 'Ian Hutchinson', 
        company: 'Private Seller', 
        contact: { 
          phone: '(618) 409-4417',
          email: 'ian@example.com' 
        },
        type: 'private'
      },
      { 
        id: 2, 
        name: 'Midwest Auto Group', 
        company: 'Dealership', 
        contact: { 
          phone: '(816) 555-0123',
          email: 'sales@midwestauto.com' 
        },
        type: 'dealer'
      },
      { 
        id: 3, 
        name: 'Premium Auto Sales', 
        company: 'Luxury Dealer', 
        contact: { 
          phone: '(312) 555-0456',
          email: 'info@premiumauto.com' 
        },
        type: 'dealer'
      }
    ];
    
    const filtered = mockDealers.filter(dealer => 
      dealer.name.toLowerCase().includes(q.toLowerCase()) ||
      dealer.company.toLowerCase().includes(q.toLowerCase())
    );
    
    res.json({ dealers: filtered });
  } catch (error) {
    console.error('Dealer search error:', error);
    res.status(500).json({ error: 'Search temporarily unavailable' });
  }
});

// Deals CRUD endpoints
router.post('/deals', (req, res) => {
  try {
    // For now, just return success
    // Later you'll implement actual database saving
    console.log('Deal data received:', req.body);
    
    res.status(201).json({
      success: true,
      message: req.body.isDraft ? 'Draft saved successfully' : 'Deal created successfully',
      data: { id: Date.now(), ...req.body }
    });
  } catch (error) {
    console.error('Create deal error:', error);
    res.status(500).json({ error: 'Failed to create deal' });
  }
});

router.get('/deals', (req, res) => {
  // Mock deals list
  const mockDeals = [
    {
      id: 1,
      vin: 'SBM14FCA4LW004366',
      year: '2020',
      make: 'McLaren',
      model: '720S',
      rpStockNumber: 'RP2025001',
      currentStage: 'purchased',
      seller: { name: 'Ian Hutchinson' },
      createdAt: new Date()
    }
  ];
  
  res.json({ deals: mockDeals });
});

module.exports = router; 