import { NextResponse } from 'next/server';
import PptxGenJS from "pptxgenjs";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import ExcelJS from "exceljs";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ status: 'ready' });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Allow': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

// Layout-specific slide generators (server-side only)
const layoutGenerators = {
  'title-2-columns': (slide, section) => {
    // Title
    slide.addText(section.title, { 
      x: 0.5, y: 0.5, w: 9, h: 1, 
      fontSize: 24, bold: true, color: "1f2937" 
    });
    
    // Two columns layout
    const leftContent = section.keyPoints?.slice(0, Math.ceil(section.keyPoints.length / 2)) || [];
    const rightContent = section.keyPoints?.slice(Math.ceil(section.keyPoints.length / 2)) || [];
    
    leftContent.forEach((point, i) => {
      slide.addText(`• ${point.content || point}`, { 
        x: 0.5, y: 2 + i * 0.4, w: 4.25, h: 0.3, 
        fontSize: 12, color: "374151" 
      });
    });
    
    rightContent.forEach((point, i) => {
      slide.addText(`• ${point.content || point}`, { 
        x: 5.25, y: 2 + i * 0.4, w: 4.25, h: 0.3, 
        fontSize: 12, color: "374151" 
      });
    });
  },
  
  'title-bullets': (slide, section) => {
    slide.addText(section.title, { 
      x: 0.5, y: 0.5, w: 9, h: 1, 
      fontSize: 24, bold: true, color: "1f2937" 
    });
    
    (section.keyPoints || []).forEach((point, i) => {
      slide.addText(`• ${point.content || point}`, { 
        x: 0.5, y: 2 + i * 0.4, w: 9, h: 0.3, 
        fontSize: 12, color: "374151" 
      });
    });
  }
};

export async function POST(request) {
  try {
    const { storyline, format, selectedLayout = 'title-2-columns' } = await request.json();

    if (!storyline) {
      return NextResponse.json({ error: 'Storyline data is required' }, { status: 400 });
    }

    let buffer;
    let fileName;
    let mimeType;

    switch (format) {
      case 'pptx':
        ({ buffer, fileName, mimeType } = await generatePptx(storyline, selectedLayout));
        break;
      case 'docx':
        ({ buffer, fileName, mimeType } = await generateDocx(storyline, selectedLayout));
        break;
      case 'xlsx':
        ({ buffer, fileName, mimeType } = await generateXlsx(storyline, selectedLayout));
        break;
      default:
        return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': buffer.length.toString()
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

async function generatePptx(storyline, selectedLayout) {
  const pptx = new PptxGenJS();
  
  // Title slide
  const titleSlide = pptx.addSlide();
  titleSlide.addText(storyline.title || storyline.name || "Cigno Presentation", {
    x: 1, y: 2, w: 8, h: 2,
    fontSize: 32, bold: true, align: "center", color: "1f2937"
  });
  
  // Content slides
  storyline.sections?.forEach((section) => {
    const slide = pptx.addSlide();
    const layoutFunction = layoutGenerators[selectedLayout] || layoutGenerators['title-2-columns'];
    layoutFunction(slide, section);
  });
  
  const buffer = await pptx.write('arraybuffer');
  const fileName = `${storyline.title || storyline.name || 'cigno-presentation'}.pptx`;
  
  return { buffer, fileName, mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' };
}

async function generateDocx(storyline, selectedLayout) {
  const sections = [];
  
  // Title section
  sections.push(
    new Paragraph({
      text: storyline.title || storyline.name || "Cigno Document",
      heading: HeadingLevel.TITLE,
      spacing: { after: 400 }
    }),
    new Paragraph({
      text: "Generated from Cigno Platform",
      spacing: { after: 800 }
    })
  );

  // Content sections
  storyline.sections?.forEach((section) => {
    sections.push(
      new Paragraph({
        text: section.title,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      })
    );
    
    if (section.description) {
      sections.push(
        new Paragraph({
          text: section.description,
          spacing: { after: 200 }
        })
      );
    }

    // Key points
    section.keyPoints?.forEach((point) => {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: "• ", bold: true }),
            new TextRun({ text: point.content || point })
          ],
          spacing: { after: 100 }
        })
      );
    });
  });

  const doc = new Document({
    sections: [{ properties: {}, children: sections }]
  });

  const buffer = await Packer.toBuffer(doc);
  const fileName = `${storyline.title || storyline.name || 'cigno-document'}.docx`;
  
  return { buffer, fileName, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
}

async function generateXlsx(storyline, selectedLayout) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Cigno Storyline");

  // Headers
  sheet.columns = [
    { header: "Section", key: "title", width: 25 },
    { header: "Description", key: "description", width: 40 },
    { header: "Key Points", key: "key_points", width: 50 },
    { header: "Applied Layout", key: "layout", width: 20 },
    { header: "Status", key: "status", width: 15 }
  ];

  // Data rows
  storyline.sections?.forEach((section) => {
    sheet.addRow({
      title: section.title,
      description: section.description,
      key_points: section.keyPoints?.map(kp => kp.content || kp).join('\n• ') || '',
      layout: section.layout || selectedLayout,
      status: section.status || 'draft'
    });
  });

  // Auto-fit columns
  sheet.columns.forEach(column => {
    column.width = Math.max(column.width || 10, 15);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `${storyline.title || storyline.name || 'cigno-data'}.xlsx`;
  
  return { buffer, fileName, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
}
