import { NextResponse } from 'next/server';
import { scoreBriefWithAgent } from '../../../../lib/ai/scoreBriefAgent';
import getRequiredAiApiKey from '../../../../lib/ai/getRequiredAiApiKey.js';

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

function normalizeList(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map(item => (typeof item === 'string' ? item.trim() : String(item).trim()))
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/[\n\r•\-;]+/)
      .map(part => part.replace(/^[-•\d.\s]+/, '').trim())
      .filter(Boolean);
  }

  return [String(value).trim()].filter(Boolean);
}

function sanitizeSuggestion(suggestion) {
  if (!suggestion || typeof suggestion !== 'object') {
    return suggestion;
  }

  const normalized = { ...suggestion };

  const improvedCandidate = [
    normalized.improvedBrief,
    normalized.improved_brief,
    normalized.improved_brief_text,
    normalized.updatedBrief,
    normalized.generatedBrief
  ].find(value => typeof value === 'string' && value.trim());

  if (improvedCandidate) {
    const improvedHtml = convertToHTML(improvedCandidate);
    normalized.improvedBrief = improvedHtml;
    normalized.improved_brief = improvedHtml;
    normalized.improved_brief_text = improvedHtml;
  }

  const changesCandidate = normalized.changes_made ?? normalized.changesMade;
  if (changesCandidate !== undefined && changesCandidate !== null) {
    const normalizedChanges = normalizeList(changesCandidate);
    normalized.changes_made = normalizedChanges;
    normalized.changesMade = normalizedChanges;
  }

  const scoreCandidate = normalized.expected_score ?? normalized.expectedScore;
  if (scoreCandidate !== undefined && scoreCandidate !== null && Number.isFinite(Number(scoreCandidate))) {
    const numericScore = Number(Number(scoreCandidate).toFixed(1));
    normalized.expected_score = numericScore;
    normalized.expectedScore = numericScore;
  }

  if (typeof normalized.rationale === 'string') {
    normalized.rationale = normalized.rationale.trim();
  }

  return normalized;
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
      apiKey: getRequiredAiApiKey(),
      briefAgentId: process.env.AI_BRIEF_AGENT_ID || '68dde123c1b3b5cc990ad5f1' // Default agent ID
    };

    console.log(`📝 Improving brief for deliverable: ${deliverableId}`);
    console.log(`🤖 Using agent: ${AI_CONFIG.briefAgentId}`);
    
    // Log the received data for verification
    console.log('📊 Deliverable Data:', deliverableData);
    console.log('🏢 Project Data:', projectData);

    // Prepare context for brief improvement
    const resolveString = (...candidates) => {
      for (const candidate of candidates) {
        if (!candidate) continue;
        if (typeof candidate === 'string' && candidate.trim()) {
          return candidate.trim();
        }
      }
      return null;
    };

    const fallbackAudience = () => {
      if (Array.isArray(deliverableData?.audience) && deliverableData.audience.length) return deliverableData.audience;
      if (Array.isArray(deliverableData?.metadata?.audience) && deliverableData.metadata.audience.length) return deliverableData.metadata.audience;
      if (Array.isArray(projectData?.audience) && projectData.audience.length) return projectData.audience;
      return ['Executive stakeholders'];
    };

    const deliverableTypeRaw = deliverableData?.format
      || deliverableData?.type
      || deliverableData?.metadata?.format
      || deliverableData?.metadata?.type
      || 'presentation';

    const normalisedType = (() => {
      if (typeof deliverableTypeRaw !== 'string') return 'presentation';
      const lower = deliverableTypeRaw.toLowerCase();
      if (['presentation', 'deck', 'ppt', 'slide deck', 'slides'].some(token => lower.includes(token))) {
        return 'presentation';
      }
      if (lower === 'deliverable' || lower === 'document') {
        return 'presentation';
      }
      return lower;
    })();

    const projectName = resolveString(
      projectData?.name,
      projectData?.title,
      deliverableData?.projectName,
      deliverableData?.project?.name,
      deliverableData?.metadata?.projectName,
      deliverableData?.metadata?.project?.name
    ) || 'Strategic Initiative';

    const clientName = resolveString(
      projectData?.client_name,
      projectData?.clientName,
      projectData?.client?.name,
      deliverableData?.client?.name,
      deliverableData?.client_name,
      deliverableData?.metadata?.clientName,
      deliverableData?.metadata?.client?.name
    ) || 'Primary Client';

    const industry = resolveString(
      projectData?.industry,
      deliverableData?.industry,
      deliverableData?.metadata?.industry,
      deliverableData?.project?.industry,
      projectData?.metadata?.industry
    ) || 'General';

    const deliverableName = resolveString(
      deliverableData?.name,
      deliverableData?.title,
      deliverableData?.metadata?.title,
      deliverableData?.metadata?.name
    ) || 'Strategic Presentation';

    const context = {
      deliverableId,
      deliverableName,
      deliverableType: normalisedType,
      audience: fallbackAudience(),
      projectName,
      clientName,
      industry,
      currentBrief: originalBrief,
      workingDraft: draftBrief,
      instructions: instructions || '',
      requestType: 'brief_improvement'
    };

    const agentPayload = {
      message: draftBrief,
      context: {
        ...context,
        requestType: 'brief_improvement'
      }
    };

    console.log('📤 Context sent to agent:', JSON.stringify(agentPayload.context, null, 2));
    console.log('🚀 Brief agent payload:', JSON.stringify(agentPayload, null, 2));

    const customAgentResponse = await fetch(`${AI_CONFIG.baseUrl}/api/custom-agents/${AI_CONFIG.briefAgentId}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': AI_CONFIG.apiKey
      },
      body: JSON.stringify(agentPayload)
    });

    if (!customAgentResponse.ok) {
      const errorText = await customAgentResponse.text();
      throw new Error(`Custom agent failed (${customAgentResponse.status}): ${errorText}`);
    }

    const agentResult = await customAgentResponse.json();
    console.log('✅ Brief improved via custom agent');
    try {
      console.log('🧠 Raw agent result:', JSON.stringify(agentResult, null, 2));
    } catch (logError) {
      console.log('🧠 Raw agent result (non-serializable):', agentResult);
    }

    const parseStringPayload = (value) => {
      if (typeof value !== 'string') return null;
      const trimmed = value.trim();
      if (!trimmed) return null;

      const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
      const candidate = codeBlockMatch ? codeBlockMatch[1].trim() : trimmed;

      try {
        return JSON.parse(candidate);
      } catch (parseError) {
        return null;
      }
    };

    const ensureObjectResult = (value) => {
      if (value && typeof value === 'object') {
        const clone = { ...value };
        if (typeof clone.response === 'string') {
          const parsedResponse = parseStringPayload(clone.response);
          if (parsedResponse && typeof parsedResponse === 'object') {
            clone.response = parsedResponse;
          }
        }
        if (typeof clone.data === 'string') {
          const parsedData = parseStringPayload(clone.data);
          if (parsedData && typeof parsedData === 'object') {
            clone.data = parsedData;
          }
        }
        return clone;
      }

      const parsed = parseStringPayload(value);
      if (parsed && typeof parsed === 'object') {
        return ensureObjectResult(parsed);
      }

      return { raw: value };
    };

    const extractSuggestions = (result) => {
      if (!result || typeof result !== 'object') {
        return [];
      }
      if (Array.isArray(result.suggested_briefs)) {
        return result.suggested_briefs;
      }
      if (Array.isArray(result?.data?.suggested_briefs)) {
        return result.data.suggested_briefs;
      }
      if (Array.isArray(result?.response?.suggested_briefs)) {
        return result.response.suggested_briefs;
      }
      return [];
    };

    const applySuggestionsToResult = (result, suggestions) => {
      if (!result || typeof result !== 'object') {
        return result;
      }

      let updated = { ...result, suggested_briefs: suggestions };

      if (result.data && typeof result.data === 'object' && Array.isArray(result.data.suggested_briefs)) {
        updated = {
          ...updated,
          data: {
            ...result.data,
            suggested_briefs: suggestions
          }
        };
      }

      if (result.response && typeof result.response === 'object' && Array.isArray(result.response.suggested_briefs)) {
        updated = {
          ...updated,
          response: {
            ...result.response,
            suggested_briefs: suggestions
          }
        };
      }

      return updated;
    };

    let processedResult = ensureObjectResult(agentResult);

    const rawSuggestions = extractSuggestions(processedResult);
    const normalizedSuggestions = rawSuggestions.map(sanitizeSuggestion);
    const primarySuggestion = normalizedSuggestions.find(
      (item) => typeof item?.improvedBrief === 'string' && item.improvedBrief.trim()
    ) || normalizedSuggestions[0] || null;

    processedResult = applySuggestionsToResult(processedResult, normalizedSuggestions);

    if (primarySuggestion) {
      processedResult = {
        ...processedResult,
        primarySuggestion
      };
    }

    if (typeof processedResult.improvedBrief === 'string') {
      processedResult = {
        ...processedResult,
        improvedBrief: convertToHTML(processedResult.improvedBrief)
      };
    }

    if (processedResult.response?.improvedBrief && typeof processedResult.response.improvedBrief === 'string') {
      processedResult = {
        ...processedResult,
        response: {
          ...processedResult.response,
          improvedBrief: convertToHTML(processedResult.response.improvedBrief)
        }
      };
    }

    if (processedResult.data?.improvedBrief && typeof processedResult.data.improvedBrief === 'string') {
      processedResult = {
        ...processedResult,
        data: {
          ...processedResult.data,
          improvedBrief: convertToHTML(processedResult.data.improvedBrief)
        }
      };
    }

    const improvedCandidates = [
      processedResult.improvedBrief,
      processedResult.response?.improvedBrief,
      primarySuggestion?.improvedBrief,
      primarySuggestion?.improved_brief_text,
      processedResult.raw,
      typeof agentResult === 'string' ? agentResult : null
    ];

    let improvedBriefHtml = '';
    for (const candidate of improvedCandidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        improvedBriefHtml = convertToHTML(candidate);
        if (improvedBriefHtml) {
          break;
        }
      }
    }

    if (!improvedBriefHtml) {
      improvedBriefHtml = convertToHTML(draftBrief);
    }

    if (!processedResult.improvedBrief && improvedBriefHtml) {
      processedResult = {
        ...processedResult,
        improvedBrief: improvedBriefHtml
      };
    }

    const payloadForClient = {
      ...processedResult,
      improvedBrief: processedResult.improvedBrief || improvedBriefHtml,
      suggested_briefs: processedResult.suggested_briefs || []
    };

    try {
      console.log('📦 Normalized payload for client:', JSON.stringify(payloadForClient, null, 2));
    } catch (logError) {
      console.log('📦 Normalized payload for client (non-serializable):', payloadForClient);
    }

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
