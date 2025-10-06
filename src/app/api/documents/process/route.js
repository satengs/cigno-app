import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files');

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const processedFiles = [];
    const extractedContent = [];

    // Process each file
    for (const file of files) {
      try {
        // Save file to disk
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = join(uploadsDir, fileName);
        await writeFile(filePath, buffer);

        // Extract content based on file type
        const content = await extractFileContent(file, buffer);
        
        processedFiles.push({
          name: file.name,
          size: file.size,
          type: file.type,
          path: filePath,
          extractedText: content.text,
          metadata: content.metadata
        });

        extractedContent.push(content.text);

      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        return NextResponse.json(
          { success: false, error: `Failed to process file: ${file.name}` },
          { status: 500 }
        );
      }
    }

    // Combine all extracted content
    const combinedContent = extractedContent.join('\n\n');

    // Analyze the content with AI to extract project information
    const projectData = await analyzeDocumentContent(combinedContent, processedFiles);

    return NextResponse.json({
      success: true,
      data: {
        files: processedFiles,
        extractedContent: combinedContent,
        projectData: projectData,
        processedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in document processing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process documents' },
      { status: 500 }
    );
  }
}

// Extract content from different file types
async function extractFileContent(file, buffer) {
  const fileType = file.type;
  let text = '';
  let metadata = {};

  try {
    switch (fileType) {
      case 'text/plain':
        text = buffer.toString('utf-8');
        break;
        
      case 'application/pdf':
        // For PDF extraction, we'll use a simple approach for now
        // In production, you'd want to use a library like pdf-parse
        text = `[PDF Content from ${file.name}]`;
        metadata.pages = 'Unknown';
        break;
        
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        // For Word documents, you'd use libraries like mammoth or docx
        text = `[Word Document Content from ${file.name}]`;
        break;
        
      case 'application/vnd.ms-powerpoint':
      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        text = `[PowerPoint Content from ${file.name}]`;
        break;
        
      case 'image/jpeg':
      case 'image/png':
      case 'image/gif':
        // For images, you could use OCR services like Tesseract
        text = `[Image file: ${file.name}]`;
        metadata.dimensions = 'Unknown';
        break;
        
      default:
        text = `[Unsupported file type: ${fileType}]`;
    }

    return {
      text: text || `[Content could not be extracted from ${file.name}]`,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType: fileType,
        extractedAt: new Date().toISOString(),
        ...metadata
      }
    };

  } catch (error) {
    console.error(`Error extracting content from ${file.name}:`, error);
    return {
      text: `[Error extracting content from ${file.name}]`,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType: fileType,
        error: error.message,
        extractedAt: new Date().toISOString()
      }
    };
  }
}

// Analyze document content using AI to extract project information
async function analyzeDocumentContent(content, files) {
  try {
    // Create a detailed prompt for project extraction
    const analysisPrompt = `
Analyze the following document content and extract key project information to create a consulting project. Please extract and structure the following information:

**Document Content:**
${content}

**Files Processed:**
${files.map(f => `- ${f.name} (${f.type})`).join('\n')}

**Please extract and return a JSON object with the following structure:**
{
  "projectName": "extracted or inferred project name",
  "description": "comprehensive project description based on the documents",
  "objectives": ["list of project objectives"],
  "deliverables": [
    {
      "name": "deliverable name",
      "type": "report|presentation|analysis|strategy|design",
      "description": "deliverable description"
    }
  ],
  "timeline": {
    "startDate": "YYYY-MM-DD or null if not found",
    "endDate": "YYYY-MM-DD or null if not found",
    "duration": "estimated duration in weeks/months"
  },
  "budget": {
    "amount": "extracted amount or null",
    "currency": "USD|EUR|GBP etc or null",
    "type": "fixed|hourly|daily|milestone"
  },
  "clientInfo": {
    "name": "client organization name if mentioned",
    "industry": "client industry if identifiable",
    "contactPerson": "contact person if mentioned"
  },
  "requirements": ["list of key requirements"],
  "scope": "project scope description",
  "keyDates": [
    {
      "date": "YYYY-MM-DD",
      "description": "milestone or deadline description"
    }
  ],
  "riskFactors": ["potential risks or challenges identified"],
  "successCriteria": ["success metrics or criteria"],
  "stakeholders": ["key stakeholders mentioned"],
  "constraints": ["budget, time, or resource constraints"],
  "assumptions": ["key assumptions made in the project"]
}

Please ensure all extracted information is accurate and based solely on the document content. If information is not available, use null or empty arrays as appropriate.
`;

    // Check if AI service is configured
    if (!process.env.AGENT_API_URL || !process.env.AGENT_API_KEY) {
      console.log('AI service not configured, using mock project analysis');
      return generateMockProjectAnalysis(files);
    }

    // Call Vave AI for document analysis
    const response = await fetch(`${process.env.AGENT_API_URL}/api/custom-agents/68dddd9ac1b3b5cc990ad5f0/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.AGENT_API_KEY,
      },
      body: JSON.stringify({
        message: analysisPrompt,
        temperature: 0.3, // Lower temperature for more factual extraction
        maxTokens: 3000
      }),
    });

    if (!response.ok) {
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const result = await response.json();
    
    // Try to parse the AI response as JSON
    let projectData;
    try {
      const content = result.response || result.content || result.message || result;
      
      if (typeof content === 'string') {
        // Try to extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          projectData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in AI response');
        }
      } else {
        projectData = content;
      }
    } catch (parseError) {
      console.log('Could not parse AI response as JSON, using mock data');
      projectData = generateMockProjectAnalysis(files);
    }

    // Ensure the response has all required fields
    return {
      projectName: projectData.projectName || 'Extracted Project',
      description: projectData.description || 'Project description extracted from uploaded documents',
      objectives: projectData.objectives || [],
      deliverables: projectData.deliverables || [],
      timeline: projectData.timeline || {},
      budget: projectData.budget || {},
      clientInfo: projectData.clientInfo || {},
      requirements: projectData.requirements || [],
      scope: projectData.scope || '',
      keyDates: projectData.keyDates || [],
      riskFactors: projectData.riskFactors || [],
      successCriteria: projectData.successCriteria || [],
      stakeholders: projectData.stakeholders || [],
      constraints: projectData.constraints || [],
      assumptions: projectData.assumptions || [],
      extractionMethod: 'AI Analysis',
      sourceFiles: files.map(f => f.name),
      analyzedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error in AI document analysis:', error);
    // Fall back to mock analysis
    return generateMockProjectAnalysis(files);
  }
}

// Generate mock project analysis as fallback
function generateMockProjectAnalysis(files) {
  return {
    projectName: 'Document-Based Project',
    description: `Project created from uploaded documents: ${files.map(f => f.name).join(', ')}`,
    objectives: [
      'Analyze uploaded documents and requirements',
      'Develop comprehensive project plan',
      'Deliver professional recommendations'
    ],
    deliverables: [
      {
        name: 'Document Analysis Report',
        type: 'report',
        description: 'Comprehensive analysis of uploaded documents'
      },
      {
        name: 'Executive Summary',
        type: 'presentation',
        description: 'High-level overview and recommendations'
      }
    ],
    timeline: {
      startDate: null,
      endDate: null,
      duration: '8-12 weeks'
    },
    budget: {
      amount: null,
      currency: 'USD',
      type: 'fixed'
    },
    clientInfo: {
      name: null,
      industry: null,
      contactPerson: null
    },
    requirements: [
      'Review and analyze provided documentation',
      'Identify key themes and insights',
      'Provide actionable recommendations'
    ],
    scope: 'Analysis and recommendations based on provided documentation',
    keyDates: [],
    riskFactors: [
      'Limited information in source documents',
      'Interpretation accuracy of document content'
    ],
    successCriteria: [
      'Clear understanding of document content',
      'Actionable recommendations provided',
      'Client satisfaction with analysis'
    ],
    stakeholders: [],
    constraints: [],
    assumptions: [
      'Uploaded documents contain relevant project information',
      'Documents are current and accurate'
    ],
    extractionMethod: 'Mock Analysis (Fallback)',
    sourceFiles: files.map(f => f.name),
    analyzedAt: new Date().toISOString()
  };
}