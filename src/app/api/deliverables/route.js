import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Deliverable from '@/lib/models/Deliverable';
import MenuItemModel from '@/lib/models/MenuItemModel';
import User from '@/lib/models/User';
import connectDB from '@/lib/db/mongoose';

// GET /api/deliverables - Get deliverables for a project
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;

    // Build query
    const query = {};
    if (projectId) {
      query.project = projectId;
    }
    if (status && status !== 'all') {
      query.status = status;
    }
    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    // Get deliverables with pagination
    const skip = (page - 1) * limit;
    const deliverables = await Deliverable.find(query)
      .populate('project', 'name client')
      .populate('assigned_to', 'name email role')
      .populate('created_by', 'name email')
      .populate('updated_by', 'name email')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await Deliverable.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: {
        deliverables,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching deliverables:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch deliverables',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// POST /api/deliverables - Create a new deliverable
export async function POST(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const {
      name,
      type,
      status = 'Planning',
      priority = 'Medium',
      description,
      project,
      assigned_to = [],
      due_date,
      estimated_hours = 0,
      notes
    } = body;

    // Validate required fields
    if (!name || !type || !project) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: name, type, project' 
        },
        { status: 400 }
      );
    }

    // Get default user if not provided
    let defaultUser = 'user-id-placeholder';
    const firstUser = await User.findOne().select('_id');
    if (firstUser) {
      defaultUser = firstUser._id;
    }
    
    // Default values
    const defaultDueDate = due_date ? new Date(due_date) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    
    // Create deliverable
    const deliverable = new Deliverable({
      name,
      type: type || 'Report', // Use capitalized enum value
      status: status || 'draft', // Use lowercase enum value
      priority: priority ? priority.toLowerCase() : 'medium', // Use lowercase enum value
      brief: description || 'Deliverable brief', // Map description to brief
      project,
      assigned_to,
      due_date: defaultDueDate,
      estimated_hours,
      notes,
      created_by: defaultUser,
      updated_by: defaultUser
    });

    await deliverable.save();

    // Populate the created deliverable
    const populatedDeliverable = await Deliverable.findById(deliverable._id)
      .populate('project', 'name client')
      .populate('assigned_to', 'name email role')
      .populate('created_by', 'name email')
      .populate('updated_by', 'name email')
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        deliverable: populatedDeliverable
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating deliverable:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create deliverable',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// PUT /api/deliverables - Update a deliverable
export async function PUT(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Deliverable ID is required' 
        },
        { status: 400 }
      );
    }

    // Get default user if not provided
    let defaultUser = 'user-id-placeholder';
    const firstUser = await User.findOne().select('_id');
    if (firstUser) {
      defaultUser = firstUser._id;
    }
    
    // Update deliverable
    const deliverable = await Deliverable.findByIdAndUpdate(
      id,
      {
        ...updateData,
        updated_by: defaultUser,
        updated_at: new Date()
      },
      { new: true, runValidators: true }
    )
      .populate('project', 'name client')
      .populate('assigned_to', 'name email role')
      .populate('created_by', 'name email')
      .populate('updated_by', 'name email')
      .lean();

    if (!deliverable) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Deliverable not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        deliverable
      }
    });

  } catch (error) {
    console.error('Error updating deliverable:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update deliverable',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/deliverables - Delete a deliverable
export async function DELETE(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Deliverable ID is required' 
        },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid deliverable ID format',
          details: 'Deliverable ID must be a valid MongoDB ObjectId' 
        },
        { status: 400 }
      );
    }

    // Delete menu items for this deliverable
    console.log('Deleting menu items for deliverable...');
    await MenuItemModel.deleteMany({ 
      $or: [
        { 'metadata.deliverable_id': id },
        { 'metadata.deliverable': id }
      ]
    });
    console.log('Menu items deleted successfully');

    // Delete deliverable
    const deliverable = await Deliverable.findByIdAndDelete(id);

    if (!deliverable) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Deliverable not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Deliverable and associated menu items deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting deliverable:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete deliverable',
        details: error.message 
      },
      { status: 500 }
    );
  }
}