import { NextResponse } from 'next/server';

interface LivenessCheck {
  name: string;
  status: 'alive' | 'dead';
  responseTime?: number;
  error?: string;
  details?: Record<string, unknown>;
}

interface LivenessStatus {
  status: 'alive' | 'dead';
  timestamp: string;
  uptime: number;
  deployment: {
    slot: string;
    timestamp: string;
  };
  checks: LivenessCheck[];
}

// Function to perform liveness checks
async function performLivenessChecks(): Promise<LivenessCheck[]> {
  const checks: LivenessCheck[] = [];
  
  // Check 1: Process responsiveness
  const responseStart = Date.now();
  try {
    // Simple responsiveness check
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 1)); // 1ms delay
    const endTime = Date.now();
    
    checks.push({
      name: 'responsiveness',
      status: (endTime - startTime) < 100 ? 'alive' : 'dead', // 100ms threshold
      responseTime: Date.now() - responseStart,
      details: {
        processingTime: endTime - startTime
      }
    });
  } catch (error) {
    checks.push({
      name: 'responsiveness',
      status: 'dead',
      responseTime: Date.now() - responseStart,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
  
  // Check 2: Memory leak detection
  const memoryStart = Date.now();
  try {
    const memoryUsage = process.memoryUsage();
    const memoryThreshold = 1024 * 1024 * 1024; // 1GB threshold for liveness
    
    checks.push({
      name: 'memory_leak',
      status: memoryUsage.heapUsed < memoryThreshold ? 'alive' : 'dead',
      responseTime: Date.now() - memoryStart,
      details: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        threshold: memoryThreshold
      }
    });
  } catch (error) {
    checks.push({
      name: 'memory_leak',
      status: 'dead',
      responseTime: Date.now() - memoryStart,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
  
  // Check 3: Event loop lag
  const eventLoopStart = Date.now();
  try {
    const start = process.hrtime();
    await new Promise(resolve => setImmediate(resolve));
    const delta = process.hrtime(start);
    const lagMs = (delta[0] * 1000) + (delta[1] / 1000000);
    
    checks.push({
      name: 'event_loop',
      status: lagMs < 50 ? 'alive' : 'dead', // 50ms threshold
      responseTime: Date.now() - eventLoopStart,
      details: {
        lagMs: lagMs
      }
    });
  } catch (error) {
    checks.push({
      name: 'event_loop',
      status: 'dead',
      responseTime: Date.now() - eventLoopStart,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
  
  // Check 4: Basic functionality
  const functionalityStart = Date.now();
  try {
    // Test basic JavaScript functionality
    const testObject = { test: 'value' };
    const testResult = JSON.stringify(testObject);
    
    checks.push({
      name: 'functionality',
      status: testResult === '{"test":"value"}' ? 'alive' : 'dead',
      responseTime: Date.now() - functionalityStart,
      details: {
        testResult: testResult
      }
    });
  } catch (error) {
    checks.push({
      name: 'functionality',
      status: 'dead',
      responseTime: Date.now() - functionalityStart,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
  
  return checks;
}

export async function GET() {
  try {
    const startTime = Date.now();
    
    // Perform all liveness checks
    const checks = await performLivenessChecks();
    
    // Calculate overall liveness status
    const hasDead = checks.some(check => check.status === 'dead');
    const overallStatus = hasDead ? 'dead' : 'alive';
    
    const livenessStatus: LivenessStatus = {
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
    const httpStatus = overallStatus === 'alive' ? 200 : 503;
    
    return NextResponse.json(livenessStatus, { 
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    });
    
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'dead', 
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