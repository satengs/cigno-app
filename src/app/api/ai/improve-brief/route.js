import { NextResponse } from 'next/server';
import { scoreBriefWithAgent } from '../../../../lib/ai/scoreBriefAgent';

function convertToHTML(text) {
  if (!text || typeof text !== 'string') {
    return text;
  }
  
  // If already contains HTML tags, return as is
  if (text.includes('<') && text.includes('>')) {
    return text;
  }
  
  try {
    // Convert plain text to HTML
    let html = text
      // Convert double line breaks to paragraph breaks
      .split('\n\n')
      .map(paragraph => `<p>${paragraph.trim()}</p>`)
      .join('\n')
      // Convert remaining single line breaks to <br>
      .replace(/\n/g, '<br>')
      // Convert bullet points
      .replace(/^[\s]*[-*+]\s+(.+)$/gm, '<li>$1</li>')
      // Convert **bold** to <strong>
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Convert *italic* to <em>
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
      
    // Simple list wrapping - find consecutive <li> tags and wrap them
    html = html.replace(/(<li>.*?<\/li>)(\s*<br>\s*<li>.*?<\/li>)*/g, (match) => {
      return '<ul>\n' + match.replace(/<br>\s*/g, '\n') + '\n</ul>';
    });
    
    return html;
  } catch (error) {
    console.error('Error converting to HTML:', error);
    return text; // Return original text if conversion fails
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      deliverableId,
      currentBrief,
      workingDraft,
      instructions,
      deliverableData,
      projectData
    } = body;

    if (!deliverableId) {
      return NextResponse.json(
        { error: 'Deliverable ID is required' },
        { status: 400 }
      );
    }

    if (!currentBrief && !workingDraft) {
      return NextResponse.json(
        { error: 'Current brief content is required' },
        { status: 400 }
      );
    }

    const originalBrief = typeof currentBrief === 'string' ? currentBrief : '';
    const draftBrief = typeof workingDraft === 'string' && workingDraft.trim()
      ? workingDraft
      : originalBrief;

    if (!draftBrief) {
      return NextResponse.json(
        { error: 'No brief content provided to improve' },
        { status: 400 }
      );
    }

    // AI Configuration - using brief improvement agent
    const AI_CONFIG = {
      baseUrl: process.env.AI_API_BASE_URL || 'https://ai.vave.ch',
      apiKey: process.env.AI_API_KEY || 'b51b67b2924988b88809a421bd3cfb09d9a58d19ac746053f358e11b2895ac17',
      briefAgentId: process.env.AI_BRIEF_AGENT_ID || '68dde123c1b3b5cc990ad5f1' // Default agent ID
    };

    console.log(`📝 Improving brief for deliverable: ${deliverableId}`);
    console.log(`🤖 Using agent: ${AI_CONFIG.briefAgentId}`);
    
    // Log the received data for verification
    console.log('📊 Deliverable Data:', deliverableData);
    console.log('🏢 Project Data:', projectData);

    // Prepare context for brief improvement
    const context = {
      deliverableId: deliverableId,
      deliverableName: deliverableData?.title || 'Unknown Deliverable',
      deliverableType: deliverableData?.type || 'presentation',
      audience: deliverableData?.audience || [],
      projectName: projectData?.name || 'Unknown Project',
      clientName: projectData?.client_name || 'Unknown Client',
      industry: projectData?.industry || 'General',
      currentBrief: originalBrief,
      workingDraft: draftBrief,
      instructions: instructions || '',
      requestType: 'brief_improvement'
    };

    const message = draftBrief;

    console.log('📤 Context sent to agent:', JSON.stringify(context, null, 2));

    const customAgentResponse = await fetch(`${AI_CONFIG.baseUrl}/api/custom-agents/${AI_CONFIG.briefAgentId}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': AI_CONFIG.apiKey
      },
      body: JSON.stringify({
        message: message,
        context: context
      })
    });

    if (!customAgentResponse.ok) {
      const errorText = await customAgentResponse.text();
      throw new Error(`Custom agent failed (${customAgentResponse.status}): ${errorText}`);
    }

    const agentResult = await customAgentResponse.json();
    console.log('✅ Brief improved via custom agent');
    
    // Process the result to ensure improvedBrief is in HTML format
    let processedResult = agentResult;
    if (agentResult && agentResult.improvedBrief) {
      processedResult = {
        ...agentResult,
        improvedBrief: convertToHTML(agentResult.improvedBrief)
      };
    } else if (agentResult && agentResult.response && agentResult.response.improvedBrief) {
      processedResult = {
        ...agentResult,
        response: {
          ...agentResult.response,
          improvedBrief: convertToHTML(agentResult.response.improvedBrief)
        }
      };
    }

    const improvedBriefHtml =
      (typeof processedResult === 'object' && processedResult !== null && processedResult.improvedBrief)
        ? processedResult.improvedBrief
        : (typeof processedResult === 'string'
            ? convertToHTML(processedResult)
            : (processedResult?.response?.improvedBrief ? convertToHTML(processedResult.response.improvedBrief) : ''));

    const payloadForClient = (typeof processedResult === 'object' && processedResult !== null)
      ? { ...processedResult, improvedBrief: processedResult.improvedBrief || improvedBriefHtml }
      : { improvedBrief: improvedBriefHtml };

    return NextResponse.json({
      success: true,
      source: 'custom-agent',
      agentId: AI_CONFIG.briefAgentId,
      deliverableId: deliverableId,
      data: payloadForClient
    });

  } catch (error) {
    console.error('❌ Brief improvement error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to improve brief',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
