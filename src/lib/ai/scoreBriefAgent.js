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
    improvement: 'Quantify the market size, growth, and value pools to anchor the commercial opportunity.'
  },
  {
    name: 'Competitive analysis',
    pattern: /competitive|competitor|benchmark|landscape|peer set/i,
    improvement: 'Benchmark incumbents and disruptors to pinpoint UBS’s differentiation gaps.'
  },
  {
    name: 'Capability assessment',
    pattern: /capabilit|operating model|internal strength|delivery model/i,
    improvement: 'Assess UBS’s current capabilities and enablers to surface structural execution gaps.'
  },
  {
    name: 'Gap analysis',
    pattern: /gap analysis|capability gap|versus|delta vs|performance gap/i,
    improvement: 'Highlight the critical gaps versus market leaders and what needs to change.'
  },
  {
    name: 'Strategic options',
    pattern: /strategic option|scenario|buy vs build|partner|acquisition|roadmap|transformation/i,
    improvement: 'Lay out the strategic moves (build, partner, buy) and the roadmap or phasing required.'
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
      improvements: ['Draft the brief so it provides context, objectives, and required outputs.'],
      suggestions,
      summary: 'Brief is empty – add content before scoring.',
      score: 0
    };
  }

  if (wordCount < 180) {
    improvements.push('Expand the brief beyond ~180 words so the team has adequate context.');
    score -= 1.5;
  } else if (wordCount > 900) {
    suggestions.push('Tighten the draft to under ~900 words so executives can scan it quickly.');
    score -= 1;
  } else if (wordCount >= 300 && wordCount <= 600) {
    strengths.push('Balanced length gives enough colour without overwhelming the reader.');
    score += 1;
  } else {
    score += 0.25;
  }

  if (OBJECTIVE_KEYWORDS.test(lower)) {
    strengths.push('References objectives or success metrics.');
    score += 0.8;
  } else {
    improvements.push('Define the concrete objectives and how success will be measured.');
    score -= 0.8;
  }

  if (AUDIENCE_KEYWORDS.test(lower)) {
    strengths.push('Identifies the audience or stakeholder focus.');
    score += 0.6;
  } else {
    improvements.push('Clarify the target stakeholders so the storyline and tone can be tailored.');
    score -= 0.6;
  }

  const hasGeography = GEOGRAPHY_KEYWORDS.some(keyword => lower.includes(keyword));
  if (hasGeography) {
    strengths.push('Specifies the geography or market focus.');
    score += 0.6;
  } else {
    improvements.push('Anchor the strategy to a specific geography or market (e.g., Switzerland) and note regulatory context.');
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
    strengths.push('Includes the “so what” — roadmap, sequencing, or tangible actions.');
    score += 0.8;
  } else {
    improvements.push('Spell out the “so what”: a roadmap, sequencing, or the tactical/strategic moves expected.');
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
    apiKey: process.env.AI_API_KEY || 'b51b67b2924988b88809a421bd3cfb09d9a58d19ac746053f358e11b2895ac17',
    scoreAgentId: process.env.AI_BRIEF_SCORE_AGENT_ID || '68eec5005a1a64c93c600fda'
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
        message: textForEvaluation,
        context
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Custom agent failed (${response.status}): ${errorText}`);
    }

    const agentResult = await response.json();
    try {
      console.log('🧠 Raw scoring agent result:', JSON.stringify(agentResult, null, 2));
    } catch (logError) {
      console.log('🧠 Raw scoring agent result (non-serializable):', agentResult);
    }
    let payload = agentResult?.data || agentResult?.response || agentResult;
    
    // If payload is a JSON string, parse it
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch (parseError) {
        console.warn('⚠️ Failed to parse response as JSON:', parseError);
        payload = {};
      }
    }

    const qualityScoreRaw = payload?.qualityScore ?? payload?.score ?? payload?.total_score;
    const normalizedScore = normalizeScore(qualityScoreRaw);
    const strengths = normalizeTextArray(payload?.strengths ?? payload?.highlights);
    const improvements = normalizeTextArray(payload?.improvements ?? payload?.gaps);
    const suggestions = normalizeTextArray(payload?.suggestions ?? payload?.nextSteps);

    const normalizedResult = {
      qualityScore: normalizedScore ?? heuristicInsights.score,
      strengths: mergeUnique([...strengths, ...heuristicInsights.strengths]),
      improvements: mergeUnique([...improvements, ...heuristicInsights.improvements]),
      suggestions: mergeUnique([...suggestions, ...heuristicInsights.suggestions]),
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
        summary: `Automated scoring unavailable: ${error.message || 'please retry.'}`
      },
      fallbackReason: error.message
    };
  }
}

export { normalizeTextArray };
