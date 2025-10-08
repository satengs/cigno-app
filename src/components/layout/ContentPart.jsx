'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Settings,
  Trash2,
  Plus,
  X
} from 'lucide-react';
import ClientDetailView from '../ui/ClientDetailView';
import ImproveBriefModal from '../ui/ImproveBriefModal';
import { getIdString, isValidObjectId } from '@/lib/utils/idUtils';
import { normalizeStatus } from '@/lib/constants/enums';
import DeliverableStorylineView from './deliverable/DeliverableStorylineView';
import DeliverableLayoutView from './deliverable/DeliverableLayoutView';
import DeliverableDetailsView from './deliverable/DeliverableDetailsView';

export default function ContentPart({ selectedItem, onItemSelect, onItemDeleted, onDeliverableNavigate }) {
  const [formData, setFormData] = useState({
    name: '',
    audience: [],
    type: 'Strategy Presentation',
    format: 'PPT',
    due_date: '',
    document_length: 25,
    brief: '',
    brief_quality: 7.5,
    strengths: 'Technical requirements well defined',
    improvements: 'Add geographical scope and timeline constraints'
  });

  const [newAudience, setNewAudience] = useState('');
  const [showImproveBrief, setShowImproveBrief] = useState(false);
  const [currentView, setCurrentView] = useState('detailed'); // 'detailed' | 'storyline' | 'layout'
  const [generatedStoryline, setGeneratedStoryline] = useState(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isGeneratingStoryline, setIsGeneratingStoryline] = useState(false);
  const [isSavingStoryline, setIsSavingStoryline] = useState(false);
  const [storylineDirty, setStorylineDirty] = useState(false);
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
  const [projectDeliverables, setProjectDeliverables] = useState([]);
  const [isLoadingProjectDeliverables, setIsLoadingProjectDeliverables] = useState(false);
  const [isDeliverablesOpen, setIsDeliverablesOpen] = useState(true);

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
      type: deliverable.type || deliverable.format || metadata.type || 'Deliverable',
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
    if (selectedItem && selectedItem.type === 'deliverable') {
      setFormData({
        name: selectedItem.name || 'CBDC Implementation Strategy for Global Banking',
        audience: selectedItem.audience || ['Board of Directors', 'Technical Teams', 'Sarah Mitchell (CEO)'],
        type: selectedItem.type || 'Strategy Presentation',
        format: selectedItem.format || 'PPT',
        due_date: selectedItem.due_date ? new Date(selectedItem.due_date).toISOString().split('T')[0] : '2025-02-15',
        document_length: selectedItem.document_length || 25,
        brief: selectedItem.brief || 'Global Banking Corp requires a comprehensive strategy for implementing Central Bank Digital Currency (CBDC) capabilities. The presentation should address technical infrastructure requirements, regulatory compliance considerations, and strategic positioning for competitive advantage in the evolving digital currency landscape.',
        brief_quality: selectedItem.brief_quality || 7.5,
        strengths: selectedItem.strengths || 'Technical requirements well defined',
        improvements: selectedItem.improvements || 'Add geographical scope and timeline constraints'
      });

      // Load existing storyline if available
      loadExistingStoryline(selectedItem._id || selectedItem.id);
    }
  }, [selectedItem]);

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
      const storylines = Array.isArray(result?.data?.storylines)
        ? result.data.storylines
        : Array.isArray(result?.data)
          ? result.data
          : [];
      const existingStoryline = storylines[0] || result?.data?.storyline || null;

      if (existingStoryline) {
        console.log('✅ Found existing storyline:', existingStoryline._id);
        
        setGeneratedStoryline({
          ...existingStoryline,
          sections: (existingStoryline.sections || []).map((section, index) => ({
            id: section.id || section._id || `section_${index + 1}`,
            title: section.title,
            description: section.description,
            status: section.status || 'draft',
            order: section.order ?? index,
            keyPoints: section.keyPoints || [],
            contentBlocks: section.contentBlocks || [],
            estimatedSlides: section.estimatedSlides || 3,
            locked: !!section.locked,
            lockedBy: section.lockedBy,
            lockedAt: section.lockedAt
          }))
        });
        setCurrentView('storyline'); // Switch to storyline view if storyline exists
        setCurrentSectionIndex(0);
        setStorylineDirty(false);
      } else {
        console.log('📝 No existing storyline found for this deliverable');
        setGeneratedStoryline(null);
        setCurrentView('detailed'); // Default to detailed view
        setStorylineDirty(false);
      }
    } catch (error) {
      console.error('❌ Error loading existing storyline:', error);
      setGeneratedStoryline(null);
      setCurrentView('detailed');
      setStorylineDirty(false);
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

  const handleKeyPointsChange = (sectionId, keyPoints) => {
    handleSectionUpdate(sectionId, { keyPoints });
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
      const payload = {
        title: generatedStoryline.title,
        executiveSummary: generatedStoryline.executiveSummary,
        presentationFlow: generatedStoryline.presentationFlow,
        callToAction: generatedStoryline.callToAction,
        topic: generatedStoryline.topic,
        industry: generatedStoryline.industry,
        audience: generatedStoryline.audience,
        objectives: generatedStoryline.objectives,
        presentationStyle: generatedStoryline.presentationStyle,
        complexity: generatedStoryline.complexity,
        status: generatedStoryline.status,
        sections: (generatedStoryline.sections || []).map((section, index) => ({
          id: section.id || `section_${index + 1}`,
          title: section.title,
          description: section.description,
          status: normalizeStatus(section.status, 'draft'),
          order: section.order ?? index,
          keyPoints: Array.isArray(section.keyPoints) ? section.keyPoints : [],
          contentBlocks: Array.isArray(section.contentBlocks) ? section.contentBlocks : [],
          estimatedSlides: section.estimatedSlides || 3,
          locked: !!section.locked,
          lockedBy: section.locked ? section.lockedBy : undefined,
          lockedAt: section.locked ? section.lockedAt : undefined
        }))
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
        sections: (updatedStoryline.sections || []).map((section, index) => ({
          id: section.id || section._id || `section_${index + 1}`,
          title: section.title,
          description: section.description,
          status: section.status,
          order: section.order ?? index,
          keyPoints: section.keyPoints || [],
          contentBlocks: section.contentBlocks || [],
          estimatedSlides: section.estimatedSlides || 3,
          locked: !!section.locked,
          lockedBy: section.lockedBy,
          lockedAt: section.lockedAt
        }))
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

      const projectId = selectedItem._id || selectedItem.id || metadata.project_id || metadata.projectId;
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

      fetchProjectDeliverables(projectId);
    } else {
      setProjectDeliverables([]);
      setIsDeliverablesOpen(true);
    }
  }, [selectedItem, normalizeDeliverableList, fetchProjectDeliverables, formatDateForInput]);

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

  const handleRemoveDeliverable = (deliverableId) => {
    if (!deliverableId) return;

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

  const handleImproveBrief = () => {
    setShowImproveBrief(true);
  };

  const handleBriefSave = (improvedBrief, qualityScore, strengths, improvements) => {
    setFormData(prev => ({
      ...prev,
      brief: improvedBrief,
      brief_quality: qualityScore,
      strengths: strengths,
      improvements: improvements
    }));
    setShowImproveBrief(false);
  };

  const handleGenerateStoryline = async () => {
    if (!selectedItem || selectedItem.type !== 'deliverable') {
      alert('Storyline generation is only available for deliverables');
      return;
    }

    setIsGeneratingStoryline(true);
    
    try {
      // If the selectedItem doesn't have a project field, it might be from the menu system
      // We need to fetch the actual deliverable data to get the project field
      let deliverableData = { ...selectedItem };
      const metadata = selectedItem.metadata || {};

      // Derive deliverable ID candidates from metadata or item itself
      const rawDeliverableId = metadata.deliverableId || selectedItem._id || selectedItem.id;
      const deliverableId = getIdString(rawDeliverableId);

      if ((!selectedItem.project && !selectedItem.project_id) && deliverableId && isValidObjectId(deliverableId)) {
        console.log('🔄 Menu item missing project field, fetching actual deliverable data...');
        console.log(`🔍 Looking for deliverable with ID: ${deliverableId}`);

        try {
          const deliverableResponse = await fetch(`/api/deliverables/${deliverableId}`);
          if (deliverableResponse.ok) {
            const responseData = await deliverableResponse.json();
            const resolvedData = responseData?.data?.deliverable || responseData?.data || responseData;
            if (resolvedData) {
              deliverableData = { ...deliverableData, ...resolvedData };
              console.log('✅ Fetched deliverable data:', deliverableData);
            }
          } else {
            let errorMessage = 'Failed to fetch deliverable data from API';
            try {
              const errorData = await deliverableResponse.json();
              errorMessage = errorData?.error || errorData?.details || errorMessage;
            } catch (parseError) {
              console.warn('⚠️ Unable to parse deliverable API error response:', parseError);
            }
            console.warn('⚠️', errorMessage);
          }
        } catch (fetchError) {
          console.warn('❌ Failed to fetch deliverable data, continuing with menu item metadata:', fetchError);
        }
      }

      // Ensure we have a project ID, falling back to metadata
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
      
      if (!projectId) {
        console.error('❌ No project ID found in deliverable data');
        throw new Error('No project ID found in deliverable data. Please ensure the deliverable is properly linked to a project.');
      }
      
      const resolvedDeliverableId = getIdString(deliverableData._id || deliverableData.id || rawDeliverableId || selectedItem._id || selectedItem.id);

      const enrichedDeliverableData = {
        ...(typeof deliverableData === 'object' ? deliverableData : {}),
        id: resolvedDeliverableId,
        project: projectId,
        project_id: projectId,
        name: deliverableData.name || formData.name || selectedItem.title || 'Business Strategy',
        summary: deliverableData.summary || deliverableData.description || metadata.summary || selectedItem.summary || null,
        description: deliverableData.description || metadata.description || selectedItem.description || formData.description || null,
        brief: deliverableData.brief || metadata.brief || formData.brief || 'Strategic analysis and recommendations',
        audience: deliverableData.audience || metadata.audience || formData.audience || selectedItem.audience || ['Business Stakeholders'],
        stakeholders: deliverableData.stakeholders || metadata.stakeholders || [],
        objectives: deliverableData.objectives || metadata.objectives || selectedItem.objectives || [],
        scope: deliverableData.scope || metadata.scope || null,
        assumptions: deliverableData.assumptions || metadata.assumptions || [],
        dependencies: deliverableData.dependencies || metadata.dependencies || selectedItem.dependencies || [],
        risks: deliverableData.risks || metadata.risks || [],
        success_metrics: deliverableData.success_metrics || metadata.success_metrics || [],
        constraints: deliverableData.constraints || metadata.constraints || [],
        deliverables: deliverableData.deliverables || metadata.deliverables || [],
        key_messages: deliverableData.key_messages || metadata.key_messages || [],
        document_length: deliverableData.document_length || metadata.document_length || formData.document_length || selectedItem.document_length || 20,
        page_count: deliverableData.page_count || metadata.page_count || null,
        estimated_hours: deliverableData.estimated_hours || metadata.estimated_hours || selectedItem.estimated_hours || 0,
        type: deliverableData.type || metadata.type || selectedItem.type || 'deliverable',
        format: deliverableData.format || metadata.format || selectedItem.format || 'PPT',
        status: deliverableData.status || metadata.status || selectedItem.status || 'draft',
        priority: deliverableData.priority || metadata.priority || selectedItem.priority || 'medium',
        due_date: deliverableData.due_date || metadata.due_date || selectedItem.due_date || null,
        start_date: deliverableData.start_date || metadata.start_date || selectedItem.start_date || null,
        end_date: deliverableData.end_date || metadata.end_date || selectedItem.end_date || null,
        created_by: deliverableData.created_by || metadata.created_by || null,
        owner: deliverableData.owner || metadata.owner || selectedItem.owner || null,
        client_owner: deliverableData.client_owner || metadata.client_owner || selectedItem.client_owner || null,
        internal_owner: deliverableData.internal_owner || metadata.internal_owner || selectedItem.internal_owner || null,
        tags: deliverableData.tags || metadata.tags || selectedItem.tags || [],
        related_documents: deliverableData.related_documents || metadata.related_documents || [],
        metadata: {
          ...(deliverableData.metadata || {}),
          ...metadata
        }
      };

      const requestData = {
        projectId: projectId,
        projectData: {
          id: projectId,
          name: formData.name || selectedItem?.projectName || 'Business Strategy Project',
          client_name: selectedItem?.client?.name || 'Client',
          industry: metadata.industry || 'financial-services',
          description: formData.brief || deliverableData.brief || 'Strategic analysis and recommendations project'
        },
        deliverableData: enrichedDeliverableData
      };

      console.log('🎭 Generating storyline with data:', requestData);

      const response = await fetch('/api/ai/generate-storyline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = typeof errorData.error === 'string' 
          ? errorData.error 
          : errorData.details 
          ? errorData.details 
          : JSON.stringify(errorData.error) || 'Failed to generate storyline';
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ Storyline generated successfully:', result);
      
      if (result.success && result.data) {
        console.log('ℹ️ Storyline generated via AI endpoint');
        
        // Parse the AI response - handle string payloads or wrapped responses
        let storylineData;
        try {
          const fallbackProject = requestData.projectData || {};

          const normaliseResponse = (payload) => {
            let parsed = payload;

            if (typeof parsed === 'string') {
              try {
                parsed = JSON.parse(parsed);
              } catch (stringParseError) {
                console.warn('⚠️ Unable to parse storyline string as JSON, returning empty sections.', stringParseError);
                return {
                  sections: [],
                  projectName: fallbackProject?.name,
                  client: fallbackProject?.client_name,
                  industry: fallbackProject?.industry,
                  executiveSummary: 'AI-generated storyline based on project requirements',
                  generationMode: 'ai',
                  agentId: result.agentId,
                  source: result.source
                };
              }
            }

            if (parsed?.response && typeof parsed.response === 'string') {
              return normaliseResponse(parsed.response);
            }

            if (parsed?.data && typeof parsed.data === 'string') {
              return normaliseResponse(parsed.data);
            }

            const sections = parsed?.storyline_structure?.sections
              || parsed?.sections
              || [];

            return {
              sections,
              projectName: parsed?.project_name || parsed?.projectName || fallbackProject?.name,
              client: parsed?.client || parsed?.clientName || fallbackProject?.client_name,
              industry: parsed?.industry || fallbackProject?.industry,
              executiveSummary: parsed?.executiveSummary || parsed?.executive_summary || 'AI-generated storyline based on project requirements',
              generationMode: parsed?.generationMode || parsed?.generation_mode || 'ai',
              agentId: parsed?.agentId || result.agentId,
              source: parsed?.source || result.source
            };
          };

          storylineData = normaliseResponse(result.data);
          
          console.log('📋 Parsed storyline data:', storylineData);
          
          // Save or update the storyline in the database
          try {
            const requestPayload = {
              deliverable: deliverableData._id || deliverableData.id || selectedItem._id || selectedItem.id,
              title: `Storyline for ${deliverableData.name || selectedItem.title}`,
              sections: (storylineData.sections || []).map((section, index) => ({
                id: section.id || `section_${index + 1}`,
                title: section.title || `Section ${index + 1}`,
                description: section.description || '',
                status: section.status || 'draft',
                order: index + 1,
                keyPoints: section.keyPoints || [],
                contentBlocks: section.contentBlocks || [],
                estimatedSlides: section.estimatedSlides || 3,
                locked: !!section.locked,
                lockedBy: section.lockedBy,
                lockedAt: section.lockedAt
              })),
              executiveSummary: storylineData.executiveSummary,
              generationMode: storylineData.generationMode || 'ai',
              agentId: storylineData.agentId,
              source: storylineData.source,
              projectName: storylineData.projectName,
              client: storylineData.client,
              industry: storylineData.industry
            };

            const saveResponse = await fetch('/api/storylines', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestPayload)
            });

            if (saveResponse.ok) {
              const savedStoryline = await saveResponse.json();
              const payload = savedStoryline.data || savedStoryline.storyline || savedStoryline;
              const apiSections = payload?.sections;
              const requestSections = requestPayload.sections;
              const sectionsToUse = (apiSections && apiSections.length > 0) ? apiSections : requestSections;
              console.log('✅ Storyline saved to database:', payload?._id);

              setGeneratedStoryline({
                ...payload,
                sections: (sectionsToUse || []).map((section, index) => ({
                  id: section.id || section._id || `section_${index + 1}`,
                  title: section.title,
                  description: section.description,
                  status: section.status || 'draft',
                  order: section.order ?? index,
                  keyPoints: section.keyPoints || [],
                  contentBlocks: section.contentBlocks || [],
                  estimatedSlides: section.estimatedSlides || 3,
                  locked: !!section.locked,
                  lockedBy: section.lockedBy,
                  lockedAt: section.lockedAt
                }))
              });
              setStorylineDirty(false);
            } else {
              console.error('❌ Failed to save storyline to database');
              setGeneratedStoryline({
                ...storylineData,
                sections: (storylineData.sections || []).map((section, index) => ({
                  id: section.id || `section_${index + 1}`,
                  title: section.title || `Section ${index + 1}`,
                  description: section.description || '',
                  status: section.status || 'draft',
                  order: index + 1,
                  keyPoints: section.keyPoints || [],
                  contentBlocks: section.contentBlocks || [],
                  estimatedSlides: section.estimatedSlides || 3,
                  locked: !!section.locked
                }))
              });
              setStorylineDirty(true);
            }
          } catch (saveError) {
            console.error('❌ Error saving storyline:', saveError);
            setGeneratedStoryline({
              ...storylineData,
              sections: (storylineData.sections || []).map((section, index) => ({
                id: section.id || `section_${index + 1}`,
                title: section.title || `Section ${index + 1}`,
                description: section.description || '',
                status: section.status || 'draft',
                order: index + 1,
                keyPoints: section.keyPoints || [],
                contentBlocks: section.contentBlocks || [],
                estimatedSlides: section.estimatedSlides || 3,
                locked: !!section.locked
              }))
            });
            setStorylineDirty(true);
          }

          setCurrentView('storyline');
          setCurrentSectionIndex(0);
        } catch (parseError) {
          console.error('❌ Error parsing AI storyline response:', parseError);
          throw new Error('Failed to parse AI storyline response');
        }
      } else {
        throw new Error(result.error || result.details || 'Invalid response format');
      }

    } catch (error) {
      console.error('❌ Error generating storyline:', error);
      const errorMessage = error.message || error.toString() || 'Unknown error occurred';
      alert(`Failed to generate storyline: ${errorMessage}`);
    } finally {
      setIsGeneratingStoryline(false);
    }
  };

  // Handle different content types
  if (!selectedItem) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <p className="text-lg mb-2">Select an item from the menu</p>
          <p className="text-sm">Choose a client, project, or deliverable to view details</p>
        </div>
      </div>
    );
  }

  if (selectedItem.type === 'client') {
    return (
      <div className="flex-1 p-6 flex flex-col min-h-0">
        <ClientDetailView 
          client={selectedItem}
          onUpdate={async (updatedClient) => {
            console.log('Updating client:', updatedClient);
          }}
          onDelete={async (clientToDelete) => {
            console.log('Deleting client:', clientToDelete);
          }}
        />
      </div>
    );
  }

  if (selectedItem.type === 'project') {
    const normalizedDeliverables = projectDeliverables.length > 0
      ? projectDeliverables
      : normalizeDeliverableList(projectForm.deliverables || []);

    return (
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="px-8 py-10 space-y-6">
          <header className="space-y-1">
            <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              {projectForm.name}
            </h1>
            <p className="text-sm text-gray-500">Project overview generated by Cigno AI</p>
          </header>

          <section className="bg-white border border-gray-200 rounded-sm p-6 space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={projectForm.description}
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
                  value={projectForm.client_owner}
                  onChange={(e) => handleProjectFormChange('client_owner', e.target.value)}
                  className="w-full rounded-sm border border-gray-200 px-4 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                >
                  <option value="">Select client contact...</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Internal Owner</label>
                <select
                  value={projectForm.internal_owner}
                  onChange={(e) => handleProjectFormChange('internal_owner', e.target.value)}
                  className="w-full rounded-sm border border-gray-200 px-4 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                >
                  <option value="">Select team member...</option>
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
                    className="flex items-center justify-center h-6 w-6 rounded-sm border border-gray-200 text-gray-500"
                    disabled
                    title="Add deliverable (coming soon)"
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
                      const baseTypes = ['Presentation', 'Report', 'Strategy', 'Analysis', 'Documentation', 'Other'];
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
                          <select
                            value={deliverable.type}
                            onChange={(e) => handleDeliverableTypeChange(deliverableId, e.target.value)}
                            className="rounded-sm border border-gray-200 px-3 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-900"
                          >
                            {typeOptions.map(option => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
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
      </div>
    );
  }

  // Deliverable view - matches the screenshot
  if (selectedItem.type === 'deliverable') {
    const storylineTitle = selectedItem?.title || formData.name;

    const handleStorylineTabClick = () => {
      if (generatedStoryline) {
        setCurrentView('storyline');
      } else {
        handleGenerateStoryline();
      }
    };

    const handleLayoutTabClick = () => {
      if (generatedStoryline) {
        setCurrentView('layout');
      } else {
        handleGenerateStoryline();
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
            onSaveStoryline={handleSaveStoryline}
            onGenerateStoryline={handleGenerateStoryline}
            currentSectionIndex={currentSectionIndex}
            onSectionChange={setCurrentSectionIndex}
            onUpdateSection={handleSectionUpdate}
            onStatusChange={handleSectionStatusChange}
            onToggleLock={handleToggleLock}
            onKeyPointsChange={handleKeyPointsChange}
            title={storylineTitle}
          />
        );
      }

      if (currentView === 'layout') {
        return (
          <DeliverableLayoutView
            hasStoryline={!!generatedStoryline}
            onGenerateStoryline={handleGenerateStoryline}
            isGeneratingStoryline={isGeneratingStoryline}
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
          onImproveBrief={handleImproveBrief}
          onGenerateStoryline={handleGenerateStoryline}
          isGeneratingStoryline={isGeneratingStoryline}
          onNewAudienceChange={setNewAudience}
          onNewAudienceKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              handleAddAudience();
            }
          }}
        />
      );
    })();

    return (
      <div className="flex-1 flex flex-col min-h-0" style={{ backgroundColor: 'var(--bg-primary)' }}>
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
              onClick={handleStorylineTabClick}
              className="px-4 py-2 rounded-t-sm font-medium transition-colors"
              style={{
                backgroundColor: currentView === 'storyline' ? 'var(--text-primary)' : 'var(--bg-secondary)',
                color: currentView === 'storyline' ? 'var(--bg-primary)' : 'var(--text-secondary)'
              }}
            >
              Storyline
            </button>
            <button
              onClick={handleLayoutTabClick}
              className="px-4 py-2 rounded-t-sm font-medium transition-colors"
              style={{
                backgroundColor: currentView === 'layout' ? 'var(--text-primary)' : 'var(--bg-secondary)',
                color: currentView === 'layout' ? 'var(--bg-primary)' : 'var(--text-secondary)'
              }}
            >
              Layout
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {deliverableView}
        </div>
      </div>
    );
  }


  // Default fallback
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center text-gray-500">
        <p className="text-lg mb-2">Unsupported item type</p>
        <p className="text-sm">Item type: {selectedItem?.type}</p>
      </div>
    </div>
  );
}
