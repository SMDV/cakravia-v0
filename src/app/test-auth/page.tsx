"use client"

import React, { useState } from 'react';
import { authAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const TestAuthPage = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

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
      
      addResult(`✅ Login successful: ${response.data.user.name}`);
      addResult(`🔑 Token received: ${response.data.token ? 'YES' : 'NO'}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult(`❌ Login failed: ${errorMessage}`);
    }
    
    setIsLoading(false);
  };

  const testProfile = async () => {
    setIsLoading(true);
    addResult('🔄 Testing profile fetch...');
    
    try {
      const response = await authAPI.getProfile();
      addResult(`✅ Profile fetched: ${response.data.name}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult(`❌ Profile fetch failed: ${errorMessage}`);
    }
    
    setIsLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8" style={{ fontFamily: 'Merriweather Sans, sans-serif' }}>
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Authentication Test Page</h1>
        
        {/* Current Auth Status */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Current Authentication Status</h2>
          <p><strong>Authenticated:</strong> {isAuthenticated ? '✅ YES' : '❌ NO'}</p>
          {user && (
            <>
              <p><strong>User Name:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>User ID:</strong> {user.id}</p>
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
        
        {/* Test Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
            Test Login
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
        <div className="bg-gray-100 p-4 rounded-lg min-h-[300px]">
          <h3 className="font-semibold mb-2">Test Results:</h3>
          {testResults.length === 0 ? (
            <p className="text-gray-500 italic">No tests run yet...</p>
          ) : (
            <div className="space-y-1 font-mono text-sm max-h-64 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="text-gray-700">
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">Testing Instructions:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>1. <strong>Test Register:</strong> Creates a new user with a unique email</li>
            <li>2. <strong>Test Login:</strong> Logs in with the known account from Postman</li>
            <li>3. <strong>Test Profile:</strong> Fetches current user profile (requires login)</li>
            <li>4. Check browser console for detailed API logs</li>
            <li>5. Check Network tab in DevTools to see actual API requests</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestAuthPage;