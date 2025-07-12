const API_CONFIG = {
  // Use local backend for development, Railway for production
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://rp-exotics-backend-production.up.railway.app/api'  // Railway production URL
    : 'http://localhost:5001/api',  // Local development backend

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