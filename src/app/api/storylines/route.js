import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/db/mongoose.js';
import Storyline from '../../../lib/models/Storyline.js';
import Deliverable from '../../../lib/models/Deliverable.js';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createValidationError 
} from '../../../lib/api/errors.js';
import { 
  normalizeStatus, 
  normalizeStorylineStatus,
  SECTION_STATUS,
  STORYLINE_STATUS 
} from '../../../lib/constants/enums.js';

// GET /api/storylines - Get storylines with optional filters
export async function GET(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const deliverableId = searchParams.get('deliverable') || searchParams.get('deliverableId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;

    // Build query
    const query = { is_active: true };
    if (deliverableId) query.deliverable = deliverableId;
    if (status) query.status = status;

    console.log('🔍 API: Fetching storylines with query:', { deliverableId, status }, 'timestamp:', new Date().toISOString());

    // Execute query with pagination
    const storylines = await Storyline.find(query)
      .populate('deliverable', 'name type status')
      .populate('created_by', 'name email')
      .populate('updated_by', 'name email')
      .populate('sections.lockedBy', 'name email')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Storyline.countDocuments(query);

    console.log('✅ API: Found', storylines.length, 'storylines for deliverable:', deliverableId);

    const responseData = {
      storylines,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

    return NextResponse.json(createSuccessResponse(responseData, 'Storylines retrieved successfully'));

  } catch (error) {
    console.error('Error fetching storylines:', error);
    
    const errorResponse = createErrorResponse('INTERNAL_ERROR', 'Failed to fetch storylines', {
      originalError: error.message
    });
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// POST /api/storylines - Create a new storyline
export async function POST(request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const {
      deliverable,
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
      userId // For now, will be replaced with actual user authentication
    } = body;

    // Validate required fields
    if (!deliverable) {
      const errorResponse = createValidationError(['Deliverable ID is required'], 'deliverable');
      return NextResponse.json(errorResponse, { status: 400 });
    }

    if (!title) {
      const errorResponse = createValidationError(['Title is required'], 'title');
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Verify deliverable exists
    const deliverableDoc = await Deliverable.findById(deliverable);
    if (!deliverableDoc) {
      const errorResponse = createErrorResponse('NOT_FOUND', 'Deliverable not found');
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Check if storyline already exists for this deliverable
    const normalizedSections = (sections || []).map((section, index) => {
      return {
        id: section.id || section.sectionId || `section_${index + 1}`,
        title: section.title || `Section ${index + 1}`,
        description: section.description || '',
        status: normalizeStatus(section.status, SECTION_STATUS.DRAFT),
        order: section.order !== undefined ? section.order : index,
        keyPoints: Array.isArray(section.keyPoints) ? section.keyPoints : [],
        contentBlocks: Array.isArray(section.contentBlocks) ? section.contentBlocks : [],
        estimatedSlides: section.estimatedSlides || 3,
        locked: !!section.locked,
        lockedBy: section.locked ? section.lockedBy : undefined,
        lockedAt: section.locked ? (section.lockedAt ? new Date(section.lockedAt) : new Date()) : undefined,
        created_at: section.created_at ? new Date(section.created_at) : new Date(),
        updated_at: new Date()
      };
    });

    const storylinePayload = {
      deliverable,
      title,
      executiveSummary,
      presentationFlow,
      callToAction,
      sections: normalizedSections,
      topic,
      industry,
      audience: Array.isArray(audience) ? audience : [audience].filter(Boolean),
      objectives,
      presentationStyle: presentationStyle || 'consulting',
      complexity: complexity || 'intermediate',
      generationSource: 'ai',
      created_by: userId || deliverableDoc.created_by,
      updated_by: userId || deliverableDoc.created_by,
      is_active: true
    };

    let storyline = await Storyline.findOne({ deliverable, is_active: true });

    if (storyline) {
      Object.assign(storyline, {
        title: storylinePayload.title,
        executiveSummary: storylinePayload.executiveSummary,
        presentationFlow: storylinePayload.presentationFlow,
        callToAction: storylinePayload.callToAction,
        sections: storylinePayload.sections,
        topic: storylinePayload.topic,
        industry: storylinePayload.industry,
        audience: storylinePayload.audience,
        objectives: storylinePayload.objectives,
        presentationStyle: storylinePayload.presentationStyle,
        complexity: storylinePayload.complexity,
        generationSource: 'ai',
        updated_by: storylinePayload.updated_by,
        updated_at: new Date()
      });

      await storyline.save();
      await storyline.populate([
        { path: 'deliverable', select: 'name type status' },
        { path: 'created_by', select: 'name email' },
        { path: 'updated_by', select: 'name email' },
        { path: 'sections.lockedBy', select: 'name email' }
      ]);

      return NextResponse.json(createSuccessResponse(storyline, 'Storyline updated successfully'));
    }

    storyline = new Storyline(storylinePayload);
    await storyline.save();

    await storyline.populate([
      { path: 'deliverable', select: 'name type status' },
      { path: 'created_by', select: 'name email' },
      { path: 'updated_by', select: 'name email' },
      { path: 'sections.lockedBy', select: 'name email' }
    ]);

    return NextResponse.json(createSuccessResponse(storyline, 'Storyline created successfully'), { status: 201 });

  } catch (error) {
    console.error('Error creating storyline:', error);
    
    const errorResponse = createErrorResponse('INTERNAL_ERROR', 'Failed to create storyline', {
      originalError: error.message
    });
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
