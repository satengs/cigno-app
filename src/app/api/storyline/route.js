import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { deliverableData } = await request.json();
    
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

    // Create a detailed prompt for the storyline generation agent
    const storylinePrompt = `
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

    // Simulate calling a custom AI agent
    // In a real implementation, this would call your preferred AI service
    const storylineResponse = await generateStorylineWithAgent(storylinePrompt);
    
    return NextResponse.json({
      success: true,
      storyline: storylineResponse,
      metadata: {
        generatedAt: new Date().toISOString(),
        deliverableName: name,
        estimatedLength: documentLength
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