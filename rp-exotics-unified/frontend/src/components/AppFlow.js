import React, { useState, useEffect } from 'react';
import CompleteLoginFlow from './CompleteLoginFlow';
import BeautifulDarkLanding from './BeautifulDarkLanding';
import ApiService from '../services/api';

const AppFlow = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing authentication on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          // Try to validate the token using check-session endpoint
          const sessionResponse = await ApiService.checkSession();
          if (sessionResponse && sessionResponse.success) {
            // Transform the session response to match the expected user structure
            const userData = {
              name: sessionResponse.profile.displayName,
              email: sessionResponse.profile.email,
              role: sessionResponse.profile.role,
              profile: sessionResponse.profile
              // Note: BeautifulDarkLanding uses its own permissions object based on role
            };
            console.log('Session response:', sessionResponse);
            console.log('Transformed user data:', userData);
            setCurrentUser(userData);
            setIsLoggedIn(true);
          } else {
            // Token is invalid, clear it
            localStorage.removeItem('authToken');
            ApiService.setToken(null);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Clear invalid token
        localStorage.removeItem('authToken');
        ApiService.setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    try {
      await ApiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setCurrentUser(null);
      setIsLoggedIn(false);
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <CompleteLoginFlow onLoginSuccess={handleLoginSuccess} />;
  }

  // Ensure currentUser has the required properties before rendering BeautifulDarkLanding
  if (!currentUser || !currentUser.role) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading user data...</p>
        </div>
      </div>
    );
  }

  return <BeautifulDarkLanding currentUser={currentUser} onLogout={handleLogout} />;
};

export default AppFlow; 