import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/db/mongoose';
import Deliverable from '../../../../lib/models/Deliverable';
import Project from '../../../../lib/models/Project';
import User from '../../../../lib/models/User';
import mongoose from 'mongoose';

const normalizeList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map(item => (typeof item === 'string' ? item.trim() : String(item).trim()))
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    // Only split on newlines, semicolons, and bullet points - NOT dashes (to preserve "buy-vs-build", "well-defined", etc.)
    return value
      .split(/[\n;,•]+/)
      .map(item => item.replace(/^[-•\s]+/, '').trim())
      .filter(Boolean);
  }
  return [String(value)];
};

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
    
    console.log('📝 [PATCH API] Updating deliverable:', id);
    console.log('📝 [PATCH API] Updates received:', updates);
    console.log('📝 [PATCH API] brief_quality in updates:', updates.brief_quality);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid deliverable ID' },
        { status: 400 }
      );
    }

    const sanitizedUpdates = { ...updates };

    if ('brief_quality' in sanitizedUpdates) {
      console.log('📊 [PATCH API] Original brief_quality value:', sanitizedUpdates.brief_quality);
      console.log('📊 [PATCH API] Type:', typeof sanitizedUpdates.brief_quality);
      
      const numericQuality = Number(sanitizedUpdates.brief_quality);
      console.log('📊 [PATCH API] After Number():', numericQuality);
      console.log('📊 [PATCH API] Is finite?:', Number.isFinite(numericQuality));
      
      if (Number.isFinite(numericQuality)) {
        sanitizedUpdates.brief_quality = Number(numericQuality.toFixed(1));
        console.log('✅ [PATCH API] Sanitized brief_quality (will save):', sanitizedUpdates.brief_quality);
      } else {
        sanitizedUpdates.brief_quality = null;
        console.log('⚠️ [PATCH API] Setting brief_quality to null (invalid number)');
      }
    } else {
      console.log('⚠️ [PATCH API] No brief_quality field in updates');
    }

    if ('brief_strengths' in sanitizedUpdates) {
      sanitizedUpdates.brief_strengths = normalizeList(sanitizedUpdates.brief_strengths);
      console.log('📊 [PATCH API] Sanitized brief_strengths count:', sanitizedUpdates.brief_strengths.length);
    }

    if ('brief_improvements' in sanitizedUpdates) {
      sanitizedUpdates.brief_improvements = normalizeList(sanitizedUpdates.brief_improvements);
      console.log('📊 [PATCH API] Sanitized brief_improvements count:', sanitizedUpdates.brief_improvements.length);
    }

    if (
      'brief_quality' in sanitizedUpdates ||
      'brief_strengths' in sanitizedUpdates ||
      'brief_improvements' in sanitizedUpdates
    ) {
      sanitizedUpdates.brief_last_evaluated_at = new Date();
      console.log('📅 [PATCH API] Set brief_last_evaluated_at');
    }

    console.log('📦 [PATCH API] Final sanitized updates:', JSON.stringify(sanitizedUpdates, null, 2));
    console.log('📦 [PATCH API] Will update these fields:', Object.keys(sanitizedUpdates));

    // First, check current value in database
    const currentDoc = await Deliverable.findById(id).select('brief_quality brief_strengths brief_improvements').lean();
    console.log('📂 [PATCH API] Current values in DB BEFORE update:', currentDoc);

    const deliverable = await Deliverable.findByIdAndUpdate(
      id,
      { ...sanitizedUpdates, updated_at: new Date() },
      { new: true, runValidators: true }
    ).lean();

    if (!deliverable) {
      return NextResponse.json(
        { error: 'Deliverable not found' },
        { status: 404 }
      );
    }

    console.log('✅ [PATCH API] Deliverable updated successfully');
    console.log('✅ [PATCH API] Saved brief_quality:', deliverable.brief_quality);
    console.log('✅ [PATCH API] Saved brief_strengths:', deliverable.brief_strengths);
    console.log('✅ [PATCH API] Saved brief_improvements:', deliverable.brief_improvements);
    
    // Verify the data was actually written to database
    const verification = await Deliverable.findById(id).select('brief_quality brief_strengths brief_improvements brief_last_evaluated_at').lean();
    console.log('🔍 [PATCH API] VERIFICATION - Data in DB after update:', verification);

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
