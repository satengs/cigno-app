import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db/mongoose.js';
import Storyline from '../../../../lib/models/Storyline.js';
import User from '../../../../lib/models/User.js';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createValidationError 
} from '../../../../lib/api/errors.js';

// GET /api/storylines/[id] - Get a specific storyline
export async function GET(request, { params }) {
  try {
    await dbConnect();
    
    const { id } = params;
    
    const storyline = await Storyline.findOne({ _id: id, is_active: true })
      .populate('deliverable', 'name type status')
      .populate('created_by', 'name email')
      .populate('updated_by', 'name email')
      .populate('sections.lockedBy', 'name email');

    if (!storyline) {
      const errorResponse = createErrorResponse('NOT_FOUND', 'Storyline not found');
      return NextResponse.json(errorResponse, { status: 404 });
    }

    return NextResponse.json(createSuccessResponse(storyline, 'Storyline retrieved successfully'));

  } catch (error) {
    console.error('Error fetching storyline:', error);
    
    const errorResponse = createErrorResponse('INTERNAL_ERROR', 'Failed to fetch storyline', {
      originalError: error.message
    });
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// PUT /api/storylines/[id] - Update a storyline
export async function PUT(request, { params }) {
  try {
    await dbConnect();
    
    const { id } = params;
    const body = await request.json();
    const {
      title,
      executiveSummary,
      presentationFlow,
      callToAction,
      sections,
      topic,
      industry,
      audience,
      objectives,
      presentationStyle,
      complexity,
      status,
      userId // For now, will be replaced with actual user authentication
    } = body;

    const storyline = await Storyline.findOne({ _id: id, is_active: true });
    if (!storyline) {
      const errorResponse = createErrorResponse('NOT_FOUND', 'Storyline not found');
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Update fields if provided
    if (title !== undefined) storyline.title = title;
    if (executiveSummary !== undefined) storyline.executiveSummary = executiveSummary;
    if (presentationFlow !== undefined) storyline.presentationFlow = presentationFlow;
    if (callToAction !== undefined) storyline.callToAction = callToAction;
    if (topic !== undefined) storyline.topic = topic;
    if (industry !== undefined) storyline.industry = industry;
    if (audience !== undefined) storyline.audience = Array.isArray(audience) ? audience : [audience].filter(Boolean);
    if (objectives !== undefined) storyline.objectives = objectives;
    if (presentationStyle !== undefined) storyline.presentationStyle = presentationStyle;
    if (complexity !== undefined) storyline.complexity = complexity;
    if (status !== undefined) storyline.status = status;
    if (userId) storyline.updated_by = userId;

    // Update sections if provided
    if (sections !== undefined) {
      storyline.sections = sections.map((section, index) => ({
        ...section,
        order: section.order !== undefined ? section.order : index,
        updated_at: new Date()
      }));
    }

    // Increment version for significant updates
    if (sections !== undefined || executiveSummary !== undefined || presentationFlow !== undefined) {
      const parts = storyline.version.split('.');
      const major = parseInt(parts[0]) || 1;
      const minor = parseInt(parts[1]) || 0;
      storyline.version = `${major}.${minor + 1}`;
    }

    await storyline.save();

    // Populate response
    await storyline.populate([
      { path: 'deliverable', select: 'name type status' },
      { path: 'created_by', select: 'name email' },
      { path: 'updated_by', select: 'name email' },
      { path: 'sections.lockedBy', select: 'name email' }
    ]);

    return NextResponse.json(createSuccessResponse(storyline, 'Storyline updated successfully'));

  } catch (error) {
    console.error('Error updating storyline:', error);
    
    const errorResponse = createErrorResponse('INTERNAL_ERROR', 'Failed to update storyline', {
      originalError: error.message
    });
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// DELETE /api/storylines/[id] - Delete a storyline (soft delete)
export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    
    const { id } = params;
    
    const storyline = await Storyline.findOne({ _id: id, is_active: true });
    if (!storyline) {
      const errorResponse = createErrorResponse('NOT_FOUND', 'Storyline not found');
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Soft delete
    storyline.is_active = false;
    storyline.updated_at = new Date();
    await storyline.save();

    return NextResponse.json(createSuccessResponse(null, 'Storyline deleted successfully'));

  } catch (error) {
    console.error('Error deleting storyline:', error);
    
    const errorResponse = createErrorResponse('INTERNAL_ERROR', 'Failed to delete storyline', {
      originalError: error.message
    });
    return NextResponse.json(errorResponse, { status: 500 });
  }
}