'use client';

import { useState, useEffect, useRef } from 'react';
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
import { UnifiedAddModal } from './';
import ConfirmationModal from './ConfirmationModal';

export default function ClientDetailView({ 
  client, 
  onUpdate, 
  onDelete,
  onAddProject,
  refreshFromDatabase
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
  const [availableUsers, setAvailableUsers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addItemType, setAddItemType] = useState(null);
  const [parentId, setParentId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const usersFetched = useRef(false);

  const industryOptions = [
    { value: '', label: 'Select industry...' },
    { value: 'financial-services', label: 'Financial Services' },
    { value: 'banking', label: 'Banking' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'fintech', label: 'Fintech' },
    { value: 'consulting', label: 'Consulting' },
    { value: 'other', label: 'Other' }
  ];

  const ownerOptions = [
    { value: '', label: 'Select team member...' },
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

  // Fetch available users
  useEffect(() => {
    // Only fetch once using ref to prevent infinite loops
    if (!usersFetched.current) {
      usersFetched.current = true;
      const fetchUsers = async () => {
        try {
          console.log('ClientDetailView: Fetching users...');
          const response = await fetch('/api/users');
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.users) {
              console.log('ClientDetailView: Users fetched successfully:', data.users.length);
              setAvailableUsers(data.users);
            }
          }
        } catch (error) {
          console.error('Error fetching users:', error);
        }
      };

      fetchUsers();
    }
  }, []);

  // Initialize form data from client
  useEffect(() => {
    console.log('ClientDetailView: Client changed, reinitializing form data...', client?.id || client?._id);
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

  // Helper function to get owner display name
  const getOwnerDisplayName = (ownerId) => {
    if (!ownerId) return 'Not specified';
    const user = availableUsers.find(user => (user.id || user._id) === ownerId);
    if (user) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email_address || user.username || 'Unknown User';
    }
    return ownerId; // Fallback to showing ID if user not found
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

  const handleAddItem = (itemType, parent = null) => {
    setAddItemType(itemType);
    setParentId(parent);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setAddItemType(null);
    setParentId(null);
  };

  const handleSaveItem = async (itemData) => {
    try {
      // Call the onAddProject callback if it exists
      if (onAddProject) {
        await onAddProject(client, itemData);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  const handleRemoveItem = (itemType, itemId, itemTitle) => {
    console.log('🗑️ ClientDetailView: Starting remove item process...');
    console.log('📝 Remove item data:', {
      type: itemType,
      id: itemId,
      title: itemTitle
    });
    
    // Show appropriate confirmation dialog based on item type
    let confirmMessage = '';
    switch (itemType) {
      case 'client':
        confirmMessage = `Are you sure you want to remove "${itemTitle}"?\n\nThis will also remove ALL associated projects and deliverables.\n\nThis action cannot be undone.`;
        break;
      case 'project':
        confirmMessage = `Are you sure you want to remove "${itemTitle}"?\n\nThis will also remove ALL associated deliverables.\n\nThis action cannot be undone.`;
        break;
      case 'deliverable':
        confirmMessage = `Are you sure you want to remove "${itemTitle}"?\n\nThis action cannot be undone.`;
        break;
      default:
        confirmMessage = `Are you sure you want to remove "${itemTitle}"?\n\nThis action cannot be undone.`;
    }

    setPendingDelete({ type: itemType, id: itemId, title: itemTitle, message: confirmMessage });
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;

    const { type, id, title } = pendingDelete;
    
    try {
      console.log('🗑️ Removing item of type:', type, 'with ID:', id);

      // Call the appropriate API endpoint based on item type
      let endpoint = '';
      switch (type) {
        case 'client':
          endpoint = `/api/clients?id=${id}`;
          break;
        case 'project':
          endpoint = `/api/projects?id=${id}`;
          break;
        case 'deliverable':
          endpoint = `/api/deliverables?id=${id}`;
          break;
        default:
          throw new Error(`Unknown item type: ${type}`);
      }

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('❌ Delete request failed:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
        });
        
        let errorMessage = `Failed to remove ${type}`;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            const errorText = await response.text();
            console.error('Non-JSON error response:', errorText.substring(0, 200));
            errorMessage = `${type} removal failed: ${response.status} ${response.statusText}`;
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          errorMessage = `${type} removal failed: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      console.log('✅ Item removed successfully');

      // Call the onDelete callback if it exists
      if (onDelete) {
        await onDelete(client);
      }

      // Refresh the left menu data
      if (refreshFromDatabase) {
        console.log('🔄 Refreshing dashboard data after deletion...');
        refreshFromDatabase();
      }

      setShowConfirm(false);
      setPendingDelete(null);
    } catch (error) {
      console.error('💥 Error removing item:', error);
      alert(`Failed to remove ${type}: ${error.message}`);
    }
  };

  const renderEditableField = (field, label, value, type = 'text', options = null) => {
    const isEditing = editingField === field;
    
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        {isEditing ? (
          <div className="flex items-center space-x-2">
            {type === 'select' ? (
              <select
                value={formData[field]}
                onChange={(e) => handleInputChange(field, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {options?.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={formData[field]}
                onChange={(e) => handleInputChange(field, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            )}
            <button
              onClick={() => handleSaveField(field)}
              className="p-2 text-green-600 hover:text-green-700"
              title="Save"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancelEdit}
              className="p-2 text-gray-600 hover:text-gray-700"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div 
            className="group flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md text-sm cursor-pointer hover:border-gray-400 focus-within:ring-2 focus-within:ring-blue-500"
            onClick={() => handleEditField(field)}
          >
            <span className="text-gray-900">
              {value || <span className="text-gray-500 italic">Not specified</span>}
            </span>
            <Edit2 className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100" />
          </div>
        )}
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
    <div className="bg-white">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-semibold text-gray-900">
            {formData.clientName || 'Unnamed Client'}
          </h1>
          <button
            onClick={() => {
              const businessEntityId = client.metadata?.business_entity_id || 
                                      client.metadata?.client_id || 
                                      client._id || 
                                      client.id;
              handleRemoveItem('client', businessEntityId, client.title);
            }}
            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
            title="Delete client"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
        <p className="text-gray-600 mb-2">
          {client.metadata?.description || 'No description available'}
        </p>
        <a href="#" className="text-blue-600 text-sm hover:underline">
          Source: Company overview document
        </a>
      </div>

      {/* Content */}
      <div className="px-6 pb-6 space-y-6">
        {/* Logo Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Logo:</label>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-800 rounded flex items-center justify-center">
              {formData.logo ? (
                <img 
                  src={formData.logo instanceof File ? URL.createObjectURL(formData.logo) : formData.logo} 
                  alt="Client logo" 
                  className="w-full h-full object-contain rounded"
                />
              ) : (
                <span className="text-white font-semibold text-lg">
                  {formData.clientName ? formData.clientName.split(' ').map(word => word[0]).join('').substring(0, 3) : 'GBC'}
                </span>
              )}
            </div>
            <div>
              <input
                type="file"
                id="logo-upload"
                accept="image/png,image/jpeg,image/svg+xml"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <label
                htmlFor="logo-upload"
                className="inline-block px-3 py-1 bg-gray-600 text-white rounded text-sm cursor-pointer hover:bg-gray-700"
              >
                Upload Logo
              </label>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG or SVG (max 2MB)</p>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-2 gap-4">
          {renderEditableField('website', 'Website:', formData.website, 'text')}
          {renderEditableField('location', 'Location:', formData.location, 'text')}
          {renderEditableField('industry', 'Industry:', formData.industry, 'select', industryOptions)}
          {renderEditableField('owner', 'Owner:', getOwnerDisplayName(formData.owner), 'select', ownerOptions)}
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Tags:</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {formData.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Add tag..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
          />
        </div>

        {/* Contacts */}
        <div>
          <div 
            className="flex items-center justify-between cursor-pointer mb-3"
            onClick={() => toggleSection('keyPeople')}
          >
            <label className="text-sm font-medium text-gray-700">Contacts:</label>
            {expandedSections.keyPeople ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            )}
          </div>
          
          {expandedSections.keyPeople && (
            <div className="space-y-3">
              {formData.keyPeople.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{person.name}</p>
                      <p className="text-xs text-gray-500">{person.email || `${person.name.toLowerCase().replace(' ', '.')}@company.com`}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyPerson(person.id)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newKeyPerson.name}
                  onChange={(e) => handleKeyPersonInputChange('name', e.target.value)}
                  placeholder="Add contact..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleAddKeyPerson}
                  disabled={!newKeyPerson.name.trim()}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700 disabled:opacity-50"
                >
                  Add
                </button>
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
            <label className="text-sm font-medium text-gray-700">Projects:</label>
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddItem('project', client.id || client._id);
                }}
                className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                title="Add Project"
              >
                <Plus className="w-4 h-4" />
              </button>
              {expandedSections.projects ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              )}
            </div>
          </div>
          
          {expandedSections.projects && (
            <div className="space-y-3">
              {client.projects && client.projects.length > 0 ? (
                client.projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Folder className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{project.title}</p>
                        <p className="text-xs text-gray-500">{project.status}</p>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600 p-1">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-400">
                  <Folder className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm mb-1">No projects yet</p>
                  <button
                    onClick={() => handleAddItem('project', client.id || client._id)}
                    className="text-blue-600 text-sm hover:underline"
                  >
                    Create your first project to get started
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Unified Add Modal */}
      {showAddModal && (
        <UnifiedAddModal
          isOpen={showAddModal}
          onClose={handleCloseModal}
          onAdd={handleSaveItem}
          itemType={addItemType}
          parentId={parentId}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={confirmDelete}
        title="Confirm Deletion"
        message={pendingDelete?.message || ''}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
