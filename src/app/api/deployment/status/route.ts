import { NextResponse } from 'next/server';

interface DeploymentStatus {
  deployment: {
    slot: string;
    timestamp: string;
    version: string;
    status: 'active' | 'inactive' | 'deploying' | 'failed';
  };
  application: {
    uptime: number;
    startTime: string;
    nodeVersion: string;
    platform: string;
    environment: string;
  };
  health: {
    status: 'healthy' | 'unhealthy' | 'degraded';
    lastCheck: string;
  };
  system: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
    };
    pid: number;
  };
  timestamp: string;
}

export async function GET() {
  try {
    const startTime = Date.now();
    
    // Get deployment information
    const deploymentSlot = process.env.DEPLOYMENT_SLOT || 'unknown';
    const deploymentTimestamp = process.env.DEPLOYMENT_TIMESTAMP || new Date().toISOString();
    const deploymentVersion = process.env.DEPLOYMENT_VERSION || '1.0.0';
    
    // Get application information
    const uptime = process.uptime();
    const startTimeIso = new Date(Date.now() - (uptime * 1000)).toISOString();
    
    // Get system information
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Determine deployment status
    let deploymentStatus: 'active' | 'inactive' | 'deploying' | 'failed' = 'active';
    
    // Simple health check
    let healthStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    try {
      // Basic health indicators
      const memoryThreshold = 800 * 1024 * 1024; // 800MB
      if (memoryUsage.heapUsed > memoryThreshold) {
        healthStatus = 'degraded';
      }
      
      if (uptime < 5) {
        deploymentStatus = 'deploying';
      }
    } catch {
      healthStatus = 'unhealthy';
    }
    
    const deploymentStatusResponse: DeploymentStatus = {
      deployment: {
        slot: deploymentSlot,
        timestamp: deploymentTimestamp,
        version: deploymentVersion,
        status: deploymentStatus
      },
      application: {
        uptime: uptime,
        startTime: startTimeIso,
        nodeVersion: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV || 'development'
      },
      health: {
        status: healthStatus,
        lastCheck: new Date().toISOString()
      },
      system: {
        memory: {
          used: memoryUsage.heapUsed,
          total: memoryUsage.heapTotal,
          percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
        },
        cpu: {
          usage: Math.round(((cpuUsage.user + cpuUsage.system) / 1000000) * 100) / 100
        },
        pid: process.pid
      },
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(deploymentStatusResponse, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${Date.now() - startTime}ms`,
        'X-Deployment-Slot': deploymentSlot
      }
    });
    
  } catch (error) {
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        deployment: {
          slot: process.env.DEPLOYMENT_SLOT || 'unknown',
          timestamp: process.env.DEPLOYMENT_TIMESTAMP || new Date().toISOString(),
          version: process.env.DEPLOYMENT_VERSION || '1.0.0',
          status: 'failed'
        }
      },
      { status: 500 }
    );
  }
}