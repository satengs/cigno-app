'use client';

import { useState, useEffect } from 'react';
import Modal from './modals/Modal';
import Input from './forms/Input';
import Select from './forms/Select';
import Button from './buttons/Button';
import { Calendar, DollarSign, Plus, X } from 'lucide-react';

export default function CreateProjectModal({ 
  isOpen, 
  onClose, 
  onProjectCreated,
  clientId,
  editItem = null,
  onBack = null,
  isAIGenerated = false,
  prefilledData = null
}) {
  const [formData, setFormData] = useState({
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
    client: clientId || ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [deliverables, setDeliverables] = useState([
    { name: 'Strategy Presentation', type: 'Presentation' },
    { name: 'Technical Report', type: 'Report' },
    { name: 'Implementation Roadmap', type: 'Strategy' }
  ]);
  const [keyPersons, setKeyPersons] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingKeyPersons, setLoadingKeyPersons] = useState(false);

  // Dynamic data population based on edit mode or AI generation
  useEffect(() => {
    if (editItem) {
      // This is actual edit mode
      setFormData({
        name: editItem.name || '',
        description: editItem.description || '',
        status: editItem.status || 'Planning',
        start_date: editItem.start_date || '',
        end_date: editItem.end_date || '',
        client_owner: editItem.client_owner || '',
        internal_owner: editItem.internal_owner || '',
        budget_amount: editItem.budget_amount || 0,
        budget_currency: editItem.budget_currency || 'USD',
        budget_type: editItem.budget_type || 'Fixed',
        client: editItem.client || clientId || ''
      });
      if (editItem.deliverables) {
        setDeliverables(editItem.deliverables);
      }
    } else if (prefilledData) {
      // This is AI-generated prefilled data for new project
      setFormData({
        name: prefilledData.name || '',
        description: prefilledData.description || '',
        status: prefilledData.status || 'Planning',
        start_date: prefilledData.start_date || '',
        end_date: prefilledData.end_date || '',
        client_owner: prefilledData.client_owner || '',
        internal_owner: prefilledData.internal_owner || '',
        budget_amount: prefilledData.budget_amount || 0,
        budget_currency: prefilledData.budget_currency || 'USD',
        budget_type: prefilledData.budget_type || 'Fixed',
        client: prefilledData.client || clientId || ''
      });
      if (prefilledData.deliverables) {
        setDeliverables(prefilledData.deliverables);
      }
    }
  }, [editItem, prefilledData, clientId]);

  // Fetch key persons when client is selected
  useEffect(() => {
    const fetchKeyPersons = async () => {
      if (formData.client && formData.client.trim()) {
        setLoadingKeyPersons(true);
        try {
          const response = await fetch(`/api/key-persons?clientId=${formData.client}`);
          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              setKeyPersons(result.data.keyPersons || []);
            }
          }
        } catch (error) {
          console.error('Error fetching key persons:', error);
        } finally {
          setLoadingKeyPersons(false);
        }
      } else {
        setKeyPersons([]);
      }
    };

    fetchKeyPersons();
  }, [formData.client]);

  // Fetch users for internal owner selection
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setUsers(result.users || []);
          }
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Project name is required';
    }
    
    if (!formData.description?.trim()) {
      newErrors.description = 'Project description is required';
    }
    
    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }
    
    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    }
    
    if (formData.start_date && formData.end_date && formData.start_date >= formData.end_date) {
      newErrors.end_date = 'End date must be after start date';
    }
    
    // Make client/internal owner optional for AI-generated projects
    if (!prefilledData && !isAIGenerated) {
      if (!formData.client_owner?.trim()) {
        newErrors.client_owner = 'Client owner is required';
      }
      
      if (!formData.internal_owner?.trim()) {
        newErrors.internal_owner = 'Internal owner is required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddDeliverable = () => {
    setDeliverables(prev => [...prev, { name: '', type: 'Presentation' }]);
  };

  const handleRemoveDeliverable = (index) => {
    setDeliverables(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeliverableChange = (index, field, value) => {
    setDeliverables(prev => prev.map((deliverable, i) => 
      i === index ? { ...deliverable, [field]: value } : deliverable
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setErrors({});

    try {
      const projectData = {
        ...formData,
        deliverables: deliverables.filter(d => d.name.trim())
      };

      // Remove empty client_owner and internal_owner to let API use defaults
      if (!projectData.client_owner || projectData.client_owner.trim() === '') {
        delete projectData.client_owner;
      }
      if (!projectData.internal_owner || projectData.internal_owner.trim() === '') {
        delete projectData.internal_owner;
      }
      if (!projectData.client || projectData.client.trim() === '') {
        delete projectData.client;
      }

      const response = await fetch('/api/projects', {
        method: editItem ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editItem ? { id: editItem._id, ...projectData } : projectData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save project');
      }

      const result = await response.json();
      
      if (onProjectCreated) {
        onProjectCreated(result.project || result.data?.project);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving project:', error);
      setErrors({ general: error.message || 'Failed to save project. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: 'Planning', label: 'Planning' },
    { value: 'Active', label: 'Active' },
    { value: 'On Hold', label: 'On Hold' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' }
  ];

  const currencyOptions = [
    { value: 'USD', label: 'USD' },
    { value: 'EUR', label: 'EUR' },
    { value: 'GBP', label: 'GBP' },
    { value: 'JPY', label: 'JPY' }
  ];

  const budgetTypeOptions = [
    { value: 'Fixed', label: 'Fixed' },
    { value: 'Time & Materials', label: 'Time & Materials' },
    { value: 'Retainer', label: 'Retainer' }
  ];

  const deliverableTypeOptions = [
    { value: 'Presentation', label: 'Presentation' },
    { value: 'Report', label: 'Report' },
    { value: 'Strategy', label: 'Strategy' },
    { value: 'Analysis', label: 'Analysis' },
    { value: 'Design', label: 'Design' },
    { value: 'Other', label: 'Other' }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editItem ? "Edit Project" : "Create New Project"}
      subtitle={editItem ? "Update project information" : (isAIGenerated || prefilledData) ? "Review and customize your AI-generated project" : "Describe your project to get started"}
      size="lg"
      footer={
        <div className="flex justify-between">
          {/* Left side - Back button (only show if onBack is provided) */}
          <div>
            {onBack && (
              <Button
                type="button"
                variant="ghost"
                onClick={onBack}
                disabled={loading}
                className="flex items-center space-x-2"
              >
                <span>← Back</span>
              </Button>
            )}
          </div>
          
          {/* Right side - Cancel and Submit */}
          <div className="flex space-x-3">
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
              form="project-form"
              disabled={loading || !formData.name?.trim() || !formData.description?.trim()}
            >
              {loading ? (editItem ? 'Updating...' : 'Creating...') : (editItem ? 'Update Project' : 'Create Project')}
            </Button>
          </div>
        </div>
      }
    >
      <form id="project-form" onSubmit={handleSubmit} className="space-y-6">
        {/* AI Generated Indicator */}
        {(isAIGenerated || prefilledData) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-blue-900">AI Generated Project</span>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              This project structure was generated based on your description. Review and customize as needed.
            </p>
          </div>
        )}

        {/* Project Name */}
        <div>
          <Input
            label="Project Name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter project name..."
            required
            error={errors.name}
          />
        </div>

        {/* Project Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Project Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe your project goals, deliverables, and key requirements..."
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
            required
          />
          {errors.description && (
            <p className="text-xs text-red-600 mt-1">{errors.description}</p>
          )}
          <div className="flex items-center justify-end mt-2">
            <span className="text-xs text-gray-400">📄 From: Client Brief Document</span>
          </div>
        </div>

        {/* Status and Dates Row */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              options={statusOptions}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => handleInputChange('start_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            {errors.start_date && (
              <p className="text-xs text-red-600 mt-1">{errors.start_date}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) => handleInputChange('end_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            {errors.end_date && (
              <p className="text-xs text-red-600 mt-1">{errors.end_date}</p>
            )}
          </div>
        </div>

        {/* Client Owner and Internal Owner */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Select
              label="Client Owner"
              value={formData.client_owner}
              onChange={(value) => handleInputChange('client_owner', value)}
              placeholder={loadingKeyPersons ? "Loading..." : "Select client contact..."}
              disabled={loadingKeyPersons || keyPersons.length === 0}
              required
              error={errors.client_owner}
              options={[
                { value: '', label: 'Select client contact...' },
                ...keyPersons.map(person => ({
                  value: person._id,
                  label: `${person.full_name} (${person.role})`
                }))
              ]}
            />
            {keyPersons.length === 0 && !loadingKeyPersons && formData.client && (
              <p className="mt-1 text-sm text-gray-500">
                No key persons found for this client. Add them in the client creation form.
              </p>
            )}
          </div>
          
          <div>
            <Select
              label="Internal Owner"
              value={formData.internal_owner}
              onChange={(value) => handleInputChange('internal_owner', value)}
              placeholder="Select team member..."
              required
              error={errors.internal_owner}
              options={[
                { value: '', label: 'Select team member...' },
                ...users.map(user => ({
                  value: user._id || user.id,
                  label: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email_address || user.username || 'Unknown User'
                }))
              ]}
            />
          </div>
        </div>

        {/* Budget Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Budget</label>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Amount</label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.budget_amount}
                  onChange={(e) => handleInputChange('budget_amount', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-3 py-2 pl-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
                <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
            
            <div>
              <label className="block text-xs text-gray-500 mb-1">Currency</label>
              <Select
                value={formData.budget_currency}
                onChange={(e) => handleInputChange('budget_currency', e.target.value)}
                options={currencyOptions}
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-500 mb-1">Type</label>
              <Select
                value={formData.budget_type}
                onChange={(e) => handleInputChange('budget_type', e.target.value)}
                options={budgetTypeOptions}
              />
            </div>
          </div>
        </div>

        {/* Deliverables Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">Deliverables</label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddDeliverable}
              className="flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </Button>
          </div>
          
          <div className="space-y-3">
            {deliverables.map((deliverable, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                <input
                  type="text"
                  value={deliverable.name}
                  onChange={(e) => handleDeliverableChange(index, 'name', e.target.value)}
                  placeholder="Deliverable name"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                <Select
                  value={deliverable.type}
                  onChange={(e) => handleDeliverableChange(index, 'type', e.target.value)}
                  options={deliverableTypeOptions}
                  className="w-32"
                />
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveDeliverable(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
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