import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/db/mongoose.js';
import Project from '../../../../lib/models/Project';
import Deliverable from '../../../../lib/models/Deliverable';
import Client from '../../../../lib/models/Client';
import User from '../../../../lib/models/User';
import '../../../../lib/models/Contact';
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

    const project = await Project.findById(id)
      .populate('client', 'name industry')
      .populate('internal_owner', 'first_name last_name')
      .populate('client_owner', 'name email_address')
      .populate('deliverables', 'name status due_date type format');

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Get deliverables count and calculate progress
    const deliverables = await Deliverable.find({ project: id });
    const completedDeliverables = deliverables.filter(d => d.status === 'completed').length;
    const progressPercentage = deliverables.length > 0 
      ? Math.round((completedDeliverables / deliverables.length) * 100)
      : 0;

    // Calculate days remaining
    const daysRemaining = project.end_date 
      ? Math.max(0, Math.ceil((new Date(project.end_date) - new Date()) / (1000 * 60 * 60 * 24)))
      : null;

    // Enrich project data with calculated fields
    const enrichedProject = {
      ...project.toObject(),
      client_name: project.client?.name || 'Unknown Client',
      deliverables_count: deliverables.length,
      progress_percentage: progressPercentage,
      days_remaining: daysRemaining,
      budget_percentage: project.budget?.spent || 0
    };

    return NextResponse.json(enrichedProject);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
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
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    const project = await Project.findByIdAndUpdate(
      id,
      { ...updates, updated_at: new Date() },
      { new: true, runValidators: true }
    ).populate('client', 'name')
     .populate('internal_owner', 'first_name last_name');

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
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
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    // Delete related deliverables first
    await Deliverable.deleteMany({ project: id });

    const project = await Project.findByIdAndDelete(id);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
