import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Car, Clock, CheckCircle, AlertTriangle, AlertCircle, Eye, MessageSquare, Phone, Mail, Calendar, DollarSign, FileText, TrendingUp, Filter, Search, RefreshCw, Bell, Star, Zap, Target, Award, User, MapPin, ExternalLink, ChevronRight, MoreVertical } from 'lucide-react';
import api from '../services/api';

const SalesDealTracker = () => {
  const navigate = useNavigate();
  
  const [currentUser, setCurrentUser] = useState(null);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [viewMode, setViewMode] = useState('my-deals'); // 'my-deals', 'all-deals'

  // Sales-focused workflow stages with estimated timelines
  const salesWorkflowStages = [
    { 
      id: 'purchased', 
      name: 'Vehicle Purchased', 
      description: 'Deal created, vehicle acquired',
      color: 'green', 
      estimatedDays: 0,
      icon: CheckCircle,
      salesActions: []
    },
    { 
      id: 'documentation', 
      name: 'Collecting Documents', 
      description: 'Back office gathering required paperwork',
      color: 'orange', 
      estimatedDays: 2,
      icon: FileText,
      salesActions: ['Follow up with seller', 'Provide missing info']
    },
    { 
      id: 'verification', 
      name: 'Document Review', 
      description: 'Legal team verifying all documentation',
      color: 'blue', 
      estimatedDays: 1,
      icon: Eye,
      salesActions: ['Answer legal questions', 'Clarify deal terms']
    },
    { 
      id: 'title-processing', 
      name: 'Title & Registration', 
      description: 'Processing title transfer and registration',
      color: 'purple', 
      estimatedDays: 5,
      icon: Award,
      salesActions: ['Contact DMV if needed', 'Follow up on liens']
    },
    { 
      id: 'ready-to-list', 
      name: 'Ready to List', 
      description: 'Vehicle ready for sale to customers',
      color: 'green', 
      estimatedDays: 0,
      icon: Target,
      salesActions: ['Create listing', 'Schedule photos', 'Set pricing']
    }
  ];

  const permissions = {
    admin: {
      canViewAllDeals: true,
      canEditDeals: true,
      canViewFinancials: true,
      canContactBackOffice: true
    },
    sales: {
      canViewAllDeals: false,
      canEditDeals: true,
      canViewFinancials: false,
      canContactBackOffice: true
    },
    finance: {
      canViewAllDeals: true,
      canEditDeals: false,
      canViewFinancials: true,
      canContactBackOffice: true
    },
    viewer: {
      canViewAllDeals: false,
      canEditDeals: false,
      canViewFinancials: false,
      canContactBackOffice: false
    }
  };

  const userPermissions = currentUser ? permissions[currentUser.role] : null;

  // Load current user and deals from database
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load current user
        const userResponse = await api.get('/api/users/me');
        setCurrentUser(userResponse.data);
        
        // Load deals from back office API
        const dealsResponse = await api.getBackOfficeDeals();
        setDeals(dealsResponse.data || []);
        
        setLoading(false);
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Failed to load deals');
        setLoading(false);
      }
    };
    
    loadData();
  }, [viewMode]);

  // Filter deals based on search and filters
  const filteredDeals = deals.filter(deal => {
    const matchesSearch = deal.vehicle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         deal.stockNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         deal.seller?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = !statusFilter || deal.currentStage === statusFilter;
    const matchesPriority = !priorityFilter || deal.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStageInfo = (stageId) => {
    return salesWorkflowStages.find(s => s.id === stageId) || salesWorkflowStages[0];
  };

  const getStageProgress = (currentStage) => {
    const currentIndex = salesWorkflowStages.findIndex(s => s.id === currentStage);
    return Math.round(((currentIndex + 1) / salesWorkflowStages.length) * 100);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'normal': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'low': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getTimelineStatus = (deal) => {
    if (!deal.estimatedCompletionDate) return 'on-track';
    
    const today = new Date();
    const completionDate = new Date(deal.estimatedCompletionDate);
    const daysRemaining = Math.ceil((completionDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining < 0) return 'overdue';
    if (daysRemaining <= 1) return 'urgent';
    if (daysRemaining <= 3) return 'attention';
    return 'on-track';
  };

  const getTimelineColor = (status) => {
    switch (status) {
      case 'overdue': return 'text-red-400';
      case 'urgent': return 'text-orange-400';
      case 'attention': return 'text-yellow-400';
      case 'on-track': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const calculateEstimatedCompletion = (deal) => {
    const currentStageIndex = salesWorkflowStages.findIndex(s => s.id === deal.currentStage);
    const remainingStages = salesWorkflowStages.slice(currentStageIndex + 1);
    const estimatedDays = remainingStages.reduce((total, stage) => total + stage.estimatedDays, 0);
    
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + estimatedDays);
    return estimatedDate.toLocaleDateString();
  };

  const sendMessage = async (dealId, message) => {
    try {
      // TODO: Implement messaging API
      console.log('Message sent:', message);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  if (!currentUser || !userPermissions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/3 rounded-full blur-3xl animate-pulse delay-2000"></div>
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
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Deal Tracker</h1>
                  <p className="text-gray-300 text-sm">Monitor your deals through the back office process</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="relative p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                <Bell className="h-5 w-5 text-white" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">3</span>
              </button>
              <div className="text-right">
                <p className="text-sm font-medium text-white">{currentUser.profile?.displayName || currentUser.name}</p>
                <p className="text-xs text-gray-400">{currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative max-w-7xl mx-auto px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-500/20 rounded-xl p-3">
                <Car className="h-6 w-6 text-green-400" />
              </div>
              <span className="text-green-400 text-sm font-medium">+2 this week</span>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{filteredDeals.length}</p>
            <p className="text-gray-300 text-sm">Active Deals</p>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-500/20 rounded-xl p-3">
                <Clock className="h-6 w-6 text-blue-400" />
              </div>
              <span className="text-blue-400 text-sm font-medium">3.2 days avg</span>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{filteredDeals.filter(d => d.currentStage !== 'ready-to-list').length}</p>
            <p className="text-gray-300 text-sm">In Process</p>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-yellow-500/20 rounded-xl p-3">
                <AlertTriangle className="h-6 w-6 text-yellow-400" />
              </div>
              <span className="text-yellow-400 text-sm font-medium">Needs attention</span>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{filteredDeals.filter(d => getTimelineStatus(d) === 'overdue' || getTimelineStatus(d) === 'urgent').length}</p>
            <p className="text-gray-300 text-sm">Delayed</p>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-500/20 rounded-xl p-3">
                <Target className="h-6 w-6 text-purple-400" />
              </div>
              <span className="text-purple-400 text-sm font-medium">Ready to sell</span>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{filteredDeals.filter(d => d.currentStage === 'ready-to-list').length}</p>
            <p className="text-gray-300 text-sm">Ready to List</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by vehicle, stock number, or seller..."
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select 
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Stages</option>
                {salesWorkflowStages.map(stage => (
                  <option key={stage.id} value={stage.id}>{stage.name}</option>
                ))}
              </select>
              <select 
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
              <button className="p-3 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500/30 transition-colors">
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex space-x-4">
                <button
                  onClick={() => setViewMode('my-deals')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'my-deals' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  My Deals
                </button>
                {userPermissions.canViewAllDeals && (
                  <button
                    onClick={() => setViewMode('all-deals')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      viewMode === 'all-deals' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    All Deals
                  </button>
                )}
              </div>
              <p className="text-gray-300 text-sm">
                {loading ? 'Loading deals...' : `Showing ${filteredDeals.length} deals`}
              </p>
            </div>
          </div>
        </div>

        {/* Deals List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-gray-300">Loading your deals...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-400 mb-2">Error loading deals</p>
              <p className="text-gray-400 text-sm">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300 mb-2">
                {deals.length === 0 ? 'No deals found' : 'No deals match your search criteria'}
              </p>
              <p className="text-gray-400 text-sm">
                {deals.length === 0 
                  ? 'Your deals will appear here once they enter the system'
                  : 'Try adjusting your search or filters'
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredDeals.map((deal) => {
              const stageInfo = getStageInfo(deal.currentStage);
              const timelineStatus = getTimelineStatus(deal);
              const progress = getStageProgress(deal.currentStage);
              
              return (
                <div key={deal.id} className="group bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                  {/* Deal Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h3 className="text-xl font-bold text-white">{deal.vehicle}</h3>
                        <span className="text-gray-400 text-sm">Stock #{deal.stockNumber}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(deal.priority)}`}>
                          {deal.priority}
                        </span>
                        <span className={`text-xs font-medium ${getTimelineColor(timelineStatus)}`}>
                          {timelineStatus === 'overdue' && '⚠️ Overdue'}
                          {timelineStatus === 'urgent' && '🔥 Urgent'}
                          {timelineStatus === 'attention' && '⚡ Needs Attention'}
                          {timelineStatus === 'on-track' && '✅ On Track'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-6 text-sm text-gray-300">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          {deal.seller?.name || deal.seller?.company}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          Purchased {new Date(deal.purchaseDate).toLocaleDateString()}
                        </div>
                        {userPermissions.canViewFinancials && (
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-2" />
                            ${deal.purchasePrice?.toLocaleString()}
                          </div>
                        )}
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          Est. completion: {calculateEstimatedCompletion(deal)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium bg-${stageInfo.color}-500/20 text-${stageInfo.color}-400`}>
                        <stageInfo.icon className="h-4 w-4 mr-2" />
                        {stageInfo.name}
                      </div>
                      <button 
                        onClick={() => setSelectedDeal(deal)}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        <MoreVertical className="h-5 w-5 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm">Overall Progress</span>
                      <span className="text-white text-sm font-medium">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div 
                        className={`bg-gradient-to-r from-${stageInfo.color}-500 to-${stageInfo.color}-400 h-3 rounded-full transition-all duration-500`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Current Stage Details */}
                  <div className="bg-white/5 rounded-xl p-4 mb-4 border border-white/10">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-white font-medium mb-1">Current Status: {stageInfo.name}</h4>
                        <p className="text-gray-300 text-sm mb-3">{stageInfo.description}</p>
                        
                        {stageInfo.salesActions && stageInfo.salesActions.length > 0 && (
                          <div>
                            <p className="text-gray-400 text-xs mb-2">Actions you can take:</p>
                            <div className="flex flex-wrap gap-2">
                              {stageInfo.salesActions.map((action, index) => (
                                <span key={index} className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                                  {action}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        {deal.updatedAt && (
                          <span className="text-gray-400 text-xs">
                            Updated {new Date(deal.updatedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-3">
                      <button 
                        onClick={() => setSelectedDeal(deal)}
                        className="flex items-center px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Timeline
                      </button>
                      {userPermissions.canContactBackOffice && (
                        <button className="flex items-center px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Message Team
                        </button>
                      )}
                      <button className="flex items-center px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors text-sm">
                        <Phone className="h-4 w-4 mr-2" />
                        Contact Seller
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-3 text-xs text-gray-400">
                      <span>Deal #{deal.id}</span>
                      <span>•</span>
                      <span>Started {new Date(deal.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Deal Detail Modal */}
        {selectedDeal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900/95 backdrop-blur-lg rounded-3xl border border-white/20 p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">{selectedDeal.vehicle} - Deal Timeline</h2>
                <button 
                  onClick={() => setSelectedDeal(null)}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-white" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Deal Information */}
                <div className="lg:col-span-1">
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-6">
                    <h3 className="text-lg font-bold text-white mb-4">Deal Information</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-gray-400 text-sm">Vehicle</p>
                        <p className="text-white">{selectedDeal.vehicle}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Stock Number</p>
                        <p className="text-white">{selectedDeal.stockNumber}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Seller</p>
                        <p className="text-white">{selectedDeal.seller?.name || selectedDeal.seller?.company}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Purchase Date</p>
                        <p className="text-white">{new Date(selectedDeal.purchaseDate).toLocaleDateString()}</p>
                      </div>
                      {userPermissions.canViewFinancials && (
                        <div>
                          <p className="text-gray-400 text-sm">Purchase Price</p>
                          <p className="text-green-400 font-medium">${selectedDeal.purchasePrice?.toLocaleString()}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-gray-400 text-sm">Estimated Completion</p>
                        <p className="text-blue-400 font-medium">{calculateEstimatedCompletion(selectedDeal)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <button className="w-full flex items-center justify-center px-4 py-3 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors">
                        <Phone className="h-4 w-4 mr-2" />
                        Call Seller
                      </button>
                      <button className="w-full flex items-center justify-center px-4 py-3 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors">
                        <Mail className="h-4 w-4 mr-2" />
                        Email Update
                      </button>
                      <button className="w-full flex items-center justify-center px-4 py-3 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message Back Office
                      </button>
                      <button className="w-full flex items-center justify-center px-4 py-3 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors">
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Follow-up
                      </button>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="lg:col-span-2">
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <h3 className="text-lg font-bold text-white mb-6">Deal Progress Timeline</h3>
                    <div className="space-y-6">
                      {salesWorkflowStages.map((stage, index) => {
                        const isCompleted = salesWorkflowStages.findIndex(s => s.id === selectedDeal.currentStage) > index;
                        const isCurrent = stage.id === selectedDeal.currentStage;
                        const isUpcoming = !isCompleted && !isCurrent;
                        
                        return (
                          <div key={stage.id} className="relative flex items-start">
                            {/* Timeline Line */}
                            {index < salesWorkflowStages.length - 1 && (
                              <div className={`absolute left-6 top-12 w-0.5 h-16 ${
                                isCompleted ? `bg-${stage.color}-500` : 'bg-gray-600'
                              }`}></div>
                            )}
                            
                            {/* Stage Icon */}
                            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                              isCompleted 
                                ? `bg-${stage.color}-500 border-${stage.color}-500 text-white` 
                                : isCurrent
                                ? `bg-${stage.color}-500/20 border-${stage.color}-500 text-${stage.color}-400`
                                : 'bg-gray-700 border-gray-600 text-gray-400'
                            }`}>
                              {isCompleted ? (
                                <CheckCircle className="h-6 w-6" />
                              ) : (
                                <stage.icon className="h-6 w-6" />
                              )}
                            </div>
                            
                            {/* Stage Content */}
                            <div className="ml-6 flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className={`font-medium ${
                                  isCurrent ? `text-${stage.color}-400` : isCompleted ? 'text-white' : 'text-gray-400'
                                }`}>
                                  {stage.name}
                                </h4>
                                <div className="flex items-center space-x-2">
                                  {stage.estimatedDays > 0 && (
                                    <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded">
                                      ~{stage.estimatedDays} day{stage.estimatedDays !== 1 ? 's' : ''}
                                    </span>
                                  )}
                                  {isCurrent && (
                                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                                      In Progress
                                    </span>
                                  )}
                                  {isCompleted && (
                                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                                      Completed
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className={`text-sm mb-3 ${
                                isCurrent ? 'text-gray-300' : 'text-gray-500'
                              }`}>
                                {stage.description}
                              </p>
                              
                              {/* Sales Actions for Current Stage */}
                              {isCurrent && stage.salesActions && stage.salesActions.length > 0 && (
                                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                                  <p className="text-xs text-gray-400 mb-2">You can help by:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {stage.salesActions.map((action, actionIndex) => (
                                      <button
                                        key={actionIndex}
                                        className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded hover:bg-blue-500/30 transition-colors"
                                      >
                                        {action}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesDealTracker; 