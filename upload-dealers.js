const axios = require('axios');

// Dealer data from the user
const dealers = [
  {
    name: "McLaren NJ / Suburban Exotics",
    contact: "Anthony Rumeo",
    phone: "",
    email: "Anthony@squadrav.com"
  },
  {
    name: "West Coast Exotics",
    contact: "Eric Currion",
    phone: "",
    email: ""
  },
  {
    name: "Left Lane Exotics",
    contact: "Joe Humphrey",
    phone: "",
    email: ""
  },
  {
    name: "GMTV",
    contact: "Abdulla Abunasrah",
    phone: "8002491095",
    email: "abdulla.abunasrah@givemethevin.com"
  },
  {
    name: "GMTV",
    contact: "Trajan Burton",
    phone: "",
    email: ""
  },
  {
    name: "Dupont Registry",
    contact: "Chad Cunningham",
    phone: "",
    email: ""
  },
  {
    name: "Tampa Auto Gallery",
    contact: "Victor Falcon",
    phone: "",
    email: ""
  },
  {
    name: "Falcon Motor Group",
    contact: "Eric Elbaz",
    phone: "",
    email: ""
  },
  {
    name: "Auffenberg Ford",
    contact: "Aaron Payne",
    phone: "",
    email: ""
  },
  {
    name: "AutoPark Dallas",
    contact: "Tristen Bergen",
    phone: "972-639-7707",
    email: "tristan@autoparkdallas.com"
  },
  {
    name: "P1 Motorwerks",
    contact: "Jay Rampuria",
    phone: "",
    email: ""
  },
  {
    name: "Velocity Motorcars",
    contact: "Brian Wallin",
    phone: "",
    email: ""
  },
  {
    name: "Vegas Auto Collection",
    contact: "Houston Crosta",
    phone: "",
    email: ""
  },
  {
    name: "Brooklyn Auto Sales",
    contact: "Adam Elazeh",
    phone: "(718) 825-4678",
    email: "Brooklynautosales2@gmail.com"
  },
  {
    name: "Bentley New Jersey",
    contact: "Frank Gebba",
    phone: "",
    email: ""
  },
  {
    name: "Galpin Motors",
    contact: "Adam Camasta",
    phone: "",
    email: ""
  },
  {
    name: "Recar",
    contact: "Rodolfo Garza",
    phone: "",
    email: ""
  },
  {
    name: "Motorcars of Chicago",
    contact: "Waseem Rehan",
    phone: "",
    email: ""
  },
  {
    name: "JNBS Motorz",
    contact: "Jared Hoyt",
    phone: "",
    email: ""
  },
  {
    name: "Porsche St. Louis",
    contact: "Sara Batchelor",
    phone: "",
    email: ""
  },
  {
    name: "Marshall Goldman",
    contact: "Danny Baker",
    phone: "",
    email: ""
  },
  {
    name: "Tactical Fleet",
    contact: "Chris Barta",
    phone: "",
    email: ""
  },
  {
    name: "CLB Sports Cars",
    contact: "Craig Becker",
    phone: "",
    email: ""
  },
  {
    name: "Enthusiast Auto Sales",
    contact: "Alex Vaughn",
    phone: "",
    email: ""
  },
  {
    name: "J & S Autohaus",
    contact: "George Saliba",
    phone: "",
    email: ""
  },
  {
    name: "Avid Motorsports",
    contact: "Blake McCombs",
    phone: "",
    email: ""
  },
  {
    name: "Dave Sinclair Ford",
    contact: "Pinky Persons",
    phone: "",
    email: ""
  },
  {
    name: "Jim Butler Maserati",
    contact: "Brett Estes",
    phone: "",
    email: ""
  },
  {
    name: "HBI Auto",
    contact: "Billy Wenk",
    phone: "",
    email: ""
  },
  {
    name: "1of1 MotorSports",
    contact: "Scott Zankl",
    phone: "(561) 756-1933",
    email: "Scott@1of1motorsports.com"
  },
  {
    name: "1of1 MotorSports",
    contact: "Tyler Zankl",
    phone: "561 405-0816",
    email: "tyler@1of1motorsports.com"
  },
  {
    name: "Foreign Affairs Motorsports",
    contact: "Amy Farnham",
    phone: "561-923-5233",
    email: "amyv4n@gmail.com"
  },
  {
    name: "Republic Auto Group",
    contact: "Simon M",
    phone: "614-286-8891",
    email: "Simon@republicautogroup.com"
  },
  {
    name: "Ferrari Long Island",
    contact: "",
    phone: "551-228-9864",
    email: "edefrancesco@ferrarili.com"
  },
  {
    name: "Exotic Motorsports of OK",
    contact: "Eliud Villarreal",
    phone: "405-664-2073",
    email: "eliud@exoticmotorsportsok.com"
  },
  {
    name: "Premier Auto Group of South Florida",
    contact: "",
    phone: "",
    email: ""
  },
  {
    name: "Friendly Auto Sales",
    contact: "",
    phone: "479-899-7686",
    email: "qwkcollections@gmail.com"
  },
  {
    name: "Foreing Cars Italia",
    contact: "Reade",
    phone: "336-688-0637",
    email: "rfulton@foreigncarsitali.com"
  }
];

const API_BASE_URL = 'http://localhost:5001/api';

async function uploadDealers() {
  console.log('🚀 Starting dealer upload...\n');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const dealer of dealers) {
    try {
      console.log(`📝 Uploading: ${dealer.name}`);
      
      const dealerData = {
        name: dealer.name,
        contactPerson: dealer.contact || '',
        phone: dealer.phone || '',
        email: dealer.email || '',
        status: 'active',
        type: 'exotic',
        location: {
          city: '',
          state: '',
          country: 'USA'
        },
        notes: 'Uploaded via script'
      };
      
      const response = await axios.post(`${API_BASE_URL}/dealers`, dealerData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`✅ Success: ${dealer.name} (ID: ${response.data._id})`);
      successCount++;
      
    } catch (error) {
      console.error(`❌ Error uploading ${dealer.name}:`, error.response?.data?.error || error.message);
      errorCount++;
    }
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n📊 Upload Summary:');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📝 Total: ${dealers.length}`);
}

// Run the upload
uploadDealers().catch(console.error); 