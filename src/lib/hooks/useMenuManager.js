import { useState, useEffect, useCallback, useMemo } from 'react';
import { MenuManager } from '../models/MenuManager';

// Helper function to map project status to valid menu status
const mapProjectStatusToMenuStatus = (projectStatus) => {
  const statusMap = {
    'Planning': 'not-started',
    'Active': 'in-progress',
    'In Progress': 'in-progress',
    'Completed': 'completed',
    'Cancelled': 'cancelled',
    'On Hold': 'on-hold'
  };
  
  return statusMap[projectStatus] || 'active';
};

export function useMenuManager() {
  const [menuManager] = useState(() => new MenuManager());
  const [menuStructure, setMenuStructure] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Initialize menu structure
  useEffect(() => {
    console.log('Initializing menu...');
    
    const initializeMenu = async () => {
      try {
        // First, try to fetch existing data from database
        console.log('🔍 Fetching existing menu data from database...');
        const response = await fetch('/api/menu');
        
        if (response.ok) {
          const existingData = await response.json();
          console.log('📥 Existing data found:', existingData);
          
          if (existingData && existingData.rootItems && existingData.rootItems.length > 0) {
            // Use existing data from database
            console.log('✅ Using existing data from database');
            setMenuStructure(existingData.rootItems);
            setIsLoading(false);
            return;
          }
        }
        
        // If no existing data, create default menu structure
        console.log('📝 No existing data found, creating default menu structure...');
        const defaultMenu = menuManager.initializeDefaultMenu();
        console.log('Default menu created:', defaultMenu);
        
        // Set the menu structure
        setMenuStructure(defaultMenu);
        console.log('Menu structure set');
        
        // Set loading to false
        setIsLoading(false);
        console.log('Loading state set to false');
        console.log('Menu initialization complete');
      } catch (error) {
        console.error('Error in menu initialization:', error);
        // Even if there's an error, set loading to false
        setIsLoading(false);
      }
    };
    
    initializeMenu();
  }, [menuManager]);

  // Note: Individual items are now saved via API calls in addItem, updateItem, etc.
  // No need to save entire menu structure anymore

  // CRUD Operations - defined at top level
  const addItem = useCallback(async (itemData) => {
    console.log('➕ Adding new item:', {
      type: itemData.type,
      title: itemData.title,
      parentId: itemData.parentId,
      hasMetadata: !!itemData.metadata,
      metadataKeys: itemData.metadata ? Object.keys(itemData.metadata) : []
    });
    
    // Transform data based on item type
    let transformedData = { ...itemData };
    
    console.log('🔧 useMenuManager: Original itemData:', {
      type: itemData.type,
      title: itemData.title,
      name: itemData.name,
      status: itemData.status
    });
    
    if (itemData.type === 'project') {
      console.log('🔄 useMenuManager: Transforming project data...');
      // Transform project data for menu item creation
      transformedData = {
        ...itemData,
        title: itemData.title || itemData.name || 'Untitled Project',
        description: itemData.description || '',
        status: mapProjectStatusToMenuStatus(itemData.status),
        metadata: {
          ...itemData.metadata,
          project_id: itemData.id || itemData._id,
          budget_amount: itemData.budget_amount,
          start_date: itemData.start_date,
          end_date: itemData.end_date,
          client_owner: itemData.client_owner,
          internal_owner: itemData.internal_owner
        }
      };
      
      console.log('✅ useMenuManager: Transformed data:', {
        type: transformedData.type,
        title: transformedData.title,
        status: transformedData.status
      });
    }
    
    try {
      // First, save the item to the database via API
      console.log('🌐 Saving item to database via API...');
      const response = await fetch('/api/menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transformedData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API request failed:', {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText
        });
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log('✅ Item saved to database successfully:', responseData);
      
      // Now add the item to the local menu manager for immediate UI update
      let newItem;
      if (!itemData.parentId) {
        console.log('🌳 Adding as root item (no parent)');
        newItem = menuManager.addRootItem(itemData);
      } else {
        console.log('👶 Adding as child item to parent:', itemData.parentId);
        newItem = menuManager.addItem(itemData.parentId, itemData);
      }
      
      // Refresh from database to get the latest data
      console.log('🔄 Refreshing from database after adding item...');
      try {
        await refreshFromDatabase();
        console.log('✅ Database refresh completed successfully');
      } catch (refreshError) {
        console.error('❌ Error refreshing from database:', refreshError);
        // Continue anyway, the item was saved
      }
      
      console.log('✅ Item added successfully:', {
        id: newItem.id,
        title: newItem.title,
        type: newItem.type,
        parentId: newItem.parentId
      });
      
      return newItem;
      
    } catch (error) {
      console.error('💥 Error adding item:', error);
      console.error('🔍 Error details:', {
        message: error.message,
        stack: error.stack,
        itemData: JSON.stringify(itemData, null, 2)
      });
      throw error;
    }
  }, [menuManager]);

  // Add a refresh function to fetch latest data from database
  const refreshFromDatabase = useCallback(async () => {
    console.log('🔄 Refreshing menu data from database...');
    try {
      const response = await fetch('/api/menu');
      
      if (response.ok) {
        const existingData = await response.json();
        console.log('📥 Refreshed data from database:', existingData);
        
        if (existingData && existingData.rootItems && existingData.rootItems.length > 0) {
          // Update the menu structure with fresh data from database
          setMenuStructure(existingData.rootItems);
          console.log('✅ Menu structure refreshed from database');
        }
      }
    } catch (error) {
      console.error('💥 Error refreshing from database:', error);
    }
  }, []);

  const removeItem = useCallback(async (itemId) => {
    try {
      console.log('🗑️ Removing item:', itemId);
      
      // First, find the item to determine its type
      const item = menuManager.findItemById(itemId);
      if (!item) {
        throw new Error(`Item with ID ${itemId} not found in menu`);
      }
      
      console.log('📋 Item to remove:', { 
        id: itemId, 
        type: item.type, 
        title: item.title,
        fullItem: item
      });
      
      // Determine the correct API endpoint based on item type
      let apiEndpoint;
      let requestOptions;
      let businessEntityId = itemId; // Default to menu item ID
      
      // For business entities (client, project, deliverable), get the actual business entity ID
      if (['client', 'project', 'deliverable'].includes(item.type)) {
        console.log('🔍 DEBUGGING: Item metadata before extraction:', {
          metadata: item.metadata,
          hasMetadata: !!item.metadata,
          metadataKeys: item.metadata ? Object.keys(item.metadata) : 'no metadata'
        });
        
        // Try to get the business entity ID from metadata
        businessEntityId = item.metadata?.business_entity_id || 
                          item.metadata?.client_id || 
                          item.metadata?.project_id || 
                          item.metadata?.deliverable_id ||
                          itemId;
        
        console.log('🔗 Business entity mapping:', {
          menuItemId: itemId,
          businessEntityId: businessEntityId,
          type: item.type,
          changed: businessEntityId !== itemId,
          metadata: item.metadata
        });
      }
      
      switch (item.type) {
        case 'client':
          apiEndpoint = `/api/clients?id=${businessEntityId}`;
          requestOptions = { method: 'DELETE' };
          break;
        case 'project':
          apiEndpoint = `/api/projects?id=${businessEntityId}`;
          requestOptions = { method: 'DELETE' };
          break;
        case 'deliverable':
          apiEndpoint = `/api/deliverables?id=${businessEntityId}`;
          requestOptions = { method: 'DELETE' };
          break;
        default:
          // For other types or menu items, use the menu API
          apiEndpoint = '/api/menu';
          requestOptions = {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: itemId })
          };
          break;
      }
      
      console.log('🔗 API call:', { endpoint: apiEndpoint, method: requestOptions.method });
      
      // Remove the item from the database via appropriate API
      const response = await fetch(apiEndpoint, requestOptions);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API delete failed:', {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText,
          endpoint: apiEndpoint
        });
        throw new Error(`Failed to remove ${item.type}: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log('✅ Item removed from database successfully:', responseData);
      
      // For business entities, also remove the menu item after successful deletion
      if (['client', 'project', 'deliverable'].includes(item.type) && businessEntityId !== itemId) {
        console.log('🗑️ Also cleaning up menu item:', itemId);
        try {
          const menuDeleteResponse = await fetch('/api/menu', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: itemId })
          });
          
          if (menuDeleteResponse.ok) {
            console.log('✅ Menu item cleanup successful');
          } else {
            console.log('⚠️ Menu item cleanup failed, but business entity was deleted');
          }
        } catch (error) {
          console.log('⚠️ Menu item cleanup error:', error.message);
        }
      }
      
      // Remove the item from the local menu manager for immediate UI update
      menuManager.removeItem(itemId);
      setMenuStructure(menuManager.getRootItems());
      if (selectedItemId === itemId) {
        setSelectedItemId(null);
      }
      
      console.log('✅ Item removed locally successfully');
      
    } catch (error) {
      console.error('💥 Error removing item:', error);
      throw error;
    }
  }, [menuManager, selectedItemId]);

  const updateItem = useCallback(async (itemId, updates) => {
    try {
      console.log('✏️ Updating item:', itemId, updates);
      
      // First, update the item in the database via API
      const response = await fetch('/api/menu', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: itemId, ...updates }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API update failed:', {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText
        });
        throw new Error(`API update failed: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log('✅ Item updated in database successfully:', responseData);
      
      // Now update the local menu manager for immediate UI update
      menuManager.updateItem(itemId, updates);
      setMenuStructure(menuManager.getRootItems());
      
      console.log('✅ Item updated locally successfully');
      
    } catch (error) {
      console.error('💥 Error updating item:', error);
      throw error;
    }
  }, [menuManager]);

  const moveItem = useCallback((itemId, newParentId, newOrder) => {
    menuManager.moveItem(itemId, newParentId, newOrder);
    setMenuStructure(menuManager.getRootItems());
  }, [menuManager]);

  // Collapse/Expand Operations
  const toggleCollapse = useCallback(async (itemId) => {
    console.log('Toggling collapse for item:', itemId);
    
    try {
      // Find the current item state in menuStructure
      const findItemInStructure = (items, id) => {
        for (const item of items) {
          if (item.id === id || item._id === id) {
            return item;
          }
          if (item.children && item.children.length > 0) {
            const found = findItemInStructure(item.children, id);
            if (found) return found;
          }
        }
        return null;
      };
      
      const currentItem = findItemInStructure(menuStructure, itemId);
      if (!currentItem) {
        console.error('Item not found in menu structure:', itemId);
        return;
      }
      
      // Toggle the collapsed state
      const newCollapsedState = !currentItem.isCollapsed;
      console.log('Toggling collapsed state from', currentItem.isCollapsed, 'to', newCollapsedState);
      
      // Update the database
      const response = await fetch('/api/menu', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: itemId, 
          isCollapsed: newCollapsedState 
        }),
      });
      
      if (!response.ok) {
        console.error('Failed to update collapse state in database');
        return;
      }
      
      console.log('Successfully updated collapse state in database');
      
      // Refresh the menu structure from database
      await refreshFromDatabase();
      
    } catch (error) {
      console.error('Error toggling collapse state:', error);
    }
  }, [menuStructure, refreshFromDatabase]);

  const expandItem = useCallback((itemId) => {
    menuManager.expandItem(itemId);
    setMenuStructure(menuManager.getRootItems());
  }, [menuManager]);

  const collapseItem = useCallback((itemId) => {
    menuManager.collapseItem(itemId);
    setMenuStructure(menuManager.getRootItems());
  }, [menuManager]);

  // Selection Operations
  const selectItem = useCallback((itemId) => {
    menuManager.selectItem(itemId);
    setSelectedItemId(itemId);
  }, [menuManager]);

  // Search Operations
  const searchItems = useCallback((query) => {
    const results = menuManager.searchItems(query);
    setSearchResults(results);
    setSearchQuery(query);
  }, [menuManager]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  // Factory Methods
  const createClient = useCallback((data) => {
    return menuManager.createClient(data);
  }, [menuManager]);

  const createProject = useCallback((data) => {
    return menuManager.createProject(data);
  }, [menuManager]);

  const createDeliverable = useCallback((data) => {
    return menuManager.createDeliverable(data);
  }, [menuManager]);

  const createItem = useCallback((data) => {
    return menuManager.createItem(data);
  }, [menuManager]);



  // Utility Methods
  const getItem = useCallback((itemId) => {
    return menuManager.getItem(itemId);
  }, [menuManager]);

  const getParent = useCallback((itemId) => {
    return menuManager.getParent(itemId);
  }, [menuManager]);

  const getChildren = useCallback((itemId) => {
    return menuManager.getChildren(itemId);
  }, [menuManager]);

  // Export/Import
  const exportMenu = useCallback(() => {
    return menuManager.exportToJSON();
  }, [menuManager]);

  const importMenu = useCallback((jsonData) => {
    menuManager.importFromJSON(jsonData);
    setMenuStructure(menuManager.getRootItems());
  }, [menuManager]);

  return {
    // State
    menuStructure,
    isLoading,
    selectedItemId,
    searchQuery,
    searchResults,
    
    // Actions
    addItem,
    removeItem,
    updateItem,
    moveItem,
    toggleCollapse,
    expandItem,
    collapseItem,
    selectItem,
    searchItems,
    clearSearch,
    createClient,
    createProject,
    createDeliverable,
    createItem,
    getItem,
    getParent,
    getChildren,
    exportMenu,
    importMenu,
    refreshFromDatabase,
    
    // Direct access to manager for advanced operations
    menuManager
  };
}
