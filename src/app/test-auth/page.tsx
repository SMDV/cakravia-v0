"use client"

import React, { useState, useEffect } from 'react';
import { authAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const TestAuthPage = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleSDKLoaded, setIsGoogleSDKLoaded] = useState(false);
  const { 
    user, 
    isAuthenticated, 
    logout, 
    googleLogin,
    requiresGoogleAuth,
    googleAuthMessage,
    clearGoogleAuthState
  } = useAuth();

  // Load Google SDK for testing
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setIsGoogleSDKLoaded(true);
      addResult('✅ Google SDK loaded successfully');
    };
    script.onerror = () => {
      addResult('❌ Failed to load Google SDK');
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testRegister = async () => {
    setIsLoading(true);
    addResult('🔄 Testing registration...');
    
    try {
      const response = await authAPI.register({
        name: 'Test User',
        email: `test${Date.now()}@example.com`, // Unique email
        password: 'password',
        password_confirmation: 'password'
      });
      
      addResult(`✅ Registration successful: ${response.data.user.name}`);
      addResult(`🔑 Token received: ${response.data.token ? 'YES' : 'NO'}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult(`❌ Registration failed: ${errorMessage}`);
    }
    
    setIsLoading(false);
  };

  const testLogin = async () => {
    setIsLoading(true);
    addResult('🔄 Testing login...');
    
    try {
      // Use a known account from your Postman collection
      const response = await authAPI.login({
        email: 'arymprayoga@gmail.com', // From your Postman examples
        password: 'password'
      });
      
      if (response.success && response.user) {
        addResult(`✅ Login successful: ${response.user.name}`);
        addResult(`🔑 Token received: ${response.token ? 'YES' : 'NO'}`);
      } else if (response.requiresGoogleAuth) {
        addResult(`⚠️ Cross-auth detected: ${response.message}`);
        addResult(`🔄 User needs to use Google Sign-In`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult(`❌ Login failed: ${errorMessage}`);
    }
    
    setIsLoading(false);
  };

  const testGoogleUser = async () => {
    setIsLoading(true);
    addResult('🔄 Testing Google user login with email/password...');
    
    try {
      // Try to login with an email that might be Google-only
      const response = await authAPI.login({
        email: 'googleuser@example.com', // This should trigger requiresGoogleAuth
        password: 'anypassword'
      });
      
      if (response.success && response.user) {
        addResult(`✅ Login successful: ${response.user.name}`);
      } else if (response.requiresGoogleAuth) {
        addResult(`✅ Cross-auth working: ${response.message}`);
        addResult(`📝 Frontend should show Google button now`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult(`❌ Login failed: ${errorMessage}`);
    }
    
    setIsLoading(false);
  };

  const testGoogleSDKInit = () => {
    if (!isGoogleSDKLoaded) {
      addResult('❌ Google SDK not loaded yet');
      return;
    }

    addResult('🔄 Testing Google SDK initialization...');
    
    try {
      window.google?.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
        callback: (response) => {
          addResult(`✅ Google SDK callback triggered`);
          addResult(`🔑 Google token received: ${response.credential ? 'YES' : 'NO'}`);
          testGoogleLogin(response.credential);
        },
      });
      
      addResult(`✅ Google SDK initialized successfully`);
      addResult(`🔑 Client ID: ${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}`);
      
      // Trigger Google prompt
      window.google?.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          addResult(`⚠️ Google prompt not displayed: ${notification.getNotDisplayedReason()}`);
        } else {
          addResult(`✅ Google prompt displayed`);
        }
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult(`❌ Google SDK init failed: ${errorMessage}`);
    }
  };

  const testGoogleLogin = async (idToken: string) => {
    setIsLoading(true);
    addResult('🔄 Testing Google login...');
    
    try {
      await googleLogin(idToken);
      addResult(`✅ Google login successful`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult(`❌ Google login failed: ${errorMessage}`);
    }
    
    setIsLoading(false);
  };

  const testProfile = async () => {
    setIsLoading(true);
    addResult('🔄 Testing profile fetch...');
    
    try {
      const response = await authAPI.getProfile();
      addResult(`✅ Profile fetched: ${response.data.name}`);
      addResult(`📧 Email: ${response.data.email}`);
      addResult(`🔑 Auth Provider: ${response.data.auth_provider || 'Not specified'}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult(`❌ Profile fetch failed: ${errorMessage}`);
    }
    
    setIsLoading(false);
  };

  const testAPIConnection = async () => {
    setIsLoading(true);
    addResult('🔄 Testing API connection...');
    
    try {
      const isConnected = await authAPI.testConnection();
      addResult(`${isConnected ? '✅' : '❌'} API connection: ${isConnected ? 'SUCCESS' : 'FAILED'}`);
    } catch {
      addResult(`❌ API connection test failed`);
    }
    
    setIsLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
    clearGoogleAuthState();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8" style={{ fontFamily: 'Merriweather Sans, sans-serif' }}>
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Enhanced Authentication Test Page</h1>
        
        {/* Environment Check */}
        <div className="mb-6 p-4 bg-purple-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Environment Status</h2>
          <p><strong>Google Client ID:</strong> {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? '✅ SET' : '❌ NOT SET'}</p>
          <p><strong>Google SDK:</strong> {isGoogleSDKLoaded ? '✅ LOADED' : '🔄 LOADING...'}</p>
          {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
            <p className="text-xs text-gray-600 mt-1">
              Client ID: {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
            </p>
          )}
        </div>

        {/* Current Auth Status */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Current Authentication Status</h2>
          <p><strong>Authenticated:</strong> {isAuthenticated ? '✅ YES' : '❌ NO'}</p>
          {user && (
            <>
              <p><strong>User Name:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>User ID:</strong> {user.id}</p>
              <p><strong>Auth Provider:</strong> {user.auth_provider || 'Not specified'}</p>
              <p><strong>Google ID:</strong> {user.google_id || 'Not linked'}</p>
            </>
          )}
          {isAuthenticated && (
            <button
              onClick={logout}
              className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Logout
            </button>
          )}
        </div>

        {/* Cross-Authentication Status */}
        {requiresGoogleAuth && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h2 className="text-lg font-semibold mb-2 text-yellow-800">Cross-Authentication Required</h2>
            <p className="text-yellow-700">{googleAuthMessage}</p>
            <button
              onClick={clearGoogleAuthState}
              className="mt-2 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Clear State
            </button>
          </div>
        )}
        
        {/* Test Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          <button
            onClick={testAPIConnection}
            disabled={isLoading}
            className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50"
          >
            Test API
          </button>
          
          <button
            onClick={testRegister}
            disabled={isLoading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            Test Register
          </button>
          
          <button
            onClick={testLogin}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Test Email Login
          </button>

          <button
            onClick={testGoogleUser}
            disabled={isLoading}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
          >
            Test Google User
          </button>

          <button
            onClick={testGoogleSDKInit}
            disabled={isLoading || !isGoogleSDKLoaded}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            Test Google SDK
          </button>
          
          <button
            onClick={testProfile}
            disabled={isLoading}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            Test Profile
          </button>
          
          <button
            onClick={clearResults}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Clear Results
          </button>
        </div>

        {/* Test Results */}
        <div className="bg-gray-100 p-4 rounded-lg min-h-[400px]">
          <h3 className="font-semibold mb-2">Test Results:</h3>
          {testResults.length === 0 ? (
            <p className="text-gray-500 italic">No tests run yet...</p>
          ) : (
            <div className="space-y-1 font-mono text-sm max-h-80 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="text-gray-700">
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Enhanced Instructions */}
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">Testing Instructions:</h4>
          <div className="text-sm text-yellow-700 space-y-2">
            <div>
              <strong>Basic Tests:</strong>
              <ul className="ml-4 space-y-1">
                <li>• <strong>Test API:</strong> Checks connection to your backend</li>
                <li>• <strong>Test Register:</strong> Creates a new user with unique email</li>
                <li>• <strong>Test Email Login:</strong> Logs in with known account</li>
                <li>• <strong>Test Profile:</strong> Fetches current user profile (requires login)</li>
              </ul>
            </div>
            
            <div>
              <strong>Google SSO Tests:</strong>
              <ul className="ml-4 space-y-1">
                <li>• <strong>Test Google User:</strong> Simulates Google-only user trying email login</li>
                <li>• <strong>Test Google SDK:</strong> Initializes Google Sign-In and shows popup</li>
              </ul>
            </div>
            
            <div>
              <strong>Debugging:</strong>
              <ul className="ml-4 space-y-1">
                <li>• Check browser console for detailed API logs</li>
                <li>• Check Network tab in DevTools for API requests</li>
                <li>• Look for cross-authentication messages above</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestAuthPage;