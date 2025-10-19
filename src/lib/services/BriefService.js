/**
 * Brief Quality Service
 * Centralized service for managing brief quality scores
 */

/**
 * Save brief quality data to database
 */
export async function saveBriefQuality(deliverableId, { score, strengths = [], improvements = [] }) {
  if (!deliverableId) {
    throw new Error('Deliverable ID is required');
  }

  console.log('💾 BriefService: Saving quality data for deliverable:', deliverableId);
  console.log('💾 BriefService: Score:', score);

  const response = await fetch(`/api/deliverables/${deliverableId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      brief_quality: score,
      brief_strengths: strengths,
      brief_improvements: improvements,
      brief_last_evaluated_at: new Date().toISOString()
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to save brief quality');
  }

  const result = await response.json();
  console.log('✅ BriefService: Quality data saved successfully');
  
  return result;
}

/**
 * Load brief quality data from database
 */
export async function loadBriefQuality(deliverableId) {
  if (!deliverableId) {
    return { score: null, strengths: [], improvements: [] };
  }

  console.log('📥 BriefService: Loading quality data for deliverable:', deliverableId);

  const response = await fetch(`/api/deliverables/${deliverableId}`);
  
  if (!response.ok) {
    console.error('❌ BriefService: Failed to load deliverable');
    return { score: null, strengths: [], improvements: [] };
  }

  const data = await response.json();
  const deliverable = data.data?.deliverable || data.data || data;

  const result = {
    score: deliverable.brief_quality ?? null,
    strengths: deliverable.brief_strengths || [],
    improvements: deliverable.brief_improvements || []
  };

  console.log('✅ BriefService: Loaded score:', result.score);
  
  return result;
}

/**
 * Test brief quality using AI agent
 */
export async function testBriefQuality(deliverableId, briefContent, deliverableData = {}, projectData = {}) {
  console.log('🧪 BriefService: Testing brief quality...');
  console.log('📤 BriefService: Sending context:', {
    deliverableData,
    projectData
  });

  const response = await fetch('/api/ai/score-brief', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      deliverableId,
      currentBrief: briefContent,
      deliverableData: {
        title: deliverableData.title,
        type: deliverableData.type,
        audience: deliverableData.audience,
        priority: deliverableData.priority,
        dueDate: deliverableData.dueDate,
        summary: deliverableData.summary || ''
      },
      projectData: {
        ...projectData,
        summary: projectData.summary || ''
      }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to test brief');
  }

  const result = await response.json();
  const data = result.data || result;

  const qualityData = {
    score: data.qualityScore ?? data.score ?? null,
    strengths: data.strengths || [],
    improvements: data.improvements || [],
    suggestions: data.suggestions || []
  };

  console.log('✅ BriefService: Test complete, score:', qualityData.score);

  // Auto-save to database
  if (qualityData.score !== null) {
    await saveBriefQuality(deliverableId, qualityData);
  }

  return qualityData;
}

