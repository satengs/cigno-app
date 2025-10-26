import { NextResponse } from 'next/server';
import externalAIService from '../../../../../lib/ai/ExternalAIService.js';

const MARKET_SIZING_DESIGN_AGENT_ID =
  process.env.AI_MARKET_SIZING_DESIGN_AGENT_ID ||
  process.env.NEXT_PUBLIC_MARKET_SIZING_DESIGN_AGENT_ID ||
  '68fbb8654d9fb46a6dc33c62';

const sanitizeStoryline = (storyline = {}) => {
  if (!storyline || typeof storyline !== 'object') {
    return undefined;
  }

  const { _id, id, title, description, executiveSummary, taxonomy, sections } = storyline;

  return {
    id: _id || id || null,
    title: title || null,
    description: description || null,
    executiveSummary: executiveSummary || null,
    taxonomy: taxonomy || null,
    sections: Array.isArray(sections)
      ? sections.map(section => ({
          id: section?.id || section?._id || null,
          title: section?.title || section?.sectionContent?.title || null,
          framework: section?.framework || null
        }))
      : undefined
  };
};

const extractMarketSizingData = (section = {}) => {
  if (!section || typeof section !== 'object') {
    return null;
  }

  const directOutput = section.marketSizingSpecialistOutput || section.marketSizingData;
  if (directOutput) {
    return directOutput;
  }

  const nestedContent = section.sectionContent || {};
  if (nestedContent.marketSizingSpecialistOutput || nestedContent.marketSizingData) {
    return nestedContent.marketSizingSpecialistOutput || nestedContent.marketSizingData;
  }

  const analytics = nestedContent.analytics || nestedContent.analysis || {};
  if (analytics.marketSizing) {
    return analytics.marketSizing;
  }

  if (Array.isArray(section.charts) && section.charts.length) {
    return {
      charts: section.charts,
      insights: section.insights || nestedContent.insights || [],
      citations: section.citations || nestedContent.citations || []
    };
  }

  return section;
};

const createAgentPayload = ({ section, storyline, project, userId }) => {
  const sectionTitle =
    section?.sectionContent?.title ||
    section?.title ||
    section?.name ||
    'Market Sizing Section';

  const sectionId = section?.id || section?._id || sectionTitle;

  const marketSizingData = extractMarketSizingData(section);
  const marketSizingJsonString = (() => {
    try {
      return JSON.stringify(marketSizingData, null, 2);
    } catch (error) {
      console.warn('⚠️ Failed to stringify market sizing data for design agent:', error);
      return JSON.stringify({ warning: 'Unable to stringify market sizing data', fallback: marketSizingData });
    }
  })();

  const message = `You are the dedicated design agent for market sizing slides.\n\nAnalyze the provided section data and return a JSON response containing:\n\n- \"section\": the enhanced section content using the same schema as the input, preserving keys like title, description, keyPoints, charts, slides, sectionContent, etc.\n- \"layoutRecommendation\": an object with \"id\", \"name\", and \"reason\" describing the recommended layout identifier to use within the Cigno layout system.\n- Optional \"designGuidelines\": array of bullet suggestions for the designer.\n\nOnly respond with valid JSON.`;

  const enrichedMessage = `${message}\n\nHere is the Market Sizing Specialist output to guide your recommendation. It already includes market segments with product lines, time series data (2019, 2022, 2025, 2030), CAGR calculations with growth drivers, and market insights with citations. Use this information to craft an appropriate visual layout recommendation.\n\nMARKET_SIZING_SPECIALIST_OUTPUT_JSON:\n${marketSizingJsonString}`;

  const context = {
    requestType: 'market_sizing_layout_suggestion',
    agentRole: 'design_market_sizing',
    projectId: project?.id || project?._id || storyline?.projectId || null,
    userId: userId || null,
    sectionId,
    sectionTitle,
    framework: section?.framework || 'market_sizing',
    section,
    storyline: sanitizeStoryline(storyline),
    project: project || undefined
  };

  return {
    message: enrichedMessage,
    context
  };
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { section, storyline, project, userId } = body || {};

    if (!section) {
      return NextResponse.json(
        { error: 'Section data is required for market sizing design suggestions.' },
        { status: 400 }
      );
    }

    const payload = createAgentPayload({ section, storyline, project, userId });

    console.log('🎨 Requesting market sizing design suggestion from custom agent');
    console.log('🎨 Section ID:', payload.context.sectionId);

    const agentResult = await externalAIService.executeAgentSmart(
      MARKET_SIZING_DESIGN_AGENT_ID,
      payload,
      {
        useAsync: true,
        pollOptions: {
          maxAttempts: 20,
          initialDelay: 2000,
          maxDelay: 6000,
          backoffFactor: 1.5
        }
      }
    );

    return NextResponse.json({
      success: true,
      source: 'custom-agent',
      agentId: MARKET_SIZING_DESIGN_AGENT_ID,
      sectionId: payload.context.sectionId,
      data: agentResult
    });
  } catch (error) {
    console.error('❌ Market sizing design agent error:', error);

    return NextResponse.json(
      {
        error: 'Failed to retrieve market sizing design suggestion.',
        details: error.message
      },
      { status: 500 }
    );
  }
}
