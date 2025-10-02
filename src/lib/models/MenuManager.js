import { MenuItem } from './MenuItem.js';

/**
 * MenuManager Class - Manages the overall menu structure
 * Handles CRUD operations for the entire menu hierarchy
 */
export class MenuManager {
  constructor() {
    this.rootItems = [];
    this.selectedItemId = null;
    this.expandedItems = new Set();
  }

  /**
   * Initialize the default menu structure
   */
  initializeDefaultMenu() {
    // Create empty root sections
    const clientSection = MenuItem.createSection('CLIENT', 'users');
    const projectSection = MenuItem.createSection('PROJECT', 'folder');
    const deliverableSection = MenuItem.createSection('DELIVERABLE', 'file-text');

    // Set root items with no default children
    this.rootItems = [clientSection, projectSection, deliverableSection];
    
    // Expand all sections by default
    this.rootItems.forEach(item => {
      this.expandedItems.add(item.id);
    });

    return this.rootItems;
  }

  /**
   * Get all root items
   */
  getRootItems() {
    return this.rootItems;
  }

  /**
   * Get all items (including nested)
   */
  getAllItems() {
    let allItems = [];
    
    this.rootItems.forEach(item => {
      allItems.push(item);
      if (item.hasChildren()) {
        allItems = allItems.concat(item.getAllChildren());
      }
    });
    
    return allItems;
  }

  /**
   * Find item by ID
   */
  findItemById(itemId) {
    for (const rootItem of this.rootItems) {
      if (rootItem.id === itemId) {
        return rootItem;
      }
      
      const found = rootItem.findChild(itemId);
      if (found) return found;
    }
    
    return null;
  }

  /**
   * Find parent of an item
   */
  findParent(itemId) {
    for (const rootItem of this.rootItems) {
      if (rootItem.id === itemId) {
        return null; // Root item has no parent
      }
      
      const found = rootItem.findChild(itemId);
      if (found) {
        // Find which child this is
        for (const child of rootItem.children) {
          if (child.id === itemId) {
            return rootItem;
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Add a new root item
   */
  addRootItem(itemData) {
    console.log('🏗️ MenuManager: Creating root item:', {
      type: itemData.type,
      title: itemData.title,
      hasMetadata: !!itemData.metadata,
      metadataKeys: itemData.metadata ? Object.keys(itemData.metadata) : []
    });
    
    let newItem;
    
    try {
      switch (itemData.type) {
        case 'client':
          console.log('🏢 Creating client item...');
          newItem = MenuItem.createClient(itemData.title, itemData.description);
          break;
        case 'project':
          console.log('📁 Creating project item...');
          newItem = MenuItem.createProject(itemData.title, itemData.description);
          break;
        case 'deliverable':
          console.log('📋 Creating deliverable item...');
          newItem = MenuItem.createDeliverable(itemData.title, itemData.description, itemData.status);
          break;
        default:
          console.log('🔧 Creating generic item...');
          newItem = MenuItem.createItem(itemData.title, itemData.description, itemData.type);
      }

      // Set order if provided
      if (itemData.order !== undefined) {
        newItem.order = itemData.order;
        console.log('📊 Order set to:', itemData.order);
      }

      // Set status if provided
      if (itemData.status) {
        newItem.status = itemData.status;
        console.log('📈 Status set to:', itemData.status);
      }

      // Set assignedClient if provided (for projects)
      if (itemData.assignedClient) {
        newItem.assignedClient = itemData.assignedClient;
        console.log('🔗 Assigned to client:', itemData.assignedClient);
      }

      // Set metadata if provided
      if (itemData.metadata) {
        newItem.metadata = { ...newItem.metadata, ...itemData.metadata };
        console.log('📋 Metadata merged:', newItem.metadata);
      }

      // Add to root items
      this.rootItems.push(newItem);
      console.log('📌 Item added to root items array');
      
      // Sort by order
      this.rootItems.sort((a, b) => a.order - b.order);
      console.log('🔄 Root items sorted by order');
      
      console.log('✅ Root item created successfully:', {
        id: newItem.id,
        title: newItem.title,
        type: newItem.type,
        totalRootItems: this.rootItems.length
      });
      
      return newItem;
      
    } catch (error) {
      console.error('💥 MenuManager: Error creating root item:', error);
      throw error;
    }
  }

  /**
   * Add a new item to a parent
   */
  addItem(parentId, itemData) {
    console.log('🏗️ MenuManager: Adding child item:', {
      parentId,
      type: itemData.type,
      title: itemData.title,
      hasMetadata: !!itemData.metadata
    });
    
    const parent = this.findItemById(parentId);
    if (!parent) {
      console.error('❌ Parent item not found:', parentId);
      throw new Error(`Parent item with ID ${parentId} not found`);
    }

    console.log('✅ Parent found:', {
      id: parent.id,
      title: parent.title,
      type: parent.type
    });

    if (!parent.canAdd()) {
      console.error('❌ Parent cannot have children:', parent.title);
      throw new Error(`Cannot add items to ${parent.title}`);
    }

    console.log('✅ Parent can have children, proceeding...');

    let newItem;
    
    try {
      switch (itemData.type) {
        case 'client':
          console.log('🏢 Creating client item...');
          newItem = MenuItem.createClient(itemData.title, itemData.description);
          break;
        case 'project':
          console.log('📁 Creating project item...');
          newItem = MenuItem.createProject(itemData.title, itemData.description);
          break;
        case 'deliverable':
          console.log('📋 Creating deliverable item...');
          newItem = MenuItem.createDeliverable(itemData.title, itemData.description, itemData.status);
          break;
        default:
          console.log('🔧 Creating generic item...');
          newItem = MenuItem.createItem(itemData.title, itemData.description, itemData.type);
      }

      // Set order if provided
      if (itemData.order !== undefined) {
        newItem.order = itemData.order;
        console.log('📊 Order set to:', itemData.order);
      }

      // Set assignedClient if provided (for projects)
      if (itemData.assignedClient) {
        newItem.assignedClient = itemData.assignedClient;
        console.log('🔗 Assigned to client:', itemData.assignedClient);
      }

      console.log('✅ Child item created, adding to parent...');

      // Add to parent
      parent.addChild(newItem);
      console.log('📌 Item added to parent successfully');
      
      // Expand parent if it was collapsed
      if (parent.isCollapsed) {
        console.log('🔓 Expanding collapsed parent...');
        this.expandItem(parent.id);
      }

      console.log('✅ Child item added successfully:', {
        id: newItem.id,
        title: newItem.title,
        type: newItem.type,
        parentId: parent.id,
        parentTitle: parent.title
      });

      return newItem;
      
    } catch (error) {
      console.error('💥 MenuManager: Error creating child item:', error);
      throw error;
    }
  }

  /**
   * Remove an item
   */
  removeItem(itemId) {
    const parent = this.findParent(itemId);
    if (!parent) {
      // Root item
      const index = this.rootItems.findIndex(item => item.id === itemId);
      if (index !== -1) {
        const removedItem = this.rootItems.splice(index, 1)[0];
        this.expandedItems.delete(itemId);
        return removedItem;
      }
    } else {
      // Child item
      return parent.removeChild(itemId);
    }
    
    return null;
  }

  /**
   * Update an item
   */
  updateItem(itemId, updates) {
    const item = this.findItemById(itemId);
    if (!item) {
      throw new Error(`Item with ID ${itemId} not found`);
    }

    item.update(updates);
    return item;
  }

  /**
   * Move an item to a new parent
   */
  moveItem(itemId, newParentId) {
    const item = this.findItemById(itemId);
    const newParent = this.findItemById(newParentId);
    
    if (!item) {
      throw new Error(`Item with ID ${itemId} not found`);
    }
    
    if (!newParent) {
      throw new Error(`New parent with ID ${newParentId} not found`);
    }

    if (!newParent.canAdd()) {
      throw new Error(`Cannot add items to ${newParent.title}`);
    }

    // Remove from current parent
    const currentParent = this.findParent(itemId);
    if (currentParent) {
      currentParent.removeChild(itemId);
    } else {
      // Root item
      const index = this.rootItems.findIndex(rootItem => rootItem.id === itemId);
      if (index !== -1) {
        this.rootItems.splice(index, 1);
      }
    }

    // Add to new parent
    newParent.addChild(item);
    
    // Expand new parent if it was collapsed
    if (newParent.isCollapsed) {
      this.expandItem(newParent.id);
    }

    return item;
  }

  /**
   * Toggle collapse state of an item
   */
  toggleCollapse(itemId) {
    const item = this.findItemById(itemId);
    if (!item || !item.canCollapse()) {
      return false;
    }

    if (item.isCollapsed) {
      this.expandItem(itemId);
    } else {
      this.collapseItem(itemId);
    }

    return item.isCollapsed;
  }

  /**
   * Expand an item
   */
  expandItem(itemId) {
    const item = this.findItemById(itemId);
    if (item && item.canCollapse()) {
      item.expand();
      this.expandedItems.add(itemId);
      return true;
    }
    return false;
  }

  /**
   * Collapse an item
   */
  collapseItem(itemId) {
    const item = this.findItemById(itemId);
    if (item && item.canCollapse()) {
      item.collapse();
      this.expandedItems.delete(itemId);
      return true;
    }
    return false;
  }

  /**
   * Check if item is expanded
   */
  isExpanded(itemId) {
    return this.expandedItems.has(itemId);
  }

  /**
   * Set selected item
   */
  setSelectedItem(itemId) {
    this.selectedItemId = itemId;
  }

  /**
   * Get selected item
   */
  getSelectedItem() {
    return this.selectedItemId ? this.findItemById(this.selectedItemId) : null;
  }

  /**
   * Search items by title or description
   */
  searchItems(query) {
    if (!query || query.trim() === '') {
      return this.getAllItems();
    }

    const searchTerm = query.toLowerCase().trim();
    const results = [];

    this.rootItems.forEach(item => {
      if (this._matchesSearch(item, searchTerm)) {
        results.push(item);
      }
      
      if (item.hasChildren()) {
        item.children.forEach(child => {
          if (this._matchesSearch(child, searchTerm)) {
            results.push(child);
          }
        });
      }
    });

    return results;
  }

  /**
   * Check if item matches search query
   */
  _matchesSearch(item, searchTerm) {
    return item.title.toLowerCase().includes(searchTerm) ||
           item.description.toLowerCase().includes(searchTerm) ||
           item.type.toLowerCase().includes(searchTerm);
  }

  /**
   * Get menu structure for rendering
   */
  getMenuStructure() {
    return this.rootItems.map(item => ({
      ...item.toJSON(),
      isExpanded: this.isExpanded(item.id),
      isSelected: item.id === this.selectedItemId,
      children: item.children.map(child => ({
        ...child.toJSON(),
        isSelected: child.id === this.selectedItemId
      }))
    }));
  }

  /**
   * Export menu to JSON
   */
  exportToJSON() {
    return {
      rootItems: this.rootItems.map(item => item.toJSON()),
      selectedItemId: this.selectedItemId,
      expandedItems: Array.from(this.expandedItems)
    };
  }

  /**
   * Import menu from JSON
   */
  importFromJSON(data) {
    if (data.rootItems) {
      this.rootItems = data.rootItems.map(item => MenuItem.fromJSON(item));
    }
    
    if (data.selectedItemId) {
      this.selectedItemId = data.selectedItemId;
    }
    
    if (data.expandedItems) {
      this.expandedItems = new Set(data.expandedItems);
    }
    
    return this.rootItems;
  }

  /**
   * Clear all items
   */
  clear() {
    this.rootItems = [];
    this.selectedItemId = null;
    this.expandedItems.clear();
  }

  /**
   * Get statistics about the menu
   */
  getStats() {
    const allItems = this.getAllItems();
    
    return {
      totalItems: allItems.length,
      rootSections: this.rootItems.length,
      expandedItems: this.expandedItems.size,
      selectedItem: this.selectedItemId,
      byType: {
        section: allItems.filter(item => item.type === 'section').length,
        client: allItems.filter(item => item.type === 'client').length,
        project: allItems.filter(item => item.type === 'project').length,
        deliverable: allItems.filter(item => item.type === 'deliverable').length,
        item: allItems.filter(item => item.type === 'item').length
      }
    };
  }
}

export default MenuManager;
