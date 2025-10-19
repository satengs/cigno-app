import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/db/mongoose.js';
import Deliverable from '../../../../../lib/models/Deliverable';
import Project from '../../../../../lib/models/Project';
import Client from '../../../../../lib/models/Client';
import User from '../../../../../lib/models/User';
import mongoose from 'mongoose';

export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    // Verify project exists
    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const deliverables = await Deliverable.find({ project: id })
      .populate('assigned_to', 'first_name last_name')
      .sort({ created_at: -1 });

    return NextResponse.json(deliverables);
  } catch (error) {
    console.error('Error fetching deliverables:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deliverables' },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;
    const deliverableData = await request.json();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    // Verify project exists
    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Create new deliverable
    const deliverable = new Deliverable({
      ...deliverableData,
      project: id,
      created_at: new Date(),
      updated_at: new Date()
    });

    await deliverable.save();

    // Populate the response
    const populatedDeliverable = await Deliverable.findById(deliverable._id)
      .populate('assigned_to', 'first_name last_name');

    return NextResponse.json(populatedDeliverable, { status: 201 });
  } catch (error) {
    console.error('Error creating deliverable:', error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create deliverable' },
      { status: 500 }
    );
  }
}