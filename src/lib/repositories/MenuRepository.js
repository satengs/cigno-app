import MenuItem from '../models/MenuItem.js';

class MenuRepository {
  async findAll(options = {}) {
    const menuItems = await MenuItem.findAll(options);
    return menuItems.map(item => item.toObject());
  }

  async findById(id) {
    const menuItem = await MenuItem.findById(id);
    return menuItem ? menuItem.toObject() : null;
  }

  async findByOwner(ownerId, options = {}) {
    const menuItems = await MenuItem.findByOwner(ownerId, options);
    return menuItems.map(item => item.toObject());
  }

  async findByTeam(teamId, options = {}) {
    const menuItems = await MenuItem.findByTeam(teamId, options);
    return menuItems.map(item => item.toObject());
  }

  async findByViewId(viewId, options = {}) {
    const menuItems = await MenuItem.findAll({ ...options, viewId });
    return menuItems.map(item => item.toObject());
  }

  async create(menuData) {
    const menuItem = new MenuItem(menuData);
    await menuItem.save();
    return menuItem.toObject();
  }

  async updateById(id, updateData) {
    const menuItem = await MenuItem.findById(id);
    if (!menuItem) {
      throw new Error(`MenuItem with id ${id} not found`);
    }
    
    await menuItem.update(updateData);
    return menuItem.toObject();
  }

  async delete(id) {
    const menuItem = await MenuItem.findById(id);
    if (!menuItem) {
      throw new Error(`MenuItem with id ${id} not found`);
    }
    
    await menuItem.delete();
    return menuItem.toObject();
  }

  async reorder(ids) {
    const updates = ids.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { order: index }
      }
    }));

    const result = await MenuItem.bulkWrite(updates);
    return result;
  }

  async findByPermissions(userId, permission = 'read') {
    const menuItems = await MenuItem.findAll();
    const filteredItems = menuItems.filter(item => {
      switch (permission) {
        case 'read':
          return item.hasReadPermission(userId);
        case 'write':
          return item.hasWritePermission(userId);
        case 'admin':
          return item.hasAdminPermission(userId);
        default:
          return item.hasReadPermission(userId);
      }
    });
    
    return filteredItems.map(item => item.toObject());
  }

  async countByOwner(ownerId) {
    return await MenuItem.countDocuments({ owner: ownerId, isActive: true });
  }

  async countByTeam(teamId) {
    return await MenuItem.countDocuments({ teamId, isActive: true });
  }

  async exists(id) {
    return await MenuItem.exists({ _id: id, isActive: true });
  }

  async findActive() {
    return await this.findAll({ isActive: true });
  }

  async findInactive() {
    const menuItems = await MenuItem.findAll({ isActive: false });
    return menuItems.map(item => item.toObject());
  }
}

export default MenuRepository;
