'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import DeliverableStorylineView from '../../../../components/layout/deliverable/DeliverableStorylineView';
import AgentProgressTracker from '../../../../components/ui/AgentProgressTracker';
import { normalizeScoreValue } from '../../../../utils/scoreUtils';

const DEFAULT_STORYLINE_TITLE = 'Generated Storyline';

const META_KEYS = new Set([
  'title',
  'name',
  'description',
  'storyline',
  'sections',
  'slides',
  'globalStatus',
  'globalMessage',
  'executionOrder',
  'totalDuration',
  'agentResults',
  'success'
]);

function normalizeProgressValue(progress) {
  if (progress == null) return 0;
  if (typeof progress === 'number' && Number.isFinite(progress)) {
    return Math.max(0, Math.min(100, progress));
  }
  const numeric = Number(progress);
  if (Number.isFinite(numeric)) {
    return Math.max(0, Math.min(100, numeric));
  }
  return 0;
}

function tryParseJson(input) {
  if (typeof input !== 'string') return null;
  try {
    return JSON.parse(input);
  } catch (error) {
    return null;
  }
}

function formatTitleFromKey(key) {
  if (!key || typeof key !== 'string') return null;
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function toParagraphArray(value) {
  if (!value) return [];
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => toParagraphArray(item))
      .filter(Boolean);
  }
  if (typeof value === 'object') {
    const candidates = [
      value.paragraphs,
      value.content,
      value.text,
      value.description,
      value.summary,
      value.body,
      value.value
    ];
    for (const candidate of candidates) {
      const resolved = toParagraphArray(candidate);
      if (resolved.length) {
        return resolved;
      }
    }
    try {
      const serialized = JSON.stringify(value, null, 2);
      return serialized ? [serialized] : [];
    } catch (error) {
      return [];
    }
  }
  return [];
}

function buildSlideContent(incoming, fallbackTitle, fallbackId, previousSection) {
  if (!incoming && previousSection) {
    return previousSection.slide_content || previousSection.slideContent || null;
  }

  if (!incoming) {
    return null;
  }

  const existing = incoming.slide_content || incoming.slideContent;
  if (existing && Object.keys(existing).length > 0) {
    return existing;
  }

  const slides = Array.isArray(incoming.slides) ? incoming.slides : null;
  const sections = Array.isArray(incoming.sections) ? incoming.sections : null;
  if (slides || sections) {
    return {
      title: incoming.title || incoming.name || fallbackTitle,
      slides: slides || sections || [],
      sections: sections || slides || []
    };
  }

  const paragraphs = toParagraphArray(incoming);
  if (!paragraphs.length) {
    return previousSection?.slide_content || previousSection?.slideContent || null;
  }

  const entryId = incoming.id || incoming._id || fallbackId || `storyline-section-${Date.now()}`;
  const title = incoming.title || incoming.name || fallbackTitle;

  return {
    title,
    sections: [
      {
        id: `${entryId}-section`,
        title,
        content: paragraphs
      }
    ],
    slides: [
      {
        id: `${entryId}-slide`,
        title,
        content: paragraphs
      }
    ]
  };
}

function mergeSectionData(baseSection, incoming, index, storylineTitle, fallbackKey) {
  if (!incoming && !baseSection) {
    return null;
  }

  const result = {
    ...(baseSection || {})
  };

  const derivedId = incoming?.id || incoming?._id || baseSection?.id || fallbackKey || `storyline-section-${index}`;
  result.id = derivedId;

  const derivedTitle =
    incoming?.title ||
    incoming?.name ||
    incoming?.heading ||
    baseSection?.title ||
    (fallbackKey ? formatTitleFromKey(fallbackKey) : null) ||
    `Section ${index + 1}`;

  result.title = derivedTitle;
  result.framework = incoming?.framework || baseSection?.framework || null;

  const slideContent = buildSlideContent(incoming, derivedTitle || storylineTitle, derivedId, baseSection);
  if (slideContent) {
    result.slide_content = slideContent;
    result.slideContent = slideContent;
    result.sectionContent = {
      ...(result.sectionContent || {}),
      slideContent
    };
  }

  const mergedArray = (primary, fallback = []) => {
    if (Array.isArray(primary) && primary.length) {
      return primary;
    }
    if (Array.isArray(fallback) && fallback.length) {
      return fallback;
    }
    return [];
  };

  result.insights = mergedArray(
    incoming?.insights || incoming?.key_insights || incoming?.keyInsights || incoming?.summary_insights,
    baseSection?.insights
  );
  result.keyPoints = mergedArray(incoming?.keyPoints || incoming?.key_points, baseSection?.keyPoints);
  result.citations = mergedArray(incoming?.citations || incoming?.sources, baseSection?.citations);
  result.takeaway = incoming?.takeaway || incoming?.summary || baseSection?.takeaway || '';

  if (incoming?.notes) {
    result.notes = incoming.notes;
  }

  if (incoming?.statusTimeline && Array.isArray(incoming.statusTimeline)) {
    result.statusTimeline = incoming.statusTimeline;
  } else if (!Array.isArray(result.statusTimeline)) {
    result.statusTimeline = [];
  }

  result.isLoading = false;
  result.generationStatus = 'completed';
  result.progress = 100;
  result.phaseName = 'Storyline Completed';
  if (result.status !== 'locked' && result.status !== 'final') {
    result.status = 'draft';
  }

  result.source = incoming?.source || baseSection?.source || 'custom-agent-response';
  result.rawAgentResponse = incoming || baseSection?.rawAgentResponse;

  return result;
}

function extractFrameworkPayload(rawPayload, targetFramework) {
  if (!targetFramework) return null;

  const parsePayload = (value) => {
    if (!value) return null;
    if (typeof value === 'string') {
      const parsed = tryParseJson(value);
      return parsed || null;
    }
    return value;
  };

  const normalized = parsePayload(rawPayload);

  if (!normalized || typeof normalized !== 'object') {
    return null;
  }

  if (normalized[targetFramework]) {
    return parsePayload(normalized[targetFramework]) || normalized[targetFramework];
  }

  if (normalized.result) {
    const nested = extractFrameworkPayload(normalized.result, targetFramework);
    if (nested) return nested;
  }

  if (normalized.data) {
    const nested = extractFrameworkPayload(normalized.data, targetFramework);
    if (nested) return nested;
  }

  if (normalized.response) {
    const nested = extractFrameworkPayload(normalized.response, targetFramework);
    if (nested) return nested;
  }

  if (Array.isArray(normalized.storyline)) {
    const fromStoryline = normalized.storyline.find(item => {
      if (!item) return false;
      if (item.framework === targetFramework) return true;
      const keys = Object.keys(item);
      return keys.length === 1 && keys[0] === targetFramework;
    });
    if (fromStoryline) {
      if (fromStoryline[targetFramework]) {
        return parsePayload(fromStoryline[targetFramework]) || fromStoryline[targetFramework];
      }
      return parsePayload(fromStoryline) || fromStoryline;
    }
  }

  if (Array.isArray(normalized.sections)) {
    const fromSections = normalized.sections.find(item => item?.framework === targetFramework);
    if (fromSections) {
      return parsePayload(fromSections) || fromSections;
    }
  }

  return null;
}

function normalizeStorylinePayload(rawPayload, existingStoryline, targetFramework = null) {
  if (!rawPayload) {
    return null;
  }

  const baseStoryline = existingStoryline || null;
  let payload = rawPayload;

  if (targetFramework) {
    const targetedData = extractFrameworkPayload(rawPayload, targetFramework);
    if (targetedData) {
      if (baseStoryline) {
        const previousSections = Array.isArray(baseStoryline.sections) ? baseStoryline.sections : [];
        const sections = previousSections.map((section, index) => {
          if (section.framework !== targetFramework) {
            return section;
          }
          return mergeSectionData(section, targetedData, index, baseStoryline.title || DEFAULT_STORYLINE_TITLE, targetFramework);
        });

        return {
          ...baseStoryline,
          sections
        };
      }

      const newSection = mergeSectionData(null, targetedData, 0, DEFAULT_STORYLINE_TITLE, targetFramework);
      return {
        title: DEFAULT_STORYLINE_TITLE,
        sections: newSection ? [newSection] : []
      };
    }
  }

  if (typeof rawPayload === 'string') {
    const parsed = tryParseJson(rawPayload);
    payload = parsed || rawPayload;
  }

  if (payload && typeof payload === 'object') {
    if (payload.response !== undefined) {
      const responseData =
        typeof payload.response === 'string'
          ? tryParseJson(payload.response) || payload.response
          : payload.response;
      if (responseData && responseData !== payload) {
        return normalizeStorylinePayload(responseData, existingStoryline);
      }
    }

    if (payload.data && payload.data !== payload && typeof payload.data === 'object') {
      const dataResult = normalizeStorylinePayload(payload.data, existingStoryline);
      if (dataResult && dataResult !== existingStoryline) {
        return dataResult;
      }
    }

    if (payload.result && payload.result !== payload && typeof payload.result === 'object') {
      const resultData = normalizeStorylinePayload(payload.result, existingStoryline);
      if (resultData && resultData !== existingStoryline) {
        return resultData;
      }
    }
  }

  const titleFallback =
    (typeof payload === 'object' && payload && (payload.title || payload.name)) ||
    baseStoryline?.title ||
    DEFAULT_STORYLINE_TITLE;

  const previousSections = Array.isArray(baseStoryline?.sections) ? baseStoryline.sections : [];

  const buildFromArray = (items) => {
    const array = Array.isArray(items) ? items : [];
    if (!array.length && !previousSections.length) {
      return [];
    }
    const sections = array.map((item, index) =>
      mergeSectionData(previousSections[index], item, index, titleFallback)
    );
    if (previousSections.length > array.length) {
      return sections.concat(previousSections.slice(array.length));
    }
    return sections.filter(Boolean);
  };

  if (typeof payload === 'string') {
    const singleSection = mergeSectionData(previousSections[0], payload, 0, titleFallback);
    return {
      ...(baseStoryline || {}),
      title: titleFallback,
      sections: singleSection ? [singleSection] : previousSections
    };
  }

  if (Array.isArray(payload)) {
    const sections = buildFromArray(payload);
    return {
      ...(baseStoryline || {}),
      title: titleFallback,
      sections: sections.length ? sections : previousSections
    };
  }

  if (payload && Array.isArray(payload.storyline)) {
    const sections = buildFromArray(payload.storyline);
    return {
      ...(baseStoryline || {}),
      ...payload,
      title: payload.title || titleFallback,
      sections: sections.length ? sections : previousSections
    };
  }

  if (payload && Array.isArray(payload.sections)) {
    const sections = buildFromArray(payload.sections);
    return {
      ...(baseStoryline || {}),
      ...payload,
      title: payload.title || titleFallback,
      sections: sections.length ? sections : previousSections
    };
  }

  if (payload && typeof payload === 'object') {
    const sections = previousSections.map((section, index) => {
      const keyCandidates = [
        section.framework,
        section.framework?.replace(/-/g, '_'),
        section.framework?.replace(/_/g, '-'),
        section.id,
        section.title,
        section.title?.toLowerCase(),
        `section_${index + 1}`,
        `phase_${index + 1}`
      ].filter(Boolean);

      let incoming = null;
      for (const key of keyCandidates) {
        if (key && payload[key] !== undefined) {
          incoming = payload[key];
          break;
        }
      }

      if (!incoming && Array.isArray(payload.storyline)) {
        incoming = payload.storyline[index];
      }

      if (!incoming && Array.isArray(payload.sections)) {
        incoming = payload.sections.find((item) => item?.framework === section.framework || item?.id === section.id);
      }

      return mergeSectionData(section, incoming, index, payload.title || titleFallback);
    });

    const usedIds = new Set(sections.map((item) => item?.id).filter(Boolean));
    Object.entries(payload).forEach(([key, value]) => {
      if (META_KEYS.has(key)) {
        return;
      }
      if (typeof value !== 'object') {
        return;
      }
      const hasContent =
        value &&
        (value.slide_content ||
          value.slideContent ||
          value.content ||
          value.text ||
          value.summary ||
          value.sections ||
          value.slides);
      if (!hasContent) {
        return;
      }
      if (value.id && usedIds.has(value.id)) {
        return;
      }
      const merged = mergeSectionData(null, value, sections.length, payload.title || titleFallback, key);
      if (merged) {
        usedIds.add(merged.id);
        sections.push(merged);
      }
    });

    return {
      ...(baseStoryline || {}),
      ...payload,
      title: payload.title || titleFallback,
      sections: sections.filter(Boolean)
    };
  }

  return baseStoryline;
}

function buildStorylineFromExecution(executionStatus, existingStoryline, targetFramework = null) {
  if (!executionStatus) {
    return existingStoryline;
  }

  const candidates = [
    executionStatus?.result?.storyline,
    executionStatus?.storyline,
    executionStatus?.result?.response,
    executionStatus?.result,
    executionStatus
  ];

  for (const candidate of candidates) {
    const normalized = normalizeStorylinePayload(candidate, existingStoryline, targetFramework);
    if (normalized) {
      return normalized;
    }
  }

  return existingStoryline;
}

export default function DeliverableStorylinePage() {
  const { id } = useParams();
  const router = useRouter();
  const [deliverable, setDeliverable] = useState(null);
  const [generatedStoryline, setGeneratedStoryline] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingStoryline, setIsGeneratingStoryline] = useState(false);
  const [isSavingStoryline, setIsSavingStoryline] = useState(false);
  const [storylineDirty, setStorylineDirty] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [slideGenerationProgress, setSlideGenerationProgress] = useState(null);
  const [showProgressTracker, setShowProgressTracker] = useState(false);
  const [progressData, setProgressData] = useState(null);
  const [orchestrationId, setOrchestrationId] = useState(null);

  // Load deliverable and storyline data
  useEffect(() => {
    if (id) {
      loadDeliverableData();
      loadStorylineData();
    }
  }, [id]);

  const loadDeliverableData = async () => {
    try {
      const response = await fetch(`/api/deliverables/${id}`);
      if (!response.ok) {
        throw new Error('Failed to load deliverable');
      }
      const data = await response.json();
      setDeliverable(data.data || data);
    } catch (error) {
      console.error('Error loading deliverable:', error);
      router.push('/dashboard');
    }
  };

  const loadStorylineData = async () => {
    try {
      const response = await fetch(`/api/storylines?deliverable=${id}`);
      if (!response.ok) {
        throw new Error('Failed to load storyline');
      }
      const data = await response.json();
      const storylines = data.storylines || data;
      
      if (storylines.length > 0) {
        setGeneratedStoryline(storylines[0]);
      }
    } catch (error) {
      console.error('Error loading storyline:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateStoryline = async () => {
    if (isGeneratingStoryline) return;
    
    setIsGeneratingStoryline(true);
    try {
      // Start async storyline generation
      const response = await fetch('/api/ai/generate-storyline-async', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: id,
          projectData: deliverable,
          deliverableData: deliverable,
          clientData: deliverable
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start storyline generation');
      }

      const result = await response.json();
      const newOrchestrationId = result.orchestrationId;
      setOrchestrationId(newOrchestrationId);
      setShowProgressTracker(true);
      
      // Start polling for progress
      pollStorylineProgress(newOrchestrationId);
      
    } catch (error) {
      console.error('Error starting storyline generation:', error);
      alert('Failed to start storyline generation. Please try again.');
      setIsGeneratingStoryline(false);
    }
  };

  const pollStorylineProgress = async (orchestrationId) => {
    const pollInterval = 2000; // 2 seconds
    const maxAttempts = 150; // 5 minutes max
    
    let attempts = 0;
    
    const poll = async () => {
      try {
        const response = await fetch(`/api/ai/generate-storyline-async?orchestrationId=${orchestrationId}`);
        
        if (!response.ok) {
          throw new Error('Failed to check progress');
        }
        
        const executionStatus = await response.json();

        // Update progress data for UI
        const progressHistory = Array.isArray(executionStatus.progressHistory)
          ? executionStatus.progressHistory
          : [];
        const latestProgress = progressHistory.length
          ? progressHistory[progressHistory.length - 1]
          : null;
        const resolvedExecutionId =
          latestProgress?.executionId ||
          latestProgress?.execution_id ||
          executionStatus.executionId ||
          executionStatus.execution_id ||
          executionStatus.execution?.id ||
          null;
        const resolvedProgress =
          normalizeProgressValue(latestProgress?.progress ?? executionStatus.progress ?? executionStatus.completion);
        const resolvedStatus = (executionStatus.status || latestProgress?.status || '').toLowerCase();
        const resolvedMessage = latestProgress?.message || executionStatus.message || executionStatus.statusMessage;

        setProgressData({
          ...(latestProgress || {}),
          progress: resolvedProgress,
          status: resolvedStatus,
          message: resolvedMessage,
          totalAgents: progressHistory.length,
          history: progressHistory,
          executionId: resolvedExecutionId,
          orchestrationId,
          result: latestProgress?.result || executionStatus.result || null
        });
        console.log('Storyline generation progress:', executionStatus);

        if (executionStatus.status === 'completed') {
          const targetFramework = latestProgress?.framework
            || latestProgress?.frameworkId
            || latestProgress?.id
            || executionStatus.result?.framework
            || executionStatus.result?.context?.framework
            || executionStatus.data?.framework
            || executionStatus.data?.context?.framework
            || executionStatus.framework;

          setGeneratedStoryline(prev => buildStorylineFromExecution(
            executionStatus,
            prev,
            targetFramework
          ));
          setStorylineDirty(true);
          setIsGeneratingStoryline(false);
          setShowProgressTracker(false);
          setOrchestrationId(null);
          setProgressData(null);
          console.log('✅ Storyline generation completed');
        } else if (executionStatus.status === 'failed') {
          setShowProgressTracker(false);
          setOrchestrationId(null);
          setProgressData(null);
          throw new Error(executionStatus.error || 'Storyline generation failed');
        } else if (executionStatus.status === 'running') {
          // Continue polling
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(poll, pollInterval);
          } else {
            setShowProgressTracker(false);
            setOrchestrationId(null);
            setProgressData(null);
            throw new Error('Storyline generation timed out');
          }
        }
        
      } catch (error) {
        console.error('Error polling storyline progress:', error);
        alert('Storyline generation failed. Please try again.');
        setIsGeneratingStoryline(false);
        setShowProgressTracker(false);
        setOrchestrationId(null);
        setProgressData(null);
      }
    };
    
    // Start polling
    poll();
  };

  const handleRegenerateStoryline = async () => {
    if (isGeneratingStoryline) return;
    
    setIsGeneratingStoryline(true);
    try {
      const response = await fetch('/api/storyline/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliverableId: id,
          deliverableData: deliverable,
          existingStoryline: generatedStoryline
        })
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate storyline');
      }

      const result = await response.json();
      setGeneratedStoryline(result.data || result);
      setStorylineDirty(true);
    } catch (error) {
      console.error('Error regenerating storyline:', error);
      alert('Failed to regenerate storyline. Please try again.');
    } finally {
      setIsGeneratingStoryline(false);
    }
  };

  const handleSaveStoryline = async () => {
    if (!generatedStoryline || isSavingStoryline) return;
    
    setIsSavingStoryline(true);
    try {
      const response = await fetch(`/api/storylines/${generatedStoryline._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generatedStoryline)
      });

      if (!response.ok) {
        throw new Error('Failed to save storyline');
      }

      setStorylineDirty(false);
    } catch (error) {
      console.error('Error saving storyline:', error);
      alert('Failed to save storyline. Please try again.');
    } finally {
      setIsSavingStoryline(false);
    }
  };

  const handleGenerateSlides = async () => {
    // Implement slide generation logic
    console.log('Generate slides functionality');
  };

  const handleSectionUpdate = (sectionIndex, updates) => {
    if (!generatedStoryline) return;
    
    setGeneratedStoryline(prev => {
      const newSections = [...prev.sections];
      newSections[sectionIndex] = { ...newSections[sectionIndex], ...updates };
      return { ...prev, sections: newSections };
    });
    setStorylineDirty(true);
  };

  const handleSectionStatusChange = (sectionIndex, status) => {
    handleSectionUpdate(sectionIndex, { status });
  };

  const handleToggleLock = (sectionIndex) => {
    if (!generatedStoryline) return;
    
    const section = generatedStoryline.sections[sectionIndex];
    handleSectionUpdate(sectionIndex, { locked: !section.locked });
  };

  const handleRemoveSection = (sectionIndex) => {
    if (!generatedStoryline) return;
    
    setGeneratedStoryline(prev => {
      const newSections = prev.sections.filter((_, index) => index !== sectionIndex);
      return { ...prev, sections: newSections };
    });
    setStorylineDirty(true);
  };

  const handleRegenerateSection = async (sectionIndex) => {
    // Implement section regeneration logic
    console.log('Regenerate section functionality');
  };

  const handleResetStoryline = () => {
    setGeneratedStoryline(null);
    setStorylineDirty(false);
  };

  const handleCancelGeneration = async () => {
    if (orchestrationId) {
      try {
        const response = await fetch(`/api/ai/generate-storyline-async?orchestrationId=${orchestrationId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          console.log('Storyline generation cancelled');
        }
      } catch (error) {
        console.error('Error cancelling generation:', error);
      }
    }
    
    setIsGeneratingStoryline(false);
    setShowProgressTracker(false);
    setOrchestrationId(null);
    setProgressData(null);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading storyline...</p>
        </div>
      </div>
    );
  }

  const briefQuality = deliverable?.brief_quality ? normalizeScoreValue(deliverable.brief_quality) : null;

  return (
    <div className="h-screen flex">
      {/* Navigation */}
      <div className="w-64 bg-gray-50 border-r">
        <div className="p-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to Dashboard
          </button>
        </div>
        <div className="px-4">
          <h2 className="text-lg font-semibold text-gray-900">{deliverable?.name}</h2>
          <p className="text-sm text-gray-600">Storyline</p>
        </div>
        <nav className="mt-4">
          <a
            href={`/deliverable/${id}`}
            className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Details
          </a>
          <a
            href={`/deliverable/${id}/storyline`}
            className="block px-4 py-2 text-sm font-medium text-gray-900 bg-gray-100"
          >
            Storyline
          </a>
          <a
            href={`/deliverable/${id}/layout`}
            className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Layout
          </a>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <DeliverableStorylineView
          generatedStoryline={generatedStoryline}
          storylineDirty={storylineDirty}
          isSavingStoryline={isSavingStoryline}
          isGeneratingStoryline={isGeneratingStoryline}
          onSaveStoryline={handleSaveStoryline}
          onGenerateStoryline={handleGenerateStoryline}
          onRegenerateStoryline={handleRegenerateStoryline}
          onResetStoryline={handleResetStoryline}
          currentSectionIndex={currentSectionIndex}
          onSectionChange={setCurrentSectionIndex}
          onUpdateSection={handleSectionUpdate}
          onStatusChange={handleSectionStatusChange}
          onToggleLock={handleToggleLock}
          onRemoveSection={handleRemoveSection}
          onRegenerateSection={handleRegenerateSection}
          slideGenerationProgress={slideGenerationProgress}
          title={deliverable?.name}
          briefQuality={briefQuality}
        />
      </div>

      {/* Progress Tracker */}
      <AgentProgressTracker
        isVisible={showProgressTracker}
        progress={progressData}
        onClose={handleCancelGeneration}
      />
    </div>
  );
}
