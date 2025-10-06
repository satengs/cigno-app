import { NextResponse } from 'next/server';
import parseProjectDescription from '@/lib/parsers/projectDescriptionParser';

// Configuration for optional remote enrichment. Network issues are handled gracefully.
const AI_CONFIG = {
  baseUrl: process.env.AI_API_BASE_URL || 'https://ai.vave.ch',
  apiKey: process.env.AI_API_KEY || 'b51b67b2924988b88809a421bd3cfb09d9a58d19ac746053f358e11b2895ac17',
  customAgentId: process.env.AI_CUSTOM_AGENT_ID || '68db998aabd74ae6e0a5fbc8',
  enableRemote: process.env.CIGNO_DISABLE_REMOTE_ANALYSIS !== 'true'
};

function extractJsonPayload(content) {
  if (!content) {
    return null;
  }

  if (typeof content === 'object') {
    return content;
  }

  if (typeof content !== 'string') {
    return null;
  }

  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed);
  } catch (error) {
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        return null;
      }
    }
  }

  return null;
}

async function callCustomAgent(description, projectData) {
  const url = `${AI_CONFIG.baseUrl}/api/custom-agents/${AI_CONFIG.customAgentId}/execute`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'X-API-Key': AI_CONFIG.apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: description,
      context: projectData,
      response_format: 'json'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Custom agent failed (${response.status}): ${errorText}`);
  }

  const payload = await response.json();
  const raw = payload?.response || payload?.output || payload?.result || payload?.data;
  return extractJsonPayload(raw);
}

export async function POST(request) {
  try {
    const { description, projectData = {} } = await request.json();

    if (!description || typeof description !== 'string' || !description.trim()) {
      return NextResponse.json({
        error: 'Project description is required',
        details: 'Please provide a project description to analyze'
      }, { status: 400 });
    }

    const warnings = [];

    // Always build a local analysis so we have reliable data regardless of AI availability.
    const localAnalysis = parseProjectDescription(description, projectData);
    let finalAnalysis = localAnalysis;
    let source = 'local-parser';

    if (AI_CONFIG.enableRemote) {
      try {
        const aiPayload = await callCustomAgent(description, projectData);

        if (aiPayload) {
          // Merge AI-provided fields back through the deterministic parser to enforce schema.
          finalAnalysis = parseProjectDescription(description, { ...projectData, ...aiPayload });
          source = 'custom-agent+parser';
        } else {
          warnings.push('Custom agent returned no structured payload; using local analysis.');
        }
      } catch (error) {
        warnings.push(error.message || 'Custom agent request failed.');
      }
    }

    const message = warnings.length > 0
      ? 'Project analysis completed with warnings'
      : 'Project analysis completed successfully';

    return NextResponse.json({
      success: true,
      message,
      source,
      warnings,
      analyzedProject: finalAnalysis,
      rawAnalysis: finalAnalysis
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze project description',
      details: error.message || 'Unexpected error'
    }, { status: 500 });
  }
}
