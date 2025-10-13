import { NextResponse } from 'next/server';
import connectDB from '../../../lib/db/mongoose';
import MenuItemModel from '../../../lib/models/MenuItemModel';
import { formatForAPI, isValidObjectId } from '../../../lib/utils/idUtils';

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
    
    // Second pass: Add deliverables as menu items ONLY if no menu item already exists for them
    allDeliverables.forEach(deliverable => {
      const deliverableId = deliverable._id.toString();
      
      // Check if a menu item already exists for this deliverable
      const existingMenuItem = Array.from(itemMap.values()).find(item => 
        item.type === 'deliverable' && (
          item.metadata?.deliverableId === deliverableId ||
          item.metadata?.deliverable_id === deliverableId ||
          item.metadata?.business_entity_id === deliverableId
        )
      );
      
      if (!existingMenuItem) {
        console.log(`Creating missing menu item for deliverable: ${deliverable.name}`);
        
        const deliverableMenuItem = formatForAPI({
          _id: deliverable._id,
          title: deliverable.name,
          description: deliverable.brief || '',
          type: 'deliverable',
          status: deliverable.status || 'draft',
          parentId: null, // Will be set based on project mapping below
          order: 0,
          isCollapsed: false,
          isCollapsible: false,
          children: [],
          metadata: {
            deliverableId: deliverable._id.toString(),
            deliverable_id: deliverable._id.toString(),
            business_entity_id: deliverable._id.toString(),
            project_id: deliverable.project ? deliverable.project.toString() : null,
            format: deliverable.format,
            due_date: deliverable.due_date,
            priority: deliverable.priority
          },
          brief: deliverable.brief || '',
          dueDate: deliverable.due_date,
          priority: deliverable.priority || 'medium'
        });
        
        // Find the parent project menu item
        if (deliverable.project) {
          const projectId = deliverable.project.toString();
          // Find menu item with project_id in metadata
          const parentProject = Array.from(itemMap.values()).find(item => 
            item.type === 'project' && 
            (item.metadata?.project_id === projectId || item.metadata?.business_entity_id === projectId)
          );
          
          if (parentProject) {
            deliverableMenuItem.parentId = parentProject._id;
            parentProject.children.push(deliverableMenuItem);
            console.log(`Added deliverable "${deliverable.name}" to project "${parentProject.title}"`);
          } else {
            console.log(`No parent project found for deliverable "${deliverable.name}" with project ID ${projectId}`);
          }
        }
        
        // Add to the itemMap so it's included in the hierarchy
        itemMap.set(deliverableId, deliverableMenuItem);
      } else {
        console.log(`Menu item already exists for deliverable: ${deliverable.name}`);
      }
    });
    
    // Third pass: build the hierarchy for all menu items (including auto-generated ones)
    allItems.forEach(item => {
      const itemWithId = itemMap.get(item._id.toString());
      
      if (item.parentId) {
        const parent = itemMap.get(item.parentId.toString());
        if (parent) {
          parent.children.push(itemWithId);
        }
      } else {
        rootItems.push(itemWithId);
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
      finalTitle = itemData.name || 'Untitled Project';
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
