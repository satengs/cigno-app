/**
 * MenuItem Class - Handles hierarchical menu structure with full CRUD operations
 * Supports collapsible sections, add/remove functionality, and permissions
 */
export class MenuItem {
  constructor({
    id,
    title,
    description = '',
    icon = null,
    type = 'item', // 'item', 'section', 'client', 'project', 'deliverable'
    status = null, // 'active', 'not-started', 'completed', 'in-progress'
    permissions = {},
    parentId = null,
    order = 0,
    isCollapsed = false,
    isCollapsible = true, // Whether this item can have children
    children = [],
    metadata = {},
    // Deliverable-specific properties
    brief = '',
    dueDate = null,
    priority = 'medium', // 'low', 'medium', 'high', 'urgent'
    teamMembers = [],
    insights = [],
    materials = [],
    storyline = null
  }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.icon = icon;
    this.type = type;
    this.status = status;
    this.permissions = {
      canView: true,
      canAdd: false,
      canEdit: false,
      canRemove: false,
      canCollapse: false,
      ...permissions
    };
    this.parentId = parentId;
    this.order = order;
    this.isCollapsed = isCollapsed;
    this.isCollapsible = isCollapsible;
    this.children = children;
    this.metadata = metadata;
    
    // Project-specific properties
    this.assignedClient = null; // For projects: reference to client ID
    
    // Deliverable-specific properties
    this.brief = brief;
    this.dueDate = dueDate;
    this.priority = priority;
    this.teamMembers = teamMembers;
    this.insights = insights;
    this.materials = materials;
    this.storyline = storyline;
    
    // Auto-set permissions based on type
    this._setDefaultPermissions();
  }

  /**
   * Set default permissions based on menu item type
   */
  _setDefaultPermissions() {
    switch (this.type) {
      case 'section':
        this.permissions.canCollapse = this.isCollapsible;
        this.permissions.canAdd = true;
        this.permissions.canEdit = true;
        this.permissions.canRemove = false; // Sections can't be removed
        break;
      case 'client':
        this.permissions.canCollapse = this.isCollapsible; // Can have projects
        this.permissions.canAdd = true;
        this.permissions.canEdit = true;
        this.permissions.canRemove = true;
        break;
      case 'project':
        this.permissions.canCollapse = this.isCollapsible; // Can have deliverables
        this.permissions.canAdd = true;
        this.permissions.canEdit = true;
        this.permissions.canRemove = true;
        break;
      case 'deliverable':
        this.permissions.canCollapse = false; // Deliverables cannot have children
        this.permissions.canAdd = false; // Cannot add children to deliverables
        this.permissions.canEdit = true;
        this.permissions.canRemove = true;
        break;
      case 'item':
      default:
        this.permissions.canCollapse = this.isCollapsible;
        this.permissions.canAdd = false;
        this.permissions.canEdit = true;
        this.permissions.canRemove = true;
        break;
    }
  }

  /**
   * Check if item has children
   */
  hasChildren() {
    return this.children && this.children.length > 0;
  }

  /**
   * Check if item is collapsible (has children and can collapse)
   */
  isCollapsible() {
    return this.hasChildren() && this.permissions.canCollapse;
  }

  /**
   * Check if item can be collapsed/expanded
   */
  canCollapse() {
    return this.isCollapsible();
  }

  /**
   * Check if item can add children
   */
  canAdd() {
    return this.permissions.canAdd;
  }

  /**
   * Check if item can be removed
   */
  canRemove() {
    return this.permissions.canRemove;
  }

  /**
   * Check if item can be edited
   */
  canEdit() {
    return this.permissions.canEdit;
  }

  /**
   * Check if item can be viewed
   */
  canView() {
    return this.permissions.canView;
  }

  /**
   * Check if this item can have children (based on type and isCollapsible property)
   */
  canHaveChildren() {
    return this.isCollapsible && this.permissions.canAdd;
  }

  /**
   * Assign project to a client
   */
  assignToClient(clientId) {
    if (this.type !== 'project') {
      throw new Error('Only projects can be assigned to clients');
    }
    this.assignedClient = clientId;
  }

  /**
   * Get the client this project is assigned to
   */
  getAssignedClient() {
    return this.assignedClient;
  }

  /**
   * Check if project is assigned to a client
   */
  isAssignedToClient() {
    return this.type === 'project' && this.assignedClient !== null;
  }

  /**
   * Add a child item
   */
  addChild(childItem) {
    if (!this.canHaveChildren()) {
      throw new Error(`Cannot add children to ${this.title}`);
    }

    // No need to set hasChildren property since it's a method

    // Set parent reference
    childItem.parentId = this.id;
    
    // Add to children array
    this.children.push(childItem);
    
    // Sort children by order
    this.children.sort((a, b) => a.order - b.order);
    
    return childItem;
  }

  /**
   * Remove a child item
   */
  removeChild(childId) {
    if (!this.canRemove()) {
      throw new Error(`Cannot remove children from ${this.title}`);
    }

    const index = this.children.findIndex(child => child.id === childId);
    if (index !== -1) {
      const removedChild = this.children.splice(index, 1)[0];
      
      // No need to update hasChildren since it's a method
      
      return removedChild;
    }
    
    return null;
  }

  /**
   * Toggle collapse state
   */
  toggleCollapse() {
    if (!this.canCollapse()) {
      return false;
    }
    
    this.isCollapsed = !this.isCollapsed;
    return this.isCollapsed;
  }

  /**
   * Expand the item
   */
  expand() {
    if (this.canCollapse() && this.isCollapsed) {
      this.isCollapsed = false;
      return true;
    }
    return false;
  }

  /**
   * Collapse the item
   */
  collapse() {
    if (this.canCollapse() && !this.isCollapsed) {
      this.isCollapsed = true;
      return true;
    }
    return false;
  }

  /**
   * Get all children (including nested)
   */
  getAllChildren() {
    let allChildren = [...this.children];
    
    this.children.forEach(child => {
      if (child.hasChildren()) {
        allChildren = allChildren.concat(child.getAllChildren());
      }
    });
    
    return allChildren;
  }

  /**
   * Find a child by ID (including nested)
   */
  findChild(childId) {
    for (const child of this.children) {
      if (child.id === childId) {
        return child;
      }
      if (child.hasChildren()) {
        const found = child.findChild(childId);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * Check if this item has children
   */
  hasChildren() {
    return this.children && this.children.length > 0;
  }

  /**
   * Get the depth level of this item
   */
  getDepth() {
    if (!this.parentId) return 0;
    return 1; // For now, assuming only 2 levels
  }

  /**
   * Check if item is a root section
   */
  isRootSection() {
    return this.type === 'section' && !this.parentId;
  }

  /**
   * Check if item is a leaf item (no children)
   */
  isLeaf() {
    return !this.hasChildren();
  }

  /**
   * Get status display text
   */
  getStatusText() {
    if (!this.status) return '';
    
    switch (this.status) {
      case 'active':
        return '• Active';
      case 'not-started':
        return '• Not Started';
      case 'completed':
        return '• Completed';
      case 'in-progress':
        return '• In Progress';
      default:
        return `• ${this.status}`;
    }
  }

  /**
   * Get status color class
   */
  getStatusColor() {
    if (!this.status) return 'text-gray-400';
    
    switch (this.status) {
      case 'active':
        return 'text-green-500';
      case 'not-started':
        return 'text-gray-400';
      case 'completed':
        return 'text-blue-500';
      case 'in-progress':
        return 'text-yellow-500';
      default:
        return 'text-gray-400';
    }
  }

  /**
   * Update item properties
   */
  update(updates) {
    Object.keys(updates).forEach(key => {
      if (key !== 'id' && key !== 'children' && this.hasOwnProperty(key)) {
        this[key] = updates[key];
      }
    });
    
    // Re-set permissions if type changed
    if (updates.type) {
      this._setDefaultPermissions();
    }
  }

  /**
   * Convert to plain object for storage/API
   */
  toJSON() {
    return {
              id: this.id,
        title: this.title,
        description: this.description,
        icon: this.icon,
        type: this.type,
        status: this.status,
        permissions: this.permissions,
        parentId: this.parentId,
        order: this.order,
        isCollapsed: this.isCollapsed,
        hasChildren: this.hasChildren(),
        assignedClient: this.assignedClient, // Include client assignment
        children: this.children.map(child => child.toJSON()),
        metadata: this.metadata
    };
  }

  /**
   * Create from plain object
   */
  static fromJSON(data) {
    const item = new MenuItem({
      ...data,
      children: data.children ? data.children.map(child => MenuItem.fromJSON(child)) : []
    });
    return item;
  }

  /**
   * Create a new section (CLIENT, PROJECT, DELIVERABLE)
   */
  static createSection(title, icon = null) {
    return new MenuItem({
      id: `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      type: 'section',
      icon,
      permissions: {
        canView: true,
        canAdd: true,
        canEdit: true,
        canRemove: false,
        canCollapse: true
      }
    });
  }

  /**
   * Create a new client
   */
  static createClient(title, description = '') {
    console.log('🏢 MenuItem: Creating client:', { title, description });
    
    const client = new MenuItem({
      id: `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      description,
      type: 'client',
      permissions: {
        canView: true,
        canAdd: true,
        canEdit: true,
        canRemove: true,
        canCollapse: true
      }
    });
    
    console.log('✅ Client created successfully:', {
      id: client.id,
      title: client.title,
      type: client.type,
      permissions: client.permissions
    });
    
    return client;
  }

  /**
   * Create a new project
   */
  static createProject(title, description = '') {
    console.log('📁 MenuItem: Creating project:', { title, description });
    
    const project = new MenuItem({
      id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      description,
      type: 'project',
      permissions: {
        canView: true,
        canAdd: true,
        canEdit: true,
        canRemove: true,
        canCollapse: true
      }
    });
    
    console.log('✅ Project created successfully:', {
      id: project.id,
      title: project.title,
      type: project.type,
      permissions: project.permissions
    });
    
    return project;
  }

  /**
   * Create a new deliverable
   */
  static createDeliverable(title, description = '', status = 'not-started', priority = 'medium', dueDate = null) {
    console.log('📋 MenuItem: Creating deliverable:', { title, description, status, priority, dueDate });
    
    const deliverable = new MenuItem({
      id: `deliverable_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      description,
      type: 'deliverable',
      status,
      priority,
      dueDate,
      permissions: {
        canView: true,
        canAdd: true,
        canEdit: true,
        canRemove: true,
        canCollapse: false
      }
    });
    
    console.log('✅ Deliverable created successfully:', {
      id: deliverable.id,
      title: deliverable.title,
      type: deliverable.type,
      status: deliverable.status,
      priority: deliverable.priority,
      permissions: deliverable.permissions
    });
    
    return deliverable;
  }

  /**
   * Deliverable-specific methods
   */
  
  /**
   * Update deliverable brief
   */
  updateBrief(newBrief) {
    if (this.type === 'deliverable') {
      this.brief = newBrief;
      return true;
    }
    return false;
  }

  /**
   * Set deliverable priority
   */
  setPriority(priority) {
    if (this.type === 'deliverable' && ['low', 'medium', 'high', 'urgent'].includes(priority)) {
      this.priority = priority;
      return true;
    }
    return false;
  }

  /**
   * Set deliverable due date
   */
  setDueDate(dueDate) {
    if (this.type === 'deliverable') {
      this.dueDate = dueDate;
      return true;
    }
    return false;
  }

  /**
   * Add team member to deliverable
   */
  addTeamMember(member) {
    if (this.type === 'deliverable') {
      if (!this.teamMembers.find(m => m.id === member.id)) {
        this.teamMembers.push(member);
        return true;
      }
    }
    return false;
  }

  /**
   * Remove team member from deliverable
   */
  removeTeamMember(memberId) {
    if (this.type === 'deliverable') {
      const index = this.teamMembers.findIndex(m => m.id === memberId);
      if (index !== -1) {
        this.teamMembers.splice(index, 1);
        return true;
      }
    }
    return false;
  }

  /**
   * Get deliverable status summary
   */
  getStatusSummary() {
    if (this.type === 'deliverable') {
      return {
        title: this.title,
        status: this.status,
        priority: this.priority,
        dueDate: this.dueDate,
        teamMembers: this.teamMembers.length,
        hasBrief: !!this.brief,
        hasStoryline: !!this.storyline,
        insightsCount: this.insights.length,
        materialsCount: this.materials.length
      };
    }
    return null;
  }

  /**
   * Create a new menu item
   */
  static createItem(title, description = '', type = 'item') {
    return new MenuItem({
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      description,
      type,
      permissions: {
        canView: true,
        canAdd: false,
        canEdit: true,
        canRemove: true,
        canCollapse: false
      }
    });
  }
}

export default MenuItem;
