import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';

export async function GET() {
  try {
    // Check database connection
    await connectDB();
    
    // Basic health check response
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'cigno-platform',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'production',
      database: 'connected',
      uptime: process.uptime()
    };
    
    return NextResponse.json(healthCheck);
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    const healthCheck = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'cigno-platform',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'production',
      database: 'disconnected',
      error: error.message,
      uptime: process.uptime()
    };
    
    return NextResponse.json(healthCheck, { status: 503 });
  }
}
