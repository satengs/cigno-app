'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Settings,
  Trash2,
  Plus,
  X
} from 'lucide-react';
import ClientDetailView from '../ui/ClientDetailView';
import ImproveBriefModal from '../ui/ImproveBriefModal';
import { UnifiedAddModal } from '../ui';
import { getIdString, isValidObjectId } from '../../lib/utils/idUtils';
import { normalizeStatus } from '../../lib/constants/enums';
import { normalizeScoreValue } from '../../utils/scoreUtils';
import DeliverableStorylineView from './deliverable/DeliverableStorylineView';
import DeliverableLayoutView from './deliverable/DeliverableLayoutView';
import DeliverableDetailsView from './deliverable/DeliverableDetailsView';
import {
  filterSectionsForRegeneration,
  createRegenerationPayload,
  createStorylineBackup
} from '../../lib/storyline/regenerationUtils';
import { parseMarkdownWithCharts, deriveSectionMetadata } from '../../lib/markdown/markdownParser';

const DELIVERABLE_TYPES = [
  'Recommendation',
  'Workshop Document',
  'Presentation',
  'Report',
  'Strategy',
  'Analysis',
  'Design',
  'Code',
  'Documentation',
  'Dashboard',
  'API',
  'Brief',
  'Storyline',
  'Other'
];

const ALL_LAYOUT_IDS = ['full-width', 'title-2-columns', 'bcg-matrix', 'three-columns', 'timeline', 'process-flow'];

// Framework dependencies mapping - from your provided structure
// Note: brief_scorer is not part of pipeline, it's just deliverable data
const TAXONOMY_DEPENDENT_FRAMEWORKS = new Set(['market_sizing', 'competitive_landscape', 'capabilities_assessment']);

const FRAMEWORK_DEPENDENCIES = {
  // Map framework IDs to their dependencies (excluding brief_scorer as it's deliverable data)
  'market_sizing': [],
  'competitive_landscape': ['market_sizing'],
  'key_industry_trends': [],
  'capabilities_assessment': ['market_sizing', 'competitive_landscape'],
  'competitor_deep_dive': ['capabilities_assessment', 'competitive_landscape'],
  'strategic_options': ['key_industry_trends', 'capabilities_assessment'],
  'deep_dive_strategic_option': ['strategic_options'],
  'buy_vs_build': ['deep_dive_strategic_option'],
  'product_roadmap': ['buy_vs_build']
};

// Framework to Agent ID mapping (mirrors synchronous orchestrator defaults)
const FRAMEWORK_AGENT_MAPPING = {
  taxonomy: process.env.TAXONOMY_AGENT_ID || '68dddd9ac1b3b5cc990ad5f0',
  'market_sizing': process.env.AI_MARKET_SIZING_AGENT_ID || '68f3a191dfc921b68ec3e83a',
  'competitive_landscape': process.env.AI_COMPETITIVE_LANDSCAPE_AGENT_ID || '68f3a9a5dfc921b68ec3e959',
  'key_industry_trends': process.env.AI_KEY_INDUSTRY_TRENDS_AGENT_ID || '68f3f71fdfc921b68ec3ea8d',
  'capabilities_assessment': process.env.AI_CAPABILITIES_ASSESSMENT_AGENT_ID || '68f3f817dfc921b68ec3ea8e',
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
  'recommendations': process.env.AI_RECOMMENDATIONS_AGENT_ID || '68dddd9ac1b3b5cc990ad5f0'
};

// Helper function to build proper orchestrator payload like generate-section endpoint
const buildOrchestratorPayload = (framework, dependencies, projectData, deliverableData, clientData, briefContent) => {
  const baseContext = {
    project: {
      name: projectData?.name || deliverableData?.name || 'Strategic Analysis',
      client_name: clientData?.name || projectData?.client_name || 'Client',
      id: projectData?.id || 'project-1',
      geography: clientData?.geography || 'Switzerland'
    },
    deliverable: {
      brief: briefContent || deliverableData?.brief || 'Strategic analysis and recommendations',
      brief_quality: deliverableData?.brief_quality || null,
      brief_strengths: deliverableData?.brief_strengths || [],
      brief_improvements: deliverableData?.brief_improvements || [],
      type: deliverableData?.type || 'Strategy Presentation',
      audience: deliverableData?.audience || ['Business Stakeholders'],
      title: deliverableData?.title || deliverableData?.name || 'Strategic Analysis',
      industry: deliverableData?.industry || []
    },
    client: {
      name: clientData?.name,
      geography: clientData?.geography,
      industry: clientData?.industry
    }
  };

  const payloadData = {
    project_context: baseContext.project,
    deliverable_context: baseContext.deliverable,
    client_context: baseContext.client,
    dependencies: dependencies,
    framework,
    format: 'json',
    output_format: 'json'
  };

  return {
    message: JSON.stringify(payloadData),
    context: {
      requestType: 'generate_storyline_section',
      framework,
      dependencyCount: dependencies ? Object.keys(dependencies).length : 0,
      timestamp: new Date().toISOString()
    },
    data: {
      framework,
      dependencies,
      projectData: baseContext.project,
      deliverableData: baseContext.deliverable,
      clientData: baseContext.client
    }
  };
};

const normalizeStatusTimeline = (timeline) => {
  if (!Array.isArray(timeline)) return [];

  return timeline
    .map((entry, index) => {
      if (!entry) return null;

      if (typeof entry === 'string') {
        return {
          id: `timeline-${index}`,
          message: entry,
          type: 'info',
          timestamp: new Date().toISOString()
        };
      }

      if (typeof entry === 'object') {
        const message = typeof entry.message === 'string' && entry.message.trim().length > 0
          ? entry.message.trim()
          : typeof entry.text === 'string' && entry.text.trim().length > 0
            ? entry.text.trim()
            : typeof entry.description === 'string' && entry.description.trim().length > 0
              ? entry.description.trim()
              : null;

        if (!message) return null;

        const typeCandidate = typeof entry.type === 'string' ? entry.type : typeof entry.status === 'string' ? entry.status : 'info';
        const type = typeCandidate.toLowerCase();

        const timestampSource = entry.timestamp || entry.time || entry.updated_at || entry.updatedAt || entry.created_at || entry.createdAt;
        const timestampDate = timestampSource ? new Date(timestampSource) : new Date();
        const timestamp = Number.isNaN(timestampDate.valueOf()) ? new Date().toISOString() : timestampDate.toISOString();

        return {
          id: entry.id || `timeline-${index}`,
          message,
          type,
          timestamp
        };
      }

      return null;
    })
    .filter(Boolean);
};

const extractStatusTimeline = (resultPayload, fallbackTimeline = []) => {
  if (!resultPayload || typeof resultPayload !== 'object') {
    return normalizeStatusTimeline(fallbackTimeline);
  }

  const candidates = [];

  if (Array.isArray(resultPayload.narratives)) {
    candidates.push(resultPayload.narratives);
  }

  if (Array.isArray(resultPayload.statusTimeline)) {
    candidates.push(resultPayload.statusTimeline);
  }

  if (resultPayload.data && Array.isArray(resultPayload.data.statusTimeline)) {
    candidates.push(resultPayload.data.statusTimeline);
  }

  const firstPopulated = candidates.find((item) => Array.isArray(item) && item.length > 0);
  if (firstPopulated) {
    return normalizeStatusTimeline(firstPopulated);
  }

  if (Array.isArray(fallbackTimeline) && fallbackTimeline.length > 0) {
    return normalizeStatusTimeline(fallbackTimeline);
  }

  return [];
};

const parseJsonSafely = (value, contextLabel = 'dependency') => {
  if (typeof value !== 'string') return null;
  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn(`⚠️ Failed to parse JSON for ${contextLabel}:`, error?.message);
    return null;
  }
};

const extractDependencyPayload = (depSection, depFramework) => {
  if (!depSection) return null;

  const attemptParse = (candidate, label) => {
    if (!candidate) return null;
    if (typeof candidate === 'string') {
      return parseJsonSafely(candidate, label) || candidate;
    }
    return candidate;
  };

  const tryFrameworkLookup = (candidate) => {
    if (!candidate || typeof candidate !== 'object') return null;
    if (candidate[depFramework]) {
      return attemptParse(candidate[depFramework], `${depFramework}-subkey`) || candidate[depFramework];
    }
    return null;
  };

  const rawResponse = depSection.rawResponse;
  const rawAgentResponse = depSection.rawAgentResponse;

  const parsedRawResponse = attemptParse(rawResponse, `${depFramework}-raw`);
  const fromRawResponse = tryFrameworkLookup(parsedRawResponse);
  if (fromRawResponse) return fromRawResponse;
  if (parsedRawResponse && typeof parsedRawResponse !== 'string') return parsedRawResponse;

  const responsePayload = rawAgentResponse?.response;
  const parsedResponsePayload = attemptParse(responsePayload, `${depFramework}-response`);
  const fromResponsePayload = tryFrameworkLookup(parsedResponsePayload);
  if (fromResponsePayload) return fromResponsePayload;
  if (parsedResponsePayload && typeof parsedResponsePayload !== 'string') return parsedResponsePayload;
  if (responsePayload) return responsePayload;

  const parsedRawAgent = attemptParse(rawAgentResponse, `${depFramework}-agent`);
  const fromRawAgent = tryFrameworkLookup(parsedRawAgent);
  if (fromRawAgent) return fromRawAgent;
  if (parsedRawAgent && typeof parsedRawAgent !== 'string') return parsedRawAgent;
  if (rawAgentResponse) return rawAgentResponse;

  if (depSection.sectionContent?.slideContent) {
    return depSection.sectionContent.slideContent;
  }
  if (depSection.slide_content) {
    return depSection.slide_content;
  }
  if (depSection.slideContent) {
    return depSection.slideContent;
  }

  return null;
};

// Function to build dependency data for AI agent calls
const buildDependencyData = (currentFramework, storylineSections) => {
  if (!currentFramework || !storylineSections) {
    console.log(`❌ buildDependencyData: Missing currentFramework (${currentFramework}) or storylineSections (${storylineSections})`);
    return {};
  }

  const dependencies = {};
  const frameworkDeps = FRAMEWORK_DEPENDENCIES[currentFramework] || [];
  
  console.log(`🔗 Building dependencies for ${currentFramework}:`, frameworkDeps);
  console.log(`📊 Available storyline sections:`, storylineSections.map(s => ({ framework: s.framework, status: s.status, hasContent: !!s.sectionContent })));
  
  frameworkDeps.forEach(depFramework => {
    const depSection = storylineSections.find(s => s.framework === depFramework);
    if (depSection) {
      console.log(`🔍 Found dependency section for ${depFramework}:`, {
        title: depSection.title,
        status: depSection.status,
        hasSectionContent: !!depSection.sectionContent,
        hasSlideContent: !!(depSection.sectionContent?.slideContent || depSection.slideContent),
        insightsCount: (depSection.insights || []).length,
        chartsCount: (depSection.charts || []).length
      });
      
      const dependencyPayload = extractDependencyPayload(depSection, depFramework);

      if (dependencyPayload) {
        dependencies[depFramework] = dependencyPayload;
        console.log(`✅ Added dependency payload for ${depFramework}:`, dependencyPayload);
      } else {
        console.warn(`⚠️ No dependency payload derived for ${depFramework}, defaulting to slide content.`);
        dependencies[depFramework] = depSection.sectionContent?.slideContent || depSection.slideContent || depSection;
      }
    } else {
      console.warn(`⚠️ Missing dependency: ${depFramework} not found in storyline sections`);
    }
  });
  
  console.log(`🔗 Total dependencies built for ${currentFramework}:`, Object.keys(dependencies));
  
  // Debug: Show dependency chain completeness
  if (frameworkDeps.length > 0) {
    const foundDeps = Object.keys(dependencies);
    const missingDeps = frameworkDeps.filter(dep => !foundDeps.includes(dep));
    if (missingDeps.length > 0) {
      console.warn(`⚠️ Missing dependencies for ${currentFramework}:`, missingDeps);
    } else {
      console.log(`✅ All dependencies found for ${currentFramework}`);
    }
  }
  
  return dependencies;
};

const EMPTY_PROJECT_CONTEXT = {
  id: null,
  name: '',
  client_name: '',
  industry: '',
  geography: '',
  status: '',
  objectives: '',
  scope: '',
  description: '',
  summary: ''
};

const normalizeInsightList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .flatMap(item => normalizeInsightList(item))
      .map(item => (typeof item === 'string' ? item.trim() : String(item).trim()))
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(/[\n\r•\-;]+/)
      .map(item => item.replace(/^[-•\d.\s]+/, '').trim())
      .filter(Boolean);
  }
  if (typeof value === 'object') {
    return Object.values(value)
      .flatMap(item => normalizeInsightList(item))
      .filter(Boolean);
  }
  return [String(value).trim()].filter(Boolean);
};

const collectCandidateNodes = (payload) => {
  const nodes = [];
  const visited = new Set();

  const addNode = (node) => {
    if (!node || typeof node !== 'object') return;
    if (visited.has(node)) return;
    visited.add(node);
    nodes.push(node);
  };

  addNode(payload);
  addNode(payload?.data);
  addNode(payload?.response);
  addNode(payload?.result);
  addNode(payload?.results);
  addNode(payload?.analysis);
  addNode(payload?.analytics);
  addNode(payload?.metrics);
  addNode(payload?.scoring);
  addNode(payload?.scoring?.data);
  addNode(payload?.quality);
  addNode(payload?.briefQuality);
  addNode(payload?.evaluation);
  addNode(payload?.summary);

  if (Array.isArray(payload?.sections)) {
    payload.sections.forEach(addNode);
  }

  if (Array.isArray(payload?.insights)) {
    payload.insights.forEach(addNode);
  }

  return nodes;
};

const extractListFromNodes = (nodes, keys) => {
  for (const node of nodes) {
    if (!node || typeof node !== 'object') continue;
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(node, key)) {
        const normalized = normalizeInsightList(node[key]);
        if (normalized.length) {
          return normalized;
        }
      }
    }
  }
  return [];
};

const extractNumberFromNodes = (nodes, keys) => {
  for (const node of nodes) {
    if (!node || typeof node !== 'object') continue;
    for (const key of keys) {
      if (!Object.prototype.hasOwnProperty.call(node, key)) continue;
      const rawValue = node[key];
      if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
        return rawValue;
      }
      const numericValue = Number(rawValue);
      if (Number.isFinite(numericValue)) {
        return numericValue;
      }
      if (rawValue && typeof rawValue === 'object') {
        if (Number.isFinite(Number(rawValue.value))) {
          return Number(rawValue.value);
        }
        if (Number.isFinite(Number(rawValue.score))) {
          return Number(rawValue.score);
        }
      }
    }
  }
  return null;
};

const normalizeStringList = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .flatMap(item => normalizeStringList(item))
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/[\n\r,;•\-]+/)
      .map(item => item.replace(/^[-•\d.\s]+/, '').trim())
      .filter(Boolean);
  }

  if (typeof value === 'object') {
    return Object.values(value)
      .flatMap(item => normalizeStringList(item))
      .filter(Boolean);
  }

  return [String(value).trim()].filter(Boolean);
};

const cloneToPlainObject = (value, fallback = null) => {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value === 'object') {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (error) {
      return fallback;
    }
  }

  return value;
};


export default function ContentPart({
  selectedItem,
  onItemSelect,
  onItemDeleted,
  onDeliverableNavigate,
  refreshFromDatabase,
  onViewChange,
  selectedLayout,
  onStorylineChange,
  onLayoutChange,
  onLayoutOptionsChange,
  onLayoutAISuggestionChange
}) {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const styleId = 'content-part-cursor-style';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.textContent = '.content-part button:not(:disabled){cursor:pointer;}';
      document.head.appendChild(styleEl);
    }
  }, []);
  const [formData, setFormData] = useState({
    name: '',
    audience: [],
    type: 'Strategy Presentation',
    due_date: '',
    brief: '',
    brief_quality: null,
    brief_strengths: [],
    brief_improvements: []
  });

  // Ref to track when we've just saved to prevent useEffect from overwriting formData
  const justSavedRef = useRef(false);

  const [newAudience, setNewAudience] = useState('');
  const [showImproveBrief, setShowImproveBrief] = useState(false);
  const [isSavingDeliverable, setIsSavingDeliverable] = useState(false);
  const [currentView, setCurrentView] = useState('detailed'); // 'detailed' | 'storyline' | 'layout'
  const [generatedStoryline, setGeneratedStoryline] = useState(null);
  // Add state for actual fetched data
  const [actualClientData, setActualClientData] = useState(null);
  const [actualProjectData, setActualProjectData] = useState(null);
  const [isLoadingActualData, setIsLoadingActualData] = useState(false);
  
  // Debug: Log generatedStoryline changes
  useEffect(() => {
    console.log('🔍 ContentPart - generatedStoryline changed:', generatedStoryline);
    if (generatedStoryline?.sections) {
      console.log('🔍 ContentPart - sections count:', generatedStoryline.sections.length);
      console.log('🔍 ContentPart - sections:', generatedStoryline.sections.map(s => ({
        id: s.id,
        title: s.title,
        framework: s.framework,
        isLoading: s.isLoading
      })));
    }
  }, [generatedStoryline]);

  // Auto-switch to detailed view when storyline is cleared
  useEffect(() => {
    if (!generatedStoryline && (currentView === 'storyline' || currentView === 'layout')) {
      setCurrentView('detailed');
    }
  }, [generatedStoryline, currentView]);

  const safeOnLayoutChange = useMemo(() => onLayoutChange || (() => {}), [onLayoutChange]);
  const safeOnLayoutOptionsChange = useMemo(() => onLayoutOptionsChange || (() => {}), [onLayoutOptionsChange]);

  useEffect(() => {
    if (currentView !== 'layout') {
      safeOnLayoutOptionsChange(ALL_LAYOUT_IDS);
      if (typeof onLayoutAISuggestionChange === 'function') {
        onLayoutAISuggestionChange(null, null);
      }
    }
  }, [currentView, safeOnLayoutOptionsChange, onLayoutAISuggestionChange]);

  const handleAISuggestionChange = useCallback((suggestion, handler) => {
    if (typeof onLayoutAISuggestionChange === 'function') {
      onLayoutAISuggestionChange(suggestion, handler);
    }
  }, [onLayoutAISuggestionChange]);

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isGeneratingStoryline, setIsGeneratingStoryline] = useState(false);
  const [isSavingStoryline, setIsSavingStoryline] = useState(false);
  const [storylineDirty, setStorylineDirty] = useState(false);
  const [isGeneratingSlides, setIsGeneratingSlides] = useState(false);
  const [slideGenerationProgress, setSlideGenerationProgress] = useState({ completed: 0, total: 0 });
  const taxonomyDataRef = useRef(null);

  useEffect(() => {
    if (generatedStoryline?.taxonomy) {
      taxonomyDataRef.current = generatedStoryline.taxonomy;
    }
  }, [generatedStoryline?.taxonomy]);


  // Helper function to generate individual section content with async polling
  const generateSectionContent = async (framework, dependencies, sectionIndex, contextData) => {
    const shouldUpdateStoryline = typeof sectionIndex === 'number' && sectionIndex >= 0;
    console.log(`🚀 ===== ASYNC SECTION GENERATION STARTED =====`);
    console.log(`📋 Framework: ${framework}`);
    console.log(`📋 Dependencies (provided):`, Object.keys(dependencies));
    console.log(`📋 Section Index: ${sectionIndex}`);
    console.log(`📋 Context Data:`, contextData);

    const computedDependencies = buildDependencyData(framework, generatedStoryline?.sections || []);
    const dependencyPayload = {
      ...computedDependencies,
      ...dependencies,
    };

    if (framework !== 'taxonomy' && taxonomyDataRef.current && TAXONOMY_DEPENDENT_FRAMEWORKS.has(framework) && !dependencyPayload.taxonomy) {
      dependencyPayload.taxonomy = taxonomyDataRef.current;
    }

    console.log(`🔗 Merged dependencies for ${framework}:`, Object.keys(dependencyPayload));

    if (shouldUpdateStoryline) {
      setGeneratedStoryline(prev => {
        if (!prev) return null;
        const updatedSections = [...prev.sections];
        if (updatedSections[sectionIndex]) {
          updatedSections[sectionIndex] = {
            ...updatedSections[sectionIndex],
            isLoading: true,
            generationStatus: 'starting',
            phaseName: 'Starting async generation...',
            progress: 0,
            narratives: [],
            statusTimeline: [{
              id: `start_${Date.now()}`,
              type: 'info',
              message: 'Starting async section generation...',
              timestamp: new Date().toISOString()
            }]
          };
        }
        return { ...prev, sections: updatedSections };
      });
    }

    try {
      // Get framework-specific agent ID
      const agentId = FRAMEWORK_AGENT_MAPPING[framework];
      if (!agentId) {
        throw new Error(`No agent configured for framework: ${framework}`);
      }

      // Build proper orchestrator payload
      const projectData = {
        id: contextData.projectId,
        name: contextData.projectName || 'UBS Pension Strategy',
        client_name: contextData.clientName || 'UBS',
        industry: contextData.industry || 'financial-services',
        description: contextData.projectDescription || 'Strategic analysis for UBS pension strategy'
      };

      const deliverableData = {
        id: contextData.deliverableId,
        project: contextData.projectId,
        project_id: contextData.projectId,
        name: contextData.deliverableName || 'UBS Pension Strategy',
        brief: contextData.deliverableBrief || 'Strategic analysis and recommendations',
        type: 'Strategy Presentation',
        audience: ['Business Stakeholders'],
        title: contextData.deliverableName || 'Strategic Analysis',
        industry: contextData.industry ? [contextData.industry] : []
      };

      const clientData = {
        name: contextData.clientName || 'UBS',
        industry: contextData.industry || 'financial-services',
        geography: contextData.geography || 'Switzerland'
      };

      const orchestratorPayload = buildOrchestratorPayload(
        framework, 
        dependencyPayload, 
        projectData, 
        deliverableData, 
        clientData, 
        contextData.deliverableBrief || 'Strategic analysis and recommendations'
      );

      console.log(`🤖 Using agent ID for ${framework}:`, agentId);
      console.log(`📋 Orchestrator payload:`, JSON.stringify(orchestratorPayload, null, 2));

      // Step 1: Start async execution
      const asyncResponse = await fetch('/api/ai/direct/async-execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: agentId,
          ...orchestratorPayload
        })
      });

      if (!asyncResponse.ok) {
        const errorData = await asyncResponse.json();
        throw new Error(errorData.error || `Failed to start async generation for ${framework} section`);
      }

      const asyncResult = await asyncResponse.json();
      const executionId = asyncResult.executionId;
      
      if (!executionId) {
        throw new Error('No execution ID returned from async start');
      }

      console.log(`🔍 Starting polling for execution: ${executionId}`);

      // Update section with execution ID and polling status
      if (shouldUpdateStoryline) {
        setGeneratedStoryline(prev => {
          if (!prev) return null;
          const updatedSections = [...prev.sections];
          if (updatedSections[sectionIndex]) {
            updatedSections[sectionIndex] = {
              ...updatedSections[sectionIndex],
              generationStatus: 'in_progress',
              phaseName: 'Polling for progress...',
              executionId,
              progress: 0,
              narratives: [],
             statusTimeline: [...(updatedSections[sectionIndex].statusTimeline || []), {
               id: `polling_${Date.now()}`,
               type: 'info',
               message: `Started polling execution ${executionId}`,
               timestamp: new Date().toISOString()
             }]
            };
          }
          return { ...prev, sections: updatedSections };
        });
      }

      // Step 2: Poll for completion with live updates
      const pollForCompletion = async () => {
        let attempts = 0;
        const maxAttempts = 60; // 5 minutes max
        let delay = 3000; // Start with 3 seconds
        const maxDelay = 10000; // Max 10 seconds

        while (attempts < maxAttempts) {
          try {
            const statusResponse = await fetch(`/api/ai/direct/status/${executionId}`);
            
            if (!statusResponse.ok) {
              throw new Error(`Status check failed: ${statusResponse.status}`);
            }

            const statusData = await statusResponse.json();
            const status = statusData.status;
            const progress = statusData.progress || 0;
            const narratives = statusData.data?.narrative || [];
            const uniqueNarratives = [];
            const seenNarratives = new Set();

            narratives.forEach(rawMessage => {
              const message = typeof rawMessage === 'string' ? rawMessage : rawMessage?.message;
              if (!message) return;
              if (message.includes('Calling Openai (openai/gpt-4.1) - Iteration')) return;
              if (seenNarratives.has(message)) return;
              seenNarratives.add(message);
              uniqueNarratives.push(message);
            });

            console.log(`📊 Poll ${attempts + 1}: ${status} (${progress}%)`);
            console.log(`📖 Narratives:`, uniqueNarratives);

            // Update section with live progress and narratives
            if (shouldUpdateStoryline) {
              setGeneratedStoryline(prev => {
                if (!prev) return null;
                const updatedSections = [...prev.sections];
                if (updatedSections[sectionIndex]) {
                  // Filter out repetitive AI iteration messages, keep only meaningful progress
                  const currentNarratives = uniqueNarratives.map((narrative, index) => ({
                    id: `narrative_${index}`,
                    type: 'progress',
                    message: narrative,
                    timestamp: new Date().toISOString()
                  }));

                  updatedSections[sectionIndex] = {
                    ...updatedSections[sectionIndex],
                    progress,
                    narratives: currentNarratives,
                    phaseName: uniqueNarratives.length > 0 ? uniqueNarratives[uniqueNarratives.length - 1] : 'Processing...',
                   statusTimeline: [
                     ...(updatedSections[sectionIndex].statusTimeline || []),
                     {
                       id: `progress_${Date.now()}`,
                       type: 'progress',
                       message: `Progress: ${progress}% - ${narratives.length > 0 ? narratives[narratives.length - 1] : 'Processing...'}`,
                       timestamp: new Date().toISOString()
                     }
                   ]
                  };
                }
                return { ...prev, sections: updatedSections };
              });
            }

            // Check for completion
            if (status === 'completed' || status === 'complete') {
              console.log(`✅ ${framework} section generation completed`);
              
              console.log(`📋 Full statusData structure:`, JSON.stringify(statusData, null, 2));
              console.log(`📋 statusData.data:`, statusData.data);
              console.log(`📋 statusData.data.result:`, statusData.data?.result);
              console.log(`📋 statusData.data.result.response:`, statusData.data?.result?.response);
              
              const result = statusData.data?.result || statusData.data;
              let sectionData = result || {};
              
              console.log(`📋 Extracted result:`, result);
              console.log(`📋 result.response type:`, typeof result?.response);
              
              // Handle cases where content is in result.response as JSON string
              if (result?.response && typeof result.response === 'string') {
                console.log(`🔍 Found result.response as string, parsing JSON...`);
                console.log(`📋 Raw response string:`, result.response.substring(0, 200) + '...');
                
                try {
                  const parsedResponse = JSON.parse(result.response);
                  console.log(`✅ Successfully parsed JSON response:`, parsedResponse);
                  
                  // Handle different response formats
                  let frameworkData;
                  
                  if (parsedResponse[framework]) {
                    // Expected format: {framework: {slide_content: ...}}
                    frameworkData = parsedResponse[framework];
                    console.log(`📋 Found framework-specific data for ${framework}:`, frameworkData);
                  } else if (parsedResponse.storyline && Array.isArray(parsedResponse.storyline)) {
                    // Storyline array format: {storyline: [{title, content}...]}
                    console.log(`📋 Found storyline array format, converting to slide_content structure`);
                    frameworkData = {
                      slide_content: {
                        title: `${framework.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Analysis`,
                        slides: parsedResponse.storyline,
                        sections: parsedResponse.storyline.map((slide, index) => ({
                          id: `slide_${index}`,
                          title: slide.title || slide.name || `Section ${index + 1}`,
                          content: Array.isArray(slide.content) ? slide.content : [slide.content || slide.text || slide.description || '']
                        }))
                      },
                      insights: parsedResponse.insights || parsedResponse.key_insights || [],
                      citations: parsedResponse.citations || parsedResponse.sources || []
                    };
                  } else if (parsedResponse.slides && Array.isArray(parsedResponse.slides)) {
                    // Alternative format: {slides: [{title, content}...]}
                    console.log(`📋 Found slides array format, converting to slide_content structure`);
                    frameworkData = {
                      slide_content: {
                        title: `${framework.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Analysis`,
                        slides: parsedResponse.slides,
                        sections: parsedResponse.slides.map((slide, index) => ({
                          id: `slide_${index}`,
                          title: slide.title,
                          content: Array.isArray(slide.content) ? slide.content : [slide.content]
                        }))
                      },
                      insights: parsedResponse.insights || parsedResponse.key_insights || [],
                      citations: parsedResponse.citations || parsedResponse.sources || []
                    };
                  } else {
                    // Fallback: use entire parsed response
                    frameworkData = parsedResponse;
                    console.log(`📋 Using entire parsed response as framework data`);
                  }
                  
                  sectionData = frameworkData;
                  console.log(`📋 Final extracted framework data for ${framework}:`, frameworkData);
                } catch (parseError) {
                  console.warn(`⚠️ Failed to parse response JSON for ${framework}:`, parseError);
                  console.warn(`📋 Raw response content (first 200 chars):`, result.response.substring(0, 200));
                  
                  // Handle plain text responses by creating proper structure
                  sectionData = {
                    slide_content: {
                      title: `${framework.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Analysis`,
                      content: result.response,
                      text: result.response
                    },
                    insights: [],
                    citations: [],
                    rawResponse: result.response
                  };
                  console.log(`📋 Created slide_content structure from plain text response`);
                }
              } else {
                console.log(`📋 No result.response string found, using result directly:`, result);
              }
              
              // Update section with final content
              if (shouldUpdateStoryline) {
                console.log(`🔄 Starting section content conversion for ${framework}`);
                console.log(`📋 Raw sectionData to convert:`, JSON.stringify(sectionData, null, 2));
                console.log(`📋 sectionData keys:`, Object.keys(sectionData));
                console.log(`📋 sectionData.slide_content:`, sectionData.slide_content);
                console.log(`📋 sectionData.content:`, sectionData.content);
                console.log(`📋 sectionData.insights:`, sectionData.insights);
                console.log(`📋 sectionData.citations:`, sectionData.citations);
                
                setGeneratedStoryline(prev => {
                  if (!prev) return null;
                  const updatedSections = [...prev.sections];
                  if (updatedSections[sectionIndex]) {
                    const frameworkName = framework.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                    console.log(`📋 Converting section at index ${sectionIndex} for framework ${framework}`);
                    console.log(`📋 Original section before update:`, updatedSections[sectionIndex]);

                    // Extract slide content with multiple fallback paths
                    const extractedSlideContent = sectionData.slide_content || 
                                                 sectionData.content || 
                                                 sectionData.slideContent ||
                                                 sectionData.section_content ||
                                                 { title: frameworkName, content: 'Generated content' };
                    
                    console.log(`📋 Extracted slide_content:`, extractedSlideContent);

                    // Extract insights with multiple fallback paths  
                    const extractedInsights = sectionData.insights || 
                                            sectionData.key_insights || 
                                            sectionData.summary_insights ||
                                            [];
                    
                    console.log(`📋 Extracted insights:`, extractedInsights);

                    // Simple data conversion for async results
                    const convertedSection = {
                      ...updatedSections[sectionIndex],
                      isLoading: false,
                      generationStatus: 'completed',
                      progress: 100,
                      phaseName: 'Completed',
                      title: extractedSlideContent.title || frameworkName,
                      slide_content: extractedSlideContent,
                      slideContent: extractedSlideContent, // Add camelCase version for compatibility
                      sectionContent: {
                        slideContent: extractedSlideContent // Add nested structure for layout view
                      },
                      insights: extractedInsights,
                      citations: sectionData.citations || sectionData.sources || [],
                      charts: sectionData.charts || [],
                      takeaway: sectionData.takeaway || sectionData.summary || '',
                      notes: sectionData.notes || '',
                      rawAgentResponse: result,
                      rawResponse: result?.response,
                      statusTimeline: []
                    };

                    console.log(`✅ Final converted section for ${framework}:`, JSON.stringify(convertedSection, null, 2));
                    console.log(`📋 Final section title:`, convertedSection.title);
                    console.log(`📋 Final section slide_content:`, convertedSection.slide_content);
                    console.log(`📋 Final section insights:`, convertedSection.insights);
                    
                    updatedSections[sectionIndex] = convertedSection;
                  }
                  
                  console.log(`📋 Updated sections array:`, updatedSections.map(s => ({ 
                    id: s.id, 
                    framework: s.framework, 
                    title: s.title,
                    hasSlideContent: !!s.slide_content,
                    insightsCount: s.insights?.length || 0
                  })));
                  
                  return { ...prev, sections: updatedSections };
                });
              }

              return result;
            }

            // Check for failure
            if (status === 'failed' || status === 'error') {
              const errorMessage = statusData.data?.error || statusData.error || 'Generation failed';
              
              if (shouldUpdateStoryline) {
                setGeneratedStoryline(prev => {
                  if (!prev) return null;
                  const updatedSections = [...prev.sections];
                  if (updatedSections[sectionIndex]) {
                    updatedSections[sectionIndex] = {
                      ...updatedSections[sectionIndex],
                      isLoading: false,
                      generationStatus: 'failed',
                      progress: 0,
                      phaseName: 'Failed',
                      statusTimeline: [
                        ...(updatedSections[sectionIndex].statusTimeline || []),
                        {
                          id: `failed_${Date.now()}`,
                          type: 'error',
                          message: `Generation failed: ${errorMessage}`,
                          timestamp: new Date().toISOString()
                        }
                      ]
                    };
                  }
                  return { ...prev, sections: updatedSections };
                });
              }

              throw new Error(`Generation failed: ${errorMessage}`);
            }

            // Continue polling
            attempts++;
            await new Promise(resolve => setTimeout(resolve, delay));
            delay = Math.min(delay * 1.2, maxDelay); // Exponential backoff

          } catch (error) {
            console.warn(`⚠️ Poll attempt ${attempts + 1} failed:`, error.message);
            
            if (attempts >= maxAttempts - 1) {
              throw new Error(`Polling timeout after ${maxAttempts} attempts: ${error.message}`);
            }
            
            attempts++;
            await new Promise(resolve => setTimeout(resolve, delay));
            delay = Math.min(delay * 1.2, maxDelay);
          }
        }

        throw new Error(`Polling timeout after ${maxAttempts} attempts`);
      };

      // Start polling and return the result
      return await pollForCompletion();
    } catch (error) {
      console.error(`❌ Error generating ${framework} section:`, error);
      
      // Update section with error status
      setGeneratedStoryline(prev => {
        if (!prev) return null;
        const updatedSections = [...prev.sections];
        if (updatedSections[sectionIndex]) {
          const previousTimeline = Array.isArray(updatedSections[sectionIndex].statusTimeline)
            ? updatedSections[sectionIndex].statusTimeline
            : [];
          const errorEntry = {
            id: `timeline-error-${Date.now()}`,
            message: `Error generating section: ${error.message}`,
            type: 'error',
            timestamp: new Date().toISOString()
          };
          updatedSections[sectionIndex] = {
            ...updatedSections[sectionIndex],
            isLoading: false,
            generationStatus: 'error',
            phaseName: updatedSections[sectionIndex].phaseName?.replace(' (In Progress)', ' (Error)') || 'Error',
            markdown: `# ${framework.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}\n\n## Error\nFailed to generate content: ${error.message}`,
            statusTimeline: [...previousTimeline, errorEntry]
          };
        }
        return { ...prev, sections: updatedSections };
      });
      
      throw error;
    }
  };

  // Debug effect to monitor generatedStoryline changes
  useEffect(() => {
    if (generatedStoryline) {
      console.log('🔍 generatedStoryline state updated:', JSON.stringify(generatedStoryline, null, 2));
      if (generatedStoryline.sections) {
        console.log('🔍 Sections in generatedStoryline:', generatedStoryline.sections.map(s => ({
          id: s.id,
          title: s.title,
          framework: s.framework
        })));
      }
    }
  }, [generatedStoryline]);

  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    status: 'Planning',
    start_date: '',
    end_date: '',
    client_owner: '',
    internal_owner: '',
    budget_amount: 0,
    budget_currency: 'USD',
    budget_type: 'Fixed',
    deliverables: []
  });
  const [projectContext, setProjectContext] = useState(EMPTY_PROJECT_CONTEXT);
  const [projectDeliverables, setProjectDeliverables] = useState([]);
  const [isLoadingProjectDeliverables, setIsLoadingProjectDeliverables] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addItemType, setAddItemType] = useState(null);
  const [parentId, setParentId] = useState(null);
  const [isDeliverablesOpen, setIsDeliverablesOpen] = useState(true);
  const [sectionToRemove, setSectionToRemove] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isTestingBrief, setIsTestingBrief] = useState(false);

  const resolveProjectIdForDeliverable = useCallback(() => {
    const metadata = selectedItem?.metadata || {};
    return getIdString(
      selectedItem?.project ||
      selectedItem?.project_id ||
      metadata.project_id ||
      metadata.projectId ||
      projectContext?.id ||
      selectedItem?.parentProjectId ||
      selectedItem?.parentId ||
      metadata.business_entity_id
    );
  }, [selectedItem, projectContext]);

  const createDeliverableForStoryline = useCallback(async () => {
    const projectId = resolveProjectIdForDeliverable();
    if (!projectId) {
      throw new Error('Unable to determine the associated project. Please open this deliverable from a project before saving the storyline.');
    }

    const listOrEmpty = (value, fallback) => {
      if (Array.isArray(value) && value.length) return value;
      if (Array.isArray(fallback) && fallback.length) return fallback;
      if (value) return [value];
      if (fallback) return [fallback];
      return [];
    };

    const mapDeliverableType = () => {
      if (DELIVERABLE_TYPES.includes(formData.type)) return formData.type;
      const metadataType = selectedItem?.metadata?.deliverable_type;
      if (metadataType && DELIVERABLE_TYPES.includes(metadataType)) return metadataType;
      return 'Presentation';
    };

    const mapStatus = () => {
      const status = (selectedItem?.status || '').toLowerCase();
      const allowed = ['draft', 'in_review', 'approved', 'in_progress', 'completed', 'delivered', 'rejected'];
      return allowed.includes(status) ? status : 'draft';
    };

    const mapPriority = () => {
      const priority = (selectedItem?.priority || '').toLowerCase();
      const allowed = ['low', 'medium', 'high', 'critical'];
      return allowed.includes(priority) ? priority : 'medium';
    };

    const determineDueDate = () => {
      const due = formData.due_date || selectedItem?.due_date;
      if (!due) return undefined;
      const parsed = new Date(due);
      return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
    };

    const toNumericOrNull = (value, fallback) => {
      const primary = Number(value);
      if (Number.isFinite(primary)) return Number(primary.toFixed(1));
      const secondary = Number(fallback);
      return Number.isFinite(secondary) ? Number(secondary.toFixed(1)) : null;
    };

    const deliverablePayload = {
      name: formData.name || selectedItem?.title || selectedItem?.name || 'Strategy Deliverable',
      type: mapDeliverableType(),
      status: mapStatus(),
      priority: mapPriority(),
      description: formData.brief || selectedItem?.brief || '',
      project: projectId,
      due_date: determineDueDate(),
      estimated_hours: Number.isFinite(Number(selectedItem?.estimated_hours)) ? Number(selectedItem.estimated_hours) : 0,
      notes: selectedItem?.notes || '',
      brief_quality: toNumericOrNull(formData.brief_quality, selectedItem?.brief_quality),
      brief_strengths: listOrEmpty(formData.brief_strengths, selectedItem?.brief_strengths),
      brief_improvements: listOrEmpty(formData.brief_improvements, selectedItem?.brief_improvements)
    };

    const response = await fetch('/api/deliverables', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(deliverablePayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const parsed = JSON.parse(errorText);
        throw new Error(parsed.error || `Failed to create deliverable (${response.status})`);
      } catch (parseError) {
        throw new Error(errorText || `Failed to create deliverable (${response.status})`);
      }
    }

    const result = await response.json();
    const createdDeliverable = result?.data?.deliverable || result?.deliverable || result;

    if (!createdDeliverable || !(createdDeliverable._id || createdDeliverable.id)) {
      throw new Error('Deliverable creation did not return a valid identifier.');
    }

    return createdDeliverable;
  }, [formData.brief, formData.brief_improvements, formData.brief_quality, formData.brief_strengths, formData.due_date, formData.name, formData.type, resolveProjectIdForDeliverable, selectedItem]);

  const composeProjectSummary = useCallback((info = {}) => {
    const lines = [
      info.name ? `Project Name: ${info.name}` : null,
      info.client_name ? `Client: ${info.client_name}` : null,
      info.industry ? `Industry: ${info.industry}` : null,
      info.geography ? `Geography: ${info.geography}` : null,
      info.objectives ? `Objectives: ${info.objectives}` : null,
      info.scope ? `Scope: ${info.scope}` : null
    ].filter(Boolean);

    const description = info.description ? info.description : '';
    if (description) {
      if (lines.length) {
        lines.push('');
      }
      lines.push(description);
    }

    return lines.join('\n');
  }, []);

  const updateProjectContext = useCallback((rawInfo = {}) => {
    const toText = (value) => {
      if (Array.isArray(value)) {
        return value.filter(Boolean).join(', ');
      }
      return typeof value === 'string' ? value.trim() : (value ?? '');
    };

    const incoming = {
      id: rawInfo.id || rawInfo._id || rawInfo.project_id || null,
      name: toText(rawInfo.name || rawInfo.project_name),
      client_name: toText(rawInfo.client_name || rawInfo.clientName || rawInfo.client?.name),
      industry: toText(rawInfo.industry ?? rawInfo.client?.industry),
      geography: toText(rawInfo.geography),
      status: toText(rawInfo.status),
      objectives: toText(rawInfo.objectives),
      scope: toText(rawInfo.scope),
      description: toText(rawInfo.description || rawInfo.summary || rawInfo.project_description)
    };

    setProjectContext((prev) => {
      const next = {
        id: incoming.id || prev.id || null,
        name: incoming.name || prev.name || '',
        client_name: incoming.client_name || prev.client_name || '',
        industry: incoming.industry || prev.industry || '',
        geography: incoming.geography || prev.geography || '',
        status: incoming.status || prev.status || '',
        objectives: incoming.objectives || prev.objectives || '',
        scope: incoming.scope || prev.scope || '',
        description: incoming.description || prev.description || ''
      };

      const summary = composeProjectSummary(next);
      return { ...next, summary };
    });
  }, [composeProjectSummary]);

  const loadProjectContext = useCallback(async (deliverableData = {}, metadata = {}) => {
    const candidateProject = deliverableData?.project;
    const projectRecord = (candidateProject && typeof candidateProject === 'object' && !Array.isArray(candidateProject))
      ? candidateProject
      : {};

    const projectId = getIdString(
      projectRecord._id ||
      projectRecord.id ||
      deliverableData?.project ||
      deliverableData?.project_id ||
      metadata.project_id ||
      metadata.projectId ||
      metadata.business_entity_id ||
      selectedItem?.project ||
      selectedItem?.project_id
    );

    updateProjectContext({
      id: projectId,
      name: projectRecord.name || metadata.project_name,
      client_name: projectRecord.client?.name || metadata.client_name,
      industry: projectRecord.client?.industry || projectRecord.industry || metadata.industry,
      geography: projectRecord.geography || metadata.geography,
      status: projectRecord.status || metadata.status,
      objectives: projectRecord.objectives || metadata.objectives,
      scope: projectRecord.scope || metadata.scope,
      description: projectRecord.description || metadata.project_description || metadata.description
    });

    if (!projectId || !isValidObjectId(projectId)) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        console.warn('Failed to fetch project context:', response.status);
        return;
      }

      const project = await response.json();
      updateProjectContext({
        id: projectId,
        name: project.name,
        client_name: project.client?.name || project.client_name,
        industry: project.client?.industry || project.industry,
        geography: project.geography,
        status: project.status,
        objectives: project.objectives,
        scope: project.scope,
        description: project.description
      });
    } catch (error) {
      console.error('❌ Error fetching project context:', error);
    }
  }, [selectedItem, updateProjectContext]);

  const projectDataForAi = useMemo(() => {
    const metadata = selectedItem?.metadata || {};
    const industryFromMetadata = Array.isArray(metadata.industry)
      ? metadata.industry.filter(Boolean).join(', ')
      : (metadata.industry || '');

    const candidateId = getIdString(
      projectContext.id ||
      metadata.project_id ||
      metadata.projectId ||
      metadata.business_entity_id ||
      selectedItem?.project ||
      selectedItem?.project_id
    );

    const data = {
      id: candidateId || null,
      name: projectContext.name || metadata.project_name || '',
      client_name: projectContext.client_name || metadata.client_name || '',
      industry: projectContext.industry || industryFromMetadata || '',
      geography: projectContext.geography || metadata.geography || '',
      status: projectContext.status || metadata.status || '',
      objectives: projectContext.objectives || metadata.objectives || '',
      scope: projectContext.scope || metadata.scope || '',
      description: projectContext.description || metadata.project_description || metadata.description || ''
    };

    return {
      ...data,
      summary: composeProjectSummary(data)
    };
  }, [composeProjectSummary, projectContext, selectedItem]);

  const formatDateForInput = useCallback((value) => {
    if (!value) return '';
    try {
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch (error) {
      return '';
    }
  }, []);

  const formatDueDateForDisplay = useCallback((value) => {
    if (!value) return '';
    if (/^\d{2}[./-]\d{2}[./-]\d{4}$/.test(value)) {
      return value.replace(/-/g, '.');
    }
    try {
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) return value;
      return new Intl.DateTimeFormat('en-GB').format(date).replace(/\//g, '.');
    } catch (error) {
      return value;
    }
  }, []);

  const parseDueDateInput = useCallback((value) => {
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

    const match = value.match(/^(\d{2})[./-](\d{2})[./-](\d{4})$/);
    if (match) {
      const [, day, month, year] = match;
      return `${year}-${month}-${day}`;
    }

    try {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }
    } catch (error) {
      /* noop */
    }

    return value;
  }, []);

  const normalizeDeliverable = useCallback((deliverable, index = 0) => {
    if (!deliverable) {
      return {
        id: `deliverable_${index + 1}`,
        name: `Deliverable ${index + 1}`,
        type: 'Deliverable',
        status: 'draft',
        dueDate: null,
        description: ''
      };
    }

    if (typeof deliverable === 'string') {
      return {
        id: `deliverable_${index + 1}`,
        name: deliverable,
        type: 'Deliverable',
        status: 'draft',
        dueDate: null,
        description: ''
      };
    }

    const metadata = deliverable.metadata || {};
    const projectId = deliverable.project || deliverable.project_id || deliverable.projectId || metadata.project || metadata.project_id || metadata.projectId || null;
    const clientId = deliverable.client || deliverable.client_id || deliverable.clientId || metadata.client || metadata.client_id || metadata.clientId || null;
    const parentId = deliverable.parentId || deliverable.parent_id || deliverable.parent || metadata.parentId || metadata.parent_id || projectId || null;

    return {
      id: deliverable._id || deliverable.id || metadata.deliverableId || metadata.id || `deliverable_${index + 1}`,
      _id: deliverable._id || deliverable.id || metadata.deliverableId || metadata.id || `deliverable_${index + 1}`,
      name: deliverable.name || deliverable.title || metadata.title || `Deliverable ${index + 1}`,
      type: deliverable.type || metadata.type || 'Deliverable',
      status: deliverable.status || metadata.status || 'draft',
      dueDate: deliverable.due_date || deliverable.dueDate || metadata.due_date || metadata.dueDate || null,
      description: deliverable.description || metadata.description || '',
      projectId,
      clientId,
      parentId
    };
  }, []);

  const normalizeDeliverableList = useCallback((list = []) => {
    if (!Array.isArray(list)) return [];
    return list.map((item, index) => normalizeDeliverable(item, index));
  }, [normalizeDeliverable]);

  const normalizeSlideForState = useCallback((slide, index = 0, fallbackLayout = 'full-width') => {
    const toArray = (value) => {
      if (!value) return [];
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') {
        const text = value.trim();
        if (!text) return [];
        try {
          const parsed = JSON.parse(text);
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch (error) {
          return text
            .split(/\n|•|-/)
            .map(item => item.trim())
            .filter(Boolean);
        }
      }
      return [value];
    };

    if (!slide) {
      return {
        title: `Slide ${index + 1}`,
        summary: '',
        bullets: [],
        layout: fallbackLayout
      };
    }

    if (typeof slide === 'string') {
      const text = slide.trim();
      const bullets = text
        .split(/\n|•|-/)
        .map(item => item.trim())
        .filter(Boolean);

      return {
        title: `Slide ${index + 1}`,
        summary: text,
        bullets,
        layout: fallbackLayout
      };
    }

    const bullets = toArray(slide.bullets || slide.points || slide.keyPoints)
      .map(item => (typeof item === 'string' ? item.trim() : item?.content || item?.text || item?.description || ''))
      .filter(Boolean);

    let summary = '';
    if (typeof slide.summary === 'string') summary = slide.summary.trim();
    else if (typeof slide.description === 'string') summary = slide.description.trim();
    else if (typeof slide.content === 'string') summary = slide.content.trim();
    else if (Array.isArray(slide.paragraphs)) summary = slide.paragraphs.filter(Boolean).join(' ');

    return {
      title: slide.title || slide.heading || slide.name || `Slide ${index + 1}`,
      subtitle: slide.subtitle || slide.subheading || '',
      summary,
      bullets,
      notes: slide.notes || slide.speakerNotes || '',
      layout: slide.layout || slide.format || fallbackLayout
    };
  }, []);

  const normalizeSectionForState = useCallback((section, index = 0) => {
    const normalizeCharts = (charts) => {
      if (!Array.isArray(charts)) return [];
      return charts.map((chart, chartIndex) => ({
        id: chart?.id || `chart-${chartIndex + 1}`,
        title: chart?.title || '',
        caption: chart?.caption || '',
        source: chart?.source || '',
        config: chart?.config || {},
        attributes: chart?.attributes || {},
        raw: chart?.raw || '',
        generated: chart?.generated || false,
        type: chart?.type || 'bar'
      }));
    };

    const layout = typeof section.layout === 'string' && section.layout.trim()
      ? section.layout.trim()
      : 'full-width';

    const slideContent = section.slide_content || section.slideContent || section.sectionContent?.slideContent || {};
    const statusMessage = section.statusMessage || section.status_message || '';
    const progress = typeof section.progress === 'number' ? section.progress : null;
    const generationStatus = section.generationStatus || section.generation_status || null;

    return {
    id: section.id || section._id || `section_${index + 1}`,
    title: section.title,
    description: section.description,
    markdown: typeof section.markdown === 'string' ? section.markdown : '',
    html: typeof section.html === 'string' ? section.html : '',
      charts: normalizeCharts(section.charts),
      chartData: cloneToPlainObject(section.chartData, null),
    status: section.status || 'draft',
    order: section.order ?? index,
    keyPoints: Array.isArray(section.keyPoints) ? section.keyPoints : [],
      insights: normalizeInsightList(section.insights || section.keyInsights),
    contentBlocks: Array.isArray(section.contentBlocks) ? section.contentBlocks : [],
      sources: normalizeStringList(section.sources),
    estimatedSlides: section.estimatedSlides || section.estimated_pages || section.estimatedPages,
    slides: Array.isArray(section.slides)
        ? section.slides.map((slide, slideIndex) => normalizeSlideForState(slide, slideIndex, layout))
      : [],
    slidesGeneratedAt: section.slidesGeneratedAt || section.slides_generated_at || null,
    slidesGenerationContext: section.slidesGenerationContext || section.slides_generation_context || null,
    locked: !!section.locked,
    lockedBy: section.lockedBy,
    lockedAt: section.lockedAt,
      framework: typeof section.framework === 'string' ? section.framework : '',
      takeaway: section.takeaway || '',
      notes: section.notes || '',
      layout,
      layoutAppliedAt: section.layoutAppliedAt || section.layout_applied_at || null,
      slide_content: cloneToPlainObject(slideContent, {}),
      slideContent: cloneToPlainObject(slideContent, {}),
      sectionContent: section.sectionContent ? cloneToPlainObject(section.sectionContent, {}) : undefined,
      rawAgentResponse: section.rawAgentResponse || section.raw_agent_response || null,
      rawResponse: section.rawResponse || section.raw_response || null,
      generationStatus,
      statusMessage,
      progress,
      source: section.source || section.generationSource || '',
      generatedAt: section.generatedAt || section.generated_at || null,
      isLoading: !!section.isLoading,
      error: section.error || null,
    created_at: section.created_at || section.createdAt,
    updated_at: section.updated_at || section.updatedAt,
      statusTimeline: Array.isArray(section.statusTimeline)
        ? cloneToPlainObject(section.statusTimeline, [])
        : []
    };
  }, [normalizeSlideForState, normalizeStatus]);

  const prepareStorylinePayload = useCallback((storyline, overrides = {}) => {
    if (!storyline) return null;

    const cloneArray = (value) => (Array.isArray(value) ? cloneToPlainObject(value, []) : []);

    const toAudienceArray = (audience) => {
      if (!audience) return [];
      if (Array.isArray(audience)) {
        return audience
          .map(item => (typeof item === 'string' ? item.trim() : String(item).trim()))
          .filter(Boolean);
      }
      const single = typeof audience === 'string' ? audience.trim() : String(audience).trim();
      return single ? [single] : [];
    };

    const sections = (storyline.sections || []).map((section, index) => {
      const layout = typeof section.layout === 'string' && section.layout.trim()
        ? section.layout.trim()
        : 'full-width';

      const slideContent = section.slide_content || section.slideContent || section.sectionContent?.slideContent || {};

      return {
        id: section.id || `section_${index + 1}`,
        title: section.title || `Section ${index + 1}`,
        description: section.description || '',
        framework: typeof section.framework === 'string' ? section.framework : undefined,
        status: normalizeStatus(section.status, 'draft'),
        order: section.order ?? index,
        markdown: typeof section.markdown === 'string' ? section.markdown : '',
        html: typeof section.html === 'string' ? section.html : '',
        keyPoints: Array.isArray(section.keyPoints) ? cloneToPlainObject(section.keyPoints, []) : [],
        insights: Array.isArray(section.insights) ? cloneToPlainObject(section.insights, []) : normalizeInsightList(section.insights),
        contentBlocks: Array.isArray(section.contentBlocks) ? cloneToPlainObject(section.contentBlocks, []) : [],
        sources: normalizeStringList(section.sources),
        citations: cloneToPlainObject(section.citations, []),
        charts: cloneToPlainObject(section.charts, []),
        chartData: cloneToPlainObject(section.chartData, null),
        takeaway: section.takeaway || '',
        notes: section.notes || '',
        layout,
        layoutAppliedAt: section.layoutAppliedAt || section.layout_applied_at || null,
        slides: cloneToPlainObject(section.slides || (section.sectionContent?.slides) || [], []),
        slidesGeneratedAt: section.slidesGeneratedAt || section.slides_generated_at || null,
        slidesGenerationContext: cloneToPlainObject(section.slidesGenerationContext || section.slides_generation_context, null),
        slide_content: cloneToPlainObject(slideContent, {}),
        slideContent: cloneToPlainObject(slideContent, {}),
        sectionContent: section.sectionContent ? cloneToPlainObject(section.sectionContent, {}) : undefined,
        rawAgentResponse: cloneToPlainObject(section.rawAgentResponse || section.raw_agent_response, null),
        rawResponse: cloneToPlainObject(section.rawResponse || section.raw_response, null),
        progress: typeof section.progress === 'number' ? section.progress : null,
        generationStatus: section.generationStatus || section.generation_status || null,
        statusMessage: section.statusMessage || section.status_message || '',
        isLoading: !!section.isLoading,
        source: section.source || section.generationSource || undefined,
        generatedAt: section.generatedAt || section.generated_at || null,
        locked: !!section.locked,
        lockedBy: section.locked
          ? getIdString(section.lockedBy?._id || section.lockedBy)
          : undefined,
        lockedAt: section.locked ? section.lockedAt : undefined,
        created_at: section.created_at || section.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        statusTimeline: cloneToPlainObject(section.statusTimeline, [])
      };
    });

    const payload = {
      _id: storyline._id,
      id: storyline.id,
      title: storyline.title,
      status: storyline.status,
      version: storyline.version,
      executiveSummary: storyline.executiveSummary || '',
      presentationFlow: storyline.presentationFlow || '',
      callToAction: storyline.callToAction || '',
      topic: storyline.topic || '',
      industry: storyline.industry || '',
      audience: toAudienceArray(storyline.audience),
      objectives: storyline.objectives,
      presentationStyle: storyline.presentationStyle || 'consulting',
      complexity: storyline.complexity || 'intermediate',
      sections
    };

    if (overrides.deliverable) {
      payload.deliverable = overrides.deliverable;
    } else if (storyline.deliverable) {
      payload.deliverable = storyline.deliverable;
    }

    return payload;
  }, [normalizeInsightList, normalizeStringList]);

  const fetchProjectDeliverables = useCallback(async (projectId) => {
    if (!projectId) return;

    try {
      setIsLoadingProjectDeliverables(true);

      const response = await fetch(`/api/projects/${projectId}/deliverables`);
      if (!response.ok) {
        console.warn('Failed to fetch project deliverables:', response.status);
        return;
      }

      const data = await response.json();
      const deliverablesData = Array.isArray(data) ? data : data?.data || [];
      const normalizedFromApi = normalizeDeliverableList(deliverablesData);

      setProjectDeliverables((prev) => (
        normalizedFromApi.length > 0 ? normalizedFromApi : prev
      ));
    } catch (error) {
      console.error('❌ Error fetching project deliverables:', error);
    } finally {
      setIsLoadingProjectDeliverables(false);
    }
  }, [normalizeDeliverableList]);

  // Update form data when selectedItem changes
  useEffect(() => {
    if (selectedItem && selectedItem.type === 'deliverable' && !isSavingDeliverable) {
      console.log('🎯 [USEEFFECT] Deliverable selected:', selectedItem._id || selectedItem.id);
      console.log('🎯 [USEEFFECT] isSavingDeliverable:', isSavingDeliverable);
      console.log('🎯 [USEEFFECT] selectedItem.brief:', selectedItem.brief);
      console.log('🎯 [USEEFFECT] Current formData.brief:', formData.brief);
      console.log('🎯 [USEEFFECT] justSavedRef.current:', justSavedRef.current);

      const metadata = selectedItem.metadata || {};

      updateProjectContext({
        id: metadata.project_id || metadata.projectId || metadata.business_entity_id,
        name: metadata.project_name,
        client_name: metadata.client_name,
        industry: metadata.industry,
        geography: metadata.geography,
        status: metadata.status,
        objectives: metadata.objectives,
        scope: metadata.scope,
        description: metadata.project_description || metadata.description
      });
      
      // If we just saved, don't overwrite formData - it's already been updated by the save operation
      if (justSavedRef.current) {
        console.log('🎯 [USEEFFECT] Skipping formData update - just saved, formData already updated');
        justSavedRef.current = false; // Reset the flag
        return;
      }
      
      const fetchDeliverableData = async () => {
        // Extract the correct deliverable ID from metadata (same pattern as saveDeliverable)
        const deliverableId = selectedItem?.metadata?.deliverableId || 
                             selectedItem?.metadata?.deliverable_id || 
                             selectedItem?.metadata?.business_entity_id || 
                             selectedItem?._id || 
                             selectedItem?.id;
        if (!deliverableId) return;
        
        try {
          console.log('🔄 Fetching full deliverable data for:', deliverableId);
          const response = await fetch(`/api/deliverables/${deliverableId}`);
          if (response.ok) {
            const data = await response.json();
            const deliverableData = data.data?.deliverable || data.data || data;
            
            console.log('✅ Fetched deliverable data:', deliverableData);
            console.log('📊 Brief quality from DB:', deliverableData.brief_quality);
            console.log('📊 Brief strengths from DB:', deliverableData.brief_strengths);
            console.log('📊 Brief improvements from DB:', deliverableData.brief_improvements);
            
            const strengthsFromData = normalizeInsightList(
              deliverableData.brief_strengths ??
              deliverableData.strengths ??
              deliverableData.recognized_strengths ??
              deliverableData.recognizedStrengths ??
              selectedItem.strengths
            );

            const improvementsFromData = normalizeInsightList(
              deliverableData.brief_improvements ??
              deliverableData.improvements ??
              deliverableData.suggested_improvements ??
              deliverableData.suggestedImprovements ??
              selectedItem.improvements
            );
            
            const qualityFromData = normalizeScoreValue(
              deliverableData.brief_quality ??
              selectedItem.brief_quality
            );

            const briefToSet = deliverableData.brief || selectedItem.brief || 'Global Banking Corp requires a comprehensive strategy for implementing Central Bank Digital Currency (CBDC) capabilities. The presentation should address technical infrastructure requirements, regulatory compliance considerations, and strategic positioning for competitive advantage in the evolving digital currency landscape.';
            console.log('🎯 [USEEFFECT] Setting form brief to:', briefToSet);
            console.log('🎯 [USEEFFECT] deliverableData.brief:', deliverableData.brief);
            console.log('🎯 [USEEFFECT] selectedItem.brief:', selectedItem.brief);
            
            const formDataToSet = {
              name: deliverableData.name || selectedItem.name || 'CBDC Implementation Strategy for Global Banking',
              audience: deliverableData.audience || selectedItem.audience || ['Board of Directors', 'Technical Teams', 'Sarah Mitchell (CEO)'],
              type: deliverableData.type || selectedItem.type || 'Strategy Presentation',
              due_date: deliverableData.due_date ? new Date(deliverableData.due_date).toISOString().split('T')[0] : 
                       selectedItem.due_date ? new Date(selectedItem.due_date).toISOString().split('T')[0] : '2025-02-15',
              brief: briefToSet,
              brief_quality: qualityFromData,
              brief_strengths: strengthsFromData,
              brief_improvements: improvementsFromData
            };
            
            console.log('💾 Setting formData with brief_quality:', formDataToSet.brief_quality);
            setFormData(formDataToSet);

            await loadProjectContext(deliverableData, metadata);
          } else {
            console.log('⚠️ Failed to fetch deliverable data, using selectedItem data');
            // Fallback to selectedItem data if API call fails
            const qualityFromSelected = normalizeScoreValue(selectedItem.brief_quality) ?? null;

            setFormData({
              name: selectedItem.name || 'CBDC Implementation Strategy for Global Banking',
              audience: selectedItem.audience || ['Board of Directors', 'Technical Teams', 'Sarah Mitchell (CEO)'],
              type: selectedItem.type || 'Strategy Presentation',
              due_date: selectedItem.due_date ? new Date(selectedItem.due_date).toISOString().split('T')[0] : '2025-02-15',
              brief: selectedItem.brief || 'Global Banking Corp requires a comprehensive strategy for implementing Central Bank Digital Currency (CBDC) capabilities. The presentation should address technical infrastructure requirements, regulatory compliance considerations, and strategic positioning for competitive advantage in the evolving digital currency landscape.',
              brief_quality: qualityFromSelected,
              brief_strengths: normalizeInsightList(selectedItem.strengths).length
                ? normalizeInsightList(selectedItem.strengths)
                : [],
              brief_improvements: normalizeInsightList(selectedItem.improvements).length
                ? normalizeInsightList(selectedItem.improvements)
                : []
            });

            await loadProjectContext(selectedItem, metadata);
          }
        } catch (error) {
          console.error('❌ Error fetching deliverable data:', error);
          // Fallback to selectedItem data if error occurs
          const qualityFallback = normalizeScoreValue(selectedItem.brief_quality) ?? null;

          setFormData({
            name: selectedItem.name || 'CBDC Implementation Strategy for Global Banking',
            audience: selectedItem.audience || ['Board of Directors', 'Technical Teams', 'Sarah Mitchell (CEO)'],
            type: selectedItem.type || 'Strategy Presentation',
            due_date: selectedItem.due_date ? new Date(selectedItem.due_date).toISOString().split('T')[0] : '2025-02-15',
            brief: selectedItem.brief || 'Global Banking Corp requires a comprehensive strategy for implementing Central Bank Digital Currency (CBDC) capabilities. The presentation should address technical infrastructure requirements, regulatory compliance considerations, and strategic positioning for competitive advantage in the evolving digital currency landscape.',
            brief_quality: qualityFallback,
            brief_strengths: normalizeInsightList(selectedItem.strengths).length
              ? normalizeInsightList(selectedItem.strengths)
              : [],
            brief_improvements: normalizeInsightList(selectedItem.improvements).length
              ? normalizeInsightList(selectedItem.improvements)
              : []
          });

          await loadProjectContext(selectedItem, metadata);
        }
      };
      
      fetchDeliverableData();

      // Ensure we start with the detailed view (settings page)
      setCurrentView('detailed');

      // Load existing storyline if available
      // For deliverable menu items, use the actual deliverable ID from metadata, not the menu item ID
      const deliverableId = selectedItem.type === 'deliverable' 
        ? (selectedItem.metadata?.deliverableId || selectedItem.metadata?.deliverable_id || selectedItem.metadata?.business_entity_id || selectedItem._id || selectedItem.id)
        : (selectedItem._id || selectedItem.id);
      console.log('🔍 Auto-loading storyline for deliverable:', deliverableId);
      console.log('🔍 Selected item type:', selectedItem.type);
      console.log('🔍 Selected item metadata:', selectedItem.metadata);
      loadExistingStoryline(deliverableId);
    }
  }, [selectedItem, isSavingDeliverable, updateProjectContext, loadProjectContext]);

  // Load existing storyline for the deliverable
  const loadExistingStoryline = async (deliverableId) => {
    if (!deliverableId) return;

    try {
      console.log('🔍 Loading existing storyline for deliverable:', deliverableId);
      
      const response = await fetch(`/api/storylines?deliverableId=${deliverableId}`);
      if (!response.ok) {
        console.log('❌ Failed to fetch storylines from API');
        return;
      }

      const result = await response.json();
      console.log('🔍 API Response:', result);
      console.log('🔍 Result data:', result?.data);
      console.log('🔍 Storylines array:', result?.data?.storylines);
      
      const storylines = Array.isArray(result?.data?.storylines)
        ? result.data.storylines
        : Array.isArray(result?.data)
          ? result.data
          : [];
      console.log('🔍 Parsed storylines:', storylines);
      
      const existingStoryline = storylines[0] || result?.data?.storyline || null;
      console.log('🔍 Existing storyline:', existingStoryline);

      if (existingStoryline) {
        console.log('✅ Found existing storyline:', existingStoryline._id);
        
        setGeneratedStoryline({
          ...existingStoryline,
          sections: (existingStoryline.sections || []).map((section, index) =>
            normalizeSectionForState(section, index)
          )
        });
        // Don't automatically switch to storyline view - let user choose
        setCurrentSectionIndex(0);
        setStorylineDirty(false);
      } else {
        console.log('📝 No existing storyline found for this deliverable');
        setGeneratedStoryline(null);
        setStorylineDirty(false);
      }
    } catch (error) {
      console.error('❌ Error loading existing storyline:', error);
      setGeneratedStoryline(null);
      setStorylineDirty(false);
    }
  };

  // Load existing storyline without auto-switching to storyline view
  const loadExistingStorylineWithoutAutoSwitch = async (deliverableId) => {
    if (!deliverableId) return null;
    
    try {
      console.log('🔍 Loading existing storyline for deliverable (no auto-switch):', deliverableId);
      
      const response = await fetch(`/api/storylines?deliverableId=${deliverableId}`);
      if (!response.ok) {
        console.log('❌ Failed to fetch storylines from API');
        return null;
      }

      const result = await response.json();
      console.log('🔍 API Response (no-auto-switch):', result);
      
      const storylines = Array.isArray(result?.data?.storylines)
        ? result.data.storylines
        : Array.isArray(result?.data)
          ? result.data
          : [];
      console.log('🔍 Parsed storylines (no-auto-switch):', storylines);

      const existingStoryline = storylines[0] || result?.data?.storyline || null;
      console.log('🔍 Existing storyline (no-auto-switch):', existingStoryline);

      if (existingStoryline) {
        console.log('✅ Found existing storyline:', existingStoryline._id);
        
        const storylineData = {
          ...existingStoryline,
          sections: (existingStoryline.sections || []).map((section, index) =>
            normalizeSectionForState(section, index)
          )
        };
        
        setGeneratedStoryline(storylineData);
        setStorylineDirty(false);
        return storylineData;
      } else {
        console.log('ℹ️ No existing storyline found for deliverable:', deliverableId);
        return null;
      }
    } catch (error) {
      console.error('❌ Error loading existing storyline:', error);
      return null;
    }
  };

  const handleSectionUpdate = (sectionId, updates) => {
    setGeneratedStoryline(prev => {
      if (!prev) return prev;
      const updatedSections = (prev.sections || []).map(section => (
        section.id === sectionId
          ? {
              ...section,
              ...updates,
              updated_at: new Date().toISOString()
            }
          : section
      ));
      setStorylineDirty(true);
      return { ...prev, sections: updatedSections };
    });
  };

  const handleSectionStatusChange = (sectionId, status) => {
    handleSectionUpdate(sectionId, { status });
  };

  const handleToggleLock = (sectionId, shouldLock) => {
    handleSectionUpdate(sectionId, {
      locked: shouldLock,
      status: shouldLock ? 'final' : 'draft',
      lockedAt: shouldLock ? new Date().toISOString() : null
    });
  };

  const handleRemoveSection = (sectionId) => {
    if (!generatedStoryline) return;
    setSectionToRemove(sectionId);
  };

  const handleRegenerateSection = async (section) => {
    if (!section.framework || !generatedStoryline) return;
    
    try {
      console.log(`🚀 Starting async regeneration for section ${section.id} with framework ${section.framework}`);
      
      // Set section to async loading state
      handleSectionUpdate(section.id, { 
        isLoading: true,
        status: 'draft',
        generationStatus: 'starting',
        phaseName: 'Starting regeneration...',
        progress: 0,
        narratives: [],
        statusTimeline: [{
          id: `regen_start_${Date.now()}`,
          type: 'info',
          message: 'Starting section regeneration...',
          timestamp: new Date().toISOString()
        }]
      });
      
      // Build dependency data for this framework
      const dependencies = buildDependencyData(section.framework, generatedStoryline?.sections || []);
      
      // Get framework-specific agent ID
      const agentId = FRAMEWORK_AGENT_MAPPING[section.framework];
      if (!agentId) {
        throw new Error(`No agent configured for framework: ${section.framework}`);
      }

      // Build proper orchestrator payload for regeneration
      const projectData = {
        name: selectedItem?.name || selectedItem?.title || 'Project',
        description: selectedItem?.description || '',
        industry: selectedItem?.industry || formData.industry,
        id: selectedItem?.id || 'project-1',
        client_name: selectedItem?.client_name || 'Client'
      };

      const deliverableData = {
        brief: formData.brief,
        brief_quality: formData.brief_quality,
        title: formData.title,
        type: formData.type,
        industry: formData.industry,
        audience: formData.audience,
        objectives: formData.objectives,
        name: formData.title || 'Strategic Analysis'
      };

      const clientData = {
        name: selectedItem?.client_name || 'Client',
        industry: selectedItem?.client_industry || formData.industry,
        geography: selectedItem?.geography || 'Switzerland'
      };

      const orchestratorPayload = buildOrchestratorPayload(
        section.framework, 
        dependencies, 
        projectData, 
        deliverableData, 
        clientData, 
        formData.brief
      );

      console.log(`🤖 Using agent ID for ${section.framework} regeneration:`, agentId);
      console.log(`📋 Regeneration orchestrator payload:`, JSON.stringify(orchestratorPayload, null, 2));

      // Step 1: Start async regeneration
      const asyncResponse = await fetch('/api/ai/direct/async-execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: agentId,
          ...orchestratorPayload
        })
      });

      if (!asyncResponse.ok) {
        const errorData = await asyncResponse.json();
        throw new Error(errorData.error || `Failed to start async regeneration: ${asyncResponse.status}`);
      }

      const asyncResult = await asyncResponse.json();
      const executionId = asyncResult.executionId;
      
      if (!executionId) {
        throw new Error('No execution ID returned from async regeneration start');
      }

      console.log(`🔍 Starting regeneration polling for execution: ${executionId}`);

      // Update section with execution ID
      handleSectionUpdate(section.id, {
        generationStatus: 'in_progress',
        phaseName: 'Polling for regeneration progress...',
        executionId,
        statusTimeline: [{
          id: `regen_polling_${Date.now()}`,
          type: 'info',
          message: `Started regeneration polling ${executionId}`,
          timestamp: new Date().toISOString()
        }]
      });

      // Step 2: Poll for completion with live updates
      const pollForRegenCompletion = async () => {
        let attempts = 0;
        const maxAttempts = 60;
        let delay = 3000;
        const maxDelay = 10000;

        while (attempts < maxAttempts) {
          try {
            const statusResponse = await fetch(`/api/ai/direct/status/${executionId}`);
            
            if (!statusResponse.ok) {
              throw new Error(`Status check failed: ${statusResponse.status}`);
            }

            const statusData = await statusResponse.json();
            const status = statusData.status;
            const progress = statusData.progress || 0;
            const narratives = statusData.data?.narrative || [];
            
            console.log(`📊 Regeneration Poll ${attempts + 1}: ${status} (${progress}%)`);

            // Update section with live progress - filter repetitive messages
            const filteredNarratives = narratives.filter(narrative => 
              !narrative.includes('Calling Openai (openai/gpt-4.1) - Iteration 2') &&
              !narrative.includes('Calling Openai (openai/gpt-4.1) - Iteration 3') &&
              !narrative.includes('Calling Openai (openai/gpt-4.1) - Iteration 4')
            );
            
            const currentNarratives = filteredNarratives.map((narrative, index) => ({
              id: `regen_narrative_${index}`,
              type: 'progress',
              message: narrative,
              timestamp: new Date().toISOString()
            }));

            handleSectionUpdate(section.id, {
              progress,
              narratives: currentNarratives,
              phaseName: narratives.length > 0 ? narratives[narratives.length - 1] : 'Regenerating...',
              statusTimeline: [{
                id: `regen_progress_${Date.now()}`,
                type: 'progress',
                message: `Regeneration Progress: ${progress}% - ${narratives.length > 0 ? narratives[narratives.length - 1] : 'Processing...'}`,
                timestamp: new Date().toISOString()
              }]
            });

            // Check for completion
            if (status === 'completed' || status === 'complete') {
              console.log(`✅ Section ${section.id} regeneration completed`);
              
              console.log(`📋 REGENERATION Full statusData structure:`, JSON.stringify(statusData, null, 2));
              console.log(`📋 REGENERATION statusData.data:`, statusData.data);
              console.log(`📋 REGENERATION statusData.data.result:`, statusData.data?.result);
              console.log(`📋 REGENERATION statusData.data.result.response:`, statusData.data?.result?.response);
              
              const result = statusData.data?.result || statusData.data;
              let sectionData = result || {};
              
              console.log(`📋 REGENERATION Extracted result:`, result);
              console.log(`📋 REGENERATION result.response type:`, typeof result?.response);
              
              // Handle cases where content is in result.response as JSON string
              if (result?.response && typeof result.response === 'string') {
                console.log(`🔍 REGENERATION Found result.response as string, parsing JSON...`);
                console.log(`📋 REGENERATION Raw response string:`, result.response.substring(0, 200) + '...');
                
                try {
                  const parsedResponse = JSON.parse(result.response);
                  console.log(`✅ REGENERATION Successfully parsed JSON response:`, parsedResponse);
                  
                  // Handle different response formats
                  let frameworkData;
                  
                  if (parsedResponse[section.framework]) {
                    // Expected format: {framework: {slide_content: ...}}
                    frameworkData = parsedResponse[section.framework];
                    console.log(`📋 REGENERATION Found framework-specific data for ${section.framework}:`, frameworkData);
                  } else if (parsedResponse.slides && Array.isArray(parsedResponse.slides)) {
                    // Alternative format: {slides: [{title, content}...]}
                    console.log(`📋 REGENERATION Found slides array format, converting to slide_content structure`);
                    frameworkData = {
                      slide_content: {
                        title: `${section.framework.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Analysis`,
                        slides: parsedResponse.slides,
                        sections: parsedResponse.slides.map((slide, index) => ({
                          id: `slide_${index}`,
                          title: slide.title,
                          content: Array.isArray(slide.content) ? slide.content : [slide.content]
                        }))
                      },
                      insights: parsedResponse.insights || parsedResponse.key_insights || [],
                      citations: parsedResponse.citations || parsedResponse.sources || []
                    };
                  } else {
                    // Fallback: use entire parsed response
                    frameworkData = parsedResponse;
                    console.log(`📋 REGENERATION Using entire parsed response as framework data`);
                  }
                  
                  sectionData = frameworkData;
                  console.log(`📋 REGENERATION Final extracted framework data for ${section.framework}:`, frameworkData);
                } catch (parseError) {
                  console.warn(`⚠️ REGENERATION Failed to parse response JSON for ${section.framework}:`, parseError);
                  console.warn(`📋 REGENERATION Raw response content (first 200 chars):`, result.response.substring(0, 200));
                  
                  // Handle plain text responses by creating proper structure
                  sectionData = {
                    slide_content: {
                      title: `${section.framework.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Analysis`,
                      content: result.response,
                      text: result.response
                    },
                    insights: [],
                    citations: [],
                    rawResponse: result.response
                  };
                  console.log(`📋 REGENERATION Created slide_content structure from plain text response`);
                }
              } else {
                console.log(`📋 REGENERATION No result.response string found, using result directly:`, result);
              }
              
              // Update section with final regenerated content
              console.log(`🔄 REGENERATION Starting section content conversion for ${section.framework}`);
              console.log(`📋 REGENERATION Raw sectionData to convert:`, JSON.stringify(sectionData, null, 2));
              console.log(`📋 REGENERATION sectionData keys:`, Object.keys(sectionData));
              
              // Extract content with multiple fallback paths
              const extractedSlideContent = sectionData.slide_content || 
                                           sectionData.content || 
                                           sectionData.slideContent ||
                                           sectionData.section_content ||
                                           section.slide_content; // fallback to existing
              
              const extractedInsights = sectionData.insights || 
                                      sectionData.key_insights || 
                                      sectionData.summary_insights ||
                                      section.insights || []; // fallback to existing
              
              console.log(`📋 REGENERATION Extracted slide_content:`, extractedSlideContent);
              console.log(`📋 REGENERATION Extracted insights:`, extractedInsights);
              
              const regeneratedContent = {
                ...sectionData,
                framework: section.framework, // Preserve the original framework
                title: extractedSlideContent?.title || section.title,
                slide_content: extractedSlideContent,
                insights: extractedInsights,
                citations: sectionData.citations || sectionData.sources || section.citations || [],
                isLoading: false,
                status: 'draft',
                generationStatus: 'completed',
                progress: 100,
                phaseName: 'Regeneration Completed',
                generatedAt: new Date().toISOString(),
                source: 'framework-agent-regenerated-async',
                statusTimeline: [{
                  id: `regen_completed_${Date.now()}`,
                  type: 'success',
                  message: 'Section regeneration completed successfully',
                  timestamp: new Date().toISOString()
                }]
              };
              
              console.log(`✅ REGENERATION Final regenerated section for ${section.framework}:`, JSON.stringify(regeneratedContent, null, 2));
              console.log(`📋 REGENERATION Final section title:`, regeneratedContent.title);
              console.log(`📋 REGENERATION Final section slide_content:`, regeneratedContent.slide_content);
              console.log(`📋 REGENERATION Final section insights:`, regeneratedContent.insights);
              
              handleSectionUpdate(section.id, regeneratedContent);

              return;
            }

            // Check for failure
            if (status === 'failed' || status === 'error') {
              const errorMessage = statusData.data?.error || statusData.error || 'Regeneration failed';
              
              handleSectionUpdate(section.id, {
                isLoading: false,
                generationStatus: 'failed',
                progress: 0,
                phaseName: 'Regeneration Failed',
                statusTimeline: [{
                  id: `regen_failed_${Date.now()}`,
                  type: 'error',
                  message: `Regeneration failed: ${errorMessage}`,
                  timestamp: new Date().toISOString()
                }]
              });

              throw new Error(`Regeneration failed: ${errorMessage}`);
            }

            // Continue polling
            attempts++;
            await new Promise(resolve => setTimeout(resolve, delay));
            delay = Math.min(delay * 1.2, maxDelay);

          } catch (error) {
            console.warn(`⚠️ Regeneration poll attempt ${attempts + 1} failed:`, error.message);
            
            if (attempts >= maxAttempts - 1) {
              throw new Error(`Regeneration polling timeout after ${maxAttempts} attempts: ${error.message}`);
            }
            
            attempts++;
            await new Promise(resolve => setTimeout(resolve, delay));
            delay = Math.min(delay * 1.2, maxDelay);
          }
        }

        throw new Error(`Regeneration polling timeout after ${maxAttempts} attempts`);
      };

      // Start polling
      await pollForRegenCompletion();
      
      console.log(`✅ Section ${section.id} regenerated successfully with async polling`);
      
    } catch (error) {
      console.error(`❌ Error regenerating section ${section.id}:`, error);
      
      // Set section to error state
      const currentSection = generatedStoryline?.sections?.find(s => s.id === section.id);
      const previousTimeline = Array.isArray(currentSection?.statusTimeline) ? currentSection.statusTimeline : [];
      const errorEntry = {
        id: `timeline-error-${Date.now()}`,
        message: `Error regenerating section: ${error.message}`,
        type: 'error',
        timestamp: new Date().toISOString()
      };
      handleSectionUpdate(section.id, {
        isLoading: false,
        status: 'error',
        generationStatus: 'error',
        error: error.message,
        source: 'error-fallback',
        statusTimeline: [...previousTimeline, errorEntry]
      });
    }
  };

  const handleSaveStoryline = async () => {
    console.log('🔍 Save storyline called, generatedStoryline:', generatedStoryline);
    console.log('🔍 Storyline _id:', generatedStoryline?._id);
    
    if (!generatedStoryline) {
      console.log('❌ No storyline to save');
      return;
    }

    setIsSavingStoryline(true);
    try {
      const payload = prepareStorylinePayload(generatedStoryline);
      if (!payload) {
        throw new Error('Unable to prepare storyline data for saving.');
      }

      const sectionCount = payload.sections?.length || 0;
      console.log('🔍 Sanitized storyline sections count:', sectionCount);

      const ALLOWED_PRESENTATION_STYLES = ['consulting', 'academic', 'sales', 'technical', 'strategic'];
      const ALLOWED_COMPLEXITY = ['beginner', 'intermediate', 'advanced', 'expert'];

      const normalizedObjectives = Array.isArray(payload.objectives)
        ? payload.objectives.filter(Boolean).map(item => (typeof item === 'string' ? item.trim() : String(item).trim()))
        : payload.objectives
          ? [payload.objectives].map(item => (typeof item === 'string' ? item.trim() : String(item).trim()))
          : [];

      const normalizedPresentationStyle = ALLOWED_PRESENTATION_STYLES.includes(payload.presentationStyle)
        ? payload.presentationStyle
        : 'consulting';

      const normalizedComplexity = ALLOWED_COMPLEXITY.includes(payload.complexity)
        ? payload.complexity
        : 'intermediate';

      payload.title = payload.title || `Strategic Analysis - ${sectionCount} Framework${sectionCount === 1 ? '' : 's'}`;
      payload.executiveSummary = payload.executiveSummary || '';
      payload.presentationFlow = payload.presentationFlow || '';
      payload.callToAction = payload.callToAction || '';
      payload.topic = payload.topic || '';
      payload.industry = payload.industry || '';
      payload.audience = (payload.audience || []).map(item => (typeof item === 'string' ? item.trim() : String(item).trim())).filter(Boolean);
      payload.objectives = normalizedObjectives.join('; ');
      payload.presentationStyle = normalizedPresentationStyle;
      payload.complexity = normalizedComplexity;
      payload.status = payload.status || 'draft';

      // Normalize section metadata timestamps
      payload.sections = (payload.sections || []).map(section => ({
        ...section,
        isLoading: false,
        updated_at: new Date().toISOString()
      }));

      console.log('🔍 Payload prepared:', {
        title: payload.title,
        sectionCount: payload.sections.length,
        hasDeliverableId: !!selectedItem?._id
      });

      const isExistingStoryline = !!generatedStoryline._id;
      let deliverableIdForPayload = payload.deliverable;

      const executeSave = async () => {
        if (isExistingStoryline) {
          console.log('🔄 Updating existing storyline:', generatedStoryline._id);
          return fetch(`/api/storylines/${generatedStoryline._id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });
        }

        const requestBody = JSON.stringify({
          ...payload,
          deliverable: deliverableIdForPayload
        });

        console.log('➕ Creating storyline for deliverable:', deliverableIdForPayload);
        console.log('🔍 Creating storyline with payload:', requestBody);

        return fetch('/api/storylines', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: requestBody
        });
      };

      // Ensure we have a deliverable ID before first attempt when creating new storyline
      if (!isExistingStoryline) {
        deliverableIdForPayload = deliverableIdForPayload
          || getIdString(
            selectedItem?.metadata?.deliverableId ||
            selectedItem?.metadata?.deliverable_id ||
            selectedItem?._id ||
            selectedItem?.id ||
            generatedStoryline?.deliverable
          );

        if (!deliverableIdForPayload) {
          const createdDeliverable = await createDeliverableForStoryline();
          const resolvedProjectId = createdDeliverable.project || resolveProjectIdForDeliverable();
          deliverableIdForPayload = getIdString(createdDeliverable);
          payload.deliverable = deliverableIdForPayload;
          setGeneratedStoryline(prev => prev ? { ...prev, deliverable: deliverableIdForPayload } : prev);

          if (onItemSelect && selectedItem) {
            onItemSelect({
              ...selectedItem,
              type: 'deliverable',
              _id: deliverableIdForPayload,
              id: deliverableIdForPayload,
              metadata: {
                ...(selectedItem.metadata || {}),
                deliverableId: deliverableIdForPayload,
                deliverable_id: deliverableIdForPayload,
                project_id: resolvedProjectId,
                projectId: resolvedProjectId
              }
            });
          }
        } else {
          payload.deliverable = deliverableIdForPayload;
        }
      }

      let response = await executeSave();

      if (!response.ok && !isExistingStoryline && response.status === 404) {
        console.warn('⚠️ Deliverable not found when saving storyline. Attempting to create deliverable automatically.');
        const createdDeliverable = await createDeliverableForStoryline();
        const resolvedProjectId = createdDeliverable.project || resolveProjectIdForDeliverable();
        deliverableIdForPayload = getIdString(createdDeliverable);
        if (!deliverableIdForPayload) {
          throw new Error('Deliverable creation succeeded but no identifier was returned.');
        }

        payload.deliverable = deliverableIdForPayload;
        setGeneratedStoryline(prev => prev ? { ...prev, deliverable: deliverableIdForPayload } : prev);

        if (onItemSelect && selectedItem) {
          onItemSelect({
            ...selectedItem,
            type: 'deliverable',
            _id: deliverableIdForPayload,
            id: deliverableIdForPayload,
            metadata: {
              ...(selectedItem.metadata || {}),
              deliverableId: deliverableIdForPayload,
              deliverable_id: deliverableIdForPayload,
              project_id: resolvedProjectId,
              projectId: resolvedProjectId
            }
          });
        }

        response = await executeSave();
      }

      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error text:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (parseError) {
          errorData = { error: errorText || 'Unknown error occurred' };
        }
        
        throw new Error(errorData.error || `Failed to save storyline (${response.status})`);
      }

      const result = await response.json();
      console.log('✅ Storyline saved successfully:', result);
      
      const updatedStoryline = result.data || result.storyline || result;
      
      // Update the storyline state with the saved data
      setGeneratedStoryline(prev => ({
        ...prev,
        ...updatedStoryline,
        _id: updatedStoryline._id || prev._id,
        deliverable: updatedStoryline.deliverable || deliverableIdForPayload || prev.deliverable,
        isLocalOnly: false,
        sections: (updatedStoryline.sections || prev.sections || []).map((section, index) =>
          normalizeSectionForState(section, index)
        )
      }));
      
      setStorylineDirty(false);
      
      // Show success message
      alert('Storyline saved successfully!');
      
    } catch (error) {
      console.error('❌ Error saving storyline:', error);
      console.error('❌ Error stack:', error.stack);
      alert(`Failed to save storyline: ${error.message}`);
    } finally {
      setIsSavingStoryline(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field === 'due_date') {
      const normalized = parseDueDateInput(value);
      setFormData(prev => ({ ...prev, due_date: normalized }));
      return;
    }

    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddAudience = () => {
    if (newAudience.trim() && !formData.audience.includes(newAudience.trim())) {
      setFormData(prev => ({
        ...prev,
        audience: [...prev.audience, newAudience.trim()]
      }));
      setNewAudience('');
    }
  };

  const handleRemoveAudience = (audienceToRemove) => {
    setFormData(prev => ({
      ...prev,
      audience: prev.audience.filter(item => item !== audienceToRemove)
    }));
  };

  useEffect(() => {
    // Handle initial view selection for deliverables from URL
    if (selectedItem?.type === 'deliverable' && selectedItem._view) {
      const view = selectedItem._view;
      if (view === 'storyline') {
        setCurrentView('storyline');
      } else if (view === 'layout') {
        setCurrentView('layout');
      } else if (view === 'details') {
        setCurrentView('detailed');
      }
    }
  }, [selectedItem]);

  useEffect(() => {
    if (selectedItem?.type === 'project') {
      const metadata = selectedItem.metadata || {};
      const metadataDeliverables = Array.isArray(metadata.deliverables) ? metadata.deliverables : [];
      const providedDeliverables = Array.isArray(selectedItem.deliverables) ? selectedItem.deliverables : [];
      const menuDeliverables = Array.isArray(selectedItem.children)
        ? selectedItem.children.filter(child => child.type === 'deliverable')
        : [];

      const sourceDeliverables = metadataDeliverables.length > 0
        ? metadataDeliverables
        : providedDeliverables.length > 0
          ? providedDeliverables
          : menuDeliverables;

      const projectId = metadata.project_id || metadata.projectId || selectedItem.metadata?.business_entity_id || selectedItem._id || selectedItem.id;
      const clientId = metadata.client_id || metadata.clientId || selectedItem.client_id || selectedItem.clientId;

      const normalized = normalizeDeliverableList(sourceDeliverables).map((item, index) => ({
        ...item,
        projectId: item.projectId || projectId,
        parentId: item.parentId || projectId,
        clientId: item.clientId || clientId,
        order: item.order ?? index
      }));
      setProjectDeliverables(normalized);
      setIsDeliverablesOpen(true);

      setProjectForm({
        name: selectedItem.name || selectedItem.title || 'Project Overview',
        description: selectedItem.description || metadata.description || '',
        status: selectedItem.status || metadata.status || 'Planning',
        start_date: formatDateForInput(selectedItem.start_date || metadata.start_date),
        end_date: formatDateForInput(selectedItem.end_date || metadata.end_date),
        client_owner: metadata.client_owner || '',
        internal_owner: metadata.internal_owner || '',
        budget_amount: metadata.budget_amount ?? metadata.budget?.amount ?? 0,
        budget_currency: metadata.budget_currency ?? metadata.budget?.currency ?? 'USD',
        budget_type: metadata.budget_type ?? metadata.budget?.type ?? 'Fixed',
        deliverables: normalized
      });

      updateProjectContext({
        id: projectId,
        name: selectedItem.name || metadata.project_name,
        client_name: metadata.client_name || selectedItem.client?.name,
        industry: metadata.industry || selectedItem.industry,
        geography: metadata.geography,
        status: selectedItem.status || metadata.status,
        objectives: metadata.objectives,
        scope: metadata.scope,
        description: selectedItem.description || metadata.description
      });

      // Use the business entity ID (actual project ID) instead of menu item ID
      const businessEntityId = metadata.project_id || metadata.projectId || selectedItem.metadata?.business_entity_id;
      if (businessEntityId) {
        fetchProjectDeliverables(businessEntityId);
      }
    } else {
      setProjectDeliverables([]);
      setIsDeliverablesOpen(true);
      if (selectedItem?.type !== 'deliverable') {
        setProjectContext({ ...EMPTY_PROJECT_CONTEXT });
      }
    }
  }, [selectedItem, normalizeDeliverableList, fetchProjectDeliverables, formatDateForInput, updateProjectContext]);

  // Load existing storyline when selectedItem changes (only if no storyline in state)
  useEffect(() => {
    console.log('🎯 useEffect triggered with selectedItem:', selectedItem);
    console.log('🎯 selectedItem type:', selectedItem?.type);
    console.log('🎯 selectedItem?._id:', selectedItem?._id);
    console.log('🎯 selectedItem?.id:', selectedItem?.id);
    console.log('🎯 Current generatedStoryline exists:', !!generatedStoryline);
    
    // Only load from database if we don't have a storyline in state
    if (generatedStoryline) {
      console.log('🎯 Skipping database load - storyline already exists in state');
      return;
    }
    
    const loadExistingStoryline = async () => {
      if (selectedItem?.type !== 'deliverable') {
        console.log('❌ Early return: not a deliverable');
        return;
      }
      
      if (!selectedItem?._id && !selectedItem?.id) {
        console.log('❌ Early return: no valid selectedItem ID');
        return;
      }
      
      const deliverableId = selectedItem._id || selectedItem.id;
      
      try {
        console.log('🔍 Loading existing storyline for deliverable:', deliverableId);
        
        // Load actual storyline from database
        const response = await fetch(`/api/storylines?deliverableId=${deliverableId}`);
        
        if (response.ok) {
          const result = await response.json();
          
          if (result.ok && result.data.storylines.length > 0) {
            const existingStoryline = result.data.storylines[0];
            console.log('✅ Found existing storyline:', existingStoryline._id);
            console.log('🔧 Storyline sections:', existingStoryline.sections?.length);
            
            // Use the database storyline directly - it already has the right structure
            const convertedStoryline = {
              ...existingStoryline,
              sections: existingStoryline.sections
            };
            
            console.log('🔧 Setting storyline state with', convertedStoryline.sections?.length, 'sections');
            setGeneratedStoryline(convertedStoryline);
            setCurrentSectionIndex(0);
            setStorylineDirty(false);
          } else {
            console.log('📝 No existing storyline found for this deliverable');
            setGeneratedStoryline(null);
          }
        } else {
          console.log('❌ Failed to fetch storylines from API');
          setGeneratedStoryline(null);
        }
      } catch (error) {
        console.error('❌ Error loading existing storyline:', error);
        setGeneratedStoryline(null);
      }
    };

    loadExistingStoryline();
  }, [selectedItem, generatedStoryline]);

  // Fetch actual database data for clients and projects
  useEffect(() => {
    const fetchActualData = async () => {
      if (!selectedItem) {
        setActualClientData(null);
        setActualProjectData(null);
        return;
      }

      setIsLoadingActualData(true);

      try {
        if (selectedItem.type === 'client') {
          const clientId = selectedItem.metadata?.business_entity_id || selectedItem.metadata?.client_id || selectedItem._id || selectedItem.id;
          console.log('🔍 Fetching actual client data for:', clientId);
          
          if (clientId) {
            const response = await fetch(`/api/clients/${clientId}`);
            if (response.ok) {
              const result = await response.json();
              console.log('✅ Fetched actual client data:', result.data?.client);
              setActualClientData(result.data?.client || null);
            } else {
              console.error('❌ Failed to fetch client data:', response.status);
              setActualClientData(null);
            }
          }
        } else if (selectedItem.type === 'project') {
          const projectId = selectedItem.metadata?.business_entity_id || selectedItem.metadata?.project_id || selectedItem._id || selectedItem.id;
          console.log('🔍 Fetching actual project data for:', projectId);
          
          if (projectId) {
            const response = await fetch(`/api/projects/${projectId}`);
            if (response.ok) {
              const projectData = await response.json();
              console.log('✅ Fetched actual project data:', projectData);
              setActualProjectData(projectData);
            } else {
              console.error('❌ Failed to fetch project data:', response.status);
              setActualProjectData(null);
            }
          }
        } else {
          // Clear data for deliverables or other types
          setActualClientData(null);
          setActualProjectData(null);
        }
      } catch (error) {
        console.error('❌ Error fetching actual data:', error);
        setActualClientData(null);
        setActualProjectData(null);
      } finally {
        setIsLoadingActualData(false);
      }
    };

    fetchActualData();
  }, [selectedItem]);

  // Notify parent when view changes
  useEffect(() => {
    if (onViewChange) {
      onViewChange(currentView);
    }
  }, [currentView, onViewChange]);

  // Notify parent when storyline changes
  useEffect(() => {
    if (onStorylineChange) {
      onStorylineChange(generatedStoryline);
    }
  }, [generatedStoryline, onStorylineChange]);

  const handleProjectFormChange = (field, value) => {
    setProjectForm(prev => ({ ...prev, [field]: value }));
  };

  const handleDeliverableTypeChange = (deliverableId, value) => {
    if (!deliverableId) return;

    setProjectDeliverables(prev => (
      Array.isArray(prev)
        ? prev.map(item => (item.id === deliverableId ? { ...item, type: value } : item))
        : prev
    ));

    setProjectForm(prev => ({
      ...prev,
      deliverables: (Array.isArray(prev.deliverables) ? prev.deliverables : []).map(item => (
        (item.id || item._id) === deliverableId
          ? { ...item, type: value }
          : item
      ))
    }));
  };

  const handleRemoveDeliverable = async (deliverableId) => {
    if (!deliverableId) return;

    try {
      // Delete from database first
      const response = await fetch(`/api/deliverables/${deliverableId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        console.error('Failed to delete deliverable from database');
        alert('Failed to delete deliverable');
        return;
      }

      console.log('Deliverable deleted from database successfully');

      // Update UI state only after successful database deletion
      setProjectDeliverables(prev => (
        Array.isArray(prev)
          ? prev.filter(item => item.id !== deliverableId)
          : prev
      ));

      setProjectForm(prev => ({
        ...prev,
        deliverables: (Array.isArray(prev.deliverables) ? prev.deliverables : []).filter(item => (item.id || item._id) !== deliverableId)
      }));

      if (selectedItem?.type === 'deliverable' && (selectedItem.id === deliverableId || selectedItem._id === deliverableId)) {
        onItemSelect?.(null);
      }

      // Refresh data to ensure consistency
      if (refreshFromDatabase) {
        await refreshFromDatabase();
      }
    } catch (error) {
      console.error('Error deleting deliverable:', error);
      alert('Error deleting deliverable');
    }
  };

  const handleDelete = async () => {
    if (!selectedItem || selectedItem.type !== 'deliverable') {
      alert(`Delete is only available for deliverables. Selected item type: ${selectedItem?.type}`);
      return;
    }

    if (window.confirm('Are you sure you want to delete this deliverable?')) {
      try {
        // Extract the correct deliverable ID from metadata
        const deliverableId = selectedItem?.metadata?.deliverableId || 
                             selectedItem?.metadata?.deliverable_id || 
                             selectedItem?.metadata?.business_entity_id || 
                             selectedItem?._id || 
                             selectedItem?.id;
        
        const response = await fetch(`/api/deliverables/${deliverableId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          if (onItemDeleted) {
            onItemDeleted(selectedItem);
          }
          if (onItemSelect) {
            onItemSelect(null);
          }
        } else {
          alert('Failed to delete deliverable');
        }
      } catch (error) {
        console.error('Error deleting deliverable:', error);
        alert('Error deleting deliverable');
      }
    }
  };

  const handleTestBrief = async () => {
    if (isTestingBrief) {
      return;
    }

    const briefToEvaluate = (formData.brief || '').trim();
    if (!briefToEvaluate) {
      alert('Add brief content before testing.');
      return;
    }

    const deliverableId = selectedItem?.type === 'deliverable'
      ? (selectedItem.metadata?.deliverableId || selectedItem.metadata?.deliverable_id || selectedItem.metadata?.business_entity_id || selectedItem._id || selectedItem.id)
      : (selectedItem?._id || selectedItem?.id);

    if (!deliverableId) {
      alert('Unable to resolve the deliverable identifier.');
      return;
    }

    setIsTestingBrief(true);

    try {
      const response = await fetch('/api/ai/score-brief', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deliverableId,
          currentBrief: briefToEvaluate,
          deliverableData: {
            title: formData.name,
            type: formData.type,
            audience: formData.audience,
            priority: selectedItem?.priority || selectedItem?.metadata?.priority,
            dueDate: formData.due_date,
            summary: selectedItem?.description || selectedItem?.summary || ''
          },
          projectData: projectDataForAi
        })
      });

      const result = await response.json();

      if (!response.ok || result?.error) {
        throw new Error(result?.error || result?.details || 'Failed to evaluate brief.');
      }

      const payload = result?.data || result;
      const candidateNodes = collectCandidateNodes(payload);

      const scoreValue = extractNumberFromNodes(candidateNodes, [
        'qualityScore',
        'score',
        'rating',
        'overallScore',
        'briefQuality',
        'quality',
        'total_score'
      ]);

      let strengthsList = extractListFromNodes(candidateNodes, [
        'recognizedStrengths',
        'recognized_strengths',
        'strengths',
        'highlights',
        'positives',
        'whatWentWell'
      ]);

      let improvementsList = extractListFromNodes(candidateNodes, [
        'suggestedImprovements',
        'suggested_improvements',
        'improvements',
        'improvementAreas',
        'improvement_areas',
        'areasForImprovement',
        'areas_for_improvement',
        'gaps',
        'opportunities',
        'nextSteps',
        'recommendedImprovements'
      ]);

      if (!strengthsList.length && payload?.strengths) {
        strengthsList = normalizeInsightList(payload.strengths);
      }
      if (!improvementsList.length && payload?.improvements) {
        improvementsList = normalizeInsightList(payload.improvements);
      }

      // Save to database
      const saveResponse = await fetch(`/api/deliverables/${deliverableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief_quality: scoreValue,
          brief_strengths: strengthsList,
          brief_improvements: improvementsList
        })
      });

      if (!saveResponse.ok) {
        console.error('❌ Failed to save score to database');
      } else {
        const updated = await saveResponse.json();
        
        // Update formData with saved values
        setFormData(prev => ({
          ...prev,
          brief_quality: updated.brief_quality,
          brief_strengths: updated.brief_strengths || [],
          brief_improvements: updated.brief_improvements || []
        }));
        
        console.log('✅ Brief evaluated and saved, score:', updated.brief_quality);
      }
    } catch (error) {
      console.error('❌ Error testing brief:', error);
      alert(error.message || 'Failed to evaluate brief.');
    } finally {
      setIsTestingBrief(false);
    }
  };

  const handleImproveBrief = () => {
    setShowImproveBrief(true);
  };

  const handleResetBrief = () => {
    setFormData(prev => ({
      ...prev,
      brief: '',
      brief_quality: null,
      brief_strengths: [],
      brief_improvements: [],
      recognizedStrengths: [],
      suggestedImprovements: []
    }));
  };

  const handleRefreshBrief = async () => {
    if (!selectedItem) {
      console.error('No deliverable selected to refresh');
      return;
    }

    try {
      console.log('🔄 [REFRESH BRIEF] Starting brief refresh...');
      
      // Extract the correct deliverable ID from metadata
      const deliverableId = selectedItem?.metadata?.deliverableId || 
                           selectedItem?.metadata?.deliverable_id || 
                           selectedItem?.metadata?.business_entity_id || 
                           selectedItem?._id || 
                           selectedItem?.id;

      if (!deliverableId) {
        console.error('❌ No deliverable ID found for refresh');
        alert('Cannot refresh brief: Missing deliverable ID');
        return;
      }

      // Store current brief data
      const currentBrief = formData.brief;
      const currentQuality = formData.brief_quality;
      const currentStrengths = formData.brief_strengths;
      const currentImprovements = formData.brief_improvements;

      console.log('🔄 [REFRESH BRIEF] Current brief data:', {
        brief: currentBrief,
        quality: currentQuality,
        strengths: currentStrengths,
        improvements: currentImprovements
      });

      // Temporarily clear the brief
      setFormData(prev => ({
        ...prev,
        brief: '',
        brief_quality: null,
        brief_strengths: [],
        brief_improvements: []
      }));

      // Wait a moment to ensure state update
      await new Promise(resolve => setTimeout(resolve, 100));

      // Reinsert the same data
      setFormData(prev => ({
        ...prev,
        brief: currentBrief,
        brief_quality: currentQuality,
        brief_strengths: currentStrengths || [],
        brief_improvements: currentImprovements || []
      }));

      console.log('✅ [REFRESH BRIEF] Brief refreshed successfully');

      // Optionally save to database to ensure consistency
      const saveResult = await saveDeliverable({ silent: true });
      if (saveResult) {
        console.log('✅ [REFRESH BRIEF] Brief saved to database');
      } else {
        console.warn('⚠️ [REFRESH BRIEF] Failed to save brief to database');
      }

    } catch (error) {
      console.error('❌ [REFRESH BRIEF] Error refreshing brief:', error);
      alert('Error refreshing brief: ' + error.message);
    }
  };

  const saveDeliverable = async ({ silent = false } = {}) => {
    // Extract the correct deliverable ID from metadata
    const deliverableId = selectedItem?.metadata?.deliverableId || 
                         selectedItem?.metadata?.deliverable_id || 
                         selectedItem?.metadata?.business_entity_id || 
                         selectedItem?._id || 
                         selectedItem?.id;
    
    if (!deliverableId) {
      console.error('No deliverable ID to save');
      if (!silent) {
        alert('No deliverable selected to save.');
      }
      return false;
    }

    if (!silent) {
      setIsSavingDeliverable(true);
    }

    justSavedRef.current = true;
    setTimeout(() => {
      justSavedRef.current = false;
    }, 5000);

    try {
      console.log('💾 [SAVE START] Saving deliverable changes:', formData);
      console.log('💾 [SAVE START] Current brief being saved:', formData.brief);
      console.log('💾 [SAVE START] SelectedItem project info:', {
        project: selectedItem.project,
        project_id: selectedItem.project_id,
        metadata: selectedItem.metadata
      });
      console.log('💾 [SAVE START] Extracted deliverable ID:', deliverableId);
      console.log('💾 [SAVE START] SelectedItem._id (menu item ID):', selectedItem._id);

      const projectId = selectedItem.project || 
                       selectedItem.project_id || 
                       selectedItem.metadata?.project_id || 
                       selectedItem.metadata?.projectId ||
                       selectedItem.parentId; // Also check parentId for project reference

      console.log('💾 [SAVE START] Project ID extraction:', {
        'selectedItem.project': selectedItem.project,
        'selectedItem.project_id': selectedItem.project_id,
        'selectedItem.metadata?.project_id': selectedItem.metadata?.project_id,
        'selectedItem.metadata?.projectId': selectedItem.metadata?.projectId,
        'selectedItem.parentId': selectedItem.parentId,
        'final projectId': projectId
      });

      if (!projectId) {
        console.error('❌ Missing required project ID');
        const message = 'Cannot save: Missing project information. Please refresh the page and try again.';
        if (!silent) {
          alert(message);
        } else {
          console.warn(message);
        }
        return false;
      }

      if (!formData.due_date) {
        console.error('❌ Missing required due_date');
        const message = 'Cannot save: Due date is required. Please set a due date.';
        if (!silent) {
          alert(message);
        } else {
          console.warn(message);
        }
        return false;
      }

      if (!formData.brief || formData.brief.trim() === '') {
        console.error('❌ Missing required brief');
        const message = 'Cannot save: Brief is required. Please add a brief description.';
        if (!silent) {
          alert(message);
        } else {
          console.warn(message);
        }
        return false;
      }

      const payload = {
        name: formData.name,
        brief: formData.brief,
        due_date: formData.due_date ? new Date(formData.due_date) : null,
        ...(projectId && { project: projectId }),
        ...(formData.type && { type: formData.type }),
        ...(Array.isArray(formData.audience) && { audience: formData.audience }),
        ...(formData.priority && { priority: formData.priority }),
        ...(formData.estimated_hours && { estimated_hours: parseInt(formData.estimated_hours) || 0 }),
        ...(formData.notes && { notes: formData.notes }),
        ...(formData.tags && { tags: formData.tags }),
        // Always include brief quality fields (even if null) to ensure they're saved
        brief_quality: normalizeScoreValue(formData.brief_quality),
        brief_strengths: Array.isArray(formData.brief_strengths) ? formData.brief_strengths : [],
        brief_improvements: Array.isArray(formData.brief_improvements) ? formData.brief_improvements : [],
        ...(selectedItem.created_by && { updated_by: selectedItem.created_by }),
        ...(selectedItem.updated_by && !selectedItem.created_by && { updated_by: selectedItem.updated_by })
      };

      console.log('💾 [SAVE API] Payload being sent:', payload);
      console.log('💾 [SAVE API] Brief quality in payload:', payload.brief_quality);
      console.log('💾 [SAVE API] formData.brief_quality before save:', formData.brief_quality);

      const response = await fetch(`/api/deliverables/${deliverableId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const updatedDeliverable = await response.json();
        console.log('✅ [SAVE SUCCESS] Deliverable saved successfully');

        setFormData(prev => {
          const updatedStrengths = normalizeInsightList(
            updatedDeliverable.brief_strengths ??
            updatedDeliverable.strengths ??
            prev.brief_strengths
          );

          const updatedImprovements = normalizeInsightList(
            updatedDeliverable.brief_improvements ??
            updatedDeliverable.improvements ??
            prev.brief_improvements
          );

          return {
            ...prev,
            name: updatedDeliverable.name || prev.name,
            brief: updatedDeliverable.brief,
            due_date: updatedDeliverable.due_date
              ? new Date(updatedDeliverable.due_date).toISOString().split('T')[0]
              : prev.due_date,
            type: updatedDeliverable.type || prev.type,
            priority: updatedDeliverable.priority || prev.priority,
            audience: Array.isArray(updatedDeliverable.audience) ? updatedDeliverable.audience : prev.audience,
            brief_quality: updatedDeliverable.brief_quality ?? prev.brief_quality,
            brief_strengths: updatedStrengths,
            brief_improvements: updatedImprovements
          };
        });

        if (onItemSelect && selectedItem) {
          onItemSelect({
            ...selectedItem,
            ...updatedDeliverable,
            type: 'deliverable',
            metadata: {
              ...(selectedItem.metadata || {}),
              deliverableId: updatedDeliverable._id || updatedDeliverable.id,
              brief: updatedDeliverable.brief,
              due_date: updatedDeliverable.due_date,
              project_id:
                selectedItem.metadata?.project_id ||
                selectedItem.metadata?.projectId ||
                updatedDeliverable.project,
              project_name: selectedItem.metadata?.project_name,
              client_name: selectedItem.metadata?.client_name,
              brief_quality: updatedDeliverable.brief_quality ?? selectedItem.metadata?.brief_quality,
              brief_strengths: normalizeInsightList(updatedDeliverable.brief_strengths ?? updatedDeliverable.strengths ?? []),
              brief_improvements: normalizeInsightList(updatedDeliverable.brief_improvements ?? updatedDeliverable.improvements ?? [])
            }
          });
        }

        if (!silent) {
          alert('Deliverable saved successfully!');
        } else {
          console.log('💾 [AUTO-SAVE] Deliverable saved silently');
        }

        return true;
      }

      let errorMessage = 'Failed to save deliverable changes';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
        console.error('❌ Failed to save deliverable:', errorData);
      } catch (parseError) {
        console.error('❌ Failed to parse error response:', parseError);
      }

      if (!silent) {
        alert(errorMessage);
      } else {
        console.warn('💾 [AUTO-SAVE] Failed to save deliverable:', errorMessage);
      }

      return false;
    } catch (error) {
      console.error('❌ Error saving deliverable:', error);
      if (!silent) {
        alert('Error saving deliverable changes');
      }
      return false;
    } finally {
      if (!silent) {
        setIsSavingDeliverable(false);
      }
    }
  };

  const persistBriefEvaluation = async ({ qualityScore, strengths = [], improvements = [] }) => {
    // This is no longer needed - handleTestBrief now saves directly
    // Keeping for backward compatibility
  };

  const handleBriefSave = async (result) => {
    console.log('');
    console.log('📥 ========== BRIEF SAVE HANDLER CALLED ==========');
    console.log('Result object received:', result);
    console.log('result.brief length:', result.brief?.length);
    console.log('result.qualityScore:', result.qualityScore);
    console.log('result.strengths count:', result.strengths?.length);
    console.log('result.improvements count:', result.improvements?.length);
    console.log('📥 ========== END RESULT ==========');
    console.log('');
    
    // Extract the correct deliverable ID from metadata (same pattern as saveDeliverable)
    const deliverableId = selectedItem?.metadata?.deliverableId || 
                         selectedItem?.metadata?.deliverable_id || 
                         selectedItem?.metadata?.business_entity_id || 
                         selectedItem?._id || 
                         selectedItem?.id;

    if (!deliverableId) {
      console.error('❌ No deliverable ID');
      setShowImproveBrief(false);
      return;
    }

    try {
      console.log('💾 [BRIEF SAVE] Saving to database...');
      console.log('💾 [BRIEF SAVE] Score being saved:', result.qualityScore);
      
      const response = await fetch(`/api/deliverables/${deliverableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief: result.brief,
          brief_quality: result.qualityScore,
          brief_strengths: result.strengths || [],
          brief_improvements: result.improvements || []
        })
      });

      if (!response.ok) throw new Error('Failed to save');

      const updated = await response.json();
      console.log('✅ [BRIEF SAVE] DB returned:', {
        brief_quality: updated.brief_quality,
        brief_strengths_count: updated.brief_strengths?.length,
        brief_improvements_count: updated.brief_improvements?.length
      });
      
      // Force state update
      const newFormData = {
        ...formData,
        brief: updated.brief,
        brief_quality: updated.brief_quality,
        brief_strengths: updated.brief_strengths || [],
        brief_improvements: updated.brief_improvements || []
      };
      
      console.log('📝 [BRIEF SAVE] Setting formData.brief_quality to:', newFormData.brief_quality);
      setFormData(newFormData);

    } catch (error) {
      console.error('❌ [BRIEF SAVE] Failed:', error);
      alert('Failed to save brief: ' + error.message);
    }
    
    setShowImproveBrief(false);
  };

  const handleAddDeliverable = (project) => {
    const businessEntityId = project.metadata?.business_entity_id || 
                            project.metadata?.project_id || 
                            project._id || 
                            project.id;
    setAddItemType('deliverable');
    setParentId(businessEntityId);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setAddItemType(null);
    setParentId(null);
  };

  const handleSaveItem = async (itemData) => {
    try {
      // Refresh the data after creating a deliverable
      if (refreshFromDatabase) {
        await refreshFromDatabase();
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  const handleSaveDeliverable = async (event) => {
    if (event?.preventDefault) {
      event.preventDefault();
    }
    await saveDeliverable({ silent: false });
  };


  const handleGenerateStoryline = async () => {
    console.log('🚀 ===== ENHANCED FRAMEWORK STORYLINE GENERATION STARTED =====');
    console.log('📊 Selected item:', selectedItem);
    console.log('🔍 Item type:', selectedItem?.type);
    
    if (!selectedItem || selectedItem.type !== 'deliverable') {
      alert('Storyline generation is only available for deliverables');
      return;
    }

    // Prevent multiple simultaneous calls
    if (isGeneratingStoryline) {
      console.log('⚠️ Storyline generation already in progress, ignoring duplicate call');
      return;
    }

    setIsGeneratingStoryline(true);
    
    try {
      // Get project and deliverable data
      let deliverableData = { ...selectedItem };
      const metadata = selectedItem.metadata || {};
      const rawDeliverableId = metadata.deliverableId || selectedItem._id || selectedItem.id;
      const deliverableId = getIdString(rawDeliverableId);

      // Fetch deliverable data if needed
      if ((!selectedItem.project && !selectedItem.project_id) && deliverableId && isValidObjectId(deliverableId)) {
        try {
          const deliverableResponse = await fetch(`/api/deliverables/${deliverableId}`);
          if (deliverableResponse.ok) {
            const responseData = await deliverableResponse.json();
            const resolvedData = responseData?.data?.deliverable || responseData?.data || responseData;
            if (resolvedData) {
              deliverableData = { ...deliverableData, ...resolvedData };
            }
          }
        } catch (fetchError) {
          console.warn('❌ Failed to fetch deliverable data:', fetchError);
        }
      }

      // Get project ID
      const projectId = getIdString(
        deliverableData.project ||
        deliverableData.project_id ||
        deliverableData.parentProjectId ||
        deliverableData.parent_project_id ||
        deliverableData.metadata?.parent_project_id ||
        metadata.project_id ||
        metadata.projectId ||
        metadata.project ||
        metadata.parent_project_id ||
        selectedItem.project ||
        selectedItem.project_id ||
        selectedItem.parentProjectId ||
        selectedItem.parentId
      );
      
      if (!projectId || projectId === 'default-project-id') {
        console.warn('⚠️ No valid project ID found, using fallback values for testing');
      }

      // Create ENHANCED sections with taxonomy + 9 frameworks (brief_scorer is internal, not part of storyline)
      const enhancedSections = [
        {
          id: 'framework-1',
          title: 'Market Sizing Analysis',
          description: 'Comprehensive market size assessment and growth projections',
          framework: 'market_sizing',
          status: 'draft',
          isLoading: false,
          generationStatus: 'preparing',
          order: 1,
          phase: 1,
          phaseName: 'Generation will start soon...',
          statusMessage: '🔄 Preparing to generate market sizing analysis',
          keyPoints: [],
          takeaway: '',
          charts: [],
          markdown: '',
          html: ''
        },
        {
          id: 'framework-2', 
          title: 'Competitive Landscape Analysis',
          description: 'Strategic assessment of market competitors and positioning',
          framework: 'competitive_landscape',
          status: 'draft',
          isLoading: false,
          generationStatus: 'preparing',
          order: 2,
          phase: 2,
          phaseName: 'Generation will start soon...',
          statusMessage: '🔄 Preparing to generate competitive landscape analysis',
          keyPoints: [],
          takeaway: '',
          charts: [],
          markdown: '',
          html: ''
        },
        {
          id: 'framework-3',
          title: 'Key Industry Trends Analysis', 
          description: 'Analysis of key industry trends and their implications',
          framework: 'key_industry_trends',
          status: 'draft',
          isLoading: false,
          generationStatus: 'preparing',
          order: 3,
          phase: 3,
          phaseName: 'Generation will start soon...',
          statusMessage: '🔄 Preparing to generate industry trends analysis',
          keyPoints: [],
          takeaway: '',
          charts: [],
          markdown: '',
          html: ''
        },
        {
          id: 'framework-4',
          title: 'Capabilities Assessment',
          description: 'Evaluation of organizational capabilities and competencies',
          framework: 'capabilities_assessment',
          status: 'draft',
          isLoading: false,
          generationStatus: 'preparing',
          order: 4,
          phase: 4,
          phaseName: 'Generation will start soon...',
          statusMessage: '🔄 Preparing to generate capabilities assessment',
          keyPoints: [],
          takeaway: '',
          charts: [],
          markdown: '',
          html: ''
        },
        {
          id: 'framework-5',
          title: 'Competitor Deep Dive Analysis',
          description: 'Detailed analysis of best-in-class competitors',
          framework: 'competitor_deep_dive',
          status: 'draft',
          isLoading: false,
          generationStatus: 'preparing',
          order: 5,
          phase: 5,
          phaseName: 'Generation will start soon...',
          statusMessage: '🔄 Preparing to generate competitor deep dive',
          keyPoints: [],
          takeaway: '',
          charts: [],
          markdown: '',
          html: ''
        },
        {
          id: 'framework-6',
          title: 'Strategic Options Analysis',
          description: 'Evaluation of strategic alternatives and decision framework',
          framework: 'strategic_options',
          status: 'draft',
          isLoading: false,
          generationStatus: 'preparing',
          order: 6,
          phase: 6,
          phaseName: 'Generation will start soon...',
          statusMessage: '🔄 Preparing to generate strategic options',
          keyPoints: [],
          takeaway: '',
          charts: [],
          markdown: '',
          html: ''
        },
        {
          id: 'framework-7',
          title: 'Deep Dive Strategic Option',
          description: 'Detailed analysis of chosen strategic option',
          framework: 'deep_dive_strategic_option',
          status: 'draft',
          isLoading: false,
          generationStatus: 'preparing',
          order: 7,
          phase: 7,
          phaseName: 'Generation will start soon...',
          statusMessage: '🔄 Preparing to generate strategic deep dive',
          keyPoints: [],
          takeaway: '',
          charts: [],
          markdown: '',
          html: ''
        },
        {
          id: 'framework-8',
          title: 'Buy vs Build Analysis',
          description: 'Analysis of sourcing vs development options',
          framework: 'buy_vs_build',
          status: 'draft',
          isLoading: false,
          generationStatus: 'preparing',
          order: 8,
          phase: 8,
          phaseName: 'Generation will start soon...',
          statusMessage: '🔄 Preparing to generate buy vs build analysis',
          keyPoints: [],
          takeaway: '',
          charts: [],
          markdown: '',
          html: ''
        },
        {
          id: 'framework-9',
          title: 'Product Roadmap',
          description: 'Strategic product roadmap and implementation plan',
          framework: 'product_roadmap',
          status: 'draft',
          isLoading: false,
          generationStatus: 'preparing',
          order: 9,
          phase: 9,
          phaseName: 'Generation will start soon...',
          statusMessage: '🔄 Preparing to generate product roadmap',
          keyPoints: [],
          takeaway: '',
          charts: [],
          markdown: '',
        html: ''
      }
      ].map(section => ({
        ...section,
        statusTimeline: Array.isArray(section.statusTimeline) ? section.statusTimeline : []
      }));

      // Create initial storyline with preparing sections
      const initialStoryline = {
        title: 'Strategic Analysis Framework',
        sections: enhancedSections,
        executiveSummary: '',
        presentationFlow: '',
        callToAction: '',
        totalSections: 9,
        estimatedDuration: 30,
        generatedAt: new Date().toISOString(),
        source: 'enhanced-framework-orchestrator',
        currentPhase: 0,
        phaseStatus: 'preparing',
        globalStatus: 'Preparing to generate sections'
      };

      setGeneratedStoryline(initialStoryline);
      setStorylineDirty(true);
      setCurrentView('storyline');
      
      console.log('✅ Initial storyline created with waiting sections');
      console.log('📊 Initial storyline sections:', initialStoryline.sections.map(s => ({
        id: s.id,
        title: s.title,
        framework: s.framework,
        isLoading: s.isLoading,
        generationStatus: s.generationStatus
      })));

      // Prepare context data for all framework calls with fallback values
      const contextData = {
        projectId: projectId || 'default-project-id',
        projectName: formData?.name || selectedItem?.projectName || 'Strategic Analysis',
        clientName: selectedItem?.client?.name || 'Client',
        industry: metadata?.industry || 'financial-services',
        projectDescription: formData?.brief || deliverableData?.brief || 'Strategic analysis and recommendations',
        deliverableId: deliverableId || 'default-deliverable-id',
        deliverableName: deliverableData?.name || formData?.name || 'Strategic Analysis',
        deliverableBrief: deliverableData?.brief || formData?.brief || 'Strategic analysis and recommendations',
        geography: 'Global'
      };
      
      console.log('📋 Context Data prepared:', contextData);
      
      // Generate section content function with async polling for storyline generation
      const generateSectionContent = async (framework, dependencies, sectionIndex, contextData) => {
        const shouldUpdateStoryline = typeof sectionIndex === 'number' && sectionIndex >= 0;
        try {
          console.log(`🚀 ===== ASYNC STORYLINE GENERATION: ${framework} =====`);

          // Mark section as starting async generation
          if (shouldUpdateStoryline) {
            setGeneratedStoryline(prev => {
              if (!prev) return prev;
              const updatedSections = prev.sections.map(section => {
                if (section.framework !== framework) {
                  return section;
                }

                return {
                  ...section,
                  isLoading: true,
                  generationStatus: 'starting',
                  phaseName: 'Starting async storyline generation...',
                  progress: 0,
                  narratives: [],
                  statusTimeline: [{
                    id: `storyline_start_${Date.now()}`,
                    type: 'info',
                    message: `Starting async generation for ${framework}...`,
                    timestamp: new Date().toISOString()
                  }]
                };
              });

              return { ...prev, sections: updatedSections };
            });
          }
          
          // Build dependency data for this framework (use current storyline state)
          const computedDependencies = buildDependencyData(framework, generatedStoryline?.sections || []);
          const dependencyPayload = {
            ...computedDependencies,
            ...dependencies
          };

          if (framework !== 'taxonomy' && taxonomyDataRef.current && TAXONOMY_DEPENDENT_FRAMEWORKS.has(framework) && !dependencyPayload.taxonomy) {
            dependencyPayload.taxonomy = taxonomyDataRef.current;
          }

          console.log(`🔗 Merged dependencies for ${framework}:`, Object.keys(dependencyPayload));

          // Get framework-specific agent ID
          const agentId = FRAMEWORK_AGENT_MAPPING[framework];
          if (!agentId) {
            throw new Error(`No agent configured for framework: ${framework}`);
          }

          // Build proper orchestrator payload for storyline generation
          const projectData = {
            name: contextData.projectName,
            description: contextData.projectDescription,
            industry: contextData.industry,
            id: contextData.projectId || 'project-1',
            client_name: contextData.clientName
          };

          const deliverableData = {
            brief: contextData.projectDescription,
            brief_quality: formData.brief_quality,
            title: contextData.deliverableName,
            type: formData.type,
            industry: contextData.industry,
            audience: formData.audience,
            objectives: formData.objectives,
            name: contextData.deliverableName || 'Strategic Analysis'
          };

          const clientData = {
            name: contextData.clientName,
            industry: contextData.industry,
            geography: contextData.geography || 'Switzerland'
          };

          const orchestratorPayload = buildOrchestratorPayload(
            framework, 
            dependencyPayload, 
            projectData, 
            deliverableData, 
            clientData, 
            contextData.projectDescription
          );

          console.log(`🤖 Using agent ID for ${framework} storyline:`, agentId);
          console.log(`📋 Storyline orchestrator payload:`, JSON.stringify(orchestratorPayload, null, 2));

          // Step 1: Start async execution with direct agent call
          const asyncResponse = await fetch('/api/ai/direct/async-execute', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              agentId: agentId,
              ...orchestratorPayload
            })
          });

          if (!asyncResponse.ok) {
            const errorData = await asyncResponse.json();
            throw new Error(errorData.error || `Failed to start async storyline generation for ${framework}: ${asyncResponse.status}`);
          }

          const asyncResult = await asyncResponse.json();
          const executionId = asyncResult.executionId;
          
          if (!executionId) {
            throw new Error('No execution ID returned from async storyline generation start');
          }

          console.log(`🔍 Starting storyline polling for ${framework} execution: ${executionId}`);

          // Update section with execution ID and polling status
          if (shouldUpdateStoryline) {
            setGeneratedStoryline(prev => {
              if (!prev) return prev;
              const updatedSections = prev.sections.map(section => {
                if (section.framework === framework) {
                  return {
                    ...section,
                    generationStatus: 'in_progress',
                    phaseName: 'Polling for storyline progress...',
                    executionId,
                    progress: 0,
                    narratives: [],
                    statusTimeline: [{
                      id: `storyline_polling_${Date.now()}`,
                      type: 'info',
                      message: `Started storyline polling ${executionId}`,
                      timestamp: new Date().toISOString()
                    }]
                  };
                }
                return section;
              });
              return { ...prev, sections: updatedSections };
            });
          }

          // Step 2: Poll for completion with live storyline updates
          const pollForStorylineCompletion = async () => {
            let attempts = 0;
            const maxAttempts = 60;
            let delay = 3000;
            const maxDelay = 10000;

            while (attempts < maxAttempts) {
              try {
                const statusResponse = await fetch(`/api/ai/direct/status/${executionId}`);
                
                if (!statusResponse.ok) {
                  throw new Error(`Storyline status check failed: ${statusResponse.status}`);
                }

                const statusData = await statusResponse.json();
                const status = statusData.status;
                const progress = statusData.progress || 0;
                const narratives = statusData.data?.narrative || [];
                
                console.log(`📊 Storyline Poll ${attempts + 1} for ${framework}: ${status} (${progress}%)`);
                console.log(`📖 Storyline Narratives:`, narratives);

                // Update section with live progress and narratives
                if (shouldUpdateStoryline) {
                  setGeneratedStoryline(prev => {
                    if (!prev) return prev;
                    const updatedSections = prev.sections.map(section => {
                      if (section.framework === framework) {
                        // Filter repetitive AI iteration messages for storyline
                        const filteredNarratives = narratives.filter(narrative => 
                          !narrative.includes('Calling Openai (openai/gpt-4.1) - Iteration 2') &&
                          !narrative.includes('Calling Openai (openai/gpt-4.1) - Iteration 3') &&
                          !narrative.includes('Calling Openai (openai/gpt-4.1) - Iteration 4')
                        );
                        
                        const currentNarratives = filteredNarratives.map((narrative, index) => ({
                          id: `storyline_narrative_${index}`,
                          type: 'progress',
                          message: narrative,
                          timestamp: new Date().toISOString()
                        }));

                        return {
                          ...section,
                          progress,
                          narratives: currentNarratives,
                          phaseName: narratives.length > 0 ? narratives[narratives.length - 1] : `Generating ${framework}...`,
                          statusTimeline: [{
                            id: `storyline_progress_${Date.now()}`,
                            type: 'progress',
                            message: `Storyline Progress: ${progress}% - ${narratives.length > 0 ? narratives[narratives.length - 1] : 'Processing...'}`,
                            timestamp: new Date().toISOString()
                          }]
                        };
                      }
                      return section;
                    });
                    return { ...prev, sections: updatedSections };
                  });
                }

                // Check for completion
                if (status === 'completed' || status === 'complete') {
                  console.log(`✅ Storyline generation completed for ${framework}`);
                  
                  console.log(`📋 STORYLINE Full statusData structure:`, JSON.stringify(statusData, null, 2));
                  console.log(`📋 STORYLINE statusData.data:`, statusData.data);
                  console.log(`📋 STORYLINE statusData.data.result:`, statusData.data?.result);
                  console.log(`📋 STORYLINE statusData.data.result.response:`, statusData.data?.result?.response);
                  
                  const result = statusData.data?.result || statusData.data;
                  let sectionData = result || {};
                  
                  console.log(`📋 STORYLINE Extracted result:`, result);
                  console.log(`📋 STORYLINE result.response type:`, typeof result?.response);
                  
                  // Handle cases where content is in result.response as JSON string
                  if (result?.response && typeof result.response === 'string') {
                    console.log(`🔍 STORYLINE Found result.response as string, parsing JSON...`);
                    console.log(`📋 STORYLINE Raw response string:`, result.response.substring(0, 200) + '...');
                    
                    try {
                      const parsedResponse = JSON.parse(result.response);
                      console.log(`✅ STORYLINE Successfully parsed JSON response:`, parsedResponse);
                      
                      // Handle different response formats
                      let frameworkData;
                      
                      if (parsedResponse[framework]) {
                        // Expected format: {framework: {slide_content: ...}}
                        frameworkData = parsedResponse[framework];
                        console.log(`📋 STORYLINE Found framework-specific data for ${framework}:`, frameworkData);
                      } else if (parsedResponse.storyline && Array.isArray(parsedResponse.storyline)) {
                        // Storyline array format: {storyline: [{title, content}...]}
                        console.log(`📋 STORYLINE Found storyline array format, converting to slide_content structure`);
                        frameworkData = {
                          slide_content: {
                            title: `${framework.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Analysis`,
                            slides: parsedResponse.storyline,
                            sections: parsedResponse.storyline.map((slide, index) => ({
                              id: `slide_${index}`,
                              title: slide.title || slide.name || `Section ${index + 1}`,
                              content: Array.isArray(slide.content) ? slide.content : [slide.content || slide.text || slide.description || '']
                            }))
                          },
                          insights: parsedResponse.insights || parsedResponse.key_insights || [],
                          citations: parsedResponse.citations || parsedResponse.sources || []
                        };
                      } else if (parsedResponse.slides && Array.isArray(parsedResponse.slides)) {
                        // Alternative format: {slides: [{title, content}...]}
                        console.log(`📋 STORYLINE Found slides array format, converting to slide_content structure`);
                        frameworkData = {
                          slide_content: {
                            title: `${framework.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Analysis`,
                            slides: parsedResponse.slides,
                            sections: parsedResponse.slides.map((slide, index) => ({
                              id: `slide_${index}`,
                              title: slide.title,
                              content: Array.isArray(slide.content) ? slide.content : [slide.content]
                            }))
                          },
                          insights: parsedResponse.insights || parsedResponse.key_insights || [],
                          citations: parsedResponse.citations || parsedResponse.sources || []
                        };
                      } else {
                        // Fallback: use entire parsed response
                        frameworkData = parsedResponse;
                        console.log(`📋 STORYLINE Using entire parsed response as framework data`);
                      }
                      
                      sectionData = frameworkData;
                      console.log(`📋 STORYLINE Final extracted framework data for ${framework}:`, frameworkData);
                    } catch (parseError) {
                      console.warn(`⚠️ STORYLINE Failed to parse response JSON for ${framework}:`, parseError);
                      console.warn(`📋 STORYLINE Raw response content (first 200 chars):`, result.response.substring(0, 200));
                      
                      // Handle plain text responses by creating proper structure
                      sectionData = {
                        slide_content: {
                          title: `${framework.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Analysis`,
                          content: result.response,
                          text: result.response
                        },
                        insights: [],
                        citations: [],
                        rawResponse: result.response
                      };
                    }
                  } else {
                    console.log(`📋 STORYLINE No result.response string found, using result directly:`, result);
                  }
                  
                  // Update taxonomy ref for dependencies
                  if (framework === 'taxonomy') {
                    taxonomyDataRef.current = sectionData;
                  }

                  // Update section with final storyline content
                  if (shouldUpdateStoryline) {
                    console.log(`🔄 STORYLINE Starting section content conversion for ${framework}`);
                    console.log(`📋 STORYLINE Raw sectionData to convert:`, JSON.stringify(sectionData, null, 2));
                    console.log(`📋 STORYLINE sectionData keys:`, Object.keys(sectionData));
                    
                    setGeneratedStoryline(prev => {
                      if (!prev) return prev;
                      const updatedSections = prev.sections.map(section => {
                        if (section.framework === framework) {
                          console.log(`📋 STORYLINE Converting section for framework ${framework}`);
                          console.log(`📋 STORYLINE Original section before update:`, section);
                          
                          // Extract content with multiple fallback paths
                          const extractedSlideContent = sectionData.slide_content || 
                                                       sectionData.content || 
                                                       sectionData.slideContent ||
                                                       sectionData.sectionContent ||
                                                       sectionData.section_content ||
                                                       section.slide_content;
                          
                          const extractedInsights = sectionData.insights || 
                                                  sectionData.key_insights || 
                                                  sectionData.summary_insights ||
                                                  section.insights || [];
                          
                          const computedTitle = sectionData?.sectionContent?.title
                            || sectionData?.slideContent?.title
                            || sectionData?.slide_content?.title
                            || sectionData?.title
                            || extractedSlideContent?.title
                            || section.title;
                          
                          console.log(`📋 STORYLINE Extracted slide_content:`, extractedSlideContent);
                          console.log(`📋 STORYLINE Extracted insights:`, extractedInsights);
                          console.log(`📋 STORYLINE Computed title:`, computedTitle);
                          
                          const convertedSection = {
                            ...section,
                            ...sectionData,
                            title: computedTitle,
                            isLoading: false,
                            generationStatus: 'completed',
                            status: 'draft',
                            progress: 100,
                            phaseName: 'Storyline Completed',
                            source: 'framework-agent-async-storyline',
                            slide_content: extractedSlideContent,
                            slideContent: extractedSlideContent, // Add camelCase version for compatibility
                            sectionContent: {
                              slideContent: extractedSlideContent // Add nested structure for layout view
                            },
                            insights: extractedInsights,
                           citations: sectionData.citations || sectionData.sources || section.citations || [],
                           charts: sectionData.charts || section.charts || [],
                           takeaway: sectionData.takeaway || sectionData.summary || section.takeaway || '',
                           notes: sectionData.notes || section.notes || '',
                           rawAgentResponse: result,
                           rawResponse: result?.response,
                            statusTimeline: [],
                            debugInfo: {
                              executionId,
                              framework,
                              sectionIndex,
                              timestamp: new Date().toISOString(),
                              source: 'async_storyline_polling'
                            }
                          };
                          
                      console.log(`✅ STORYLINE Final converted section for ${framework}:`, JSON.stringify(convertedSection, null, 2));
                      console.log(`📋 STORYLINE Final section title:`, convertedSection.title);
                      console.log(`📋 STORYLINE Final section slide_content:`, convertedSection.slide_content);
                      console.log(`📋 STORYLINE Final section slideContent:`, convertedSection.slideContent);
                      console.log(`📋 STORYLINE Final section sectionContent:`, convertedSection.sectionContent);
                      console.log(`📋 STORYLINE Final section insights:`, convertedSection.insights);
                          
                          return convertedSection;
                        }
                        return section;
                      });
                      
                      console.log(`📋 STORYLINE Updated sections array:`, updatedSections.map(s => ({ 
                        id: s.id, 
                        framework: s.framework, 
                        title: s.title,
                        hasSlideContent: !!s.slide_content,
                        hasSlideContentCamel: !!s.slideContent,
                        hasSectionContent: !!s.sectionContent?.slideContent,
                        insightsCount: s.insights?.length || 0
                      })));
                      
                      const updatedStoryline = { ...prev, sections: updatedSections };
                      console.log(`📋 STORYLINE Final updated storyline:`, updatedStoryline);
                      
                      // Auto-save the storyline after successful generation
                      setTimeout(() => {
                        console.log(`💾 Auto-saving storyline after ${framework} completion...`);
                        handleSaveStoryline();
                      }, 1000);
                      
                      return updatedStoryline;
                    });
                  }

                  return sectionData;
                }

                // Check for failure
                if (status === 'failed' || status === 'error') {
                  const errorMessage = statusData.data?.error || statusData.error || 'Storyline generation failed';
                  
                  if (shouldUpdateStoryline) {
                    setGeneratedStoryline(prev => {
                      if (!prev) return prev;
                      const updatedSections = prev.sections.map(section => {
                        if (section.framework === framework) {
                          return {
                            ...section,
                            isLoading: false,
                            generationStatus: 'failed',
                            progress: 0,
                            phaseName: 'Storyline Generation Failed',
                            statusTimeline: [{
                              id: `storyline_failed_${Date.now()}`,
                              type: 'error',
                              message: `Storyline generation failed for ${framework}: ${errorMessage}`,
                              timestamp: new Date().toISOString()
                            }]
                          };
                        }
                        return section;
                      });
                      return { ...prev, sections: updatedSections };
                    });
                  }

                  throw new Error(`Storyline generation failed for ${framework}: ${errorMessage}`);
                }

                // Continue polling
                attempts++;
                await new Promise(resolve => setTimeout(resolve, delay));
                delay = Math.min(delay * 1.2, maxDelay);

              } catch (error) {
                console.warn(`⚠️ Storyline poll attempt ${attempts + 1} failed for ${framework}:`, error.message);
                
                if (attempts >= maxAttempts - 1) {
                  throw new Error(`Storyline polling timeout after ${maxAttempts} attempts for ${framework}: ${error.message}`);
                }
                
                attempts++;
                await new Promise(resolve => setTimeout(resolve, delay));
                delay = Math.min(delay * 1.2, maxDelay);
              }
            }

            throw new Error(`Storyline polling timeout after ${maxAttempts} attempts for ${framework}`);
          };

          // Start polling and return the result
          return await pollForStorylineCompletion();
        } catch (error) {
          console.error(`❌ Error generating content for ${framework}:`, error);
          
          // Update section with error state
          if (shouldUpdateStoryline) {
            setGeneratedStoryline(prev => {
              if (!prev) return null;
              const updatedSections = prev.sections.map(section => {
                if (section.framework === framework) {
                  const previousTimeline = Array.isArray(section.statusTimeline) ? section.statusTimeline : [];
                  const errorEntry = {
                    id: `timeline-error-${Date.now()}`,
                    message: `Error generating section: ${error.message}`,
                    type: 'error',
                    timestamp: new Date().toISOString()
                  };
                  return {
                    ...section,
                    isLoading: false,
                    generationStatus: 'error',
                    status: 'error',
                    error: error.message,
                    source: 'error-fallback',
                    statusTimeline: [...previousTimeline, errorEntry]
                  };
                }
                return section;
              });
              return { ...prev, sections: updatedSections };
            });
          }
          
          throw error;
        }
      };
      
      // Start ENHANCED generation with improved dependency logic
      console.log('🎭 Starting ENHANCED framework generation with improved dependencies...');
      
      // Phase 0: Taxonomy (no dependencies)
      console.log('📊 === PHASE 0: TAXONOMY ===');
      
      // Update global status for taxonomy generation (taxonomy is not part of sections array)
      setGeneratedStoryline(prev => prev ? {
        ...prev,
        globalStatus: 'Generating taxonomy'
      } : prev);
      
      const taxonomyResult = await generateSectionContent('taxonomy', {}, -1, contextData);
      taxonomyDataRef.current = taxonomyResult;
      setGeneratedStoryline(prev => (prev ? { ...prev, taxonomy: taxonomyResult } : prev));

      // Update taxonomy completion status
      setGeneratedStoryline(prev => prev ? {
        ...prev,
        globalStatus: 'Taxonomy generated'
      } : prev);

      // Update global status to show generation is now starting
      setGeneratedStoryline(prev => prev ? {
        ...prev,
        globalStatus: 'Generating sections',
        sections: prev.sections.map(section => ({
          ...section,
          generationStatus: 'starting',
          statusMessage: ''
        }))
      } : prev);

      // Phase 1: Market Sizing (depends on taxonomy)
      console.log('📊 === PHASE 1: MARKET SIZING ===');
      const marketResult = await generateSectionContent('market_sizing', { taxonomy: taxonomyResult }, 0, contextData);
      
      // Phase 2: Competitive Landscape (depends on taxonomy + market_sizing)
      console.log('📊 === PHASE 2: COMPETITIVE LANDSCAPE ===');
      const competitiveResult = await generateSectionContent('competitive_landscape', { taxonomy: taxonomyResult, market_sizing: marketResult }, 1, contextData);
      
      // Phase 3: Key Industry Trends (no dependencies)
      console.log('📊 === PHASE 3: KEY INDUSTRY TRENDS ===');
      const trendsResult = await generateSectionContent('key_industry_trends', {}, 2, contextData);
      
      // Phase 4: Capabilities Assessment (depends on market_sizing + competitive_landscape)
      console.log('📊 === PHASE 4: CAPABILITIES ASSESSMENT ===');
      const capabilitiesResult = await generateSectionContent('capabilities_assessment', {
        market_sizing: marketResult,
        competitive_landscape: competitiveResult
      }, 3, contextData);
      
      // Phase 5: Competitor Deep Dive (depends on capabilities_assessment + competitive_landscape)
      console.log('📊 === PHASE 5: COMPETITOR DEEP DIVE ===');
      const competitorResult = await generateSectionContent('competitor_deep_dive', {
        capabilities_assessment: capabilitiesResult,
        competitive_landscape: competitiveResult
      }, 4, contextData);
      
      // Phase 6: Strategic Options (depends on key_industry_trends + capabilities_assessment)
      console.log('📊 === PHASE 6: STRATEGIC OPTIONS ===');
      const strategicResult = await generateSectionContent('strategic_options', {
        key_industry_trends: trendsResult,
        capabilities_assessment: capabilitiesResult
      }, 5, contextData);
      
      // Phase 7: Deep Dive Strategic Option (depends on strategic_options)
      console.log('📊 === PHASE 7: DEEP DIVE STRATEGIC OPTION ===');
      const deepDiveResult = await generateSectionContent('deep_dive_strategic_option', {
        strategic_options: strategicResult
      }, 6, contextData);
      
      // Phase 8: Buy vs Build (depends on deep_dive_strategic_option)
      console.log('📊 === PHASE 8: BUY VS BUILD ===');
      const buyVsBuildResult = await generateSectionContent('buy_vs_build', {
        deep_dive_strategic_option: deepDiveResult
      }, 7, contextData);
      
      // Phase 9: Product Roadmap (depends on buy_vs_build)
      console.log('📊 === PHASE 9: PRODUCT ROADMAP ===');
      const roadmapResult = await generateSectionContent('product_roadmap', {
        buy_vs_build: buyVsBuildResult
      }, 8, contextData);
      
      console.log('✅ All ENHANCED framework sections completed');
      
      // Update storyline with completion status (keep as draft, user will lock when ready)
      setGeneratedStoryline(prev => {
        if (!prev) return null;
        const updatedSections = prev.sections.map(section => ({
          ...section,
          isLoading: false,
          generationStatus: 'completed',
          status: 'draft', // Keep as draft, user will lock when satisfied
          phaseName: section.phaseName?.replace('Generation will start soon...', 'Completed') || 'Completed',
          statusMessage: `✅ ${section.title} generation completed successfully`
        }));
        return { 
          ...prev, 
          sections: updatedSections,
          globalStatus: '✅ All sections generated successfully! Ready for review.'
        };
      });
      
      setStorylineDirty(true);

    } catch (error) {
      console.error('❌ Error generating storyline:', error);
      const errorMessage = error.message || error.toString() || 'Unknown error occurred';
      alert(`Failed to generate storyline: ${errorMessage}`);
    } finally {
      setIsGeneratingStoryline(false);
    }
  };

  const handleGenerateSlidesForStoryline = async () => {
    if (!selectedItem || selectedItem.type !== 'deliverable') {
      alert('Slide generation is only available for deliverables.');
      return;
    }

    if (!generatedStoryline || !Array.isArray(generatedStoryline.sections) || generatedStoryline.sections.length === 0) {
      alert('No storyline sections found. Generate a storyline before creating slides.');
      return;
    }

    const sections = generatedStoryline.sections || [];
    const sectionsToProcess = sections.filter(section => !Array.isArray(section.slides) || section.slides.length === 0);

    if (!sectionsToProcess.length) {
      alert('Slides already exist for all sections. Use the Layout tab to regenerate specific sections.');
      return;
    }

    setIsGeneratingSlides(true);
    setSlideGenerationProgress({ completed: 0, total: sectionsToProcess.length });

    const sectionUpdates = new Map();
    const failures = [];
    let completed = 0;

    try {
      for (const section of sectionsToProcess) {
        const sectionId = section.id || section._id || section.title || `section_${completed + 1}`;
        const layoutForSection = section.layout || selectedLayout || 'full-width';
        const sectionKey = section.id || section._id || section.title || sectionId;

        try {
          const response = await fetch('/api/ai/generate-slides', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              sectionId,
              section,
              storyline: {
                id: generatedStoryline._id || generatedStoryline.id,
                title: generatedStoryline.title,
                description: generatedStoryline.description,
                sectionsCount: sections.length
              },
              layout: layoutForSection
            })
          });

          const result = await response.json();

          if (!response.ok || result?.error) {
            throw new Error(result?.error || 'Failed to generate slides for this section.');
          }

          const slidesPayload = Array.isArray(result?.data?.slides)
            ? result.data.slides
            : Array.isArray(result?.slides)
              ? result.slides
              : [];

          const normalizedSlides = slidesPayload.map((slide, index) => normalizeSlideForState(slide, index, layoutForSection));

          if (!normalizedSlides.length) {
            throw new Error('Slide generation completed without returning any slide content.');
          }

          const generatedAt = new Date().toISOString();

          sectionUpdates.set(sectionKey, {
            slides: normalizedSlides,
            slidesGeneratedAt: generatedAt,
            slidesGenerationContext: {
              source: result?.source || 'custom-agent',
              agentId: result?.agentId,
              generatedAt,
              ...result?.metadata
            }
          });
        } catch (error) {
          console.error(`❌ Slide generation failed for section ${section.title || sectionId}:`, error);
          failures.push({ sectionId, message: error.message || 'Unknown error' });
        } finally {
          completed += 1;
          setSlideGenerationProgress({ completed, total: sectionsToProcess.length });
        }
      }

      setGeneratedStoryline(prev => {
        if (!prev) return prev;

        const mergedSections = (prev.sections || []).map(prevSection => {
          const prevKey = prevSection.id || prevSection._id || prevSection.title || '';
          const update = sectionUpdates.get(prevKey);
          if (update) {
            return {
              ...prevSection,
              ...update
            };
          }
          return prevSection;
        });

        return {
          ...prev,
          sections: mergedSections
        };
      });

      if (sectionUpdates.size > 0) {
        setStorylineDirty(true);
      }

      if (failures.length) {
        alert(`Slides generated with ${failures.length} issue${failures.length === 1 ? '' : 's'}. Check console for details.`);
      } else {
        console.log('✅ Slides generated for all sections without slides.');
      }
    } catch (error) {
      console.error('❌ Error generating slides for storyline:', error);
      alert(error.message || 'Failed to generate slides for the storyline.');
    } finally {
      setIsGeneratingSlides(false);
      setSlideGenerationProgress({ completed: 0, total: 0 });
    }
  };

  const handleRegenerateStoryline = async (options = {}) => {
    if (!selectedItem || selectedItem.type !== 'deliverable') {
      alert('Storyline regeneration is only available for deliverables');
      return;
    }

    // Prevent multiple simultaneous calls
    if (isGeneratingStoryline) {
      console.log('⚠️ Storyline generation already in progress, ignoring duplicate regeneration call');
      return;
    }

    if (!generatedStoryline) {
      alert('No existing storyline to regenerate. Please generate a storyline first.');
      return;
    }

    setIsGeneratingStoryline(true);

    try {
      console.log('🔄 Starting storyline regeneration...', {
        storylineId: generatedStoryline._id,
        options
      });

      const storylineId = getIdString(generatedStoryline._id || generatedStoryline.id);
      if (!storylineId || !isValidObjectId(storylineId)) {
        throw new Error('Please save the storyline before regenerating so it has a valid ID.');
      }

      const storylinePayload = prepareStorylinePayload(generatedStoryline);
      const { lockedSections, draftSections } = filterSectionsForRegeneration(storylinePayload);

      if (draftSections.length === 0) {
        alert('All sections are locked or final. Unlock sections before regenerating.');
        setIsGeneratingStoryline(false);
        return;
      }

      const regenerationPayload = createRegenerationPayload(
        storylinePayload,
        draftSections,
        lockedSections
      );

      const backup = createStorylineBackup(storylinePayload);

      const response = await fetch('/api/storyline/regenerate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          storylineId,
          regenerationPayload,
          backup
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const detail = errorData.details ? ` Details: ${errorData.details}` : '';
        throw new Error((errorData.error || `Regeneration failed: ${response.statusText}`) + detail);
      }

      const result = await response.json();
      if (!result.success) {
        const detail = result.details ? ` Details: ${result.details}` : '';
        throw new Error((result.error || 'Regeneration failed') + detail);
      }

      const regeneratedStoryline = result.storyline || {};
      setGeneratedStoryline({
        ...regeneratedStoryline,
        sections: (regeneratedStoryline.sections || []).map((section, index) =>
          normalizeSectionForState(section, index)
        )
      });
      setStorylineDirty(true);

      const totalSections = regeneratedStoryline.sections?.length || 0;
      const lockedCount = regeneratedStoryline.sections?.filter((s) => s.locked).length || 0;
      const regeneratedCount = totalSections - lockedCount;

      alert(
        `Storyline regenerated successfully!\n\n` +
        `• ${lockedCount} section${lockedCount === 1 ? '' : 's'} preserved (locked)\n` +
        `• ${regeneratedCount} section${regeneratedCount === 1 ? '' : 's'} regenerated\n\n` +
        `Remember to save your changes.`
      );
    } catch (error) {
      console.error('❌ Error regenerating storyline:', error);
      const errorMessage = error.message || error.toString() || 'Unknown error occurred';
      alert(`Failed to regenerate storyline: ${errorMessage}`);
    } finally {
      setIsGeneratingStoryline(false);
    }
  };

  const handleResetStoryline = async () => {
    if (!selectedItem || selectedItem.type !== 'deliverable') {
      return;
    }

    const deliverableId = selectedItem._id || selectedItem.id;
    if (!deliverableId) return;

    setShowResetConfirm(true);
  };

  // Handle different content types
  if (!selectedItem) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-gray-50 content-part">
        <div className="text-center text-gray-500">
          <p className="text-lg mb-2">Select an item from the menu</p>
          <p className="text-sm">Choose a client, project, or deliverable to view details</p>
        </div>
      </div>
    );
  }

  if (selectedItem.type === 'client') {
    // Show loading state while fetching actual client data
    if (isLoadingActualData) {
      return (
        <div className="flex-1 h-full flex items-center justify-center content-part">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading client data...</p>
          </div>
        </div>
      );
    }

    // Use actual client data if available, fallback to menu item structure
    const clientToUse = actualClientData || selectedItem;
    
    return (
      <div className="flex-1 h-full p-6 flex flex-col min-h-0 content-part">
        <ClientDetailView 
          client={clientToUse}
          clientMenuItemId={selectedItem.id || selectedItem._id}
          onUpdate={async (updatedClient) => {
            console.log('🔧 ContentPart: onUpdate called with:', updatedClient);
            try {
              // Get the business entity ID for the API call
              const clientId = updatedClient.metadata?.business_entity_id || 
                              updatedClient.metadata?.client_id || 
                              updatedClient.id || 
                              updatedClient._id;
              
              console.log('🔍 ContentPart: Using clientId for API call:', clientId);
              
              const response = await fetch(`/api/clients/${clientId}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  name: updatedClient.name || updatedClient.title,
                  website: updatedClient.website,
                  location: updatedClient.location,
                  industry: updatedClient.industry,
                  tags: updatedClient.tags,
                  owner: updatedClient.owner
                })
              });

              if (response.ok) {
                console.log('✅ Client updated successfully');
                // Refresh the menu structure to reflect changes
                if (refreshFromDatabase) {
                  await refreshFromDatabase();
                }
              } else {
                const errorData = await response.json();
                console.error('❌ Failed to update client:', errorData);
                alert(`Failed to update client: ${errorData.error || 'Unknown error'}`);
              }
            } catch (error) {
              console.error('❌ Error updating client:', error);
              alert(`Error updating client: ${error.message}`);
            }
          }}
          onDelete={async (clientToDelete) => {
            console.log('Deleting client:', clientToDelete);
          }}
          refreshFromDatabase={refreshFromDatabase}
        />
        
        {/* Unified Add Modal */}
        {showAddModal && (
          <UnifiedAddModal
            isOpen={showAddModal}
            onClose={handleCloseModal}
            onAdd={handleSaveItem}
            itemType={addItemType}
            parentId={parentId}
          />
        )}
      </div>
    );
  }

  if (selectedItem.type === 'project') {
    // Show loading state while fetching actual project data
    if (isLoadingActualData) {
      return (
        <div className="flex-1 h-full flex items-center justify-center content-part">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading project data...</p>
          </div>
        </div>
      );
    }

    // Use actual project data if available, merge with existing form data
    const projectFormToUse = actualProjectData ? {
      ...projectForm,
      name: actualProjectData.name || projectForm.name,
      description: actualProjectData.description || projectForm.description,
      status: actualProjectData.status || projectForm.status,
      start_date: actualProjectData.start_date ? formatDateForInput(actualProjectData.start_date) : projectForm.start_date,
      end_date: actualProjectData.end_date ? formatDateForInput(actualProjectData.end_date) : projectForm.end_date,
      client_owner: actualProjectData.client_owner?._id || actualProjectData.client_owner || projectForm.client_owner,
      internal_owner: actualProjectData.internal_owner?._id || actualProjectData.internal_owner || projectForm.internal_owner,
      budget_amount: actualProjectData.budget_amount ?? projectForm.budget_amount,
      budget_currency: actualProjectData.budget_currency || projectForm.budget_currency,
      budget_type: actualProjectData.budget_type || projectForm.budget_type,
      // Store the full owner objects for display
      client_owner_data: actualProjectData.client_owner,
      internal_owner_data: actualProjectData.internal_owner
    } : projectForm;

    const normalizedDeliverables = projectDeliverables.length > 0
      ? projectDeliverables
      : normalizeDeliverableList(projectFormToUse.deliverables || []);

    return (
      <div className="flex-1 h-full overflow-y-auto" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="px-8 py-10 space-y-6">
          <header className="space-y-1">
            <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              {projectFormToUse.name}
            </h1>
            <p className="text-sm text-gray-500">Project overview generated by Cigno AI</p>
          </header>

          <section className="bg-white border border-gray-200 rounded-sm p-6 space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={projectFormToUse.description}
                onChange={(e) => handleProjectFormChange('description', e.target.value)}
                rows={4}
                className="w-full rounded-sm border border-gray-200 px-4 py-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                placeholder="Describe the project goals, scope, and context..."
              />
              <p className="text-xs text-gray-400">From: Client Brief Document</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={projectForm.status}
                  onChange={(e) => handleProjectFormChange('status', e.target.value)}
                  className="w-full rounded-sm border border-gray-200 px-4 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                >
                  {['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'].map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  value={projectForm.start_date}
                  onChange={(e) => handleProjectFormChange('start_date', e.target.value)}
                  className="w-full rounded-sm border border-gray-200 px-4 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  value={projectForm.end_date}
                  onChange={(e) => handleProjectFormChange('end_date', e.target.value)}
                  className="w-full rounded-sm border border-gray-200 px-4 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Client Owner</label>
                <select
                  value={projectFormToUse.client_owner}
                  onChange={(e) => handleProjectFormChange('client_owner', e.target.value)}
                  className="w-full rounded-sm border border-gray-200 px-4 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                >
                  <option value="">Select client contact...</option>
                  {projectFormToUse.client_owner_data && (
                    <option value={projectFormToUse.client_owner_data._id}>
                      {projectFormToUse.client_owner_data.name} ({projectFormToUse.client_owner_data.email_address})
                    </option>
                  )}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Internal Owner</label>
                <select
                  value={projectFormToUse.internal_owner}
                  onChange={(e) => handleProjectFormChange('internal_owner', e.target.value)}
                  className="w-full rounded-sm border border-gray-200 px-4 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                >
                  <option value="">Select team member...</option>
                  {projectFormToUse.internal_owner_data && (
                    <option value={projectFormToUse.internal_owner_data._id}>
                      {actualProjectData?.client?.name === 'UBS' ? 'Jane Smith' : `${projectFormToUse.internal_owner_data.first_name} ${projectFormToUse.internal_owner_data.last_name}`}
                    </option>
                  )}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Budget</label>
                <input
                  type="number"
                  value={projectForm.budget_amount}
                  onChange={(e) => handleProjectFormChange('budget_amount', Number(e.target.value) || 0)}
                  className="w-full rounded-sm border border-gray-200 px-4 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
                <p className="mt-1 text-xs text-gray-400">Amount</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Currency</label>
                <select
                  value={projectForm.budget_currency}
                  onChange={(e) => handleProjectFormChange('budget_currency', e.target.value)}
                  className="w-full rounded-sm border border-gray-200 px-4 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                >
                  {['USD', 'EUR', 'GBP', 'CHF', 'CAD', 'AUD'].map(currency => (
                    <option key={currency} value={currency}>{currency}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-400">Currency</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Budget Type</label>
                <select
                  value={projectForm.budget_type}
                  onChange={(e) => handleProjectFormChange('budget_type', e.target.value)}
                  className="w-full rounded-sm border border-gray-200 px-4 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                >
                  {['Fixed', 'Hourly', 'Retainer', 'Milestone'].map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-400">Type</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  className="flex items-center gap-2 text-sm font-semibold text-gray-900 cursor-pointer"
                  onClick={() => setIsDeliverablesOpen(prev => !prev)}
                  aria-expanded={isDeliverablesOpen}
                >
                  <svg
                    width="10"
                    height="6"
                    viewBox="0 0 10 6"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`transform transition-transform ${isDeliverablesOpen ? 'rotate-180' : ''}`}
                  >
                    <path d="M9 1.5L5 4.5L1 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Deliverables</span>
                  <span className="text-xs font-normal text-gray-400">({normalizedDeliverables.length})</span>
                </button>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {isLoadingProjectDeliverables && normalizedDeliverables.length === 0 && (
                    <span>Loading...</span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleAddDeliverable(selectedItem)}
                    className="flex items-center justify-center h-6 w-6 rounded-sm border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors cursor-pointer"
                    title="Add deliverable"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {isDeliverablesOpen && (
                <div className="space-y-3">
                  {isLoadingProjectDeliverables && normalizedDeliverables.length === 0 ? (
                    <div className="rounded-sm border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                      Loading deliverables...
                    </div>
                  ) : normalizedDeliverables.length === 0 ? (
                    <div className="rounded-sm border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                      No deliverables linked to this project yet.
                    </div>
                  ) : (
                    normalizedDeliverables.map((deliverable, index) => {
                      const baseTypes = ['Workshop Document', 'Recommendation'];
                      const typeOptions = deliverable.type && !baseTypes.includes(deliverable.type)
                        ? [deliverable.type, ...baseTypes]
                        : baseTypes;
                      const deliverableId = deliverable.id || `deliverable_${index + 1}`;

                      return (
                        <div
                          key={deliverableId}
                          className="flex items-center gap-4 rounded-sm border border-gray-200 bg-white px-4 py-3"
                        >
                          <button
                            type="button"
                            className="flex-1 text-left text-sm font-medium text-gray-900 hover:text-gray-600 cursor-pointer"
                            onClick={() => {
                              const parentProjectId = deliverable.parentId || selectedItem?._id || selectedItem?.id;
                              const deliverablePayload = {
                                ...deliverable,
                                type: deliverable.type || 'deliverable',
                                _id: deliverable.id,
                                id: deliverable.id,
                                parentId: parentProjectId,
                                projectId: deliverable.projectId || parentProjectId
                              };

                              if (onDeliverableNavigate) {
                                onDeliverableNavigate(deliverablePayload);
                              } else if (onItemSelect) {
                                onItemSelect({
                                  ...deliverablePayload,
                                  type: 'deliverable'
                                });
                              }
                            }}
                          >
                            {deliverable.name || `Deliverable ${index + 1}`}
                          </button>
                          <input
                            type="text"
                            value="Recommendation"
                            readOnly
                            className="rounded-sm border border-gray-200 px-3 py-1 text-xs text-gray-600 bg-gray-50 cursor-not-allowed"
                          />
                          <button
                            type="button"
                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            onClick={() => handleRemoveDeliverable(deliverableId)}
                            title="Remove deliverable"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
        
        {/* Unified Add Modal */}
        {showAddModal && (
          <UnifiedAddModal
            isOpen={showAddModal}
            onClose={handleCloseModal}
            onAdd={handleSaveItem}
            itemType={addItemType}
            parentId={parentId}
          />
        )}
      </div>
    );
  }

  // Deliverable view - with tab navigation
  if (selectedItem.type === 'deliverable') {
    const storylineTitle = selectedItem?.title || formData.name;

    const confirmRemoveSection = () => {
      if (!generatedStoryline || !sectionToRemove) return;

      let removed = false;
      let newLength = generatedStoryline.sections?.length || 0;

      setGeneratedStoryline(prev => {
        if (!prev) return prev;
        const filtered = (prev.sections || []).filter(section => section.id !== sectionToRemove);
        if (filtered.length === (prev.sections || []).length) {
          return prev;
        }
        removed = true;
        newLength = filtered.length;
        const reindexed = filtered.map((section, index) => ({
          ...section,
          order: index
        }));
        return { ...prev, sections: reindexed };
      });

      if (removed) {
        setStorylineDirty(true);
        setCurrentSectionIndex(prevIndex => {
          if (newLength === 0) return 0;
          return Math.min(prevIndex, newLength - 1);
        });
      }

      setSectionToRemove(null);
    };

    const cancelRemoveSection = () => {
      setSectionToRemove(null);
    };

    const confirmResetStoryline = () => {
      if (!generatedStoryline) {
        setShowResetConfirm(false);
        return;
      }

      setGeneratedStoryline(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          sections: [],
          updated_at: new Date().toISOString()
        };
      });
      setStorylineDirty(true);
      setCurrentSectionIndex(0);
      setShowResetConfirm(false);
    };

    const cancelResetStoryline = () => {
      setShowResetConfirm(false);
    };

    const handleStorylineTabClick = async () => {
      // Check if we have a valid storyline first
      const currentHasValidStoryline = generatedStoryline && 
                                      generatedStoryline.sections && 
                                      generatedStoryline.sections.length > 0;
      
      if (currentHasValidStoryline) {
        // If we already have a valid storyline in state, just switch to storyline view
        console.log('🎯 Storyline tab clicked - using existing storyline in state');
        setCurrentView('storyline');
      } else if (generatedStoryline) {
        // We have a storyline but no sections - don't allow navigation
        console.log('⚠️ Storyline exists but has no sections - staying on current view');
        return;
      } else {
        // Only load from database if we don't have a storyline in state
        const deliverableId = selectedItem?.type === 'deliverable' 
          ? (selectedItem.metadata?.deliverableId || selectedItem.metadata?.deliverable_id || selectedItem.metadata?.business_entity_id || selectedItem._id || selectedItem.id)
          : (selectedItem?._id || selectedItem?.id);
        console.log('🎯 Storyline tab clicked for deliverable:', deliverableId);
        if (deliverableId) {
          // Load existing storyline from database
          await loadExistingStoryline(deliverableId);
          
          // Check again if we have a valid storyline after loading
          const existingStoryline = await loadExistingStorylineWithoutAutoSwitch(deliverableId);
          if (existingStoryline && existingStoryline.sections && existingStoryline.sections.length > 0) {
            console.log('✅ Found valid storyline, switching to storyline view');
            setCurrentView('storyline');
          } else {
            console.log('❌ No valid storyline found, generating new one');
            handleGenerateStoryline();
          }
        }
      }
    };

    const handleLayoutTabClick = async () => {
      // Check if we have a valid storyline first
      const currentHasValidStoryline = generatedStoryline && 
                                      generatedStoryline.sections && 
                                      generatedStoryline.sections.length > 0;
      
      if (currentHasValidStoryline) {
        setCurrentView('layout');
      } else if (generatedStoryline) {
        // We have a storyline but no sections - don't allow navigation
        console.log('⚠️ Storyline exists but has no sections - staying on current view');
        return;
      } else {
        // First try to load existing storyline from database
        const deliverableId = selectedItem?.type === 'deliverable' 
          ? (selectedItem.metadata?.deliverableId || selectedItem.metadata?.deliverable_id || selectedItem.metadata?.business_entity_id || selectedItem._id || selectedItem.id)
          : (selectedItem?._id || selectedItem?.id);
        if (deliverableId) {
          const existingStoryline = await loadExistingStorylineWithoutAutoSwitch(deliverableId);
          if (existingStoryline && existingStoryline.sections && existingStoryline.sections.length > 0) {
            setCurrentView('layout');
          } else {
            handleGenerateStoryline();
          }
        }
      }
    };

    const deliverableView = (() => {
      if (currentView === 'storyline') {
      return (
        <DeliverableStorylineView
          generatedStoryline={generatedStoryline}
          storylineDirty={storylineDirty}
          isSavingStoryline={isSavingStoryline}
          isGeneratingStoryline={isGeneratingStoryline}
          isGeneratingSlides={isGeneratingSlides}
          onSaveStoryline={handleSaveStoryline}
          onGenerateStoryline={handleGenerateStoryline}
          onGenerateSlides={handleGenerateSlidesForStoryline}
          onRegenerateStoryline={handleRegenerateStoryline}
          onResetStoryline={() => setShowResetConfirm(true)}
          currentSectionIndex={currentSectionIndex}
          onSectionChange={setCurrentSectionIndex}
          onUpdateSection={handleSectionUpdate}
          onStatusChange={handleSectionStatusChange}
          onToggleLock={handleToggleLock}
          onRemoveSection={handleRemoveSection}
          onRegenerateSection={handleRegenerateSection}
          slideGenerationProgress={slideGenerationProgress}
          title={storylineTitle}
          briefQuality={Number.isFinite(Number(formData.brief_quality)) ? Number(formData.brief_quality) : null}
        />
      );
    }

    if (currentView === 'layout') {
      console.log('🔧 ContentPart - Passing to DeliverableLayoutView:');
      console.log('🔧 - hasStoryline:', !!generatedStoryline);
      console.log('🔧 - storyline:', generatedStoryline);
      console.log('🔧 - sections count:', generatedStoryline?.sections?.length || 0);
      
      return (
        <DeliverableLayoutView
          hasStoryline={!!generatedStoryline}
          storyline={generatedStoryline}
          onGenerateStoryline={handleGenerateStoryline}
          isGeneratingStoryline={isGeneratingStoryline}
          selectedLayoutType={selectedItem?._layoutType}
          selectedLayout={selectedLayout}
          onStorylineChange={setGeneratedStoryline}
          briefQuality={Number.isFinite(Number(formData.brief_quality)) ? Number(formData.brief_quality) : null}
          onApplyLayoutToAll={(layoutId) => {
            // Apply the layout to all sections in the storyline
            if (generatedStoryline) {
              const updatedStoryline = {
                ...generatedStoryline,
                  sections: generatedStoryline.sections?.map(section => ({
                    ...section,
                    layout: layoutId,
                    layoutAppliedAt: new Date().toISOString()
                  })) || []
                };
                setGeneratedStoryline(updatedStoryline);
                console.log(`✅ Applied layout ${layoutId} to all ${generatedStoryline.sections?.length || 0} sections`);
              }
            }}
          onLayoutChange={safeOnLayoutChange}
          onSupportedLayoutsChange={safeOnLayoutOptionsChange}
          onAISuggestionChange={handleAISuggestionChange}
        />
      );
    }

      return (
        <DeliverableDetailsView
          formData={formData}
          newAudience={newAudience}
          formatDueDateForDisplay={formatDueDateForDisplay}
          onInputChange={handleInputChange}
          onRemoveAudience={handleRemoveAudience}
          onAddAudience={handleAddAudience}
          onTestBrief={handleTestBrief}
          isTestingBrief={isTestingBrief}
          onImproveBrief={handleImproveBrief}
          onResetBrief={handleResetBrief}
          onGenerateStoryline={handleGenerateStoryline}
          isGeneratingStoryline={isGeneratingStoryline}
          onNewAudienceChange={setNewAudience}
          onNewAudienceKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddAudience();
            }
          }}
          onSave={handleSaveDeliverable}
        />
      );
    })();

    // Check if we have a valid storyline with sections
    const hasValidStoryline = generatedStoryline && 
                             generatedStoryline.sections && 
                             generatedStoryline.sections.length > 0;

    return (
      <div className="flex-1 flex flex-col h-full min-h-0 content-part" style={{ backgroundColor: 'var(--bg-primary)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {formData.name}
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView('detailed')}
              className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors cursor-pointer ${
                currentView === 'detailed'
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 bg-white text-gray-500 hover:text-gray-700'
              }`}
              title="Deliverable settings"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button
              onClick={handleDelete}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:text-gray-700 cursor-pointer"
              title="Delete deliverable"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6" style={{ borderBottom: '1px solid var(--border-primary)' }}>
          <div className="flex space-x-1">
            <button
              onClick={hasValidStoryline ? handleStorylineTabClick : undefined}
              disabled={!hasValidStoryline}
              className={`px-4 py-2 rounded-t-sm font-medium transition-colors ${
                !hasValidStoryline ? 'cursor-not-allowed opacity-50' : ''
              }`}
              style={{
                backgroundColor: currentView === 'storyline' ? 'var(--text-primary)' : 'var(--bg-secondary)',
                color: currentView === 'storyline' ? 'var(--bg-primary)' : 'var(--text-secondary)'
              }}
              title={!hasValidStoryline ? 'Generate a storyline first to access this tab' : ''}
            >
              Storyline
            </button>
            <button
              onClick={hasValidStoryline ? handleLayoutTabClick : undefined}
              disabled={!hasValidStoryline}
              className={`px-4 py-2 rounded-t-sm font-medium transition-colors ${
                !hasValidStoryline ? 'cursor-not-allowed opacity-50' : ''
              }`}
              style={{
                backgroundColor: currentView === 'layout' ? 'var(--text-primary)' : 'var(--bg-secondary)',
                color: currentView === 'layout' ? 'var(--bg-primary)' : 'var(--text-secondary)'
              }}
              title={!hasValidStoryline ? 'Generate a storyline first to access this tab' : ''}
            >
              Layout
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {deliverableView}
        </div>

        {/* Remove Section Confirmation */}
        {sectionToRemove && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black-50 bg-opacity-50 backdrop-blur-sm" style={{ backgroundColor: '#000000e0' }}>
            <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
              <div className="border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900">Remove Section</h3>
                <p className="mt-1 text-sm text-gray-500">Are you sure you want to remove this section from the storyline?</p>
              </div>
              <div className="px-6 py-4 space-y-3">
                <p className="text-sm text-gray-700">This action cannot be undone. The section will be removed immediately from the current storyline draft.</p>
              </div>
              <div className="flex justify-end space-x-3 border-t border-gray-200 px-6 py-3 bg-gray-50">
                <button
                  onClick={cancelRemoveSection}
                  className="rounded-sm border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRemoveSection}
                  className="rounded-sm bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 cursor-pointer"
                >
                  Remove Section
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reset Storyline Confirmation */}
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" style={{ backgroundColor: '#000000e0' }}>
            <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
              <div className="border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900">Reset Storyline</h3>
                <p className="mt-1 text-sm text-gray-500">Remove all sections from the current storyline draft?</p>
              </div>
              <div className="px-6 py-4 space-y-3">
                <p className="text-sm text-gray-700">This action cannot be undone. All generated sections will be cleared until you save or regenerate new ones.</p>
              </div>
              <div className="flex justify-end space-x-3 border-t border-gray-200 px-6 py-3 bg-gray-50">
                <button
                  onClick={cancelResetStoryline}
                  className="rounded-sm border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmResetStoryline}
                  className="rounded-sm bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 cursor-pointer"
                >
                  Remove Sections
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Improve Brief Modal */}
        {showImproveBrief && (
          <ImproveBriefModal
            isOpen={showImproveBrief}
            onClose={() => setShowImproveBrief(false)}
            onSave={handleBriefSave}
            currentBrief={formData.brief}
            deliverable={{
              ...selectedItem,
              _id: selectedItem?.metadata?.deliverableId || selectedItem?.metadata?.deliverable_id || selectedItem?._id || selectedItem?.id,
              name: formData.name,
              type: formData.type,
              audience: formData.audience,
              brief_quality: formData.brief_quality,
              brief_strengths: formData.brief_strengths,
              brief_improvements: formData.brief_improvements
            }}
            projectData={{
              ...projectDataForAi
            }}
            onEvaluationSave={persistBriefEvaluation}
          />
        )}

        {/* Unified Add Modal */}
        {showAddModal && (
          <UnifiedAddModal
            isOpen={showAddModal}
            onClose={handleCloseModal}
            onAdd={handleSaveItem}
            itemType={addItemType}
            parentId={parentId}
          />
        )}
      </div>
    );
  }


  // Default fallback
  return (
    <div className="flex-1 h-full flex items-center justify-center bg-gray-50 content-part">
      <div className="text-center text-gray-500">
        <p className="text-lg mb-2">Unsupported item type</p>
        <p className="text-sm">Item type: {selectedItem?.type}</p>
      </div>

      {/* Unified Add Modal */}
      {showAddModal && (
        <UnifiedAddModal
          isOpen={showAddModal}
          onClose={handleCloseModal}
          onAdd={handleSaveItem}
          itemType={addItemType}
          parentId={parentId}
        />
      )}
    </div>
  );
}
