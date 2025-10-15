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

function buildFallbackEvaluation(brief) {
  const text = brief || '';
  const lengthScore = Math.min(text.length / 600, 1.2) * 2;
  const hasObjectives = /objective|goal|aim/i.test(text) ? 1.5 : 0;
  const hasAudience = /audienc|stakeholder|client/i.test(text) ? 1.0 : 0;
  const hasStructure = /scope|deliverable|timeline|success|metric/i.test(text) ? 2.0 : 0;

  const score = Math.max(3, Math.min(9.5, 3 + lengthScore + hasObjectives + hasAudience + hasStructure));

  const strengths = [];
  const improvements = [];

  if (hasObjectives) {
    strengths.push('Includes clear objectives.');
  } else {
    improvements.push('Add SMART objectives that define measurable outcomes.');
  }

  if (hasAudience) {
    strengths.push('References target stakeholders.');
  } else {
    improvements.push('Describe the audience and their expectations.');
  }

  if (hasStructure) {
    strengths.push('Covers key scope or success elements.');
  } else {
    improvements.push('Clarify scope, deliverables, timeline, and success criteria.');
  }

  if (text.length < 220) {
    improvements.push('Expand contextual background, dependencies, and supporting data needs.');
  }

  return {
    qualityScore: Number(score.toFixed(1)),
    strengths,
    improvements,
    suggestions: [
      'Collect quantitative evidence to back up the recommendations.',
      'Align with compliance or regulatory considerations before delivery.'
    ],
    summary: 'Offline scoring estimate: strengthen objectives, audience focus, and measurable success criteria.'
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
    const payload = agentResult?.data || agentResult?.response || agentResult;

    const qualityScoreRaw = payload?.qualityScore ?? payload?.score;
    const strengths = normalizeTextArray(payload?.strengths ?? payload?.highlights);
    const improvements = normalizeTextArray(payload?.improvements ?? payload?.gaps);
    const suggestions = normalizeTextArray(payload?.suggestions ?? payload?.nextSteps);

    const normalizedResult = {
      qualityScore: Number.isFinite(Number(qualityScoreRaw))
        ? Number(Number(qualityScoreRaw).toFixed(1))
        : null,
      strengths,
      improvements,
      suggestions,
      summary: payload?.summary || payload?.notes || ''
    };

    if (normalizedResult.qualityScore === null) {
      const fallback = buildFallbackEvaluation(textForEvaluation);
      normalizedResult.qualityScore = fallback.qualityScore;
      normalizedResult.strengths = fallback.strengths;
      normalizedResult.improvements = fallback.improvements;
      normalizedResult.suggestions = fallback.suggestions;
      normalizedResult.summary = fallback.summary;
    }

    return {
      success: true,
      source: 'custom-agent',
      agentId: AI_CONFIG.scoreAgentId,
      data: normalizedResult
    };
  } catch (error) {
    const fallback = buildFallbackEvaluation(textForEvaluation);

    return {
      success: true,
      source: 'fallback',
      agentId: null,
      data: fallback,
      fallbackReason: error.message
    };
  }
}

export { normalizeTextArray, buildFallbackEvaluation };
