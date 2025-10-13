/**
 * Storyline Regeneration Utilities
 * Handles regeneration of storylines while preserving locked sections
 */

/**
 * Filters storyline sections into locked and draft categories
 * @param {Object} storyline - The storyline object
 * @returns {Object} - { lockedSections, draftSections }
 */
export const filterSectionsForRegeneration = (storyline) => {
  if (!storyline?.sections) {
    return { lockedSections: [], draftSections: [] };
  }

  const lockedSections = storyline.sections.filter(section => 
    section.locked === true || section.status === 'final'
  );
  
  const draftSections = storyline.sections.filter(section => 
    section.locked !== true && section.status !== 'final'
  );
  
  return { lockedSections, draftSections };
};

/**
 * Estimates document length based on storyline sections
 * @param {Object} storyline - The storyline object
 * @returns {number} - Estimated page count
 */
const estimateDocumentLength = (storyline) => {
  if (!storyline?.sections) return 10;
  
  const sectionCount = storyline.sections.length;
  const keyPointsCount = storyline.sections.reduce((acc, section) => 
    acc + (section.keyPoints?.length || 0), 0
  );
  
  // Estimate: 1-2 pages per section + 1 page per 3 key points
  return Math.max(sectionCount * 1.5 + Math.ceil(keyPointsCount / 3), 5);
};

/**
 * Increments version string (e.g., "1.0" -> "1.1", "2.9" -> "3.0")
 * @param {string} version - Current version string
 * @returns {string} - Incremented version
 */
const incrementVersion = (version = "1.0") => {
  const [major, minor] = version.split('.').map(Number);
  const newMinor = minor + 1;
  
  if (newMinor >= 10) {
    return `${major + 1}.0`;
  }
  
  return `${major}.${newMinor}`;
};

/**
 * Creates AI payload for regeneration, excluding locked sections
 * @param {Object} storyline - The original storyline
 * @param {Array} draftSections - Sections to be regenerated
 * @param {Array} lockedSections - Sections to preserve
 * @returns {Object} - Payload for AI regeneration
 */
export const createRegenerationPayload = (storyline, draftSections, lockedSections) => {
  return {
    deliverableData: {
      name: storyline.title || 'Untitled Storyline',
      type: storyline.topic || 'Strategic Analysis',
      audience: storyline.audience || [],
      brief: storyline.objectives || 'Strategic storyline regeneration',
      format: storyline.presentationStyle || 'consulting',
      documentLength: estimateDocumentLength(storyline)
    },
    existingLockedSections: lockedSections.map(section => ({
      id: section.id,
      title: section.title,
      order: section.order,
      keyPoints: section.keyPoints?.slice(0, 2) || [], // Only share first 2 key points for context
      status: section.status
    })),
    sectionsToRegenerate: draftSections.map(section => ({
      id: section.id,
      title: section.title,
      description: section.description,
      status: section.status,
      order: section.order,
      keyPoints: section.keyPoints || []
    })),
    regenerationContext: {
      preserveFlow: true,
      maintainOrder: true,
      totalSectionCount: storyline.sections?.length || 0,
      lockedSectionCount: lockedSections.length,
      draftSectionCount: draftSections.length,
      originalExecutiveSummary: storyline.executiveSummary,
      originalCallToAction: storyline.callToAction
    },
    regenerationType: 'partial', // Indicates this is a partial regeneration
    preserveLocked: true
  };
};

/**
 * Merges AI-generated content with preserved locked sections
 * @param {Object} originalStoryline - The original storyline
 * @param {Object} aiResponse - AI-generated storyline response
 * @param {Array} lockedSections - Sections to preserve unchanged
 * @returns {Object} - Merged storyline
 */
export const mergeRegeneratedStoryline = (originalStoryline, aiResponse, lockedSections) => {
  const newSections = aiResponse.sections || [];
  
  // Create a map of locked sections by order
  const lockedSectionsByOrder = {};
  lockedSections.forEach(section => {
    lockedSectionsByOrder[section.order] = section;
  });
  
  // Create a map of new sections by order for easy lookup
  const newSectionsByOrder = {};
  newSections.forEach(section => {
    newSectionsByOrder[section.order] = section;
  });
  
  // Merge sections maintaining original order
  const mergedSections = [];
  const originalSections = originalStoryline.sections || [];
  const maxOrder = Math.max(...originalSections.map(s => s.order || 0), 0);
  
  for (let i = 0; i <= maxOrder; i++) {
    if (lockedSectionsByOrder[i]) {
      // Keep locked section exactly as is
      mergedSections.push({
        ...lockedSectionsByOrder[i],
        // Ensure these properties are preserved
        locked: true,
        status: lockedSectionsByOrder[i].status || 'final'
      });
    } else if (newSectionsByOrder[i]) {
      // Use new AI-generated section for this position
      mergedSections.push({
        ...newSectionsByOrder[i],
        order: i,
        locked: false,
        status: 'draft',
        id: newSectionsByOrder[i].id || `section_${i}`,
        created_at: new Date(),
        updated_at: new Date()
      });
    } else {
      // Find next available new section or create placeholder
      const availableNewSection = newSections.find(s => 
        !mergedSections.some(merged => merged.id === s.id)
      );
      
      if (availableNewSection) {
        mergedSections.push({
          ...availableNewSection,
          order: i,
          locked: false,
          status: 'draft',
          id: availableNewSection.id || `section_${i}`,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    }
  }
  
  // Add any remaining new sections that couldn't be mapped to existing orders
  const unmappedSections = newSections.filter(newSection => 
    !mergedSections.some(merged => merged.id === newSection.id)
  );
  
  unmappedSections.forEach((section, index) => {
    mergedSections.push({
      ...section,
      order: maxOrder + 1 + index,
      locked: false,
      status: 'draft',
      id: section.id || `section_${maxOrder + 1 + index}`,
      created_at: new Date(),
      updated_at: new Date()
    });
  });
  
  // Update storyline metadata while preserving locked sections
  return {
    ...originalStoryline,
    sections: mergedSections,
    executiveSummary: aiResponse.executiveSummary || originalStoryline.executiveSummary,
    callToAction: aiResponse.callToAction || originalStoryline.callToAction,
    presentationFlow: aiResponse.presentationFlow || originalStoryline.presentationFlow,
    updated_at: new Date(),
    updated_by: originalStoryline.updated_by,
    version: incrementVersion(originalStoryline.version),
    lastRegeneration: {
      timestamp: new Date(),
      sectionsRegenerated: mergedSections.filter(s => !s.locked).length,
      sectionsPreserved: lockedSections.length,
      regenerationType: 'partial'
    }
  };
};

/**
 * Validates that a regeneration request is safe to execute
 * @param {Object} storyline - The storyline to regenerate
 * @returns {Object} - { isValid, errors, warnings, stats }
 */
export const validateRegenerationRequest = (storyline) => {
  const errors = [];
  const warnings = [];
  
  if (!storyline) {
    errors.push('No storyline provided');
    return { isValid: false, errors, warnings, stats: null };
  }
  
  if (!storyline.sections || storyline.sections.length === 0) {
    errors.push('Storyline has no sections to regenerate');
    return { isValid: false, errors, warnings, stats: null };
  }
  
  const { lockedSections, draftSections } = filterSectionsForRegeneration(storyline);
  
  if (draftSections.length === 0) {
    warnings.push('All sections are locked - no sections will be regenerated');
  }
  
  if (lockedSections.length === storyline.sections.length) {
    warnings.push('All sections are locked - regeneration will have no effect');
  }
  
  const stats = {
    totalSections: storyline.sections.length,
    lockedSections: lockedSections.length,
    draftSections: draftSections.length,
    lockedPercentage: Math.round((lockedSections.length / storyline.sections.length) * 100)
  };
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats
  };
};

/**
 * Creates a backup of the original storyline before regeneration
 * @param {Object} storyline - The storyline to backup
 * @returns {Object} - Backup object with timestamp
 */
export const createStorylineBackup = (storyline) => {
  return {
    originalStoryline: JSON.parse(JSON.stringify(storyline)), // Deep clone
    backupTimestamp: new Date().toISOString(),
    backupReason: 'pre-regeneration'
  };
};

// Hook functionality moved to ContentPart.jsx to handle client-side React hooks