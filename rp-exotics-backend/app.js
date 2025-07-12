const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
let db;
const client = new MongoClient(process.env.MONGODB_URI);

async function connectToDatabase() {
  try {
    await client.connect();
    db = client.db('rp_exotics');
    console.log('✅ Connected to MongoDB Atlas');
    
    // Create indexes for better performance
    await createIndexes();
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

async function createIndexes() {
  try {
    // Dealers collection indexes
    await db.collection('dealers').createIndex({ "name": "text" });
    await db.collection('dealers').createIndex({ "contact.phone": 1 });
    
    // Deals collection indexes  
    await db.collection('deals').createIndex({ "vin": 1 });
    await db.collection('deals').createIndex({ "stockNumber": 1 });
    await db.collection('deals').createIndex({ "vehicle.make": 1, "vehicle.model": 1 });
    
    console.log('✅ Database indexes created');
  } catch (error) {
    console.log('⚠️  Index creation warning:', error.message);
  }
}

// =================== ROUTES ===================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    message: 'RP Exotics API is running!', 
    timestamp: new Date().toISOString(),
    database: db ? 'Connected' : 'Disconnected'
  });
});

// =================== DEALERS ENDPOINTS ===================

// Search dealers (autocomplete)
app.get('/api/dealers/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    
    if (query.length < 2) {
      return res.json([]);
    }
    
    const dealers = await db.collection('dealers')
      .find({ 
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { 'contact.primaryContact': { $regex: query, $options: 'i' } },
          { 'contact.phone': { $regex: query, $options: 'i' } }
        ]
      })
      .limit(10)
      .sort({ 'metrics.lastDealDate': -1 })
      .toArray();
    
    res.json(dealers);
  } catch (error) {
    console.error('Dealer search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all dealers
app.get('/api/dealers', async (req, res) => {
  try {
    const dealers = await db.collection('dealers')
      .find({})
      .sort({ name: 1 })
      .toArray();
    res.json(dealers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single dealer
app.get('/api/dealers/:id', async (req, res) => {
  try {
    const dealer = await db.collection('dealers')
      .findOne({ _id: new ObjectId(req.params.id) });
    
    if (!dealer) {
      return res.status(404).json({ error: 'Dealer not found' });
    }
    
    res.json(dealer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new dealer
app.post('/api/dealers', async (req, res) => {
  try {
    const dealer = {
      ...req.body,
      metrics: {
        totalDeals: 0,
        totalPurchaseVolume: 0,
        totalSaleVolume: 0,
        lastDealDate: null,
        ...req.body.metrics
      },
      dealHistory: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('dealers').insertOne(dealer);
    res.json({ 
      id: result.insertedId, 
      message: 'Dealer created successfully',
      dealer: { ...dealer, _id: result.insertedId }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =================== DEALS ENDPOINTS ===================

// Get all deals
app.get('/api/deals', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    const deals = await db.collection('deals')
      .find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
      
    const total = await db.collection('deals').countDocuments();
    
    res.json({
      deals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single deal
app.get('/api/deals/:id', async (req, res) => {
  try {
    const deal = await db.collection('deals')
      .findOne({ _id: new ObjectId(req.params.id) });
    
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    
    res.json(deal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search deals by VIN or stock number
app.get('/api/deals/search', async (req, res) => {
  try {
    const { vin, stockNumber, make, model } = req.query;
    let query = {};
    
    if (vin) query.vin = { $regex: vin, $options: 'i' };
    if (stockNumber) query.stockNumber = { $regex: stockNumber, $options: 'i' };
    if (make) query['vehicle.make'] = { $regex: make, $options: 'i' };
    if (model) query['vehicle.model'] = { $regex: model, $options: 'i' };
    
    const deals = await db.collection('deals')
      .find(query)
      .limit(20)
      .sort({ createdAt: -1 })
      .toArray();
    
    res.json(deals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new deal
app.post('/api/deals', async (req, res) => {
  try {
    // Generate stock number if not provided
    let stockNumber = req.body.stockNumber;
    if (!stockNumber) {
      const year = new Date().getFullYear();
      const count = await db.collection('deals').countDocuments() + 1;
      stockNumber = `RP${year}${count.toString().padStart(3, '0')}`;
    }
    
    const deal = {
      ...req.body,
      stockNumber,
      status: req.body.status || 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('deals').insertOne(deal);
    
    // Update dealer history if applicable
    if (deal.parties?.purchasedFrom?.name && !isRetailDeal(deal)) {
      await updateDealerHistory(deal.parties.purchasedFrom.name, result.insertedId, deal);
    }
    
    res.json({ 
      id: result.insertedId, 
      stockNumber,
      message: 'Deal created successfully',
      deal: { ...deal, _id: result.insertedId }
    });
  } catch (error) {
    console.error('Deal creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update deal
app.put('/api/deals/:id', async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };
    
    const result = await db.collection('deals').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    
    res.json({ message: 'Deal updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =================== UTILITY FUNCTIONS ===================

function isRetailDeal(deal) {
  const dealType = deal.dealTypes?.primary?.toLowerCase();
  return dealType && dealType.includes('retail');
}

async function updateDealerHistory(dealerName, dealId, dealData) {
  try {
    const existingDealer = await db.collection('dealers').findOne({ 
      name: { $regex: `^${dealerName}$`, $options: 'i' } 
    });
    
    const historyEntry = {
      dealId: dealId,
      date: new Date(),
      type: dealData.dealTypes?.secondary === 'buy' ? 'purchase' : 'sale',
      amount: dealData.financials?.purchasePrice || dealData.financials?.salePrice || 0,
      vehicle: `${dealData.vehicle?.year || ''} ${dealData.vehicle?.make || ''} ${dealData.vehicle?.model || ''}`.trim()
    };
    
    if (existingDealer) {
      // Update existing dealer
      await db.collection('dealers').updateOne(
        { _id: existingDealer._id },
        {
          $push: { dealHistory: historyEntry },
          $inc: {
            'metrics.totalDeals': 1,
            'metrics.totalPurchaseVolume': historyEntry.type === 'purchase' ? historyEntry.amount : 0,
            'metrics.totalSaleVolume': historyEntry.type === 'sale' ? historyEntry.amount : 0
          },
          $set: {
            'metrics.lastDealDate': new Date(),
            updatedAt: new Date()
          }
        }
      );
    } else {
      // Create new dealer
      const newDealer = {
        name: dealerName,
        type: 'individual',
        status: 'active',
        contact: dealData.parties?.purchasedFrom?.contact || {},
        metrics: {
          totalDeals: 1,
          totalPurchaseVolume: historyEntry.type === 'purchase' ? historyEntry.amount : 0,
          totalSaleVolume: historyEntry.type === 'sale' ? historyEntry.amount : 0,
          lastDealDate: new Date()
        },
        dealHistory: [historyEntry],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.collection('dealers').insertOne(newDealer);
    }
  } catch (error) {
    console.error('Error updating dealer history:', error);
  }
}

// =================== SERVER STARTUP ===================

async function startServer() {
  await connectToDatabase();
  
  app.listen(PORT, () => {
    console.log(`🚀 RP Exotics API running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  });
}

startServer().catch(console.error);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await client.close();
  process.exit(0);
}); 