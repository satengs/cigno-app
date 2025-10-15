'use client';

import { useState, useEffect, useMemo } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import Modal from './modals/Modal';
import Button from './buttons/Button';

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
    return value
      .split(/[\n\r•\-;]+/)
      .map(item => item.replace(/^[-•\d.\s]+/, '').trim())
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
    'content'
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

export default function ImproveBriefModal({
  isOpen,
  onClose,
  onSave,
  currentBrief = '',
  deliverable = {},
  projectData = {}
}) {
  const [editableBrief, setEditableBrief] = useState('');
  const [isImproving, setIsImproving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [hasImproved, setHasImproved] = useState(false);
  const [qualityScore, setQualityScore] = useState(null);
  const [improvements, setImprovements] = useState([]);
  const [strengths, setStrengths] = useState([]);
  const [isTesting, setIsTesting] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('');

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
      setEditableBrief(currentBriefText);
      setQualityScore(null);
      setImprovements([]);
      setStrengths([]);
      setIsTesting(false);
      setHasImproved(false);
      setError('');
      setCustomInstructions('');
    }
  }, [isOpen, currentBriefText, currentBrief]);

  const improveBrief = async () => {
    const originalBrief = currentBriefText.trim();
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

      let improvedHtml = extractBriefContent(candidateNodes, '');
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

      const normalizedQuality = Number.isFinite(newQuality)
        ? Number(newQuality.toFixed(1))
        : null;

      const normalizedImprovements = Array.isArray(newImprovements) ? newImprovements : normalizeInsightList(newImprovements);
      const normalizedStrengths = Array.isArray(newStrengths) ? newStrengths : normalizeInsightList(newStrengths);

      setEditableBrief(htmlToText(improvedHtml));
      setQualityScore(normalizedQuality);
      setImprovements(normalizedImprovements);
      setStrengths(normalizedStrengths);
      setHasImproved(true);
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
      if (onSave) {
        const strengthsArray = Array.isArray(strengths) ? strengths : normalizeInsightList(strengths);
        const improvementsArray = Array.isArray(improvements) ? improvements : normalizeInsightList(improvements);

        await onSave({
          brief: htmlBrief,
          qualityScore: Number.isFinite(qualityScore) ? Number(qualityScore.toFixed(1)) : null,
          strengths: strengthsArray,
          improvements: improvementsArray,
          strengthsText: strengthsArray.join('; '),
          improvementsText: improvementsArray.join('; ')
        });
      }
      onClose();
    } catch (error) {
      console.error('Error saving improved brief:', error);
      setError(error.message || 'Failed to save improved brief. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestBrief = async () => {
    const briefToScore = editableBrief.trim() || currentBriefText.trim();
    if (!briefToScore) {
      setError('Add brief content before testing.');
      return;
    }

    const deliverableId = deliverable._id || deliverable.id;
    if (!deliverableId) {
      setError('Unable to determine deliverable ID for scoring.');
      return;
    }

    setIsTesting(true);
    setError('');

    try {
      const response = await fetch('/api/ai/score-brief', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deliverableId,
          currentBrief: briefToScore,
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

      const result = await response.json();

      if (!response.ok || result?.error) {
        throw new Error(result?.error || result?.details || 'Failed to score brief.');
      }

      const payload = result.data || result;
      const candidateNodes = collectCandidateNodes(payload);

      const scoredQuality = extractNumberFromNodes(candidateNodes, [
        'qualityScore',
        'score',
        'rating',
        'overallScore',
        'briefQuality',
        'quality'
      ]);

      let scoredImprovements = extractListFromNodes(candidateNodes, [
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

      let scoredStrengths = extractListFromNodes(candidateNodes, [
        'recognizedStrengths',
        'recognized_strengths',
        'strengths',
        'highlights',
        'positives',
        'whatWentWell'
      ]);

      if (!scoredImprovements.length && payload.improvements) {
        scoredImprovements = normalizeInsightList(payload.improvements);
      }
      if (!scoredStrengths.length && payload.strengths) {
        scoredStrengths = normalizeInsightList(payload.strengths);
      }

      const normalizedQuality = Number.isFinite(scoredQuality)
        ? Number(scoredQuality.toFixed(1))
        : null;

      setQualityScore(normalizedQuality);
      setImprovements(Array.isArray(scoredImprovements) ? scoredImprovements : []);
      setStrengths(Array.isArray(scoredStrengths) ? scoredStrengths : []);
    } catch (scoreError) {
      console.error('Error scoring brief:', scoreError);
      setError(scoreError.message || 'Failed to score brief. Please try again.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Improve Brief"
      subtitle="Review the current brief, generate an AI suggestion, and refine before saving."
      size="xl"
      className="max-h-[95vh] overflow-hidden flex flex-col"
    >
      <div className="flex flex-col gap-4 flex-1 overflow-hidden">
        {(qualityScore !== null || improvements.length > 0 || strengths.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {qualityScore !== null && (
              <div className="border border-green-200 bg-green-50 rounded-lg p-3">
                <p className="text-sm font-medium text-green-800">Quality Score</p>
                <p className="text-2xl font-semibold text-green-900">{qualityScore.toFixed(1)} / 10</p>
                <p className="text-xs text-green-700 mt-1">Higher scores indicate clearer, more actionable briefs.</p>
              </div>
            )}
            {strengths.length > 0 && (
              <div className="border border-emerald-200 bg-emerald-50 rounded-lg p-3">
                <p className="text-sm font-medium text-emerald-800">Recognized Strengths</p>
                <ul className="mt-2 space-y-1 text-xs text-emerald-700">
                  {strengths.slice(0, 5).map((item, index) => (
                    <li key={index}>• {item}</li>
                  ))}
                  {strengths.length > 5 && (
                    <li>• +{strengths.length - 5} additional strengths</li>
                  )}
                </ul>
              </div>
            )}
            {improvements.length > 0 && (
              <div className="border border-blue-200 bg-blue-50 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-800">Suggested Improvements</p>
                <ul className="mt-2 space-y-1 text-xs text-blue-700">
                  {improvements.slice(0, 5).map((item, index) => (
                    <li key={index}>• {item}</li>
                  ))}
                  {improvements.length > 5 && (
                    <li>• +{improvements.length - 5} additional suggestions</li>
                  )}
                </ul>
              </div>
            )}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-hidden">
              <section className="border border-gray-200 rounded-lg overflow-hidden flex flex-col">
                <header className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                  <h4 className="text-sm font-medium text-gray-900">Current Brief</h4>
                  <p className="text-xs text-gray-500">{currentBriefText.length} characters</p>
                </header>
                <pre className="flex-1 overflow-auto bg-white p-4 text-sm text-gray-700 whitespace-pre-wrap">
                  {currentBriefText || 'No brief content provided.'}
                </pre>
              </section>

              <section className="border border-gray-200 rounded-lg overflow-hidden flex flex-col">
                <header className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                  <h4 className="text-sm font-medium text-gray-900">Working Draft</h4>
                  <p className="text-xs text-gray-500">{editableBrief.length} characters</p>
                </header>
                <textarea
                  value={editableBrief}
                  onChange={(event) => setEditableBrief(event.target.value)}
                  className="flex-1 w-full resize-none p-4 text-sm text-gray-800 focus:outline-none"
                  placeholder="The improved brief will appear here. You can edit it before saving."
                />
              </section>
            </div>

          </>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-4">
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
