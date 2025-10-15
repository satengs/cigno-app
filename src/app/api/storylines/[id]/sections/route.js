import { NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/db/mongoose.js';
import Storyline from '../../../../../lib/models/Storyline.js';
import { createSectionRecord } from '../../../../../lib/storyline/sectionUtils.js';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createValidationError 
} from '../../../../../lib/api/errors.js';

// POST /api/storylines/[id]/sections - Add a new section to storyline
export async function POST(request, { params }) {
  try {
    await dbConnect();
    
    const { id } = params;
    const body = await request.json();
    const {
      title,
      description,
      keyPoints,
      contentBlocks,
      estimatedSlides,
      order,
      markdown,
      html,
      charts,
      contentType,
      userId
    } = body;

    if (!title) {
      const errorResponse = createValidationError(['Section title is required'], 'title');
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const storyline = await Storyline.findOne({ _id: id, is_active: true });
    if (!storyline) {
      const errorResponse = createErrorResponse('NOT_FOUND', 'Storyline not found');
      return NextResponse.json(errorResponse, { status: 404 });
    }

    const newSection = createSectionRecord({
      title,
      description,
      keyPoints,
      contentBlocks,
      markdown,
      html,
      charts,
      estimatedSlides,
      contentType
    }, {
      id: `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      order: order !== undefined ? order : storyline.sections.length,
      status: 'not_started',
      locked: false,
      fallbackTitle: title,
      defaultContentType: contentType || contentBlocks?.[0]?.type || 'Content Block',
      createdAt: new Date(),
      updatedAt: new Date(),
      estimatedSlides: estimatedSlides || 3
    });

    // Add section to storyline
    storyline.sections.push(newSection);
    
    // Reorder sections if necessary
    storyline.sections.sort((a, b) => a.order - b.order);
    storyline.sections.forEach((section, index) => {
      section.order = index;
    });

    if (userId) storyline.updated_by = userId;
    await storyline.save();

    return NextResponse.json(createSuccessResponse(newSection, 'Section added successfully'), { status: 201 });

  } catch (error) {
    console.error('Error adding section:', error);
    
    const errorResponse = createErrorResponse('INTERNAL_ERROR', 'Failed to add section', {
      originalError: error.message
    });
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
