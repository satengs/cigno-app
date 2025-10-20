import { NextResponse } from 'next/server';

// Ensure this endpoint is always resolved at request time. Using request.url in
// the handler forces dynamic rendering, so we mark it explicitly to avoid
// static optimization attempts during builds.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// AI Configuration matching other working endpoints
const AI_CONFIG = {
  baseUrl: process.env.AI_API_BASE_URL || 'https://ai.vave.ch',
  apiKey: process.env.AI_API_KEY || 'b51b67b2924988b88809a421bd3cfb09d9a58d19ac746053f358e11b2895ac17'
};

/**
 * GET /api/documents
 * Fetch documents from knowledge base
 */
export async function GET(request) {
  try {
    const searchParams = request.nextUrl?.searchParams || new URL(request.url).searchParams;
    const knowledgeBaseId = searchParams.get('knowledgeBaseId');

    if (!knowledgeBaseId) {
      return NextResponse.json(
        { error: 'Knowledge base ID is required' },
        { status: 400 }
      );
    }

    console.log('📚 Fetching documents from knowledge base:', knowledgeBaseId);
    console.log('🔑 Using API key:', AI_CONFIG.apiKey.substring(0, 10) + '...');

    const response = await fetch(
      `${AI_CONFIG.baseUrl}/api/documents?knowledgeBaseId=${knowledgeBaseId}`,
      {
        method: 'GET',
        headers: {
          'X-API-Key': AI_CONFIG.apiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('📡 External API response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ External API error:', errorText);
      console.error('❌ Request URL:', `${AI_CONFIG.baseUrl}/api/documents?knowledgeBaseId=${knowledgeBaseId}`);
      console.error('❌ Request headers sent:', {
        'X-API-Key': AI_CONFIG.apiKey.substring(0, 10) + '...',
        'Content-Type': 'application/json'
      });
      
      return NextResponse.json(
        { error: 'Failed to fetch documents', details: errorText, status: response.status },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Documents fetched successfully:', data?.documents?.length || 0);
    console.log('📄 Sample document:', data?.documents?.[0]);

    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Documents API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
