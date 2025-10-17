import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db/mongoose.js';
import Storyline from '../../../../lib/models/Storyline.js';
import {
  filterSectionsForRegeneration,
  createRegenerationPayload,
  mergeRegeneratedStoryline,
  validateRegenerationRequest,
  createStorylineBackup
} from '../../../../lib/storyline/regenerationUtils.js';
import { createSectionRecord, ensureSectionHasRenderedContent } from '../../../../lib/storyline/sectionUtils.js';

/**
 * Calls the actual AI agent for storyline generation
 */
async function generateStorylineWithAgent(prompt, context = {}) {
  try {
    // Extract project information from context
    const { projectId, projectData, deliverableData, clientData } = context;
    
    if (!projectId) {
      throw new Error('Project ID is required for storyline generation');
    }

    // Call the actual storyline generation API
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ai/generate-storyline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId,
        projectData: projectData || {},
        deliverableData: deliverableData || {},
        clientData: clientData || {}
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Storyline generation failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Storyline generation failed');
    }

    // Return the generated storyline data
    return result.data;
    
  } catch (error) {
    console.error('Error calling storyline generation API:', error);
    
    // Fallback to a minimal response if API call fails
    return {
      title: "Regenerated Strategic Analysis",
      executiveSummary: {
        title: "Executive Summary",
        keyMessages: ["Content generation in progress..."],
        content: "Content generation in progress. Please try again if this persists."
      },
      presentationFlow: "Content generation in progress...",
      callToAction: {
        title: "Next Steps",
        keyMessages: ["Content generation in progress..."]
      },
      mainSections: []
    };
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { 
      storylineId, 
      regenerationType = 'full', 
      preserveLocked = true,
      projectId,
      projectData = {},
      deliverableData = {},
      clientData = {}
    } = body;

    // Find existing storyline first
    const existingStoryline = await Storyline.findById(storylineId);
    if (!existingStoryline) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Storyline not found' 
        },
        { status: 404 }
      );
    }

    // Validate storyline has sections to regenerate
    const validation = validateRegenerationRequest(existingStoryline);
    if (!validation.valid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid regeneration request', 
          details: validation.errors 
        },
        { status: 400 }
      );
    }

    // Create backup before regeneration
    await createStorylineBackup(existingStoryline);

    // Filter sections for regeneration
    const { lockedSections, draftSections } = filterSectionsForRegeneration(existingStoryline);
    
    // Determine which sections to regenerate based on regeneration type
    const sectionsToRegenerate = regenerationType === 'full' ? 
      [...draftSections, ...lockedSections] : 
      draftSections;
    const sectionsToPreserve = regenerationType === 'full' ? 
      [] : 
      lockedSections;

    console.log(`🔄 Regenerating ${sectionsToRegenerate.length} sections, preserving ${sectionsToPreserve.length} sections`);

    // Create regeneration payload
    const regenerationPayload = createRegenerationPayload(
      existingStoryline,
      sectionsToRegenerate,
      regenerationType,
      { projectId, projectData, deliverableData, clientData }
    );

    // Generate new storyline content
    const regeneratedContent = await generateStorylineWithAgent(
      regenerationPayload.prompt,
      { projectId, projectData, deliverableData, clientData }
    );

    // Merge regenerated content with existing storyline
    const mergedStoryline = mergeRegeneratedStoryline(
      existingStoryline,
      regeneratedContent,
      sectionsToRegenerate,
      sectionsToPreserve
    );

    // Update storyline in database
    const updatedStoryline = await Storyline.findByIdAndUpdate(
      storylineId,
      mergedStoryline,
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      data: {
        storyline: updatedStoryline,
        regeneratedSections: sectionsToRegenerate.length,
        preservedSections: sectionsToPreserve.length
      }
    });

  } catch (error) {
    console.error('Storyline regeneration error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to regenerate storyline', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check regeneration status/preview
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storylineId = searchParams.get('storylineId');
    
    if (!storylineId) {
      return NextResponse.json(
        { success: false, error: 'Storyline ID is required' },
        { status: 400 }
      );
    }

    await dbConnect();
    
    const storyline = await Storyline.findById(storylineId);
    if (!storyline) {
      return NextResponse.json(
        { success: false, error: 'Storyline not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        storyline,
        lastUpdated: storyline.updated_at,
        sectionCount: storyline.sections?.length || 0
      }
    });

  } catch (error) {
    console.error('Error fetching storyline:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch storyline', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}