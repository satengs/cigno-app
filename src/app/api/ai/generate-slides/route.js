import { NextResponse } from 'next/server';

const DEFAULT_BASE_URL = process.env.AI_API_BASE_URL || 'https://ai.vave.ch';
const DEFAULT_API_KEY = process.env.AI_API_KEY || 'b51b67b2924988b88809a421bd3cfb09d9a58d19ac746053f358e11b2895ac17';
const DEFAULT_AGENT_ID = process.env.AI_SLIDE_AGENT_ID || '68ef99a05a1a64c93c601056';

const toArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (error) {
      return value
        .split(/\n|•|-/)
        .map(item => item.trim())
        .filter(Boolean);
    }
  }
  return [value];
};

const normalizeSlide = (slide, index = 0, fallbackLayout = 'title-2-columns') => {
  if (!slide) {
    return {
      title: `Slide ${index + 1}`,
      summary: '',
      bullets: [],
      layout: fallbackLayout
    };
  }

  if (typeof slide === 'string') {
    const text = slide.trim();
    const bullets = text
      .split(/\n|•|-/)
      .map(item => item.trim())
      .filter(Boolean);

    return {
      title: `Slide ${index + 1}`,
      summary: text,
      bullets,
      layout: fallbackLayout
    };
  }

  const bullets = toArray(slide.bullets || slide.points || slide.keyPoints)
    .map(item => (typeof item === 'string' ? item.trim() : item?.content || item?.text || item?.description || ''))
    .filter(Boolean);

  let summary = '';
  if (typeof slide.summary === 'string') summary = slide.summary;
  else if (typeof slide.description === 'string') summary = slide.description;
  else if (typeof slide.content === 'string') summary = slide.content;
  else if (Array.isArray(slide.paragraphs)) summary = slide.paragraphs.join(' ');

  return {
    title: slide.title || slide.heading || slide.name || `Slide ${index + 1}`,
    subtitle: slide.subtitle || slide.subheading || '',
    summary,
    bullets,
    notes: slide.notes || slide.speakerNotes || '',
    layout: slide.layout || slide.format || fallbackLayout
  };
};

const extractSlides = (payload) => {
  if (!payload) return [];

  const candidates = [
    payload?.data?.slides,
    payload?.slides,
    payload?.response?.slides,
    payload?.response,
    payload?.content,
    payload
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;

    if (Array.isArray(candidate)) return candidate;

    if (typeof candidate === 'string') {
      try {
        const parsed = JSON.parse(candidate);
        if (Array.isArray(parsed)) return parsed;
        if (Array.isArray(parsed?.slides)) return parsed.slides;
      } catch (error) {
        // Ignore JSON parse errors on candidate strings
      }
    }

    if (Array.isArray(candidate?.slides)) {
      return candidate.slides;
    }
  }

  return [];
};

const buildPrompt = ({ section, storyline, layout }) => {
  const keyPoints = Array.isArray(section?.keyPoints)
    ? section.keyPoints.map(item => (typeof item === 'string' ? item : item?.content || item?.title)).filter(Boolean)
    : [];

  const contentBlocks = Array.isArray(section?.contentBlocks)
    ? section.contentBlocks
        .map(block => {
          const items = Array.isArray(block.items)
            ? block.items.map(item => (typeof item === 'string' ? item : item?.content || item?.text)).filter(Boolean)
            : [];
          return `${block.title || block.type || 'Block'}: ${items.join('; ')}`;
        })
        .filter(Boolean)
    : [];

  return `You are a senior presentation designer. Generate concise, executive-ready slide content for the following section.\n\nSection Title: ${section?.title || 'Untitled Section'}\nSection Description: ${section?.description || 'Not provided'}\nPreferred Layout: ${layout}\nStoryline Title: ${storyline?.title || 'Project Storyline'}\nKey Points: ${keyPoints.join(' | ') || 'None provided'}\nContent Blocks: ${contentBlocks.join(' | ') || 'None provided'}\n\nReturn JSON with a "slides" array. Each slide must include:\n- title (string)\n- optional subtitle (string)\n- summary (2 sentences max)\n- bullets (array of 3-5 bullet strings)\n- optional notes (speaker notes or design guidance)\n- optional layout identifier if certain design is recommended\n`;
};

const generateMockSlides = (section) => {
  const title = section?.title || 'Strategic Update';
  return [
    {
      title: `${title}: Executive Snapshot`,
      summary: 'Summarize the strategic intent, current status, and the critical recommendation for leadership alignment.',
      bullets: [
        'Reconfirm the strategic objective and the desired end-state',
        'Highlight the most material insight or tension uncovered to date',
        'State the recommended action or decision required'
      ],
      notes: 'Use a strong hero visual or iconography to anchor the narrative.'
    },
    {
      title: `${title}: Key Drivers`,
      summary: 'Detail the top drivers enabling or constraining the initiative and quantify their impact.',
      bullets: [
        'Driver 1 – qualitative description and quantified effect',
        'Driver 2 – qualitative description and quantified effect',
        'Driver 3 – qualitative description and quantified effect'
      ],
      notes: 'Visualize drivers in a three-column layout with supporting data points.'
    }
  ];
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { sectionId, section, storyline, layout = 'title-2-columns' } = body || {};

    if (!sectionId || !section) {
      return NextResponse.json(
        { error: 'Section ID and section data are required' },
        { status: 400 }
      );
    }

    const prompt = buildPrompt({ section, storyline, layout });

    const agentPayload = {
      message: prompt,
      context: {
        sectionId,
        section,
        storyline,
        layout
      }
    };

    console.log('📤 Slide generation prompt:', prompt);
    console.log('🚀 Slide agent payload:', JSON.stringify(agentPayload, null, 2));

    try {
      const response = await fetch(`${DEFAULT_BASE_URL}/api/custom-agents/${DEFAULT_AGENT_ID}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': DEFAULT_API_KEY
        },
        body: JSON.stringify(agentPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Custom agent failed (${response.status}): ${errorText}`);
      }

      const agentResult = await response.json();
      const slides = extractSlides(agentResult).map((slide, index) => normalizeSlide(slide, index, layout));

      if (!slides.length) {
        throw new Error('Custom agent returned no slides');
      }

      return NextResponse.json({
        success: true,
        source: 'custom-agent',
        agentId: DEFAULT_AGENT_ID,
        data: { slides },
        metadata: {
          generatedAt: new Date().toISOString(),
          sectionId
        }
      });
    } catch (error) {
      console.error('Slide generation agent error:', error);
      const fallbackSlides = generateMockSlides(section).map((slide, index) => normalizeSlide(slide, index, layout));
      return NextResponse.json({
        success: true,
        source: 'fallback',
        agentId: null,
        data: { slides: fallbackSlides },
        fallbackReason: error.message
      }, { status: 200 });
    }
  } catch (error) {
    console.error('Failed to generate slides:', error);
    return NextResponse.json(
      { error: 'Failed to generate slides', details: error.message },
      { status: 500 }
    );
  }
}
