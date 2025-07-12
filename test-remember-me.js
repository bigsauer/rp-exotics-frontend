const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

// Test Remember Me functionality
async function testRememberMe() {
  console.log('🧪 Testing RP Exotics Remember Me Functionality\n');

  try {
    // Test 1: Login with Remember Me enabled
    console.log('1️⃣ Testing login with Remember Me enabled...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'brennan@rpexotics.com',
      password: '1026',
      rememberMe: true
    });
    
    console.log('✅ Login successful with Remember Me');
    console.log('   User:', loginResponse.data.user.profile.displayName);
    console.log('   Token expiration:', loginResponse.data.expiresIn);
    console.log('   Remember Me:', loginResponse.data.rememberMe);
    console.log('   Token received:', loginResponse.data.token.substring(0, 20) + '...');
    console.log('');

    const token = loginResponse.data.token;

    // Test 2: Check session immediately after login
    console.log('2️⃣ Testing session check immediately after login...');
    const sessionResponse = await axios.get(`${BASE_URL}/auth/check-session`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Session check successful');
    console.log('   Hours since login:', sessionResponse.data.hoursSinceLogin);
    console.log('   Remember Me active:', sessionResponse.data.rememberMe);
    console.log('   Login time:', sessionResponse.data.loginTime);
    console.log('');

    // Test 3: Test profile access with Remember Me token
    console.log('3️⃣ Testing profile access with Remember Me token...');
    const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Profile access successful');
    console.log('   User:', profileResponse.data.profile.displayName);
    console.log('   Role:', profileResponse.data.profile.role);
    console.log('');

    // Test 4: Login without Remember Me (for comparison)
    console.log('4️⃣ Testing login without Remember Me...');
    const normalLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'chris@rpexotics.com',
      password: 'Matti11!',
      rememberMe: false
    });
    
    console.log('✅ Normal login successful');
    console.log('   User:', normalLoginResponse.data.user.profile.displayName);
    console.log('   Token expiration:', normalLoginResponse.data.expiresIn);
    console.log('   Remember Me:', normalLoginResponse.data.rememberMe);
    console.log('');

    // Test 5: Test invalid token (simulating expired session)
    console.log('5️⃣ Testing invalid token handling...');
    try {
      await axios.get(`${BASE_URL}/auth/check-session`, {
        headers: { Authorization: 'Bearer invalid_token_here' }
      });
    } catch (error) {
      if (error.response.status === 403) {
        console.log('✅ Invalid token properly rejected');
      }
    }
    console.log('');

    console.log('🎉 Remember Me functionality test completed successfully!');
    console.log('\n📋 How Remember Me Works:');
    console.log('==========================');
    console.log('✅ With Remember Me (rememberMe: true):');
    console.log('   - Token expires in 12 hours');
    console.log('   - User stays logged in for 12 hours');
    console.log('   - Session automatically expires after 12 hours');
    console.log('');
    console.log('✅ Without Remember Me (rememberMe: false):');
    console.log('   - Token expires in 24 hours');
    console.log('   - Standard session duration');
    console.log('');
    console.log('🔍 Session Check Endpoint:');
    console.log('   GET /api/auth/check-session');
    console.log('   - Checks if user is still within 12-hour window');
    console.log('   - Returns session status and time remaining');
    console.log('   - Automatically logs out after 12 hours');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the tests
testRememberMe(); 