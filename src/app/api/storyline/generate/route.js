import { NextResponse } from 'next/server';
import ChatService from '../../../../lib/services/ChatService.js';
import BackendProvider from '../../../../lib/ai/BackendProvider.js';
import OpenAIProvider from '../../../../lib/ai/OpenAIProvider.js';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createValidationError 
} from '../../../../lib/api/errors.js';

const chatService = new ChatService();
const backendProvider = new BackendProvider({
  backendUrl: 'http://localhost:3000',
  endpoint: '/api/chat/send',
  timeout: 30000
});
const openAIProvider = new OpenAIProvider();

// Initialize AI provider
let isInitialized = false;
async function initializeAIProvider() {
  if (isInitialized) return;
  
  try {
    const backendInitialized = await backendProvider.initialize();
    if (backendInitialized) {
      chatService.setAIProvider(backendProvider);
    } else {
      await openAIProvider.initialize();
      chatService.setAIProvider(openAIProvider);
    }
    isInitialized = true;
  } catch (error) {
    console.error('AI provider initialization failed:', error);
    isInitialized = true;
  }
}

// POST /api/storyline/generate - Generate AI storyline
export async function POST(request) {
  try {
    await initializeAIProvider();
    
    const body = await request.json();
    const { 
      topic, 
      industry, 
      audience, 
      objectives, 
      sectionsCount = 6,
      presentationStyle = 'consulting',
      complexity = 'intermediate'
    } = body;

    // Validate required fields
    if (!topic || typeof topic !== 'string') {
      const errorResponse = createValidationError(['Topic is required and must be a string'], 'topic');
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Generate storyline using AI or fallback to intelligent mock generation
    let storylineData;
    
    try {
      const storylinePrompt = createStorylinePrompt({
        topic,
        industry,
        audience, 
        objectives,
        sectionsCount,
        presentationStyle,
        complexity
      });

      const aiResponse = await chatService.sendMessage(
        `storyline_${Date.now()}`,
        storylinePrompt
      );

      // Parse the AI response to extract storyline structure
      storylineData = parseAIStorylineResponse(aiResponse.assistantMessage);
      
    } catch (error) {
      console.log('🎭 AI backend unavailable, using intelligent mock generation');
      // Generate intelligent storyline based on input parameters
      storylineData = generateIntelligentStoryline({
        topic,
        industry,
        audience,
        objectives,
        sectionsCount,
        presentationStyle,
        complexity
      });
    }

    const responseData = {
      topic,
      industry,
      audience,
      objectives,
      presentationStyle,
      complexity,
      storyline: storylineData,
      generatedAt: new Date().toISOString(),
      sectionsCount: storylineData.sections?.length || sectionsCount
    };

    return NextResponse.json(createSuccessResponse(responseData, 'Storyline generated successfully'));

  } catch (error) {
    console.error('Storyline generation error:', error);
    
    const errorResponse = createErrorResponse('INTERNAL_ERROR', 'Failed to generate storyline', {
      originalError: error.message
    });
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

function createStorylinePrompt({ topic, industry, audience, objectives, sectionsCount, presentationStyle, complexity }) {
  return `Generate a comprehensive presentation storyline for the following requirements:

Topic: ${topic}
Industry: ${industry || 'General Business'}
Target Audience: ${audience || 'Business Professionals'}
Key Objectives: ${objectives || 'Inform and educate audience'}
Number of Sections: ${sectionsCount}
Presentation Style: ${presentationStyle}
Complexity Level: ${complexity}

Please provide a structured storyline with the following format:

1. **Executive Summary**: High-level overview and key takeaways
2. **Section Breakdown**: For each of the ${sectionsCount} sections, provide:
   - Section title
   - Core message/objective
   - Key points to cover (3-5 bullet points)
   - Recommended content blocks/layouts
   - Estimated slides/content length

3. **Content Blocks**: Suggest specific content block types for each section such as:
   - BCG Matrix
   - MECE Framework (2-column, 3-column)
   - Timeline Layout
   - Process Flow
   - Market Map
   - Key Insights
   - Data Visualization
   - Case Studies

4. **Presentation Flow**: Logical narrative connecting all sections
5. **Call to Action**: Recommended next steps for the audience

Focus on creating a compelling narrative that flows logically from problem identification to solution and implementation. Make it suitable for ${presentationStyle} style presentations at ${complexity} level.

Please format the response as structured text that can be parsed programmatically.`;
}

function parseAIStorylineResponse(aiResponse) {
  try {
    // This is a simplified parser - in production you might want more sophisticated parsing
    const sections = [];
    let currentSection = null;
    let executiveSummary = '';
    let presentationFlow = '';
    let callToAction = '';
    
    const lines = aiResponse.split('\n').filter(line => line.trim());
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Extract executive summary
      if (line.toLowerCase().includes('executive summary') && !executiveSummary) {
        let summaryLines = [];
        for (let j = i + 1; j < lines.length && !lines[j].includes('Section Breakdown') && !lines[j].includes('**'); j++) {
          if (lines[j].trim()) summaryLines.push(lines[j].trim());
        }
        executiveSummary = summaryLines.join(' ');
      }
      
      // Parse sections based on patterns
      if (line.match(/^\d+\.|Section \d+:|^\*\*.*Section/i) || 
          line.match(/^(Introduction|Context|Analysis|Strategy|Implementation|Conclusion)/i)) {
        
        if (currentSection) sections.push(currentSection);
        
        currentSection = {
          id: sections.length + 1,
          title: extractSectionTitle(line),
          status: 'Not Started',
          description: '',
          keyPoints: [],
          contentBlocks: [],
          estimatedSlides: Math.ceil(Math.random() * 5) + 3 // 3-8 slides estimate
        };
      }
      
      // Add content to current section
      if (currentSection && line && !line.match(/^\d+\.|Section \d+:|^\*\*/)) {
        if (!currentSection.description && line.length > 20) {
          currentSection.description = line;
        } else if (line.startsWith('•') || line.startsWith('-')) {
          currentSection.keyPoints.push(line.replace(/^[•-]\s*/, ''));
        }
      }
      
      // Extract content blocks suggestions
      if (line.toLowerCase().includes('content block') || 
          line.includes('BCG Matrix') || line.includes('MECE') || line.includes('Timeline')) {
        if (currentSection) {
          currentSection.contentBlocks.push({
            type: extractContentBlockType(line),
            items: []
          });
        }
      }
    }
    
    if (currentSection) sections.push(currentSection);
    
    // Generate some sample content blocks for sections that don't have them
    sections.forEach(section => {
      if (section.contentBlocks.length === 0) {
        const blockTypes = ['Key Insights', 'Process Flow', 'Data Points', 'Framework'];
        const randomType = blockTypes[Math.floor(Math.random() * blockTypes.length)];
        section.contentBlocks.push({
          type: randomType,
          items: []
        });
      }
    });
    
    return {
      executiveSummary: executiveSummary || 'AI-generated executive summary for the presentation.',
      sections: sections,
      presentationFlow: 'Structured narrative flow connecting all sections logically.',
      callToAction: 'Recommended next steps and implementation guidance.',
      totalSections: sections.length,
      estimatedDuration: sections.reduce((acc, s) => acc + s.estimatedSlides, 0) * 2 // 2 min per slide estimate
    };
    
  } catch (error) {
    console.error('Error parsing AI storyline response:', error);
    return generateFallbackStoryline();
  }
}

function extractSectionTitle(line) {
  // Remove numbering, asterisks, and clean up the title
  return line
    .replace(/^\d+\.?\s*/, '')
    .replace(/^\*\*/, '')
    .replace(/\*\*$/, '')
    .replace(/Section \d+:\s*/i, '')
    .trim();
}

function extractContentBlockType(line) {
  const blockTypes = {
    'bcg matrix': 'BCG Matrix',
    'mece': 'MECE Framework',
    'timeline': 'Timeline Layout', 
    'process flow': 'Process Flow',
    'market map': 'Market Map',
    'insights': 'Key Insights',
    'case study': 'Case Study',
    'data viz': 'Data Visualization'
  };
  
  const lowerLine = line.toLowerCase();
  for (const [key, value] of Object.entries(blockTypes)) {
    if (lowerLine.includes(key)) return value;
  }
  
  return 'Content Block';
}

function generateIntelligentStoryline({ topic, industry, audience, objectives, sectionsCount, presentationStyle, complexity }) {
  const sections = [];
  
  // Industry-specific section templates
  const industryTemplates = {
    'financial-services': {
      sections: ['Executive Summary', 'Market Analysis', 'Regulatory Landscape', 'Strategic Recommendations', 'Implementation Roadmap', 'Risk Assessment'],
      contentBlocks: ['BCG Matrix', 'Regulatory Timeline', 'SWOT Analysis', 'Financial Projections', 'Risk Matrix']
    },
    'technology': {
      sections: ['Executive Summary', 'Technical Overview', 'Market Opportunity', 'Product Strategy', 'Implementation Plan', 'Scaling Strategy'],
      contentBlocks: ['Technical Architecture', 'User Journey', 'Product Roadmap', 'Market Analysis', 'Growth Metrics']
    },
    'healthcare': {
      sections: ['Executive Summary', 'Clinical Context', 'Market Analysis', 'Solution Framework', 'Implementation Strategy', 'Outcomes Measurement'],
      contentBlocks: ['Clinical Workflow', 'Patient Journey', 'Outcome Metrics', 'Compliance Framework', 'Care Pathway']
    }
  };

  // Default sections for any topic
  const defaultSections = [
    'Executive Summary',
    `${topic} Landscape Analysis`, 
    'Current State Assessment',
    'Strategic Framework',
    'Implementation Strategy',
    'Expected Outcomes & Next Steps'
  ];

  const sectionTemplates = industryTemplates[industry] || { 
    sections: defaultSections,
    contentBlocks: ['Key Insights', 'Process Flow', 'MECE Framework', 'Timeline', 'Success Metrics']
  };

  // Generate sections based on requested count
  for (let i = 0; i < Math.min(sectionsCount, sectionTemplates.sections.length); i++) {
    const sectionTitle = i < sectionTemplates.sections.length 
      ? sectionTemplates.sections[i]
      : `${topic} - Section ${i + 1}`;

    sections.push({
      id: i + 1,
      title: sectionTitle,
      status: 'Not Started',
      description: generateSectionDescription(sectionTitle, topic, industry, complexity),
      keyPoints: generateKeyPoints(sectionTitle, topic, complexity),
      contentBlocks: [{ 
        type: sectionTemplates.contentBlocks[i % sectionTemplates.contentBlocks.length],
        items: []
      }],
      estimatedSlides: Math.ceil(Math.random() * 4) + 3 // 3-7 slides
    });
  }

  return {
    executiveSummary: `Comprehensive ${presentationStyle} presentation on ${topic}${industry ? ` in the ${industry} sector` : ''}. This storyline provides a structured approach to presenting key insights, strategic recommendations, and actionable next steps for ${audience || 'stakeholders'}.`,
    sections: sections,
    presentationFlow: generatePresentationFlow(presentationStyle, complexity),
    callToAction: generateCallToAction(objectives, presentationStyle),
    totalSections: sections.length,
    estimatedDuration: sections.reduce((acc, s) => acc + s.estimatedSlides, 0) * 2
  };
}

function generateSectionDescription(title, topic, industry, complexity) {
  const descriptions = {
    'Executive Summary': `High-level overview of the ${topic} initiative, key findings, and strategic recommendations.`,
    'Market Analysis': `Comprehensive analysis of market conditions, trends, and opportunities related to ${topic}.`,
    'Strategic Framework': `Structured approach and methodology for implementing ${topic} solutions.`,
    'Implementation Strategy': `Detailed implementation plan with timelines, resources, and key milestones for ${topic}.`,
    'Technical Overview': `Technical specifications, architecture, and system requirements for ${topic}.`,
    'Risk Assessment': `Identification and mitigation strategies for potential risks in ${topic} implementation.`
  };

  // Check if title matches any template
  for (const key in descriptions) {
    if (title.includes(key)) {
      return descriptions[key];
    }
  }

  // Generate generic description
  return `Detailed analysis and recommendations for ${title.toLowerCase()} as it relates to ${topic}${industry ? ` in the ${industry} industry` : ''}.`;
}

function generateKeyPoints(title, topic, complexity) {
  const complexityPoints = {
    'beginner': 3,
    'intermediate': 4,
    'advanced': 5,
    'expert': 6
  };

  const pointCount = complexityPoints[complexity] || 4;
  const points = [];

  if (title.includes('Executive Summary')) {
    points.push('Strategic overview and objectives', 'Key findings and insights', 'Primary recommendations', 'Expected outcomes');
  } else if (title.includes('Market') || title.includes('Analysis')) {
    points.push('Market trends and drivers', 'Competitive landscape', 'Growth opportunities', 'Market challenges');
  } else if (title.includes('Implementation') || title.includes('Strategy')) {
    points.push('Implementation phases', 'Resource requirements', 'Timeline and milestones', 'Success metrics');
  } else if (title.includes('Technical')) {
    points.push('Technical architecture', 'System requirements', 'Integration points', 'Performance considerations');
  } else {
    points.push(`${topic} overview`, 'Current state analysis', 'Strategic recommendations', 'Next steps');
  }

  return points.slice(0, pointCount);
}

function generatePresentationFlow(style, complexity) {
  const flows = {
    'consulting': 'Structured consulting methodology: Situation → Complication → Question → Answer → Implementation',
    'academic': 'Research-based approach: Literature review → Methodology → Findings → Discussion → Conclusions',
    'sales': 'Sales methodology: Problem identification → Solution presentation → Value demonstration → Call to action',
    'technical': 'Technical progression: Requirements → Architecture → Implementation → Testing → Deployment',
    'strategic': 'Strategic framework: Vision → Analysis → Strategy → Execution → Measurement'
  };

  return flows[style] || 'Logical progression from context setting to strategic recommendations and implementation planning.';
}

function generateCallToAction(objectives, style) {
  if (objectives) {
    return `Based on the outlined objectives: "${objectives}", the recommended next steps focus on immediate implementation priorities and stakeholder alignment.`;
  }

  const actions = {
    'consulting': 'Immediate next steps: stakeholder alignment, resource allocation, and implementation timeline finalization.',
    'sales': 'Ready to move forward: contract finalization, implementation planning, and success metrics establishment.',
    'strategic': 'Strategic priorities: board approval, resource commitment, and execution roadmap development.',
    'technical': 'Technical next steps: detailed technical specification, development planning, and testing strategy.',
    'academic': 'Research implications: further investigation areas, practical applications, and publication opportunities.'
  };

  return actions[style] || 'Next steps include stakeholder review, resource planning, and implementation timeline development.';
}

function generateFallbackStoryline() {
  return generateIntelligentStoryline({
    topic: 'Strategic Initiative',
    industry: '',
    audience: 'stakeholders',
    objectives: '',
    sectionsCount: 6,
    presentationStyle: 'consulting',
    complexity: 'intermediate'
  });
}