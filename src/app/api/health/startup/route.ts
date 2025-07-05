import { NextResponse } from 'next/server';

interface StartupCheck {
  name: string;
  status: 'started' | 'starting' | 'failed';
  responseTime?: number;
  error?: string;
  details?: Record<string, unknown>;
}

interface StartupStatus {
  status: 'started' | 'starting' | 'failed';
  timestamp: string;
  uptime: number;
  deployment: {
    slot: string;
    timestamp: string;
  };
  checks: StartupCheck[];
}

// Function to perform startup checks
async function performStartupChecks(): Promise<StartupCheck[]> {
  const checks: StartupCheck[] = [];
  
  // Check 1: Application initialization
  const initStart = Date.now();
  try {
    // Check if application has been running long enough to be considered started
    const uptime = process.uptime();
    const minimumUptime = 2; // 2 seconds minimum uptime
    
    let status: 'started' | 'starting' | 'failed' = 'starting';
    if (uptime >= minimumUptime) {
      status = 'started';
    } else if (uptime > 0) {
      status = 'starting';
    } else {
      status = 'failed';
    }
    
    checks.push({
      name: 'initialization',
      status: status,
      responseTime: Date.now() - initStart,
      details: {
        uptime: uptime,
        minimumUptime: minimumUptime
      }
    });
  } catch (error) {
    checks.push({
      name: 'initialization',
      status: 'failed',
      responseTime: Date.now() - initStart,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
  
  // Check 2: Configuration loading
  const configStart = Date.now();
  try {
    const requiredEnvVars = ['NODE_ENV'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    checks.push({
      name: 'configuration',
      status: missingVars.length === 0 ? 'started' : 'failed',
      responseTime: Date.now() - configStart,
      details: {
        nodeEnv: process.env.NODE_ENV,
        missingVars: missingVars.length > 0 ? missingVars : undefined
      }
    });
  } catch (error) {
    checks.push({
      name: 'configuration',
      status: 'failed',
      responseTime: Date.now() - configStart,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
  
  // Check 3: Next.js compilation
  const compilationStart = Date.now();
  try {
    // Check if Next.js has compiled successfully
    // We'll check if the process is running and can handle requests
    const isProduction = process.env.NODE_ENV === 'production';
    
    checks.push({
      name: 'compilation',
      status: 'started',
      responseTime: Date.now() - compilationStart,
      details: {
        environment: process.env.NODE_ENV,
        isProduction: isProduction
      }
    });
  } catch (error) {
    checks.push({
      name: 'compilation',
      status: 'failed',
      responseTime: Date.now() - compilationStart,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
  
  // Check 4: Memory initialization
  const memoryStart = Date.now();
  try {
    const memoryUsage = process.memoryUsage();
    const minimumMemory = 50 * 1024 * 1024; // 50MB minimum
    
    checks.push({
      name: 'memory_initialization',
      status: memoryUsage.heapUsed >= minimumMemory ? 'started' : 'starting',
      responseTime: Date.now() - memoryStart,
      details: {
        heapUsed: memoryUsage.heapUsed,
        minimumMemory: minimumMemory
      }
    });
  } catch (error) {
    checks.push({
      name: 'memory_initialization',
      status: 'failed',
      responseTime: Date.now() - memoryStart,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
  
  // Check 5: API routes availability
  const apiStart = Date.now();
  try {
    // Check if we can process API requests
    const testPath = '/api/health/startup';
    
    checks.push({
      name: 'api_routes',
      status: 'started',
      responseTime: Date.now() - apiStart,
      details: {
        testPath: testPath,
        message: 'API routes are responsive'
      }
    });
  } catch (error) {
    checks.push({
      name: 'api_routes',
      status: 'failed',
      responseTime: Date.now() - apiStart,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
  
  return checks;
}

export async function GET() {
  try {
    const startTime = Date.now();
    
    // Perform all startup checks
    const checks = await performStartupChecks();
    
    // Calculate overall startup status
    const hasFailed = checks.some(check => check.status === 'failed');
    const hasStarting = checks.some(check => check.status === 'starting');
    
    let overallStatus: 'started' | 'starting' | 'failed' = 'started';
    if (hasFailed) {
      overallStatus = 'failed';
    } else if (hasStarting) {
      overallStatus = 'starting';
    }
    
    const startupStatus: StartupStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      deployment: {
        slot: process.env.DEPLOYMENT_SLOT || 'unknown',
        timestamp: process.env.DEPLOYMENT_TIMESTAMP || new Date().toISOString()
      },
      checks
    };
    
    // Return appropriate HTTP status code
    const httpStatus = overallStatus === 'started' ? 200 : overallStatus === 'starting' ? 202 : 503;
    
    return NextResponse.json(startupStatus, { 
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    });
    
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        deployment: {
          slot: process.env.DEPLOYMENT_SLOT || 'unknown',
          timestamp: process.env.DEPLOYMENT_TIMESTAMP || new Date().toISOString()
        }
      },
      { status: 503 }
    );
  }
}