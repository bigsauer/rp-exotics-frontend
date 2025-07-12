const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Your actual team data
const rpExoticsTeam = [
  { 
    firstName: 'Parker', 
    lastName: 'Gelber', 
    email: 'parker@rpexotics.com', 
    password: '1234', 
    role: 'sales',
    department: 'Sales Team'
  },
  { 
    firstName: 'Brennan', 
    lastName: 'Sauer', 
    email: 'brennan@rpexotics.com', 
    password: '1026', 
    role: 'sales',
    department: 'Sales Team'
  },
  { 
    firstName: 'Dan', 
    lastName: 'Mudd', 
    email: 'dan@rpexotics.com', 
    password: 'Ilikemen', 
    role: 'sales',
    department: 'Sales Team'
  },
  { 
    firstName: 'Chris', 
    lastName: 'Murphy', 
    email: 'chris@rpexotics.com', 
    password: 'Matti11!', 
    role: 'admin',
    department: 'Administration'
  },
  { 
    firstName: 'Lynn', 
    lastName: '', 
    email: 'lynn@rpexotics.com', 
    password: 'titles123', 
    role: 'finance',
    department: 'Finance'
  },
  { 
    firstName: 'Adiana', 
    lastName: 'Palica', 
    email: 'adiana@rpexotics.com', 
    password: 'PalicARP', 
    role: 'sales',
    department: 'Sales Team'
  },
  { 
    firstName: 'Brett', 
    lastName: 'M', 
    email: 'brett@rpexotics.com', 
    password: 'coop123!', 
    role: 'sales',
    department: 'Sales Team'
  },
  { 
    firstName: 'Tammie', 
    lastName: 'W', 
    email: 'tammie@rpexotics.com', 
    password: 'Twood1125!', 
    role: 'admin',
    department: 'Administration'
  }
];

// Role definitions with permissions
const roleDefinitions = {
  admin: {
    name: "Administrator",
    description: "Full system access and user management",
    permissions: {
      deals: { create: true, read: true, update: true, delete: true, viewFinancials: true },
      dealers: { create: true, read: true, update: true, delete: true },
      backoffice: { access: true },
      reports: { access: true, viewFinancials: true },
      users: { manage: true },
      system: { configure: true }
    }
  },
  sales: {
    name: "Sales Team",
    description: "Deal and dealer management, limited financial access",
    permissions: {
      deals: { create: true, read: true, update: true, delete: false, viewFinancials: false },
      dealers: { create: true, read: true, update: true, delete: false },
      backoffice: { access: false },
      reports: { access: true, viewFinancials: false },
      users: { manage: false },
      system: { configure: false }
    }
  },
  finance: {
    name: "Finance",
    description: "Financial data access and back office operations",
    permissions: {
      deals: { create: false, read: true, update: true, delete: false, viewFinancials: true },
      dealers: { create: false, read: true, update: false, delete: false },
      backoffice: { access: true },
      reports: { access: true, viewFinancials: true },
      users: { manage: false },
      system: { configure: false }
    }
  }
};

// Function to create all users in database
async function createRPExoticsUsers() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    const db = client.db('rp_exotics');
    
    console.log('👥 Setting up RP Exotics team users...');
    
    // Check if users already exist
    const existingUsers = await db.collection('users').countDocuments();
    if (existingUsers > 0) {
      console.log(`⚠️  Found ${existingUsers} existing users. Skipping user creation.`);
      console.log('💡 To recreate users, delete the users collection first.');
      return;
    }
    
    // Create users collection with proper indexes
    console.log('📊 Creating users collection...');
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ role: 1 });
    await db.collection('users').createIndex({ isActive: 1 });
    
    // Process each team member
    const usersToInsert = [];
    
    for (const teamMember of rpExoticsTeam) {
      console.log(`🔐 Processing ${teamMember.firstName} ${teamMember.lastName}...`);
      
      // Hash password securely
      const passwordHash = await bcrypt.hash(teamMember.password, 10);
      
      // Get role permissions
      const roleInfo = roleDefinitions[teamMember.role];
      if (!roleInfo) {
        console.error(`❌ Unknown role: ${teamMember.role} for ${teamMember.email}`);
        continue;
      }
      
      // Create user object
      const user = {
        email: teamMember.email,
        passwordHash: passwordHash,
        role: teamMember.role,
        permissions: roleInfo.permissions,
        
        profile: {
          firstName: teamMember.firstName,
          lastName: teamMember.lastName,
          displayName: `${teamMember.firstName} ${teamMember.lastName}`.trim(),
          department: teamMember.department,
          phone: '', // Can be added later
          avatar: null
        },
        
        // Account settings
        isActive: true,
        emailVerified: true,
        mustChangePassword: false, // Set to true if you want to force password changes
        
        // Activity tracking
        lastLogin: null,
        loginCount: 0,
        failedLoginAttempts: 0,
        lockoutUntil: null,
        
        // Audit trail
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system', // System-created users
        
        // Security
        passwordResetToken: null,
        passwordResetExpires: null
      };
      
      usersToInsert.push(user);
    }
    
    // Insert all users at once
    console.log(`📝 Inserting ${usersToInsert.length} users into database...`);
    const result = await db.collection('users').insertMany(usersToInsert);
    
    console.log(`✅ Successfully created ${result.insertedCount} users!`);
    
    // Display summary
    console.log('\n📋 User Summary:');
    console.log('==================');
    
    const usersByRole = {};
    usersToInsert.forEach(user => {
      if (!usersByRole[user.role]) usersByRole[user.role] = [];
      usersByRole[user.role].push(`${user.profile.displayName} (${user.email})`);
    });
    
    Object.entries(usersByRole).forEach(([role, users]) => {
      const roleInfo = roleDefinitions[role];
      console.log(`\n${roleInfo.name}:`);
      users.forEach(user => console.log(`  - ${user}`));
    });
    
    console.log('\n🔑 Login Instructions:');
    console.log('======================');
    console.log('Users can now log in with their email and current passwords.');
    console.log('Consider requiring password changes on first login for security.');
    
  } catch (error) {
    console.error('❌ Error setting up users:', error);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

// Function to verify user creation
async function verifyUsers() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('rp_exotics');
    
    console.log('🔍 Verifying user creation...');
    
    const users = await db.collection('users')
      .find({}, { 
        projection: { 
          email: 1, 
          role: 1, 
          'profile.displayName': 1, 
          isActive: 1,
          createdAt: 1
        } 
      })
      .sort({ role: 1, 'profile.displayName': 1 })
      .toArray();
    
    console.log(`\n📊 Found ${users.length} users in database:`);
    console.log('=================================');
    
    users.forEach(user => {
      const status = user.isActive ? '✅' : '❌';
      console.log(`${status} ${user.profile.displayName} - ${user.email} (${user.role})`);
    });
    
  } catch (error) {
    console.error('❌ Error verifying users:', error);
  } finally {
    await client.close();
  }
}

// Function to reset all users (use carefully!)
async function resetUsers() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('rp_exotics');
    
    console.log('🗑️  Deleting all existing users...');
    const deleteResult = await db.collection('users').deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} users`);
    
    console.log('🔄 Recreating users...');
    await createRPExoticsUsers();
    
  } catch (error) {
    console.error('❌ Error resetting users:', error);
  } finally {
    await client.close();
  }
}

// Test login function
async function testLogin(email, password) {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('rp_exotics');
    
    console.log(`🔐 Testing login for: ${email}`);
    
    // Find user
    const user = await db.collection('users').findOne({ email: email });
    if (!user) {
      console.log('❌ User not found');
      return false;
    }
    
    // Check password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      console.log('❌ Invalid password');
      return false;
    }
    
    console.log(`✅ Login successful for ${user.profile.displayName} (${user.role})`);
    return true;
    
  } catch (error) {
    console.error('❌ Error testing login:', error);
    return false;
  } finally {
    await client.close();
  }
}

// Export functions for use in other files
module.exports = {
  createRPExoticsUsers,
  verifyUsers,
  resetUsers,
  testLogin,
  roleDefinitions
};

// Command line interface
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'create':
      createRPExoticsUsers();
      break;
    case 'verify':
      verifyUsers();
      break;
    case 'reset':
      resetUsers();
      break;
    case 'test':
      const email = process.argv[3];
      const password = process.argv[4];
      if (email && password) {
        testLogin(email, password);
      } else {
        console.log('Usage: node userSetup.js test <email> <password>');
      }
      break;
    default:
      console.log('Available commands:');
      console.log('  node userSetup.js create  - Create all RP Exotics users');
      console.log('  node userSetup.js verify  - Verify users exist in database');
      console.log('  node userSetup.js reset   - Delete and recreate all users');
      console.log('  node userSetup.js test <email> <password> - Test login');
  }
} 