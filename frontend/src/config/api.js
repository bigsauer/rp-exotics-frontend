const API_CONFIG = {
  // Connect to your Railway backend
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://rp-exotics-backend-production.up.railway.app/api'  // Your Railway production URL
    : 'https://rp-exotics-backend-production.up.railway.app/api',  // Use Railway for both dev and prod

  ENDPOINTS: {
    DECODE_VIN: '/vin/decode',
    SEARCH_DEALERS: '/dealers/search',
    DEALS: '/deals',
    AUTH: '/auth',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    USERS: '/users',
  }
};

export default API_CONFIG; 