import { NextResponse } from 'next/server';

interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  error?: string;
  details?: Record<string, unknown>;
}

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  deployment: {
    slot: string;
    timestamp: string;
  };
  checks: HealthCheck[];
  system: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
    };
  };
}

// Function to perform system health checks
async function performHealthChecks(): Promise<HealthCheck[]> {
  const checks: HealthCheck[] = [];
  
  // Check 1: Memory usage
  const memoryStart = Date.now();
  try {
    const memoryUsage = process.memoryUsage();
    const memoryCheck: HealthCheck = {
      name: 'memory',
      status: memoryUsage.heapUsed < 800 * 1024 * 1024 ? 'healthy' : 'degraded', // 800MB threshold
      responseTime: Date.now() - memoryStart,
      details: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss
      }
    };
    checks.push(memoryCheck);
  } catch (error) {
    checks.push({
      name: 'memory',
      status: 'unhealthy',
      responseTime: Date.now() - memoryStart,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
  
  // Check 2: File system access
  const fsStart = Date.now();
  try {
    const { promises: fs, constants } = await import('fs');
    await fs.access('/tmp', constants.R_OK | constants.W_OK);
    checks.push({
      name: 'filesystem',
      status: 'healthy',
      responseTime: Date.now() - fsStart
    });
  } catch (error) {
    checks.push({
      name: 'filesystem',
      status: 'unhealthy',
      responseTime: Date.now() - fsStart,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
  
  // Check 3: Environment variables
  const envStart = Date.now();
  try {
    const requiredEnvVars = ['NODE_ENV', 'NEXT_PUBLIC_GOOGLE_CLIENT_ID'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    checks.push({
      name: 'environment',
      status: missingVars.length === 0 ? 'healthy' : 'unhealthy',
      responseTime: Date.now() - envStart,
      details: {
        nodeEnv: process.env.NODE_ENV,
        missingVars: missingVars.length > 0 ? missingVars : undefined
      }
    });
  } catch (error) {
    checks.push({
      name: 'environment',
      status: 'unhealthy',
      responseTime: Date.now() - envStart,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
  
  // Check 4: Database connectivity (if applicable)
  const dbStart = Date.now();
  try {
    // For now, we'll just check if we can make HTTP requests
    // In a real app, you'd check database connectivity here
    checks.push({
      name: 'database',
      status: 'healthy',
      responseTime: Date.now() - dbStart,
      details: {
        message: 'Database checks not implemented (API-based app)'
      }
    });
  } catch (error) {
    checks.push({
      name: 'database',
      status: 'unhealthy',
      responseTime: Date.now() - dbStart,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
  
  return checks;
}

export async function GET() {
  try {
    const startTime = Date.now();
    
    // Perform all health checks
    const checks = await performHealthChecks();
    
    // Calculate overall status
    const hasUnhealthy = checks.some(check => check.status === 'unhealthy');
    const hasDegraded = checks.some(check => check.status === 'degraded');
    
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (hasUnhealthy) {
      overallStatus = 'unhealthy';
    } else if (hasDegraded) {
      overallStatus = 'degraded';
    }
    
    // Get system information
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      deployment: {
        slot: process.env.DEPLOYMENT_SLOT || 'unknown',
        timestamp: process.env.DEPLOYMENT_TIMESTAMP || new Date().toISOString()
      },
      checks,
      system: {
        memory: {
          used: memoryUsage.heapUsed,
          total: memoryUsage.heapTotal,
          percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
        },
        cpu: {
          usage: Math.round(((cpuUsage.user + cpuUsage.system) / 1000000) * 100) / 100
        }
      }
    };
    
    // Return appropriate HTTP status code
    const httpStatus = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;
    
    return NextResponse.json(healthStatus, { 
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    });
    
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        deployment: {
          slot: process.env.DEPLOYMENT_SLOT || 'unknown',
          timestamp: process.env.DEPLOYMENT_TIMESTAMP || new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}