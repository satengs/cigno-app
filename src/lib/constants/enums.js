// Storyline section status enums and mappings
export const SECTION_STATUS = {
  NOT_STARTED: 'not_started',
  DRAFT: 'draft',
  IN_REVIEW: 'in_review',
  FINAL: 'final',
  LOCKED: 'locked'
};

// Mapping from various input formats to valid enum values
export const SECTION_STATUS_MAPPING = {
  // Standard lowercase values (direct mapping)
  'not_started': SECTION_STATUS.NOT_STARTED,
  'draft': SECTION_STATUS.DRAFT,
  'in_review': SECTION_STATUS.IN_REVIEW,
  'final': SECTION_STATUS.FINAL,
  'locked': SECTION_STATUS.LOCKED,
  
  // Capitalized versions (from AI agents)
  'Not Started': SECTION_STATUS.NOT_STARTED,
  'Draft': SECTION_STATUS.DRAFT,
  'In Review': SECTION_STATUS.IN_REVIEW,
  'Final': SECTION_STATUS.FINAL,
  'Locked': SECTION_STATUS.LOCKED,
  
  // All caps versions
  'NOT_STARTED': SECTION_STATUS.NOT_STARTED,
  'DRAFT': SECTION_STATUS.DRAFT,
  'IN_REVIEW': SECTION_STATUS.IN_REVIEW,
  'FINAL': SECTION_STATUS.FINAL,
  'LOCKED': SECTION_STATUS.LOCKED,
  
  // Alternative formats
  'not started': SECTION_STATUS.NOT_STARTED,
  'inreview': SECTION_STATUS.IN_REVIEW,
  'in-review': SECTION_STATUS.IN_REVIEW,
  'completed': SECTION_STATUS.FINAL,
  'done': SECTION_STATUS.FINAL,
  'finished': SECTION_STATUS.FINAL,
  'pending': SECTION_STATUS.NOT_STARTED,
  'todo': SECTION_STATUS.NOT_STARTED,
  'wip': SECTION_STATUS.DRAFT,
  'work in progress': SECTION_STATUS.DRAFT,
  'review': SECTION_STATUS.IN_REVIEW,
  'under review': SECTION_STATUS.IN_REVIEW
};

// Function to normalize status values
export function normalizeStatus(status, defaultStatus = SECTION_STATUS.DRAFT) {
  if (!status || typeof status !== 'string') {
    return defaultStatus;
  }
  
  // Try exact match first
  const normalized = SECTION_STATUS_MAPPING[status];
  if (normalized) {
    return normalized;
  }
  
  // Try case-insensitive match
  const lowerStatus = status.toLowerCase().trim();
  const normalizedLower = SECTION_STATUS_MAPPING[lowerStatus];
  if (normalizedLower) {
    return normalizedLower;
  }
  
  // Try removing special characters and spaces
  const cleanStatus = status.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normalizedClean = SECTION_STATUS_MAPPING[cleanStatus];
  if (normalizedClean) {
    return normalizedClean;
  }
  
  // Return default if no match found
  console.warn(`Unknown status value: "${status}", using default: "${defaultStatus}"`);
  return defaultStatus;
}

// Valid status values array (for validation)
export const VALID_SECTION_STATUSES = Object.values(SECTION_STATUS);

// Storyline overall status enums
export const STORYLINE_STATUS = {
  DRAFT: 'draft',
  IN_REVIEW: 'in_review',
  APPROVED: 'approved',
  FINAL: 'final'
};

// Storyline status mapping
export const STORYLINE_STATUS_MAPPING = {
  'draft': STORYLINE_STATUS.DRAFT,
  'Draft': STORYLINE_STATUS.DRAFT,
  'DRAFT': STORYLINE_STATUS.DRAFT,
  'in_review': STORYLINE_STATUS.IN_REVIEW,
  'In Review': STORYLINE_STATUS.IN_REVIEW,
  'IN_REVIEW': STORYLINE_STATUS.IN_REVIEW,
  'approved': STORYLINE_STATUS.APPROVED,
  'Approved': STORYLINE_STATUS.APPROVED,
  'APPROVED': STORYLINE_STATUS.APPROVED,
  'final': STORYLINE_STATUS.FINAL,
  'Final': STORYLINE_STATUS.FINAL,
  'FINAL': STORYLINE_STATUS.FINAL,
  'completed': STORYLINE_STATUS.FINAL,
  'done': STORYLINE_STATUS.FINAL,
  'finished': STORYLINE_STATUS.FINAL
};

// Function to normalize storyline status
export function normalizeStorylineStatus(status, defaultStatus = STORYLINE_STATUS.DRAFT) {
  if (!status || typeof status !== 'string') {
    return defaultStatus;
  }
  
  const normalized = STORYLINE_STATUS_MAPPING[status] || 
                    STORYLINE_STATUS_MAPPING[status.toLowerCase()];
  
  if (normalized) {
    return normalized;
  }
  
  console.warn(`Unknown storyline status: "${status}", using default: "${defaultStatus}"`);
  return defaultStatus;
}

export const VALID_STORYLINE_STATUSES = Object.values(STORYLINE_STATUS);

// Content block type enums
export const CONTENT_BLOCK_TYPES = {
  BCG_MATRIX: 'BCG Matrix',
  MECE_FRAMEWORK: 'MECE Framework',
  TIMELINE_LAYOUT: 'Timeline Layout',
  PROCESS_FLOW: 'Process Flow',
  MARKET_MAP: 'Market Map',
  KEY_INSIGHTS: 'Key Insights',
  CASE_STUDY: 'Case Study',
  DATA_VISUALIZATION: 'Data Visualization',
  CONTENT_BLOCK: 'Content Block'
};

export const VALID_CONTENT_BLOCK_TYPES = Object.values(CONTENT_BLOCK_TYPES);

// Presentation style enums
export const PRESENTATION_STYLES = {
  CONSULTING: 'consulting',
  ACADEMIC: 'academic',
  SALES: 'sales',
  TECHNICAL: 'technical',
  STRATEGIC: 'strategic'
};

export const VALID_PRESENTATION_STYLES = Object.values(PRESENTATION_STYLES);

// Complexity level enums
export const COMPLEXITY_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  EXPERT: 'expert'
};

export const VALID_COMPLEXITY_LEVELS = Object.values(COMPLEXITY_LEVELS);