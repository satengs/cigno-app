import getRequiredAiApiKey from './getRequiredAiApiKey.js';

const GEOGRAPHY_KEYWORDS = [
  'switzerland',
  'swiss',
  'emea',
  'europe',
  'north america',
  'latin america',
  'latam',
  'asia',
  'middle east',
  'africa',
  'apac',
  'global'
];

const STRATEGIC_CONTENT_CHECKS = [
  {
    name: 'Market sizing',
    pattern: /market sizing|size of the market|total addressable market|tam|sam|som/i,
    improvement: 'Include market sizing analysis to quantify the opportunity.'
  },
  {
    name: 'Competitive analysis',
    pattern: /competitive|competitor|benchmark|landscape|peer set/i,
    improvement: 'Add competitive landscape analysis to understand market positioning.'
  },
  {
    name: 'Capability assessment',
    pattern: /capabilit|operating model|internal strength|delivery model/i,
    improvement: 'Include capability assessment to identify internal strengths and gaps.'
  },
  {
    name: 'Gap analysis',
    pattern: /gap analysis|capability gap|versus|delta vs|performance gap/i,
    improvement: 'Add gap analysis to highlight areas for improvement.'
  },
  {
    name: 'Strategic options',
    pattern: /strategic option|scenario|buy vs build|partner|acquisition|roadmap|transformation/i,
    improvement: 'Include strategic options and implementation roadmap.'
  }
];

const OUTCOME_KEYWORDS = /roadmap|next step|implementation|phasing|so what|recommendation|playbook|action plan|sequencing/i;
const AUDIENCE_KEYWORDS = /audienc|stakeholder|client|board|executive|leadership/i;
const OBJECTIVE_KEYWORDS = /objective|goal|aim|success metric|kpi|north star/i;

function normalizeTextArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : JSON.stringify(item)))
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(/\n+|;+|\u2022|\*/)
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return [String(value)];
}

function mergeUnique(values) {
  return [...new Set(values.filter(Boolean))];
}

const normalizeScore = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  let numeric = value;

  if (typeof numeric === 'string') {
    const match = numeric.match(/-?\d+(?:\.\d+)?/);
    numeric = match ? Number(match[0]) : Number(numeric);
  }

  numeric = Number(numeric);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  const scaled = numeric > 10 ? numeric / 10 : numeric;
  return Number(scaled.toFixed(1));
};

function deriveBriefInsights(rawBrief) {
  const brief = (rawBrief || '').trim();
  const lower = brief.toLowerCase();
  const wordCount = brief ? brief.split(/\s+/).filter(Boolean).length : 0;

  const strengths = [];
  const improvements = [];
  const suggestions = [];
  let score = 5;

  if (wordCount === 0) {
    return {
      strengths,
      improvements: ['Add content to the brief to enable analysis.'],
      suggestions,
      summary: 'Brief is empty – add content before scoring.',
      score: 0
    };
  }

  if (wordCount < 180) {
    improvements.push('Expand the brief to provide more context and detail.');
    score -= 1.5;
  } else if (wordCount > 900) {
    suggestions.push('Consider tightening the brief for better readability.');
    score -= 1;
  } else if (wordCount >= 300 && wordCount <= 600) {
    strengths.push('Balanced length provides adequate detail without overwhelming the reader.');
    score += 1;
  } else {
    score += 0.25;
  }

  if (OBJECTIVE_KEYWORDS.test(lower)) {
    strengths.push('References objectives or success metrics.');
    score += 0.8;
  } else {
    improvements.push('Define clear objectives and success metrics.');
    score -= 0.8;
  }

  if (AUDIENCE_KEYWORDS.test(lower)) {
    strengths.push('Identifies the audience or stakeholder focus.');
    score += 0.6;
  } else {
    improvements.push('Clarify the target stakeholders and audience.');
    score -= 0.6;
  }

  const hasGeography = GEOGRAPHY_KEYWORDS.some(keyword => lower.includes(keyword));
  if (hasGeography) {
    strengths.push('Specifies the geography or market focus.');
    score += 0.6;
  } else {
    improvements.push('Specify the target geography or market focus.');
    score -= 0.6;
  }

  STRATEGIC_CONTENT_CHECKS.forEach(check => {
    if (check.pattern.test(lower)) {
      strengths.push(`${check.name} is called out.`);
      score += 0.7;
    } else {
      improvements.push(check.improvement);
      score -= 0.7;
    }
  });

  if (OUTCOME_KEYWORDS.test(lower)) {
    strengths.push('Includes the "so what" — roadmap, sequencing, or tangible actions.');
    score += 0.8;
  } else {
    improvements.push('Include clear outcomes, roadmap, or next steps.');
    score -= 0.8;
  }

  const uniqueStrengths = mergeUnique(strengths);
  const uniqueImprovements = mergeUnique(improvements);
  const uniqueSuggestions = mergeUnique(suggestions);

  const summary = uniqueImprovements.length
    ? `Key gaps detected: ${uniqueImprovements.slice(0, 2).join(' ')}`
    : 'Brief covers the core evaluation checks for length, structure, and strategic content.';

  const normalizedScore = Math.max(0, Math.min(10, Number(score.toFixed(1))));

  return {
    strengths: uniqueStrengths,
    improvements: uniqueImprovements,
    suggestions: uniqueSuggestions,
    summary,
    score: normalizedScore
  };
}

export async function scoreBriefWithAgent({
  deliverableId,
  brief,
  deliverableData = {},
  projectData = {},
  improvementPayload = null
}) {
  const textForEvaluation = typeof brief === 'string' ? brief : '';
  const heuristicInsights = deriveBriefInsights(textForEvaluation);

  const AI_CONFIG = {
    baseUrl: process.env.AI_API_BASE_URL || 'https://ai.vave.ch',
    apiKey: getRequiredAiApiKey(),
    scoreAgentId: process.env.AI_BRIEF_SCORE_AGENT_ID || '68f48912dfc921b68ec3eb2b'
  };

  let sanitizedImprovement = improvementPayload;
  if (improvementPayload && typeof improvementPayload === 'object') {
    try {
      sanitizedImprovement = JSON.parse(JSON.stringify(improvementPayload));
    } catch (error) {
      sanitizedImprovement = null;
    }
  }

  const context = {
    deliverableId,
    requestType: 'brief_evaluation',
    deliverableData,
    projectData,
    improvementPayload: sanitizedImprovement
  };

  try {
    try {
      console.log('🧾 Brief scoring request:', JSON.stringify({
        deliverableId,
        wordCount: textForEvaluation.split(/\s+/).filter(Boolean).length,
        hasImprovementPayload: Boolean(improvementPayload)
      }, null, 2));
      console.log('📤 Scoring context payload:', JSON.stringify(context, null, 2));
    } catch (logError) {
      console.log('🧾 Brief scoring request (non-serializable):', {
        deliverableId,
        hasImprovementPayload: Boolean(improvementPayload)
      });
    }

    const response = await fetch(`${AI_CONFIG.baseUrl}/api/custom-agents/${AI_CONFIG.scoreAgentId}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': AI_CONFIG.apiKey
      },
      body: JSON.stringify({
        message: `${textForEvaluation}\n\nPlease return ONLY valid JSON format with: {"score": <number 0-10>, "strengths": [<array>], "improvements": [<array>], "suggestions": [<array>]}`,
        context,
        format: 'json',
        output_format: 'json'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Custom agent failed (${response.status}): ${errorText}`);
    }

    const agentResult = await response.json();
    
    // LOG RAW RESPONSE
    console.log('');
    console.log('🧠 ========== BRIEF SCORING AGENT RESPONSE START ==========');
    console.log('Agent ID:', AI_CONFIG.scoreAgentId);
    try {
      console.log('Raw Response JSON:', JSON.stringify(agentResult, null, 2));
    } catch (logError) {
      console.log('Raw Response (non-serializable):', agentResult);
    }
    console.log('Response Type:', typeof agentResult);
    console.log('Response Keys:', Object.keys(agentResult || {}));
    console.log('🧠 ========== BRIEF SCORING AGENT RESPONSE END ==========');
    console.log('');
    
    let payload = agentResult?.data || agentResult?.response || agentResult;
    
    // If payload is a JSON string, parse it
    if (typeof payload === 'string') {
      console.log('📄 Response is a string, attempting to parse...');
      console.log('String content (first 500 chars):', payload.substring(0, 500));
      
      try {
        payload = JSON.parse(payload);
        console.log('✅ Successfully parsed JSON string');
      } catch (parseError) {
        console.log('❌ Failed initial JSON parse, trying to extract JSON from text...');
        
        // Try to extract JSON from markdown code blocks
        const jsonMatch = payload.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          try {
            payload = JSON.parse(jsonMatch[1]);
            console.log('✅ Extracted JSON from markdown code block');
          } catch (extractError) {
            console.warn('⚠️ Failed to parse extracted JSON from markdown');
            payload = {};
          }
        } else {
          // Try to find JSON object in text
          const jsonObjectMatch = payload.match(/\{[\s\S]*?\}/);
          if (jsonObjectMatch) {
            try {
              payload = JSON.parse(jsonObjectMatch[0]);
              console.log('✅ Extracted JSON object from text');
            } catch (extractError) {
              console.warn('⚠️ Failed to parse extracted JSON object');
              payload = {};
            }
          } else {
            console.warn('⚠️ No JSON found in string response, using empty payload');
            payload = {};
          }
        }
      }
    }

    console.log('📦 Payload after parsing:', payload);
    console.log('Payload keys:', Object.keys(payload || {}));

    // Extract score from multiple possible fields
    const qualityScoreRaw = payload?.qualityScore 
      ?? payload?.score 
      ?? payload?.total_score 
      ?? payload?.quality_score
      ?? payload?.briefQuality
      ?? payload?.rating;
      
    console.log('🎯 Quality score raw value:', qualityScoreRaw);
    
    const normalizedScore = normalizeScore(qualityScoreRaw);
    console.log('🎯 Normalized score:', normalizedScore);
    
    const strengths = normalizeTextArray(
      payload?.strengths 
      ?? payload?.highlights 
      ?? payload?.positives
      ?? payload?.strong_points
    );
    
    const improvements = normalizeTextArray(
      payload?.improvements 
      ?? payload?.gaps 
      ?? payload?.weaknesses
      ?? payload?.areas_for_improvement
      ?? payload?.suggested_improvements
    );
    
    const suggestions = normalizeTextArray(
      payload?.suggestions 
      ?? payload?.nextSteps 
      ?? payload?.recommendations
      ?? payload?.action_items
    );

    // Prioritize AI agent response over hardcoded fallbacks
    const hasAIResponse = strengths.length > 0 || improvements.length > 0 || suggestions.length > 0;
    
    const normalizedResult = {
      qualityScore: normalizedScore ?? heuristicInsights.score,
      strengths: hasAIResponse ? mergeUnique(strengths) : mergeUnique([...strengths, ...heuristicInsights.strengths]),
      improvements: hasAIResponse ? mergeUnique(improvements) : mergeUnique([...improvements, ...heuristicInsights.improvements]),
      suggestions: hasAIResponse ? mergeUnique(suggestions) : mergeUnique([...suggestions, ...heuristicInsights.suggestions]),
      summary: payload?.summary || payload?.notes || heuristicInsights.summary
    };

    if ((normalizedResult.qualityScore === null || normalizedResult.qualityScore === undefined) && heuristicInsights.score !== null) {
      normalizedResult.qualityScore = heuristicInsights.score;
    }

    if (!normalizedResult.summary) {
      normalizedResult.summary = heuristicInsights.summary;
    }

    try {
      console.log('📦 Normalized scoring result:', JSON.stringify(normalizedResult, null, 2));
    } catch (logError) {
      console.log('📦 Normalized scoring result (non-serializable):', normalizedResult);
    }

    return {
      success: true,
      source: 'custom-agent',
      agentId: AI_CONFIG.scoreAgentId,
      data: normalizedResult
    };
  } catch (error) {
    console.error('❌ Brief scoring error:', error);
    return {
      success: false,
      source: 'error',
      agentId: null,
      data: {
        qualityScore: heuristicInsights.score,
        strengths: heuristicInsights.strengths,
        improvements: heuristicInsights.improvements,
        suggestions: heuristicInsights.suggestions,
        summary: `Brief analysis completed with basic checks. AI scoring unavailable: ${error.message || 'please retry.'}`
      },
      fallbackReason: error.message
    };
  }
}

export { normalizeTextArray };
