import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/db/mongoose';
import Deliverable from '../../../../lib/models/Deliverable';
import Project from '../../../../lib/models/Project';
import User from '../../../../lib/models/User';
import mongoose from 'mongoose';

export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid deliverable ID' },
        { status: 400 }
      );
    }

    const deliverable = await Deliverable.findById(id).lean();

    if (!deliverable) {
      return NextResponse.json(
        { error: 'Deliverable not found' },
        { status: 404 }
      );
    }

    // Format the response to include id field for compatibility
    const formattedDeliverable = {
      ...deliverable,
      id: deliverable._id.toString()
    };

    return NextResponse.json(formattedDeliverable);
  } catch (error) {
    console.error('Error fetching deliverable:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deliverable' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;
    const updates = await request.json();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid deliverable ID' },
        { status: 400 }
      );
    }

    const deliverable = await Deliverable.findByIdAndUpdate(
      id,
      { ...updates, updated_at: new Date() },
      { new: true, runValidators: true }
    ).lean();

    if (!deliverable) {
      return NextResponse.json(
        { error: 'Deliverable not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(deliverable);
  } catch (error) {
    console.error('Error updating deliverable:', error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update deliverable' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid deliverable ID' },
        { status: 400 }
      );
    }

    const deliverable = await Deliverable.findByIdAndDelete(id);

    if (!deliverable) {
      return NextResponse.json(
        { error: 'Deliverable not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Deliverable deleted successfully' });
  } catch (error) {
    console.error('Error deleting deliverable:', error);
    return NextResponse.json(
      { error: 'Failed to delete deliverable' },
      { status: 500 }
    );
  }
}