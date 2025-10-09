'use client';

import { useState, useEffect } from 'react';
import Modal from './modals/Modal';
import Input from './forms/Input';
import Select from './forms/Select';
import Button from './buttons/Button';
import { X, Calendar, Plus } from 'lucide-react';

export default function CreateDeliverableModal({ 
  isOpen, 
  onClose, 
  onDeliverableCreated,
  projectId,
  editItem = null
}) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Presentation',
    format: 'PPTX',
    audience: ['Board of Directors', 'Technical Teams', 'Sarah Mitchell (CEO)'],
    due_date: '',
    size: '25 slides',
    description: '',
    priority: 'medium',
    status: 'draft',
    estimated_hours: 0,
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [newAudience, setNewAudience] = useState('');
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [sources, setSources] = useState({});

  // Dynamic data population based on edit mode
  useEffect(() => {
    if (editItem) {
      // Edit mode - populate with existing data
      setFormData({
        name: editItem.name || '',
        type: editItem.type || 'Presentation',
        format: editItem.format || 'PPTX',
        audience: editItem.audience || ['Board of Directors', 'Technical Teams', 'Sarah Mitchell (CEO)'],
        due_date: editItem.due_date ? new Date(editItem.due_date).toISOString().split('T')[0] : '',
        size: editItem.size || '25 slides',
        description: editItem.description || '',
        priority: editItem.priority || 'medium',
        status: editItem.status || 'draft',
        estimated_hours: editItem.estimated_hours || 0,
        notes: editItem.notes || ''
      });
    }
  }, [editItem]);

  // Pre-populated data sources (fallback)
  const defaultDataSources = {
    name: 'From: Client Proposal Document',
    type: 'From: Project Brief',
    format: 'From: Client Requirements',
    audience: 'From: Stakeholder Analysis',
    dueDate: 'From: Project Timeline',
    size: 'From: Scope Document'
  };

  const dataSources = { ...defaultDataSources, ...sources };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.type) {
      newErrors.type = 'Type is required';
    }
    
    if (!formData.due_date) {
      newErrors.due_date = 'Due date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateBrief = async () => {
    setIsGeneratingBrief(true);
    try {
      // Simulate AI brief generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const generatedBrief = `Global Banking Corp requires a comprehensive strategy for implementing Central Bank Digital Currency (CBDC) capabilities. The presentation should address technical infrastructure requirements, regulatory compliance considerations, and strategic positioning for competitive advantage in the evolving digital currency landscape.`;
      
      setFormData(prev => ({ 
        ...prev, 
        brief: generatedBrief,
        briefQuality: 8.5
      }));
    } catch (error) {
      console.error('Error generating brief:', error);
    } finally {
      setIsGeneratingBrief(false);
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (loading) {
      console.log('Already submitting, ignoring duplicate submission');
      return;
    }
    
    setLoading(true);
    setErrors({});

    try {
      const deliverableData = {
        name: formData.name,
        type: formData.type,
        description: formData.description,
        project: projectId,
        due_date: formData.due_date,
        priority: formData.priority,
        status: formData.status,
        estimated_hours: formData.estimated_hours,
        notes: formData.notes
      };

      const response = await fetch('/api/deliverables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deliverableData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create deliverable');
      }

      const result = await response.json();
      
      if (onDeliverableCreated) {
        onDeliverableCreated(result.data.deliverable);
      }
      
      onClose();
    } catch (error) {
      console.error('Error creating deliverable:', error);
      setErrors({ general: error.message || 'Failed to create deliverable. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const formatOptions = [
    { value: 'PPTX', label: 'PPTX' },
    { value: 'DOCX', label: 'DOCX' },
    { value: 'XLSX', label: 'XLSX' }
  ];

  const typeOptions = [
    { value: 'Recommendation', label: 'Recommendation' },
    { value: 'Workshop Document', label: 'Workshop Document' }
  ];

  const sizeOptions = [
    { value: '5 slides', label: '5 slides' },
    { value: '10 slides', label: '10 slides' },
    { value: '15 slides', label: '15 slides' },
    { value: '20 slides', label: '20 slides' },
    { value: '25 slides', label: '25 slides' },
    { value: '30 slides', label: '30 slides' }
  ];

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'in_review', label: 'In Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'completed', label: 'Completed' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'rejected', label: 'Rejected' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' }
  ];

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'it', label: 'Italian' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'ru', label: 'Russian' },
    { value: 'zh', label: 'Chinese' },
    { value: 'ja', label: 'Japanese' },
    { value: 'ko', label: 'Korean' }
  ];

  const watermarkPositionOptions = [
    { value: 'top_left', label: 'Top Left' },
    { value: 'top_right', label: 'Top Right' },
    { value: 'bottom_left', label: 'Bottom Left' },
    { value: 'bottom_right', label: 'Bottom Right' },
    { value: 'center', label: 'Center' }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editItem ? "Edit Deliverable" : "Create New Deliverable"}
      subtitle={editItem ? "Update deliverable information" : "These fields are pre-populated from project documents"}
      size="lg"
      footer={
        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="deliverable-form"
            disabled={loading || !formData.name.trim()}
          >
            {loading ? (editItem ? 'Updating...' : 'Creating...') : (editItem ? 'Update Deliverable' : 'Create Deliverable')}
          </Button>
        </div>
      }
    >
      <form id="deliverable-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Name Field */}
        <div>
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter deliverable name..."
            required
            error={errors.name}
          />
          <div className="flex items-center justify-end mt-1">
            <span className="text-xs text-gray-400">📄 From: Client Proposal Document</span>
          </div>
        </div>

        {/* Type and Format Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Select
              label="Type"
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              options={typeOptions}
              required
              error={errors.type}
            />
            <div className="flex items-center justify-end mt-1">
              <span className="text-xs text-gray-400">📄 From: Project Brief</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
            <div className="flex space-x-2">
              {formatOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleInputChange('format', option.value)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '2px solid',
                    fontSize: '14px',
                    fontWeight: formData.format === option.value ? 'bold' : 'normal',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: formData.format === option.value ? '#059669' : '#ffffff',
                    borderColor: formData.format === option.value ? '#059669' : '#374151',
                    color: formData.format === option.value ? '#ffffff' : '#111827',
                    boxSizing: 'border-box',
                    outline: 'none',
                    textDecoration: 'none',
                    fontFamily: 'inherit',
                    lineHeight: '1.5',
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    userSelect: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    appearance: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (formData.format !== option.value) {
                      e.target.style.borderColor = '#059669';
                      e.target.style.backgroundColor = '#f0fdf4';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (formData.format !== option.value) {
                      e.target.style.borderColor = '#374151';
                      e.target.style.backgroundColor = '#ffffff';
                    }
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-end mt-1">
              <span className="text-xs text-gray-400">📄 From: Client Requirements</span>
            </div>
          </div>
        </div>

        {/* Audience Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Audience</label>
          <div className="space-y-3">
            {/* Audience Tags */}
            <div className="flex flex-wrap gap-2">
              {formData.audience.map((audienceItem, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full"
                >
                  <span className="text-sm text-blue-700">{audienceItem}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAudience(audienceItem)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            
            {/* Add New Audience */}
            <div className="flex items-center space-x-2">
              <Plus className="w-4 h-4 text-blue-500" />
              <input
                type="text"
                value={newAudience}
                onChange={(e) => setNewAudience(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddAudience();
                  }
                }}
                placeholder="Add audience member"
                className="flex-1 px-3 py-1 text-sm border-none focus:outline-none focus:ring-0"
              />
            </div>
            <div className="flex items-center justify-end">
              <span className="text-xs text-gray-400">📄 From: Stakeholder Analysis</span>
            </div>
          </div>
        </div>

        {/* Due Date and Size Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
            <div className="relative">
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => handleInputChange('due_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                required
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            {errors.due_date && (
              <p className="text-xs text-red-600 mt-1">{errors.due_date}</p>
            )}
            <div className="flex items-center justify-end mt-1">
              <span className="text-xs text-gray-400">📄 From: Project Timeline</span>
            </div>
          </div>
          
          <div>
            <Select
              label="Size"
              value={formData.size}
              onChange={(e) => handleInputChange('size', e.target.value)}
              options={sizeOptions}
            />
            <div className="flex items-center justify-end mt-1">
              <span className="text-xs text-gray-400">📄 From: Scope Document</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {errors.general && (
          <div className="text-red-600 text-sm">{errors.general}</div>
        )}
      </form>
    </Modal>
  );
}
