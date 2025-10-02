import { NextResponse } from 'next/server';
import Deliverable from '@/lib/models/Deliverable';
import MenuItemModel from '@/lib/models/MenuItemModel';
import Project from '@/lib/models/Project';
import User from '@/lib/models/User';
import connectDB from '@/lib/db/mongoose';

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
      data: { deliverables }
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
    const VALID_TYPES = ['Presentation', 'Report', 'Strategy', 'Analysis', 'Design', 'Code', 'Documentation', 'Other'];
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
    const deliverable = new Deliverable({
      name: name.trim(),
      type: type || 'Report',
      status: status || 'draft',
      priority: priority || 'medium',
      brief: description || `Brief for ${name}`,
      project,
      due_date: parsedDueDate,
      estimated_hours: Number(estimated_hours),
      notes: notes || '',
      created_by: defaultUserId,
      updated_by: defaultUserId
    });

    const saved = await deliverable.save();
    console.log('✅ Deliverable created:', saved._id);

    return NextResponse.json({
      success: true,
      data: { deliverable: saved }
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

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Valid ID required' },
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
      data: { deliverable }
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

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID required' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
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