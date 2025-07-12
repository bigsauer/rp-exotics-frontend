const axios = require('axios');

// Your dealer data
const dealers = [
  {
    "name": "Anthony Rumeo",
    "company": "McLaren NJ / Suburban Exotics",
    "type": "dealer",
    "contact": {
      "phone": "",
      "email": "Anthony@squadrav.com",
      "location": "New Jersey"
    }
  },
  {
    "name": "Eric Currion",
    "company": "West Coast Exotics",
    "type": "dealer",
    "contact": {
      "phone": "",
      "email": "",
      "location": "West Coast"
    }
  },
  {
    "name": "Joe Humphrey",
    "company": "Left Lane Exotics",
    "type": "dealer",
    "contact": {
      "phone": "",
      "email": "",
      "location": ""
    }
  },
  {
    "name": "Abdulla Abunasrah",
    "company": "GMTV",
    "type": "dealer",
    "contact": {
      "phone": "(800) 249-1095",
      "email": "abdulla.abunasrah@givemethevin.com",
      "location": ""
    }
  },
  {
    "name": "Trajan Burton",
    "company": "GMTV",
    "type": "dealer",
    "contact": {
      "phone": "",
      "email": "",
      "location": ""
    }
  },
  {
    "name": "Chad Cunningham",
    "company": "Dupont Registry",
    "type": "dealer",
    "contact": {
      "phone": "",
      "email": "",
      "location": ""
    }
  },
  {
    "name": "Victor Falcon",
    "company": "Tampa Auto Gallery",
    "type": "dealer",
    "contact": {
      "phone": "",
      "email": "",
      "location": "Tampa, FL"
    }
  },
  {
    "name": "Eric Elbaz",
    "company": "Falcon Motor Group",
    "type": "dealer",
    "contact": {
      "phone": "",
      "email": "",
      "location": ""
    }
  },
  {
    "name": "Aaron Payne",
    "company": "Auffenberg Ford",
    "type": "dealer",
    "contact": {
      "phone": "",
      "email": "",
      "location": ""
    }
  },
  {
    "name": "Tristen Bergen",
    "company": "AutoPark Dallas",
    "type": "dealer",
    "contact": {
      "phone": "(972) 639-7707",
      "email": "tristan@autoparkdallas.com",
      "location": "Dallas, TX"
    }
  },
  {
    "name": "Jay Rampuria",
    "company": "P1 Motorwerks",
    "type": "dealer",
    "contact": {
      "phone": "",
      "email": "",
      "location": ""
    }
  },
  {
    "name": "Brian Wallin",
    "company": "Velocity Motorcars",
    "type": "dealer",
    "contact": {
      "phone": "",
      "email": "",
      "location": ""
    }
  },
  {
    "name": "Houston Crosta",
    "company": "Vegas Auto Collection",
    "type": "dealer",
    "contact": {
      "phone": "",
      "email": "",
      "location": "Las Vegas, NV"
    }
  },
  {
    "name": "Adam Elazeh",
    "company": "Brooklyn Auto Sales",
    "type": "dealer",
    "contact": {
      "phone": "(718) 825-4678",
      "email": "Brooklynautosales2@gmail.com",
      "location": "Brooklyn, NY"
    }
  },
  {
    "name": "Frank Gebba",
    "company": "Bentley New Jersey",
    "type": "dealer",
    "contact": {
      "phone": "",
      "email": "",
      "location": "New Jersey"
    }
  },
  {
    "name": "Adam Camasta",
    "company": "Galpin Motors",
    "type": "dealer",
    "contact": {
      "phone": "",
      "email": "",
      "location": ""
    }
  },
  {
    "name": "Rodolfo Garza",
    "company": "Recar",
    "type": "dealer",
    "contact": {
      "phone": "",
      "email": "",
      "location": ""
    }
  },
  {
    "name": "Waseem Rehan",
    "company": "Motorcars of Chicago",
    "type": "dealer",
    "contact": {
      "phone": "",
      "email": "",
      "location": "Chicago, IL"
    }
  },
  {
    "name": "Jared Hoyt",
    "company": "JNBS Motorz",
    "type": "dealer",
    "contact": {
      "phone": "",
      "email": "",
      "location": ""
    }
  },
  {
    "name": "Sara Batchelor",
    "company": "Porsche St. Louis",
    "type": "dealer",
    "contact": {
      "phone": "",
      "email": "",
      "location": "St. Louis, MO"
    }
  },
  {
    "name": "Danny Baker",
    "company": "Marshall Goldman",
    "type": "dealer",
    "contact": {
      "phone": "",
      "email": "",
      "location": ""
    }
  },
  {
    "name": "Chris Barta",
    "company": "Tactical Fleet",
    "type": "dealer",
    "contact": {
      "phone": "",
      "email": "",
      "location": ""
    }
  },
  {
    "name": "Craig Becker",
    "company": "CLB Sports Cars",
    "type": "dealer",
    "contact": {
      "phone": "",
      "email": "",
      "location": ""
    }
  },
  {
    "name": "Alex Vaughn",
    "company": "Enthusiast Auto Sales",
    "type": "dealer",
    "contact": {
      "phone": "",
      "email": "",
      "location": ""
    }
  },
  {
    "name": "George Saliba",
    "company": "J & S Autohaus",
    "type": "dealer",
    "contact": {
      "phone": "",
      "email": "",
      "location": ""
    }
  },
  {
    "name": "Blake McCombs",
    "company": "Avid Motorsports",
    "type": "dealer",
    "contact": {
      "phone": "",
      "email": "",
      "location": ""
    }
  },
  {
    "name": "Pinky Persons",
    "company": "Dave Sinclair Ford",
    "type": "dealer",
    "contact": {
      "phone": "",
      "email": "",
      "location": ""
    }
  },
  {
    "name": "Brett Estes",
    "company": "Jim Butler Maserati",
    "type": "dealer",
    "contact": {
      "phone": "",
      "email": "",
      "location": ""
    }
  },
  {
    "name": "Billy Wenk",
    "company": "HBI Auto",
    "type": "dealer",
    "contact": {
      "phone": "",
      "email": "",
      "location": ""
    }
  },
  {
    "name": "Scott Zankl",
    "company": "1of1 MotorSports",
    "type": "dealer",
    "contact": {
      "phone": "(561) 756-1933",
      "email": "Scott@1of1motorsports.com",
      "location": "Florida"
    }
  },
  {
    "name": "Tyler Zankl",
    "company": "1of1 MotorSports",
    "type": "dealer",
    "contact": {
      "phone": "(561) 405-0816",
      "email": "tyler@1of1motorsports.com",
      "location": "Florida"
    }
  },
  {
    "name": "Amy Farnham",
    "company": "Foreign Affairs Motorsports",
    "type": "dealer",
    "contact": {
      "phone": "(561) 923-5233",
      "email": "amyv4n@gmail.com",
      "location": "Florida"
    }
  },
  {
    "name": "Simon M",
    "company": "Republic Auto Group",
    "type": "dealer",
    "contact": {
      "phone": "(614) 286-8891",
      "email": "Simon@republicautogroup.com",
      "location": "Ohio"
    }
  },
  {
    "name": "",
    "company": "Ferrari Long Island",
    "type": "dealer",
    "contact": {
      "phone": "(551) 228-9864",
      "email": "edefrancesco@ferrarili.com",
      "location": "Long Island, NY"
    }
  },
  {
    "name": "Eliud Villarreal",
    "company": "Exotic Motorsports of OK",
    "type": "dealer",
    "contact": {
      "phone": "(405) 664-2073",
      "email": "eliud@exoticmotorsportsok.com",
      "location": "Oklahoma"
    }
  },
  {
    "name": "",
    "company": "Premier Auto Group of South Florida",
    "type": "dealer",
    "contact": {
      "phone": "",
      "email": "",
      "location": "South Florida"
    }
  },
  {
    "name": "",
    "company": "Friendly Auto Sales",
    "type": "dealer",
    "contact": {
      "phone": "(479) 899-7686",
      "email": "qwkcollections@gmail.com",
      "location": ""
    }
  },
  {
    "name": "Reade",
    "company": "Foreign Cars Italia",
    "type": "dealer",
    "contact": {
      "phone": "(336) 688-0637",
      "email": "rfulton@foreigncarsitali.com",
      "location": ""
    }
  }
];

// Configuration
const BASE_URL = 'http://localhost:5001/api';
const DELAY_BETWEEN_REQUESTS = 100; // 100ms delay between requests

async function findExistingDealer(companyName) {
  try {
    // Search for existing dealer by company name
    const response = await axios.get(`${BASE_URL}/dealers/search?q=${encodeURIComponent(companyName)}`);
    
    if (response.data && response.data.dealers && response.data.dealers.length > 0) {
      // Find exact match by company name
      const exactMatch = response.data.dealers.find(dealer => 
        dealer.company && dealer.company.toLowerCase() === companyName.toLowerCase()
      );
      
      if (exactMatch) {
        return exactMatch;
      }
    }
    
    return null;
  } catch (error) {
    console.log(`⚠️  Error searching for existing dealer ${companyName}:`, error.message);
    return null;
  }
}

async function updateDealer(dealerId, updateData) {
  try {
    const response = await axios.put(`${BASE_URL}/dealers/${dealerId}`, updateData);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to update dealer: ${error.response?.data?.error || error.message}`);
  }
}

async function uploadDealers() {
  console.log('🚀 Starting dealer upload/update process...');
  console.log(`📊 Total dealers to process: ${dealers.length}`);
  console.log('');

  let createdCount = 0;
  let updatedCount = 0;
  let errorCount = 0;
  const errors = [];

  for (let i = 0; i < dealers.length; i++) {
    const dealer = dealers[i];
    
    try {
      // Transform dealer data to match the backend API structure
      const dealerData = {
        name: dealer.name || dealer.company, // Use company as name if name is empty
        company: dealer.company,
        type: dealer.type,
        phone: dealer.contact.phone,
        email: dealer.contact.email,
        location: dealer.contact.location
      };

      console.log(`📝 Processing ${i + 1}/${dealers.length}: ${dealerData.company}...`);
      
      // Check if dealer already exists
      const existingDealer = await findExistingDealer(dealerData.company);
      
      if (existingDealer) {
        console.log(`🔄 Found existing dealer: ${dealerData.company} (ID: ${existingDealer.id})`);
        
        // Prepare update data - only include fields that have values
        const updateData = {};
        if (dealerData.name && dealerData.name !== existingDealer.name) {
          updateData.name = dealerData.name;
        }
        if (dealerData.phone && dealerData.phone !== existingDealer.phone) {
          updateData.phone = dealerData.phone;
        }
        if (dealerData.email && dealerData.email !== existingDealer.email) {
          updateData.email = dealerData.email;
        }
        if (dealerData.location && dealerData.location !== existingDealer.location) {
          updateData.location = dealerData.location;
        }
        
        if (Object.keys(updateData).length > 0) {
          await updateDealer(existingDealer.id, updateData);
          console.log(`✅ Updated: ${dealerData.company} with new data`);
          updatedCount++;
        } else {
          console.log(`ℹ️  No changes needed: ${dealerData.company}`);
        }
        
      } else {
        // Create new dealer
        console.log(`➕ Creating new dealer: ${dealerData.company}`);
        const response = await axios.post(`${BASE_URL}/dealers`, dealerData);
        
        if (response.data && response.data.id) {
          console.log(`✅ Created: ${dealerData.company} (ID: ${response.data.id})`);
          createdCount++;
        } else {
          console.log(`⚠️  Warning: ${dealerData.company} - No ID returned`);
          createdCount++;
        }
      }

      // Add delay between requests to avoid overwhelming the server
      if (i < dealers.length - 1) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
      }

    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      console.log(`❌ Error: ${dealer.company} - ${errorMessage}`);
      errors.push({
        dealer: dealer.company,
        error: errorMessage
      });
      errorCount++;
    }
  }

  console.log('');
  console.log('📊 Upload/Update Summary:');
  console.log(`✅ Created: ${createdCount}`);
  console.log(`🔄 Updated: ${updatedCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📈 Success Rate: ${(((createdCount + updatedCount) / dealers.length) * 100).toFixed(1)}%`);

  if (errors.length > 0) {
    console.log('');
    console.log('❌ Error Details:');
    errors.forEach((err, index) => {
      console.log(`${index + 1}. ${err.dealer}: ${err.error}`);
    });
  }

  console.log('');
  console.log('🎉 Upload/update process completed!');
}

// Run the upload
uploadDealers().catch(console.error); 