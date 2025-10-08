'use client';

import { useState, useEffect } from 'react';
import Modal from './modals/Modal';
import Input from './forms/Input';
import Textarea from './forms/Textarea';
import Select from './forms/Select';
import Button from './buttons/Button';
import CreateDeliverableModal from './CreateDeliverableModal';
import CreateNewProjectModal from './CreateNewProjectModal';
import CreateProjectModal from './CreateProjectModal';
import ProjectDescriptionModal from './ProjectDescriptionModal';
import NewClientModal from './NewClientModal';

export default function UnifiedAddModal({ 
  isOpen, 
  onClose, 
  itemType, 
  onAdd, 
  editItem = null, // For editing existing items
  parentId = null, // For adding items to specific parent
  availableClients = [], // List of available clients for project assignment
  availableUsers = [], // List of available users for assignment
  availableProjects = [] // List of available projects for deliverable assignment
}) {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showProjectOptions, setShowProjectOptions] = useState(false);
  const [selectedProjectOption, setSelectedProjectOption] = useState(null);
  const [projectCreationStep, setProjectCreationStep] = useState('options'); // 'options', 'description', 'form'

  // AI helper functions for project generation
  const generateProjectFromDescription = async (description) => {
    try {
      console.log('Calling AI analysis API for description:', description);
      
      const response = await fetch('/api/projects/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          description,
          projectData: formData // Include any existing form data as context
        })
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('AI analysis result:', result);

      if (result.success && result.analyzedProject) {
        return {
          ...result.analyzedProject,
          isAIGenerated: true
        };
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Error analyzing project:', error);
      
      // Fallback to basic structure if AI analysis fails
      return {
        name: '',
        description: description,
        status: 'Planning',
        start_date: '',
        end_date: '',
        budget_amount: 0,
        budget_currency: 'USD',
        budget_type: 'Fixed',
        isAIGenerated: true
      };
    }
  };

  // Log when modal opens/closes and reset project creation step
  useEffect(() => {
    if (isOpen) {
      console.log('🚪 Modal opened:', {
        itemType,
        editItem: !!editItem,
        parentId,
        hasOnAdd: !!onAdd
      });
      // Reset project creation step when modal opens
      if (itemType === 'project') {
        setProjectCreationStep('options');
      }
    } else {
      console.log('🚪 Modal closed');
    }
  }, [isOpen, itemType, editItem, parentId, onAdd]);

  // Always show detailed form for projects (no options modal)
  useEffect(() => {
    setShowProjectOptions(false);
  }, [itemType, isOpen, editItem]);

  // Initialize form data based on item type and edit mode
  useEffect(() => {
    console.log('🔄 Initializing form data for:', itemType, 'editItem:', editItem);
    if (editItem) {
      setFormData({
        title: editItem.title || '',
        description: editItem.description || '',
        status: editItem.status || 'active',
        category: editItem.metadata?.category || '',
        industry: editItem.metadata?.industry || '',
        contactPerson: editItem.metadata?.contactPerson || '',
        email: editItem.metadata?.email || '',
        phone: editItem.metadata?.phone || '',
        startDate: editItem.metadata?.startDate || '',
        endDate: editItem.metadata?.endDate || '',
        budget: editItem.metadata?.budget || '',
        dueDate: editItem.metadata?.dueDate || '',
        priority: editItem.metadata?.priority || 'medium',
        assignedTo: editItem.metadata?.assignedTo || '',
        assignedClient: editItem.assignedClient || '', // Include client assignment
        order: editItem.order || 0,
        isCollapsible: editItem.isCollapsible !== false, // Default to true if not set
        brief: editItem.brief || '',
        teamMembers: editItem.teamMembers || [],
        insights: editItem.insights || [],
        materials: editItem.materials || [],
        storyline: editItem.storyline || null,
        // Project-specific fields
        project_type: editItem.metadata?.project_type || 'consulting',
        start_date: editItem.metadata?.start_date || '',
        end_date: editItem.metadata?.end_date || '',
        budget_amount: editItem.metadata?.budget_amount || 0,
        budget_currency: editItem.metadata?.budget_currency || 'USD',
        budget_type: editItem.metadata?.budget_type || 'fixed',
        client_owner: editItem.metadata?.client_owner || '',
        internal_owner: editItem.metadata?.internal_owner || '',
        team_members: editItem.metadata?.team_members || [],
        deliverables: editItem.metadata?.deliverables || [],
        project: editItem.metadata?.project_id || editItem.metadata?.project || editItem.parentProjectId || '',
        projectMenuId: editItem.parentId || editItem.metadata?.projectMenuId || ''
      });
    } else {
      // Default form data for new items
      const defaults = {
        title: '',
        description: '',
        status: 'active',
        order: 0,
        isCollapsible: true // Default to collapsible for most items
      };

      // Set collapsible based on item type hierarchy
      switch (itemType) {
        case 'client':
          defaults.isCollapsible = true; // Clients can have projects
          break;
        case 'project':
          defaults.isCollapsible = true; // Projects can have deliverables
          break;
        case 'deliverable':
          defaults.isCollapsible = false; // Deliverables cannot have children
          break;
        default:
          defaults.isCollapsible = true;
      }

      // Add type-specific defaults
      switch (itemType) {
        case 'client':
          Object.assign(defaults, {
            industry: '',
            location: '',
            website: '',
            company_size: 'medium',
            status: 'active',
            priority: 'medium'
          });
          break;
        case 'project':
          Object.assign(defaults, {
            project_type: 'consulting',
            start_date: '',
            end_date: '',
            budget_amount: 0,
            budget_currency: 'USD',
            budget_type: 'fixed',
            status: 'planning',
            priority: 'medium',
            client_owner: parentId || '', // Use parentId if provided, otherwise empty
            internal_owner: '',
            team_members: [],
            deliverables: []
          });
          console.log('🔧 Project defaults set:', defaults);
          break;
        case 'deliverable': {
          const linkedProject = availableProjects.find(project => project.menuId === parentId);
          Object.assign(defaults, {
            format: 'PDF',
            type: 'Report',
            status: 'draft',
            due_date: '',
            priority: 'medium',
            complexity: 'moderate',
            estimated_hours: 0,
            project: linkedProject?.id || '',
            projectMenuId: linkedProject?.menuId || parentId || '',
            brief: '',
            version: '1.0',
            language: 'en'
          });
          break;
        }
      }

      setFormData(defaults);
    }
  }, [itemType, editItem, parentId, availableProjects]);

  // Get modal title and button text
  const getModalConfig = () => {
    const isEdit = !!editItem;
    const action = isEdit ? 'Edit' : 'Add';
    
    switch (itemType) {
      case 'client':
        return {
          title: `${action} Client`,
          buttonText: isEdit ? 'Update Client' : 'Add Client'
        };
      case 'project':
        return {
          title: `${action} Project`,
          buttonText: isEdit ? 'Update Project' : 'Add Project'
        };
      case 'deliverable':
        return {
          title: `${action} Deliverable`,
          buttonText: isEdit ? 'Update Deliverable' : 'Add Deliverable'
        };
      default:
        return {
          title: `${action} Item`,
          buttonText: isEdit ? 'Update Item' : 'Add Item'
        };
    }
  };

  // Validate form data
  const validateForm = () => {
    console.log('🔍 Starting form validation for:', itemType, formData);
    const newErrors = {};
    
    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required';
      console.log('❌ Validation failed: Title is required');
    }

    // Type-specific validation
    switch (itemType) {
      case 'client':
        console.log('🔍 Validating client-specific fields...');
        if (!formData.industry?.trim()) {
          newErrors.industry = 'Industry is required';
          console.log('❌ Validation failed: Industry is required');
        }
        if (!formData.location?.trim()) {
          newErrors.location = 'Location is required';
          console.log('❌ Validation failed: Location is required');
        }
        break;
      case 'project':
        console.log('🔍 Validating project-specific fields...');
        if (!formData.client_owner?.trim()) {
          newErrors.client_owner = 'Client owner is required';
          console.log('❌ Validation failed: Client owner is required');
        }
        // Internal owner is optional - no validation needed
        if (!formData.start_date?.trim()) {
          newErrors.start_date = 'Start date is required';
          console.log('❌ Validation failed: Start date is required');
        }
        if (!formData.end_date?.trim()) {
          newErrors.end_date = 'End date is required';
          console.log('❌ Validation failed: End date is required');
        }
        break;
      case 'deliverable':
        console.log('🔍 Validating deliverable-specific fields...');
        if (!formData.project?.trim()) {
          newErrors.project = 'Project is required';
          console.log('❌ Validation failed: Project is required');
        }
        if (!formData.due_date?.trim()) {
          newErrors.due_date = 'Due date is required';
          console.log('❌ Validation failed: Due date is required');
        }
        if (!formData.brief?.trim()) {
          newErrors.brief = 'Brief is required for deliverables';
          console.log('❌ Validation failed: Brief is required');
        }
        break;
    }

    const isValid = Object.keys(newErrors).length === 0;
    console.log('🔍 Validation result:', isValid ? '✅ PASSED' : '❌ FAILED', newErrors);
    setErrors(newErrors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🚀 Form submission started for:', itemType);
    console.log('📝 Form data:', formData);
    console.log('🔍 Status value in form data:', formData.status);
    console.log('🔍 Form data keys:', Object.keys(formData));
    console.log('🔍 Form data values:', formData);
    
    if (!validateForm()) {
      console.log('❌ Form validation failed, submission aborted');
      console.log('🔍 Current errors:', errors);
      return;
    }

    console.log('✅ Form validation passed, proceeding with submission');
    console.log('🔍 About to set loading to true and call onAdd');
    setLoading(true);
    
    try {
      const itemData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: itemType, // Add the item type
        status: formData.status || 'active', // Ensure status is always set
        order: parseInt(formData.order) || 0,
        isCollapsible: formData.isCollapsible,
        parentId: parentId,
        metadata: {}
      };

      console.log('🔧 Building item data:', itemData);

      // Add type-specific metadata
      switch (itemType) {
        case 'client':
          console.log('🏢 Building client data...');
          Object.assign(itemData.metadata, {
            industry: formData.industry,
            location: formData.location,
            website: formData.website,
            company_size: formData.company_size,
            status: formData.status,
            priority: formData.priority
          });
          console.log('✅ Client metadata added:', itemData.metadata);
          break;
        case 'project':
          console.log('📁 Building project data...');
          // Ensure status is valid for database enum
          const validStatuses = ['active', 'not-started', 'completed', 'in-progress'];
          const projectStatus = validStatuses.includes(formData.status) ? formData.status : 'not-started';
          console.log('🔧 Project status validation:', formData.status, '->', projectStatus);
          
          Object.assign(itemData.metadata, {
            project_type: formData.project_type,
            start_date: formData.start_date,
            end_date: formData.end_date,
            budget: {
              amount: formData.budget_amount || 0,
              currency: formData.budget_currency || 'USD',
              type: formData.budget_type || 'fixed'
            },
            status: projectStatus,
            priority: formData.priority,
            client_owner: formData.client_owner,
            internal_owner: formData.internal_owner,
            team_members: formData.team_members,
            deliverables: formData.deliverables
          });
          
          // Also update the main status field
          itemData.status = projectStatus;
          console.log('✅ Project metadata added:', itemData.metadata);
          break;
        case 'deliverable':
          console.log('📋 Building deliverable data...');
          Object.assign(itemData.metadata, {
            format: formData.format,
            type: formData.type,
            status: formData.status,
            due_date: formData.due_date,
            priority: formData.priority,
            complexity: formData.complexity,
            estimated_hours: formData.estimated_hours,
            version: formData.version,
            language: formData.language,
            project: formData.project,
            project_id: formData.project,
            projectMenuId: formData.projectMenuId
          });
          
          // Add deliverable-specific properties directly to itemData
          itemData.brief = formData.brief.trim();
          itemData.project = formData.project;
          
          // Set parentId to the selected project for deliverables
          if (formData.projectMenuId) {
            itemData.parentId = formData.projectMenuId;
            itemData.parentProjectId = formData.project;
            console.log('🔗 Setting parentId to project menu item:', formData.projectMenuId);
          } else if (formData.project) {
            itemData.parentProjectId = formData.project;
            console.log('🔗 No project menu ID available, storing project reference only.');
          }
          
          console.log('✅ Deliverable metadata added:', itemData.metadata);
          console.log('✅ Deliverable properties added:', {
            brief: itemData.brief,
            parentId: itemData.parentId
          });
          break;
      }

      console.log('🎯 Final item data prepared:', itemData);
      console.log('📤 Calling onAdd with data...');
      console.log('📋 Item data details:', {
        title: itemData.title,
        type: itemData.type,
        parentId: itemData.parentId,
        hasMetadata: !!itemData.metadata,
        metadataKeys: Object.keys(itemData.metadata || {}),
        brief: itemData.brief
      });
      
      console.log('🔍 About to call onAdd with:', itemData);
      console.log('🔍 EditItem ID:', editItem?.id);
      
      await onAdd(itemData, editItem?.id);
      console.log('✅ Item added successfully!');
      onClose();
    } catch (error) {
      console.error('💥 Error saving item:', error);
      console.error('🔍 Error details:', {
        message: error.message,
        stack: error.stack,
        itemType,
        itemData: JSON.stringify(itemData, null, 2),
        formData: JSON.stringify(formData, null, 2)
      });
      
      // Show error to user
      setErrors(prev => ({
        ...prev,
        submit: error.message || 'Failed to save item. Please try again.'
      }));
    } finally {
      setLoading(false);
      console.log('🏁 Form submission completed');
    }
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    console.log(`📝 Input changed: ${field} = "${value}"`);
    setFormData(prev => {
      if (field === 'project') {
        const selectedProject = availableProjects.find(project => project.id === value);
        const projectMenuId = selectedProject?.menuId || '';
        const newData = { ...prev, project: value, projectMenuId };
        console.log('🔗 Project selection updated:', {
          projectId: value,
          projectMenuId,
          selectedProject
        });
        return newData;
      }

      const newData = { ...prev, [field]: value };
      console.log(`📊 Updated form data:`, newData);
      return newData;
    });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleProjectOptionSelect = (option) => {
    setSelectedProjectOption(option);
    setShowProjectOptions(false);
    // Here you would typically navigate to the next step based on the selected option
    console.log('Selected project creation option:', option);
    // For now, we'll just close the modal and show a message
    onClose();
  };

  const { title, buttonText } = getModalConfig();

  // If it's a deliverable, use the specialized modal
  if (itemType === 'deliverable') {
    return (
      <CreateDeliverableModal
        isOpen={isOpen}
        onClose={onClose}
        onDeliverableCreated={onAdd}
        projectId={parentId}
        editItem={editItem}
      />
    );
  }

  // If it's a project, use the multi-step flow
  if (itemType === 'project') {
    // For edit mode, skip options and go directly to form
    if (editItem && projectCreationStep === 'options') {
      // Set to form step for editing
      setProjectCreationStep('form');
    }
    
    // Step 1: Show project creation options (only for new projects)
    if (projectCreationStep === 'options' && !editItem) {
      return (
        <CreateNewProjectModal
          isOpen={isOpen}
          onClose={() => {
            setProjectCreationStep('options');
            onClose();
          }}
          loading={loading}
          onOptionSelect={async (option, description) => {
            console.log('Project option selected:', option, description);
            setSelectedProjectOption(option);
            
            if (option === 'type-description' && description) {
              // Generate AI project data and show the detailed form
              setLoading(true);
              
              try {
                const aiGeneratedData = await generateProjectFromDescription(description);
                setProjectCreationStep('form');
                setFormData(aiGeneratedData);
              } catch (error) {
                console.error('Failed to generate project data:', error);
                // Fall back to basic form with description
                setProjectCreationStep('form');
                setFormData({
                  name: '',
                  description: description,
                  status: 'Planning',
                  start_date: '',
                  end_date: '',
                  budget_amount: 0,
                  budget_currency: 'USD',
                  budget_type: 'Fixed',
                  isAIGenerated: true
                });
              } finally {
                setLoading(false);
              }
            } else if (option === 'upload-document' && description) {
              // Handle upload document with extracted data
              setProjectCreationStep('form');
              const transformedData = {
                name: description.name || 'Document-Based Project',
                description: description.description || 'Project created from uploaded documents',
                status: 'Planning',
                start_date: description.start_date || '',
                end_date: description.end_date || '',
                budget_amount: description.budget_amount || 0,
                budget_currency: description.budget_currency || 'USD',
                budget_type: description.budget_type || 'Fixed',
                client_name: description.client_name || '',
                client_industry: description.client_industry || '',
                objectives: description.objectives || [],
                deliverables: description.deliverables || [],
                requirements: description.requirements || [],
                scope: description.scope || '',
                extractionMethod: description.extractionMethod,
                sourceFiles: description.sourceFiles,
                isDocumentBased: true,
                isAIGenerated: true
              };
              setFormData(transformedData);
            } else {
              // For other options (browse), close for now
              onClose();
            }
          }}
        />
      );
    }
    
    // Step 2: Show pre-filled project form with AI data OR edit existing project
    if (projectCreationStep === 'form') {
      // Transform menu item data to project form format if editing
      let projectData = formData;
      if (editItem) {
        projectData = {
          name: editItem.title || '',
          description: editItem.description || '',
          status: editItem.status === 'not-started' ? 'Planning' : 
                  editItem.status === 'in-progress' ? 'Active' :
                  editItem.status === 'completed' ? 'Completed' :
                  editItem.status === 'cancelled' ? 'Cancelled' :
                  editItem.status === 'on-hold' ? 'On Hold' : 'Planning',
          start_date: editItem.metadata?.start_date || '',
          end_date: editItem.metadata?.end_date || '',
          client_owner: editItem.metadata?.client_owner || '',
          internal_owner: editItem.metadata?.internal_owner || '',
          budget_amount: editItem.metadata?.budget_amount || 0,
          budget_currency: editItem.metadata?.budget_currency || 'USD',
          budget_type: editItem.metadata?.budget_type || 'Fixed',
          client: editItem.metadata?.client_id || parentId || '',
          _id: editItem.metadata?.project_id || editItem.id // Include the actual project ID for updates
        };
      }

      return (
        <CreateProjectModal
          isOpen={isOpen}
          onClose={() => {
            setProjectCreationStep('options');
            onClose();
          }}
          onProjectCreated={onAdd}
          clientId={parentId}
          editItem={editItem ? projectData : null} // Pass transformed data for edit mode
          prefilledData={editItem ? projectData : formData} // Use transformed data if editing, otherwise AI generated data
          onBack={editItem ? null : () => setProjectCreationStep('options')} // No back button in edit mode
          isAIGenerated={!editItem} // Only AI generated if not editing
          availableUsers={availableUsers}
          submitDirect={false}
        />
      );
    }
  }

  // If it's a client, use the specialized client modal
  if (itemType === 'client') {
    return (
      <NewClientModal
        isOpen={isOpen}
        onClose={onClose}
        onAdd={onAdd}
        editItem={editItem}
      />
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
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
            form="unified-form"
            disabled={loading || !formData.title?.trim()}
            style={{
              opacity: (loading || !formData.title?.trim()) ? 0.5 : 1,
              cursor: (loading || !formData.title?.trim()) ? 'not-allowed' : 'pointer'
            }}
            onMouseEnter={() => {
              console.log('🖱️ Button hover - Status:', {
                loading,
                hasTitle: !!formData.title?.trim(),
                title: formData.title,
                disabled: loading || !formData.title?.trim()
              });
            }}
          >
            {loading ? 'Saving...' : buttonText}
          </Button>
        </div>
      }
    >
      <form 
        id="unified-form"
        onSubmit={(e) => {
          console.log('📋 Form onSubmit event triggered!');
          handleSubmit(e);
        }} 
        className="space-y-3"
      >
        {/* Common Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Title"
            placeholder="Enter title"
            value={formData.title || ''}
            onChange={(e) => handleInputChange('title', e.target.value)}
            error={errors.title}
            required
          />
          
          <Input
            label="Order"
            type="number"
            placeholder="0"
            value={formData.order || 0}
            onChange={(e) => handleInputChange('order', e.target.value)}
            min="0"
          />
        </div>

        <Textarea
          label="Description"
          placeholder="Enter description"
          value={formData.description || ''}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={2}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select
            label="Status"
            value={formData.status || (itemType === 'project' ? 'not-started' : itemType === 'deliverable' ? 'draft' : 'active')}
            onChange={(e) => handleInputChange('status', e.target.value)}
            options={
              itemType === 'project' ? [
                { value: 'not-started', label: 'Not Started' },
                { value: 'active', label: 'Active' },
                { value: 'in-progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
                { value: 'on-hold', label: 'On Hold' }
              ] : itemType === 'client' ? [
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'prospect', label: 'Prospect' },
                { value: 'former', label: 'Former' }
              ] : itemType === 'deliverable' ? [
                { value: 'draft', label: 'Draft' },
                { value: 'in_review', label: 'In Review' },
                { value: 'approved', label: 'Approved' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'delivered', label: 'Delivered' },
                { value: 'rejected', label: 'Rejected' }
              ] : [
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' }
              ]
            }
          />
          
          {/* Collapsible Toggle - Only show for clients and projects */}
          {(itemType === 'client' || itemType === 'project') && (
            <div className="flex items-center space-x-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isCollapsible !== false}
                  onChange={(e) => handleInputChange('isCollapsible', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Collapsible
                </span>
              </label>
              <div className="text-xs text-gray-500" style={{ color: 'var(--text-secondary)' }}>
                {itemType === 'client' ? 'Can have projects' : 'Can have deliverables'}
              </div>
            </div>
          )}
        </div>

        {/* Type-Specific Fields */}
        {itemType === 'client' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Select
                label="Industry"
                value={formData.industry || ''}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                options={[
                  { value: '', label: 'Select industry...' },
                  { value: 'Technology', label: 'Technology' },
                  { value: 'Healthcare', label: 'Healthcare' },
                  { value: 'Finance', label: 'Finance' },
                  { value: 'Education', label: 'Education' },
                  { value: 'Manufacturing', label: 'Manufacturing' },
                  { value: 'Retail', label: 'Retail' },
                  { value: 'Consulting', label: 'Consulting' },
                  { value: 'Marketing', label: 'Marketing' },
                  { value: 'Real Estate', label: 'Real Estate' },
                  { value: 'Government', label: 'Government' },
                  { value: 'Non-Profit', label: 'Non-Profit' },
                  { value: 'Other', label: 'Other' }
                ]}
                error={errors.industry}
                required
              />
              <Input
                label="Location"
                placeholder="e.g., New York, NY"
                value={formData.location || ''}
                onChange={(e) => handleInputChange('location', e.target.value)}
                error={errors.location}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Website"
                type="url"
                placeholder="https://company.com"
                value={formData.website || ''}
                onChange={(e) => handleInputChange('website', e.target.value)}
              />
              <Select
                label="Company Size"
                value={formData.company_size || 'medium'}
                onChange={(e) => handleInputChange('company_size', e.target.value)}
                options={[
                  { value: 'startup', label: 'Startup (1-10)' },
                  { value: 'small', label: 'Small (11-50)' },
                  { value: 'medium', label: 'Medium (51-200)' },
                  { value: 'large', label: 'Large (201-1000)' },
                  { value: 'enterprise', label: 'Enterprise (1000+)' }
                ]}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Select
                label="Status"
                value={formData.status || 'active'}
                onChange={(e) => handleInputChange('status', e.target.value)}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'prospect', label: 'Prospect' },
                  { value: 'former', label: 'Former' }
                ]}
              />
              <Select
                label="Priority"
                value={formData.priority || 'medium'}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                  { value: 'critical', label: 'Critical' }
                ]}
              />
            </div>
          </div>
        )}

        {itemType === 'project' && (
          <div className="space-y-4">
            {/* Project Details Section */}
            <div className="space-y-3">
              <h3 className="text-base font-medium text-gray-900">Project Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="Project Name"
                  placeholder="Enter project name..."
                  value={formData.title || ''}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  error={errors.title}
                  required
                />
                <Select
                  label="Status"
                  value={formData.status || 'planning'}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  options={[
                    { value: 'planning', label: 'Planning' },
                    { value: 'not-started', label: 'Not Started' },
                    { value: 'active', label: 'Active' },
                    { value: 'in-progress', label: 'In Progress' },
                    { value: 'completed', label: 'Completed' },
                    { value: 'cancelled', label: 'Cancelled' },
                    { value: 'on-hold', label: 'On Hold' }
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter project description..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                />
              </div>
            </div>

            {/* Dates Section */}
            <div className="space-y-3">
              <h3 className="text-base font-medium text-gray-900">Dates</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="Start Date"
                  type="date"
                  value={formData.start_date || ''}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                  required
                />
                <Input
                  label="End Date"
                  type="date"
                  value={formData.end_date || ''}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Owners Section */}
            <div className="space-y-3">
              <h3 className="text-base font-medium text-gray-900">Owners</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Select
                  label="Client Owner"
                  value={formData.client_owner || ''}
                  onChange={(e) => handleInputChange('client_owner', e.target.value)}
                  options={[
                    { value: '', label: 'Select client contact...' },
                    ...availableClients.map(client => ({
                      value: client.id,
                      label: client.name || client.title
                    }))
                  ]}
                  required
                />
                <Select
                  label="Internal Owner"
                  value={formData.internal_owner || ''}
                  onChange={(e) => handleInputChange('internal_owner', e.target.value)}
                  options={[
                    { value: '', label: 'Select team member...' },
                    ...availableUsers.map(user => ({
                      value: user.id,
                      label: `${user.first_name} ${user.last_name}`
                    }))
                  ]}
                />
              </div>
            </div>

            {/* Budget Section */}
            <div className="space-y-3">
              <h3 className="text-base font-medium text-gray-900">Budget</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  label="Amount"
                  type="number"
                  placeholder="0"
                  value={formData.budget_amount || 0}
                  onChange={(e) => handleInputChange('budget_amount', e.target.value)}
                  min="0"
                />
                <Select
                  label="Currency"
                  value={formData.budget_currency || 'USD'}
                  onChange={(e) => handleInputChange('budget_currency', e.target.value)}
                  options={[
                    { value: 'USD', label: 'USD' },
                    { value: 'EUR', label: 'EUR' },
                    { value: 'GBP', label: 'GBP' },
                    { value: 'CAD', label: 'CAD' }
                  ]}
                />
                <Select
                  label="Type"
                  value={formData.budget_type || 'fixed'}
                  onChange={(e) => handleInputChange('budget_type', e.target.value)}
                  options={[
                    { value: 'fixed', label: 'Fixed' },
                    { value: 'hourly', label: 'Hourly' },
                    { value: 'daily', label: 'Daily' },
                    { value: 'milestone', label: 'Milestone' },
                    { value: 'retainer', label: 'Retainer' }
                  ]}
                />
              </div>
            </div>

            {/* Staffing Section */}
            <div className="space-y-3">
              <h3 className="text-base font-medium text-gray-900">Staffing</h3>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {formData.team_members?.map((member, index) => (
                    <div
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800 border"
                    >
                      <span className="mr-1">👤</span>
                      {member.name} {member.role && `(${member.role})`}
                      <button
                        type="button"
                        onClick={() => {
                          const newMembers = [...formData.team_members];
                          newMembers.splice(index, 1);
                          handleInputChange('team_members', newMembers);
                        }}
                        className="ml-1 text-gray-600 hover:text-gray-800"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Add team member..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const newMember = {
                        name: e.target.value.trim(),
                        role: 'Member'
                      };
                      if (newMember.name) {
                        handleInputChange('team_members', [...(formData.team_members || []), newMember]);
                        e.target.value = '';
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Deliverables Section */}
            <div className="space-y-3">
              <h3 className="text-base font-medium text-gray-900">Deliverables</h3>
              <div className="space-y-2">
                {formData.deliverables?.map((deliverable, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg">
                    <input
                      type="text"
                      value={deliverable.name || ''}
                      onChange={(e) => {
                        const newDeliverables = [...formData.deliverables];
                        newDeliverables[index] = { ...newDeliverables[index], name: e.target.value };
                        handleInputChange('deliverables', newDeliverables);
                      }}
                      placeholder="Deliverable name..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <Select
                      value={deliverable.type || 'Strategy'}
                      onChange={(e) => {
                        const newDeliverables = [...formData.deliverables];
                        newDeliverables[index] = { ...newDeliverables[index], type: e.target.value };
                        handleInputChange('deliverables', newDeliverables);
                      }}
                      options={[
                        { value: 'Strategy', label: 'Strategy' },
                        { value: 'Report', label: 'Report' },
                        { value: 'Presentation', label: 'Presentation' },
                        { value: 'Analysis', label: 'Analysis' },
                        { value: 'Design', label: 'Design' },
                        { value: 'Dashboard', label: 'Dashboard' },
                        { value: 'API', label: 'API' },
                        { value: 'Other', label: 'Other' }
                      ]}
                      className="w-28"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newDeliverables = [...formData.deliverables];
                        newDeliverables.splice(index, 1);
                        handleInputChange('deliverables', newDeliverables);
                      }}
                      className="p-1 text-red-600 hover:text-red-800"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    handleInputChange('deliverables', [...(formData.deliverables || []), { name: '', type: 'Strategy' }]);
                  }}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  + Add deliverable
                </button>
              </div>
            </div>
          </div>
        )}

        {itemType === 'deliverable' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Select
                label="Project"
                value={formData.project || ''}
                onChange={(e) => handleInputChange('project', e.target.value)}
                options={[
                  { value: '', label: 'Select a project...' },
                  ...availableProjects.map(project => ({
                    value: project.id,
                    label: project.name || project.title
                  }))
                ]}
                helpText="Choose which project this deliverable belongs to"
                required
              />
              <Select
                label="Format"
                value={formData.format || 'PDF'}
                onChange={(e) => handleInputChange('format', e.target.value)}
                options={[
                  { value: 'PDF', label: 'PDF' },
                  { value: 'DOCX', label: 'DOCX' },
                  { value: 'PPTX', label: 'PPTX' },
                  { value: 'XLSX', label: 'XLSX' },
                  { value: 'HTML', label: 'HTML' },
                  { value: 'TXT', label: 'TXT' },
                  { value: 'IMAGE', label: 'IMAGE' },
                  { value: 'VIDEO', label: 'VIDEO' },
                  { value: 'AUDIO', label: 'AUDIO' },
                  { value: 'OTHER', label: 'OTHER' }
                ]}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Select
                label="Type"
                value={formData.type || 'Report'}
                onChange={(e) => handleInputChange('type', e.target.value)}
                options={[
                  { value: 'Report', label: 'Report' },
                  { value: 'Presentation', label: 'Presentation' },
                  { value: 'Strategy', label: 'Strategy' },
                  { value: 'Analysis', label: 'Analysis' },
                  { value: 'Design', label: 'Design' },
                  { value: 'Code', label: 'Code' },
                  { value: 'Documentation', label: 'Documentation' },
                  { value: 'Dashboard', label: 'Dashboard' },
                  { value: 'API', label: 'API' },
                  { value: 'Other', label: 'Other' }
                ]}
              />
              <Select
                label="Status"
                value={formData.status || 'draft'}
                onChange={(e) => handleInputChange('status', e.target.value)}
                options={[
                  { value: 'draft', label: 'Draft' },
                  { value: 'in_review', label: 'In Review' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'delivered', label: 'Delivered' },
                  { value: 'rejected', label: 'Rejected' }
                ]}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Due Date"
                type="date"
                value={formData.due_date || ''}
                onChange={(e) => handleInputChange('due_date', e.target.value)}
                error={errors.due_date}
                required
              />
              <Select
                label="Priority"
                value={formData.priority || 'medium'}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                  { value: 'critical', label: 'Critical' }
                ]}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Select
                label="Complexity"
                value={formData.complexity || 'moderate'}
                onChange={(e) => handleInputChange('complexity', e.target.value)}
                options={[
                  { value: 'simple', label: 'Simple' },
                  { value: 'moderate', label: 'Moderate' },
                  { value: 'complex', label: 'Complex' },
                  { value: 'very_complex', label: 'Very Complex' }
                ]}
              />
              <Input
                label="Estimated Hours"
                type="number"
                placeholder="40"
                value={formData.estimated_hours || 0}
                onChange={(e) => handleInputChange('estimated_hours', e.target.value)}
                min="0"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Version"
                placeholder="1.0"
                value={formData.version || '1.0'}
                onChange={(e) => handleInputChange('version', e.target.value)}
              />
              <Input
                label="Language"
                placeholder="en"
                value={formData.language || 'en'}
                onChange={(e) => handleInputChange('language', e.target.value)}
              />
            </div>

            <Textarea
              label="Brief"
              placeholder="Enter deliverable brief and requirements..."
              value={formData.brief || ''}
              onChange={(e) => handleInputChange('brief', e.target.value)}
              rows={4}
              helpText="Describe the deliverable scope, objectives, and key requirements"
              error={errors.brief}
              required
            />
          </div>
        )}

        {/* Error Display */}
        {errors.submit && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        {/* Debug: Manual test button */}
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-700 mb-2">Debug: Test submission directly</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              console.log('🧪 Manual test button clicked');
              const testData = {
                title: formData.title || 'Test Client',
                description: formData.description || 'Test Description',
                type: itemType,
                metadata: {
                  industry: formData.industry || 'Technology',
                  location: formData.location || 'Test Location'
                }
              };
              console.log('🧪 Calling handleSubmit directly with test data:', testData);
              handleSubmit({ preventDefault: () => console.log('preventDefault called') });
            }}
          >
            🧪 Test Submit
          </Button>
        </div>
      </form>
    </Modal>
  );
}
