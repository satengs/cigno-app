import { NextResponse } from 'next/server';

// Configuration
// IMPORTANT: ALWAYS use X-API-Key header authentication with API key
// NEVER use Bearer token or Authorization header - user explicitly requires API key only
const AI_CONFIG = {
  baseUrl: process.env.AI_API_BASE_URL || 'https://ai.vave.ch',
  apiKey: process.env.AI_API_KEY || 'b51b67b2924988b88809a421bd3cfb09d9a58d19ac746053f358e11b2895ac17',
  customAgentId: process.env.AI_CUSTOM_AGENT_ID || '68db998aabd74ae6e0a5fbc8'
};

// Return empty structure - no hardcoded defaults
function createMinimalFallback(description) {
  return {
    name: null,
    description: description,
    status: null,
    start_date: null,
    end_date: null,
    budget_amount: null,
    budget_currency: null,
    budget_type: null,
    client_owner: null,
    internal_owner: null,
    priority: null,
    project_type: null,
    tags: [],
    deliverables: [],
    team_requirements: [],
    milestones: []
  };
}


export async function POST(request) {
  try {
    const { description, projectData = {} } = await request.json();
    
    if (!description || !description.trim()) {
      return NextResponse.json({ 
        error: 'Project description is required',
        details: 'Please provide a project description to analyze'
      }, { status: 400 });
    }

    console.log('Analyzing project description:', description);

    // Try custom agent - return exactly what the AI provides
    try {
      const customAgentResponse = await fetch(`${AI_CONFIG.baseUrl}/api/custom-agents/${AI_CONFIG.customAgentId}/execute`, {
        method: 'POST',
        headers: {
          'X-API-Key': AI_CONFIG.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: description,
          context: projectData
        })
      });

      console.log('Custom agent response: ___________', customAgentResponse);

      if (customAgentResponse.ok) {
        const result = await customAgentResponse.json();
        console.log('Custom agent response:', result);
        
        // Get AI response - try different response fields
        const aiResponseText = result.response || result.output || result.result || result.data || '';
        console.log('AI response text:', aiResponseText);

        let analyzedData;

        // Try to parse as JSON if it's a string
        if (typeof aiResponseText === 'string') {
          try {
            // Try to parse the whole response as JSON
            analyzedData = JSON.parse(aiResponseText);
          } catch {
            // Try to extract JSON from text
            const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              analyzedData = JSON.parse(jsonMatch[0]);
            } else {
              throw new Error('No valid JSON found in AI response');
            }
          }
        } else if (typeof aiResponseText === 'object') {
          // Already an object
          analyzedData = aiResponseText;
        } else {
          throw new Error('Invalid AI response format');
        }

        console.log('Parsed AI data:', analyzedData);

        // Return exactly what the AI provided - no processing or defaults
        return NextResponse.json({
          success: true,
          message: 'Project analysis completed successfully',
          analyzedProject: analyzedData,
          rawAnalysis: analyzedData
        });

      } else {
        const errorText = await customAgentResponse.text();
        console.error(`Custom agent failed: ${customAgentResponse.status} ${customAgentResponse.statusText}`, errorText);
        throw new Error(`Custom agent failed: ${customAgentResponse.status}`);
      }

    } catch (customAgentError) {
      console.log('Custom agent failed, falling back to chat endpoint:', customAgentError.message);
      
      // Fallback to regular chat endpoint if custom agent fails
      try {
        const chatResponse = await fetch(`${AI_CONFIG.baseUrl}/api/chat/send`, {
          method: 'POST',
          headers: {
            'X-API-Key': AI_CONFIG.apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: `Please analyze this project description and return ONLY a valid JSON object with the following structure: {"name": "project name", "description": "description", "status": "Planning", "start_date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD", "budget_amount": number_or_null, "budget_currency": "USD", "budget_type": "Fixed", "client_owner": "owner_name_or_null", "internal_owner": "internal_owner_or_null", "priority": "high/medium/low_or_null", "project_type": "type_or_null", "tags": [], "deliverables": [], "team_requirements": [], "milestones": []}. Project description: ${description}`,
            userId: 'system',
            chatId: 'project-analysis-' + Date.now()
          })
        });

        if (chatResponse.ok) {
          const result = await chatResponse.json();
          const requestId = result.requestId;
          
          // Poll for the response
          let attempts = 0;
          const maxAttempts = 30;
          
          while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const statusResponse = await fetch(`${AI_CONFIG.baseUrl}/api/chat/status/${requestId}`, {
              headers: {
                'X-API-Key': AI_CONFIG.apiKey
              }
            });
            
            if (statusResponse.ok) {
              const statusResult = await statusResponse.json();
              
              if (statusResult.status === 'complete') {
                console.log('Raw AI response:', statusResult.response);
                
                // Try to extract JSON from the response
                let analyzedData;
                try {
                  // Try to parse the whole response as JSON
                  analyzedData = JSON.parse(statusResult.response);
                } catch {
                  // Try to extract JSON from text
                  const jsonMatch = statusResult.response.match(/\{[\s\S]*\}/);
                  if (jsonMatch) {
                    analyzedData = JSON.parse(jsonMatch[0]);
                  } else {
                    throw new Error('No valid JSON found in AI response');
                  }
                }

                return NextResponse.json({
                  success: true,
                  message: 'Project analysis completed successfully via chat fallback',
                  analyzedProject: analyzedData,
                  rawAnalysis: analyzedData
                });
              } else if (statusResult.status === 'error') {
                throw new Error('AI processing failed: ' + statusResult.message);
              }
            }
            
            attempts++;
          }
          
          throw new Error('AI response timeout after 30 seconds');

        } else {
          throw new Error(`Chat endpoint failed: ${chatResponse.status}`);
        }

      } catch (chatError) {
        console.log('AI API failed:', chatError.message);
        
        // Only use minimal fallback if both AI endpoints fail
        const fallbackData = createMinimalFallback(description);
        
        return NextResponse.json({
          success: false,
          message: 'AI analysis failed, minimal data provided',
          analyzedProject: fallbackData,
          rawAnalysis: fallbackData,
          error: chatError.message
        });
      }
    }

  } catch (error) {
    console.error('Error analyzing project:', error);
    return NextResponse.json({
      error: 'Failed to analyze project',
      details: error.message
    }, { status: 500 });
  }
}