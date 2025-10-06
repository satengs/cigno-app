const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cigno-app');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Update menu item permissions
async function updateMenuPermissions() {
  try {
    await connectDB();
    
    const db = mongoose.connection.db;
    const menuItemsCollection = db.collection('menu_items');
    
    console.log('🔄 Updating menu item permissions...');
    
    // Update all menu items to have correct permissions
    const result = await menuItemsCollection.updateMany(
      {},
      {
        $set: {
          'permissions.canView': true,
          'permissions.canAdd': true,
          'permissions.canEdit': true,
          'permissions.canRemove': true,
          'permissions.canCollapse': true
        }
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} menu items with correct permissions`);
    
    // Verify the update
    const updatedItems = await menuItemsCollection.find({}).project({ title: 1, type: 1, permissions: 1 }).toArray();
    console.log('📋 Updated items:');
    updatedItems.forEach(item => {
      console.log(`  - ${item.title} (${item.type}): canRemove=${item.permissions.canRemove}`);
    });
    
  } catch (error) {
    console.error('❌ Error updating permissions:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the update
updateMenuPermissions();
