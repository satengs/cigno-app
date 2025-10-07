'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Building2, Target, Plus, MoreHorizontal } from 'lucide-react';
import { UnifiedAddModal } from '../ui';
import ConfirmationModal from '../ui/ConfirmationModal';
import ThemeToggle from '../theme/ThemeToggle';
import dataService from '@/lib/services/DataService';

export default function LeftNav({ 
  onToggle, 
  menuStructure, 
  isLoading, 
  refreshFromDatabase, 
  toggleCollapse: toggleItemCollapse,
  expandItem,
  collapseItem,
  onItemSelect, 
  onModalStateChange,
  selectedItem: externalSelectedItem
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    client: true,
    project: true,
    deliverable: true
  });
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addItemType, setAddItemType] = useState(null);
  const [parentId, setParentId] = useState(null);
  const [availableClients, setAvailableClients] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [availableProjects, setAvailableProjects] = useState([]);
const [selectedNavItem, setSelectedNavItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredItem, setHoveredItem] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const sidebarRef = useRef(null);

  // Handle item selection
  const handleItemClick = (item) => {
    console.log('🎯 LeftNav handleItemClick called with:', {
      item,
      itemId: item?._id || item?.id,
      itemType: item?.type,
      hasMetadata: !!item?.metadata
    });
    
    // Ensure the item has a consistent ID structure
    const normalizedItem = {
      ...item,
      id: item._id || item.id, // Ensure id field exists
      _id: item._id || item.id  // Ensure _id field exists
    };
    
    console.log('🎯 LeftNav normalized item:', {
      id: normalizedItem.id,
      _id: normalizedItem._id,
      type: normalizedItem.type
    });
    
    setSelectedNavItem(normalizedItem);
    if (onItemSelect) {
      onItemSelect(normalizedItem);
    }
  };

  useEffect(() => {
    if (externalSelectedItem && externalSelectedItem.id) {
      setSelectedNavItem({
        ...externalSelectedItem,
        id: externalSelectedItem._id || externalSelectedItem.id,
        _id: externalSelectedItem._id || externalSelectedItem.id
      });

      setExpandedSections(prev => ({
        ...prev,
        project: true,
        deliverable: true
      }));
    } else if (!externalSelectedItem) {
      setSelectedNavItem(null);
    }
  }, [externalSelectedItem]);

  // Helper function to get status display info
  const getStatusInfo = (status) => {
    const statusMap = {
      'active': { color: '#10b981', label: 'Active' },
      'completed': { color: '#10b981', label: 'Completed' },
      'not-started': { color: '#6b7280', label: 'Not Started' },
      'draft': { color: '#6b7280', label: 'Draft' },
      'in-progress': { color: '#f59e0b', label: 'In Progress' },
      'in_progress': { color: '#f59e0b', label: 'In Progress' },
      'in_review': { color: '#3b82f6', label: 'In Review' },
      'approved': { color: '#10b981', label: 'Approved' },
      'delivered': { color: '#10b981', label: 'Delivered' },
      'rejected': { color: '#ef4444', label: 'Rejected' },
      'prospect': { color: '#8b5cf6', label: 'Prospect' },
      'former': { color: '#6b7280', label: 'Former' },
      'inactive': { color: '#6b7280', label: 'Inactive' },
      'cancelled': { color: '#ef4444', label: 'Cancelled' },
      'on-hold': { color: '#f59e0b', label: 'On Hold' }
    };
    
    return statusMap[status] || { color: '#6b7280', label: status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown' };
  };

  // Search filter function
  const filterMenuItems = (items, query) => {
    if (!query.trim()) return items;
    
    const searchLower = query.toLowerCase().trim();
    
    const filterItem = (item) => {
      // Check if current item matches
      const itemMatches = item.title?.toLowerCase().includes(searchLower) ||
                         item.description?.toLowerCase().includes(searchLower) ||
                         item.type?.toLowerCase().includes(searchLower) ||
                         item.status?.toLowerCase().includes(searchLower);
      
      // Filter children recursively
      const filteredChildren = item.children ? item.children.map(filterItem).filter(Boolean) : [];
      
      // Include item if it matches OR has matching children
      if (itemMatches || filteredChildren.length > 0) {
        return {
          ...item,
          children: filteredChildren
        };
      }
      
      return null;
    };
    
    return items.map(filterItem).filter(Boolean);
  };

  // Get filtered menu structure
  const filteredMenuStructure = filterMenuItems(menuStructure || [], searchQuery);

  // Auto-expand sections when searching
  useEffect(() => {
    if (searchQuery.trim()) {
      setExpandedSections({
        client: true,
        project: true,
        deliverable: true
      });
    }
  }, [searchQuery]);

  // Debug logging to see what data we're receiving
  console.log('🔍 LeftNav received props:', {
    menuStructure,
    isLoading,
    hasRefreshFunction: !!refreshFromDatabase,
    menuStructureLength: menuStructure?.length || 0
  });

  // Load available data for modals from menu structure
  useEffect(() => {
    const loadAvailableData = () => {
      try {
        console.log('🔄 Loading available data from menu structure...');
        
        // Extract clients, projects, and users from menu structure
        const clients = [];
        const projects = [];
        const users = [
          { id: 'user1', first_name: 'Sarah', last_name: 'Johnson', name: 'Sarah Johnson' },
          { id: 'user2', first_name: 'Michael', last_name: 'Chen', name: 'Michael Chen' },
          { id: 'user3', first_name: 'Emma', last_name: 'Williams', name: 'Emma Williams' },
          { id: 'user4', first_name: 'David', last_name: 'Brown', name: 'David Brown' },
          { id: 'user5', first_name: 'Lisa', last_name: 'Garcia', name: 'Lisa Garcia' }
        ];
        
        if (menuStructure && menuStructure.length > 0) {
          menuStructure.forEach(item => {
            if (item.type === 'client') {
              clients.push({
                id: item.id,
                name: item.title,
                title: item.title,
                industry: item.metadata?.industry || 'Unknown'
              });
              
              // Extract projects from client
              if (item.children && item.children.length > 0) {
                item.children.forEach(child => {
                  if (child.type === 'project') {
                    projects.push({
                      id: child.id,
                      name: child.title,
                      title: child.title,
                      clientId: item.id,
                      clientName: item.title
                    });
                  }
                });
              }
            }
          });
        }
        
        console.log('📊 Extracted data:', {
          clients: clients.length,
          projects: projects.length,
          users: users.length
        });
        
        console.log('📋 Available projects details:', projects.map(p => ({
          id: p.id,
          name: p.name,
          title: p.title
        })));
        
        setAvailableClients(clients);
        setAvailableUsers(users);
        setAvailableProjects(projects);
      } catch (error) {
        console.error('💥 Error loading available data:', error);
      }
    };

    loadAvailableData();
  }, [menuStructure]);

  // Use the proper API endpoints for adding items - creates both business entity AND menu item
  const addItem = async (itemData, editId = null) => {
    console.log('➕ Adding/updating item:', itemData, editId);
    const itemType = itemData.type || addItemType;
    
    try {
      let businessEntityResult = null;
      
      // Step 1: Create/Update the business entity (client, project, deliverable)
      if (!editId) {
        console.log('🏢 Creating business entity first...');
        let apiEndpoint = '';
        let requestBody = {};
        
        // Map form data to the correct API format based on item type
        switch (itemType) {
          case 'client':
            apiEndpoint = '/api/clients';
            requestBody = {
              name: itemData.title,
              industry: itemData.industry || itemData.metadata?.industry || '',
              location: itemData.location || itemData.metadata?.location || '',
              website: itemData.website || itemData.metadata?.website || '',
              description: itemData.description || '',
              status: itemData.status || 'active',
              priority: itemData.priority || itemData.metadata?.priority || 'medium',
              owner: itemData.owner || itemData.metadata?.owner || null,
              organisation: itemData.organisation || itemData.metadata?.organisation || null,
              company_size: itemData.company_size || itemData.metadata?.company_size || 'medium',
              tags: itemData.tags || itemData.metadata?.tags || [],
              notes: itemData.notes || itemData.metadata?.notes || '',
              // created_by and updated_by will be set by API using defaults
              // created_by: null,
              // updated_by: null
            };
            break;
            
          case 'project':
            apiEndpoint = '/api/projects';
            requestBody = {
              name: itemData.title,
              description: itemData.description || '',
              status: itemData.status || 'Planning', // Use correct enum value
              client: itemData.parentId,
              client_owner: itemData.metadata?.client_owner,
              internal_owner: itemData.metadata?.internal_owner || null,
              organisation: itemData.metadata?.organisation || null,
              start_date: itemData.metadata?.start_date || null,
              end_date: itemData.metadata?.end_date || null,
              budget: itemData.metadata?.budget || { amount: 0, currency: 'USD' },
              priority: itemData.metadata?.priority || 'medium',
              project_type: itemData.metadata?.project_type || 'consulting',
              tags: itemData.metadata?.tags || [],
              notes: itemData.metadata?.notes || '',
              deliverables: itemData.deliverables || itemData.metadata?.deliverables || [],
              // created_by and updated_by will be set by API using defaults
              // created_by: null,
              // updated_by: null
            };
            break;
            
          case 'deliverable':
            apiEndpoint = '/api/deliverables';
            requestBody = {
              name: itemData.title || itemData.name || 'New Deliverable',
              type: itemData.metadata?.type || 'Report', // Use correct enum value (capitalized)
              description: itemData.description || '',
              status: itemData.status || 'draft', // Use correct enum value (lowercase)
              priority: itemData.metadata?.priority || 'medium', // Use correct enum value (lowercase)
              project: itemData.parentId || itemData.metadata?.project,
              assigned_to: itemData.metadata?.assigned_to || [],
              due_date: itemData.metadata?.due_date || null,
              estimated_hours: itemData.metadata?.estimated_hours || 0,
              notes: itemData.metadata?.notes || ''
            };
            break;
            
          default:
            throw new Error(`Unknown item type: ${itemType}`);
        }
        
        console.log('🎯 Creating business entity at:', apiEndpoint);
        console.log('📤 Business entity data:', JSON.stringify(requestBody, null, 2));
        
        const businessResponse = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });
        
        if (!businessResponse.ok) {
          const errorText = await businessResponse.text();
          console.error('❌ Business entity creation failed:', {
            status: businessResponse.status,
            statusText: businessResponse.statusText,
            errorBody: errorText
          });
          let errorMessage = `${itemType} creation failed: ${businessResponse.status} ${businessResponse.statusText}`;
          try {
            const parsedError = JSON.parse(errorText);
            if (parsedError?.error || parsedError?.details) {
              errorMessage += ` – ${parsedError.error || ''} ${parsedError.details || ''}`.trim();
            }
          } catch {
            if (errorText) {
              errorMessage += ` – ${errorText}`;
            }
          }
          throw new Error(errorMessage);
        }
        
        businessEntityResult = await businessResponse.json();
        console.log('✅ Business entity created:', businessEntityResult);
      }
      
      // Step 2: Create/Update the menu item
      console.log('📋 Creating/updating menu item...');
      const menuApiEndpoint = '/api/menu';
      
      // Ensure title is not empty (use same fallback logic as deliverable name)
      const menuTitle = itemData.title || itemData.name || 'New Deliverable';
      const menuStatus = itemData.metadata?.status || mapProjectStatusToMenu(itemData.status) || 'active';
      
      const menuRequestBody = editId ? { ...itemData, id: editId, title: menuTitle, status: menuStatus } : {
        ...itemData,
        title: menuTitle,
        status: menuStatus,
        // If we created a business entity, link it in the metadata
        metadata: {
          ...itemData.metadata,
          ...(businessEntityResult && {
            [`${itemType}_id`]: businessEntityResult.id || businessEntityResult._id,
            business_entity_id: businessEntityResult.id || businessEntityResult._id
          })
        }
      };
      
      console.log('🎯 Creating menu item at:', menuApiEndpoint);
      console.log('📤 Menu item data:', JSON.stringify(menuRequestBody, null, 2));
      
      const menuResponse = await fetch(menuApiEndpoint, {
        method: editId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(menuRequestBody),
      });
      
      if (!menuResponse.ok) {
        const errorText = await menuResponse.text();
        console.error('❌ Menu item creation failed:', {
          status: menuResponse.status,
          statusText: menuResponse.statusText,
          errorBody: errorText
        });
        throw new Error(`Menu item creation failed: ${menuResponse.status} ${menuResponse.statusText}`);
      }
      
      const menuResult = await menuResponse.json();
      console.log('✅ Menu item created:', menuResult);
      
      // Refresh the data
      if (refreshFromDatabase) {
        console.log('🔄 Refreshing from database after adding item...');
        await refreshFromDatabase();
      }
      
      return {
        businessEntity: businessEntityResult,
        menuItem: menuResult
      };
    } catch (error) {
      console.error('💥 Error adding/updating item:', error);
      throw error;
    }
  };

  const updateItem = async (itemId, updates) => {
    console.log('🔄 Updating item:', itemId, updates);
    
    // Guard against boolean IDs
    if (typeof itemId === 'boolean') {
      console.log('🚨 Boolean ID detected, skipping update:', itemId);
      return;
    }
    
    const itemType = updates.type;
    
    try {
      let apiEndpoint = '';
      let requestBody = { id: itemId };
      
      // Map updates to the correct API format based on item type
      switch (itemType) {
        case 'client':
          apiEndpoint = '/api/clients';
          requestBody = {
            ...requestBody,
            name: updates.title,
            industry: updates.metadata?.industry || '',
            location: updates.metadata?.location || '',
            website: updates.metadata?.website || '',
            description: updates.description || '',
            status: updates.status || 'active',
            priority: updates.metadata?.priority || 'medium',
            // updated_by will be set by API using defaults
          };
          break;
          
        case 'project':
          apiEndpoint = '/api/projects';
          requestBody = {
            ...requestBody,
            name: updates.title,
            description: updates.description || '',
            status: updates.status || 'Planning', // Use correct enum value
            client_owner: updates.metadata?.client_owner,
            internal_owner: updates.metadata?.internal_owner,
            priority: updates.metadata?.priority || 'medium',
            // updated_by will be set by API using defaults
          };
          break;
          
        case 'deliverable':
          apiEndpoint = '/api/deliverables';
          requestBody = {
            ...requestBody,
            name: updates.title,
            type: updates.metadata?.type || 'Report', // Use correct enum value (capitalized)
            description: updates.description || '',
            status: updates.status || 'draft', // Use correct enum value (lowercase)
            priority: updates.metadata?.priority || 'medium', // Use correct enum value (lowercase)
            project: updates.metadata?.project,
            due_date: updates.metadata?.due_date
          };
          break;
          
        default:
          throw new Error(`Unknown item type: ${itemType}`);
      }
      
      console.log('🎯 Using API endpoint for update:', apiEndpoint);
      console.log('📤 Update request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(apiEndpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Update API request failed:', {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText
        });
        throw new Error(`${itemType} update failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ Item updated successfully:', result);
      
      return result;
    } catch (error) {
      console.error('💥 Error updating item:', error);
      throw error;
    }
  };

  const removeItem = async (itemId) => {
    console.log('Removing item:', itemId);
  };

  const toggleCollapse = (itemId) => {
    console.log('Toggling collapse for item:', itemId);
    if (toggleItemCollapse) {
      toggleItemCollapse(itemId);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleActionMenu = (section) => {
    setActionMenuOpen(actionMenuOpen === section ? null : section);
  };

  // Unified modal handlers
const resolveBusinessEntityId = (item) => (
  item?.metadata?.business_entity_id ||
  item?.metadata?.client_id ||
  item?.metadata?.project_id ||
  item?.metadata?.deliverable_id ||
  item?._id ||
  item?.id ||
  null
);

const mapProjectStatusToMenu = (status) => {
  switch (status) {
    case 'Planning':
      return 'not-started';
    case 'Active':
      return 'in-progress';
    case 'Completed':
      return 'completed';
    case 'Cancelled':
      return 'cancelled';
    case 'On Hold':
      return 'on-hold';
    case 'In Progress':
      return 'in-progress';
    default:
      return 'active';
  }
};

  const handleAddItem = (itemType, parent = null) => {
    setAddItemType(itemType);
    setParentId(parent);
    setEditingItem(null);
    setShowAddModal(true);
    if (onModalStateChange) {
      onModalStateChange(true);
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setAddItemType(item.type);
    setParentId(item.parentId);
    setShowAddModal(true);
  };

  const handleSaveItem = async (itemData, editId = null) => {
    console.log('💾 LeftNav: Starting save item process...');
    console.log('📝 Item data received:', {
      type: itemData.type || addItemType,
      title: itemData.title,
      editId,
      hasMetadata: !!itemData.metadata,
      metadataKeys: itemData.metadata ? Object.keys(itemData.metadata) : []
    });
    
    try {
      if (editId) {
        // Update existing item
        console.log('✏️ Updating existing item with ID:', editId);
        await updateItem(editId, itemData);
        console.log('✅ Item updated successfully');
      } else {
        // Add new item
        console.log('➕ Adding new item of type:', addItemType);
        console.log('📋 Parent ID for new item:', parentId);
        const newItem = await addItem({
          ...itemData,
          type: addItemType,
          parentId: parentId
        });
        console.log('✅ Item added successfully:', newItem);
      }
      
      // Close modal and refresh data
      setShowAddModal(false);
      setEditingItem(null);
      setAddItemType(null);
      setParentId(null);
      
      if (refreshFromDatabase) {
        console.log('🔄 Refreshing dashboard data...');
        refreshFromDatabase();
      }
    } catch (error) {
      console.error('💥 Error saving item:', error);
      // Re-throw the error so the modal can handle it
      throw error;
    }
  };

  const handleRemoveItem = (itemType, itemId, itemTitle) => {
    console.log('🗑️ LeftNav: Starting remove item process...');
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
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to remove ${type}`);
      }

      console.log('✅ Item removed successfully');

      // Clear selection if the removed item was selected
      if (selectedNavItem && (selectedNavItem.id === id || selectedNavItem._id === id)) {
        setSelectedNavItem(null);
        if (onItemSelect) {
          onItemSelect(null);
        }
      }

      // Refresh data
      if (refreshFromDatabase) {
        console.log('🔄 Refreshing dashboard data...');
        refreshFromDatabase();
      }

    } catch (error) {
      console.error('💥 Error removing item:', error);
      alert(`Failed to remove ${type}: ${error.message}`);
    }
    
    setPendingDelete(null);
  };


  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      // Temporarily disable mobile detection to show sidebar
      setIsMobile(false);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Resize handlers
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleMouseMove = (e) => {
    if (!isResizing) return;
    
    const newWidth = e.clientX;
    if (newWidth >= 200 && newWidth <= 400) {
      setSidebarWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing]);

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionMenuOpen && !event.target.closest('.action-menu-container')) {
        setActionMenuOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [actionMenuOpen]);

  // Mobile view
  if (isMobile) {
    return (
      <div className="lg:hidden">
        <button
          onClick={onToggle}
          className="fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-lg shadow-lg"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    );
  }

  // Main sidebar
  return (
    <div className="flex">
      <div
        data-testid="left-nav"
        ref={sidebarRef}
        className="border-r flex flex-col transition-all duration-300 ease-in-out sidebar-container"
        style={{ 
          width: isCollapsed ? 64 : sidebarWidth,
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-primary)'
        }}
      >
        {/* Header */}
        <div className="p-3 flex items-center justify-between" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
              <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>C</span>
            </div>
            {!isCollapsed && (
              <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Cigno</span>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded transition-all duration-200"
            style={{ 
              color: 'var(--text-secondary)',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--bg-secondary)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            {isCollapsed ? (
              <ChevronRight className="h-3 w-3" style={{ color: 'var(--text-primary)' }} />
            ) : (
              <ChevronLeft className="h-3 w-3" style={{ color: 'var(--text-primary)' }} />
            )}
          </button>
        </div>

        {/* Search Section */}
        {!isCollapsed && (
          <div className="p-3 border-b" style={{ borderColor: 'var(--border-primary)' }}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-8 py-2 text-sm rounded-lg border transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-primary)',
                  color: 'var(--text-primary)'
                }}
                onFocus={(e) => {
                  e.target.style.backgroundColor = 'var(--bg-primary)';
                }}
                onBlur={(e) => {
                  e.target.style.backgroundColor = 'var(--bg-tertiary)';
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2 space-y-3 relative" style={{ backgroundColor: 'var(--bg-primary)' }}>
          {/* CLIENT Section */}
          <div>
            <div className="w-full flex items-center justify-between mb-2 p-1 rounded transition-colors" style={{ backgroundColor: 'var(--bg-secondary)' }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'var(--bg-secondary)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'var(--bg-secondary)';
              }}
            >
              <button
                data-testid="client-collapse-button"
                onClick={() => toggleSection('client')}
                className="flex items-center space-x-2 flex-1 text-left"
              >
                {expandedSections.client ? (
                  <ChevronDown className="h-3 w-3" style={{ color: 'var(--text-secondary)' }} />
                ) : (
                  <ChevronRight className="h-3 w-3" style={{ color: 'var(--text-secondary)' }} />
                )}
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>CLIENT</h3>
              </button>
              <div className="flex items-center space-x-1">
                <button 
                  data-testid="add-client-button"
                  aria-label="Add client"
                  className="p-1 rounded transition-colors"
                  style={{ backgroundColor: 'transparent' }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'var(--bg-secondary)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddItem('client');
                  }}
                >
                  <Plus className="h-3 w-3" style={{ color: 'var(--text-secondary)' }} />
                </button>
                <div className="relative">
                  <button 
                    data-testid="client-action-button"
                    className="p-1 rounded transition-colors"
                    style={{ backgroundColor: 'transparent' }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = 'var(--bg-secondary)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                    }}
                    onClick={() => toggleActionMenu('client')}
                  >
                    <MoreHorizontal className="h-3 w-3" style={{ color: 'var(--text-secondary)' }} />
                  </button>
                  
                  {actionMenuOpen === 'client' && (
                    <div className="action-menu-container absolute right-0 top-full mt-1 w-32 rounded-md shadow-lg z-50 border" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-primary)' }}>
                      <button
                        onClick={() => {
                          toggleActionMenu(null);
                          if (refreshFromDatabase) {
                            refreshFromDatabase();
                          }
                        }}
                        className="block w-full text-left px-4 py-2 text-sm rounded-md transition-colors"
                        style={{ color: 'var(--text-primary)' }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = 'var(--bg-tertiary)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                        }}
                      >
                        Refresh
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {expandedSections.client && (
              <div className="space-y-1">
                {isLoading ? (
                  <div className="text-center py-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 mx-auto" style={{ borderColor: 'var(--text-secondary)' }}></div>
                  </div>
                ) : filteredMenuStructure && filteredMenuStructure.length > 0 ? (
                  filteredMenuStructure
                    .filter(item => item.type === 'client')
                    .map(client => (
                      <div key={client._id || client.id} className="group">
                        <div 
                          className="group flex items-center justify-between p-2 rounded transition-colors hover:bg-opacity-10 cursor-pointer" 
                          style={{ 
                            backgroundColor: selectedNavItem?.id === client._id || selectedNavItem?.id === client.id ? 'var(--bg-tertiary)' : 'var(--bg-secondary)'
                          }}
                          onClick={() => handleItemClick({ ...client, type: 'client' })}
                          onMouseEnter={(e) => {
                            if (selectedNavItem?.id !== client._id && selectedNavItem?.id !== client.id) {
                              e.target.style.backgroundColor = 'var(--bg-tertiary)';
                            }
                            // Set hovered item using unique ID
                            setHoveredItem(`client-${client._id || client.id}`);
                          }}
                          onMouseLeave={(e) => {
                            if (selectedNavItem?.id !== client._id && selectedNavItem?.id !== client.id) {
                              e.target.style.backgroundColor = 'var(--bg-secondary)';
                            }
                            // Clear hovered item
                            setHoveredItem(null);
                          }}
                        >
                          <div className="flex items-center space-x-2 flex-1">
                            {client.children && client.children.length > 0 ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCollapse(client._id || client.id);
                                }}
                                className="p-0.5 rounded transition-colors hover:bg-opacity-20"
                              >
                                {client.isCollapsed ? (
                                  <ChevronRight className="h-3 w-3" style={{ color: 'var(--text-secondary)' }} />
                                ) : (
                                  <ChevronDown className="h-3 w-3" style={{ color: 'var(--text-secondary)' }} />
                                )}
                              </button>
                            ) : (
                              <div className="w-4 h-4" /> 
                            )}
                            <Building2 className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{client.title}</span>
                          </div>
                          <div className={`flex items-center space-x-1 transition-opacity ${hoveredItem === `client-${client._id || client.id}` ? 'opacity-100' : 'opacity-0'}`}>
                            <button
          onClick={() => handleAddItem('project', resolveBusinessEntityId(client))}
                              className="p-1 rounded transition-colors hover:bg-opacity-20"
                              style={{ 
                                backgroundColor: 'transparent',
                                color: 'var(--text-secondary)'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = 'var(--bg-secondary)';
                                e.target.style.color = 'var(--text-primary)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                                e.target.style.color = 'var(--text-secondary)';
                              }}
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                            <div className="relative">
                              <button 
                                className="p-1 rounded transition-colors hover:bg-opacity-20"
                                style={{ 
                                  backgroundColor: 'transparent',
                                  color: 'var(--text-secondary)'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor = 'var(--bg-secondary)';
                                  e.target.style.color = 'var(--text-primary)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = 'transparent';
                                  e.target.style.color = 'var(--text-secondary)';
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleActionMenu(`client-${client._id || client.id}`);
                                }}
                              >
                                <MoreHorizontal className="h-3 w-3" />
                              </button>
                              
                              {actionMenuOpen === `client-${client._id || client.id}` && (
                                <div className="action-menu-container absolute right-0 top-full mt-1 w-32 rounded-md shadow-lg z-50 border" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-primary)' }}>
                                  <button
                                    onClick={() => {
                                      toggleActionMenu(null);
                                      handleEditItem({ ...client, type: 'client' });
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm rounded-md transition-colors"
                                    style={{ color: 'var(--text-primary)' }}
                                    onMouseEnter={(e) => {
                                      e.target.style.backgroundColor = 'var(--bg-tertiary)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.backgroundColor = 'transparent';
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => {
                                      toggleActionMenu(null);
                                      if (refreshFromDatabase) {
                                        refreshFromDatabase();
                                      }
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm rounded-md transition-colors"
                                    style={{ color: 'var(--text-primary)' }}
                                    onMouseEnter={(e) => {
                                      e.target.style.backgroundColor = 'var(--bg-tertiary)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.backgroundColor = 'transparent';
                                    }}
                                  >
                                    Refresh
                                  </button>
                                  <button
                                    onClick={() => {
                                      toggleActionMenu(null);
                                      // Extract business entity ID from metadata for proper deletion 
                                      const businessEntityId = client.metadata?.business_entity_id || 
                                                              client.metadata?.client_id || 
                                                              client._id || 
                                                              client.id;
                                      console.log('🔧 LeftNav: Extracting business entity ID for deletion:', {
                                        menuItemId: client._id || client.id,
                                        businessEntityId: businessEntityId,
                                        metadata: client.metadata
                                      });
                                      handleRemoveItem('client', businessEntityId, client.title);
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm rounded-md transition-colors"
                                    style={{ color: 'var(--text-danger)' }}
                                    onMouseEnter={(e) => {
                                      e.target.style.backgroundColor = 'var(--bg-tertiary)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.backgroundColor = 'transparent';
                                    }}
                                  >
                                    Remove
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* PROJECT Section */}
                        {client.children && client.children.length > 0 && !client.isCollapsed && (
                          <div className="ml-6 mt-2 space-y-1">
                            <div className="w-full flex items-center justify-between mb-1 p-1 rounded transition-colors" style={{ backgroundColor: 'var(--bg-tertiary)' }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = 'var(--bg-secondary)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'var(--bg-tertiary)';
                              }}
                            >
                              <button
                                onClick={() => toggleSection('project')}
                                className="flex items-center space-x-2 flex-1 text-left"
                              >
                                {expandedSections.project ? (
                                  <ChevronDown className="h-2 w-2" style={{ color: 'var(--text-secondary)' }} />
                                ) : (
                                  <ChevronRight className="h-2 w-2" style={{ color: 'var(--text-secondary)' }} />
                                )}
                                <h4 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>PROJECT</h4>
                              </button>
                              <button
                                onClick={() => handleAddItem('project', resolveBusinessEntityId(client))}
                                className="p-1 rounded transition-colors"
                                style={{ backgroundColor: 'var(--bg-tertiary)' }}
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor = 'var(--bg-secondary)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = 'var(--bg-tertiary)';
                                }}
                              >
                                <Plus className="h-2 w-2" style={{ color: 'var(--text-secondary)' }} />
                              </button>
                            </div>

                                            {expandedSections.project && (
                                              <div className="ml-4 space-y-0.5">
                                {client.children
                                  .filter(item => item.type === 'project')
                                  .map(project => (
                                    <div key={project._id || project.id} className="group">
                                      <div 
                                        className="group flex items-center justify-between py-1 px-2 rounded transition-colors hover:bg-opacity-10 cursor-pointer" 
                                        style={{ 
                                          backgroundColor: selectedNavItem?.id === project._id || selectedNavItem?.id === project.id ? 'var(--bg-tertiary)' : 'var(--bg-secondary)'
                                        }}
                                        onClick={() => handleItemClick({ ...project, type: 'project' })}
                                        onMouseEnter={(e) => {
                                          if (selectedNavItem?.id !== project._id && selectedNavItem?.id !== project.id) {
                                            e.target.style.backgroundColor = 'var(--bg-tertiary)';
                                          }
                                          // Set hovered item using unique ID
                                          setHoveredItem(`project-${project._id || project.id}`);
                                        }}
                                        onMouseLeave={(e) => {
                                          if (selectedNavItem?.id !== project._id && selectedNavItem?.id !== project.id) {
                                            e.target.style.backgroundColor = 'var(--bg-secondary)';
                                          }
                                          // Clear hovered item
                                          setHoveredItem(null);
                                        }}
                                      >
                                        <div className="flex items-center space-x-2 flex-1">
                                          {project.children && project.children.length > 0 ? (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                toggleCollapse(project._id || project.id);
                                              }}
                                              className="p-0.5 rounded transition-colors hover:bg-opacity-20"
                                            >
                                              {project.isCollapsed ? (
                                                <ChevronRight className="h-2 w-2" style={{ color: 'var(--text-secondary)' }} />
                                              ) : (
                                                <ChevronDown className="h-2 w-2" style={{ color: 'var(--text-secondary)' }} />
                                              )}
                                            </button>
                                          ) : (
                                            <div className="w-3 h-3" />
                                          )}
                                          <Target className="h-3 w-3" style={{ color: 'var(--text-secondary)' }} />
                                          <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{project.title}</span>
                                        </div>
                                        <div className={`flex items-center space-x-1 transition-opacity ${hoveredItem === `project-${project._id || project.id}` ? 'opacity-100' : 'opacity-0'}`}>
                                          <button
                                            onClick={() => handleAddItem('deliverable', resolveBusinessEntityId(project))}
                                            className="p-1 rounded transition-colors hover:bg-opacity-20"
                                            style={{ 
                                              backgroundColor: 'transparent',
                                              color: 'var(--text-secondary)'
                                            }}
                                            onMouseEnter={(e) => {
                                              e.target.style.backgroundColor = 'var(--bg-secondary)';
                                              e.target.style.color = 'var(--text-primary)';
                                            }}
                                            onMouseLeave={(e) => {
                                              e.target.style.backgroundColor = 'transparent';
                                              e.target.style.color = 'var(--text-secondary)';
                                            }}
                                          >
                                            <Plus className="h-2 w-2" />
                                          </button>
                                          <div className="relative">
                                            <button 
                                              className="p-1 rounded transition-colors hover:bg-opacity-20"
                                              style={{ 
                                                backgroundColor: 'transparent',
                                                color: 'var(--text-secondary)'
                                              }}
                                              onMouseEnter={(e) => {
                                                e.target.style.backgroundColor = 'var(--bg-secondary)';
                                                e.target.style.color = 'var(--text-primary)';
                                              }}
                                              onMouseLeave={(e) => {
                                                e.target.style.backgroundColor = 'transparent';
                                                e.target.style.color = 'var(--text-secondary)';
                                              }}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                toggleActionMenu(`project-${project._id || project.id}`);
                                              }}
                                            >
                                              <MoreHorizontal className="h-2 w-2" />
                                            </button>
                                            
                                            {actionMenuOpen === `project-${project._id || project.id}` && (
                                              <div className="action-menu-container absolute right-0 top-full mt-1 w-32 rounded-md shadow-lg z-50 border" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-primary)' }}>
                                                <button
                                                  onClick={() => {
                                                    toggleActionMenu(null);
                                                    handleEditItem({ ...project, type: 'project' });
                                                  }}
                                                  className="block w-full text-left px-4 py-2 text-sm rounded-md transition-colors"
                                                  style={{ color: 'var(--text-primary)' }}
                                                  onMouseEnter={(e) => {
                                                    e.target.style.backgroundColor = 'var(--bg-tertiary)';
                                                  }}
                                                  onMouseLeave={(e) => {
                                                    e.target.style.backgroundColor = 'transparent';
                                                  }}
                                                >
                                                  Edit
                                                </button>
                                                <button
                                                  onClick={() => {
                                                    toggleActionMenu(null);
                                                    if (refreshFromDatabase) {
                                                      refreshFromDatabase();
                                                    }
                                                  }}
                                                  className="block w-full text-left px-4 py-2 text-sm rounded-md transition-colors"
                                                  style={{ color: 'var(--text-primary)' }}
                                                  onMouseEnter={(e) => {
                                                    e.target.style.backgroundColor = 'var(--bg-tertiary)';
                                                  }}
                                                  onMouseLeave={(e) => {
                                                    e.target.style.backgroundColor = 'transparent';
                                                  }}
                                                >
                                                  Refresh
                                                </button>
                                                <button
                                                  onClick={() => {
                                                    toggleActionMenu(null);
                                                    // Extract business entity ID from metadata for proper deletion
                                                    const businessEntityId = project.metadata?.business_entity_id || 
                                                                            project.metadata?.project_id || 
                                                                            project._id || 
                                                                            project.id;
                                                    console.log('🔧 LeftNav: Extracting business entity ID for project deletion:', {
                                                      menuItemId: project._id || project.id,
                                                      businessEntityId: businessEntityId,
                                                      metadata: project.metadata
                                                    });
                                                    handleRemoveItem('project', businessEntityId, project.title);
                                                  }}
                                                  className="block w-full text-left px-4 py-2 text-sm rounded-md transition-colors"
                                                  style={{ color: 'var(--text-danger)' }}
                                                  onMouseEnter={(e) => {
                                                    e.target.style.backgroundColor = 'var(--bg-tertiary)';
                                                  }}
                                                  onMouseLeave={(e) => {
                                                    e.target.style.backgroundColor = 'transparent';
                                                  }}
                                                >
                                                  Remove
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      {/* DELIVERABLE Section */}
                                      {project.children && project.children.length > 0 && !project.isCollapsed && (
                                        <div className="ml-4 mt-1 space-y-1">
                                          <div className="w-full flex items-center justify-between mb-1 p-1 rounded transition-colors" style={{ backgroundColor: 'var(--bg-tertiary)' }}
                                            onMouseEnter={(e) => {
                                              e.target.style.backgroundColor = 'var(--bg-secondary)';
                                            }}
                                            onMouseLeave={(e) => {
                                              e.target.style.backgroundColor = 'var(--bg-tertiary)';
                                            }}
                                          >
                                            <button
                                              onClick={() => toggleSection('deliverable')}
                                              className="flex items-center space-x-2 flex-1 text-left"
                                            >
                                              {expandedSections.deliverable ? (
                                                <ChevronDown className="h-2 w-2" style={{ color: 'var(--text-secondary)' }} />
                                              ) : (
                                                <ChevronRight className="h-2 w-2" style={{ color: 'var(--text-secondary)' }} />
                                              )}
                                              <h5 className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>DELIVERABLE</h5>
                                            </button>
                                            <button
                                              onClick={() => handleAddItem('deliverable', resolveBusinessEntityId(project))}
                                              className="p-1 rounded transition-colors"
                                              style={{ backgroundColor: 'var(--bg-tertiary)' }}
                                              onMouseEnter={(e) => {
                                                e.target.style.backgroundColor = 'var(--bg-secondary)';
                                              }}
                                              onMouseLeave={(e) => {
                                                e.target.style.backgroundColor = 'var(--bg-tertiary)';
                                              }}
                                            >
                                              <Plus className="h-2 w-2" style={{ color: 'var(--text-secondary)' }} />
                                            </button>
                                          </div>

                                          {expandedSections.deliverable && (
                                            <div className="ml-6 space-y-1 mt-1">
                                              {project.children
                                                .filter(item => item.type === 'deliverable')
                                                .map(deliverable => (
                                                  <div key={deliverable._id || deliverable.id} className="group">
                                                    <div 
                                                      className="flex items-start justify-between py-1.5 px-2 rounded transition-colors hover:bg-opacity-10 cursor-pointer"
                                                      style={{ 
                                                        backgroundColor: selectedNavItem?.id === deliverable._id || selectedNavItem?.id === deliverable.id ? 'var(--bg-tertiary)' : 'transparent',
                                                        border: selectedNavItem?.id === deliverable._id || selectedNavItem?.id === deliverable.id ? '1px solid var(--border-primary)' : '1px solid transparent'
                                                      }}
                                                      onClick={() => handleItemClick({ ...deliverable, type: 'deliverable' })}
                                                      onMouseEnter={(e) => {
                                                        if (selectedNavItem?.id !== deliverable._id && selectedNavItem?.id !== deliverable.id) {
                                                          e.target.style.backgroundColor = 'var(--bg-tertiary)';
                                                        }
                                                        // Set hovered item using unique ID
                                                        setHoveredItem(`deliverable-${deliverable._id || deliverable.id}`);
                                                      }}
                                                      onMouseLeave={(e) => {
                                                        if (selectedNavItem?.id !== deliverable._id && selectedNavItem?.id !== deliverable.id) {
                                                          e.target.style.backgroundColor = 'var(--bg-secondary)';
                                                        }
                                                        // Clear hovered item
                                                        setHoveredItem(null);
                                                      }}
                                                    >
                                                      <div className="flex flex-col space-y-0.5 flex-1">
                                                        <span className="text-xs font-normal" style={{ color: 'var(--text-primary)' }}>{deliverable.title}</span>
                                                        <div className="flex items-center space-x-1">
                                                          <div 
                                                            className="w-2 h-2 rounded-full"
                                                            style={{ backgroundColor: getStatusInfo(deliverable.status).color }}
                                                          />
                                                          <span 
                                                            className="text-xs font-normal"
                                                            style={{ color: getStatusInfo(deliverable.status).color }}
                                                          >
                                                            {getStatusInfo(deliverable.status).label}
                                                          </span>
                                                        </div>
                                                      </div>
                                                      <div className={`flex items-center space-x-1 transition-opacity ${hoveredItem === `deliverable-${deliverable._id || deliverable.id}` ? 'opacity-100' : 'opacity-0'}`}>
                                                        <div className="relative">
                                                          <button 
                                                            className="p-1 rounded transition-colors hover:bg-opacity-20"
                                                            style={{ 
                                                              backgroundColor: 'transparent',
                                                              color: 'var(--text-secondary)'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                              e.target.style.backgroundColor = 'var(--bg-secondary)';
                                                              e.target.style.color = 'var(--text-primary)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                              e.target.style.backgroundColor = 'transparent';
                                                              e.target.style.color = 'var(--text-secondary)';
                                                            }}
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              toggleActionMenu(`deliverable-${deliverable._id || deliverable.id}`);
                                                            }}
                                                          >
                                                            <MoreHorizontal className="h-2 w-2" />
                                                          </button>
                                                          
                                                          {actionMenuOpen === `deliverable-${deliverable._id || deliverable.id}` && (
                                                            <div className="action-menu-container absolute right-0 top-full mt-1 w-32 rounded-md shadow-lg z-50 border" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-primary)' }}>
                                                              <button
                                                                onClick={() => {
                                                                  toggleActionMenu(null);
                                                                  handleEditItem({ ...deliverable, type: 'deliverable' });
                                                                }}
                                                                className="block w-full text-left px-4 py-2 text-sm rounded-md transition-colors"
                                                                style={{ color: 'var(--text-primary)' }}
                                                                onMouseEnter={(e) => {
                                                                  e.target.style.backgroundColor = 'var(--bg-tertiary)';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                  e.target.style.backgroundColor = 'transparent';
                                                                }}
                                                              >
                                                                Edit
                                                              </button>
                                                              <button
                                                                onClick={() => {
                                                                  toggleActionMenu(null);
                                                                  if (refreshFromDatabase) {
                                                                    refreshFromDatabase();
                                                                  }
                                                                }}
                                                                className="block w-full text-left px-4 py-2 text-sm rounded-md transition-colors"
                                                                style={{ color: 'var(--text-primary)' }}
                                                                onMouseEnter={(e) => {
                                                                  e.target.style.backgroundColor = 'var(--bg-tertiary)';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                  e.target.style.backgroundColor = 'transparent';
                                                                }}
                                                              >
                                                                Refresh
                                                              </button>
                                                              <button
                                                                onClick={() => {
                                                                  toggleActionMenu(null);
                                                                  // Extract business entity ID from metadata for proper deletion
                                                                  const businessEntityId = deliverable.metadata?.deliverableId || 
                                                                                          deliverable.metadata?.business_entity_id || 
                                                                                          deliverable.metadata?.deliverable_id || 
                                                                                          deliverable._id || 
                                                                                          deliverable.id;
                                                                  console.log('🔧 LeftNav: Extracting business entity ID for deliverable deletion:', {
                                                                    menuItemId: deliverable._id || deliverable.id,
                                                                    businessEntityId: businessEntityId,
                                                                    metadata: deliverable.metadata
                                                                  });
                                                                  handleRemoveItem('deliverable', businessEntityId, deliverable.title);
                                                                }}
                                                                className="block w-full text-left px-4 py-2 text-sm rounded-md transition-colors"
                                                                style={{ color: 'var(--text-danger)' }}
                                                                onMouseEnter={(e) => {
                                                                  e.target.style.backgroundColor = 'var(--bg-tertiary)';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                  e.target.style.backgroundColor = 'transparent';
                                                                }}
                                                              >
                                                                Remove
                                                              </button>
                                                            </div>
                                                          )}
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                ))}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                ) : searchQuery.trim() ? (
                  <div className="text-center py-4">
                    <div className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                      No results found for "{searchQuery}"
                    </div>
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="text-xs px-2 py-1 rounded transition-colors"
                      style={{ 
                        color: 'var(--text-primary)',
                        backgroundColor: 'var(--bg-tertiary)'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = 'var(--bg-secondary)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'var(--bg-tertiary)';
                      }}
                    >
                      Clear search
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      No clients yet
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Click + to add your first client
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Resize Handle */}
        {!isCollapsed && (
          <div
            data-testid="resize-handle"
            className="absolute right-0 top-0 w-px h-full cursor-col-resize transition-all duration-200 resize-handle-container"
            style={{ 
              backgroundColor: 'var(--border-primary)',
              zIndex: 9999,
              right: '-1px',
              pointerEvents: 'auto'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--border-secondary)';
              e.target.style.width = '4px';
              e.target.style.right = '-2px';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'var(--border-primary)';
              e.target.style.width = '1px';
              e.target.style.right = '-1px';
            }}
            onMouseDown={handleMouseDown}
          >
            <div className="w-px h-8 mx-auto rounded-full transition-all duration-200" style={{ backgroundColor: 'var(--border-secondary)' }} />
          </div>
        )}

        {/* User Profile */}
        <div className="p-3 border-t" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-primary)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>SJ</span>
              </div>
              {!isCollapsed && (
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>Sarah Johnson</p>
                </div>
              )}
            </div>
            {!isCollapsed && <ThemeToggle />}
          </div>
        </div>
      </div>

      {/* Unified Add/Edit Modal */}
      <UnifiedAddModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setAddItemType(null);
          setEditingItem(null);
          setParentId(null);
          if (onModalStateChange) {
            onModalStateChange(false);
          }
        }}
        itemType={addItemType}
        onAdd={handleSaveItem}
        editItem={editingItem}
        parentId={parentId}
        availableClients={availableClients}
        availableUsers={availableUsers}
        availableProjects={availableProjects}
      />

      {/* Custom Confirmation Modal */}
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
