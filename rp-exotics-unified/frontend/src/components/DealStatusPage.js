import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Car, 
  DollarSign, 
  User, 
  Calendar, 
  ArrowLeft,
  Play,
  Lock,
  Search,
  RefreshCw,
  Edit3,
  TrendingUp,
  XCircle,
  Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const statusDisplayMap = {
  'contract-received': 'Initial Contact',
  'title-processing': 'Documentation',
  'payment-approved': 'Finance Review',
  'funds-disbursed': 'Funds Disbursed',
  'title-received': 'Title Received',
  'deal-complete': 'Completion'
};
const progressSteps = [
  'contract-received',
  'title-processing',
  'payment-approved',
  'funds-disbursed',
  'title-received',
  'deal-complete'
];

// Add a mapping for dealType2SubType display names
const dealType2DisplayMap = {
  'buy': 'Buy',
  'sale': 'Sale',
  'buy-sell': 'Buy/Sell',
  'consign-a': 'Consign-A',
  'consign-b': 'Consign-B',
  'consign-c': 'Consign-C',
  'consign-rdnc': 'Consign-RDNC'
};

const DealStatusPage = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDeal, setExpandedDeal] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDealType, setFilterDealType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastSync, setLastSync] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDeals();
    
    // Set up auto-refresh every 30 seconds if enabled
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchDeals();
        setLastSync(new Date());
      }, 30000); // 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/deals', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        const dealsData = data.deals || data.data || [];
        
        // Transform backend data to match frontend format
        const transformedDeals = dealsData.map(deal => ({
          id: deal._id || deal.id,
          stockNumber: deal.rpStockNumber || deal.stockNumber,
          vin: deal.vin,
          vehicle: `${deal.year || ''} ${deal.make || ''} ${deal.model || ''}`.trim(),
          dealType: deal.dealType || 'wholesale',
          currentStage: deal.currentStage || 'initial-contact',
          seller: deal.seller?.name || 'Unknown',
          buyerContact: deal.buyer?.name || 'Pending',
          purchasePrice: deal.purchasePrice || 0,
          salePrice: deal.listPrice || deal.salePrice || 0,
          payoffBalance: deal.payoffBalance || 0,
          createdDate: new Date(deal.createdAt || deal.createdDate).toISOString().split('T')[0],
          lastUpdated: new Date(deal.updatedAt || deal.lastUpdated).toISOString().split('T')[0],
          priority: deal.priority || 'medium',
          notes: deal.notes || deal.generalNotes || '',
          paymentMethod: deal.paymentMethod || 'Check',
          requiresContract: true,
          documentation: {
            contract: { status: 'received', date: deal.createdDate },
            title: { status: deal.titleInfo?.status === 'clean' ? 'received' : 'pending', date: deal.titleInfo?.titleReceivedDate },
            odometer: { status: 'pending', date: null },
            paymentApproval: { status: 'approved', date: deal.createdDate }
          },
          titleInfo: deal.titleInfo || {},
          wholesalePrice: deal.wholesalePrice || null,
          dealType2SubType: deal.dealType2SubType || deal.dealType2 || '',
        }));
        
        setDeals(transformedDeals);
      }
    } catch (error) {
      console.error('Error fetching deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStageInfo = (currentStage) => {
    return {
      id: currentStage,
      label: statusDisplayMap[currentStage] || currentStage,
      description: {
        'contract-received': 'Deal created and initial contact made',
        'title-processing': 'Documents being prepared and reviewed',
        'payment-approved': 'Financial terms and approval process',
        'funds-disbursed': 'Funds have been disbursed',
        'title-received': 'Title has been received',
        'deal-complete': 'Deal finalized and closed'
      }[currentStage] || ''
    };
  };
  const getStageProgress = (currentStage) => {
    const currentIndex = progressSteps.indexOf(currentStage);
    return currentIndex >= 0 ? Math.round((currentIndex / (progressSteps.length - 1)) * 100) : 0;
  };

  const getStatusColor = (stage) => {
    switch (stage) {
      case 'deal-complete':
        return 'green';
      case 'payment-approved':
      case 'funds-disbursed':
      case 'title-received':
        return 'blue';
      case 'title-processing':
      case 'contract-received':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-400';
      case 'medium':
        return 'text-orange-400';
      case 'low':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  const filteredDeals = deals.filter(deal => {
    const matchesSearch = searchTerm === '' || 
      deal.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.stockNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.vin?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || deal.currentStage === filterStatus;
    const matchesType = filterDealType === 'all' || deal.dealType === filterDealType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-white text-lg">Loading deals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Sales Deal Status</h1>
                <p className="text-gray-300">Track and monitor your deals through the sales pipeline</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Auto-refresh toggle */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoRefresh"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="autoRefresh" className="text-gray-300 text-sm">
                  Auto-refresh
                </label>
              </div>
              
              {/* Last sync indicator */}
              {lastSync && (
                <div className="text-gray-400 text-sm">
                  Last sync: {lastSync.toLocaleTimeString()}
                </div>
              )}
              
              <button 
                onClick={fetchDeals}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search deals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <select
              value={filterDealType}
              onChange={(e) => setFilterDealType(e.target.value)}
              className="bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Deal Types</option>
              <option value="wholesale-d2d">Wholesale D2D</option>
              <option value="retail">Retail</option>
              <option value="retail-pp">Retail PP</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="contract-received">Initial Contact</option>
              <option value="title-processing">Documentation</option>
              <option value="payment-approved">Finance Review</option>
              <option value="deal-complete">Complete</option>
            </select>

            <div className="text-white text-sm flex items-center">
              <span className="text-gray-400">Showing:</span>
              <span className="ml-2 font-medium">{filteredDeals.length} deals</span>
            </div>
          </div>
        </div>

        {/* Deals Grid */}
        <div className="space-y-4">
          {filteredDeals.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-white text-lg font-medium mb-2">No deals found</h3>
                <p className="text-gray-400">Try adjusting your filters or search terms.</p>
              </div>
            </div>
          ) : (
            filteredDeals.map((deal) => {
              const stageInfo = getStageInfo(deal.currentStage);
              const progress = getStageProgress(deal.currentStage);
              const statusColor = getStatusColor(deal.currentStage);
              const priorityColor = getPriorityColor(deal.priority);

              return (
                <div key={deal.id} className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-3">
                        <Car className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-3 mb-1">
                          <h3 className="text-xl font-bold text-white">{deal.vehicle}</h3>
                          <span className="bg-gray-500/20 text-gray-400 text-xs font-medium px-2 py-1 rounded-full">
                            {deal.dealType.toUpperCase()}
                          </span>
                          {/* Show Deal Type 2 if present */}
                          {deal.dealType2SubType && deal.dealType !== 'wholesale-flip' && (
                            <span className="bg-gray-500/20 text-gray-400 text-xs font-medium px-2 py-1 rounded-full">
                              {dealType2DisplayMap[deal.dealType2SubType] || deal.dealType2SubType}
                            </span>
                          )}
                          {/* Sync status indicator */}
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" title="In sync with finance system"></div>
                            <span className="text-green-400 text-xs">Synced</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-gray-300 text-sm">
                          <span>Stock #{deal.stockNumber}</span>
                          <span>•</span>
                          <span>{deal.seller}</span>
                          <span>•</span>
                          <span>Created: {deal.createdDate}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setExpandedDeal(expandedDeal === deal.id ? null : deal.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                      >
                        {expandedDeal === deal.id ? (
                          <>
                            <ChevronUp className="h-4 w-4" />
                            <span>Hide Details</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            <span>View Details</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Status Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm">Progress</span>
                      <div className="flex items-center space-x-2">
                        <span className={`bg-${statusColor}-500/20 text-${statusColor}-400 text-xs font-medium px-2 py-1 rounded-full`}>
                          {stageInfo.label}
                        </span>
                        <span className="text-gray-400 text-xs">{Math.round(progress)}% Complete</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={`bg-gradient-to-r from-${statusColor}-500 to-${statusColor}-400 h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Deal Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* Remove price cards for sales users, only show VIN */}
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-sm">VIN</span>
                        <FileText className="h-4 w-4 text-blue-400" />
                      </div>
                      <p className="text-white font-bold text-sm font-mono">{deal.vin}</p>
                    </div>
                  </div>

                  {/* Documentation Status */}
                  <div className="mb-4">
                    <h4 className="text-white font-medium mb-3">Documentation Status</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(deal.documentation).map(([doc, info]) => (
                        <div key={doc} className="flex items-center space-x-2">
                          {info.status === 'received' || info.status === 'approved' ? (
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          ) : info.status === 'pending' ? (
                            <Clock className="h-4 w-4 text-orange-400" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-400" />
                          )}
                          <span className="text-gray-300 text-sm capitalize">
                            {doc.replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedDeal === deal.id && (
                    <div className="mt-6 pt-6 border-t border-white/10">
                      {/* Stage Timeline */}
                      <div className="mb-6">
                        <h4 className="text-white font-medium mb-4">Deal Progress</h4>
                        <div className="relative">
                          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-600"></div>
                          <div className="space-y-4">
                            {progressSteps.map((stage, index) => {
                              const stageData = getStageInfo(stage);
                              const isCompleted = index < progressSteps.indexOf(deal.currentStage);
                              const isCurrent = stage === deal.currentStage;
                              
                              return (
                                <div key={stage} className="relative flex items-start space-x-4">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                                    isCompleted 
                                      ? 'bg-green-500' 
                                      : isCurrent 
                                        ? 'bg-blue-500'
                                        : 'bg-gray-600'
                                  }`}>
                                    {isCompleted ? (
                                      <CheckCircle className="h-4 w-4 text-white" />
                                    ) : isCurrent ? (
                                      <Play className="h-4 w-4 text-white" />
                                    ) : (
                                      <Lock className="h-4 w-4 text-gray-300" />
                                    )}
                                  </div>
                                  
                                  <div className="flex-1 pt-1">
                                    <div className={`font-medium ${
                                      isCompleted 
                                        ? 'text-green-400' 
                                        : isCurrent 
                                          ? 'text-blue-400'
                                          : 'text-gray-400'
                                    }`}>
                                      {stageData.label}
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1">
                                      {stageData.description}
                                    </div>
                                    {isCurrent && (
                                      <div className="mt-2 text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                                        In progress...
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Additional Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-white font-medium mb-3">Deal Information</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Deal Type:</span>
                              <span className="text-white capitalize">{deal.dealType.replace('-', ' ')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Payment Method:</span>
                              <span className="text-white">{deal.paymentMethod}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Priority:</span>
                              <span className={priorityColor}>{deal.priority}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Last Updated:</span>
                              <span className="text-white">{deal.lastUpdated}</span>
                            </div>
                            {deal.dealType !== 'wholesale-flip' && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Deal Type 2:</span>
                                <span className="text-white capitalize">{dealType2DisplayMap[deal.dealType2SubType] || deal.dealType2SubType || 'N/A'}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-white font-medium mb-3">Contact Information</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Seller:</span>
                              <span className="text-white">{deal.seller}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Buyer:</span>
                              <span className="text-white">{deal.buyerContact}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {deal.notes && (
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0" />
                        <p className="text-orange-300 text-sm">{deal.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default DealStatusPage; 