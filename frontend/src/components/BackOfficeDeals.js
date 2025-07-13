import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle, Clock, AlertTriangle, Car, Upload, Download, Edit, Eye, Filter, Search, Plus, Calendar, DollarSign, User, Building2, MapPin, Phone, Mail, Paperclip, Shield, AlertCircle, ChevronRight, MoreVertical } from 'lucide-react';
import api from '../services/api';

const BackOfficeDeals = () => {
  const navigate = useNavigate();
  
  const [currentUser, setCurrentUser] = useState(null);

  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Document types that need tracking
  const documentTypes = [
    { id: 'title', name: 'Title', required: true, icon: FileText },
    { id: 'contract', name: 'Purchase Contract', required: true, icon: FileText },
    { id: 'driversLicense', name: 'Driver\'s License', required: true, icon: Shield },
    { id: 'odometer', name: 'Odometer Statement', required: true, icon: Car },
    { id: 'dealerLicense', name: 'Dealer License', required: false, icon: Building2 },
    { id: 'paymentProof', name: 'Payment Verification', required: true, icon: DollarSign },
    { id: 'inspection', name: 'Vehicle Inspection', required: false, icon: CheckCircle },
    { id: 'insurance', name: 'Insurance Documents', required: false, icon: Shield }
  ];

  // Deal workflow stages
  const workflowStages = [
    { id: 'documentation', name: 'Documentation Collection', color: 'orange' },
    { id: 'verification', name: 'Document Verification', color: 'blue' },
    { id: 'processing', name: 'Title Processing', color: 'purple' },
    { id: 'completion', name: 'Deal Completion', color: 'green' }
  ];

  const permissions = {
    admin: {
      canAccessBackOffice: true,
      canEditDeals: true,
      canViewFinancials: true,
      canManageDocuments: true,
      canApproveDocuments: true
    },
    sales: {
      canAccessBackOffice: false,
      canEditDeals: true,
      canViewFinancials: false,
      canManageDocuments: false,
      canApproveDocuments: false
    },
    finance: {
      canAccessBackOffice: true,
      canEditDeals: true,
      canViewFinancials: true,
      canManageDocuments: true,
      canApproveDocuments: true
    },
    viewer: {
      canAccessBackOffice: false,
      canEditDeals: false,
      canViewFinancials: false,
      canManageDocuments: false,
      canApproveDocuments: false
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
  }, []);

  // Filter deals based on search and filters
  const filteredDeals = deals.filter(deal => {
    const matchesSearch = deal.vehicle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         deal.stockNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         deal.seller?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = !statusFilter || deal.currentStage === statusFilter;
    const matchesPriority = !priorityFilter || deal.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStageColor = (stage) => {
    const stageObj = workflowStages.find(s => s.id === stage);
    return stageObj ? stageObj.color : 'gray';
  };

  const getDocumentStatus = (documents, docType) => {
    const doc = documents?.find(d => d.type === docType);
    if (!doc) return 'missing';
    if (doc.approved) return 'approved';
    if (doc.uploaded) return 'pending';
    return 'missing';
  };

  const getDocumentStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'missing': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getDocumentStatusIcon = (status) => {
    switch (status) {
      case 'approved': return CheckCircle;
      case 'pending': return Clock;
      case 'missing': return AlertTriangle;
      default: return AlertCircle;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'low': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const calculateProgress = (documents) => {
    if (!documents) return 0;
    const requiredDocs = documentTypes.filter(dt => dt.required);
    const completedDocs = requiredDocs.filter(dt => {
      const doc = documents.find(d => d.type === dt.id);
      return doc && doc.approved;
    });
    return Math.round((completedDocs.length / requiredDocs.length) * 100);
  };

  const updateDocumentStatus = async (dealId, docType, status) => {
    try {
      if (status === 'approved') {
        await api.approveDocument(dealId, docType, true);
      } else if (status === 'pending') {
        // Mark as received (uploaded but not approved)
        await api.approveDocument(dealId, docType, false);
      }
      
      // Reload deals to get updated data
      const dealsResponse = await api.getBackOfficeDeals();
      setDeals(dealsResponse.data || []);
    } catch (err) {
      console.error('Failed to update document status:', err);
    }
  };

  if (!currentUser || !userPermissions?.canAccessBackOffice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-6">You don't have permission to access the Back Office.</p>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl text-white font-medium hover:scale-105 transition-transform duration-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/3 rounded-full blur-3xl animate-pulse delay-2000"></div>
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
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-3 mr-4">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Back Office Operations</h1>
                  <p className="text-gray-300 text-sm">Documentation & Compliance Tracking</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{currentUser.profile?.displayName || currentUser.name}</p>
                <p className="text-xs text-gray-400">{currentUser.role}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by vehicle, stock number, or seller..."
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select 
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Stages</option>
                {workflowStages.map(stage => (
                  <option key={stage.id} value={stage.id}>{stage.name}</option>
                ))}
              </select>
              <select 
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <p className="text-gray-300 text-sm">
                {loading ? 'Loading deals...' : `Showing ${filteredDeals.length} of ${deals.length} deals`}
              </p>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400">Total pending tasks:</span>
                <span className="bg-orange-500/20 text-orange-400 text-xs font-medium px-2 py-1 rounded-full">
                  6
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Deals List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-gray-300">Loading deals...</p>
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
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300 mb-2">
                {deals.length === 0 ? 'No deals found' : 'No deals match your search criteria'}
              </p>
              <p className="text-gray-400 text-sm">
                {deals.length === 0 
                  ? 'Deals will appear here once they enter the documentation phase'
                  : 'Try adjusting your search or filters'
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredDeals.map((deal) => (
              <div key={deal.id} className="group bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                {/* Deal Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <h3 className="text-xl font-bold text-white">{deal.vehicle}</h3>
                      <span className="text-gray-400 text-sm">Stock #{deal.stockNumber}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(deal.priority)}`}>
                        {deal.priority} priority
                      </span>
                    </div>
                    <div className="flex items-center space-x-6 text-sm text-gray-300">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        {deal.seller?.name || deal.seller?.company}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(deal.purchaseDate).toLocaleDateString()}
                      </div>
                      {userPermissions.canViewFinancials && (
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-2" />
                          ${deal.purchasePrice?.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className={`px-4 py-2 rounded-xl text-sm font-medium bg-${getStageColor(deal.currentStage)}-500/20 text-${getStageColor(deal.currentStage)}-400`}>
                      {workflowStages.find(s => s.id === deal.currentStage)?.name}
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
                    <span className="text-gray-400 text-sm">Documentation Progress</span>
                    <span className="text-white text-sm font-medium">{calculateProgress(deal.documents)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className={`bg-gradient-to-r from-${getStageColor(deal.currentStage)}-500 to-${getStageColor(deal.currentStage)}-400 h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${calculateProgress(deal.documents)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Document Status Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {documentTypes.filter(dt => dt.required).map((docType) => {
                    const status = getDocumentStatus(deal.documents, docType.id);
                    const StatusIcon = getDocumentStatusIcon(status);
                    
                    return (
                      <div key={docType.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <docType.icon className="h-5 w-5 text-gray-400" />
                          <StatusIcon className={`h-4 w-4 ${getDocumentStatusColor(status)}`} />
                        </div>
                        <h4 className="text-white text-sm font-medium mb-1">{docType.name}</h4>
                        <p className={`text-xs ${getDocumentStatusColor(status)} capitalize`}>
                          {status === 'missing' ? 'Not Received' : status}
                        </p>
                        {userPermissions.canManageDocuments && status !== 'approved' && (
                          <div className="mt-2 flex space-x-1">
                            {status === 'missing' && (
                              <button 
                                onClick={() => updateDocumentStatus(deal.id, docType.id, 'pending')}
                                className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded hover:bg-blue-500/30 transition-colors"
                              >
                                Mark Received
                              </button>
                            )}
                            {status === 'pending' && userPermissions.canApproveDocuments && (
                              <button 
                                onClick={() => updateDocumentStatus(deal.id, docType.id, 'approved')}
                                className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded hover:bg-green-500/30 transition-colors"
                              >
                                Approve
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => setSelectedDeal(deal)}
                      className="flex items-center px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors text-sm"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </button>
                    {userPermissions.canEditDeals && (
                      <button className="flex items-center px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Deal
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-3 text-xs text-gray-400">
                    <span>Last updated: {new Date(deal.updatedAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>Assigned to: {deal.assignedTo?.profile?.displayName || 'Unassigned'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Deal Detail Modal */}
        {selectedDeal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900/95 backdrop-blur-lg rounded-3xl border border-white/20 p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">{selectedDeal.vehicle} - Documentation</h2>
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
                        <p className="text-gray-400 text-sm">VIN</p>
                        <p className="text-white font-mono text-sm">{selectedDeal.vin}</p>
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
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <h3 className="text-lg font-bold text-white mb-4">Workflow Status</h3>
                    <div className="space-y-3">
                      {workflowStages.map((stage, index) => (
                        <div key={stage.id} className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full ${
                            selectedDeal.currentStage === stage.id ? `bg-${stage.color}-500` :
                            index < workflowStages.findIndex(s => s.id === selectedDeal.currentStage) ? `bg-${stage.color}-500` :
                            'bg-gray-600'
                          }`}></div>
                          <span className={`text-sm ${
                            selectedDeal.currentStage === stage.id ? `text-${stage.color}-400` : 'text-gray-400'
                          }`}>
                            {stage.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Document Checklist */}
                <div className="lg:col-span-2">
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <h3 className="text-lg font-bold text-white mb-6">Document Checklist</h3>
                    <div className="space-y-4">
                      {documentTypes.map((docType) => {
                        const status = getDocumentStatus(selectedDeal.documents, docType.id);
                        const StatusIcon = getDocumentStatusIcon(status);
                        
                        return (
                          <div key={docType.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                            <div className="flex items-center space-x-4">
                              <docType.icon className="h-6 w-6 text-gray-400" />
                              <div>
                                <h4 className="text-white font-medium">{docType.name}</h4>
                                <p className="text-gray-400 text-sm">
                                  {docType.required ? 'Required' : 'Optional'}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <StatusIcon className={`h-5 w-5 ${getDocumentStatusColor(status)}`} />
                                <span className={`text-sm ${getDocumentStatusColor(status)} capitalize`}>
                                  {status === 'missing' ? 'Not Received' : status}
                                </span>
                              </div>
                              
                              {userPermissions.canManageDocuments && (
                                <div className="flex space-x-2">
                                  {status === 'missing' && (
                                    <>
                                      <button className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors">
                                        <Upload className="h-4 w-4" />
                                      </button>
                                      <button 
                                        onClick={() => updateDocumentStatus(selectedDeal.id, docType.id, 'pending')}
                                        className="px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-xs"
                                      >
                                        Mark Received
                                      </button>
                                    </>
                                  )}
                                  {status === 'pending' && userPermissions.canApproveDocuments && (
                                    <button 
                                      onClick={() => updateDocumentStatus(selectedDeal.id, docType.id, 'approved')}
                                      className="px-3 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-xs"
                                    >
                                      Approve
                                    </button>
                                  )}
                                  {status === 'approved' && (
                                    <button className="p-2 bg-gray-500/20 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-colors">
                                      <Download className="h-4 w-4" />
                                    </button>
                                  )}
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

export default BackOfficeDeals; 