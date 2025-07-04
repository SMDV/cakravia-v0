"use client"

import React, { useState } from 'react';
import { CreditCard, ExternalLink } from 'lucide-react';
import { paymentAPI } from '@/lib/api';

const TestPaymentPage = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [snapToken, setSnapToken] = useState<string | null>(null);
  const [snapUrl, setSnapUrl] = useState<string | null>(null);

  // Test data - these will be used for testing
  const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiZTc4Zjc5ODAtZTQ2OC00ZGI1LWE0ZTEtNjRkOWJjOTcwODQzIiwiZXhwIjoxNzUxNjAwMzM1fQ.rmbHfDo6n6KeVbwsDzit8fFMVs58Ltjd_N1jf-owarE';
  const TEST_ID = '822bbdce-ea25-4c63-95e9-9630bbaac6a6';

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const setTestTokenManually = () => {
    // Set the test token in cookies for API calls
    document.cookie = `auth_token=${TEST_TOKEN}; path=/; max-age=3600`;
    addResult(`✅ Set test token: ${TEST_TOKEN.slice(0, 20)}...`);
  };

  const testCreateOrder = async () => {
    setIsLoading(true);
    addResult('🔄 Testing order creation...');
    
    try {
      const response = await paymentAPI.createVarkOrder(TEST_ID);
      
      addResult(`✅ Order created successfully:`);
      addResult(`   - Order ID: ${response.data.id}`);
      addResult(`   - Order Number: ${response.data.order_number}`);
      addResult(`   - Amount: Rp ${response.data.amount}`);
      addResult(`   - Status: ${response.data.status}`);
      addResult(`   - Expires: ${new Date(response.data.expires_at).toLocaleString()}`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult(`❌ Order creation failed: ${errorMessage}`);
    }
    
    setIsLoading(false);
  };

  const testGetPaymentToken = async () => {
    setIsLoading(true);
    addResult('🔄 Testing payment token retrieval...');
    
    try {
      const response = await paymentAPI.getVarkPaymentToken(TEST_ID);
      
      addResult(`✅ Payment token retrieved:`);
      addResult(`   - Token ID: ${response.data.id}`);
      addResult(`   - Snap Token: ${response.data.snap_token}`);
      addResult(`   - Midtrans Order ID: ${response.data.midtrans_order_id}`);
      addResult(`   - Amount: Rp ${response.data.amount}`);
      addResult(`   - Status: ${response.data.status}`);
      
      // Extract redirect URL from midtrans_response
      try {
        const midtransResponse = JSON.parse(response.data.midtrans_response);
        if (midtransResponse.redirect_url) {
          setSnapUrl(midtransResponse.redirect_url);
          addResult(`   - Snap URL: ${midtransResponse.redirect_url}`);
        }
      } catch {
        addResult(`   - Raw response: ${response.data.midtrans_response}`);
      }
      
      setSnapToken(response.data.snap_token);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult(`❌ Payment token retrieval failed: ${errorMessage}`);
    }
    
    setIsLoading(false);
  };

  const testFullPaymentFlow = async () => {
    setIsLoading(true);
    addResult('🚀 Testing full payment flow (Order -> Payment)...');
    
    try {
      const result = await paymentAPI.initializeVarkPayment(TEST_ID);
      
      addResult(`✅ Full payment flow completed:`);
      addResult(`📦 Order Details:`);
      addResult(`   - Order ID: ${result.order.id}`);
      addResult(`   - Order Number: ${result.order.order_number}`);
      addResult(`   - Amount: Rp ${result.order.amount}`);
      
      addResult(`💳 Payment Details:`);
      addResult(`   - Payment ID: ${result.paymentToken.id}`);
      addResult(`   - Snap Token: ${result.paymentToken.snap_token}`);
      
      // Extract and set snap URL
      try {
        const midtransResponse = JSON.parse(result.paymentToken.midtrans_response);
        if (midtransResponse.redirect_url) {
          setSnapUrl(midtransResponse.redirect_url);
          addResult(`   - Payment URL Ready!`);
        }
      } catch {
        addResult(`   - Raw response: ${result.paymentToken.midtrans_response}`);
      }
      
      setSnapToken(result.paymentToken.snap_token);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult(`❌ Full payment flow failed: ${errorMessage}`);
    }
    
    setIsLoading(false);
  };

  const openSnapPayment = () => {
    if (snapUrl) {
      window.open(snapUrl, '_blank');
      addResult('🌐 Opened Snap payment page in new tab');
    }
  };

  const clearResults = () => {
    setTestResults([]);
    setSnapToken(null);
    setSnapUrl(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8" style={{ fontFamily: 'Merriweather Sans, sans-serif' }}>
      <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-blue-600" />
          Payment Flow Test Page
        </h1>
        
        {/* Test Data Info */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h2 className="text-lg font-semibold mb-2 text-blue-800">Test Data</h2>
          <div className="space-y-1 text-sm">
            <p><strong>Test ID:</strong> <code className="bg-blue-100 px-2 py-1 rounded">{TEST_ID}</code></p>
            <p><strong>Auth Token:</strong> <code className="bg-blue-100 px-2 py-1 rounded">{TEST_TOKEN.slice(0, 30)}...</code></p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button
            onClick={setTestTokenManually}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
          >
            Set Test Token
          </button>
          
          <button
            onClick={testCreateOrder}
            disabled={isLoading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 text-sm"
          >
            1. Create Order
          </button>
          
          <button
            onClick={testGetPaymentToken}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-sm"
          >
            2. Get Payment Token
          </button>
          
          <button
            onClick={testFullPaymentFlow}
            disabled={isLoading}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 text-sm"
          >
            Full Flow (1+2)
          </button>
        </div>

        {/* Snap Payment Button */}
        {snapUrl && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-green-800 mb-1">Payment Ready!</h3>
                <p className="text-sm text-green-700">Snap token: <code>{snapToken}</code></p>
              </div>
              <button
                onClick={openSnapPayment}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                <ExternalLink className="w-4 h-4" />
                Open Payment
              </button>
            </div>
          </div>
        )}

        {/* Clear Button */}
        <div className="mb-6">
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
          {isLoading && (
            <div className="flex items-center gap-2 mb-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-blue-600">Processing...</span>
            </div>
          )}
          {testResults.length === 0 ? (
            <p className="text-gray-500 italic">No tests run yet...</p>
          ) : (
            <div className="space-y-1 font-mono text-sm max-h-80 overflow-y-auto">
              {testResults.map((result, index) => (
                <div 
                  key={index} 
                  className={`text-gray-700 ${
                    result.includes('✅') ? 'text-green-700' :
                    result.includes('❌') ? 'text-red-700' :
                    result.includes('🔄') ? 'text-blue-700' :
                    ''
                  }`}
                >
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h4 className="font-semibold text-yellow-800 mb-2">Testing Instructions:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li><strong>1. Set Test Token:</strong> Sets the auth token in cookies for API authentication</li>
            <li><strong>2. Create Order:</strong> Calls the order creation endpoint for VARK test</li>
            <li><strong>3. Get Payment Token:</strong> Retrieves the Midtrans snap token for payment</li>
            <li><strong>4. Full Flow:</strong> Runs both order creation and payment token retrieval</li>
            <li><strong>5. Open Payment:</strong> Opens the Midtrans Snap payment page</li>
          </ul>
        </div>

        {/* API Endpoints Info */}
        <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
          <h4 className="font-semibold text-indigo-800 mb-2">API Endpoints Used:</h4>
          <ul className="text-sm text-indigo-700 space-y-1">
            <li><code>POST /users/vark_tests/{'{testId}'}/orders</code> - Create payment order</li>
            <li><code>POST /users/vark_tests/{'{testId}'}/orders/payment_token</code> - Get payment token</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestPaymentPage;