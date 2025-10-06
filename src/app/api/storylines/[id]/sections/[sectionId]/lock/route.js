import { NextResponse } from 'next/server';
import dbConnect from '../../../../../../../lib/db/mongoose.js';
import Storyline from '../../../../../../../lib/models/Storyline.js';
import { 
  createSuccessResponse, 
  createErrorResponse 
} from '../../../../../../../lib/api/errors.js';

// POST /api/storylines/[id]/sections/[sectionId]/lock - Lock a section
export async function POST(request, { params }) {
  try {
    await dbConnect();
    
    const { id, sectionId } = params;
    const { userId } = await request.json();

    if (!userId) {
      const errorResponse = createErrorResponse('VALIDATION_ERROR', 'User ID is required');
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const storyline = await Storyline.findOne({ _id: id, is_active: true })
      .populate('sections.lockedBy', 'name email');
    
    if (!storyline) {
      const errorResponse = createErrorResponse('NOT_FOUND', 'Storyline not found');
      return NextResponse.json(errorResponse, { status: 404 });
    }

    const section = storyline.sections.find(s => s.id === sectionId);
    if (!section) {
      const errorResponse = createErrorResponse('NOT_FOUND', 'Section not found');
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Check if already locked by another user
    if (section.locked && section.lockedBy && !section.lockedBy._id.equals(userId)) {
      const errorResponse = createErrorResponse('LOCKED', 'Section is already locked by another user', {
        lockedBy: section.lockedBy,
        lockedAt: section.lockedAt
      });
      return NextResponse.json(errorResponse, { status: 423 });
    }

    // Lock the section
    section.locked = true;
    section.lockedBy = userId;
    section.lockedAt = new Date();
    section.updated_at = new Date();

    storyline.updated_by = userId;
    await storyline.save();

    return NextResponse.json(createSuccessResponse({
      sectionId,
      locked: true,
      lockedBy: userId,
      lockedAt: section.lockedAt
    }, 'Section locked successfully'));

  } catch (error) {
    console.error('Error locking section:', error);
    
    const errorResponse = createErrorResponse('INTERNAL_ERROR', 'Failed to lock section', {
      originalError: error.message
    });
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// DELETE /api/storylines/[id]/sections/[sectionId]/lock - Unlock a section
export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    
    const { id, sectionId } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      const errorResponse = createErrorResponse('VALIDATION_ERROR', 'User ID is required');
      return NextResponse.json(errorResponse, { status: 400 });
    }

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

    // Check if section is locked by this user or if user has permission
    if (section.locked && section.lockedBy && !section.lockedBy.equals(userId)) {
      const errorResponse = createErrorResponse('FORBIDDEN', 'Section is locked by another user');
      return NextResponse.json(errorResponse, { status: 403 });
    }

    // Unlock the section
    section.locked = false;
    section.lockedBy = undefined;
    section.lockedAt = undefined;
    section.updated_at = new Date();

    storyline.updated_by = userId;
    await storyline.save();

    return NextResponse.json(createSuccessResponse({
      sectionId,
      locked: false
    }, 'Section unlocked successfully'));

  } catch (error) {
    console.error('Error unlocking section:', error);
    
    const errorResponse = createErrorResponse('INTERNAL_ERROR', 'Failed to unlock section', {
      originalError: error.message
    });
    return NextResponse.json(errorResponse, { status: 500 });
  }
}