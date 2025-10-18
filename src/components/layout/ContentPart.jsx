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


export default function ContentPart({ selectedItem, onItemSelect, onItemDeleted, onDeliverableNavigate, refreshFromDatabase, onViewChange, selectedLayout, onStorylineChange }) {
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

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isGeneratingStoryline, setIsGeneratingStoryline] = useState(false);
  const [isSavingStoryline, setIsSavingStoryline] = useState(false);
  const [storylineDirty, setStorylineDirty] = useState(false);
  const [isGeneratingSlides, setIsGeneratingSlides] = useState(false);
  const [slideGenerationProgress, setSlideGenerationProgress] = useState({ completed: 0, total: 0 });

  // Helper function to generate individual section content
  const generateSectionContent = async (framework, dependencies, sectionIndex, contextData) => {
    console.log(`🔧 ===== GENERATE-SECTION API ROUTE CALLED =====`);
    console.log(`📋 Framework: ${framework}`);
    console.log(`📋 Dependencies:`, Object.keys(dependencies));
    console.log(`📋 Section Index: ${sectionIndex}`);
    console.log(`📋 Context Data:`, contextData);
    
    // Update section to generating status
    setGeneratedStoryline(prev => {
      if (!prev) return null;
      const updatedSections = [...prev.sections];
      if (updatedSections[sectionIndex]) {
        updatedSections[sectionIndex] = {
          ...updatedSections[sectionIndex],
          isLoading: true,
          generationStatus: 'generating',
          phaseName: updatedSections[sectionIndex].phaseName?.replace(' (Waiting)', ' (In Progress)') || 'Generating...'
        };
      }
      return { ...prev, sections: updatedSections };
    });

    try {
      const response = await fetch('/api/ai/generate-section', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          framework,
          dependencies,
          projectId: contextData.projectId,
          projectData: {
            id: contextData.projectId,
            name: contextData.projectName || 'UBS Pension Strategy',
            client_name: contextData.clientName || 'UBS',
            industry: contextData.industry || 'financial-services',
            description: contextData.projectDescription || 'Strategic analysis for UBS pension strategy'
          },
          deliverableData: {
            id: contextData.deliverableId,
            project: contextData.projectId,
            project_id: contextData.projectId,
            name: contextData.deliverableName || 'UBS Pension Strategy',
            brief: contextData.deliverableBrief || 'Strategic analysis and recommendations'
          },
          clientData: {
            name: contextData.clientName || 'UBS',
            industry: contextData.industry || 'financial-services',
            geography: contextData.geography || 'Switzerland'
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to generate ${framework} section`);
      }

      const result = await response.json();
      console.log(`✅ ${framework} section generated:`, result);

      // Update section with completed content
      setGeneratedStoryline(prev => {
        if (!prev) return null;
        const updatedSections = [...prev.sections];
        if (updatedSections[sectionIndex]) {
          const sectionData = result.data || result;
          const frameworkName = framework.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          
          // Use only the JSON response content - no additional formatting
          const slideContent = sectionData.slide_content || {};
          const insights = sectionData.insights || [];
          const citations = sectionData.citations || [];

          updatedSections[sectionIndex] = {
            ...updatedSections[sectionIndex],
            ...sectionData,
            id: updatedSections[sectionIndex].id, // Preserve original section ID
            status: 'draft',
            isLoading: false,
            generationStatus: 'completed',
            framework: framework,
            slideContent: slideContent,
            keyPoints: insights,
            takeaway: sectionData.takeaway || '',
            notes: sectionData.notes || '',
            charts: sectionData.charts || [],
            citations: citations,
            markdown: '', // No markdown - only JSON content
            html: '', // No HTML - only JSON content
            phaseName: updatedSections[sectionIndex].phaseName?.replace(' (In Progress)', ' (Completed)') || 'Completed'
          };
        }
        return { ...prev, sections: updatedSections };
      });

      return result.data || result;
    } catch (error) {
      console.error(`❌ Error generating ${framework} section:`, error);
      
      // Update section with error status
      setGeneratedStoryline(prev => {
        if (!prev) return null;
        const updatedSections = [...prev.sections];
        if (updatedSections[sectionIndex]) {
          updatedSections[sectionIndex] = {
            ...updatedSections[sectionIndex],
            isLoading: false,
            generationStatus: 'error',
            phaseName: updatedSections[sectionIndex].phaseName?.replace(' (In Progress)', ' (Error)') || 'Error',
            markdown: `# ${framework.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}\n\n## Error\nFailed to generate content: ${error.message}`
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

  const normalizeSlideForState = useCallback((slide, index = 0, fallbackLayout = 'title-2-columns') => {
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
      : 'title-2-columns';

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
      source: section.source || section.generationSource || '',
      generatedAt: section.generatedAt || section.generated_at || null,
      isLoading: !!section.isLoading,
      error: section.error || null,
    created_at: section.created_at || section.createdAt,
    updated_at: section.updated_at || section.updatedAt
    };
  }, [normalizeSlideForState, normalizeStatus]);

  const sanitizeStorylineForApi = useCallback((storyline) => {
    if (!storyline) return null;

    const sanitizeAudience = (audience) => {
      if (!audience) return [];
      if (Array.isArray(audience)) {
        return audience
          .map(item => (typeof item === 'string' ? item.trim() : String(item).trim()))
          .filter(Boolean);
      }
      return [typeof audience === 'string' ? audience.trim() : String(audience).trim()].filter(Boolean);
    };

    const sanitizeCharts = (charts) => {
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

    return {
      _id: storyline._id,
      id: storyline.id,
      title: storyline.title,
      status: storyline.status,
      version: storyline.version,
      executiveSummary: storyline.executiveSummary,
      presentationFlow: storyline.presentationFlow,
      callToAction: storyline.callToAction,
      topic: storyline.topic,
      industry: storyline.industry,
      audience: sanitizeAudience(storyline.audience),
      objectives: storyline.objectives,
      presentationStyle: storyline.presentationStyle,
      complexity: storyline.complexity,
      sections: (storyline.sections || []).map((section, index) => {
        const layout = typeof section.layout === 'string' && section.layout.trim()
          ? section.layout.trim()
          : 'title-2-columns';

        return {
        id: section.id || `section_${index + 1}`,
        title: section.title,
        description: section.description,
          markdown: typeof section.markdown === 'string' ? section.markdown : '',
          html: typeof section.html === 'string' ? section.html : '',
          charts: sanitizeCharts(section.charts),
          chartData: cloneToPlainObject(section.chartData, null),
          status: normalizeStatus(section.status, 'draft'),
        order: section.order ?? index,
        keyPoints: Array.isArray(section.keyPoints) ? section.keyPoints : [],
          insights: normalizeInsightList(section.insights || section.keyInsights),
        contentBlocks: Array.isArray(section.contentBlocks) ? section.contentBlocks : [],
          sources: normalizeStringList(section.sources),
        estimatedSlides: section.estimatedSlides,
        locked: !!section.locked,
          lockedBy: section.locked
            ? getIdString(section.lockedBy?._id || section.lockedBy)
            : undefined,
          lockedAt: section.locked ? section.lockedAt : undefined,
          framework: typeof section.framework === 'string' ? section.framework : undefined,
          takeaway: section.takeaway || '',
          notes: section.notes || '',
          layout,
          layoutAppliedAt: section.layoutAppliedAt || section.layout_applied_at || null,
          slides: Array.isArray(section.slides)
            ? section.slides.map((slide, slideIndex) => normalizeSlideForState(slide, slideIndex, layout))
            : [],
          slidesGeneratedAt: section.slidesGeneratedAt || section.slides_generated_at || null,
          slidesGenerationContext: cloneToPlainObject(section.slidesGenerationContext || section.slides_generation_context, undefined),
          source: section.source || section.generationSource || undefined,
          generatedAt: section.generatedAt || section.generated_at || null,
          created_at: section.created_at || section.createdAt,
          updated_at: section.updated_at || section.updatedAt
        };
      })
    };
  }, [normalizeSlideForState]);

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
        const deliverableId = selectedItem._id || selectedItem.id;
        if (!deliverableId) return;
        
        try {
          console.log('🔄 Fetching full deliverable data for:', deliverableId);
          const response = await fetch(`/api/deliverables/${deliverableId}`);
          if (response.ok) {
            const data = await response.json();
            const deliverableData = data.data?.deliverable || data.data || data;
            
            console.log('✅ Fetched deliverable data:', deliverableData);
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
              selectedItem.brief_quality ??
              7.5
            ) ?? 7.5;

            const briefToSet = deliverableData.brief || selectedItem.brief || 'Global Banking Corp requires a comprehensive strategy for implementing Central Bank Digital Currency (CBDC) capabilities. The presentation should address technical infrastructure requirements, regulatory compliance considerations, and strategic positioning for competitive advantage in the evolving digital currency landscape.';
            console.log('🎯 [USEEFFECT] Setting form brief to:', briefToSet);
            console.log('🎯 [USEEFFECT] deliverableData.brief:', deliverableData.brief);
            console.log('🎯 [USEEFFECT] selectedItem.brief:', selectedItem.brief);
            
            setFormData({
              name: deliverableData.name || selectedItem.name || 'CBDC Implementation Strategy for Global Banking',
              audience: deliverableData.audience || selectedItem.audience || ['Board of Directors', 'Technical Teams', 'Sarah Mitchell (CEO)'],
              type: deliverableData.type || selectedItem.type || 'Strategy Presentation',
              due_date: deliverableData.due_date ? new Date(deliverableData.due_date).toISOString().split('T')[0] : 
                       selectedItem.due_date ? new Date(selectedItem.due_date).toISOString().split('T')[0] : '2025-02-15',
              brief: briefToSet,
              brief_quality: qualityFromData,
              brief_strengths: strengthsFromData.length ? strengthsFromData : [],
              brief_improvements: improvementsFromData.length ? improvementsFromData : []
            });

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
      console.log(`🔄 Regenerating section ${section.id} with framework ${section.framework}`);
      
      // Set section to loading state
      handleSectionUpdate(section.id, { 
        isLoading: true,
        status: 'draft'
      });
      
      // Call the section generation API
      const response = await fetch('/api/ai/generate-section', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          framework: section.framework,
          sectionId: section.id,
          sectionIndex: section.order - 1, // Convert to 0-based index
          deliverableData: {
            brief: formData.brief,
            brief_quality: formData.brief_quality,
            title: formData.title,
            type: formData.type,
            industry: formData.industry,
            audience: formData.audience,
            objectives: formData.objectives
          },
          projectData: {
            name: selectedItem?.name || selectedItem?.title || 'Project',
            description: selectedItem?.description || '',
            industry: selectedItem?.industry || formData.industry
          },
          clientData: {
            name: selectedItem?.client_name || 'Client',
            industry: selectedItem?.client_industry || formData.industry
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to regenerate section: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Section regeneration failed');
      }

      // Update the section with new data
      const newSectionData = result.data;
      console.log(`🔍 Received section data for regeneration:`, JSON.stringify(newSectionData, null, 2));
      
      handleSectionUpdate(section.id, {
        ...newSectionData,
        framework: section.framework, // Preserve the original framework
        isLoading: false,
        status: 'draft',
        generatedAt: new Date().toISOString(),
        source: 'framework-agent-regenerated'
      });
      
      console.log(`✅ Section ${section.id} regenerated successfully`);
      
    } catch (error) {
      console.error(`❌ Error regenerating section ${section.id}:`, error);
      
      // Set section to error state
      handleSectionUpdate(section.id, {
        isLoading: false,
        status: 'error',
        error: error.message,
        source: 'error-fallback'
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
      const sanitizedStoryline = sanitizeStorylineForApi(generatedStoryline);
      if (!sanitizedStoryline) {
        throw new Error('Unable to prepare storyline data for saving.');
      }

      const sectionCount = sanitizedStoryline.sections?.length || 0;

      const payload = {
        title: sanitizedStoryline.title
          || `Strategic Analysis - ${sectionCount} Framework${sectionCount === 1 ? '' : 's'}`,
        executiveSummary: sanitizedStoryline.executiveSummary,
        presentationFlow: sanitizedStoryline.presentationFlow,
        callToAction: sanitizedStoryline.callToAction,
        topic: sanitizedStoryline.topic,
        industry: sanitizedStoryline.industry,
        audience: sanitizedStoryline.audience,
        objectives: sanitizedStoryline.objectives,
        presentationStyle: sanitizedStoryline.presentationStyle,
        complexity: sanitizedStoryline.complexity,
        status: sanitizedStoryline.status || generatedStoryline.status,
        sections: sanitizedStoryline.sections || []
      };

      let response;
      
      if (generatedStoryline._id) {
        // Update existing storyline
        console.log('🔄 Updating existing storyline:', generatedStoryline._id);
        response = await fetch(`/api/storylines/${generatedStoryline._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } else {
        // Create new storyline - need deliverable ID
        const deliverableId = getIdString(selectedItem?._id || selectedItem?.id || selectedItem?.metadata?.deliverableId);
        if (!deliverableId) {
          throw new Error('No deliverable ID found to create storyline');
        }
        
        console.log('➕ Creating new storyline for deliverable:', deliverableId);
        payload.deliverable = deliverableId;
        
        console.log('🔍 Creating storyline with payload:', JSON.stringify(payload, null, 2));
        response = await fetch('/api/storylines', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save storyline');
      }

      const result = await response.json();
      const updatedStoryline = result.data || result.storyline || result;
      setGeneratedStoryline({
        ...updatedStoryline,
        sections: (updatedStoryline.sections || []).map((section, index) =>
          normalizeSectionForState(section, index)
        )
      });
      setStorylineDirty(false);
    } catch (error) {
      console.error('❌ Error saving storyline:', error);
      alert(error.message || 'Failed to save storyline changes.');
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
        const response = await fetch(`/api/deliverables/${selectedItem._id}`, {
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

      persistBriefEvaluation({
        qualityScore: scoreValue,
        strengths: strengthsList,
        improvements: improvementsList
      });

      console.log('✅ Brief evaluated', {
        source: result?.source || 'custom-agent',
        deliverableId,
        score: normalizeScoreValue(scoreValue) ?? formData.brief_quality
      });
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

  const saveDeliverable = async ({ silent = false } = {}) => {
    if (!selectedItem?._id) {
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

      const projectId = selectedItem.project || selectedItem.project_id || selectedItem.metadata?.project_id || selectedItem.metadata?.projectId;

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
        ...(() => {
          const normalizedQuality = normalizeScoreValue(formData.brief_quality);
          return normalizedQuality !== null ? { brief_quality: normalizedQuality } : {};
        })(),
        ...(Array.isArray(formData.brief_strengths) && {
          brief_strengths: formData.brief_strengths
        }),
        ...(Array.isArray(formData.brief_improvements) && {
          brief_improvements: formData.brief_improvements
        }),
        ...(selectedItem.created_by && { updated_by: selectedItem.created_by }),
        ...(selectedItem.updated_by && !selectedItem.created_by && { updated_by: selectedItem.updated_by })
      };

      console.log('💾 [SAVE API] Payload being sent:', payload);

      const response = await fetch(`/api/deliverables/${selectedItem._id}`, {
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
    const normalizedQuality = normalizeScoreValue(
      Number.isFinite(qualityScore) ? qualityScore : Number(qualityScore)
    );
    const normalizedStrengths = normalizeInsightList(strengths);
    const normalizedImprovements = normalizeInsightList(improvements);

    setFormData(prev => ({
      ...prev,
      brief_quality: normalizedQuality !== null ? normalizedQuality : prev.brief_quality,
      brief_strengths: normalizedStrengths,
      brief_improvements: normalizedImprovements
    }));

    if (onItemSelect && selectedItem) {
      onItemSelect({
        ...selectedItem,
        brief_quality: normalizedQuality !== null ? normalizedQuality : selectedItem.brief_quality,
        brief_strengths: normalizedStrengths,
        brief_improvements: normalizedImprovements,
        metadata: {
          ...(selectedItem.metadata || {}),
          brief_quality: normalizedQuality !== null ? normalizedQuality : selectedItem.metadata?.brief_quality,
          brief_strengths: normalizedStrengths,
          brief_improvements: normalizedImprovements
        }
      });
    }

    // Immediately save to database
    const deliverableId = selectedItem?.metadata?.deliverableId 
      || selectedItem?.metadata?.deliverable_id 
      || selectedItem?.metadata?.business_entity_id 
      || selectedItem?._id 
      || selectedItem?.id;
      
    if (deliverableId) {
      try {
        const response = await fetch(`/api/deliverables/${deliverableId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            brief_quality: normalizedQuality,
            brief_strengths: normalizedStrengths,
            brief_improvements: normalizedImprovements,
            brief_last_evaluated_at: new Date().toISOString()
          })
        });

        if (response.ok) {
          console.log('✅ Brief evaluation auto-saved to database');
        } else {
          console.error('❌ Failed to auto-save brief evaluation');
        }
      } catch (error) {
        console.error('❌ Error auto-saving brief evaluation:', error);
      }
    }
  };

  const handleBriefSave = (payloadOrBrief, legacyQuality, legacyStrengths, legacyImprovements) => {
    justSavedRef.current = true; // Mark that we're updating formData from brief save
    
    // Safety timeout to reset the flag in case something goes wrong
    setTimeout(() => {
      justSavedRef.current = false;
    }, 2000);
    
    let improvedBriefValue = payloadOrBrief;
    let qualityValue = legacyQuality;
    let strengthsArray = normalizeInsightList(legacyStrengths);
    let improvementsArray = normalizeInsightList(legacyImprovements);

    if (payloadOrBrief && typeof payloadOrBrief === 'object' && !Array.isArray(payloadOrBrief)) {
      improvedBriefValue = payloadOrBrief.brief ?? payloadOrBrief.improvedBrief ?? '';
      qualityValue = payloadOrBrief.qualityScore ?? payloadOrBrief.score ?? legacyQuality;
      strengthsArray = normalizeInsightList(payloadOrBrief.strengths ?? payloadOrBrief.strengthsText);
      improvementsArray = normalizeInsightList(payloadOrBrief.improvements ?? payloadOrBrief.improvementsText);
    }

    const normalizedQuality = normalizeScoreValue(qualityValue);
    const normalizedStrengths = strengthsArray.length ? strengthsArray : formData.brief_strengths;
    const normalizedImprovements = improvementsArray.length ? improvementsArray : formData.brief_improvements;

    setFormData(prev => ({
      ...prev,
      brief: typeof improvedBriefValue === 'string' && improvedBriefValue.trim() ? improvedBriefValue : prev.brief,
      brief_quality: normalizedQuality !== null ? normalizedQuality : prev.brief_quality,
      brief_strengths: normalizedStrengths,
      brief_improvements: normalizedImprovements
    }));

    if (onItemSelect) {
      onItemSelect({
        ...selectedItem,
        brief: typeof improvedBriefValue === 'string' && improvedBriefValue.trim() ? improvedBriefValue : selectedItem.brief,
        brief_quality: normalizedQuality !== null ? normalizedQuality : selectedItem.brief_quality,
        brief_strengths: normalizedStrengths,
        brief_improvements: normalizedImprovements,
        metadata: {
          ...(selectedItem.metadata || {}),
          brief: typeof improvedBriefValue === 'string' && improvedBriefValue.trim() ? improvedBriefValue : selectedItem.metadata?.brief,
          brief_quality: normalizedQuality !== null ? normalizedQuality : selectedItem.metadata?.brief_quality
        }
      });
    }

    setShowImproveBrief(false);
    
    // Auto-save the deliverable after improving the brief
    if (selectedItem?._id) {
      setTimeout(() => {
        saveDeliverable({ silent: true });
      }, 100); // Small delay to ensure state is updated
    }
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
    console.log('🚀 ===== CFA-DEMO STORYLINE GENERATION STARTED =====');
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
        // Don't throw error, just use fallback values
      }

      // Create CFA-DEMO sections with proper phase-based status
      const cfaDemoSections = [
        {
          id: 'cfa-demo-1',
          title: 'Market Sizing Analysis',
          description: 'Comprehensive market size assessment and growth projections',
          framework: 'market_sizing',
          status: 'draft',
          isLoading: false,
          generationStatus: 'waiting',
          order: 1,
          phase: 1,
          phaseName: 'Phase 1: Market Analysis (Waiting)',
          keyPoints: [],
          takeaway: '',
          charts: [],
          markdown: '',
          html: ''
        },
        {
          id: 'cfa-demo-2', 
          title: 'Competitive Landscape Analysis',
          description: 'Strategic assessment of market competitors and positioning',
          framework: 'competitive_landscape',
          status: 'draft',
          isLoading: false,
          generationStatus: 'waiting',
          order: 2,
          phase: 1,
          phaseName: 'Phase 1: Market Analysis (Waiting)',
          keyPoints: [],
          takeaway: '',
          charts: [],
          markdown: '',
          html: ''
        },
        {
          id: 'cfa-demo-3',
          title: 'Capability Benchmark Analysis', 
          description: 'Evaluation of organizational capabilities and competencies',
          framework: 'capability_benchmark',
                  status: 'draft',
          isLoading: false,
          generationStatus: 'waiting',
          order: 3,
          phase: 2,
          phaseName: 'Phase 2: Capability Assessment (Waiting)',
          keyPoints: [],
          takeaway: '',
          charts: [],
          markdown: '',
          html: ''
        },
        {
          id: 'cfa-demo-4',
          title: 'Strategic Options Analysis',
          description: 'Evaluation of strategic alternatives and decision framework',
          framework: 'strategic_options', 
                      status: 'draft',
          isLoading: false,
          generationStatus: 'waiting',
          order: 4,
          phase: 3,
          phaseName: 'Phase 3: Strategic Planning (Waiting)',
          keyPoints: [],
          takeaway: '',
          charts: [],
          markdown: '',
          html: ''
        },
        {
          id: 'cfa-demo-5',
          title: 'Partnership Strategy Analysis',
          description: 'Strategic partnership opportunities and implementation roadmap',
          framework: 'partnerships',
          status: 'draft', 
          isLoading: false,
          generationStatus: 'waiting',
          order: 5,
          phase: 4,
          phaseName: 'Phase 4: Partnership Strategy (Waiting)',
          keyPoints: [],
          takeaway: '',
          charts: [],
          markdown: '',
          html: ''
        }
      ];

      // Create initial storyline with waiting sections
      const initialStoryline = {
        title: 'UBS Switzerland Pension Strategy Analysis',
        sections: cfaDemoSections,
        executiveSummary: '',
        presentationFlow: '',
        callToAction: '',
        totalSections: 5,
        estimatedDuration: 15,
        generatedAt: new Date().toISOString(),
        source: 'cfa-demo-orchestrator',
        currentPhase: 0,
        phaseStatus: 'initializing'
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
        projectName: formData?.name || selectedItem?.projectName || 'UBS Pension Strategy',
        clientName: selectedItem?.client?.name || 'UBS',
        industry: metadata?.industry || 'financial-services',
        projectDescription: formData?.brief || deliverableData?.brief || 'Strategic analysis for UBS pension strategy',
        deliverableId: deliverableId || 'default-deliverable-id',
        deliverableName: deliverableData?.name || formData?.name || 'UBS Pension Strategy',
        deliverableBrief: deliverableData?.brief || formData?.brief || 'Strategic analysis and recommendations',
        geography: 'Switzerland'
      };
      
      console.log('📋 Context Data prepared:', contextData);
      
      // Start CFA-DEMO generation with individual framework calls
      console.log('🎭 Starting CFA-DEMO generation with individual framework calls...');
      
      // Phase 1: Parallel execution (Market Sizing + Competitive Landscape)
      console.log('📊 === PHASE 1: PARALLEL EXECUTION ===');
      const phase1Promises = [];
      
      // Market Sizing (index 0)
      console.log('🏗️ Creating Market Sizing promise...');
      const marketSizingPromise = generateSectionContent('market_sizing', {}, 0, contextData);
      phase1Promises.push(marketSizingPromise);
      console.log('✅ Market Sizing promise created and pushed');
      
      // Competitive Landscape (index 1) 
      console.log('🏗️ Creating Competitive Landscape promise...');
      const competitiveLandscapePromise = generateSectionContent('competitive_landscape', {}, 1, contextData);
      phase1Promises.push(competitiveLandscapePromise);
      console.log('✅ Competitive Landscape promise created and pushed');
      
      console.log('⚡ Executing 2 Phase 1 promises in parallel...');
      console.log('📋 Phase1Promises array length:', phase1Promises.length);
      const phase1Results = await Promise.allSettled(phase1Promises);
      
      // Phase 2: Capability Benchmark (depends on Competitive Landscape)
      console.log('📊 === PHASE 2: CAPABILITY BENCHMARK ===');
      const competitiveResult = phase1Results[1].status === 'fulfilled' ? phase1Results[1].value : null;
      const capabilityBenchmarkPromise = generateSectionContent('capability_benchmark', { competitive_landscape: competitiveResult }, 2, contextData);
      const capabilityResult = await capabilityBenchmarkPromise;
      
      // Phase 3: Strategic Options (depends on Market Sizing, Competitive Landscape, Capability Benchmark)
      console.log('📊 === PHASE 3: STRATEGIC OPTIONS ===');
      const marketResult = phase1Results[0].status === 'fulfilled' ? phase1Results[0].value : null;
      const strategicOptionsPromise = generateSectionContent('strategic_options', {
        market_sizing: marketResult,
        competitive_landscape: competitiveResult,
        capability_benchmark: capabilityResult
      }, 3, contextData);
      const strategicResult = await strategicOptionsPromise;
      
      // Phase 4: Partnership Strategy (depends on Strategic Options)
      console.log('📊 === PHASE 4: PARTNERSHIP STRATEGY ===');
      const partnershipPromise = generateSectionContent('partnerships', { strategic_options: strategicResult }, 4, contextData);
      const partnershipResult = await partnershipPromise;
      
      console.log('✅ All CFA-DEMO sections completed');
      
      // Update storyline with final completion status
      setGeneratedStoryline(prev => {
        if (!prev) return null;
        const updatedSections = prev.sections.map(section => ({
          ...section,
          isLoading: false,
          generationStatus: 'completed',
          phaseName: section.phaseName?.replace(' (In Progress)', ' (Completed)') || 'Completed'
        }));
        return { ...prev, sections: updatedSections };
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
        const layoutForSection = section.layout || selectedLayout || 'title-2-columns';
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

      const sanitizedStoryline = sanitizeStorylineForApi(generatedStoryline);
      const { lockedSections, draftSections } = filterSectionsForRegeneration(sanitizedStoryline);

      if (draftSections.length === 0) {
        alert('All sections are locked or final. Unlock sections before regenerating.');
        setIsGeneratingStoryline(false);
        return;
      }

      const regenerationPayload = createRegenerationPayload(
        sanitizedStoryline,
        draftSections,
        lockedSections
      );

      const backup = createStorylineBackup(sanitizedStoryline);

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
      <div className="flex-1 h-full flex items-center justify-center bg-gray-50">
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
        <div className="flex-1 h-full flex items-center justify-center">
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
      <div className="flex-1 h-full p-6 flex flex-col min-h-0">
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
        <div className="flex-1 h-full flex items-center justify-center">
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
                      {projectFormToUse.internal_owner_data.first_name} {projectFormToUse.internal_owner_data.last_name}
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
                  className="flex items-center gap-2 text-sm font-semibold text-gray-900"
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
                    className="flex items-center justify-center h-6 w-6 rounded-sm border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
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
                            className="flex-1 text-left text-sm font-medium text-gray-900 hover:text-gray-600"
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
                            className="text-gray-400 hover:text-gray-600"
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
      if (generatedStoryline) {
        // If we already have a storyline in state, just switch to storyline view
        console.log('🎯 Storyline tab clicked - using existing storyline in state');
        setCurrentView('storyline');
      } else {
        // Only load from database if we don't have a storyline in state
        const deliverableId = selectedItem?.type === 'deliverable' 
          ? (selectedItem.metadata?.deliverableId || selectedItem.metadata?.deliverable_id || selectedItem.metadata?.business_entity_id || selectedItem._id || selectedItem.id)
          : (selectedItem?._id || selectedItem?.id);
        console.log('🎯 Storyline tab clicked for deliverable:', deliverableId);
        if (deliverableId) {
          // Load existing storyline from database
          await loadExistingStoryline(deliverableId);
          
          // Check again if we have a storyline after loading
          const existingStoryline = await loadExistingStorylineWithoutAutoSwitch(deliverableId);
          if (existingStoryline) {
            console.log('✅ Found storyline, switching to storyline view');
            setCurrentView('storyline');
          } else {
            console.log('❌ No storyline found, generating new one');
            handleGenerateStoryline();
          }
        }
      }
    };

    const handleLayoutTabClick = async () => {
      if (generatedStoryline) {
        setCurrentView('layout');
      } else {
        // First try to load existing storyline from database
        const deliverableId = selectedItem?.type === 'deliverable' 
          ? (selectedItem.metadata?.deliverableId || selectedItem.metadata?.deliverable_id || selectedItem.metadata?.business_entity_id || selectedItem._id || selectedItem.id)
          : (selectedItem?._id || selectedItem?.id);
        if (deliverableId) {
          const existingStoryline = await loadExistingStorylineWithoutAutoSwitch(deliverableId);
          if (existingStoryline) {
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

    return (
      <div className="flex-1 flex flex-col h-full min-h-0" style={{ backgroundColor: 'var(--bg-primary)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {formData.name}
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView('detailed')}
              className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
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
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:text-gray-700"
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
              onClick={generatedStoryline ? handleStorylineTabClick : undefined}
              disabled={!generatedStoryline}
              className={`px-4 py-2 rounded-t-sm font-medium transition-colors ${
                !generatedStoryline ? 'cursor-not-allowed opacity-50' : ''
              }`}
              style={{
                backgroundColor: currentView === 'storyline' ? 'var(--text-primary)' : 'var(--bg-secondary)',
                color: currentView === 'storyline' ? 'var(--bg-primary)' : 'var(--text-secondary)'
              }}
              title={!generatedStoryline ? 'Generate a storyline first to access this tab' : ''}
            >
              Storyline
            </button>
            <button
              onClick={generatedStoryline ? handleLayoutTabClick : undefined}
              disabled={!generatedStoryline}
              className={`px-4 py-2 rounded-t-sm font-medium transition-colors ${
                !generatedStoryline ? 'cursor-not-allowed opacity-50' : ''
              }`}
              style={{
                backgroundColor: currentView === 'layout' ? 'var(--text-primary)' : 'var(--bg-secondary)',
                color: currentView === 'layout' ? 'var(--bg-primary)' : 'var(--text-secondary)'
              }}
              title={!generatedStoryline ? 'Generate a storyline first to access this tab' : ''}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
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
                  className="rounded-sm border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRemoveSection}
                  className="rounded-sm bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  Remove Section
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reset Storyline Confirmation */}
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
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
                  className="rounded-sm border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmResetStoryline}
                  className="rounded-sm bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
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
            deliverable={selectedItem}
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
    <div className="flex-1 h-full flex items-center justify-center bg-gray-50">
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
