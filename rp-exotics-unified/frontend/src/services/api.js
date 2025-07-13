import API_CONFIG from '../config/api';

class ApiService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.token = localStorage.getItem('authToken');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    // Handle FormData vs JSON
    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
      config.body = JSON.stringify(config.body);
    } else if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }

    console.log('API Request:', {
      url,
      method: config.method || 'GET',
      headers: config.headers,
      body: config.body
    });

    try {
      const response = await fetch(url, config);
      console.log('API Response status:', response.status);
      console.log('API Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // If not JSON, get the text content to see what we're actually receiving
        const textContent = await response.text();
        console.error('Received non-JSON response:', textContent.substring(0, 1000));
        console.error('Full response URL:', url);
        console.error('Response status:', response.status);
        throw new Error(`Expected JSON response but received ${contentType || 'unknown content type'}. Status: ${response.status}. Check the console for full response details.`);
      }
      
      const data = await response.json();
      console.log('API Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      console.error('Request details:', { url, config });
      throw error;
    }
  }

  // Test backend connectivity
  async testConnection() {
    try {
      console.log('Testing backend connectivity...');
      
      // Try the root endpoint first
      const rootResponse = await fetch(`${this.baseURL.replace('/api', '')}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      console.log('Backend root check status:', rootResponse.status);
      
      // Try without /api prefix
      const noApiResponse = await fetch(`${this.baseURL.replace('/api', '')}/auth/login`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      console.log('Backend /auth/login (no /api) status:', noApiResponse.status);
      
      // Try the health endpoint
      const healthResponse = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      console.log('Backend health check status:', healthResponse.status);
      
      // Try the auth endpoint
      const authResponse = await fetch(`${this.baseURL}/auth`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      console.log('Backend auth check status:', authResponse.status);
      
      // Try different possible auth endpoints
      const loginResponse = await fetch(`${this.baseURL.replace('/api', '')}/login`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      console.log('Backend /login status:', loginResponse.status);
      
      return rootResponse.ok || healthResponse.ok || authResponse.ok || noApiResponse.ok || loginResponse.ok;
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  }

  // Authentication methods
  async login(credentials) {
    const response = await this.request(API_CONFIG.ENDPOINTS.LOGIN, {
      method: 'POST',
      body: credentials
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async logout() {
    try {
      await this.request(API_CONFIG.ENDPOINTS.LOGOUT, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.setToken(null);
    }
  }

  async getCurrentUser() {
    return this.request(API_CONFIG.ENDPOINTS.USERS + '/me');
  }

  async checkSession() {
    return this.request('/auth/check-session');
  }

  // Deal management methods
  async decodeVIN(vin) {
    return this.request(API_CONFIG.ENDPOINTS.DECODE_VIN, {
      method: 'POST',
      body: { vin }
    });
  }

  async searchDealers(query) {
    return this.request(`${API_CONFIG.ENDPOINTS.SEARCH_DEALERS}?q=${encodeURIComponent(query)}`);
  }

  async createDeal(dealData) {
    return this.request(API_CONFIG.ENDPOINTS.DEALS, {
      method: 'POST',
      body: dealData
    });
  }

  async getDeals(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request(`${API_CONFIG.ENDPOINTS.DEALS}${queryParams ? `?${queryParams}` : ''}`);
  }

  async updateDeal(dealId, dealData) {
    return this.request(`${API_CONFIG.ENDPOINTS.DEALS}/${dealId}`, {
      method: 'PUT',
      body: dealData
    });
  }

  async deleteDeal(dealId) {
    return this.request(`${API_CONFIG.ENDPOINTS.DEALS}/${dealId}`, {
      method: 'DELETE'
    });
  }

  // Dealer management methods
  async getDealers(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request(`/dealers${queryParams ? `?${queryParams}` : ''}`);
  }

  async createDealer(dealerData) {
    return this.request('/dealers', {
      method: 'POST',
      body: dealerData
    });
  }

  async updateDealer(dealerId, dealerData) {
    return this.request(`/dealers/${dealerId}`, {
      method: 'PUT',
      body: dealerData
    });
  }

  async deleteDealer(dealerId) {
    return this.request(`/dealers/${dealerId}`, {
      method: 'DELETE'
    });
  }

  // Back Office methods
  async getBackOfficeDeals(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request(`/back-office/deals${queryParams ? `?${queryParams}` : ''}`);
  }

  async getBackOfficeDeal(dealId) {
    return this.request(`/back-office/deals/${dealId}`);
  }

  async updateDealStage(dealId, stage, notes = '') {
    return this.request(`/back-office/deals/${dealId}/stage`, {
      method: 'PUT',
      body: { stage, notes }
    });
  }

  async approveDocument(dealId, documentType, approved = true, notes = '') {
    return this.request(`/back-office/deals/${dealId}/documents/${documentType}/approval`, {
      method: 'PUT',
      body: { approved, notes }
    });
  }

  async uploadDocument(dealId, documentType, file, notes = '') {
    const formData = new FormData();
    formData.append('document', file);
    if (notes) {
      formData.append('notes', notes);
    }

    return this.request(`/back-office/deals/${dealId}/documents/${documentType}/upload`, {
      method: 'POST',
      headers: {
        // Remove Content-Type to let browser set it with boundary for FormData
      },
      body: formData
    });
  }

  async getDocumentTypes() {
    return this.request('/back-office/document-types');
  }

  async getBackOfficeStats() {
    return this.request('/back-office/dashboard/stats');
  }

  async assignDeal(dealId, assignedTo) {
    return this.request(`/back-office/deals/${dealId}/assign`, {
      method: 'PUT',
      body: { assignedTo }
    });
  }

  async updateTitleInfo(dealId, titleData) {
    return this.request(`/back-office/deals/${dealId}/title`, {
      method: 'PUT',
      body: titleData
    });
  }

  async updateComplianceInfo(dealId, complianceData) {
    return this.request(`/back-office/deals/${dealId}/compliance`, {
      method: 'PUT',
      body: complianceData
    });
  }

  async deleteDocument(dealId, documentType) {
    return this.request(`/back-office/deals/${dealId}/documents/${documentType}`, {
      method: 'DELETE'
    });
  }

  async downloadDocument(dealId, documentType) {
    return this.request(`/back-office/deals/${dealId}/documents/${documentType}/download`, {
      method: 'GET',
      responseType: 'blob'
    });
  }
}

export default new ApiService(); 