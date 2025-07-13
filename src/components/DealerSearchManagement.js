import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter, MapPin, Phone, Mail, Star, TrendingUp, DollarSign, Car, Calendar, Eye, Edit, Trash2, ExternalLink, ArrowLeft, Users, Building2, Clock, CheckCircle, AlertCircle, User, MoreVertical, Download, Upload } from 'lucide-react';
import ApiService from '../services/api';

const DealerSearchManagement = () => {
  const navigate = useNavigate();
  
  const [currentUser, setCurrentUser] = useState({
    name: 'Chris Murphy',
    email: 'chris@rpexotics.com',
    role: 'admin'
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    state: '',
    dealType: '',
    status: '',
    rating: '',
    lastDeal: ''
  });
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [showAddDealer, setShowAddDealer] = useState(false);

  // Dealer data state - to be populated from MongoDB
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load dealers from database on component mount
  useEffect(() => {
    const loadDealers = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call to MongoDB
        // const response = await ApiService.getDealers();
        // setDealers(response.dealers || []);
        
        // For now, use mock data until backend is fully connected
        setDealers([
          {
            id: '1',
            name: 'GMTV',
            company: 'Give Me The Vin',
            type: 'Dealer',
            status: 'Active',
            location: 'Nationwide',
            phone: '8002491095',
            email: 'abdulla.abunasrah@givemethevin.com',
            rating: 4.8,
            totalDeals: 45,
            totalVolume: '$2.1M',
            avgDealSize: '$46,667',
            lastDeal: '2024-01-15',
            responseTime: '< 2 hours',
            notes: 'Excellent communication and quick response times. Preferred partner for high-end vehicles.',
            address: 'Nationwide Service',
            recentDeals: [
              { vehicle: '2023 McLaren 720S', amount: 285000, date: '2024-01-15', status: 'Completed' },
              { vehicle: '2022 Ferrari F8', amount: 320000, date: '2024-01-10', status: 'Completed' },
              { vehicle: '2023 Lamborghini Huracan', amount: 245000, date: '2024-01-05', status: 'Completed' }
            ]
          },
          {
            id: '2',
            name: 'McLaren NJ / Suburban Exotics',
            company: 'Suburban Exotics',
            type: 'Dealer',
            status: 'Active',
            location: 'New Jersey, NJ',
            phone: '(555) 123-4567',
            email: 'Anthony@squadrav.com',
            rating: 4.6,
            totalDeals: 32,
            totalVolume: '$1.8M',
            avgDealSize: '$56,250',
            lastDeal: '2024-01-12',
            responseTime: '< 4 hours',
            notes: 'Specialized in McLaren vehicles. Great relationship for exclusive models.',
            address: '123 Exotic Drive, New Jersey, NJ 07001',
            recentDeals: [
              { vehicle: '2023 McLaren Artura', amount: 225000, date: '2024-01-12', status: 'Completed' },
              { vehicle: '2022 McLaren GT', amount: 195000, date: '2024-01-08', status: 'Completed' }
            ]
          },
          {
            id: '3',
            name: 'AutoPark Dallas',
            company: 'AutoPark Dallas',
            type: 'Dealer',
            status: 'Active',
            location: 'Dallas, TX',
            phone: '972-639-7707',
            email: 'tristan@autoparkdallas.com',
            rating: 4.4,
            totalDeals: 28,
            totalVolume: '$1.2M',
            avgDealSize: '$42,857',
            lastDeal: '2024-01-14',
            responseTime: '< 6 hours',
            notes: 'Strong presence in Texas market. Good for regional deals.',
            address: '456 Luxury Lane, Dallas, TX 75201',
            recentDeals: [
              { vehicle: '2023 Porsche 911 GT3', amount: 185000, date: '2024-01-14', status: 'Completed' },
              { vehicle: '2022 Aston Martin DB11', amount: 165000, date: '2024-01-09', status: 'Completed' }
            ]
          }
        ]);
        setLoading(false);
      } catch (err) {
        setError('Failed to load dealers');
        setLoading(false);
      }
    };
    
    loadDealers();
  }, []);

  const permissions = {
    admin: {
      canSearchDealers: true,
      canManageDealers: true,
      canViewDeals: true,
      canViewFinancials: true,
      canAddDealer: true,
      canEditDealer: true,
      canDeleteDealer: true
    },
    sales: {
      canSearchDealers: true,
      canManageDealers: true,
      canViewDeals: true,
      canViewFinancials: false,
      canAddDealer: true,
      canEditDealer: true,
      canDeleteDealer: false
    },
    finance: {
      canSearchDealers: true,
      canManageDealers: false,
      canViewDeals: true,
      canViewFinancials: true,
      canAddDealer: false,
      canEditDealer: false,
      canDeleteDealer: false
    },
    viewer: {
      canSearchDealers: true,
      canManageDealers: false,
      canViewDeals: true,
      canViewFinancials: false,
      canAddDealer: false,
      canEditDealer: false,
      canDeleteDealer: false
    }
  };

  const userPermissions = permissions[currentUser.role];

  // Filter dealers based on search and filters
  const filteredDealers = dealers.filter(dealer => {
    const matchesSearch = dealer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         dealer.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         dealer.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesState = !selectedFilters.state || dealer.location.includes(selectedFilters.state);
    const matchesType = !selectedFilters.dealType || dealer.type === selectedFilters.dealType;
    const matchesStatus = !selectedFilters.status || dealer.status === selectedFilters.status;
    const matchesRating = !selectedFilters.rating || dealer.rating >= parseFloat(selectedFilters.rating);
    
    return matchesSearch && matchesState && matchesType && matchesStatus && matchesRating;
  });

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return 'text-green-400';
    if (rating >= 4.0) return 'text-yellow-400';
    if (rating >= 3.5) return 'text-orange-400';
    return 'text-red-400';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-500/20 text-green-400';
      case 'Inactive': return 'bg-gray-500/20 text-gray-400';
      case 'Pending': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-500/3 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Header */}
      <header className="relative bg-black/20 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button 
                onClick={() => navigate('/')}
                className="mr-4 p-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-3 mr-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Dealer Management</h1>
                  <p className="text-gray-300 text-sm">Search & manage dealer relationships</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{currentUser.name}</p>
                <p className="text-xs text-gray-400">{currentUser.role}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filters Section */}
        <div className="mb-8">
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
            {/* Search Bar */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search dealers by name, company, or location..."
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {userPermissions.canAddDealer && (
                <button 
                  onClick={() => setShowAddDealer(true)}
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl text-white font-medium hover:scale-105 transition-transform duration-200 shadow-lg"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Dealer
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <select 
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                value={selectedFilters.state}
                onChange={(e) => setSelectedFilters({...selectedFilters, state: e.target.value})}
              >
                <option value="">All States</option>
                <option value="MO">Missouri</option>
                <option value="IL">Illinois</option>
                <option value="TX">Texas</option>
                <option value="CA">California</option>
                <option value="KS">Kansas</option>
                <option value="NJ">New Jersey</option>
              </select>

              <select 
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                value={selectedFilters.dealType}
                onChange={(e) => setSelectedFilters({...selectedFilters, dealType: e.target.value})}
              >
                <option value="">All Types</option>
                <option value="Dealer">Dealer</option>
                <option value="Private Seller">Private Seller</option>
                <option value="Auction">Auction</option>
              </select>

              <select 
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                value={selectedFilters.status}
                onChange={(e) => setSelectedFilters({...selectedFilters, status: e.target.value})}
              >
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Pending">Pending</option>
              </select>

              <select 
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                value={selectedFilters.rating}
                onChange={(e) => setSelectedFilters({...selectedFilters, rating: e.target.value})}
              >
                <option value="">All Ratings</option>
                <option value="4.5">4.5+ Stars</option>
                <option value="4.0">4.0+ Stars</option>
                <option value="3.5">3.5+ Stars</option>
              </select>

              <select 
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name">Sort by Name</option>
                <option value="rating">Sort by Rating</option>
                <option value="deals">Sort by Deals</option>
                <option value="volume">Sort by Volume</option>
                <option value="lastDeal">Sort by Recent</option>
              </select>
            </div>

            {/* View Toggle and Results Count */}
            <div className="flex items-center justify-between">
              <p className="text-gray-300 text-sm">
                {loading ? 'Loading dealers...' : `Showing ${filteredDealers.length} of ${dealers.length} dealers`}
              </p>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-gray-400 hover:text-white'}`}
                >
                  <Building2 className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-gray-400 hover:text-white'}`}
                >
                  <Users className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dealers Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-gray-300">Loading dealers...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-400 mb-2">Error loading dealers</p>
              <p className="text-gray-400 text-sm">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : filteredDealers.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300 mb-2">
                {dealers.length === 0 ? 'No dealers found' : 'No dealers match your search criteria'}
              </p>
              <p className="text-gray-400 text-sm mb-4">
                {dealers.length === 0 
                  ? 'Add your first dealer to get started'
                  : 'Try adjusting your search or filters'
                }
              </p>
              {userPermissions.canAddDealer && dealers.length === 0 && (
                <button 
                  onClick={() => setShowAddDealer(true)}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl text-white font-medium hover:scale-105 transition-transform duration-200 shadow-lg"
                >
                  <Plus className="h-5 w-5 mr-2 inline" />
                  Add First Dealer
                </button>
              )}
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDealers.map((dealer) => (
              <div key={dealer.id} className="group bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 cursor-pointer">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">{dealer.name}</h3>
                    <p className="text-gray-300 text-sm">{dealer.company}</p>
                    <div className="flex items-center mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(dealer.status)}`}>
                        {dealer.status}
                      </span>
                      <span className="ml-2 text-xs text-gray-400">{dealer.type}</span>
                    </div>
                  </div>
                  {userPermissions.canManageDealers && (
                    <div className="relative">
                      <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                        <MoreVertical className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Location and Contact */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-300 text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    {dealer.location}
                  </div>
                  <div className="flex items-center text-gray-300 text-sm">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    {dealer.phone}
                  </div>
                  <div className="flex items-center text-gray-300 text-sm">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    {dealer.email}
                  </div>
                </div>

                {/* Rating and Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Star className={`h-4 w-4 mr-1 ${getRatingColor(dealer.rating)}`} fill="currentColor" />
                      <span className={`font-bold ${getRatingColor(dealer.rating)}`}>{dealer.rating}</span>
                    </div>
                    <p className="text-xs text-gray-400">Rating</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{dealer.totalDeals}</p>
                    <p className="text-xs text-gray-400">Deals</p>
                  </div>
                </div>

                {/* Volume and Last Deal */}
                <div className="space-y-2 mb-4">
                  {userPermissions.canViewFinancials && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Volume:</span>
                      <span className="text-green-400 font-medium text-sm">{dealer.totalVolume}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Last Deal:</span>
                    <span className="text-white text-sm">{dealer.lastDeal}</span>
                  </div>

                </div>



                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setSelectedDealer(dealer)}
                    className="flex-1 py-2 px-3 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm font-medium"
                  >
                    View Details
                  </button>
                  {userPermissions.canEditDealer && (
                    <button className="py-2 px-3 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors">
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 font-medium text-gray-300 text-sm">
              <div className="col-span-3">Dealer Info</div>
              <div className="col-span-2">Location</div>
              <div className="col-span-1">Rating</div>
              <div className="col-span-1">Deals</div>
              {userPermissions.canViewFinancials && <div className="col-span-2">Volume</div>}
              <div className="col-span-2">Last Deal</div>
              <div className="col-span-1">Actions</div>
            </div>
            
            <div className="divide-y divide-white/10">
              {filteredDealers.map((dealer) => (
                <div key={dealer.id} className="grid grid-cols-12 gap-4 p-4 hover:bg-white/5 transition-colors">
                  <div className="col-span-3">
                    <h4 className="font-medium text-white">{dealer.name}</h4>
                    <p className="text-sm text-gray-400">{dealer.company}</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(dealer.status)}`}>
                      {dealer.status}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <p className="text-white text-sm">{dealer.location}</p>
                    <p className="text-gray-400 text-xs">{dealer.type}</p>
                  </div>
                  <div className="col-span-1">
                    <div className="flex items-center">
                      <Star className={`h-4 w-4 mr-1 ${getRatingColor(dealer.rating)}`} fill="currentColor" />
                      <span className={`font-bold ${getRatingColor(dealer.rating)}`}>{dealer.rating}</span>
                    </div>
                  </div>
                  <div className="col-span-1">
                    <p className="text-white font-medium">{dealer.totalDeals}</p>
                  </div>
                  {userPermissions.canViewFinancials && (
                    <div className="col-span-2">
                      <p className="text-green-400 font-medium">{dealer.totalVolume}</p>
                      <p className="text-gray-400 text-xs">Avg: {dealer.avgDealSize}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <p className="text-white text-sm">{dealer.lastDeal}</p>
                  </div>
                  <div className="col-span-1">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => setSelectedDealer(dealer)}
                        className="p-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {userPermissions.canEditDealer && (
                        <button className="p-1 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors">
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dealer Detail Modal */}
        {selectedDealer && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900/95 backdrop-blur-lg rounded-3xl border border-white/20 p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">{selectedDealer.name}</h2>
                <button 
                  onClick={() => setSelectedDealer(null)}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-white" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Contact Information */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <h3 className="text-lg font-bold text-white mb-4">Contact Information</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-gray-400 text-sm">Company</p>
                        <p className="text-white">{selectedDealer.company}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Type</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedDealer.status)}`}>
                          {selectedDealer.type}
                        </span>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Address</p>
                        <p className="text-white text-sm">{selectedDealer.address}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Phone</p>
                        <p className="text-white">{selectedDealer.phone}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Email</p>
                        <p className="text-white">{selectedDealer.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <h3 className="text-lg font-bold text-white mb-4">Performance Metrics</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Rating</span>
                        <div className="flex items-center">
                          <Star className={`h-4 w-4 mr-1 ${getRatingColor(selectedDealer.rating)}`} fill="currentColor" />
                          <span className={`font-bold ${getRatingColor(selectedDealer.rating)}`}>{selectedDealer.rating}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Response Time</span>
                        <span className="text-blue-400 font-medium">{selectedDealer.responseTime}</span>
                      </div>
                      {userPermissions.canViewFinancials && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Total Volume</span>
                            <span className="text-green-400 font-medium">{selectedDealer.totalVolume}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Avg Deal Size</span>
                            <span className="text-green-400 font-medium">{selectedDealer.avgDealSize}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recent Deals and Activity */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <h3 className="text-lg font-bold text-white mb-4">Recent Deals</h3>
                    {selectedDealer.recentDeals && selectedDealer.recentDeals.length > 0 ? (
                      <div className="space-y-3">
                        {selectedDealer.recentDeals.map((deal, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                            <div>
                              <h4 className="text-white font-medium">{deal.vehicle}</h4>
                              <p className="text-gray-400 text-sm">{deal.date}</p>
                            </div>
                            <div className="text-right">
                              {userPermissions.canViewFinancials && deal.amount && (
                                <p className="text-green-400 font-medium">{typeof deal.amount === 'number' ? `$${deal.amount.toLocaleString()}` : deal.amount}</p>
                              )}
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                deal.status === 'Completed' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'
                              }`}>
                                {deal.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-400">No recent deals found</p>
                        <p className="text-gray-500 text-sm">Deal history will appear here once transactions are completed</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <h3 className="text-lg font-bold text-white mb-4">Notes</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-gray-400 text-sm mb-2">Notes</p>
                        <p className="text-white text-sm">{selectedDealer.notes || 'No notes available'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {userPermissions.canManageDealers && (
                    <div className="flex space-x-4">
                      <button 
                        onClick={() => {
                          setSelectedDealer(null);
                          navigate('/new-deal');
                        }}
                        className="flex-1 py-3 px-6 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl text-white font-medium hover:scale-105 transition-transform duration-200"
                      >
                        Create New Deal
                      </button>
                      <button className="py-3 px-6 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-colors">
                        Edit Dealer
                      </button>
                      <button className="py-3 px-6 bg-gray-500/20 text-gray-400 rounded-xl hover:bg-gray-500/30 transition-colors">
                        Export Data
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DealerSearchManagement; 