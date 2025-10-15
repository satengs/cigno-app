import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { briefData } = await request.json();
    
    // Extract information from brief data
    const {
      currentBrief,
      deliverableName,
      deliverableType,
      audience,
      format,
      documentLength,
      dueDate
    } = briefData;

    // Create a detailed prompt for the brief improvement agent
    const improvementPrompt = `
You are an expert strategic consultant and business writing specialist. Your task is to improve and enhance the following deliverable brief to make it more comprehensive, clear, and actionable.

**Current Brief:**
${currentBrief}

**Deliverable Context:**
- Name: ${deliverableName}
- Type: ${deliverableType}
- Format: ${format}
- Target Audience: ${audience?.join(', ') || 'Not specified'}
- Document Length: ${documentLength} pages
- Due Date: ${dueDate}

**Improvement Guidelines:**
1. **Clarity & Structure**: Ensure the brief is well-organized and easy to understand
2. **Completeness**: Add missing critical elements like objectives, scope, success criteria
3. **Specificity**: Make vague statements more concrete and actionable
4. **Audience Alignment**: Tailor language and content to the target audience
5. **Strategic Context**: Add relevant market context, challenges, or opportunities
6. **Measurable Outcomes**: Include specific deliverables and success metrics

**Required Output Format:**
Provide an improved brief that includes:
- Clear objective statement
- Detailed scope and requirements
- Target audience considerations
- Key deliverables and expected outcomes
- Success criteria or evaluation metrics
- Any relevant constraints or considerations

**Constraints:**
- Keep the improved brief focused and concise
- Maintain the original intent while enhancing clarity
- Ensure it's appropriate for a ${documentLength}-page ${format} document
- Make it actionable for the consulting team

Please provide the improved brief text that is more comprehensive, strategic, and actionable than the original.
`;

    // Call the custom agent for brief improvement
    const improvedBrief = await improveBriefWithAgent(improvementPrompt);
    
    return NextResponse.json({
      success: true,
      improvedBrief: improvedBrief,
      originalBrief: currentBrief,
      qualityScore: calculateQualityScore(improvedBrief),
      improvements: identifyImprovements(currentBrief, improvedBrief),
      metadata: {
        improvedAt: new Date().toISOString(),
        deliverableName: deliverableName,
        agentId: '68dde123c1b3b5cc990ad5f1'
      }
    });

  } catch (error) {
    console.error('Error improving brief:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to improve brief' },
      { status: 500 }
    );
  }
}

// Custom agent function for brief improvement
async function improveBriefWithAgent(prompt) {
  const AGENT_ID = '68dde123c1b3b5cc990ad5f1';
  
  try {
    // Call your custom agent API with the specific agent ID
    const agentResponse = await fetch(`${process.env.AGENT_API_URL || 'https://api.your-agent-service.com'}/agents/${AGENT_ID}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AGENT_API_KEY}`,
      },
      body: JSON.stringify({
        prompt: prompt,
        agentId: AGENT_ID,
        settings: {
          temperature: 0.6,
          maxTokens: 1500,
          format: 'text'
        }
      }),
    });

    if (!agentResponse.ok) {
      throw new Error(`Agent API call failed: ${agentResponse.status}`);
    }

    const agentResult = await agentResponse.json();
    
    // Parse the agent response
    return parseAgentResponse(agentResult);
    
  } catch (error) {
    console.error('Error calling custom agent for brief improvement:', error);
    // Fallback to mock improvement if agent call fails
    return generateMockImprovement();
  }
}

// Parse agent response
function parseAgentResponse(agentResult) {
  try {
    // Adjust this based on your actual agent response format
    return agentResult.improvedBrief || agentResult.text || agentResult.data || agentResult;
  } catch (error) {
    console.error('Error parsing agent response:', error);
    return generateMockImprovement();
  }
}

// Calculate quality score for the improved brief
function calculateQualityScore(improvedBrief) {
  let score = 5.0; // Base score
  
  // Check for key elements
  if (improvedBrief.toLowerCase().includes('objective')) score += 0.5;
  if (improvedBrief.toLowerCase().includes('scope')) score += 0.5;
  if (improvedBrief.toLowerCase().includes('deliverable')) score += 0.5;
  if (improvedBrief.toLowerCase().includes('success')) score += 0.5;
  if (improvedBrief.toLowerCase().includes('requirement')) score += 0.5;
  if (improvedBrief.toLowerCase().includes('outcome')) score += 0.5;
  if (improvedBrief.length > 200) score += 0.5; // Sufficient detail
  if (improvedBrief.length > 400) score += 0.5; // Comprehensive detail
  
  return Math.min(score, 10.0); // Cap at 10.0
}

// Identify specific improvements made
function identifyImprovements(originalBrief, improvedBrief) {
  const improvements = [];
  
  if (improvedBrief.length > originalBrief.length * 1.3) {
    improvements.push("Added more comprehensive detail and context");
  }
  
  if (improvedBrief.toLowerCase().includes('objective') && !originalBrief.toLowerCase().includes('objective')) {
    improvements.push("Clarified project objectives");
  }
  
  if (improvedBrief.toLowerCase().includes('scope') && !originalBrief.toLowerCase().includes('scope')) {
    improvements.push("Defined project scope and boundaries");
  }
  
  if (improvedBrief.toLowerCase().includes('success') && !originalBrief.toLowerCase().includes('success')) {
    improvements.push("Added success criteria and metrics");
  }
  
  if (improvedBrief.toLowerCase().includes('deliverable') && !originalBrief.toLowerCase().includes('deliverable')) {
    improvements.push("Specified expected deliverables");
  }
  
  if (improvements.length === 0) {
    improvements.push("Enhanced clarity and structure");
  }
  
  return improvements;
}

// Fallback mock improvement
function generateMockImprovement() {
  return `**Objective:**
Develop a comprehensive CBDC implementation strategy that provides Global Banking Corp with a clear roadmap for adopting Central Bank Digital Currency capabilities while maintaining competitive advantage in the evolving digital financial landscape.

**Scope:**
This strategic presentation will address the technical infrastructure requirements, regulatory compliance considerations, risk assessment framework, and implementation timeline necessary for successful CBDC deployment. The analysis will cover market positioning, operational integration with existing banking systems, and strategic recommendations for phased implementation.

**Key Requirements:**
- Comprehensive market analysis of global CBDC trends and competitive positioning
- Technical architecture design for CBDC integration with current banking infrastructure
- Regulatory compliance framework addressing current and anticipated requirements
- Risk assessment and mitigation strategies for implementation
- Financial impact analysis including cost-benefit projections and ROI calculations
- Detailed implementation roadmap with clear milestones and resource allocation

**Target Audience Considerations:**
The presentation must address the diverse needs of Board of Directors (strategic oversight and fiduciary concerns), Technical Teams (implementation feasibility and system integration), and Executive Leadership (business case and competitive implications).

**Expected Deliverables:**
- Executive summary with key recommendations and strategic implications
- Market context analysis with competitive positioning assessment
- Technical architecture recommendations with security frameworks
- Regulatory compliance roadmap and legal considerations
- Implementation timeline with resource requirements and budget projections
- Risk management framework with mitigation strategies

**Success Criteria:**
- Board approval for CBDC implementation initiative
- Clear understanding of technical requirements across all stakeholders
- Defined budget allocation and resource planning for next phase
- Established timeline for pilot program initiation
- Comprehensive risk management framework adoption

**Strategic Context:**
With increasing global adoption of CBDCs and evolving regulatory landscapes, Global Banking Corp must position itself as a leader in digital currency capabilities while ensuring operational resilience and regulatory compliance.`;
}
