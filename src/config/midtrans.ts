/**
 * Midtrans Payment Gateway Configuration
 *
 * This file centralizes all Midtrans-related configuration settings.
 * To update Midtrans settings, only modify the values in this file.
 */

/**
 * Midtrans Environment
 * Set to 'production' for live transactions or 'sandbox' for testing
 */
export const MIDTRANS_ENVIRONMENT = process.env.NEXT_PUBLIC_MIDTRANS_ENVIRONMENT || 'sandbox';

/**
 * Midtrans Snap Script URL
 * The URL for loading the Midtrans Snap payment popup script
 */
export const MIDTRANS_SNAP_SCRIPT_URL = MIDTRANS_ENVIRONMENT === 'production'
  ? 'https://app.midtrans.com/snap/snap.js'
  : 'https://app.sandbox.midtrans.com/snap/snap.js';

/**
 * Midtrans Client Key
 * Your Midtrans client key for authentication
 *
 * Production: Mid-client-8GWOB2qNMTVXD6YC
 * Sandbox: SB-Mid-client-nKMAqVgSgOIsOQyk (or SB-Mid-client-BnZAW_h-FqRtI-kz for older tests)
 */
export const MIDTRANS_CLIENT_KEY = MIDTRANS_ENVIRONMENT === 'production'
  ? 'Mid-client-8GWOB2qNMTVXD6YC'  // Production client key
  : 'SB-Mid-client-nKMAqVgSgOIsOQyk';  // Sandbox client key

/**
 * Helper function to load Midtrans Snap script
 * Use this function to consistently load Midtrans across your application
 */
export const loadMidtransScript = () => {
  return new Promise<void>((resolve, reject) => {
    // Check if script is already loaded
    if (document.getElementById('midtrans-script')) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = 'midtrans-script';
    script.src = MIDTRANS_SNAP_SCRIPT_URL;
    script.setAttribute('data-client-key', MIDTRANS_CLIENT_KEY);

    script.onload = () => {
      console.log('✅ Midtrans script loaded successfully');
      resolve();
    };

    script.onerror = () => {
      console.error('❌ Failed to load Midtrans script');
      reject(new Error('Failed to load Midtrans script'));
    };

    document.head.appendChild(script);
  });
};
