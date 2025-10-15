import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/db/mongoose.js';
import Storyline from '../../../lib/models/Storyline.js';
import Deliverable from '../../../lib/models/Deliverable.js';
import { createSectionRecord, ensureSectionHasRenderedContent } from '../../../lib/storyline/sectionUtils.js';

export async function POST(request) {
  try {
    await dbConnect();
    
    const { deliverableData, deliverableId, userId, isRegeneration, existingStoryline } = await request.json();
    
    console.log('🔍 API Debug - Received deliverableId:', deliverableId);
    console.log('🔍 API Debug - Received deliverableData:', deliverableData);
    console.log('🔍 API Debug - isRegeneration:', isRegeneration);
    console.log('🔍 API Debug - existingStoryline sections:', existingStoryline?.sections?.length);
    console.log('🔍 API Debug - Type of deliverableId:', typeof deliverableId);
    
    // Extract key information from deliverable data
    const {
      name,
      type,
      audience,
      brief,
      format,
      documentLength,
      dueDate
    } = deliverableData;

    // Handle regeneration logic if this is a regeneration request
    let lockedSections = [];
    let draftSections = [];
    let regenerationContext = '';
    
    if (isRegeneration && existingStoryline) {
      console.log('🔄 Processing regeneration request with existing storyline');
      
      // Filter sections into locked and draft
      lockedSections = existingStoryline.sections?.filter(section => 
        section.locked === true || section.status === 'final'
      ) || [];
      
      draftSections = existingStoryline.sections?.filter(section => 
        section.locked !== true && section.status !== 'final'
      ) || [];
      
      console.log('📊 Regeneration breakdown:', {
        totalSections: existingStoryline.sections?.length || 0,
        lockedSections: lockedSections.length,
        draftSections: draftSections.length
      });

      // Create regeneration context for the AI prompt
      regenerationContext = `
**REGENERATION CONTEXT:**
- This is a storyline REGENERATION preserving ${lockedSections.length} locked sections
- Only regenerate the ${draftSections.length} draft sections listed below
- Maintain flow and order with existing locked sections

**LOCKED SECTIONS (PRESERVE EXACTLY):**
${lockedSections.map(section => `
- Order ${section.order}: "${section.title}" (Status: ${section.status})
  Key Points: ${section.keyPoints?.slice(0, 2).join(', ') || 'None'}
`).join('')}

**SECTIONS TO REGENERATE:**
${draftSections.map(section => `
- Order ${section.order}: "${section.title}" (Status: ${section.status})
  Current Description: ${section.description || 'None'}
`).join('')}

IMPORTANT: Only generate new content for draft sections. Maintain logical flow with locked sections.
`;
    }

    // Create a detailed prompt for the storyline generation agent
    const storylinePrompt = `${regenerationContext}
You are a strategic consultant and presentation expert. Generate a comprehensive storyline for the following deliverable:

**Deliverable Details:**
- Name: ${name}
- Type: ${type}
- Format: ${format}
- Document Length: ${documentLength} pages
- Target Audience: ${audience?.join(', ') || 'Not specified'}
- Due Date: ${dueDate}

**Brief:**
${brief}

**Task:**
Create a detailed storyline structure that includes:

1. **Executive Summary Section** (2-3 key points)
2. **Main Content Sections** (4-6 sections with clear flow)
3. **Supporting Evidence/Data** (what data/research is needed)
4. **Call to Action** (clear next steps)
5. **Appendix Items** (supporting materials)

For each section, provide:
- Section title
- Key messages (2-3 bullet points)
- Recommended content type (text, charts, diagrams, etc.)
- Estimated page allocation

Format the response as a structured JSON object with clear sections and subsections that can be easily displayed in the UI.

Make sure the storyline is:
- Audience-appropriate and professionally structured
- Logically flowing from problem/context to solution/action
- Actionable and specific to the brief provided
- Appropriate for the specified document length and format
`;

    // Verify deliverable exists if deliverableId provided
    let deliverable = null;
    if (deliverableId) {
      deliverable = await Deliverable.findById(deliverableId);
      if (!deliverable) {
        console.log('❌ Deliverable not found with ID:', deliverableId);
        console.log('🔍 Available deliverables:');
        const availableDeliverables = await Deliverable.find({ is_active: true }).select('_id name').limit(5);
        console.log(availableDeliverables);
        
        // Instead of failing, let's continue without saving to database
        console.log('⚠️ Continuing storyline generation without database persistence');
      }
    } else {
      console.log('⚠️ No deliverableId provided, storyline will not be saved to database');
    }

    // Simulate calling a custom AI agent
    // In a real implementation, this would call your preferred AI service
    const storylineResponse = await generateStorylineWithAgent(storylinePrompt);
    
    console.log('🔍 Storyline response structure:', JSON.stringify(storylineResponse, null, 2));
    
    // Save storyline to database if deliverable is valid
    let savedStoryline = null;
    if (deliverable && deliverableId) {
      try {
        // Convert storylineResponse to database format
        let sections = [];
        
        const timestamp = new Date();

        if (isRegeneration && existingStoryline) {
          console.log('🔄 Merging locked sections with regenerated content');

          const normalizedLockedSections = lockedSections.map(section => {
            const orderValue = Number.isFinite(section.order) ? section.order : 0;
            return {
              ...ensureSectionHasRenderedContent(section, {
                order: orderValue,
                fallbackTitle: section.title,
                defaultContentType: section.contentBlocks?.[0]?.type
              }),
              order: orderValue,
              locked: true
            };
          });

          const lockedByOrder = new Map(
            normalizedLockedSections.map(section => [section.order, section])
          );

          const lockedOrders = new Set(lockedByOrder.keys());
          const newSectionCandidates = [];

          if (!lockedOrders.has(0)) {
            newSectionCandidates.push(
              createSectionRecord(storylineResponse.executiveSummary, {
                id: 'exec_summary',
                order: 0,
                status: 'draft',
                locked: false,
                fallbackTitle: storylineResponse.executiveSummary?.title || 'Executive Summary',
                defaultContentType: 'Key Insights',
                createdAt: timestamp,
                updatedAt: timestamp
              })
            );
          }

          const mainSections = Array.isArray(storylineResponse.mainSections)
            ? storylineResponse.mainSections
            : [];

          mainSections.forEach((section, index) => {
            const order = index + 1;
            if (lockedOrders.has(order)) return;
            newSectionCandidates.push(
              createSectionRecord(section, {
                id: section.id || `section_${order}`,
                order,
                status: 'draft',
                locked: false,
                fallbackTitle: section.title || `Section ${order}`,
                defaultContentType: section.contentType || 'Content Block',
                createdAt: timestamp,
                updatedAt: timestamp
              })
            );
          });

          const callToActionOrder = mainSections.length + 1;
          if (!lockedOrders.has(callToActionOrder)) {
            newSectionCandidates.push(
              createSectionRecord(storylineResponse.callToAction, {
                id: 'call_to_action',
                order: callToActionOrder,
                status: 'draft',
                locked: false,
                fallbackTitle: storylineResponse.callToAction?.title || 'Next Steps',
                defaultContentType: storylineResponse.callToAction?.contentType || 'Process Flow',
                createdAt: timestamp,
                updatedAt: timestamp
              })
            );
          }

          const newSectionsByOrder = new Map(
            newSectionCandidates.map(section => [section.order, section])
          );

          const allOrders = new Set([
            ...lockedByOrder.keys(),
            ...newSectionsByOrder.keys()
          ]);

          sections = Array.from(allOrders)
            .sort((a, b) => a - b)
            .map(order => lockedByOrder.get(order) || newSectionsByOrder.get(order))
            .filter(Boolean);

          console.log('✅ Merged sections:', {
            totalSections: sections.length,
            preservedLocked: normalizedLockedSections.length,
            regeneratedNew: newSectionCandidates.length
          });
        } else {
          const builtSections = [];

          builtSections.push(
            createSectionRecord(storylineResponse.executiveSummary, {
              id: 'exec_summary',
              order: 0,
              status: 'draft',
              locked: false,
              fallbackTitle: storylineResponse.executiveSummary?.title || 'Executive Summary',
              defaultContentType: 'Key Insights',
              createdAt: timestamp,
              updatedAt: timestamp
            })
          );

          const mainSections = Array.isArray(storylineResponse.mainSections)
            ? storylineResponse.mainSections
            : [];

          mainSections.forEach((section, index) => {
            builtSections.push(
              createSectionRecord(section, {
                id: section.id || `section_${index + 1}`,
                order: index + 1,
                status: 'not_started',
                locked: false,
                fallbackTitle: section.title || `Section ${index + 1}`,
                defaultContentType: section.contentType || 'Content Block',
                createdAt: timestamp,
                updatedAt: timestamp
              })
            );
          });

          builtSections.push(
            createSectionRecord(storylineResponse.callToAction, {
              id: 'call_to_action',
              order: mainSections.length + 1,
              status: 'not_started',
              locked: false,
              fallbackTitle: storylineResponse.callToAction?.title || 'Next Steps',
              defaultContentType: storylineResponse.callToAction?.contentType || 'Process Flow',
              createdAt: timestamp,
              updatedAt: timestamp
            })
          );

          sections = builtSections.filter(Boolean);
        }
        
        const executiveSummarySection = sections.find(section => section.id === 'exec_summary');
        const callToActionSection = sections.find(section => section.id === 'call_to_action');

        const storylineDoc = {
          deliverable: deliverableId,
          title: `${name} Storyline`,
          executiveSummary: executiveSummarySection?.description
            || executiveSummarySection?.keyPoints?.join('. ')
            || executiveSummarySection?.markdown
            || 'AI-generated executive summary.',
          presentationFlow: 'Structured narrative flow connecting all sections logically.',
          callToAction: callToActionSection?.description
            || callToActionSection?.keyPoints?.join('. ')
            || callToActionSection?.markdown
            || 'Recommended next steps based on analysis.',
          sections: sections,
          topic: name,
          industry: 'Financial Services', // Default based on CBDC context
          audience: Array.isArray(audience) ? audience : audience ? [audience] : [],
          objectives: brief || '',
          presentationStyle: 'consulting',
          complexity: 'intermediate',
          generationSource: 'ai',
          aiPrompt: storylinePrompt,
          created_by: userId || deliverable.created_by,
          updated_by: userId || deliverable.created_by,
          is_active: true
        };

        // Check if storyline already exists for this deliverable
        const existingStoryline = await Storyline.findOne({ deliverable: deliverableId, is_active: true });
        
        if (existingStoryline) {
          // Update existing storyline
          Object.assign(existingStoryline, storylineDoc);
          existingStoryline.version = incrementVersion(existingStoryline.version);
          savedStoryline = await existingStoryline.save();
        } else {
          // Create new storyline
          savedStoryline = new Storyline(storylineDoc);
          await savedStoryline.save();
        }

        console.log('✅ Storyline saved to database:', savedStoryline._id);
      } catch (dbError) {
        console.error('❌ Error saving storyline to database:', dbError);
        console.log('🔍 Attempted storyline document:', JSON.stringify(storylineDoc, null, 2));
        // Continue without failing the request
      }
    }
    
    return NextResponse.json({
      success: true,
      storyline: storylineResponse,
      storylineId: savedStoryline?._id,
      metadata: {
        generatedAt: new Date().toISOString(),
        deliverableName: name,
        estimatedLength: documentLength,
        savedToDatabase: !!savedStoryline
      }
    });

  } catch (error) {
    console.error('Error generating storyline:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate storyline' },
      { status: 500 }
    );
  }
}

// Custom agent function for storyline generation
async function generateStorylineWithAgent(prompt) {
  const AGENT_ID = '68dddd9ac1b3b5cc990ad5f0';
  
  // Check if agent API is configured
  if (!process.env.AGENT_API_URL || !process.env.AGENT_API_KEY) {
    console.log('Agent API not configured, using mock storyline generation');
    return generateMockStoryline();
  }
  
  try {
    // Call Vave AI custom agent API with the specific agent ID
    const agentResponse = await fetch(`${process.env.AGENT_API_URL}/api/custom-agents/${AGENT_ID}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.AGENT_API_KEY,
      },
      body: JSON.stringify({
        message: prompt,
        temperature: 0.7,
        maxTokens: 2000
      }),
    });

    if (!agentResponse.ok) {
      throw new Error(`Agent API call failed: ${agentResponse.status}`);
    }

    const agentResult = await agentResponse.json();
    
    // Parse the agent response into our expected format
    return parseAgentResponse(agentResult);
    
  } catch (error) {
    console.error('Error calling custom agent:', error);
    // Fallback to mock response if agent call fails
    return generateMockStoryline();
  }
}

// Parse agent response into structured format
function parseAgentResponse(agentResult) {
  try {
    // Vave AI typically returns response in 'response' or 'content' field
    const content = agentResult.response || agentResult.content || agentResult.message || agentResult;
    
    // Try to parse as JSON if it's a string
    if (typeof content === 'string') {
      try {
        return JSON.parse(content);
      } catch {
        // If not valid JSON, return mock storyline for now
        console.log('Agent response was not valid JSON, using mock storyline');
        return generateMockStoryline();
      }
    }
    
    return content;
  } catch (error) {
    console.error('Error parsing agent response:', error);
    return generateMockStoryline();
  }
}

// Fallback mock response
function generateMockStoryline() {
  return {
    executiveSummary: {
      title: "Executive Summary",
      keyMessages: [
        "CBDC implementation represents a critical strategic opportunity for competitive advantage",
        "Comprehensive technical and regulatory framework required for successful deployment",
        "Phased implementation approach recommended with clear milestones and risk mitigation"
      ],
      contentType: "Text with key statistics",
      estimatedPages: 2
    },
    mainSections: [
      {
        title: "Market Context & Strategic Rationale",
        keyMessages: [
          "Global CBDC adoption trends and competitive landscape analysis",
          "Strategic benefits and business case for implementation",
          "Risk assessment and mitigation strategies"
        ],
        contentType: "Charts, market data, comparative analysis",
        estimatedPages: 4
      },
      {
        title: "Technical Architecture & Infrastructure",
        keyMessages: [
          "Core technology stack and system architecture requirements",
          "Integration with existing banking infrastructure",
          "Security, scalability, and performance considerations"
        ],
        contentType: "Technical diagrams, architecture charts",
        estimatedPages: 6
      },
      {
        title: "Regulatory Compliance & Legal Framework",
        keyMessages: [
          "Current regulatory landscape and compliance requirements",
          "Legal considerations and risk management",
          "Stakeholder engagement and approval processes"
        ],
        contentType: "Regulatory framework charts, compliance checklists",
        estimatedPages: 4
      },
      {
        title: "Implementation Roadmap",
        keyMessages: [
          "Phased implementation timeline with key milestones",
          "Resource requirements and team structure",
          "Success metrics and performance indicators"
        ],
        contentType: "Gantt charts, milestone timelines, resource allocation",
        estimatedPages: 5
      },
      {
        title: "Financial Impact & ROI Analysis",
        keyMessages: [
          "Cost-benefit analysis and investment requirements",
          "Revenue projections and ROI calculations",
          "Budget allocation and financial planning"
        ],
        contentType: "Financial models, charts, ROI projections",
        estimatedPages: 3
      }
    ],
    callToAction: {
      title: "Recommended Next Steps",
      keyMessages: [
        "Immediate actions required for project initiation",
        "Key stakeholder approvals and sign-offs needed",
        "Timeline for decision-making and implementation start"
      ],
      contentType: "Action items checklist, timeline",
      estimatedPages: 1
    },
    appendix: [
      "Detailed technical specifications",
      "Regulatory compliance documentation",
      "Market research data and sources",
      "Financial modeling assumptions",
      "Risk assessment matrix"
    ],
    totalPages: 25,
    qualityScore: 8.5,
    recommendations: [
      "Include specific case studies from successful CBDC implementations",
      "Add detailed security framework section",
      "Expand on international regulatory comparison"
    ],
    generatedBy: "Agent ID: 68dddd9ac1b3b5cc990ad5f0 (fallback mode)"
  };
}

// Helper function to increment version
function incrementVersion(currentVersion) {
  if (!currentVersion) return '1.0';
  
  const parts = currentVersion.split('.');
  const major = parseInt(parts[0]) || 1;
  const minor = parseInt(parts[1]) || 0;
  
  return `${major}.${minor + 1}`;
}

// Helper function to map content type to content block type
