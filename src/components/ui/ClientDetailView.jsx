'use client';

import { useState, useEffect } from 'react';
import { 
  Edit2, 
  Save, 
  X, 
  Upload, 
  Image, 
  User, 
  Plus, 
  Trash2, 
  Building2,
  Globe,
  MapPin,
  Tag,
  Users,
  Folder,
  MoreHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Button from './buttons/Button';
import Input from './forms/Input';
import Select from './forms/Select';

export default function ClientDetailView({ 
  client, 
  onUpdate, 
  onDelete,
  onAddProject 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [formData, setFormData] = useState({
    clientName: '',
    website: '',
    location: '',
    industry: '',
    owner: '',
    tags: [],
    keyPeople: [],
    logo: null
  });
  const [newTag, setNewTag] = useState('');
  const [newKeyPerson, setNewKeyPerson] = useState({ name: '', role: '' });
  const [expandedSections, setExpandedSections] = useState({
    keyPeople: true,
    projects: true
  });

  const industryOptions = [
    { value: '', label: 'Select industry...' },
    { value: 'banking', label: 'Banking' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'fintech', label: 'Fintech' },
    { value: 'consulting', label: 'Consulting' },
    { value: 'other', label: 'Other' }
  ];

  const ownerOptions = [
    { value: '', label: 'Select team member...' },
    { value: 'john-doe', label: 'John Doe' },
    { value: 'jane-smith', label: 'Jane Smith' },
    { value: 'mike-wilson', label: 'Mike Wilson' },
    { value: 'sarah-jones', label: 'Sarah Jones' }
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

  // Initialize form data from client
  useEffect(() => {
    if (client) {
      setFormData({
        clientName: client.title || '',
        website: client.metadata?.website || '',
        location: client.metadata?.location || '',
        industry: client.metadata?.industry || '',
        owner: client.metadata?.owner || '',
        tags: client.metadata?.tags || [],
        keyPeople: client.metadata?.keyPeople || [],
        logo: client.metadata?.logo || null
      });
    }
  }, [client]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEditField = (field) => {
    setEditingField(field);
  };

  const handleSaveField = async (field) => {
    try {
      const updatedClient = {
        ...client,
        title: field === 'clientName' ? formData.clientName : client.title,
        metadata: {
          ...client.metadata,
          [field]: formData[field]
        }
      };
      
      await onUpdate(updatedClient);
      setEditingField(null);
    } catch (error) {
      console.error('Error updating client:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    // Reset form data to original values
    setFormData({
      clientName: client.title || '',
      website: client.metadata?.website || '',
      location: client.metadata?.location || '',
      industry: client.metadata?.industry || '',
      owner: client.metadata?.owner || '',
      tags: client.metadata?.tags || [],
      keyPeople: client.metadata?.keyPeople || [],
      logo: client.metadata?.logo || null
    });
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      setFormData(prev => ({ ...prev, logo: file }));
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      const updatedTags = [...formData.tags, newTag.trim()];
      setFormData(prev => ({ ...prev, tags: updatedTags }));
      setNewTag('');
      
      // Auto-save tags
      handleSaveField('tags');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    const updatedTags = formData.tags.filter(tag => tag !== tagToRemove);
    setFormData(prev => ({ ...prev, tags: updatedTags }));
    
    // Auto-save tags
    handleSaveField('tags');
  };

  const handleAddKeyPerson = () => {
    if (newKeyPerson.name.trim() && newKeyPerson.role) {
      const newId = Math.max(...formData.keyPeople.map(p => p.id), 0) + 1;
      const updatedKeyPeople = [...formData.keyPeople, { 
        id: newId, 
        name: newKeyPerson.name.trim(), 
        role: newKeyPerson.role,
        avatar: null 
      }];
      setFormData(prev => ({ ...prev, keyPeople: updatedKeyPeople }));
      setNewKeyPerson({ name: '', role: '' });
      
      // Auto-save key people
      handleSaveField('keyPeople');
    }
  };

  const handleRemoveKeyPerson = (personId) => {
    const updatedKeyPeople = formData.keyPeople.filter(person => person.id !== personId);
    setFormData(prev => ({ ...prev, keyPeople: updatedKeyPeople }));
    
    // Auto-save key people
    handleSaveField('keyPeople');
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

  const renderEditableField = (field, label, value, type = 'text', options = null) => {
    const isEditing = editingField === field;
    
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </label>
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <div className="flex-1 flex items-center space-x-2">
              {type === 'select' ? (
                <Select
                  value={formData[field]}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  options={options || []}
                  className="flex-1"
                />
              ) : (
                <Input
                  value={formData[field]}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  className="flex-1"
                />
              )}
              <button
                onClick={() => handleSaveField(field)}
                className="p-1 text-green-600 hover:text-green-700"
                title="Save"
              >
                <Save className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancelEdit}
                className="p-1 text-gray-600 hover:text-gray-700"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                {value || 'Not specified'}
              </span>
              <button
                onClick={() => handleEditField(field)}
                className="p-1 text-gray-600 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!client) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Select a client to view details</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          {/* Logo */}
          <div className="w-16 h-16 border-2 border-dashed rounded-lg flex items-center justify-center" style={{ borderColor: 'var(--border-secondary)' }}>
            {formData.logo ? (
              <img 
                src={formData.logo instanceof File ? URL.createObjectURL(formData.logo) : formData.logo} 
                alt="Client logo" 
                className="w-full h-full object-contain rounded-lg"
              />
            ) : (
              <Building2 className="w-8 h-8" style={{ color: 'var(--text-secondary)' }} />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {formData.clientName || 'Unnamed Client'}
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {formData.website || 'No website'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="file"
            id="logo-upload"
            accept="image/png,image/jpeg,image/svg+xml"
            onChange={handleLogoUpload}
            className="hidden"
          />
          <label
            htmlFor="logo-upload"
            className="px-3 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors text-sm"
          >
            <Upload className="w-4 h-4 mr-1 inline" />
            Upload Logo
          </label>
          <button
            onClick={() => onDelete?.(client)}
            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete client"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
          {formData.clientName} is a leading multinational investment bank headquartered in {formData.location || 'London'}, 
          serving institutional clients worldwide with comprehensive financial services including corporate banking, 
          investment management, and advisory services.
        </p>
        <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
          Source: Company overview document
        </p>
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {renderEditableField('website', 'Website', formData.website, 'text')}
          {renderEditableField('location', 'Location', formData.location, 'text')}
        </div>
        <div className="space-y-4">
          {renderEditableField('industry', 'Industry', formData.industry, 'select', industryOptions)}
          {renderEditableField('owner', 'Owner', formData.owner, 'select', ownerOptions)}
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-3">
        <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          Tags
        </label>
        <div className="flex flex-wrap gap-2">
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
        <div className="flex space-x-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Add tag..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddTag}
            disabled={!newTag.trim()}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      </div>

      {/* Key People */}
      <div>
        <div 
          className="flex items-center justify-between cursor-pointer mb-3"
          onClick={() => toggleSection('keyPeople')}
        >
          <div className="flex items-center space-x-2">
            {expandedSections.keyPeople ? (
              <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
            ) : (
              <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
            )}
            <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Key People
            </label>
          </div>
        </div>
        
        {expandedSections.keyPeople && (
          <div className="space-y-3">
            <div className="space-y-2">
              {formData.keyPeople.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{person.name}</p>
                      <p className="text-xs text-gray-600">{person.role}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyPerson(person.id)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newKeyPerson.name}
                  onChange={(e) => handleKeyPersonInputChange('name', e.target.value)}
                  placeholder="Name"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Select
                  value={newKeyPerson.role}
                  onChange={(e) => handleKeyPersonInputChange('role', e.target.value)}
                  options={roleOptions}
                  className="w-32"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddKeyPerson}
                disabled={!newKeyPerson.name.trim() || !newKeyPerson.role}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add key person
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Projects */}
      <div>
        <div 
          className="flex items-center justify-between cursor-pointer mb-3"
          onClick={() => toggleSection('projects')}
        >
          <div className="flex items-center space-x-2">
            {expandedSections.projects ? (
              <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
            ) : (
              <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
            )}
            <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Projects
            </label>
          </div>
          <button
            onClick={() => onAddProject?.(client)}
            className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4 mr-1 inline" />
            Add Project
          </button>
        </div>
        
        {expandedSections.projects && (
          <div className="space-y-2">
            {client.projects && client.projects.length > 0 ? (
              client.projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Folder className="w-4 h-4 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium">{project.title}</p>
                      <p className="text-xs text-gray-600">{project.status}</p>
                    </div>
                  </div>
                  <button className="text-gray-600 hover:text-gray-800">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Folder className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No projects yet</p>
                <p className="text-sm">Add a project to get started</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
