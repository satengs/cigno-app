import MenuRepository from '../repositories/MenuRepository.js';

// Simple validation functions
const validateCreateMenuItem = (item) => {
  const errors = [];
  
  if (!item.title || typeof item.title !== 'string' || item.title.trim().length === 0) {
    errors.push('Title is required');
  } else if (item.title.length > 100) {
    errors.push('Title cannot exceed 100 characters');
  }
  
  if (item.icon && (typeof item.icon !== 'string' || item.icon.length > 50)) {
    errors.push('Icon cannot exceed 50 characters');
  }
  
  if (item.order !== undefined && (!Number.isInteger(item.order) || item.order < 0)) {
    errors.push('Order must be a non-negative integer');
  }
  
  if (!item.owner || typeof item.owner !== 'string') {
    errors.push('Owner is required');
  }
  
  if (errors.length > 0) {
    const error = new Error('Validation failed');
    error.name = 'ValidationError';
    error.details = errors.map(msg => ({ message: msg }));
    throw error;
  }
  
  return item;
};

const validateUpdateMenuItem = (patch) => {
  const errors = [];
  
  if (patch.title !== undefined) {
    if (typeof patch.title !== 'string' || patch.title.trim().length === 0) {
      errors.push('Title cannot be empty');
    } else if (patch.title.length > 100) {
      errors.push('Title cannot exceed 100 characters');
    }
  }
  
  if (patch.icon !== undefined && (typeof patch.icon !== 'string' || patch.icon.length > 50)) {
    errors.push('Icon cannot exceed 50 characters');
  }
  
  if (patch.order !== undefined && (!Number.isInteger(patch.order) || patch.order < 0)) {
    errors.push('Order must be a non-negative integer');
  }
  
  if (errors.length > 0) {
    const error = new Error('Validation failed');
    error.name = 'ValidationError';
    error.details = errors.map(msg => ({ message: msg }));
    throw error;
  }
  
  return patch;
};

class MenuService {
  constructor() {
    this.menuRepository = new MenuRepository();
  }

  /**
   * List menu items for a specific owner
   * @param {string} owner - Owner ID
   * @returns {Promise<Array>} Array of menu items
   */
  async list(owner) {
    if (!owner) {
      throw new Error('Owner ID is required');
    }

    return await this.menuRepository.findByOwner(owner, { 
      sort: { order: 1 } 
    });
  }

  /**
   * Create a new menu item
   * @param {Object} item - Menu item data
   * @returns {Promise<Object>} Created menu item
   */
  async create(item) {
    // Validate input data
    const validatedItem = validateCreateMenuItem(item);

    // Set default order if not provided
    if (validatedItem.order === undefined) {
      const existingItems = await this.menuRepository.findByOwner(validatedItem.owner);
      validatedItem.order = existingItems.length;
    }

    // Set default permissions if not provided
    if (!validatedItem.permissions) {
      validatedItem.permissions = {
        read: [],
        write: [],
        admin: []
      };
    }

    // Set default active status
    if (validatedItem.isActive === undefined) {
      validatedItem.isActive = true;
    }

    return await this.menuRepository.create(validatedItem);
  }

  /**
   * Update a menu item by ID
   * @param {string} id - Menu item ID
   * @param {Object} patch - Update data
   * @returns {Promise<Object>} Updated menu item
   */
  async update(id, patch) {
    if (!id) {
      throw new Error('Menu item ID is required');
    }

    // Validate update data
    const validatedPatch = validateUpdateMenuItem(patch);

    // Validate that the menu item exists
    const existingItem = await this.menuRepository.findById(id);
    if (!existingItem) {
      throw new Error(`MenuItem with id ${id} not found`);
    }

    return await this.menuRepository.updateById(id, validatedPatch);
  }

  /**
   * Remove a menu item by ID (soft delete)
   * @param {string} id - Menu item ID
   * @returns {Promise<Object>} Deleted menu item
   */
  async remove(id) {
    if (!id) {
      throw new Error('Menu item ID is required');
    }

    // Validate that the menu item exists
    const existingItem = await this.menuRepository.findById(id);
    if (!existingItem) {
      throw new Error(`MenuItem with id ${id} not found`);
    }

    return await this.menuRepository.delete(id);
  }

  // Additional utility methods for backward compatibility
  async getMenuItems(options = {}) {
    return await this.menuRepository.findAll(options);
  }

  async getMenuItemById(id) {
    return await this.menuRepository.findById(id);
  }

  async getMenuItemsByOwner(ownerId, options = {}) {
    return await this.menuRepository.findByOwner(ownerId, options);
  }

  async getMenuItemsByTeam(teamId, options = {}) {
    return await this.menuRepository.findByTeam(teamId, options);
  }

  async getMenuItemsByViewId(viewId, options = {}) {
    return await this.menuRepository.findByViewId(viewId, options);
  }

  async reorderMenuItems(ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('Ids array is required and must not be empty');
    }

    return await this.menuRepository.reorder(ids);
  }

  async getMenuItemsByPermissions(userId, permission = 'read') {
    return await this.menuRepository.findByPermissions(userId, permission);
  }

  async getMenuItemsCount(ownerId) {
    return await this.menuRepository.countByOwner(ownerId);
  }

  async getTeamMenuItemsCount(teamId) {
    return await this.menuRepository.countByTeam(teamId);
  }

  async menuItemExists(id) {
    return await this.menuRepository.exists(id);
  }

  async getActiveMenuItems() {
    return await this.menuRepository.findActive();
  }

  async getInactiveMenuItems() {
    return await this.menuRepository.findInactive();
  }

  // Business logic methods
  async duplicateMenuItem(id, newOwner, newTeamId = null) {
    const originalItem = await this.menuRepository.findById(id);
    if (!originalItem) {
      throw new Error(`MenuItem with id ${id} not found`);
    }

    const duplicateData = {
      title: `${originalItem.title} (Copy)`,
      icon: originalItem.icon,
      viewId: originalItem.viewId,
      owner: newOwner,
      teamId: newTeamId || originalItem.teamId,
      permissions: {
        read: [newOwner],
        write: [newOwner],
        admin: [newOwner]
      }
    };

    return await this.create(duplicateData);
  }

  async moveMenuItemToTeam(id, newTeamId) {
    return await this.update(id, { teamId: newTeamId });
  }

  async updateMenuItemPermissions(id, permissions) {
    return await this.update(id, { permissions });
  }
}

export default MenuService;
