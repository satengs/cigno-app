import { NextResponse } from 'next/server';
import Deliverable from '@/lib/models/Deliverable';
import MenuItemModel from '@/lib/models/MenuItemModel';
import Project from '@/lib/models/Project';
import User from '@/lib/models/User';
import connectDB from '@/lib/db/mongoose';
import { formatForAPI, isValidObjectId } from '@/lib/utils/idUtils';

// GET /api/deliverables
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    
    const query = {};
    if (projectId) {
      query.project = projectId;
    }

    const deliverables = await Deliverable.find(query)
      .sort({ created_at: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: { deliverables: formatForAPI(deliverables) }
    });

  } catch (error) {
    console.error('Error fetching deliverables:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch deliverables' },
      { status: 500 }
    );
  }
}

// POST /api/deliverables
export async function POST(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    console.log('📝 Creating deliverable:', body);
    
    const {
      name,
      type,
      status,
      priority,
      description = '',
      project,
      due_date,
      estimated_hours = 0,
      notes = ''
    } = body;

    // Validate required fields
    if (!name || !project) {
      return NextResponse.json(
        { success: false, error: 'Name and project are required' },
        { status: 400 }
      );
    }

    // Validate enum values
    const VALID_TYPES = ['Recommendation', 'Workshop Document', 'Presentation', 'Report', 'Strategy', 'Analysis', 'Design', 'Code', 'Documentation', 'Dashboard', 'API', 'Brief', 'Storyline', 'Other'];
    const VALID_STATUSES = ['draft', 'in_review', 'approved', 'in_progress', 'completed', 'delivered', 'rejected'];
    const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'];

    if (type && !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid type: ${type}. Valid types: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status: ${status}. Valid statuses: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json(
        { success: false, error: `Invalid priority: ${priority}. Valid priorities: ${VALID_PRIORITIES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate field lengths
    if (name.length > 200) {
      return NextResponse.json(
        { success: false, error: 'Name must be 200 characters or less' },
        { status: 400 }
      );
    }

    if (description && description.length > 2000) {
      return NextResponse.json(
        { success: false, error: 'Description must be 2000 characters or less' },
        { status: 400 }
      );
    }

    if (estimated_hours < 0 || estimated_hours > 10000) {
      return NextResponse.json(
        { success: false, error: 'Estimated hours must be between 0 and 10000' },
        { status: 400 }
      );
    }

    // Validate date format
    let parsedDueDate;
    if (due_date) {
      parsedDueDate = new Date(due_date);
      if (isNaN(parsedDueDate.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid due_date format. Please use ISO 8601 format (YYYY-MM-DD)' },
          { status: 400 }
        );
      }
    } else {
      // Default to 7 days from now
      parsedDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    // TODO: Implement proper authentication - for now using default user
    const defaultUserId = '507f1f77bcf86cd799439011';

    // Create deliverable with validated values
    const safeName = (name && typeof name === 'string') ? name.trim() : 'Untitled Deliverable';
    const deliverable = new Deliverable({
      name: safeName,
      type: type || 'Report',
      status: status || 'draft',
      priority: priority || 'medium',
      brief: description || `Brief for ${safeName}`,
      project,
      due_date: parsedDueDate,
      estimated_hours: Number(estimated_hours),
      notes: notes || '',
      created_by: defaultUserId,
      updated_by: defaultUserId
    });

    let saved;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        saved = await deliverable.save();
        console.log('✅ Deliverable created:', saved._id);
        break;
      } catch (saveError) {
        retryCount++;
        console.log(`⚠️ Save attempt ${retryCount} failed:`, saveError.message);
        
        if (retryCount >= maxRetries) {
          throw saveError;
        }
        
        if (saveError.name === 'MongoServerSelectionError' || 
            saveError.message.includes('timed out') ||
            saveError.message.includes('connection')) {
          console.log(`🔄 Retrying save operation (${retryCount}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          await connectDB();
        } else {
          throw saveError;
        }
      }
    }

    // Add deliverable to project's deliverables array
    try {
      const Project = (await import('../../../lib/models/Project')).default;
      await Project.findByIdAndUpdate(
        project,
        { $addToSet: { deliverables: saved._id } },
        { new: true }
      );
      console.log('✅ Added deliverable to project deliverables array');
    } catch (updateError) {
      console.error('⚠️ Failed to update project deliverables array:', updateError);
      // Don't fail the request if this update fails
    }

    return NextResponse.json({
      success: true,
      data: { deliverable: formatForAPI(saved) }
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error creating deliverable:', error);
    
    // Handle specific error types
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { success: false, error: 'Validation failed: ' + validationErrors.join(', ') },
        { status: 400 }
      );
    }
    
    if (error.name === 'CastError') {
      return NextResponse.json(
        { success: false, error: 'Invalid data format provided' },
        { status: 400 }
      );
    }
    
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Duplicate data detected' },
        { status: 409 }
      );
    }
    
    // MongoDB connection-specific errors
    if (error.name === 'MongoServerSelectionError' || 
        error.message.includes('timed out') ||
        error.message.includes('connection')) {
      return NextResponse.json(
        { success: false, error: 'Database connection timeout. Please try again in a moment.' },
        { status: 503 }
      );
    }
    
    if (error.name === 'MongoNetworkError') {
      return NextResponse.json(
        { success: false, error: 'Database network error. Please check your connection and try again.' },
        { status: 503 }
      );
    }
    
    // Generic server error
    return NextResponse.json(
      { success: false, error: 'Internal server error occurred while creating deliverable' },
      { status: 500 }
    );
  }
}

// PUT /api/deliverables
export async function PUT(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id || typeof id !== 'string' || !isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Valid ObjectId required' },
        { status: 400 }
      );
    }

    const deliverable = await Deliverable.findByIdAndUpdate(
      id,
      { ...updateData, updated_at: new Date() },
      { new: true, runValidators: true }
    );

    if (!deliverable) {
      return NextResponse.json(
        { success: false, error: 'Deliverable not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { deliverable: formatForAPI(deliverable) }
    });

  } catch (error) {
    console.error('Error updating deliverable:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/deliverables
export async function DELETE(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || !isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Valid ObjectId required' },
        { status: 400 }
      );
    }

    const deliverable = await Deliverable.findByIdAndDelete(id);

    if (!deliverable) {
      return NextResponse.json(
        { success: false, error: 'Deliverable not found' },
        { status: 404 }
      );
    }

    // Also remove the corresponding menu item
    try {
      const menuItem = await MenuItemModel.findOne({
        'metadata.deliverableId': id
      });

      if (menuItem) {
        console.log('🗑️ Found corresponding menu item to delete:', menuItem._id);
        
        // Remove from parent's children array if it has a parent
        if (menuItem.parentId) {
          await MenuItemModel.findByIdAndUpdate(
            menuItem.parentId,
            { $pull: { children: menuItem._id } }
          );
        }
        
        // Delete the menu item
        await MenuItemModel.findByIdAndDelete(menuItem._id);
        console.log('✅ Menu item deleted successfully');
      } else {
        console.log('⚠️ No corresponding menu item found for deliverable:', id);
      }
    } catch (menuError) {
      console.log('⚠️ Failed to delete menu item, but deliverable was deleted:', menuError.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Deliverable deleted'
    });

  } catch (error) {
    console.error('Error deleting deliverable:', error);
    
    // Handle specific error types
    if (error.name === 'CastError') {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: 'Validation error: ' + error.message },
        { status: 400 }
      );
    }
    
    // Generic server error
    return NextResponse.json(
      { success: false, error: 'Internal server error occurred while deleting deliverable' },
      { status: 500 }
    );
  }
}
