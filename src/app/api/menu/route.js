import { NextResponse } from 'next/server';
import connectDB from '../../../lib/db/mongoose';
import MenuItemModel from '../../../lib/models/MenuItemModel';
import { formatForAPI, isValidObjectId, getIdString } from '../../../lib/utils/idUtils';

export async function GET() {
  try {
    await connectDB();
    console.log('Database connected, fetching menu items...');
    
    // Get all menu items and build the hierarchy
    const allItems = await MenuItemModel.find({}).lean();
    console.log(`Found ${allItems.length} menu items in database`);
    
    // Also fetch deliverables to ensure they appear in menu if no menu item exists
    const Deliverable = (await import('../../../lib/models/Deliverable')).default;
    const allDeliverables = await Deliverable.find({ is_active: true }).lean();
    console.log(`Found ${allDeliverables.length} deliverables in database`);
    
    // Build the hierarchical structure
    const itemMap = new Map();
    const rootItems = [];
    
    // First pass: create a map of all menu items with normalized IDs
    allItems.forEach(item => {
      const normalizedItem = formatForAPI({
        ...item,
        children: []
      });
      itemMap.set(item._id.toString(), normalizedItem);
    });
    
    // Second pass: Clean up orphaned menu items and add deliverables as menu items
    console.log(`Processing ${allDeliverables.length} deliverables...`);
    
    // First, remove orphaned deliverable menu items (menu items that reference non-existent deliverables)
    const deliverableIds = new Set(allDeliverables.map(d => d._id.toString()));
    const orphanedMenuItems = [];
    
    // Items to preserve even if orphaned
    const preserveItems = ['New Pension Strategy for UBS Switzerland'];
    
    for (const [itemId, item] of itemMap.entries()) {
      if (item.type === 'deliverable') {
        const referencedDeliverableId = item.metadata?.deliverableId || 
                                       item.metadata?.deliverable_id || 
                                       item.metadata?.business_entity_id;
        
        if (referencedDeliverableId && !deliverableIds.has(referencedDeliverableId)) {
          // Check if this item should be preserved
          if (preserveItems.includes(item.title)) {
            console.log(`🔒 Preserving orphaned menu item: ${item.title} (as requested)`);
          } else {
            console.log(`🗑️ Found orphaned menu item: ${item.title} (references non-existent deliverable: ${referencedDeliverableId})`);
            orphanedMenuItems.push(itemId);
          }
        }
      }
    }
    
    // Remove orphaned menu items from itemMap (except preserved ones)
    orphanedMenuItems.forEach(itemId => {
      itemMap.delete(itemId);
      console.log(`✅ Removed orphaned menu item: ${itemId}`);
    });
    
    // Deduplicate menu items with the same title and deliverable ID (keep the first one)
    const titleMap = new Map();
    const duplicateItems = [];
    
    for (const [itemId, item] of itemMap.entries()) {
      if (item.type === 'deliverable' && item.title) {
        const deliverableId = item.metadata?.deliverableId || item.metadata?.deliverable_id || item.metadata?.business_entity_id;
        const key = `${item.title}-${deliverableId}`;
        
        if (titleMap.has(key)) {
          console.log(`🔄 Found duplicate menu item: "${item.title}" with deliverable ID ${deliverableId} (ID: ${itemId}), removing duplicate`);
          duplicateItems.push(itemId);
        } else {
          titleMap.set(key, itemId);
        }
    }
  }

  // Remove duplicate items from both itemMap and database
  for (const itemId of duplicateItems) {
      itemMap.delete(itemId);
      console.log(`✅ Removed duplicate menu item from display: ${itemId}`);
      
      // Also delete from database
      try {
        await MenuItemModel.findByIdAndDelete(itemId);
        console.log(`🗑️ Deleted duplicate menu item from database: ${itemId}`);
      } catch (dbError) {
        console.error(`❌ Failed to delete duplicate menu item from database: ${itemId}`, dbError);
      }
    }
    
    // No auto-generation - only use existing menu items from database
    console.log(`Skipping auto-generation - using only existing menu items from database`);

    const deliverableStatusMap = new Map();
    const mapDeliverableStatusToMenuStatus = (status) => {
      switch ((status || '').toLowerCase()) {
        case 'draft':
          return 'not-started';
        case 'in_progress':
        case 'in-progress':
        case 'in_review':
        case 'in-review':
          return 'in-progress';
        case 'approved':
        case 'completed':
        case 'delivered':
          return 'completed';
        case 'rejected':
          return 'inactive';
        default:
          return 'active';
      }
    };

    allDeliverables.forEach(deliverable => {
      const id = getIdString(deliverable._id);
      if (id) {
        deliverableStatusMap.set(id, deliverable.status);
      }
    });

    const existingDeliverableIds = new Set();
    for (const item of itemMap.values()) {
      if (item.type !== 'deliverable') continue;

      const meta = item.metadata || {};
      const linkedId = getIdString(
        meta.deliverableId ||
        meta.deliverable_id ||
        meta.business_entity_id ||
        item.deliverable ||
        item.deliverableId
      );

      if (linkedId) {
        existingDeliverableIds.add(linkedId);
      } else {
        const fallback = getIdString(item._id || item.id);
        if (fallback) {
          existingDeliverableIds.add(fallback);
        }
      }
    }

    const projectIndex = new Map();
    const addProjectIndexEntry = (rawId, item) => {
      const projectId = getIdString(rawId);
      if (!projectId || projectIndex.has(projectId)) return;
      projectIndex.set(projectId, item);
    };

    for (const item of itemMap.values()) {
      if (item.type !== 'project') continue;

      const meta = item.metadata || {};
      addProjectIndexEntry(meta.project_id, item);
      addProjectIndexEntry(meta.business_entity_id, item);
      addProjectIndexEntry(item.project, item);
      addProjectIndexEntry(item.projectId, item);
      addProjectIndexEntry(item._id, item);
      addProjectIndexEntry(item.id, item);
    }

    const virtualDeliverableItems = [];

    for (const deliverable of allDeliverables) {
      const deliverableId = getIdString(deliverable._id);
      if (!deliverableId || existingDeliverableIds.has(deliverableId)) {
        continue;
      }

      const projectId = getIdString(deliverable.project);
      if (!projectId) {
        continue;
      }

      const parentProject = projectIndex.get(projectId);
      if (!parentProject) {
        continue;
      }

      const virtualDeliverableItem = {
        _id: deliverableId,
        id: deliverableId,
        title: deliverable.name || 'Untitled Deliverable',
        description: deliverable.brief || '',
        type: 'deliverable',
        status: mapDeliverableStatusToMenuStatus(deliverable.status),
        parentId: getIdString(parentProject._id) || getIdString(parentProject.id),
        order: 0,
        isCollapsible: true,
        metadata: {
          deliverableId,
          deliverable_id: deliverableId,
          business_entity_id: deliverableId,
          project_id: projectId,
          type: deliverable.type,
          due_date: deliverable.due_date,
          priority: deliverable.priority,
          isVirtual: true
        },
        brief: deliverable.brief || '',
        dueDate: deliverable.due_date || null,
        priority: deliverable.priority || 'medium',
        children: []
      };

      itemMap.set(virtualDeliverableItem._id.toString(), virtualDeliverableItem);
      virtualDeliverableItems.push(virtualDeliverableItem);
    }

    if (virtualDeliverableItems.length > 0) {
      console.log(`➕ Added ${virtualDeliverableItems.length} virtual deliverable menu items to maintain consistency`);
    }

    for (const item of itemMap.values()) {
      if (item.type === 'deliverable') {
        const meta = item.metadata || {};
        const deliverableId = getIdString(
          meta.deliverableId ||
          meta.deliverable_id ||
          meta.business_entity_id ||
          item.deliverable ||
          item.deliverableId
        );

        if (deliverableId && deliverableStatusMap.has(deliverableId)) {
          const actualStatus = deliverableStatusMap.get(deliverableId);
          item.status = mapDeliverableStatusToMenuStatus(actualStatus);
          item.metadata = {
            ...meta,
            deliverableId,
            deliverable_id: deliverableId,
            business_entity_id: deliverableId,
            deliverableStatus: actualStatus
          };
        }
      }
    }

  // Third pass: build the hierarchy for all menu items (including auto-generated ones)
    // Process all items in the itemMap, not just the original allItems
    const processedItems = new Set();
    Array.from(itemMap.values()).forEach(item => {
      if (processedItems.has(item._id.toString())) {
        console.log(`Skipping duplicate item: ${item.title} (${item._id})`);
        return;
      }
      processedItems.add(item._id.toString());
      
      if (item.parentId) {
        const parent = itemMap.get(item.parentId.toString());
        if (parent) {
          parent.children.push(item);
        } else {
          // If parent not found by ID, try to find by project_id in metadata
          if (item.metadata?.project_id) {
            const projectParent = Array.from(itemMap.values()).find(p => 
              p.type === 'project' && 
              (p.metadata?.project_id === item.metadata.project_id || 
               p.metadata?.business_entity_id === item.metadata.project_id)
            );
            if (projectParent) {
              console.log(`Found parent by project_id for ${item.title}: ${projectParent.title}`);
              projectParent.children.push(item);
            } else {
              console.log(`No parent found for ${item.title} with project_id ${item.metadata.project_id}`);
            }
          } else {
            console.log(`No parent found for ${item.title} with parentId ${item.parentId}`);
          }
        }
      } else {
        rootItems.push(item);
      }
    });
    
    console.log(`Built hierarchy with ${rootItems.length} root items`);
    return NextResponse.json({ rootItems });
    
  } catch (error) {
    console.error('Error fetching menu data:', error);
    return NextResponse.json({ error: 'Failed to fetch menu data' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    console.log('🔗 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected successfully');
    
    const itemData = await request.json();
    console.log('📥 Received item data:', JSON.stringify(itemData, null, 2));
    
    console.log('Creating new menu item:', {
      type: itemData.type,
      title: itemData.title,
      parentId: itemData.parentId || null
    });
    
    console.log('🔍 Full itemData received:', {
      title: itemData.title,
      status: itemData.status,
      type: itemData.type,
      name: itemData.name,
      hasName: !!itemData.name,
      hasTitle: !!itemData.title
    });
    
    // Handle missing title for projects (fallback)
    let finalTitle = itemData.title;
    if (!finalTitle && itemData.type === 'project') {
      finalTitle = itemData.name;
      console.log('🔧 Menu API: Using project name as title:', finalTitle);
    }
    
    // Handle invalid status values (fallback)
    let finalStatus = itemData.status || 'active';
    if (itemData.type === 'project' && itemData.status === 'Planning') {
      finalStatus = 'not-started';
      console.log('🔧 Menu API: Mapping Planning -> not-started');
    }

    // Create the new menu item
    const newItem = new MenuItemModel({
      title: finalTitle,
      description: itemData.description || '',
      type: itemData.type,
      status: finalStatus,
      parentId: itemData.parentId || null,
      order: itemData.order || 0,
      isCollapsed: itemData.isCollapsed || false,
      isCollapsible: itemData.isCollapsible !== undefined ? itemData.isCollapsible : true,
      metadata: itemData.metadata || {},
      // Project-specific properties
      assignedClient: itemData.assignedClient || null,
      // Deliverable-specific properties
      brief: itemData.brief || '',
      dueDate: itemData.dueDate || null,
      priority: itemData.priority || 'medium',
      teamMembers: itemData.teamMembers || [],
      insights: itemData.insights || [],
      materials: itemData.materials || [],
      storyline: itemData.storyline || null
    });
    
    const savedItem = await newItem.save();
    console.log('Menu item created successfully with ID:', savedItem._id);
    
    // If this item has a parent, update the parent's children array
    if (itemData.parentId) {
      await MenuItemModel.findByIdAndUpdate(
        itemData.parentId,
        { $push: { children: savedItem._id } }
      );
      console.log('Updated parent item children array');
    }
    
    return NextResponse.json({ 
      success: true, 
      data: { item: formatForAPI(savedItem) }
    });
    
  } catch (error) {
    console.error('💥 Error creating menu item:', error);
    console.error('🔍 Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json({ 
      error: 'Failed to create menu item',
      details: error.message 
    }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const { id, ...updateData } = await request.json();
    
    if (!id || !isValidObjectId(id)) {
      return NextResponse.json({ 
        error: 'Valid ObjectId required' 
      }, { status: 400 });
    }
    
    console.log('Updating menu item:', id, updateData);
    
    const updatedItem = await MenuItemModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedItem) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }
    
    console.log('Menu item updated successfully');
    
    return NextResponse.json({ 
      success: true, 
      data: { item: formatForAPI(updatedItem) }
    });
    
  } catch (error) {
    console.error('Error updating menu item:', error);
    return NextResponse.json({ 
      error: 'Failed to update menu item',
      details: error.message 
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    const { id } = await request.json();
    
    if (!id || !isValidObjectId(id)) {
      return NextResponse.json({ 
        error: 'Valid ObjectId required' 
      }, { status: 400 });
    }
    
    console.log('Deleting menu item:', id);
    
    // Check if item has children
    const item = await MenuItemModel.findById(id);
    if (!item) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }
    
    if (item.children && item.children.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete item with children. Please delete children first.' 
      }, { status: 400 });
    }
    
    // Remove from parent's children array if it has a parent
    if (item.parentId) {
      await MenuItemModel.findByIdAndUpdate(
        item.parentId,
        { $pull: { children: item._id } }
      );
    }
    
    // Delete the item
    await MenuItemModel.findByIdAndDelete(id);
    console.log('Menu item deleted successfully');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Menu item deleted successfully' 
    });
    
  } catch (error) {
    console.error('Error deleting menu item:', error);
    return NextResponse.json({ 
      error: 'Failed to delete menu item',
      details: error.message 
    }, { status: 500 });
  }
}
