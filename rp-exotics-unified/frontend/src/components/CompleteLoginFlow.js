import React, { useState } from 'react';
import { Car, Eye, EyeOff, Lock, User, Shield, Zap, CheckCircle, BarChart3, Users, Plus, Search, Settings, LogOut, ChevronRight } from 'lucide-react';
import ApiService from '../services/api';

// Login Transition Component
const LoginTransition = ({ user, onComplete }) => {
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(0);

  // Define stages with safe access to user.role
  const getStages = () => {
    const userRole = user?.role || 'viewer';
    return [
      { text: 'Authenticating credentials...', icon: Lock, duration: 800 },
      { text: 'Loading user profile...', icon: userRole === 'admin' ? Shield : userRole === 'sales' ? Car : userRole === 'finance' ? BarChart3 : Eye, duration: 700 },
      { text: 'Initializing workspace...', icon: Users, duration: 600 },
      { text: 'Preparing dashboard...', icon: Zap, duration: 500 },
      { text: 'Welcome to RP Exotics!', icon: CheckCircle, duration: 400 }
    ];
  };

  const stages = getStages();

  React.useEffect(() => {
    let timer;
    let progressTimer;

    const runStage = (stageIndex) => {
      if (stageIndex >= stages.length) {
        setTimeout(() => onComplete(), 300);
        return;
      }

      setStage(stageIndex);
      setProgress(0);

      const progressDuration = stages[stageIndex].duration;
      const progressStep = 100 / (progressDuration / 10);
      
      progressTimer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressTimer);
            return 100;
          }
          return prev + progressStep;
        });
      }, 10);

      timer = setTimeout(() => {
        clearInterval(progressTimer);
        runStage(stageIndex + 1);
      }, progressDuration);
    };

    runStage(0);

    return () => {
      clearTimeout(timer);
      clearInterval(progressTimer);
    };
  }, []);

  const getRoleGradient = (role) => {
    switch(role) {
      case 'admin': return 'from-blue-500 to-cyan-500';
      case 'sales': return 'from-green-500 to-emerald-500';
      case 'finance': return 'from-purple-500 to-pink-500';
      case 'viewer': return 'from-orange-500 to-amber-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getCurrentStage = stages[stage] || stages[0];
  const StageIcon = getCurrentStage.icon;

  // Safety check - if no user data, show loading (after all hooks)
  if (!user) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center z-50">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative text-center max-w-md mx-auto px-6">
        <div className="mb-8">
          <div className={`mx-auto h-24 w-24 bg-gradient-to-r ${getRoleGradient(user?.role || 'viewer')} rounded-2xl flex items-center justify-center mb-6 shadow-2xl animate-pulse`}>
            <Car className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">RP Exotics</h1>
          <p className="text-gray-300">Professional Vehicle Management</p>
        </div>

        <div className="mb-8">
          <div className={`inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r ${getRoleGradient(user?.role || 'viewer')} text-white text-sm font-medium mb-3 shadow-lg`}>
            {user?.role === 'admin' && <Shield className="h-4 w-4 mr-2" />}
            {user?.role === 'sales' && <Car className="h-4 w-4 mr-2" />}
            {user?.role === 'finance' && <BarChart3 className="h-4 w-4 mr-2" />}
            {user?.role === 'viewer' && <Eye className="h-4 w-4 mr-2" />}
            {(user?.role || 'viewer').charAt(0).toUpperCase() + (user?.role || 'viewer').slice(1)} Access
          </div>
          <h2 className="text-xl font-semibold text-white">Welcome, {user?.name || 'User'}</h2>
        </div>

        <div className="mb-8">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-white/10 rounded-full blur-xl"></div>
            <div className={`relative mx-auto h-16 w-16 bg-gradient-to-r ${getRoleGradient(user?.role || 'viewer')} rounded-full flex items-center justify-center shadow-xl`}>
              <StageIcon className="h-8 w-8 text-white animate-pulse" />
            </div>
          </div>

          <p className="text-white text-lg font-medium mb-4">{getCurrentStage.text}</p>

          <div className="relative">
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${getRoleGradient(user?.role || 'viewer')} rounded-full transition-all duration-100 ease-out shadow-lg`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="flex justify-center space-x-2">
          {stages.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                index <= stage 
                  ? `bg-gradient-to-r ${getRoleGradient(user?.role || 'viewer')} shadow-lg scale-125` 
                  : 'bg-white/20'
              }`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Main App Component
const CompleteLoginFlow = ({ onLoginSuccess }) => {
  const [currentScreen, setCurrentScreen] = useState('login'); // 'login', 'transition', 'dashboard'
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Load remembered email on component mount
  React.useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setLoginData(prev => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async () => {
    if (!loginData.email || !loginData.password) {
      setLoginError('Please enter both email and password');
      return;
    }

    setIsLoggingIn(true);
    setLoginError('');

    try {
      // If remember me is checked, store the email in localStorage
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', loginData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      // Call the backend API for authentication
      const response = await ApiService.login({
        email: loginData.email,
        password: loginData.password
      });

      // Transform the user data to match the expected structure
      const userData = {
        name: response.user.profile.displayName,
        email: response.user.profile.email,
        role: response.user.profile.role,
        profile: response.user.profile
      };
      setCurrentUser(userData);
      setCurrentScreen('transition');
      
    } catch (error) {
      console.error('Login error:', error);
      setLoginError(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleTransitionComplete = () => {
    // Call the parent's onLoginSuccess with the current user
    onLoginSuccess(currentUser);
  };

  const handleLogout = async () => {
    try {
      await ApiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setCurrentUser(null);
      setLoginData({ email: '', password: '' });
      setRememberMe(false);
      setCurrentScreen('login');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && loginData.email && loginData.password) {
      handleLogin();
    }
  };



  // Login Screen
  if (currentScreen === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="mx-auto h-24 w-24 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 shadow-2xl border border-white/20">
              <Car className="h-16 w-16 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">RP Exotics</h1>
            <p className="text-gray-400">Premium Vehicle Management System</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
                <p className="text-gray-300">Sign in to your account</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    autoComplete="email"
                    className="block w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
                    placeholder="Enter your email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                    onKeyPress={handleKeyPress}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    id="password"
                    autoComplete="current-password"
                    className="block w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                    onKeyPress={handleKeyPress}
                    disabled={isLoggingIn}
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    <button
                      type="button"
                      className="text-gray-400 hover:text-white transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoggingIn}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {loginError && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-300 text-sm">{loginError}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <div className={`w-5 h-5 border-2 rounded transition-all duration-200 ${
                      rememberMe 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'border-gray-400 group-hover:border-gray-300'
                    }`}>
                      {rememberMe && (
                        <svg className="w-3 h-3 text-white mx-auto mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="ml-3 text-sm text-gray-300 group-hover:text-white transition-colors">Remember me</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-800 disabled:to-blue-900 disabled:cursor-not-allowed text-white py-4 px-6 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 shadow-lg"
              >
                {isLoggingIn ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>

              <div className="text-center">
                <button 
                  onClick={() => setShowForgotPassword(true)}
                  className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                >
                  Forgot your password?
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-transparent text-gray-400">Demo Accounts</span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setLoginData({email: 'chris@rpexotics.com', password: 'Matti11!'})}
                  disabled={isLoggingIn}
                  className="w-full flex items-center justify-between bg-blue-600/20 hover:bg-blue-600/30 disabled:bg-blue-600/10 disabled:cursor-not-allowed text-white p-4 rounded-lg transition-colors border border-blue-500/30"
                >
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 text-blue-400 mr-3" />
                    <span className="font-medium">Admin Access</span>
                  </div>
                  <span className="text-blue-300 text-sm">Full Control</span>
                </button>
                
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setLoginData({email: 'parker@rpexotics.com', password: '1234'})}
                    disabled={isLoggingIn}
                    className="flex flex-col items-center bg-green-600/20 hover:bg-green-600/30 disabled:bg-green-600/10 disabled:cursor-not-allowed text-white p-3 rounded-lg transition-colors border border-green-500/30"
                  >
                    <Car className="h-4 w-4 text-green-400 mb-1" />
                    <span className="text-xs">Sales</span>
                  </button>
                  
                  <button
                    onClick={() => setLoginData({email: 'lynn@rpexotics.com', password: 'titles123'})}
                    disabled={isLoggingIn}
                    className="flex flex-col items-center bg-purple-600/20 hover:bg-purple-600/30 disabled:bg-purple-600/10 disabled:cursor-not-allowed text-white p-3 rounded-lg transition-colors border border-purple-500/30"
                  >
                    <BarChart3 className="h-4 w-4 text-purple-400 mb-1" />
                    <span className="text-xs">Finance</span>
                  </button>
                  
                  <button
                    onClick={() => setLoginData({email: 'viewer@rpexotics.com', password: 'view123'})}
                    disabled={isLoggingIn}
                    className="flex flex-col items-center bg-orange-600/20 hover:bg-orange-600/30 disabled:bg-orange-600/10 disabled:cursor-not-allowed text-white p-3 rounded-lg transition-colors border border-orange-500/30"
                  >
                    <Eye className="h-4 w-4 text-orange-400 mb-1" />
                    <span className="text-xs">Viewer</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="text-center mt-6">
            <div className="inline-flex items-center bg-white/5 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
              <Zap className="h-4 w-4 text-yellow-400 mr-2" />
              <span className="text-gray-300 text-sm">Secured by Enterprise Authentication</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Transition Screen
  if (currentScreen === 'transition') {
    return <LoginTransition user={currentUser} onComplete={handleTransitionComplete} />;
  }

  // Dashboard Screen (Simplified version)
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <header className="relative bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center group">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-3 mr-4 group-hover:scale-105 transition-transform duration-300 shadow-lg shadow-blue-500/25">
                <Car className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">RP Exotics</h1>
                <p className="text-gray-300 text-sm">Professional Vehicle Management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{currentUser.name}</p>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${currentUser.role === 'admin' ? 'from-blue-500 to-cyan-500' : currentUser.role === 'sales' ? 'from-green-500 to-emerald-500' : currentUser.role === 'finance' ? 'from-purple-500 to-pink-500' : 'from-orange-500 to-amber-500'} text-white shadow-lg`}>
                  {currentUser.role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                  {currentUser.role === 'sales' && <Car className="h-3 w-3 mr-1" />}
                  {currentUser.role === 'finance' && <BarChart3 className="h-3 w-3 mr-1" />}
                  {currentUser.role === 'viewer' && <Eye className="h-3 w-3 mr-1" />}
                  {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Settings className="h-5 w-5 text-gray-400 cursor-pointer hover:text-white hover:scale-110 transition-all duration-200" />
                <LogOut 
                  className="h-5 w-5 text-gray-400 cursor-pointer hover:text-white hover:scale-110 transition-all duration-200"
                  onClick={handleLogout}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative max-w-7xl mx-auto px-6 py-8">
        <div className="mb-10">
          <h2 className="text-4xl font-bold text-white mb-2">
            Welcome back, <span className={`bg-gradient-to-r ${currentUser.role === 'admin' ? 'from-blue-500 to-cyan-500' : currentUser.role === 'sales' ? 'from-green-500 to-emerald-500' : currentUser.role === 'finance' ? 'from-purple-500 to-pink-500' : 'from-orange-500 to-amber-500'} bg-clip-text text-transparent`}>{currentUser.name.split(' ')[0]}</span>
          </h2>
          <p className="text-gray-300 text-lg">Your RP Exotics dashboard is ready. Start managing your vehicle deals and dealer relationships.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div 
            onClick={() => window.location.href = '/new-deal'}
            className="group relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 cursor-pointer transform hover:scale-[1.02] p-8"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 group-hover:bg-white/30 transition-colors duration-300">
                  <Plus className="h-8 w-8 text-white" />
                </div>
                <ChevronRight className="h-6 w-6 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">New Deal Entry</h3>
              <p className="text-white/90 text-sm leading-relaxed mb-4">Create a new vehicle deal with intelligent dealer matching and comprehensive financial tracking</p>
              <div className="flex items-center text-white/80 text-xs">
                <Zap className="h-3 w-3 mr-1" />
                <span>Smart VIN decoding • Dealer autocomplete • Financial calculators</span>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-green-600 via-green-700 to-emerald-600 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 cursor-pointer transform hover:scale-[1.02] p-8">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 group-hover:bg-white/30 transition-colors duration-300">
                  <Search className="h-8 w-8 text-white" />
                </div>
                <ChevronRight className="h-6 w-6 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Dealer Search & Management</h3>
              <p className="text-white/90 text-sm leading-relaxed mb-4">Advanced dealer lookup with relationship tracking, performance metrics, and contact management</p>
              <div className="flex items-center text-white/80 text-xs">
                <Zap className="h-3 w-3 mr-1" />
                <span>Real-time search • Deal history • Performance analytics</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">Click "Logout" in the header to return to the login screen and try different user roles!</p>
        </div>
      </div>
    </div>
  );
};

export default CompleteLoginFlow; 