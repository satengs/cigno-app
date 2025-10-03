'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  ChevronDown, 
  ChevronUp, 
  MoreHorizontal, 
  Plus, 
  FileText,
  Trash2
} from 'lucide-react';

export default function NewClientModal({ 
  isOpen, 
  onClose, 
  onAdd,
  editItem = null
}) {
  console.log('🔄 NewClientModal render:', { isOpen, hasOnAdd: !!onAdd, hasOnClose: !!onClose, editItem });
  const [availableOrganizations, setAvailableOrganizations] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [formData, setFormData] = useState({
    clientName: '',
    website: 'https://example.com',
    location: '',
    industry: '',
    companySize: 'medium',
    priority: 'medium',
    owner: '',
    status: 'active',
    description: '',
    tags: [],
    keyPeople: [],
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [newTag, setNewTag] = useState('');
  const [newKeyPerson, setNewKeyPerson] = useState({ 
    full_name: '', 
    role: '', 
    email: '', 
    image: '',
    phone: '',
    is_primary: false 
  });
  const [expandedSections, setExpandedSections] = useState({
    keyPeople: true,
    projects: false,
    communication: false,
    billing: false
  });

  // Fetch available organizations and users
  useEffect(() => {
    const fetchAvailableData = async () => {
      try {
        // Fetch organizations
        const orgResponse = await fetch('/api/organisations');
        if (orgResponse.ok) {
          const orgData = await orgResponse.json();
          if (orgData.success && orgData.organisations) {
            setAvailableOrganizations(orgData.organisations);
          }
        }

        // Fetch users  
        const userResponse = await fetch('/api/users');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.success && userData.users) {
            setAvailableUsers(userData.users);
            // Auto-select first user if no owner is selected and this is not edit mode
            if (!editItem && !formData.owner && userData.users.length > 0) {
              setFormData(prev => ({ 
                ...prev, 
                owner: userData.users[0].id || userData.users[0]._id 
              }));
            }
          }
        }
      } catch (error) {
        console.error('Error fetching available data:', error);
      }
    };

    if (isOpen) {
      fetchAvailableData();
    }
  }, [isOpen]);

  // Initialize form data for edit mode
  useEffect(() => {
    if (editItem) {
      setFormData({
        clientName: editItem.title || '',
        website: editItem.metadata?.website || '',
        location: editItem.metadata?.location || '',
        industry: editItem.metadata?.industry || '',
        owner: editItem.metadata?.owner || '',
        tags: editItem.metadata?.tags || [],
        keyPeople: editItem.metadata?.keyPeople || [],
        description: editItem.metadata?.description || '',
        companySize: editItem.metadata?.companySize || editItem.metadata?.company_size || 'medium',
        status: editItem.metadata?.status || 'active',
        priority: editItem.metadata?.priority || 'medium',
        communicationPreferences: editItem.metadata?.communicationPreferences || {
          preferredMethod: 'email',
          timezone: 'UTC',
          businessHours: { start: '09:00', end: '17:00' }
        },
        billingInfo: editItem.metadata?.billingInfo || {
          billingAddress: '',
          paymentTerms: 'net_30',
          currency: 'USD'
        },
        notes: editItem.metadata?.notes || ''
      });
    }
  }, [editItem]);

  const industryOptions = [
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
  ];

  const ownerOptions = [
    { value: '', label: 'Select owner...' },
    ...availableUsers.map(user => ({
      value: user.id || user._id,
      label: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email_address || user.username || 'Unknown User'
    }))
  ];

  const roleOptions = [
    { value: '', label: 'Select role...' },
    { value: 'ceo', label: 'CEO' },
    { value: 'cto', label: 'CTO' },
    { value: 'cfo', label: 'CFO' },
    { value: 'vp', label: 'VP' },
    { value: 'director', label: 'Director' },
    { value: 'manager', label: 'Manager' },
    { value: 'analyst', label: 'Analyst' },
    { value: 'other', label: 'Other' }
  ];

  const companySizeOptions = [
    { value: '', label: 'Select company size...' },
    { value: 'startup', label: 'Startup (1-10 employees)' },
    { value: 'small', label: 'Small (11-50 employees)' },
    { value: 'medium', label: 'Medium (51-200 employees)' },
    { value: 'large', label: 'Large (201-1000 employees)' },
    { value: 'enterprise', label: 'Enterprise (1000+ employees)' }
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'prospect', label: 'Prospect' },
    { value: 'former', label: 'Former' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' }
  ];

  const communicationMethodOptions = [
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'in_person', label: 'In Person' },
    { value: 'video_call', label: 'Video Call' }
  ];

  const paymentTermsOptions = [
    { value: 'net_15', label: 'Net 15' },
    { value: 'net_30', label: 'Net 30' },
    { value: 'net_45', label: 'Net 45' },
    { value: 'net_60', label: 'Net 60' },
    { value: 'due_on_receipt', label: 'Due on Receipt' },
    { value: 'custom', label: 'Custom' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Client name is required';
    }
    
    if (formData.website && !isValidUrl(formData.website)) {
      newErrors.website = 'Please enter a valid URL';
    }
    
    if (!formData.industry) {
      newErrors.industry = 'Industry is required';
    }
    
    if (!formData.owner) {
      newErrors.owner = 'Owner is required';
    } else {
      // Validate that the selected owner is a valid user ID (not a placeholder)
      const isValidUserId = availableUsers.some(user => 
        (user.id || user._id) === formData.owner
      );
      if (!isValidUserId) {
        newErrors.owner = 'Please select a valid owner from the list';
      }
    }
    
    // Validate that we have at least one organization available
    if (availableOrganizations.length === 0) {
      newErrors.general = 'No organizations available. Please create an organization first.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type and size
      const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
      const maxSize = 2 * 1024 * 1024; // 2MB
      
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, logo: 'Please upload a PNG, JPG, or SVG file' }));
        return;
      }
      
      if (file.size > maxSize) {
        setErrors(prev => ({ ...prev, logo: 'File size must be less than 2MB' }));
        return;
      }

      setFormData(prev => ({ ...prev, logo: file }));
      setErrors(prev => ({ ...prev, logo: '' }));
    }
  };

  const handleAddTag = () => {
    console.log('🏷️ Adding tag:', newTag.trim());
    console.log('🏷️ Current tags:', formData.tags);
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      const updatedTags = [...formData.tags, newTag.trim()];
      console.log('🏷️ Updated tags will be:', updatedTags);
      setFormData(prev => ({
        ...prev,
        tags: updatedTags
      }));
      setNewTag('');
    } else {
      console.log('🏷️ Tag not added - either empty or duplicate');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleAddKeyPerson = () => {
    if (newKeyPerson.full_name.trim() && newKeyPerson.role && newKeyPerson.email.trim()) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newKeyPerson.email)) {
        setErrors(prev => ({ ...prev, keyPersonEmail: 'Please enter a valid email address' }));
        return;
      }

      const newId = Math.max(...formData.keyPeople.map(p => p.id), 0) + 1;
      setFormData(prev => ({
        ...prev,
        keyPeople: [...prev.keyPeople, { 
          id: newId, 
          full_name: newKeyPerson.full_name.trim(), 
          role: newKeyPerson.role,
          email: newKeyPerson.email.trim(),
          image: newKeyPerson.image.trim() || null,
          phone: newKeyPerson.phone.trim() || null,
          is_primary: newKeyPerson.is_primary || prev.keyPeople.length === 0 // First person is primary by default
        }]
      }));
      setNewKeyPerson({ 
        full_name: '', 
        role: '', 
        email: '', 
        image: '',
        phone: '',
        is_primary: false 
      });
      setErrors(prev => ({ ...prev, keyPersonEmail: '' }));
    }
  };

  const handleRemoveKeyPerson = (personId) => {
    setFormData(prev => ({
      ...prev,
      keyPeople: prev.keyPeople.filter(person => person.id !== personId)
    }));
  };

  const handleKeyPersonInputChange = (field, value) => {
    setNewKeyPerson(prev => ({ ...prev, [field]: value }));
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSubmit = async (e) => {
    console.log('🚀 NewClientModal handleSubmit called');
    console.log('📝 Event details:', e);
    e.preventDefault();
    
    console.log('🔍 Current form data:', formData);
    console.log('🔍 Validation check starting...');
    
    if (!validateForm()) {
      console.log('❌ Form validation failed');
      console.log('🔍 Current errors:', errors);
      return;
    }
    
    console.log('✅ Form validation passed');
    setLoading(true);
    setErrors({});

    const clientData = {
      title: formData.clientName,
      type: 'client',
      description: `Client: ${formData.clientName}`,
      website: formData.website,
      location: formData.location,
      industry: formData.industry,
      owner: formData.owner,
      organisation: availableOrganizations.length > 0 ? (availableOrganizations[0].id || availableOrganizations[0]._id) : '68ded9a5b1a804e54c68f841', // Use first available organization
      tags: formData.tags,
      notes: formData.notes,
      company_size: formData.companySize,
      priority: formData.priority,
      status: 'active',
      order: 0,
      isCollapsible: true,
      metadata: {
        website: formData.website,
        location: formData.location,
        industry: formData.industry,
        owner: formData.owner,
        tags: formData.tags,
        keyPeople: formData.keyPeople,
        logo: formData.logo,
        companySize: formData.companySize,
        priority: formData.priority,
        notes: formData.notes
      }
    };

    try {
      console.log('📤 Prepared client data:', clientData);
      console.log('🏷️ Tags being sent:', clientData.tags);
      console.log('👥 Key people being sent:', formData.keyPeople);
      console.log('🔍 onAdd function available:', typeof onAdd);
      console.log('🔍 Calling onAdd...');
      
      const createdClient = await onAdd(clientData);
      console.log('✅ Client created successfully:', createdClient);
      
      // Create key persons if any were added
      if (formData.keyPeople.length > 0 && createdClient?.data?.client?._id) {
        console.log('👥 Creating key persons for client:', createdClient.data.client._id);
        
        for (const keyPerson of formData.keyPeople) {
          try {
            const keyPersonData = {
              full_name: keyPerson.full_name,
              role: keyPerson.role,
              email: keyPerson.email,
              image: keyPerson.image || null,
              phone: keyPerson.phone || null,
              client: createdClient.data.client._id,
              is_primary: keyPerson.is_primary
            };

            const response = await fetch('/api/key-persons', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(keyPersonData),
            });

            const result = await response.json();
            if (result.success) {
              console.log('✅ Key person created:', result.data.keyPerson.full_name);
            } else {
              console.error('❌ Failed to create key person:', result.error);
            }
          } catch (keyPersonError) {
            console.error('❌ Error creating key person:', keyPersonError);
          }
        }
      }
      
      onClose();
    } catch (error) {
      console.error('💥 Error creating client:', error);
      console.error('🔍 Error details:', {
        message: error.message,
        stack: error.stack,
        clientData: JSON.stringify(clientData, null, 2)
      });
      setErrors({ general: 'Failed to create client. Please try again.' });
    } finally {
      setLoading(false);
      console.log('🏁 Form submission completed');
    }
  };

  if (!isOpen) {
    console.log('❌ NewClientModal not rendering - isOpen is false');
    return null;
  }

  console.log('✅ NewClientModal rendering - isOpen is true');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Create New Client</h2>
            <p className="text-sm text-gray-600 mt-1">Add a new client to your portfolio</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form - Scrollable */}
        <form onSubmit={(e) => {
          console.log('📋 Form onSubmit event triggered in NewClientModal');
          console.log('📝 Event target:', e.target);
          console.log('📝 Form elements:', e.target.elements);
          handleSubmit(e);
        }} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Client Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Client Name</label>
            <input
              type="text"
              value={formData.clientName}
              onChange={(e) => handleInputChange('clientName', e.target.value)}
              placeholder="Enter client name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            {errors.clientName && (
              <p className="mt-1 text-sm text-red-600">{errors.clientName}</p>
            )}
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Industry */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
            <div className="relative">
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                placeholder="Select or type industry..."
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {errors.industry && (
              <p className="mt-1 text-sm text-red-600">{errors.industry}</p>
            )}
          </div>

          {/* Owner */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Owner</label>
            <select
              value={formData.owner}
              onChange={(e) => handleInputChange('owner', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {ownerOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.owner && (
              <p className="mt-1 text-sm text-red-600">{errors.owner}</p>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add tags (press Enter to add)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
            />
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 text-gray-600 hover:text-gray-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Key People */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Key People</label>
            {formData.keyPeople.length > 0 && (
              <div className="space-y-2 mb-3">
                {formData.keyPeople.map((person) => (
                  <div
                    key={person.id}
                    className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                        {person.image ? (
                          <img 
                            src={person.image} 
                            alt={person.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-600">
                            {person.full_name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium">{person.full_name}</p>
                          {person.is_primary && (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              Primary
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600">{person.role}</p>
                        <p className="text-xs text-gray-500">{person.email}</p>
                        {person.phone && (
                          <p className="text-xs text-gray-500">{person.phone}</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyPerson(person.id)}
                      className="text-gray-600 hover:text-gray-800 ml-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => setExpandedSections(prev => ({ ...prev, keyPeople: !prev.keyPeople }))}
              className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-gray-400 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Add key person
            </button>
            
            {expandedSections.keyPeople && (
              <div className="mt-3 space-y-3 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newKeyPerson.full_name}
                    onChange={(e) => handleKeyPersonInputChange('full_name', e.target.value)}
                    placeholder="Full Name *"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    value={newKeyPerson.role}
                    onChange={(e) => handleKeyPersonInputChange('role', e.target.value)}
                    placeholder="Role *"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="email"
                    value={newKeyPerson.email}
                    onChange={(e) => handleKeyPersonInputChange('email', e.target.value)}
                    placeholder="Email *"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="tel"
                    value={newKeyPerson.phone}
                    onChange={(e) => handleKeyPersonInputChange('phone', e.target.value)}
                    placeholder="Phone"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <input
                  type="url"
                  value={newKeyPerson.image}
                  onChange={(e) => handleKeyPersonInputChange('image', e.target.value)}
                  placeholder="Profile Image URL"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_primary"
                    checked={newKeyPerson.is_primary}
                    onChange={(e) => handleKeyPersonInputChange('is_primary', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_primary" className="text-sm text-gray-700">
                    Set as primary contact
                  </label>
                </div>
                {errors.keyPersonEmail && (
                  <p className="text-sm text-red-600">{errors.keyPersonEmail}</p>
                )}
                <button
                  type="button"
                  onClick={handleAddKeyPerson}
                  disabled={!newKeyPerson.full_name.trim() || !newKeyPerson.role.trim() || !newKeyPerson.email.trim()}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Person
                </button>
              </div>
            )}
          </div>

          {/* Error Message */}
          {errors.general && (
            <div className="text-red-600 text-sm">{errors.general}</div>
          )}
          </div>

          {/* Action Buttons - Fixed Footer */}
          <div className="border-t border-gray-200 p-6 flex-shrink-0">
            <button
              type="submit"
              disabled={loading}
              onClick={(e) => {
                console.log('🖱️ Submit button clicked in NewClientModal');
                console.log('📝 Button type:', e.target.type);
                console.log('📝 Form will submit:', !e.defaultPrevented);
                console.log('📝 Loading state:', loading);
                console.log('📝 Form data has client name:', !!formData.clientName);
              }}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 font-medium"
            >
              {loading ? 'Creating...' : 'Create Client'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full mt-2 text-gray-600 hover:text-gray-800 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
