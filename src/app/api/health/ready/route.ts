import { NextResponse } from 'next/server';

interface ReadinessCheck {
  name: string;
  status: 'ready' | 'not-ready';
  responseTime?: number;
  error?: string;
  details?: Record<string, unknown>;
}

interface ReadinessStatus {
  status: 'ready' | 'not-ready';
  timestamp: string;
  deployment: {
    slot: string;
    timestamp: string;
  };
  checks: ReadinessCheck[];
}

// Function to perform readiness checks
async function performReadinessChecks(): Promise<ReadinessCheck[]> {
  const checks: ReadinessCheck[] = [];
  
  // Check 1: Application dependencies
  const depsStart = Date.now();
  try {
    // Check if all critical dependencies are available
    const requiredEnvVars = ['NODE_ENV', 'NEXT_PUBLIC_GOOGLE_CLIENT_ID'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    checks.push({
      name: 'dependencies',
      status: missingVars.length === 0 ? 'ready' : 'not-ready',
      responseTime: Date.now() - depsStart,
      details: {
        missingVars: missingVars.length > 0 ? missingVars : undefined
      }
    });
  } catch (error) {
    checks.push({
      name: 'dependencies',
      status: 'not-ready',
      responseTime: Date.now() - depsStart,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
  
  // Check 2: Memory availability
  const memoryStart = Date.now();
  try {
    const memoryUsage = process.memoryUsage();
    const memoryThreshold = 900 * 1024 * 1024; // 900MB threshold for readiness
    
    checks.push({
      name: 'memory',
      status: memoryUsage.heapUsed < memoryThreshold ? 'ready' : 'not-ready',
      responseTime: Date.now() - memoryStart,
      details: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        threshold: memoryThreshold
      }
    });
  } catch (error) {
    checks.push({
      name: 'memory',
      status: 'not-ready',
      responseTime: Date.now() - memoryStart,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
  
  // Check 3: External API connectivity
  const apiStart = Date.now();
  try {
    // Check if we can reach external APIs (Google OAuth, etc.)
    // For now, we'll just check DNS resolution
    const dns = await import('dns');
    await new Promise((resolve, reject) => {
      dns.resolve('google.com', (err: Error | null) => {
        if (err) reject(err);
        else resolve(true);
      });
    });
    
    checks.push({
      name: 'external_apis',
      status: 'ready',
      responseTime: Date.now() - apiStart,
      details: {
        message: 'External API connectivity available'
      }
    });
  } catch (error) {
    checks.push({
      name: 'external_apis',
      status: 'not-ready',
      responseTime: Date.now() - apiStart,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
  
  // Check 4: Application warm-up
  const warmupStart = Date.now();
  try {
    // Check if application has been running long enough to be considered ready
    const uptimeThreshold = 5; // 5 seconds minimum uptime
    const uptime = process.uptime();
    
    checks.push({
      name: 'warmup',
      status: uptime >= uptimeThreshold ? 'ready' : 'not-ready',
      responseTime: Date.now() - warmupStart,
      details: {
        uptime: uptime,
        threshold: uptimeThreshold
      }
    });
  } catch (error) {
    checks.push({
      name: 'warmup',
      status: 'not-ready',
      responseTime: Date.now() - warmupStart,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
  
  return checks;
}

export async function GET() {
  try {
    const startTime = Date.now();
    
    // Perform all readiness checks
    const checks = await performReadinessChecks();
    
    // Calculate overall readiness status
    const hasNotReady = checks.some(check => check.status === 'not-ready');
    const overallStatus = hasNotReady ? 'not-ready' : 'ready';
    
    const readinessStatus: ReadinessStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      deployment: {
        slot: process.env.DEPLOYMENT_SLOT || 'unknown',
        timestamp: process.env.DEPLOYMENT_TIMESTAMP || new Date().toISOString()
      },
      checks
    };
    
    // Return appropriate HTTP status code
    const httpStatus = overallStatus === 'ready' ? 200 : 503;
    
    return NextResponse.json(readinessStatus, { 
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    });
    
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'not-ready', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        deployment: {
          slot: process.env.DEPLOYMENT_SLOT || 'unknown',
          timestamp: process.env.DEPLOYMENT_TIMESTAMP || new Date().toISOString()
        }
      },
      { status: 503 }
    );
  }
}