import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 Testing AI API connection...');
    
    const AI_CONFIG = {
      baseUrl: process.env.AI_API_BASE_URL || 'https://ai.vave.ch',
      apiKey: process.env.AI_API_KEY || 'b51b67b2924988b88809a421bd3cfb09d9a58d19ac746053f358e11b2895ac17'
    };
    
    console.log(`🌐 Testing connection to: ${AI_CONFIG.baseUrl}`);
    console.log(`🔑 API Key present: ${AI_CONFIG.apiKey ? 'Yes' : 'No'}`);
    
    // Test with a simple health check or basic endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(`${AI_CONFIG.baseUrl}/health`, {
      method: 'GET',
      headers: {
        'X-API-Key': AI_CONFIG.apiKey
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log(`📊 Health check status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.text();
      return NextResponse.json({
        success: true,
        message: 'AI API is reachable',
        status: response.status,
        data: data
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'AI API returned error status',
        status: response.status,
        statusText: response.statusText
      }, { status: response.status });
    }
    
  } catch (error) {
    console.error('❌ AI API connection test failed:', error);
    
    let errorType = 'Unknown error';
    if (error.name === 'AbortError') {
      errorType = 'Timeout (API not responding)';
    } else if (error.code === 'ECONNREFUSED') {
      errorType = 'Connection refused (API server down)';
    } else if (error.code === 'ENOTFOUND') {
      errorType = 'DNS resolution failed (API URL not found)';
    } else if (error.message.includes('fetch')) {
      errorType = 'Network fetch error';
    }
    
    return NextResponse.json({
      success: false,
      message: `AI API connection failed: ${errorType}`,
      error: error.message,
      code: error.code,
      name: error.name
    }, { status: 503 });
  }
}
