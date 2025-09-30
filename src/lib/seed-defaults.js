/**
 * Seed Defaults Utility
 * Populates the database with default views, widgets, and menu items
 * 
 * Usage:
 *   node src/lib/seed-defaults.js
 *   node src/lib/seed-defaults.js --check
 *   node src/lib/seed-defaults.js --force
 */

import { VIEW_TEMPLATES, DEFAULT_MENU_ITEMS } from '../config/defaults.js';
import ViewService from './services/ViewService.js';
import MenuService from './services/MenuService.js';
import '../lib/db/mongoose.js'; // Initialize database connection

const viewService = new ViewService();
const menuService = new MenuService();

// Default owner ID for seeding
const DEFAULT_OWNER = '507f1f77bcf86cd799439011';

/**
 * Check if default data already exists
 */
async function checkSeedStatus() {
  try {
    console.log('🔍 Checking seed status...');

    // Check views
    const views = await viewService.getViews();
    const hasHomeView = views.some(view => 
      view.title === 'Home Dashboard' || view.title.includes('Dashboard')
    );
    const hasAnalyticsView = views.some(view => 
      view.title === 'Analytics Dashboard' || view.title.includes('Analytics')
    );
    const hasSettingsView = views.some(view => 
      view.title === 'Settings & Configuration' || view.title.includes('Settings')
    );

    // Check menu items
    const menuItems = await menuService.list(DEFAULT_OWNER);
    const hasHomeMenuItem = menuItems.some(item => item.title === 'Home');
    const hasAnalyticsMenuItem = menuItems.some(item => item.title === 'Analytics');
    const hasSettingsMenuItem = menuItems.some(item => item.title === 'Settings');

    const status = {
      views: {
        home: hasHomeView,
        analytics: hasAnalyticsView,
        settings: hasSettingsView,
        total: views.length
      },
      menuItems: {
        home: hasHomeMenuItem,
        analytics: hasAnalyticsMenuItem,
        settings: hasSettingsMenuItem,
        total: menuItems.length
      },
      isSeeded: hasHomeView && hasAnalyticsView && hasSettingsView && 
                hasHomeMenuItem && hasAnalyticsMenuItem && hasSettingsMenuItem
    };

    console.log('📊 Seed Status:');
    console.log(`  Views: ${status.views.total} total`);
    console.log(`    Home: ${status.views.home ? '✅' : '❌'}`);
    console.log(`    Analytics: ${status.views.analytics ? '✅' : '❌'}`);
    console.log(`    Settings: ${status.views.settings ? '✅' : '❌'}`);
    
    console.log(`  Menu Items: ${status.menuItems.total} total`);
    console.log(`    Home: ${status.menuItems.home ? '✅' : '❌'}`);
    console.log(`    Analytics: ${status.menuItems.analytics ? '✅' : '❌'}`);
    console.log(`    Settings: ${status.menuItems.settings ? '✅' : '❌'}`);
    
    console.log(`\n  Overall Status: ${status.isSeeded ? '✅ Fully Seeded' : '❌ Needs Seeding'}`);

    return status;

  } catch (error) {
    console.error('❌ Failed to check seed status:', error.message);
    throw error;
  }
}

/**
 * Seed default data
 */
async function seedDefaultData(force = false) {
  try {
    // Check current status first
    const currentStatus = await checkSeedStatus();
    
    if (currentStatus.isSeeded && !force) {
      console.log('\n🌱 Database is already seeded. Use --force to re-seed.');
      return currentStatus;
    }

    console.log('\n🌱 Starting data seeding...');

    const results = {
      views: [],
      menuItems: [],
      errors: []
    };

    // Get existing views to check for duplicates
    const existingViews = await viewService.getViews();
    
    // Create or update default views from templates
    console.log('\n📊 Processing views...');
    for (const [templateKey, template] of Object.entries(VIEW_TEMPLATES)) {
      try {
        // Check if a view with this title already exists
        const existingView = existingViews.find(view => 
          view.title === template.title || 
          (templateKey === 'home' && view.title.includes('Dashboard')) ||
          (templateKey === 'analytics' && view.title.includes('Analytics')) ||
          (templateKey === 'settings' && view.title.includes('Settings'))
        );

        if (existingView && !force) {
          // Update existing view with new layout if needed
          console.log(`  🔄 Updating existing view: ${template.title}`);
          
          // Generate unique IDs for widgets
          const layoutWithUniqueIds = template.layout.map(widget => ({
            ...widget,
            id: `${widget.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          }));

          const updatedView = await viewService.updateView(existingView._id, {
            description: template.description,
            layout: layoutWithUniqueIds,
            layoutVersion: (existingView.layoutVersion || 1) + 1
          });

          results.views.push({
            template: templateKey,
            view: updatedView,
            action: 'updated'
          });

          console.log(`  ✅ Updated view: ${template.title}`);
        } else {
          // Create new view
          console.log(`  ➕ Creating new view: ${template.title}`);
          
          // Generate unique IDs for widgets
          const layoutWithUniqueIds = template.layout.map(widget => ({
            ...widget,
            id: `${widget.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          }));

          const viewData = {
            title: template.title,
            description: template.description,
            owner: DEFAULT_OWNER,
            layout: layoutWithUniqueIds
          };

          const createdView = await viewService.create(viewData);
          results.views.push({
            template: templateKey,
            view: createdView,
            action: 'created'
          });

          console.log(`  ✅ Created view: ${template.title}`);
        }
      } catch (error) {
        console.error(`  ❌ Failed to process view ${template.title}:`, error.message);
        results.errors.push({
          type: 'view',
          template: templateKey,
          error: error.message
        });
      }
    }

    // Create default menu items
    console.log('\n🍽️ Creating menu items...');
    for (const menuItem of DEFAULT_MENU_ITEMS) {
      try {
        // Find the corresponding view for menu items
        let viewId = null;
        if (menuItem.title === 'Home') {
          const homeView = results.views.find(v => v.template === 'home');
          viewId = homeView?.view._id;
        } else if (menuItem.title === 'Analytics') {
          const analyticsView = results.views.find(v => v.template === 'analytics');
          viewId = analyticsView?.view._id;
        } else if (menuItem.title === 'Settings') {
          const settingsView = results.views.find(v => v.template === 'settings');
          viewId = settingsView?.view._id;
        }

        const menuData = {
          title: menuItem.title,
          icon: menuItem.icon,
          viewId: viewId,
          order: menuItem.order,
          owner: DEFAULT_OWNER,
          teamId: 'default',
          permissions: menuItem.permissions
        };

        const createdMenuItem = await menuService.create(menuData);
        results.menuItems.push({
          title: menuItem.title,
          menuItem: createdMenuItem
        });

        console.log(`  ✅ Created menu item: ${menuItem.title}`);
      } catch (error) {
        console.error(`  ❌ Failed to create menu item ${menuItem.title}:`, error.message);
        results.errors.push({
          type: 'menuItem',
          title: menuItem.title,
          error: error.message
        });
      }
    }

    console.log('\n🎉 Data seeding completed!');
    console.log(`  Views processed: ${results.views.length}`);
    console.log(`  Views created: ${results.views.filter(v => v.action === 'created').length}`);
    console.log(`  Views updated: ${results.views.filter(v => v.action === 'updated').length}`);
    console.log(`  Menu items created: ${results.menuItems.length}`);
    
    if (results.errors.length > 0) {
      console.log(`  Errors encountered: ${results.errors.length}`);
      console.log('\n⚠️ Errors:');
      results.errors.forEach(error => {
        console.log(`    ${error.type}: ${error.template || error.title} - ${error.error}`);
      });
    }

    // Verify final status
    console.log('\n🔍 Verifying final status...');
    await checkSeedStatus();

    return results;

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    throw error;
  }
}

/**
 * Clear all seeded data
 */
async function clearSeededData() {
  try {
    console.log('🗑️ Clearing seeded data...');

    // Get all views and menu items
    const views = await viewService.getAllViews();
    const menuItems = await menuService.list(DEFAULT_OWNER);

    // Clear views
    let viewsCleared = 0;
    for (const view of views) {
      try {
        await viewService.remove(view._id);
        viewsCleared++;
        console.log(`  ✅ Cleared view: ${view.title}`);
      } catch (error) {
        console.error(`  ❌ Failed to clear view ${view.title}:`, error.message);
      }
    }

    // Clear menu items
    let menuItemsCleared = 0;
    for (const menuItem of menuItems) {
      try {
        await menuService.remove(menuItem._id);
        menuItemsCleared++;
        console.log(`  ✅ Cleared menu item: ${menuItem.title}`);
      } catch (error) {
        console.error(`  ❌ Failed to clear menu item ${menuItem.title}:`, error.message);
      }
    }

    console.log(`\n🗑️ Data clearing completed!`);
    console.log(`  Views cleared: ${viewsCleared}`);
    console.log(`  Menu items cleared: ${menuItemsCleared}`);

  } catch (error) {
    console.error('❌ Failed to clear data:', error.message);
    throw error;
  }
}

/**
 * Clean up duplicate views
 */
async function cleanupDuplicateViews() {
  try {
    console.log('🧹 Cleaning up duplicate views...');
    
    const views = await viewService.getViews();
    const viewGroups = {};
    let duplicatesRemoved = 0;

    // Group views by title pattern
    for (const view of views) {
      let key = '';
      if (view.title.includes('Dashboard') || view.title === 'Home Dashboard') {
        key = 'home';
      } else if (view.title.includes('Analytics')) {
        key = 'analytics';
      } else if (view.title.includes('Settings')) {
        key = 'settings';
      } else {
        key = view.title; // Use title as key for other views
      }

      if (!viewGroups[key]) {
        viewGroups[key] = [];
      }
      viewGroups[key].push(view);
    }

    // Remove duplicates, keeping the most recent one
    for (const [key, groupViews] of Object.entries(viewGroups)) {
      if (groupViews.length > 1) {
        console.log(`  🔍 Found ${groupViews.length} views for "${key}"`);
        
        // Sort by creation date, keep the most recent
        groupViews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const keepView = groupViews[0];
        const removeViews = groupViews.slice(1);

        console.log(`  ✅ Keeping: ${keepView.title} (${new Date(keepView.createdAt).toLocaleDateString()})`);
        
        // Remove duplicate views
        for (const duplicateView of removeViews) {
          try {
            await viewService.remove(duplicateView._id);
            console.log(`  🗑️ Removed: ${duplicateView.title} (${new Date(duplicateView.createdAt).toLocaleDateString()})`);
            duplicatesRemoved++;
          } catch (error) {
            console.error(`  ❌ Failed to remove duplicate view ${duplicateView.title}:`, error.message);
          }
        }
      }
    }

    console.log(`\n🧹 Duplicate cleanup completed!`);
    console.log(`  Duplicates removed: ${duplicatesRemoved}`);

    return duplicatesRemoved;

  } catch (error) {
    console.error('❌ Failed to cleanup duplicates:', error.message);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    const args = process.argv.slice(2);
    const command = args[0];

    console.log('🌱 Cigno Defaults Seeder');
    console.log('========================\n');

    switch (command) {
      case '--check':
        await checkSeedStatus();
        break;
      
      case '--clear':
        await clearSeededData();
        break;
      
      case '--cleanup':
        await cleanupDuplicateViews();
        break;
      
      case '--force':
        // Clean up duplicates first, then force re-seed
        await cleanupDuplicateViews();
        await seedDefaultData(true);
        break;
      
      case '--help':
        console.log('Usage:');
        console.log('  node src/lib/seed-defaults.js          # Seed data (if not already seeded)');
        console.log('  node src/lib/seed-defaults.js --check  # Check current seed status');
        console.log('  node src/lib/seed-defaults.js --force  # Force re-seed (overwrites existing)');
        console.log('  node src/lib/seed-defaults.js --clear  # Clear all seeded data');
        console.log('  node src/lib/seed-defaults.js --cleanup # Clean up duplicate views');
        console.log('  node src/lib/seed-defaults.js --help   # Show this help');
        break;
      
      default:
        // Default behavior: cleanup duplicates first, then seed if not already seeded
        await cleanupDuplicateViews();
        await seedDefaultData();
        break;
    }

    console.log('\n✨ Seeder completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('\n💥 Seeder failed:', error.message);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { seedDefaultData, checkSeedStatus, clearSeededData };
