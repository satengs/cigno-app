'use client';

import { useState, useEffect, useMemo } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import Modal from './modals/Modal';
import Button from './buttons/Button';
import { normalizeScoreValue } from '../../utils/scoreUtils';
import { saveBriefQuality, testBriefQuality } from '../../lib/services/BriefService';

const normalizeInsightList = (value, visited = new Set()) => {
  if (!value) return [];

  if (typeof value === 'object') {
    if (visited.has(value)) {
      return [];
    }
    visited.add(value);
  }

  if (Array.isArray(value)) {
    return value
      .flatMap(item => normalizeInsightList(item, visited))
      .map(item => (typeof item === 'string' ? item.trim() : String(item).trim()))
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    // Split only on actual bullet separators, not all dashes or hyphens
    return value
      .split(/[\n\r]+/)  // Only split on newlines, not on dashes
      .map(item => {
        // Remove leading bullet characters and numbers
        return item.replace(/^[•\-\*\d.\s]+/, '').trim();
      })
      .filter(item => item.length > 0);
  }

  return [String(value).trim()].filter(Boolean);
};

const collectCandidateNodes = (payload) => {
  const nodes = [];
  const visited = new Set();

  const addNode = (node) => {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach(addNode);
      return;
    }
    if (typeof node !== 'object') return;
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
  addNode(payload?.suggested_briefs);
  addNode(payload?.data?.suggested_briefs);
  addNode(payload?.primarySuggestion);
  addNode(payload?.primary_suggestion);
  addNode(payload?.data?.primarySuggestion);

  if (Array.isArray(payload?.sections)) {
    payload.sections.forEach(addNode);
  }

  if (Array.isArray(payload?.insights)) {
    payload.insights.forEach(addNode);
  }

  if (Array.isArray(payload?.suggested_briefs)) {
    payload.suggested_briefs.forEach(addNode);
  }

  if (Array.isArray(payload?.data?.suggested_briefs)) {
    payload.data.suggested_briefs.forEach(addNode);
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

const extractBriefContent = (nodes, fallbackValue) => {
  const candidateKeys = [
    'improvedBrief',
    'improved_brief',
    'updatedBrief',
    'generatedBrief',
    'revisedBrief',
    'draftBrief',
    'optimizedBrief',
    'html',
    'content',
    'improved_brief_text'
  ];

  for (const node of nodes) {
    if (!node || typeof node !== 'object') continue;
    for (const key of candidateKeys) {
      if (!Object.prototype.hasOwnProperty.call(node, key)) continue;
      const value = node[key];
      if (!value) continue;

      if (typeof value === 'string') {
        return value;
      }

      if (typeof value === 'object') {
        if (typeof value.html === 'string' && value.html.trim()) {
          return value.html;
        }
        if (typeof value.text === 'string' && value.text.trim()) {
          return value.text;
        }
        if (typeof value.content === 'string' && value.content.trim()) {
          return value.content;
        }
      }
    }
  }

  return fallbackValue;
};


const getScoreStyles = (score) => {
  if (!Number.isFinite(score)) {
    return {
      card: 'border-gray-200 bg-gray-50',
      title: 'text-gray-700',
      value: 'text-gray-800',
      note: 'text-gray-600',
      badge: 'bg-gray-300',
      statusLabel: 'Not evaluated yet',
      caption: 'Run "Test Brief" to evaluate quality before generating a storyline.'
    };
  }

  if (score < 7.5) {
    return {
      card: 'border-red-200 bg-red-50',
      title: 'text-red-800',
      value: 'text-red-900',
      note: 'text-red-700',
      badge: 'bg-red-500',
      statusLabel: 'Below minimum (7.5)',
      caption: 'Improve the brief before generating a storyline.'
    };
  }

  if (score < 8) {
    return {
      card: 'border-amber-200 bg-amber-50',
      title: 'text-amber-800',
      value: 'text-amber-900',
      note: 'text-amber-700',
      badge: 'bg-amber-500',
      statusLabel: 'Acceptable (≥ 7.5)',
      caption: 'Solid draft, but consider tightening before storytelling.'
    };
  }

  return {
    card: 'border-green-200 bg-green-50',
    title: 'text-green-800',
    value: 'text-green-900',
    note: 'text-green-700',
    badge: 'bg-green-500',
    statusLabel: 'Storyline-ready',
    caption: 'High-clarity brief suitable for storyline generation.'
  };
};

export default function ImproveBriefModal({
  isOpen,
  onClose,
  onSave,
  currentBrief = '',
  deliverable = {},
  projectData = {},
  onEvaluationSave
}) {
  const [editableBrief, setEditableBrief] = useState('');
  const [currentBriefDraft, setCurrentBriefDraft] = useState('');
  const [isImproving, setIsImproving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [hasImproved, setHasImproved] = useState(false);
  const [qualityScore, setQualityScore] = useState(null);
  const [improvements, setImprovements] = useState([]);
  const [strengths, setStrengths] = useState([]);
  const [autoScoreTimer, setAutoScoreTimer] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('');
  const [changeSummary, setChangeSummary] = useState([]);
  const [aiRationale, setAiRationale] = useState('');
  const [aiExpectedScore, setAiExpectedScore] = useState(null);

  const htmlToText = (html) => {
    if (!html) return '';
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };

  const textToHtml = (text) => text.replace(/\n/g, '<br>');

  const currentBriefText = useMemo(() => htmlToText(currentBrief), [currentBrief]);

  const buildDeliverableSummary = () => {
    if (!deliverable) return '';
    const lines = [
      deliverable.name ? `Name: ${deliverable.name}` : null,
      deliverable.type ? `Type: ${deliverable.type}` : null,
      Array.isArray(deliverable.audience) && deliverable.audience.length
        ? `Audience: ${deliverable.audience.join(', ')}`
        : deliverable.audience
        ? `Audience: ${deliverable.audience}`
        : null,
      deliverable.priority ? `Priority: ${deliverable.priority}` : null,
      deliverable.due_date ? `Due Date: ${deliverable.due_date}` : null,
      deliverable.description ? `Description: ${deliverable.description}` : null
    ].filter(Boolean);

    return lines.join('\n');
  };

  const buildProjectSummary = () => {
    if (!projectData) return '';
    const lines = [
      projectData.name ? `Project Name: ${projectData.name}` : null,
      projectData.client_name ? `Client: ${projectData.client_name}` : null,
      projectData.industry
        ? `Industry: ${Array.isArray(projectData.industry) ? projectData.industry.join(', ') : projectData.industry}`
        : null,
      projectData.geography ? `Geography: ${projectData.geography}` : null,
      projectData.objectives ? `Objectives: ${projectData.objectives}` : null,
      projectData.scope ? `Scope: ${projectData.scope}` : null
    ].filter(Boolean);

    return lines.join('\n');
  };

  useEffect(() => {
    if (isOpen) {
      console.log('');
      console.log('🔓 ========== MODAL OPENING ==========');
      console.log('Deliverable object:', deliverable);
      console.log('deliverable.brief_quality:', deliverable?.brief_quality);
      console.log('deliverable.briefQuality:', deliverable?.briefQuality);
      console.log('deliverable.brief_strengths:', deliverable?.brief_strengths);
      console.log('deliverable.brief_improvements:', deliverable?.brief_improvements);
      console.log('currentBrief:', typeof currentBrief, currentBrief);
      
      setEditableBrief(currentBriefText);
      setCurrentBriefDraft(currentBriefText);
      
      // Load current quality score from deliverable
      const initialQuality = normalizeScoreValue(
        deliverable?.brief_quality ??
        deliverable?.briefQuality ??
        (typeof currentBrief === 'object' ? currentBrief?.qualityScore : null)
      );
      
      const initialStrengths = deliverable?.brief_strengths 
        || deliverable?.strengths 
        || (typeof currentBrief === 'object' ? currentBrief?.strengths : null)
        || [];
        
      const initialImprovements = deliverable?.brief_improvements 
        || deliverable?.improvements
        || (typeof currentBrief === 'object' ? currentBrief?.improvements : null)
        || [];
      
      console.log('📊 [MODAL OPEN] Loaded quality score:', initialQuality);
      console.log('📊 [MODAL OPEN] Loaded strengths:', initialStrengths.length, 'items');
      console.log('📊 [MODAL OPEN] Loaded improvements:', initialImprovements.length, 'items');
      console.log('🔓 ========== END MODAL OPEN ==========');
      console.log('');
      
      setQualityScore(initialQuality);
      setImprovements(initialImprovements);
      setStrengths(initialStrengths);
      setIsTesting(false);
      setHasImproved(false);
      setError('');
      setCustomInstructions('');
      setChangeSummary([]);
      setAiRationale('');
      setAiExpectedScore(null);
    }
  }, [isOpen, currentBriefText, currentBrief, deliverable]);

  const improveBrief = async () => {
    const originalBrief = currentBriefDraft.trim();
    const workingDraft = editableBrief.trim();
    const briefToImprove = workingDraft || originalBrief;

    if (!briefToImprove) {
      setError('No brief content to improve.');
      return;
    }

    setIsImproving(true);
    setError('');

    try {
      const deliverableId = deliverable._id || deliverable.id;
      const response = await fetch('/api/ai/improve-brief', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deliverableId,
          currentBrief: originalBrief || briefToImprove,
          workingDraft: briefToImprove,
          instructions: customInstructions.trim(),
          deliverableData: {
            title: deliverable.name,
            type: deliverable.type,
            audience: deliverable.audience,
            priority: deliverable.priority,
            dueDate: deliverable.due_date,
            summary: buildDeliverableSummary()
          },
          projectData: {
            ...projectData,
            summary: buildProjectSummary()
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to improve brief: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      const payload = result.data || result;
      const candidateNodes = collectCandidateNodes(payload);

      const suggestedBriefs = [
        ...(Array.isArray(payload?.suggested_briefs) ? payload.suggested_briefs : []),
        ...(Array.isArray(payload?.data?.suggested_briefs) ? payload.data.suggested_briefs : [])
      ];

      const primarySuggestion = suggestedBriefs.find((item) => {
        if (!item) return false;
        return Boolean(
          item.improved_brief_text ||
            item.improvedBrief ||
            item.improved_brief ||
            item.updatedBrief ||
            item.generatedBrief
        );
      }) || suggestedBriefs[0];

      let improvedHtml = extractBriefContent(candidateNodes, '');
      if (!improvedHtml && primarySuggestion?.improved_brief_text) {
        improvedHtml = primarySuggestion.improved_brief_text;
      }
      let newQuality = extractNumberFromNodes(candidateNodes, [
        'qualityScore',
        'score',
        'rating',
        'overallScore',
        'briefQuality',
        'quality'
      ]);
      let newStrengths = extractListFromNodes(candidateNodes, [
        'recognizedStrengths',
        'recognized_strengths',
        'strengths',
        'highlights',
        'positives',
        'whatWentWell'
      ]);
      let newImprovements = extractListFromNodes(candidateNodes, [
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

      if (!improvedHtml) {
        if (payload.improvedBrief) {
          improvedHtml = payload.improvedBrief;
        } else if (payload.response) {
          try {
            const parsed = typeof payload.response === 'string' ? JSON.parse(payload.response) : payload.response;
            improvedHtml = parsed.improvedBrief || parsed.brief || payload.response;
            if (newQuality === null || newQuality === undefined) {
              newQuality = extractNumberFromNodes(collectCandidateNodes(parsed), [
                'qualityScore',
                'score',
                'rating'
              ]);
            }
            if (!newImprovements.length && parsed.improvements) {
              newImprovements = normalizeInsightList(parsed.improvements);
            }
            if (!newStrengths.length && parsed.strengths) {
              newStrengths = normalizeInsightList(parsed.strengths);
            }
          } catch (error) {
            improvedHtml = payload.response;
          }
        } else if (payload.message) {
          improvedHtml = payload.message;
        } else if (typeof payload === 'string') {
          improvedHtml = payload;
        } else {
          improvedHtml = JSON.stringify(payload, null, 2);
        }
      }

      if ((newQuality === null || newQuality === undefined) && payload.qualityScore) {
        const numeric = Number(payload.qualityScore);
        if (Number.isFinite(numeric)) {
          newQuality = numeric;
        }
      }

      if ((newQuality === null || newQuality === undefined) && payload.scoring?.data?.qualityScore) {
        const numeric = Number(payload.scoring.data.qualityScore);
        if (Number.isFinite(numeric)) {
          newQuality = numeric;
        }
      }

      if (!newImprovements.length && payload.improvements) {
        newImprovements = normalizeInsightList(payload.improvements);
      }
      if (!newImprovements.length && Array.isArray(payload.scoring?.data?.improvements)) {
        newImprovements = normalizeInsightList(payload.scoring.data.improvements);
      }

      if (!newStrengths.length && payload.strengths) {
        newStrengths = normalizeInsightList(payload.strengths);
      }
      if (!newStrengths.length && Array.isArray(payload.scoring?.data?.strengths)) {
        newStrengths = normalizeInsightList(payload.scoring.data.strengths);
      }

      const normalizedQuality = normalizeScoreValue(newQuality);

      const normalizedImprovements = Array.isArray(newImprovements) ? newImprovements : normalizeInsightList(newImprovements);
      const normalizedStrengths = Array.isArray(newStrengths) ? newStrengths : normalizeInsightList(newStrengths);
      const normalizedChanges = normalizeInsightList(
        primarySuggestion?.changes_made ||
          primarySuggestion?.changesMade ||
          payload?.changes_made ||
          payload?.changes ||
          []
      );
      const rationaleText =
        primarySuggestion?.rationale ||
        primarySuggestion?.insight ||
        payload?.rationale ||
        payload?.insight ||
        '';
      
      // Extract expected score
      const expectedScoreValue =
        primarySuggestion?.expected_score ??
        primarySuggestion?.expectedScore ??
        payload?.expected_score ??
        payload?.expectedScore;
      
      console.log('📊 [IMPROVE] Raw expected_score from API:', expectedScoreValue);
      console.log('📊 [IMPROVE] Type:', typeof expectedScoreValue);
      
      // normalizeScoreValue already handles 0-100 to 0-10 conversion
      const normalizedExpectedScore = normalizeScoreValue(expectedScoreValue);
      
      console.log('📊 [IMPROVE] Normalized expected_score:', normalizedExpectedScore);
      console.log('📊 [IMPROVE] Will set aiExpectedScore state to:', normalizedExpectedScore);

      setEditableBrief(htmlToText(improvedHtml));
      setChangeSummary(normalizedChanges);
      setAiRationale(rationaleText);
      setAiExpectedScore(normalizedExpectedScore);
      setHasImproved(true);
      
      console.log('');
      console.log('✅ ========== IMPROVE BRIEF COMPLETE ==========');
      console.log('Improved text set:', htmlToText(improvedHtml).substring(0, 100) + '...');
      console.log('Changes made:', normalizedChanges.length, 'items');
      console.log('AI rationale:', rationaleText);
      console.log('aiExpectedScore STATE SET TO:', normalizedExpectedScore);
      console.log('hasImproved STATE SET TO:', true);
      console.log('✅ ========== END IMPROVE ==========');
      console.log('');
    } catch (error) {
      console.error('Error improving brief:', error);
      setError(error.message || 'Failed to improve brief. Please try again.');
    } finally {
      setIsImproving(false);
    }
  };

  const handleSave = async () => {
    const briefToSave = editableBrief.trim();

    if (!briefToSave) {
      setError('Cannot save an empty brief.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const htmlBrief = textToHtml(briefToSave);
      const strengthsArray = Array.isArray(strengths) ? strengths : normalizeInsightList(strengths);
      const improvementsArray = Array.isArray(improvements) ? improvements : normalizeInsightList(improvements);

      console.log('');
      console.log('💾 ========== SAVE FROM POPUP ==========');
      console.log('Brief content length:', htmlBrief.length);
      console.log('Current qualityScore state:', qualityScore);
      console.log('Expected score after improvements:', aiExpectedScore);
      console.log('Has improved?:', hasImproved);
      console.log('Strengths count:', strengthsArray.length);
      console.log('Improvements count:', improvementsArray.length);
      
      // If brief was improved but not tested, use the expected score
      const scoreToSave = hasImproved && aiExpectedScore !== null ? aiExpectedScore : qualityScore;
      
      console.log('Score that will be saved:', scoreToSave);
      console.log('💾 ========== END SAVE INFO ==========');
      console.log('');

      // Save brief and quality using callback
      if (onSave) {
        await onSave({
          brief: htmlBrief,
          qualityScore: scoreToSave,
          strengths: strengthsArray,
          improvements: improvementsArray
        });
      }
      
      onClose();
    } catch (error) {
      console.error('❌ Error saving improved brief:', error);
      setError(error.message || 'Failed to save improved brief. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };


  const handleTestBrief = async () => {
    const briefToScore = editableBrief.trim() || currentBriefDraft.trim();
    if (!briefToScore) {
      setError('Add brief content before testing.');
      return;
    }

    const deliverableId = deliverable._id || deliverable.id;
    if (!deliverableId) {
      setError('Unable to determine deliverable ID.');
      return;
    }

    setIsTesting(true);
    setError('');

    try {
      // Use centralized service with FULL context (same as improve-brief)
      const qualityData = await testBriefQuality(
        deliverableId,
        briefToScore,
        {
          title: deliverable.name,
          type: deliverable.type,
          audience: deliverable.audience,
          priority: deliverable.priority,
          dueDate: deliverable.due_date,
          summary: buildDeliverableSummary()
        },
        {
          ...projectData,
          summary: buildProjectSummary()
        }
      );

      // Update UI state
      setQualityScore(qualityData.score);
      setImprovements(qualityData.improvements);
      setStrengths(qualityData.strengths);

      console.log('✅ Test complete and saved');
    } catch (error) {
      console.error('❌ Test failed:', error);
      setError(error.message);
    } finally {
      setIsTesting(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  const hasInsights =
    qualityScore !== null ||
    improvements.length > 0 ||
    strengths.length > 0 ||
    changeSummary.length > 0 ||
    Boolean(aiRationale) ||
    aiExpectedScore !== null;

  const formattedExpectedScore = Number.isFinite(aiExpectedScore)
    ? aiExpectedScore.toFixed(1)
    : null;

  const qualityStyles = getScoreStyles(qualityScore);
  const expectedStyles = getScoreStyles(aiExpectedScore);
  const isBelowThreshold = Number.isFinite(qualityScore) && qualityScore < 7.5;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Improve Brief"
      subtitle="Review the current brief, generate an AI suggestion, and refine before saving."
      size="xl"
      fullHeight
      className="h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] my-6 overflow-hidden flex flex-col"
    >
      <div className="flex flex-col gap-4 flex-1 overflow-hidden min-h-0">
        {/* Score Cards - Always visible */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {qualityScore !== null && (
            <div className={`rounded-lg p-3 border ${qualityStyles.card}`}>
              <div className="flex items-center justify-between">
                <p className={`text-sm font-medium ${qualityStyles.title}`}>Current Brief Score</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full text-white ${qualityStyles.badge}`}>
                  {qualityStyles.statusLabel}
                </span>
              </div>
              <p className={`text-2xl font-semibold ${qualityStyles.value}`}>{qualityScore.toFixed(1)} / 10</p>
              <p className={`text-xs mt-1 ${qualityStyles.note}`}>{qualityStyles.caption}</p>
            </div>
          )}
          {formattedExpectedScore !== null && hasImproved && (
            <div className={`rounded-lg p-3 border ${expectedStyles.card}`}>
              <div className="flex items-center justify-between">
                <p className={`text-sm font-medium ${expectedStyles.title}`}>After Improvements</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full text-white ${expectedStyles.badge}`}>
                  {expectedStyles.statusLabel}
                </span>
              </div>
              <p className={`text-2xl font-semibold ${expectedStyles.value}`}>{formattedExpectedScore} / 10</p>
              <p className={`text-xs mt-1 ${expectedStyles.note}`}>Estimated score with AI improvements</p>
            </div>
          )}
        </div>

        {/* Feedback - Only show suggestions before improving */}
        {!hasImproved && improvements.length > 0 && (
          <div className="border border-blue-200 bg-blue-50 rounded-lg p-3">
            <p className="text-sm font-medium text-blue-800 mb-2">Suggestions to Improve</p>
            <ul className="space-y-1 text-xs text-blue-700">
              {improvements.slice(0, 4).map((item, index) => (
                <li key={index}>• {item}</li>
              ))}
              {improvements.length > 4 && (
                <li className="text-blue-600 font-medium mt-1">+{improvements.length - 4} more suggestions</li>
              )}
            </ul>
          </div>
        )}
        
        {/* Changes - Only show after improving */}
        {hasImproved && changeSummary.length > 0 && (
          <div className="border border-purple-200 bg-purple-50 rounded-lg p-3">
            <p className="text-sm font-medium text-purple-800 mb-2">AI Improvements Applied</p>
            <ul className="space-y-1 text-xs text-purple-700">
              {changeSummary.map((item, index) => (
                <li key={index}>• {item}</li>
              ))}
            </ul>
          </div>
        )}


        {isBelowThreshold && (
          <div className="border border-red-200 bg-red-50 text-xs text-red-700 rounded-lg p-3">
            Brief quality is below the 7.5 minimum required for storyline generation. Address the suggested improvements and retest the brief.
          </div>
        )}

        {aiRationale && (
          <div className="border border-slate-200 bg-slate-50 rounded-lg p-3">
            <p className="text-sm font-medium text-slate-800">AI Rationale</p>
            <p className="mt-2 text-sm text-slate-700 whitespace-pre-line">{aiRationale}</p>
          </div>
        )}

        {error && (
          <div className="border border-red-200 bg-red-50 text-sm text-red-700 rounded-lg p-3 flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={improveBrief}
              disabled={isImproving}
              className="flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          </div>
        )}

        {isImproving && (
          <div className="flex items-center justify-center py-6">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-500" />
              <p className="text-sm text-gray-600">Generating an improved version of your brief…</p>
            </div>
          </div>
        )}

        {!isImproving && (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Current vs. Improved Brief</h3>
                <p className="text-xs text-gray-500">Review the existing brief alongside the working version you can edit.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestBrief}
                  disabled={isImproving || isTesting}
                >
                  {isTesting ? 'Testing…' : 'Test Brief'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={improveBrief}
                  disabled={isImproving}
                >
                  Improve with AI
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700" htmlFor="improve-brief-notes">
                  Additional Guidance (optional)
                </label>
                <textarea
                  id="improve-brief-notes"
                  value={customInstructions}
                  onChange={(event) => setCustomInstructions(event.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  placeholder="Add notes about what you want to change or emphasise in the improved brief."
                />
                <p className="text-xs text-gray-500">
                  These notes are sent to the AI along with the current brief and working draft.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-hidden min-h-0">
              <section className="border border-gray-200 rounded-lg overflow-hidden flex flex-col min-h-0">
                <header className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                  <h4 className="text-sm font-medium text-gray-900">Current Brief</h4>
                  <p className="text-xs text-gray-500">{currentBriefDraft.length} characters</p>
                </header>
                <textarea
                  value={currentBriefDraft}
                  onChange={(event) => setCurrentBriefDraft(event.target.value)}
                  className="flex-1 w-full resize-none p-4 text-sm text-gray-800 focus:outline-none min-h-[300px]"
                  placeholder="Paste or edit the current brief content here before requesting improvements."
                />
              </section>

              <section className="border border-gray-200 rounded-lg overflow-hidden flex flex-col min-h-0">
                <header className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                  <h4 className="text-sm font-medium text-gray-900">Working Draft</h4>
                  <p className="text-xs text-gray-500">{editableBrief.length} characters</p>
                </header>
                <textarea
                  value={editableBrief}
                  onChange={(event) => setEditableBrief(event.target.value)}
                  className="flex-1 w-full resize-none p-4 text-sm text-gray-800 focus:outline-none min-h-[300px]"
                  placeholder="The improved brief will appear here. You can edit it before saving."
                />
              </section>
            </div>

          </>
        )}
      </div>

      <div className="mt-auto flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button variant="outline" onClick={handleClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isImproving || isSaving || !editableBrief.trim()}
        >
          {isSaving ? 'Saving…' : hasImproved ? 'Save Improved Brief' : 'Save Brief'}
        </Button>
      </div>
    </Modal>
  );
}
