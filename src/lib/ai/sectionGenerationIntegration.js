/**
 * Integration functions for section generation with polling in ContentPart.jsx
 * This file provides the updated functions to integrate with the existing ContentPart component
 */

import { generateSectionWithPolling } from './sectionGenerationService.js';

/**
 * Enhanced section generation with polling and narrative support
 * This replaces the generateSectionContent function in ContentPart.jsx
 */
export async function generateSectionContentWithPolling(
  framework, 
  dependencies, 
  sectionIndex, 
  contextData,
  updateSectionCallback
) {
  const sectionId = typeof sectionIndex === 'number' && sectionIndex >= 0 
    ? `framework-${sectionIndex + 1}` 
    : 'taxonomy';

  console.log(`🔧 ===== GENERATE-SECTION WITH POLLING =====`);
  console.log(`📋 Framework: ${framework}`);
  console.log(`📋 Section Index: ${sectionIndex}`);
  console.log(`📋 Section ID: ${sectionId}`);

  // Set initial loading state
  if (typeof sectionIndex === 'number' && updateSectionCallback) {
    updateSectionCallback(sectionIndex, {
      isLoading: true,
      generationStatus: 'starting',
      phaseName: 'Starting generation...',
      statusTimeline: [],
      narratives: []
    });
  }

  const params = {
    framework,
    sectionId,
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

  const callbacks = {
    onProgress: (progress) => {
      console.log(`📊 Section ${sectionId} progress: ${progress}%`);
      if (typeof sectionIndex === 'number' && updateSectionCallback) {
        updateSectionCallback(sectionIndex, {
          progress,
          generationStatus: 'in_progress',
          phaseName: `Generating content... (${progress}%)`
        });
      }
    },

    onNarrative: (message, type) => {
      console.log(`📖 Section ${sectionId} narrative [${type}]: ${message}`);
      if (typeof sectionIndex === 'number' && updateSectionCallback) {
        updateSectionCallback(sectionIndex, (prevSection) => {
          const newNarrative = {
            id: `narrative_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            message,
            timestamp: new Date().toISOString()
          };
          
          const updatedNarratives = [...(prevSection.narratives || []), newNarrative];
          
          return {
            ...prevSection,
            narratives: updatedNarratives,
            statusTimeline: [
              ...(prevSection.statusTimeline || []),
              {
                id: newNarrative.id,
                type,
                message,
                timestamp: newNarrative.timestamp
              }
            ]
          };
        });
      }
    },

    onComplete: (result) => {
      console.log(`✅ Section ${sectionId} completed:`, result);
      
      if (typeof sectionIndex === 'number' && updateSectionCallback) {
        // Process the result data
        const sectionData = processAsyncSectionResult(result, framework);
        
        updateSectionCallback(sectionIndex, {
          ...sectionData,
          isLoading: false,
          generationStatus: 'completed',
          phaseName: 'Generation completed',
          progress: 100
        });
      }
    },

    onError: (error) => {
      console.error(`❌ Section ${sectionId} failed:`, error);
      
      if (typeof sectionIndex === 'number' && updateSectionCallback) {
        updateSectionCallback(sectionIndex, {
          isLoading: false,
          generationStatus: 'failed',
          phaseName: 'Generation failed',
          error: error.message,
          statusTimeline: [
            {
              id: `error_${Date.now()}`,
              type: 'error',
              message: `Generation failed: ${error.message}`,
              timestamp: new Date().toISOString()
            }
          ]
        });
      }
    }
  };

  try {
    const result = await generateSectionWithPolling(params, callbacks);
    return processAsyncSectionResult(result, framework);
  } catch (error) {
    console.error(`❌ Section generation failed for ${framework}:`, error);
    throw error;
  }
}

/**
 * Enhanced regeneration function with polling
 */
export async function regenerateSectionWithPolling(
  section,
  dependencies,
  formData,
  selectedItem,
  updateSectionCallback
) {
  if (!section.framework) {
    throw new Error('No framework specified for regeneration');
  }

  console.log(`🔄 Regenerating section ${section.id} with polling...`);

  // Set loading state
  if (updateSectionCallback) {
    updateSectionCallback(section.id, {
      isLoading: true,
      generationStatus: 'starting',
      phaseName: 'Starting regeneration...',
      statusTimeline: [],
      narratives: []
    });
  }

  const params = {
    framework: section.framework,
    sectionId: section.id,
    sectionIndex: section.order - 1,
    dependencies,
    projectData: {
      name: selectedItem?.name || selectedItem?.title || 'Project',
      description: selectedItem?.description || '',
      industry: selectedItem?.industry || formData.industry
    },
    deliverableData: {
      brief: formData.brief,
      brief_quality: formData.brief_quality,
      title: formData.title,
      type: formData.type,
      industry: formData.industry,
      audience: formData.audience,
      objectives: formData.objectives
    },
    clientData: {
      name: selectedItem?.client_name || 'Client',
      industry: selectedItem?.client_industry || formData.industry
    }
  };

  const callbacks = {
    onProgress: (progress) => {
      console.log(`📊 Regeneration ${section.id} progress: ${progress}%`);
      if (updateSectionCallback) {
        updateSectionCallback(section.id, {
          progress,
          generationStatus: 'in_progress',
          phaseName: `Regenerating... (${progress}%)`
        });
      }
    },

    onNarrative: (message, type) => {
      console.log(`📖 Regeneration ${section.id} narrative [${type}]: ${message}`);
      if (updateSectionCallback) {
        updateSectionCallback(section.id, (prevSection) => {
          const newNarrative = {
            id: `regen_narrative_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            message,
            timestamp: new Date().toISOString()
          };
          
          return {
            ...prevSection,
            narratives: [...(prevSection.narratives || []), newNarrative],
            statusTimeline: [
              ...(prevSection.statusTimeline || []),
              {
                id: newNarrative.id,
                type,
                message,
                timestamp: newNarrative.timestamp
              }
            ]
          };
        });
      }
    },

    onComplete: (result) => {
      console.log(`✅ Regeneration ${section.id} completed:`, result);
      
      if (updateSectionCallback) {
        const sectionData = processAsyncSectionResult(result, section.framework);
        
        updateSectionCallback(section.id, {
          ...sectionData,
          framework: section.framework, // Preserve original framework
          isLoading: false,
          generationStatus: 'completed',
          phaseName: 'Regeneration completed',
          progress: 100,
          generatedAt: new Date().toISOString(),
          source: 'framework-agent-regenerated'
        });
      }
    },

    onError: (error) => {
      console.error(`❌ Regeneration ${section.id} failed:`, error);
      
      if (updateSectionCallback) {
        updateSectionCallback(section.id, {
          isLoading: false,
          generationStatus: 'failed',
          phaseName: 'Regeneration failed',
          error: error.message,
          statusTimeline: [
            {
              id: `regen_error_${Date.now()}`,
              type: 'error',
              message: `Regeneration failed: ${error.message}`,
              timestamp: new Date().toISOString()
            }
          ]
        });
      }
    }
  };

  try {
    const result = await generateSectionWithPolling(params, callbacks);
    return processAsyncSectionResult(result, section.framework);
  } catch (error) {
    console.error(`❌ Section regeneration failed:`, error);
    throw error;
  }
}

/**
 * Process async section result to match expected format
 */
function processAsyncSectionResult(result, framework) {
  if (!result) {
    throw new Error('No result data received');
  }

  // Extract data from the nested response structure
  const sectionData = result.result || result.data || result;
  
  console.log('🔍 Processing async section result:', sectionData);

  // Map the async response to the expected section format
  return {
    framework,
    slideContent: sectionData.slide_content || sectionData.slideContent || {},
    insights: sectionData.insights || [],
    citations: sectionData.citations || [],
    keyPoints: sectionData.key_points || sectionData.keyPoints || [],
    charts: sectionData.charts || [],
    title: sectionData.title || `${framework} Analysis`,
    description: sectionData.description || '',
    generatedAt: new Date().toISOString(),
    source: 'async-framework-agent',
    executionTime: sectionData.executionTime || result.duration,
    usage: sectionData.usage || {}
  };
}

export default {
  generateSectionContentWithPolling,
  regenerateSectionWithPolling
};