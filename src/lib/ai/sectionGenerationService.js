/**
 * Section Generation Service with Async Polling
 * Provides functions for generating sections with proper polling and narrative display
 */

/**
 * Generate section with async polling
 * @param {Object} params - Generation parameters
 * @param {Function} onProgress - Progress callback
 * @param {Function} onNarrative - Narrative callback
 * @param {Function} onComplete - Completion callback
 * @param {Function} onError - Error callback
 */
export async function generateSectionWithPolling(params, callbacks = {}) {
  const {
    framework,
    sectionId,
    sectionIndex,
    dependencies,
    projectData,
    deliverableData,
    clientData
  } = params;

  const {
    onProgress = () => {},
    onNarrative = () => {},
    onComplete = () => {},
    onError = () => {}
  } = callbacks;

  try {
    // Step 1: Start async execution
    console.log('🚀 Starting async section generation...');
    onNarrative('Starting section generation...', 'info');

    const payload = {
      agentId: getAgentIdForFramework(framework),
      message: JSON.stringify({
        framework,
        sectionId,
        sectionIndex,
        dependencies,
        project_context: projectData,
        deliverable_context: deliverableData,
        client_context: clientData,
        format: 'json',
        output_format: 'json'
      }),
      context: {
        requestType: 'generate_section',
        framework,
        sectionId,
        sectionIndex,
        projectId: projectData?.id || projectData?.projectId,
        source: 'cigno_section_generation'
      },
      data: {
        framework,
        sectionId,
        sectionIndex,
        dependencies,
        projectData,
        deliverableData,
        clientData
      }
    };

    const startResponse = await fetch('/api/ai/direct/async-execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!startResponse.ok) {
      const errorData = await startResponse.json();
      throw new Error(errorData.error || `Failed to start section generation: ${startResponse.status}`);
    }

    const startResult = await startResponse.json();
    const executionId = startResult.executionId;

    if (!executionId) {
      throw new Error('No execution ID returned from async start');
    }

    console.log(`✅ Section generation started with ID: ${executionId}`);
    onNarrative(`Execution started with ID: ${executionId}`, 'info');

    // Step 2: Poll for completion
    return await pollForSectionCompletion(executionId, {
      onProgress,
      onNarrative,
      onComplete,
      onError
    });

  } catch (error) {
    console.error('❌ Section generation failed:', error);
    onError(error);
    throw error;
  }
}

/**
 * Poll for section completion
 */
async function pollForSectionCompletion(executionId, callbacks) {
  const { onProgress, onNarrative, onComplete, onError } = callbacks;
  
  let pollCount = 0;
  const maxPolls = 120; // 10 minutes
  const seenNarratives = new Set();

  const poll = async () => {
    try {
      pollCount++;
      console.log(`📊 Polling ${pollCount}/${maxPolls} for execution ${executionId}`);

      const statusResponse = await fetch(`/api/ai/direct/status/${executionId}`);
      
      if (!statusResponse.ok) {
        throw new Error(`Status check failed: ${statusResponse.status}`);
      }

      const statusData = await statusResponse.json();
      const currentStatus = statusData.status;
      const currentProgress = statusData.progress || 0;
      const responseData = statusData.data;

      console.log(`📊 Status: ${currentStatus}, Progress: ${currentProgress}%`);
      onProgress(currentProgress);

      // Process narratives
      if (responseData?.narrative && Array.isArray(responseData.narrative)) {
        responseData.narrative.forEach(narrativeText => {
          if (!seenNarratives.has(narrativeText)) {
            seenNarratives.add(narrativeText);
            onNarrative(narrativeText, 'progress');
          }
        });
      }

      // Check for completion
      if (currentStatus === 'completed' || currentStatus === 'complete') {
        onNarrative('Section generation completed successfully', 'success');
        onComplete(responseData);
        return responseData;
      }

      // Check for failure
      if (currentStatus === 'failed' || currentStatus === 'error') {
        const errorMsg = responseData?.error || statusData.error || 'Section generation failed';
        onNarrative(`Generation failed: ${errorMsg}`, 'error');
        throw new Error(errorMsg);
      }

      // Continue polling
      if (pollCount >= maxPolls) {
        throw new Error('Section generation timeout after 10 minutes');
      }

      // Wait 5 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 5000));
      return poll();

    } catch (pollError) {
      console.error('❌ Polling error:', pollError);
      
      if (pollCount >= maxPolls) {
        onError(pollError);
        throw pollError;
      }
      
      // Retry on polling errors
      onNarrative(`Polling attempt ${pollCount} failed, retrying...`, 'warning');
      await new Promise(resolve => setTimeout(resolve, 5000));
      return poll();
    }
  };

  return poll();
}

/**
 * Get agent ID for framework
 */
function getAgentIdForFramework(framework) {
  // Map frameworks to specific agent IDs
  const frameworkAgentMap = {
    'taxonomy': process.env.AI_TAXONOMY_AGENT_ID || '68dddd9ac1b3b5cc990ad5f0',
    'market_sizing': process.env.AI_MARKET_SIZING_AGENT_ID || '68f3a191dfc921b68ec3e83a',
    'competitive_landscape': process.env.AI_COMPETITIVE_LANDSCAPE_AGENT_ID || process.env.AI_COMPETITIVE_AGENT_ID || '68f3a9a5dfc921b68ec3e959',
    'key_industry_trends': process.env.AI_KEY_INDUSTRY_TRENDS_AGENT_ID || '68f3f71fdfc921b68ec3ea8d',
    'capabilities_assessment': process.env.AI_CAPABILITIES_ASSESSMENT_AGENT_ID || process.env.AI_CAPABILITIES_AGENT_ID || '68f3f817dfc921b68ec3ea8e',
    'competitor_deep_dive': process.env.AI_COMPETITOR_DEEP_DIVE_AGENT_ID || '68f4a393dfc921b68ec3ec36',
    'strategic_options': process.env.AI_STRATEGIC_OPTIONS_AGENT_ID || '68f4a655dfc921b68ec3ec37',
    'deep_dive_strategic_option': process.env.AI_DEEP_DIVE_STRATEGIC_OPTION_AGENT_ID || '68f4a8dfdfc921b68ec3ec38',
    'buy_vs_build': process.env.AI_BUY_VS_BUILD_AGENT_ID || '68f4ae2fdfc921b68ec3ec39',
    'product_roadmap': process.env.AI_PRODUCT_ROADMAP_AGENT_ID || '68f4b112dfc921b68ec3ec3a',
    'capability_benchmark': process.env.AI_CAPABILITY_BENCHMARK_AGENT_ID || '68f22f36330210e8b8f60a51',
    'partnerships': process.env.AI_PARTNERSHIPS_AGENT_ID || '68f23be77e8d5848f9404847',
    'competition_analysis': process.env.AI_COMPETITION_ANALYSIS_AGENT_ID || '68f22dc0330210e8b8f60a43',
    'client_segments': process.env.AI_CLIENT_SEGMENTS_AGENT_ID || '68dddd9ac1b3b5cc990ad5f0',
    'product_landscape': process.env.AI_PRODUCT_LANDSCAPE_AGENT_ID || '68dddd9ac1b3b5cc990ad5f0',
    'gap_analysis': process.env.AI_GAP_ANALYSIS_AGENT_ID || '68f1825bd9092e63f8d3ee17',
    'industry_trends': process.env.AI_INDUSTRY_TRENDS_AGENT_ID || '68f17297d9092e63f8d3edf6',
    'financial_projections': process.env.AI_FINANCIAL_AGENT_ID || '68f4ae2fdfc921b68ec3ec39',
    'recommendations': process.env.AI_RECOMMENDATIONS_AGENT_ID || '68dddd9ac1b3b5cc990ad5f0'
  };

  return frameworkAgentMap[framework]
    || process.env.AI_SECTION_AGENT_ID
    || '68dddd9ac1b3b5cc990ad5f0';
}

/**
 * Legacy function wrapper for backward compatibility
 */
export async function generateSectionContent(framework, dependencies, sectionIndex, contextData, callbacks = {}) {
  const params = {
    framework,
    sectionId: sectionIndex !== undefined ? `framework-${sectionIndex + 1}` : 'taxonomy',
    sectionIndex,
    dependencies,
    projectData: {
      id: contextData.projectId,
      name: contextData.projectName || 'Project',
      client_name: contextData.clientName,
      industry: contextData.industry || 'financial-services',
      description: contextData.projectDescription
    },
    deliverableData: {
      id: contextData.deliverableId,
      project: contextData.projectId,
      project_id: contextData.projectId,
      name: contextData.deliverableName,
      brief: contextData.deliverableBrief
    },
    clientData: {
      name: contextData.clientName,
      industry: contextData.industry || 'financial-services',
      geography: contextData.geography
    }
  };

  return generateSectionWithPolling(params, callbacks);
}

export default {
  generateSectionWithPolling,
  generateSectionContent
};
