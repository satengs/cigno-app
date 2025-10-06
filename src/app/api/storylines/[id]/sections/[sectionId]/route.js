import { NextResponse } from 'next/server';
import dbConnect from '../../../../../../lib/db/mongoose.js';
import Storyline from '../../../../../../lib/models/Storyline.js';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createValidationError 
} from '../../../../../../lib/api/errors.js';

// PUT /api/storylines/[id]/sections/[sectionId] - Update a specific section
export async function PUT(request, { params }) {
  try {
    await dbConnect();
    
    const { id, sectionId } = params;
    const body = await request.json();
    const {
      title,
      description,
      status,
      keyPoints,
      contentBlocks,
      estimatedSlides,
      order,
      userId
    } = body;

    const storyline = await Storyline.findOne({ _id: id, is_active: true });
    if (!storyline) {
      const errorResponse = createErrorResponse('NOT_FOUND', 'Storyline not found');
      return NextResponse.json(errorResponse, { status: 404 });
    }

    const section = storyline.sections.find(s => s.id === sectionId);
    if (!section) {
      const errorResponse = createErrorResponse('NOT_FOUND', 'Section not found');
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Check if section is locked by another user
    if (section.locked && section.lockedBy && !section.lockedBy.equals(userId)) {
      const errorResponse = createErrorResponse('LOCKED', 'Section is locked by another user');
      return NextResponse.json(errorResponse, { status: 423 });
    }

    // Update section fields
    if (title !== undefined) section.title = title;
    if (description !== undefined) section.description = description;
    if (status !== undefined) section.status = status;
    if (keyPoints !== undefined) section.keyPoints = keyPoints;
    if (contentBlocks !== undefined) section.contentBlocks = contentBlocks;
    if (estimatedSlides !== undefined) section.estimatedSlides = estimatedSlides;
    if (order !== undefined) section.order = order;
    section.updated_at = new Date();

    if (userId) storyline.updated_by = userId;
    await storyline.save();

    return NextResponse.json(createSuccessResponse(section, 'Section updated successfully'));

  } catch (error) {
    console.error('Error updating section:', error);
    
    const errorResponse = createErrorResponse('INTERNAL_ERROR', 'Failed to update section', {
      originalError: error.message
    });
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// DELETE /api/storylines/[id]/sections/[sectionId] - Delete a section
export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    
    const { id, sectionId } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const storyline = await Storyline.findOne({ _id: id, is_active: true });
    if (!storyline) {
      const errorResponse = createErrorResponse('NOT_FOUND', 'Storyline not found');
      return NextResponse.json(errorResponse, { status: 404 });
    }

    const sectionIndex = storyline.sections.findIndex(s => s.id === sectionId);
    if (sectionIndex === -1) {
      const errorResponse = createErrorResponse('NOT_FOUND', 'Section not found');
      return NextResponse.json(errorResponse, { status: 404 });
    }

    const section = storyline.sections[sectionIndex];

    // Check if section is locked by another user
    if (section.locked && section.lockedBy && !section.lockedBy.equals(userId)) {
      const errorResponse = createErrorResponse('LOCKED', 'Section is locked by another user');
      return NextResponse.json(errorResponse, { status: 423 });
    }

    // Remove section
    storyline.sections.splice(sectionIndex, 1);
    
    // Reorder remaining sections
    storyline.sections.forEach((section, index) => {
      section.order = index;
    });

    if (userId) storyline.updated_by = userId;
    await storyline.save();

    return NextResponse.json(createSuccessResponse(null, 'Section deleted successfully'));

  } catch (error) {
    console.error('Error deleting section:', error);
    
    const errorResponse = createErrorResponse('INTERNAL_ERROR', 'Failed to delete section', {
      originalError: error.message
    });
    return NextResponse.json(errorResponse, { status: 500 });
  }
}