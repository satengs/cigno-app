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
 * Simulates AI agent storyline generation
 * In production, this would call your actual AI service
 */
async function generateStorylineWithAgent(prompt, context = {}) {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Parse the regeneration context from the prompt
  const isPartialRegeneration = prompt.includes('regenerationType: "partial"');
  const preserveLocked = prompt.includes('preserveLocked: true');
  
  // Return a structured response that matches the expected format
  return {
    title: "Regenerated Strategic Analysis",
    executiveSummary: {
      title: "Executive Summary", 
      keyMessages: [
        "Strategic analysis reveals key opportunities for growth",
        "Market conditions are favorable for expansion",
        "Recommended approach balances risk and opportunity"
      ]
    },
    mainSections: [
      {
        title: "Market Analysis",
        keyMessages: [
          "Current market shows strong demand signals",
          "Competitive landscape analysis reveals positioning opportunities",
          "Customer segment analysis indicates expansion potential"
        ],
        contentType: "Market Analysis",
        pageAllocation: 3
      },
      {
        title: "Strategic Recommendations",
        keyMessages: [
          "Implement phased approach to market entry",
          "Focus on key customer segments initially",
          "Build strategic partnerships for accelerated growth"
        ],
        contentType: "Strategic Framework",
        pageAllocation: 4
      },
      {
        title: "Implementation Plan",
        keyMessages: [
          "Define clear milestones and success metrics",
          "Allocate resources across key initiatives",
          "Establish governance structure for execution"
        ],
        contentType: "Process Flow",
        pageAllocation: 3
      }
    ],
    callToAction: {
      title: "Next Steps",
      keyMessages: [
        "Secure leadership approval for strategic direction",
        "Initiate planning for Phase 1 implementation", 
        "Establish steering committee for ongoing oversight"
      ]
    },
    sections: [
      {
        id: "exec_summary_regen",
        title: "Executive Summary",
        description: "Strategic analysis reveals key opportunities for growth and market expansion.",
        status: "draft",
        order: 0,
        keyPoints: [
          "Strategic analysis reveals key opportunities for growth",
          "Market conditions are favorable for expansion",
          "Recommended approach balances risk and opportunity"
        ],
        contentBlocks: [{
          type: 'Key Insights',
          items: ["Strategic analysis reveals key opportunities for growth", "Market conditions are favorable for expansion"]
        }]
      },
      {
        id: "market_analysis_regen",
        title: "Market Analysis", 
        description: "Current market shows strong demand signals with competitive positioning opportunities.",
        status: "draft",
        order: 1,
        keyPoints: [
          "Current market shows strong demand signals",
          "Competitive landscape analysis reveals positioning opportunities",
          "Customer segment analysis indicates expansion potential"
        ],
        contentBlocks: [{
          type: 'Market Analysis',
          items: ["Current market shows strong demand signals", "Competitive landscape analysis reveals positioning opportunities"]
        }]
      },
      {
        id: "strategic_recommendations_regen",
        title: "Strategic Recommendations",
        description: "Implement phased approach to market entry with focus on key customer segments.",
        status: "draft", 
        order: 2,
        keyPoints: [
          "Implement phased approach to market entry",
          "Focus on key customer segments initially", 
          "Build strategic partnerships for accelerated growth"
        ],
        contentBlocks: [{
          type: 'Strategic Framework',
          items: ["Implement phased approach to market entry", "Focus on key customer segments initially"]
        }]
      },
      {
        id: "implementation_plan_regen",
        title: "Implementation Plan",
        description: "Define clear milestones and success metrics with proper resource allocation.",
        status: "draft",
        order: 3,
        keyPoints: [
          "Define clear milestones and success metrics",
          "Allocate resources across key initiatives",
          "Establish governance structure for execution"
        ],
        contentBlocks: [{
          type: 'Process Flow',
          items: ["Define clear milestones and success metrics", "Allocate resources across key initiatives"]
        }]
      },
      {
        id: "next_steps_regen",
        title: "Next Steps",
        description: "Secure leadership approval and initiate planning for Phase 1 implementation.",
        status: "draft",
        order: 4,
        keyPoints: [
          "Secure leadership approval for strategic direction",
          "Initiate planning for Phase 1 implementation",
          "Establish steering committee for ongoing oversight"
        ],
        contentBlocks: [{
          type: 'Process Flow',
          items: ["Secure leadership approval for strategic direction", "Initiate planning for Phase 1 implementation"]
        }]
      }
    ]
  };
}

export async function POST(request) {
  try {
    await dbConnect();

    const {
      storylineId,
      regenerationPayload,
      backup,
      projectData = {},
      deliverableData = {},
      clientData = {}
    } = await request.json();
    
    console.log('🔄 Storyline Regeneration Request:', {
      storylineId,
      lockedSections: regenerationPayload.regenerationContext?.lockedSectionCount,
      draftSections: regenerationPayload.regenerationContext?.draftSectionCount
    });
    
    // Validate request
    if (!storylineId) {
      return NextResponse.json({
        success: false,
        error: 'Storyline ID is required'
      }, { status: 400 });
    }
    
    // Fetch existing storyline
    const existingStoryline = await Storyline.findById(storylineId);
    if (!existingStoryline) {
      return NextResponse.json({
        success: false,
        error: 'Storyline not found'
      }, { status: 404 });
    }
    
    // Validate storyline for regeneration
    const validation = validateRegenerationRequest(existingStoryline);
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: 'Invalid storyline for regeneration',
        details: validation.errors
      }, { status: 400 });
    }
    
    // Filter sections into locked and draft
    const { lockedSections, draftSections } = filterSectionsForRegeneration(existingStoryline);
    
    console.log('📊 Regeneration Stats:', {
      totalSections: existingStoryline.sections.length,
      lockedSections: lockedSections.length,
      draftSections: draftSections.length,
      lockedTitles: lockedSections.map(s => s.title),
      draftTitles: draftSections.map(s => s.title)
    });
    
    // Create AI prompt for regeneration
    const structuredContext = {
      project: projectData,
      deliverable: deliverableData,
      client: clientData,
      regeneration: {
        lockedSections: lockedSections.map(({ id, title, order, keyPoints, contentBlocks, status, description }) => ({
          id,
          title,
          order,
          status,
          description,
          keyPoints,
          contentBlocks
        })),
        draftSections: draftSections.map(({ id, title, order, keyPoints, contentBlocks, status, description }) => ({
          id,
          title,
          order,
          status,
          description,
          keyPoints,
          contentBlocks
        }))
      }
    };

    const regenerationPrompt = `
You are a strategic consultant regenerating a storyline while preserving locked sections.

**REGENERATION CONTEXT:**
- This is a PARTIAL regeneration (preserveLocked: true)
- ${lockedSections.length} sections are LOCKED and must be preserved
- ${draftSections.length} sections need regeneration
- Total sections: ${existingStoryline.sections.length}

**PROJECT CONTEXT:**
${JSON.stringify(projectData || {}, null, 2)}

**CLIENT CONTEXT:**
${JSON.stringify(clientData || {}, null, 2)}

**DELIVERABLE CONTEXT:**
${JSON.stringify(deliverableData || {}, null, 2)}

**CURRENT STORYLINE STRUCTURE:**
${JSON.stringify(existingStoryline.sections.map(section => ({
  id: section.id,
  title: section.title,
  status: section.locked ? 'LOCKED' : (section.status || 'draft'),
  order: section.order,
  description: section.description,
  keyPoints: section.keyPoints
})), null, 2)}

**REGENERATION REQUIREMENTS:**
1. Preserve locked sections exactly as provided
2. Regenerate only the draft sections listed above
3. Maintain storyline flow and logical progression
4. Provide structured sections with titles, descriptions, key points, content blocks, and metadata
5. Ensure consistent tone and professional language
6. Include actionable insights and recommendations where relevant
7. Indicate status for each section (draft/final)

**OUTPUT FORMAT:**
Return a structured JSON object with the regenerated storyline (excluding unchanged locked sections) and clearly mark section IDs to facilitate merging.
`;
    
    // Generate new storyline content with AI
    const aiResponse = await generateStorylineWithAgent(regenerationPrompt, structuredContext);
    
    // Merge AI response with locked sections
    const mergedStoryline = mergeRegeneratedStoryline(
      existingStoryline,
      aiResponse, 
      lockedSections
    );
    
    // Save updated storyline to database
    Object.assign(existingStoryline, mergedStoryline);
    const savedStoryline = await existingStoryline.save();
    
    console.log('✅ Storyline regenerated successfully:', {
      storylineId: savedStoryline._id,
      version: savedStoryline.version,
      sectionsPreserved: lockedSections.length,
      sectionsRegenerated: draftSections.length,
      totalSections: savedStoryline.sections.length
    });
    
    return NextResponse.json({
      success: true,
      storyline: savedStoryline,
      metadata: {
        regeneratedAt: new Date().toISOString(),
        sectionsPreserved: lockedSections.length,
        sectionsRegenerated: draftSections.length,
        totalSections: savedStoryline.sections.length,
        version: savedStoryline.version,
        validation: validation.stats,
        preservedSections: lockedSections.map(s => ({
          id: s.id,
          title: s.title,
          order: s.order
        })),
        regeneratedSections: draftSections.map(s => ({
          id: s.id,
          title: s.title,
          order: s.order
        }))
      }
    });
    
  } catch (error) {
    console.error('❌ Storyline regeneration error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to regenerate storyline',
      details: error.message
    }, { status: 500 });
  }
}

// GET endpoint to check regeneration status/preview
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const storylineId = url.searchParams.get('storylineId');
    
    if (!storylineId) {
      return NextResponse.json({
        success: false,
        error: 'Storyline ID is required'
      }, { status: 400 });
    }
    
    await dbConnect();
    
    const storyline = await Storyline.findById(storylineId);
    if (!storyline) {
      return NextResponse.json({
        success: false,
        error: 'Storyline not found'
      }, { status: 404 });
    }
    
    // Validate and analyze storyline for regeneration
    const validation = validateRegenerationRequest(storyline);
    const { lockedSections, draftSections } = filterSectionsForRegeneration(storyline);
    
    return NextResponse.json({
      success: true,
      analysis: {
        validation,
        stats: {
          totalSections: storyline.sections.length,
          lockedSections: lockedSections.length,
          draftSections: draftSections.length,
          canRegenerate: validation.isValid && draftSections.length > 0
        },
        lockedSections: lockedSections.map(s => ({
          id: s.id,
          title: s.title,
          order: s.order,
          status: s.status
        })),
        draftSections: draftSections.map(s => ({
          id: s.id,
          title: s.title,
          order: s.order,
          status: s.status
        }))
      }
    });
    
  } catch (error) {
    console.error('❌ Regeneration analysis error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze storyline for regeneration',
      details: error.message
    }, { status: 500 });
  }
}
