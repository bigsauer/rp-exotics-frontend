import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Users, FileText, BarChart3, Search, Plus, Settings, LogOut, Eye, Shield, TrendingUp, DollarSign, Clock, Zap, ChevronRight, Activity, CheckCircle } from 'lucide-react';

const BeautifulDarkLanding = ({ currentUser: initialUser, onLogout }) => {
  const navigate = useNavigate();
  
  const [currentUser, setCurrentUser] = useState(initialUser || {
    name: 'Unknown User',
    email: 'unknown@rpexotics.com',
    role: 'viewer',
    avatar: null
  });

  // Update currentUser when initialUser changes
  React.useEffect(() => {
    if (initialUser) {
      setCurrentUser(initialUser);
    }
  }, [initialUser]);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const permissions = {
    admin: {
      canCreateDeals: true,
      canViewDeals: true,
      canEditDeals: true,
      canSearchDealers: true,
      canManageDealers: true,
      canAccessBackOffice: true,
      canViewReports: true,
      canViewFinancials: true,
      canManageUsers: true
    },
    sales: {
      canCreateDeals: true,
      canViewDeals: true,
      canEditDeals: true,
      canSearchDealers: true,
      canManageDealers: true,
      canAccessBackOffice: false,
      canViewReports: true,
      canViewFinancials: false,
      canManageUsers: false
    },
    finance: {
      canCreateDeals: false,
      canViewDeals: true,
      canEditDeals: true,
      canSearchDealers: true,
      canManageDealers: false,
      canAccessBackOffice: true,
      canViewReports: true,
      canViewFinancials: true,
      canManageUsers: false
    },
    viewer: {
      canCreateDeals: false,
      canViewDeals: true,
      canEditDeals: false,
      canSearchDealers: true,
      canManageDealers: false,
      canAccessBackOffice: false,
      canViewReports: true,
      canViewFinancials: false,
      canManageUsers: false
    }
  };

  console.log('BeautifulDarkLanding - currentUser:', currentUser);
  console.log('BeautifulDarkLanding - currentUser.role:', currentUser.role);
  console.log('BeautifulDarkLanding - permissions object:', permissions);
  const userPermissions = permissions[currentUser.role];
  console.log('BeautifulDarkLanding - userPermissions:', userPermissions);

  const getRoleIcon = (role) => {
    switch(role) {
      case 'admin': return Shield;
      case 'sales': return Car;
      case 'finance': return DollarSign;
      case 'viewer': return Eye;
      default: return Shield;
    }
  };

  const getRoleGradient = (role) => {
    switch(role) {
      case 'admin': return 'from-blue-500 to-cyan-500';
      case 'sales': return 'from-green-500 to-emerald-500';
      case 'finance': return 'from-purple-500 to-pink-500';
      case 'viewer': return 'from-orange-500 to-amber-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const quickStats = [
    { 
      label: 'Active Deals', 
      value: '15', 
      change: '+3',
      icon: Car, 
      gradient: 'from-blue-500 to-cyan-500',
      show: userPermissions.canViewDeals 
    },
    { 
      label: 'Dealer Network', 
      value: '73', 
      change: '+5',
      icon: Users, 
      gradient: 'from-green-500 to-emerald-500',
      show: userPermissions.canSearchDealers 
    },
    { 
      label: 'Monthly Revenue', 
      value: '$2.1M', 
      change: '+12%',
      icon: DollarSign, 
      gradient: 'from-purple-500 to-pink-500',
      show: userPermissions.canViewFinancials 
    },
    { 
      label: 'Pending Tasks', 
      value: '6', 
      change: '-2',
      icon: Clock, 
      gradient: 'from-orange-500 to-amber-500',
      show: userPermissions.canAccessBackOffice 
    }
  ].filter(stat => stat.show);

  const primaryActions = [
    { 
      title: 'New Deal Entry', 
      description: 'Create a new vehicle deal with intelligent dealer matching and comprehensive financial tracking',
      icon: Plus, 
      gradient: 'from-blue-600 via-blue-700 to-cyan-600',
      route: '/new-deal',
      show: userPermissions.canCreateDeals,
      feature: 'Smart VIN decoding • Dealer autocomplete • Financial calculators'
    },
    { 
      title: 'Dealer Search & Management', 
      description: 'Advanced dealer lookup with relationship tracking, performance metrics, and contact management',
      icon: Search, 
      gradient: 'from-green-600 via-green-700 to-emerald-600',
      route: '/dealer-management',
      show: userPermissions.canSearchDealers,
      feature: 'Real-time search • Deal history • Performance analytics'
    }
  ];

  const secondaryActions = [
    { 
      title: 'Back Office Operations',
      subtitle: 'Documentation & Compliance',
      description: 'Title management, registration tracking, and compliance workflows',
      icon: FileText, 
      gradient: 'from-purple-600 to-pink-600',
      show: userPermissions.canAccessBackOffice,
      tasks: 6
    },
    { 
      title: 'Analytics & Reports',
      subtitle: 'Business Intelligence',
      description: 'Comprehensive reporting, performance metrics, and insights',
      icon: BarChart3, 
      gradient: 'from-orange-600 to-amber-600',
      show: userPermissions.canViewReports,
      tasks: null
    },
    { 
      title: 'User Management',
      subtitle: 'System Administration',
      description: 'Manage user accounts, roles, and system permissions',
      icon: Users, 
      gradient: 'from-indigo-600 to-purple-600',
      show: userPermissions.canManageUsers,
      tasks: null
    },
    { 
      title: 'System Monitoring',
      subtitle: 'Performance & Health',
      description: 'Monitor system performance, uptime, and database health',
      icon: Activity, 
      gradient: 'from-teal-600 to-cyan-600',
      show: true,
      tasks: null
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'deal',
      title: '2020 McLaren 720S Deal Created',
      subtitle: 'Stock #RP2025001 • $220,000 • Ian Hutchinson',
      time: '2 hours ago',
      icon: Car,
      color: 'blue'
    },
    {
      id: 2,
      type: 'document',
      title: 'Title Documentation Received',
      subtitle: '2019 Ferrari F8 Tributo • Stock #RP2025003',
      time: '4 hours ago',
      icon: FileText,
      color: 'green'
    },
    {
      id: 3,
      type: 'dealer',
      title: 'New Dealer Contact Added',
      subtitle: 'Midwest Auto Group • Kansas City, MO',
      time: '1 day ago',
      icon: Users,
      color: 'purple'
    },
    {
      id: 4,
      type: 'finance',
      title: 'Monthly P&L Report Generated',
      subtitle: '$2.1M revenue • 15% margin improvement',
      time: '2 days ago',
      icon: TrendingUp,
      color: 'orange'
    }
  ];

  const RoleIcon = getRoleIcon(currentUser.role);
  const roleGradient = getRoleGradient(currentUser.role);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-500/3 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Header */}
      <header className="relative bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center group">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-3 mr-4 group-hover:scale-105 transition-transform duration-300 shadow-lg shadow-blue-500/25">
                <img 
                  src="https://cdn-ds.com/media/sz_27586/3693/rpexotics-favicon.png" 
                  alt="RP Exotics Logo" 
                  className="h-6 w-6 object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <Car className="h-6 w-6 text-white hidden" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">RP Exotics</h1>
                <p className="text-gray-300 text-sm">Professional Vehicle Management</p>
              </div>
            </div>
            
            {/* User Profile */}
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{currentUser.profile?.displayName || currentUser.name || 'User'}</p>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${roleGradient} text-white shadow-lg`}>
                  <RoleIcon className="h-3 w-3 mr-1" />
                  {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
                </div>
              </div>
              <div className="text-right text-sm text-gray-300">
                <p className="font-medium">{currentTime.toLocaleDateString()}</p>
                <p className="text-xs">{currentTime.toLocaleTimeString()}</p>
              </div>
              <div className="flex items-center space-x-3">
                {userPermissions.canManageUsers && (
                  <Settings className="h-5 w-5 text-gray-400 cursor-pointer hover:text-white hover:scale-110 transition-all duration-200" />
                )}
                <LogOut 
                  className="h-5 w-5 text-gray-400 cursor-pointer hover:text-white hover:scale-110 transition-all duration-200"
                  onClick={onLogout}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-4xl font-bold text-white mb-2">
                Welcome back, <span className={`bg-gradient-to-r ${roleGradient} bg-clip-text text-transparent`}>{currentUser.profile?.displayName?.split(' ')[0] || currentUser.name?.split(' ')[0] || 'User'}</span>
              </h2>
              <p className="text-gray-300 text-lg max-w-2xl leading-relaxed">
                {currentUser.role === 'admin' && 'You have complete administrative control over the RP Exotics management system with full access to all modules, financial data, and user management capabilities.'}
                {currentUser.role === 'sales' && 'Access your deal management tools and dealer network. Focus on what you do best - creating deals and building relationships.'}
                {currentUser.role === 'finance' && 'Monitor financial performance with comprehensive access to pricing data, margins, and back office operations.'}
                {currentUser.role === 'viewer' && 'Stay informed with read-only access to reports, analytics, and system information.'}
              </p>
            </div>
            <div className="flex items-center space-x-2 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-green-300 text-sm font-medium">All Systems Operational</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {quickStats.map((stat, index) => (
            <div key={index} className="group bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-white/5">
              <div className="flex items-center justify-between mb-4">
                <div className={`bg-gradient-to-r ${stat.gradient} rounded-xl p-3 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                {stat.change && (
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    stat.change.startsWith('+') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {stat.change}
                  </span>
                )}
              </div>
              <div>
                <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-gray-300 text-sm">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Primary Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {primaryActions.filter(action => action.show).map((action, index) => (
            <div
              key={index}
              onClick={() => navigate(action.route)}
              className={`group relative overflow-hidden bg-gradient-to-br ${action.gradient} rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 cursor-pointer transform hover:scale-[1.02] p-8`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 group-hover:bg-white/30 transition-colors duration-300">
                    <action.icon className="h-8 w-8 text-white" />
                  </div>
                  <ChevronRight className="h-6 w-6 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">{action.title}</h3>
                <p className="text-white/90 text-sm leading-relaxed mb-4">{action.description}</p>
                <div className="flex items-center text-white/80 text-xs">
                  <Zap className="h-3 w-3 mr-1" />
                  <span>{action.feature}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Secondary Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {secondaryActions.filter(action => action.show).map((action, index) => (
            <div
              key={index}
              onClick={() => {
                if (action.title === 'Back Office Operations') {
                  navigate('/back-office');
                }
                // Add other navigation handlers as needed
              }}
              className="group bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer hover:scale-105"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`bg-gradient-to-r ${action.gradient} rounded-xl p-3 group-hover:scale-110 transition-transform duration-300`}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                {action.tasks && (
                  <span className="bg-orange-500/20 text-orange-400 text-xs font-medium px-2 py-1 rounded-full">
                    {action.tasks} pending
                  </span>
                )}
              </div>
              <h4 className="font-semibold text-white mb-1">{action.title}</h4>
              <p className="text-gray-400 text-xs mb-2">{action.subtitle}</p>
              <p className="text-gray-300 text-sm">{action.description}</p>
            </div>
          ))}
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Deal Tracking Box - Sales Focus */}
          {userPermissions.canViewDeals && (
            <div className="lg:col-span-2 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <Car className="h-5 w-5 text-blue-400 mr-2" />
                  Deal Tracker
                  <span className="ml-2 bg-blue-500/20 text-blue-400 text-xs font-medium px-2 py-1 rounded-full">
                    {currentUser.role === 'admin' ? 'All Deals' : 'My Deals'}
                  </span>
                </h3>
                <div className="flex items-center space-x-3">
                  <select className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="sold">Sold</option>
                  </select>
                  <button 
                    onClick={() => navigate('/deal-tracker')}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                  >
                    View All
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Deal 1 - Active */}
                <div className="group flex items-center p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className="text-white font-medium">2020 McLaren 720S</span>
                        <span className="ml-2 bg-green-500/20 text-green-400 text-xs font-medium px-2 py-1 rounded-full">Active</span>
                      </div>
                      <span className="text-gray-400 text-sm">Stock #RP2025001</span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-gray-300 text-sm">
                        <span>Ian Hutchinson • </span>
                        {userPermissions.canViewFinancials ? (
                          <span className="text-green-400">$220,000</span>
                        ) : (
                          <span className="text-gray-500">Price Restricted</span>
                        )}
                      </div>
                      <span className="text-gray-400 text-xs">Created 2h ago</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-gray-400 text-xs">Progress:</span>
                      <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                        <div className="bg-green-500 h-1.5 rounded-full w-1/3"></div>
                      </div>
                      <span className="text-green-400 text-xs font-medium">Purchased</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs">
                        <CheckCircle className="h-3 w-3 text-green-400" />
                        <span className="text-gray-400">Vehicle Acquired</span>
                        <Clock className="h-3 w-3 text-orange-400 ml-2" />
                        <span className="text-gray-400">Title Pending</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="text-blue-400 hover:text-blue-300 text-xs">Edit</button>
                        <button className="text-gray-400 hover:text-gray-300 text-xs">Details</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Deal 2 - Pending */}
                <div className="group flex items-center p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className="text-white font-medium">2019 Ferrari F8 Tributo</span>
                        <span className="ml-2 bg-orange-500/20 text-orange-400 text-xs font-medium px-2 py-1 rounded-full">Pending</span>
                      </div>
                      <span className="text-gray-400 text-sm">Stock #RP2025002</span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-gray-300 text-sm">
                        <span>Midwest Auto Group • </span>
                        {userPermissions.canViewFinancials ? (
                          <span className="text-green-400">$285,000</span>
                        ) : (
                          <span className="text-gray-500">Price Restricted</span>
                        )}
                      </div>
                      <span className="text-gray-400 text-xs">Created 1d ago</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-gray-400 text-xs">Progress:</span>
                      <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                        <div className="bg-orange-500 h-1.5 rounded-full w-2/3"></div>
                      </div>
                      <span className="text-orange-400 text-xs font-medium">Title Review</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs">
                        <CheckCircle className="h-3 w-3 text-green-400" />
                        <span className="text-gray-400">Inspection Complete</span>
                        <Clock className="h-3 w-3 text-orange-400 ml-2" />
                        <span className="text-gray-400">Title Processing</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="text-blue-400 hover:text-blue-300 text-xs">Edit</button>
                        <button className="text-gray-400 hover:text-gray-300 text-xs">Details</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Deal 3 - Ready to List */}
                <div className="group flex items-center p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className="text-white font-medium">2021 Lamborghini Huracán</span>
                        <span className="ml-2 bg-blue-500/20 text-blue-400 text-xs font-medium px-2 py-1 rounded-full">Ready</span>
                      </div>
                      <span className="text-gray-400 text-sm">Stock #RP2025003</span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-gray-300 text-sm">
                        <span>Premium Auto Sales • </span>
                        {userPermissions.canViewFinancials ? (
                          <span className="text-green-400">$195,000</span>
                        ) : (
                          <span className="text-gray-500">Price Restricted</span>
                        )}
                      </div>
                      <span className="text-gray-400 text-xs">Created 3d ago</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-gray-400 text-xs">Progress:</span>
                      <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full w-5/6"></div>
                      </div>
                      <span className="text-blue-400 text-xs font-medium">Ready to List</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs">
                        <CheckCircle className="h-3 w-3 text-green-400" />
                        <span className="text-gray-400">Title Received</span>
                        <CheckCircle className="h-3 w-3 text-green-400 ml-2" />
                        <span className="text-gray-400">Photos Complete</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="text-green-400 hover:text-green-300 text-xs font-medium">List Now</button>
                        <button className="text-gray-400 hover:text-gray-300 text-xs">Details</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Deal 4 - Sold */}
                <div className="group flex items-center p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                  <div className="flex-1 opacity-75">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className="text-white font-medium">2022 Porsche 911 GT3</span>
                        <span className="ml-2 bg-purple-500/20 text-purple-400 text-xs font-medium px-2 py-1 rounded-full">Sold</span>
                      </div>
                      <span className="text-gray-400 text-sm">Stock #RP2025004</span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-gray-300 text-sm">
                        <span>Elite Motors • </span>
                        {userPermissions.canViewFinancials ? (
                          <span className="text-purple-400">$185,000 → $205,000</span>
                        ) : (
                          <span className="text-gray-500">Price Restricted</span>
                        )}
                      </div>
                      <span className="text-gray-400 text-xs">Sold 1w ago</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-gray-400 text-xs">Progress:</span>
                      <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                        <div className="bg-purple-500 h-1.5 rounded-full w-full"></div>
                      </div>
                      <span className="text-purple-400 text-xs font-medium">Complete</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs">
                        <CheckCircle className="h-3 w-3 text-green-400" />
                        <span className="text-gray-400">Delivered</span>
                        <CheckCircle className="h-3 w-3 text-green-400 ml-2" />
                        <span className="text-gray-400">Payment Received</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {userPermissions.canViewFinancials && (
                          <span className="text-green-400 text-xs font-medium">+$20k profit</span>
                        )}
                        <button className="text-gray-400 hover:text-gray-300 text-xs">Archive</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary Row */}
                <div className="border-t border-white/10 pt-4 mt-4">
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-white">4</p>
                      <p className="text-gray-400 text-xs">Active Deals</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-400">1</p>
                      <p className="text-gray-400 text-xs">Ready to List</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-400">2</p>
                      <p className="text-gray-400 text-xs">In Progress</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-400">
                        {userPermissions.canViewFinancials ? '$890K' : '***'}
                      </p>
                      <p className="text-gray-400 text-xs">Total Volume</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Activity - Smaller if deals showing */}
          {!userPermissions.canViewDeals ? (
            <div className="lg:col-span-2 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <Activity className="h-5 w-5 text-blue-400 mr-2" />
                  Recent Activity
                </h3>
                <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">View All</button>
              </div>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="group flex items-center p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                    <div className={`bg-${activity.color}-500/20 rounded-lg p-2 mr-4 group-hover:scale-110 transition-transform duration-300`}>
                      <activity.icon className={`h-4 w-4 text-${activity.color}-400`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium mb-1">{activity.title}</p>
                      <p className="text-gray-400 text-xs">{activity.subtitle}</p>
                    </div>
                    <span className="text-gray-500 text-xs">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <Activity className="h-5 w-5 text-blue-400 mr-2" />
                Recent Activity
              </h3>
              <div className="space-y-3">
                {recentActivities.slice(0, 3).map((activity) => (
                  <div key={activity.id} className="group flex items-center p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-300">
                    <div className={`bg-${activity.color}-500/20 rounded-lg p-2 mr-3`}>
                      <activity.icon className={`h-3 w-3 text-${activity.color}-400`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-xs font-medium">{activity.title}</p>
                      <p className="text-gray-400 text-xs">{activity.time}</p>
                    </div>
                  </div>
                ))}
                <button className="w-full text-blue-400 hover:text-blue-300 text-xs font-medium py-2">
                  View All Activity
                </button>
              </div>
            </div>
          )}

          {/* System Health & Quick Actions */}
          <div className="space-y-6">
            {/* System Health */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <Shield className="h-5 w-5 text-green-400 mr-2" />
                System Health
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">Database</span>
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-700 rounded-full h-1.5 mr-2">
                      <div className="bg-green-500 h-1.5 rounded-full w-14"></div>
                    </div>
                    <span className="text-green-400 text-xs font-medium">98%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">API Response</span>
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-700 rounded-full h-1.5 mr-2">
                      <div className="bg-blue-500 h-1.5 rounded-full w-12"></div>
                    </div>
                    <span className="text-blue-400 text-xs font-medium">142ms</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">Uptime</span>
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-700 rounded-full h-1.5 mr-2">
                      <div className="bg-green-500 h-1.5 rounded-full w-full"></div>
                    </div>
                    <span className="text-green-400 text-xs font-medium">99.9%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats Summary */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Today's Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">New Deals</span>
                  <span className="text-white font-medium">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">Dealer Contacts</span>
                  <span className="text-white font-medium">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">Documents Processed</span>
                  <span className="text-white font-medium">8</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">System Logins</span>
                  <span className="text-white font-medium">24</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Role Demo Switcher */}
        <div className="mt-10 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
          <h3 className="text-lg font-medium text-white mb-4">Demo: Switch User Roles</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.keys(permissions).map((role) => {
              const RoleIcon = getRoleIcon(role);
              const gradient = getRoleGradient(role);
              const names = { admin: 'Chris Murphy', sales: 'Parker Gelber', finance: 'Lynn', viewer: 'Mike Peterson' };
              return (
                <button
                  key={role}
                  onClick={() => setCurrentUser({
                    ...currentUser,
                    role: role,
                    email: `${role}@rpexotics.com`,
                    name: names[role]
                  })}
                  className={`p-4 rounded-xl transition-all duration-300 border ${
                    currentUser.role === role 
                      ? `bg-gradient-to-r ${gradient} border-transparent shadow-lg shadow-white/10 scale-105` 
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <RoleIcon className={`h-6 w-6 mx-auto mb-2 ${
                    currentUser.role === role ? 'text-white' : 'text-gray-400'
                  }`} />
                  <p className={`text-sm font-medium ${
                    currentUser.role === role ? 'text-white' : 'text-gray-300'
                  }`}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeautifulDarkLanding; 