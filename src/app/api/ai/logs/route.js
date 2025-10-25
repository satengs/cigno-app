import { NextResponse } from 'next/server';
import aiLogger from '../../../../lib/logging/aiLogger.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse filter parameters
    const filters = {
      type: searchParams.get('type'),
      level: searchParams.get('level'),
      projectId: searchParams.get('projectId'),
      since: searchParams.get('since'),
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')) : undefined
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined || filters[key] === null) {
        delete filters[key];
      }
    });

    const logs = aiLogger.getLogs(filters);
    const stats = aiLogger.getStats();

    return NextResponse.json({
      success: true,
      data: {
        logs,
        stats,
        total: logs.length,
        filters: filters
      }
    });

  } catch (error) {
    console.error('❌ AI logs API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve AI logs',
      details: error.message
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const confirm = searchParams.get('confirm');

    if (confirm !== 'true') {
      return NextResponse.json({
        success: false,
        error: 'Please add ?confirm=true to clear all logs'
      }, { status: 400 });
    }

    aiLogger.clearLogs();

    return NextResponse.json({
      success: true,
      message: 'All AI logs cleared'
    });

  } catch (error) {
    console.error('❌ AI logs clear error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to clear AI logs',
      details: error.message
    }, { status: 500 });
  }
}