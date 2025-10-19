'use client';

import { useState, useEffect, useMemo } from 'react';
import Button from '../ui/buttons/Button';
import ImproveBriefModal from '../ui/ImproveBriefModal';
import { FileText, Wand2, Save, ArrowLeft, X, Sparkles, BookOpen } from 'lucide-react';
import { normalizeScoreValue, isScoreAboveThreshold } from '../../utils/scoreUtils';

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



export default function DeliverableSettingsPage({ 
  deliverable,
  onSave,
  onBack,
  onGenerateStoryline,
  isGeneratingStoryline
}) {
  const [formData, setFormData] = useState({
    brief: '',
    briefQuality: null,
    recognizedStrengths: [],
    suggestedImprovements: [],
    notes: '',
    tags: []
  });
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showImproveBriefModal, setShowImproveBriefModal] = useState(false);

  const qualityScore = normalizeScoreValue(formData.briefQuality);
  const storylineScoreThreshold = 7.5;

  const recognizedStrengths = Array.isArray(formData.recognizedStrengths)
    ? formData.recognizedStrengths
    : normalizeInsightList(formData.recognizedStrengths);

  const suggestedImprovements = Array.isArray(formData.suggestedImprovements)
    ? formData.suggestedImprovements
    : normalizeInsightList(formData.suggestedImprovements);

  const qualityPercent = qualityScore !== null
    ? Math.min(100, Math.max(0, (qualityScore / 10) * 100))
    : 0;
  const meetsScoreThreshold = qualityScore !== null && isScoreAboveThreshold(qualityScore, storylineScoreThreshold);
  const canGenerateStoryline = meetsScoreThreshold;

  const projectInfo = useMemo(() => {
    if (!deliverable) {
      return {
        id: null,
        name: '',
        client_name: '',
        industry: '',
        summary: ''
      };
    }

    const metadata = deliverable.metadata || {};
    const rawIndustry = Array.isArray(metadata.industry)
      ? metadata.industry.filter(Boolean).join(', ')
      : metadata.industry || deliverable.industry || '';

    const name = metadata.project_name || deliverable.project_name || '';
    const clientName = metadata.client_name || deliverable.client_name || '';
    const industry = rawIndustry || '';
    const geography = metadata.geography || '';
    const objectives = metadata.objectives || '';
    const scope = metadata.scope || '';
    const description = metadata.project_description || metadata.description || '';

    const summaryLines = [
      name ? `Project Name: ${name}` : null,
      clientName ? `Client: ${clientName}` : null,
      industry ? `Industry: ${industry}` : null,
      geography ? `Geography: ${geography}` : null,
      objectives ? `Objectives: ${objectives}` : null,
      scope ? `Scope: ${scope}` : null
    ].filter(Boolean);

    if (description) {
      if (summaryLines.length) {
        summaryLines.push('');
      }
      summaryLines.push(description);
    }

    return {
      id: metadata.project_id || metadata.projectId || deliverable.project || deliverable.projectId || null,
      name,
      client_name: clientName,
      industry,
      geography,
      objectives,
      scope,
      description,
      summary: summaryLines.join('\n')
    };
  }, [deliverable]);

  useEffect(() => {
    if (deliverable) {
      // Debug: Log the deliverable object to see its structure
      console.log('🔍 DeliverableSettingsPage received deliverable:', {
        full: deliverable,
        _id: deliverable._id,
        id: deliverable.id,
        name: deliverable.name,
        hasId: !!(deliverable._id || deliverable.id),
        idValue: deliverable._id || deliverable.id
      });
      
      // Generate intelligent defaults based on deliverable type and details
      const intelligentBrief = generateIntelligentBrief(deliverable);
      const intelligentTags = generateIntelligentTags(deliverable);
      const intelligentNotes = generateIntelligentNotes(deliverable);

      const strengthInsights = normalizeInsightList(
        deliverable.brief_strengths ??
        deliverable.recognized_strengths ??
        deliverable.recognizedStrengths ??
        deliverable.strengths
      );

      const improvementInsights = normalizeInsightList(
        deliverable.brief_improvements ??
        deliverable.suggested_improvements ??
        deliverable.suggestedImprovements ??
        deliverable.improvements
      );

      const qualityValue = Number(deliverable.brief_quality ?? deliverable.briefQuality);
      const normalizedQuality = normalizeScoreValue(qualityValue);
      
      setFormData({
        brief: deliverable.brief || intelligentBrief,
        briefQuality: normalizedQuality,
        recognizedStrengths: strengthInsights.length ? strengthInsights : [],
        suggestedImprovements: improvementInsights.length ? improvementInsights : [],
        notes: deliverable.notes || intelligentNotes,
        tags: deliverable.tags || intelligentTags
      });
    }
  }, [deliverable]);

  // Generate intelligent brief based on deliverable details
  const generateIntelligentBrief = (deliverable) => {
    const type = deliverable.type?.toLowerCase() || 'deliverable';
    const audience = deliverable.audience?.join(', ') || 'stakeholders';
    const priority = deliverable.priority || 'medium';
    
    return `**${deliverable.name}**

This ${type} is designed to deliver strategic value to ${audience} with ${priority} priority focus.

**Objectives:**
• Provide comprehensive analysis and actionable recommendations
• Present data-driven insights for informed decision-making
• Deliver clear, structured information in ${deliverable.format || 'professional'} format
• Support strategic planning and implementation initiatives

**Scope:**
The deliverable will contain approximately ${deliverable.size || '25 slides'} of curated content, focusing on key areas relevant to the project requirements.

**Expected Outcomes:**
• Clear understanding of current state and opportunities
• Strategic recommendations with implementation roadmap
• Risk assessment and mitigation strategies
• Next steps and action items for stakeholders

**Timeline:** Target completion by ${deliverable.due_date ? new Date(deliverable.due_date).toLocaleDateString() : 'TBD'}`;
  };

  // Generate intelligent tags based on deliverable type and details
  const generateIntelligentTags = (deliverable) => {
    const baseTags = ['analysis', 'strategy'];
    const typeBasedTags = {
      'presentation': ['slides', 'visual', 'executive'],
      'report': ['detailed', 'research', 'documentation'],
      'analysis': ['data', 'insights', 'metrics'],
      'strategy': ['planning', 'roadmap', 'framework'],
      'design': ['visual', 'ux', 'prototype'],
      'code': ['development', 'technical', 'implementation']
    };
    
    const priorityTags = {
      'high': ['urgent', 'critical'],
      'medium': ['important'],
      'low': ['routine']
    };
    
    const additionalTags = typeBasedTags[deliverable.type?.toLowerCase()] || [];
    const priorityBasedTags = priorityTags[deliverable.priority] || [];
    
    return [...baseTags, ...additionalTags, ...priorityBasedTags].slice(0, 5);
  };

  // Generate intelligent notes based on deliverable details
  const generateIntelligentNotes = (deliverable) => {
    return `**Project Context:**
• Deliverable type: ${deliverable.type}
• Target audience: ${deliverable.audience?.join(', ') || 'To be confirmed'}
• Expected format: ${deliverable.format}
• Estimated effort: ${deliverable.estimated_hours || 'TBD'} hours

**Key Considerations:**
• Ensure content aligns with stakeholder expectations
• Maintain consistent formatting and professional presentation
• Include actionable recommendations and next steps
• Review and validate with subject matter experts before delivery

**Quality Assurance:**
• Content review by project lead
• Technical accuracy verification
• Formatting and design consistency check
• Stakeholder feedback incorporation`;
  };

  const generateBrief = async () => {
    setIsGeneratingBrief(true);
    try {
      // Simulate AI brief generation based on deliverable details
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const generatedBrief = `This ${deliverable.type?.toLowerCase() || 'deliverable'} "${deliverable.name}" is designed for ${deliverable.audience?.join(', ') || 'stakeholders'}. 

Key objectives:
• Present comprehensive analysis and strategic recommendations
• Address technical and business requirements
• Provide actionable insights for decision-making
• Ensure alignment with organizational goals

The deliverable will be formatted as ${deliverable.format || 'PDF'} and is expected to contain approximately ${deliverable.size || '25 slides'} of content. Priority level: ${deliverable.priority || 'medium'}.

Target completion: ${deliverable.due_date ? new Date(deliverable.due_date).toLocaleDateString() : 'TBD'}`;
      
      setFormData(prev => ({ 
        ...prev, 
        brief: generatedBrief
      }));
    } catch (error) {
      console.error('Error generating brief:', error);
      setErrors({ brief: 'Failed to generate brief. Please try again.' });
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImproveBriefSave = async (result) => {
    console.log('');
    console.log('📥 ========== SETTINGS SAVE HANDLER CALLED ==========');
    console.log('Result object received:', result);
    console.log('result.brief length:', result.brief?.length);
    console.log('result.qualityScore:', result.qualityScore);
    console.log('result.strengths count:', result.strengths?.length);
    console.log('result.improvements count:', result.improvements?.length);
    console.log('📥 ========== END RESULT ==========');
    console.log('');
    
    const deliverableId = deliverable._id || deliverable.id;
    
    try {
      console.log('💾 [SETTINGS SAVE] Saving...');
      console.log('💾 [SETTINGS SAVE] Score being saved:', result.qualityScore);
      
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
      console.log('✅ [SETTINGS SAVE] Saved, returned score:', updated.brief_quality);
      
      // Update form state
      setFormData(prev => {
        const newData = {
          ...prev,
          brief: updated.brief,
          briefQuality: updated.brief_quality,
          recognizedStrengths: updated.brief_strengths || [],
          suggestedImprovements: updated.brief_improvements || []
        };
        console.log('📝 [SETTINGS SAVE] Updated briefQuality to:', newData.briefQuality);
        return newData;
      });

    } catch (error) {
      console.error('❌ [SETTINGS SAVE] Failed:', error);
      throw error;
    }
  };

  const handleBriefEvaluationSave = async ({ qualityScore, strengths = [], improvements = [] }) => {
    // Update form state when test happens
    console.log('📝 [EVAL SAVE] Updating form state, score:', qualityScore);
    setFormData(prev => ({
      ...prev,
      briefQuality: qualityScore,
      recognizedStrengths: strengths,
      suggestedImprovements: improvements
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    setErrors({});

    try {
      const updateData = {
        brief: formData.brief,
        notes: formData.notes,
        tags: formData.tags
      };

      if (formData.briefQuality !== undefined && formData.briefQuality !== null) {
        const numericQuality = Number(formData.briefQuality);
        const normalizedQuality = normalizeScoreValue(numericQuality);
        if (normalizedQuality !== null) {
          updateData.brief_quality = normalizedQuality;
        }
      }

      if (Array.isArray(formData.recognizedStrengths)) {
        updateData.brief_strengths = formData.recognizedStrengths;
      }

      if (Array.isArray(formData.suggestedImprovements)) {
        updateData.brief_improvements = formData.suggestedImprovements;
      }

      // Debug: Check the ID before sending
      const deliverableId = deliverable._id || deliverable.id;
      console.log('🔍 DeliverableSettingsPage calling API with:', {
        deliverable,
        deliverableId,
        idType: typeof deliverableId,
        _id: deliverable._id,
        id: deliverable.id,
        showSettings: deliverable.showSettings,
        updateData
      });

      // Validate the ID before making the API call
      if (!deliverableId || typeof deliverableId !== 'string') {
        throw new Error(`Invalid deliverable ID: ${deliverableId} (type: ${typeof deliverableId})`);
      }

      // Call the API to update the deliverable
      const response = await fetch('/api/deliverables', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: deliverableId,
          ...updateData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update deliverable');
      }

      const result = await response.json();
      
      if (onSave) {
        onSave(result.data.deliverable);
      }
      
      // Show success message or redirect
      alert('Deliverable settings saved successfully!');
    } catch (error) {
      console.error('Error updating deliverable:', error);
      setErrors({ general: error.message || 'Failed to update deliverable. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (!deliverable) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No deliverable selected</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Deliverable Settings</h1>
            <p className="text-gray-600">Configure settings for "{deliverable.name}"</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Brief Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              <FileText className="w-4 h-4 inline mr-2" />
              Project Brief
            </label>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateBrief}
                disabled={isGeneratingBrief}
                className="flex items-center space-x-2"
              >
                <Wand2 className={`w-4 h-4 ${isGeneratingBrief ? 'animate-spin' : ''}`} />
                <span>{isGeneratingBrief ? 'Generating...' : 'AI Generate'}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowImproveBriefModal(true)}
                disabled={!formData.brief.trim()}
                className="flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Improve Brief</span>
              </Button>
            </div>
          </div>
          
          <div
            className="w-full min-h-[200px] p-4 border border-gray-300 rounded-lg bg-gray-50 whitespace-pre-wrap"
            style={{ lineHeight: '1.6' }}
          >
            {formData.brief || (
              <span className="text-gray-500 italic">
                No brief content yet. Click "AI Generate" to create one or add your own content.
              </span>
            )}
          </div>
          
          {/* Brief Quality Display - Single Source of Truth */}
          <BriefQualityDisplay
            score={qualityScore}
            strengths={recognizedStrengths}
            improvements={suggestedImprovements}
          />
          
          {errors.brief && (
            <p className="text-xs text-red-600 mt-1">{errors.brief}</p>
          )}
        </div>

        {/* Generate Storyline Section */}
        {onGenerateStoryline && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-md font-semibold text-gray-800 mb-1 flex items-center">
                  <BookOpen className="w-4 h-4 mr-2 text-purple-600" />
                  AI Storyline Generation
                </h4>
                <p className="text-gray-600 text-xs">
                  Generate a structured storyline based on the brief above.
                </p>
              </div>
              <Button
                type="button"
                onClick={onGenerateStoryline}
                disabled={isGeneratingStoryline || !formData.brief.trim() || !canGenerateStoryline}
                size="sm"
                className={`flex items-center space-x-2 ${
                  isGeneratingStoryline || !formData.brief.trim() || !canGenerateStoryline
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                <Sparkles className={`w-3 h-3 ${isGeneratingStoryline ? 'animate-spin' : ''}`} />
                <span>{isGeneratingStoryline ? 'Generating...' : 'Generate Storyline'}</span>
              </Button>
            </div>
            {!formData.brief.trim() && (
              <p className="text-amber-600 text-xs mt-2">
                A brief is required to generate a storyline.
              </p>
            )}
            {formData.brief.trim() && !canGenerateStoryline && (
              <p className="text-amber-600 text-xs mt-2">
                {qualityScore === null
                  ? 'Test brief first to get a quality score before generating storyline.'
                  : `Brief quality score must be ${storylineScoreThreshold} or higher to generate storyline.`}
              </p>
            )}
          </div>
        )}

        {/* Notes Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Add any additional notes or comments..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
            rows={4}
          />
        </div>

        {/* Detailed Deliverable Information */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-600" />
            Deliverable Details
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Basic Info */}
            <div className="space-y-3">
              <h5 className="font-medium text-gray-700 text-sm uppercase tracking-wide">Basic Information</h5>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Name:</span>
                  <span className="font-medium text-gray-900 text-sm">{deliverable.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Type:</span>
                  <span className="font-medium text-gray-900 text-sm">{deliverable.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Format:</span>
                  <span className="font-medium text-gray-900 text-sm">{deliverable.format}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Status:</span>
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                    {deliverable.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Project Info */}
            <div className="space-y-3">
              <h5 className="font-medium text-gray-700 text-sm uppercase tracking-wide">Project Details</h5>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Size:</span>
                  <span className="font-medium text-gray-900 text-sm">{deliverable.size || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Priority:</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    deliverable.priority === 'high' ? 'bg-red-100 text-red-800' :
                    deliverable.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {deliverable.priority}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Due Date:</span>
                  <span className="font-medium text-gray-900 text-sm">
                    {deliverable.due_date ? new Date(deliverable.due_date).toLocaleDateString() : 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Est. Hours:</span>
                  <span className="font-medium text-gray-900 text-sm">
                    {deliverable.estimated_hours || 0}h
                  </span>
                </div>
              </div>
            </div>

            {/* Audience & Tags */}
            <div className="space-y-3">
              <h5 className="font-medium text-gray-700 text-sm uppercase tracking-wide">Audience & Tags</h5>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-600 text-sm block mb-1">Audience:</span>
                  <div className="flex flex-wrap gap-1">
                    {deliverable.audience && deliverable.audience.length > 0 ? 
                      deliverable.audience.map((member, index) => (
                        <span key={index} className="inline-flex px-2 py-1 text-xs font-medium rounded-md bg-green-100 text-green-800">
                          {member}
                        </span>
                      )) : 
                      <span className="text-gray-400 text-sm">Not specified</span>
                    }
                  </div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm block mb-1">Tags:</span>
                  <div className="flex flex-wrap gap-1">
                    {formData.tags && formData.tags.length > 0 ? 
                      formData.tags.map((tag, index) => (
                        <span key={index} className="inline-flex px-2 py-1 text-xs font-medium rounded-md bg-purple-100 text-purple-800">
                          #{tag}
                        </span>
                      )) : 
                      <span className="text-gray-400 text-sm">No tags</span>
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {errors.general && (
          <div className="text-red-600 text-sm">{errors.general}</div>
        )}


        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={loading}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>

      {/* Improve Brief Modal */}
      <ImproveBriefModal
        isOpen={showImproveBriefModal}
        onClose={() => setShowImproveBriefModal(false)}
        onSave={handleImproveBriefSave}
        currentBrief={formData.brief}
        deliverable={deliverable}
        projectData={projectInfo}
        onEvaluationSave={handleBriefEvaluationSave}
      />
    </div>
  );
}
