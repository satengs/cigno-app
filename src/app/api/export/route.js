import { NextResponse } from 'next/server';
import PptxGenJS from "pptxgenjs";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import ExcelJS from "exceljs";
import { generateChartVisualization, generateMultipleChartImages } from '../../../lib/chartImageGenerator';

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
  'title-2-columns': async (slide, section) => {
    try {
      // Title (minimal spacing)
      slide.addText(section.title || 'Untitled Section', { 
        x: 0.5, y: 0.2, w: 9, h: 0.6, 
        fontSize: 22, bold: true, color: "1f2937" 
      });
      
      // Check if this is a framework section with special content
      if (section.framework) {
        // For framework sections, include framework content
        let yPos = 0.9; // Reduced from 2
        
        // Add insights if available
        if (section.insights && section.insights.length > 0) {
          slide.addText("Key Insights:", { 
            x: 0.5, y: yPos, w: 9, h: 0.25, 
            fontSize: 12, bold: true, color: "1f2937" 
          });
          yPos += 0.3;
          
          section.insights.forEach((insight, i) => {
            slide.addText(`• ${insight}`, { 
              x: 0.5, y: yPos, w: 9, h: 0.25, 
              fontSize: 11, color: "374151" 
            });
            yPos += 0.3;
          });
          yPos += 0.1;
        }
        
        // Add chart information if available
        if (section.charts && section.charts.length > 0) {
          slide.addText("Charts:", { 
            x: 0.5, y: yPos, w: 9, h: 0.25, 
            fontSize: 12, bold: true, color: "1f2937" 
          });
          yPos += 0.3;
          
          // Generate chart visualizations
          const chartData = await generateMultipleChartImages(section.charts);
          
          if (chartData.length > 0) {
            // For market sizing, display charts in a 2x2 grid (50% smaller)
            if (section.framework === 'market_sizing' && chartData.length > 1) {
              const chartsPerRow = 2;
              const chartWidth = 4;
              const chartHeight = 1.25; // 50% smaller height
              
              chartData.forEach((chart, i) => {
                const row = Math.floor(i / chartsPerRow);
                const col = i % chartsPerRow;
                const x = 0.5 + (col * chartWidth);
                const y = yPos + (row * chartHeight);
                
                generateChartVisualization(slide, chart, x, y, chartWidth - 0.2, chartHeight);
              });
              
              yPos += (Math.ceil(chartData.length / chartsPerRow) * chartHeight) + 0.3;
            } else {
              // Single column layout for other frameworks (50% smaller)
              chartData.forEach((chart, i) => {
                generateChartVisualization(slide, chart, 0.5, yPos, 9, 1.25);
                yPos += 1.5;
              });
            }
          } else {
            // Fallback to text if chart generation fails
            section.charts.forEach((chart, i) => {
              slide.addText(`• ${chart.title}`, { 
                x: 0.5, y: yPos, w: 9, h: 0.3, 
                fontSize: 12, color: "374151" 
              });
              yPos += 0.4;
            });
          }
        }
      } else {
        // Original two columns layout for non-framework sections
        const leftContent = section.keyPoints?.slice(0, Math.ceil(section.keyPoints.length / 2)) || [];
        const rightContent = section.keyPoints?.slice(Math.ceil(section.keyPoints.length / 2)) || [];
        
        leftContent.forEach((point, i) => {
          slide.addText(`• ${point.content || point}`, { 
            x: 0.5, y: 1.0 + i * 0.3, w: 4.25, h: 0.25, 
            fontSize: 11, color: "374151" 
          });
        });
        
        rightContent.forEach((point, i) => {
          slide.addText(`• ${point.content || point}`, { 
            x: 5.25, y: 1.0 + i * 0.3, w: 4.25, h: 0.25, 
            fontSize: 11, color: "374151" 
          });
        });
      }
    } catch (error) {
      console.error('Error in layout generator:', error);
      // Fallback: just add the title
      slide.addText(section.title || 'Untitled Section', { 
        x: 0.5, y: 0.5, w: 9, h: 1, 
        fontSize: 24, bold: true, color: "1f2937" 
      });
    }
  },
  
  'title-bullets': async (slide, section) => {
    try {
      slide.addText(section.title || 'Untitled Section', { 
        x: 0.5, y: 0.2, w: 9, h: 0.6, 
        fontSize: 22, bold: true, color: "1f2937" 
      });
      
      // Check if this is a framework section with special content
      if (section.framework) {
        let yPos = 0.9; // Reduced from 2
        
        // Add insights if available
        if (section.insights && section.insights.length > 0) {
          slide.addText("Key Insights:", { 
            x: 0.5, y: yPos, w: 9, h: 0.25, 
            fontSize: 12, bold: true, color: "1f2937" 
          });
          yPos += 0.3;
          
          section.insights.forEach((insight, i) => {
            slide.addText(`• ${insight}`, { 
              x: 0.5, y: yPos, w: 9, h: 0.25, 
              fontSize: 11, color: "374151" 
            });
            yPos += 0.3;
          });
          yPos += 0.1;
        }
        
        // Add chart information if available
        if (section.charts && section.charts.length > 0) {
          slide.addText("Charts:", { 
            x: 0.5, y: yPos, w: 9, h: 0.25, 
            fontSize: 12, bold: true, color: "1f2937" 
          });
          yPos += 0.3;
          
          // Generate chart visualizations
          const chartData = await generateMultipleChartImages(section.charts);
          
          if (chartData.length > 0) {
            // Single column layout for title-bullets (50% smaller)
            chartData.forEach((chart, i) => {
              generateChartVisualization(slide, chart, 0.5, yPos, 9, 1.25);
              yPos += 1.5;
            });
          } else {
            // Fallback to text if chart generation fails
            section.charts.forEach((chart, i) => {
              slide.addText(`• ${chart.title}`, { 
                x: 0.5, y: yPos, w: 9, h: 0.3, 
                fontSize: 12, color: "374151" 
              });
              yPos += 0.4;
            });
          }
        }
      } else {
        // Original bullet points for non-framework sections
        (section.keyPoints || []).forEach((point, i) => {
          slide.addText(`• ${point.content || point}`, { 
            x: 0.5, y: 1.0 + i * 0.3, w: 9, h: 0.25, 
            fontSize: 11, color: "374151" 
          });
        });
      }
    } catch (error) {
      console.error('Error in title-bullets generator:', error);
      // Fallback: just add the title
      slide.addText(section.title || 'Untitled Section', { 
        x: 0.5, y: 0.5, w: 9, h: 1, 
        fontSize: 24, bold: true, color: "1f2937" 
      });
    }
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
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ error: 'Export failed', details: error.message }, { status: 500 });
  }
}

async function generatePptx(storyline, selectedLayout) {
  try {
    const pptx = new PptxGenJS();
    
    // Title slide
    const titleSlide = pptx.addSlide();
    titleSlide.addText(storyline.title || storyline.name || "Cigno Presentation", {
      x: 1, y: 2, w: 8, h: 2,
      fontSize: 32, bold: true, align: "center", color: "1f2937"
    });
    
  // Content slides
  for (let index = 0; index < (storyline.sections?.length || 0); index++) {
    const section = storyline.sections[index];
    try {
      const slide = pptx.addSlide();
      const layoutFunction = layoutGenerators[selectedLayout] || layoutGenerators['title-2-columns'];
      await layoutFunction(slide, section);
    } catch (error) {
      console.error(`Error processing section ${index}:`, error);
      // Create a basic slide with just the title as fallback
      const slide = pptx.addSlide();
      slide.addText(section.title || `Section ${index + 1}`, { 
        x: 0.5, y: 0.5, w: 9, h: 1, 
        fontSize: 24, bold: true, color: "1f2937" 
      });
    }
  }
    
    const buffer = await pptx.write('arraybuffer');
    
    if (!buffer || !(buffer instanceof ArrayBuffer)) {
      throw new Error('Failed to generate PPTX buffer');
    }
    
    const fileName = `${storyline.title || storyline.name || 'cigno-presentation'}.pptx`;
    
    return { buffer, fileName, mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' };
  } catch (error) {
    console.error('Error in generatePptx:', error);
    throw error;
  }
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

    // Check if this is a framework section with special content
    if (section.framework) {
      // Add insights if available
      if (section.insights && section.insights.length > 0) {
        sections.push(
          new Paragraph({
            text: "Key Insights:",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
          })
        );
        
        section.insights.forEach((insight) => {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({ text: "• ", bold: true }),
                new TextRun({ text: insight })
              ],
              spacing: { after: 100 }
            })
          );
        });
      }
      
      // Add chart information if available
      if (section.charts && section.charts.length > 0) {
        sections.push(
          new Paragraph({
            text: "Charts:",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
          })
        );
        
        section.charts.forEach((chart) => {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({ text: "• ", bold: true }),
                new TextRun({ text: chart.title })
              ],
              spacing: { after: 100 }
            })
          );
          
          // Add chart data as a table if available
          if (chart.config && chart.config.data) {
            const chartData = chart.config.data;
            if (chartData.labels && chartData.datasets) {
              sections.push(
                new Paragraph({
                  text: "Data:",
                  heading: HeadingLevel.HEADING_3,
                  spacing: { before: 100, after: 50 }
                })
              );
              
              // Add data rows
              chartData.labels.forEach((label, labelIndex) => {
                const rowData = chartData.datasets.map(dataset => 
                  `${dataset.label || 'Series'}: ${dataset.data[labelIndex] || 0}`
                ).join(' | ');
                
                sections.push(
                  new Paragraph({
                    children: [
                      new TextRun({ text: `${label}: `, bold: true }),
                      new TextRun({ text: rowData })
                    ],
                    spacing: { after: 50 }
                  })
                );
              });
            }
          }
        });
      }
    } else {
      // Original key points for non-framework sections
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
    }
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

