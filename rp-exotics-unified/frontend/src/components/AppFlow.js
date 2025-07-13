import React, { useState, useEffect } from 'react';
import CompleteLoginFlow from './CompleteLoginFlow';
import BeautifulDarkLanding from './BeautifulDarkLanding';
import ApiService from '../services/api';

const AppFlow = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  // Add error state
  const [error, setError] = useState('');

  // Check for existing authentication on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          // Try to validate the token using check-session endpoint
          const sessionResponse = await ApiService.checkSession();
          console.log('Raw sessionResponse:', sessionResponse);
          if (sessionResponse && sessionResponse.success && sessionResponse.profile) {
            // Defensive: ensure role exists
            const role = sessionResponse.profile.role || sessionResponse.role || null;
            const name = sessionResponse.profile.displayName || sessionResponse.profile.name || '';
            const email = sessionResponse.profile.email || sessionResponse.email || '';
            const userData = {
              name,
              email,
              role,
              profile: sessionResponse.profile
            };
            console.log('Transformed user data:', userData);
            if (role) {
              setCurrentUser(userData);
              setIsLoggedIn(true);
            } else {
              setCurrentUser(null);
              setIsLoggedIn(false);
              setError('Your user account is missing a role. Please contact support.');
            }
          } else {
            // Token is invalid, clear it
            localStorage.removeItem('authToken');
            ApiService.setToken(null);
            setError('Session invalid or user data malformed. Please log in again.');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Clear invalid token
        localStorage.removeItem('authToken');
        ApiService.setToken(null);
        setError('Authentication check failed. Please log in again.');
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

  // Show error if user data is malformed
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-lg font-semibold mb-4">{error}</div>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
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