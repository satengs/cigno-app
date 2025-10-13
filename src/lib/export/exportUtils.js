import PptxGenJS from "pptxgenjs";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// Layout-specific slide generators
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

  'bcg-matrix': (slide, section) => {
    slide.addText(section.title, { 
      x: 0.5, y: 0.5, w: 9, h: 1, 
      fontSize: 24, bold: true, color: "1f2937" 
    });
    
    // 2x2 matrix layout
    const quadrants = section.keyPoints?.slice(0, 4) || [];
    const positions = [
      { x: 0.5, y: 2, color: "16a34a" },   // Green
      { x: 5, y: 2, color: "eab308" },     // Yellow  
      { x: 0.5, y: 4, color: "3b82f6" },  // Blue
      { x: 5, y: 4, color: "dc2626" }     // Red
    ];
    
    quadrants.forEach((point, i) => {
      const pos = positions[i];
      slide.addText(point.title || `Quadrant ${i + 1}`, {
        x: pos.x, y: pos.y, w: 4, h: 0.5,
        fontSize: 14, bold: true, color: pos.color
      });
      slide.addText(point.content || point, {
        x: pos.x, y: pos.y + 0.6, w: 4, h: 1.2,
        fontSize: 11, color: "374151"
      });
    });
  },

  'three-columns': (slide, section) => {
    slide.addText(section.title, { 
      x: 0.5, y: 0.5, w: 9, h: 1, 
      fontSize: 24, bold: true, color: "1f2937" 
    });
    
    const columns = [
      section.keyPoints?.slice(0, Math.ceil(section.keyPoints.length / 3)) || [],
      section.keyPoints?.slice(Math.ceil(section.keyPoints.length / 3), Math.ceil(section.keyPoints.length * 2 / 3)) || [],
      section.keyPoints?.slice(Math.ceil(section.keyPoints.length * 2 / 3)) || []
    ];
    
    columns.forEach((column, colIndex) => {
      column.forEach((point, i) => {
        slide.addText(`• ${point.content || point}`, {
          x: 0.5 + colIndex * 3.17, y: 2 + i * 0.4, w: 2.8, h: 0.3,
          fontSize: 12, color: "374151"
        });
      });
    });
  },

  'full-width': (slide, section) => {
    slide.addText(section.title, { 
      x: 0.5, y: 0.5, w: 9, h: 1, 
      fontSize: 24, bold: true, color: "1f2937" 
    });
    
    slide.addText(section.description, {
      x: 0.5, y: 1.8, w: 9, h: 1.5,
      fontSize: 14, color: "374151"
    });
    
    section.keyPoints?.forEach((point, i) => {
      slide.addText(`• ${point.content || point}`, {
        x: 0.5, y: 3.5 + i * 0.4, w: 9, h: 0.3,
        fontSize: 12, color: "374151"
      });
    });
  },

  'timeline': (slide, section) => {
    slide.addText(section.title, { 
      x: 0.5, y: 0.5, w: 9, h: 1, 
      fontSize: 24, bold: true, color: "1f2937" 
    });
    
    const timelineItems = section.keyPoints?.slice(0, 4) || [];
    timelineItems.forEach((item, i) => {
      const x = 1.5 + i * 2;
      
      // Timeline node
      slide.addShape("circle", {
        x: x, y: 3, w: 0.3, h: 0.3,
        fill: { color: "1f2937" }
      });
      
      // Timeline item
      slide.addText(item.title || `Step ${i + 1}`, {
        x: x - 0.5, y: 3.5, w: 1.3, h: 0.4,
        fontSize: 10, bold: true, align: "center", color: "1f2937"
      });
      
      slide.addText(item.content || item, {
        x: x - 0.75, y: 4, w: 1.8, h: 0.8,
        fontSize: 9, align: "center", color: "374151"
      });
    });
  },

  'process-flow': (slide, section) => {
    slide.addText(section.title, { 
      x: 0.5, y: 0.5, w: 9, h: 1, 
      fontSize: 24, bold: true, color: "1f2937" 
    });
    
    const processes = section.keyPoints?.slice(0, 3) || [];
    processes.forEach((process, i) => {
      const x = 1 + i * 3;
      
      // Process box
      slide.addShape("rect", {
        x: x, y: 2.5, w: 2, h: 1.5,
        fill: { color: "f3f4f6" },
        line: { color: "d1d5db", width: 1 }
      });
      
      slide.addText(process.title || `Process ${i + 1}`, {
        x: x, y: 2.8, w: 2, h: 0.4,
        fontSize: 12, bold: true, align: "center", color: "1f2937"
      });
      
      slide.addText(process.content || process, {
        x: x, y: 3.3, w: 2, h: 0.8,
        fontSize: 10, align: "center", color: "374151"
      });
      
      // Arrow (except for last item)
      if (i < processes.length - 1) {
        slide.addShape("rightArrow", {
          x: x + 2.2, y: 3.1, w: 0.6, h: 0.3,
          fill: { color: "6b7280" }
        });
      }
    });
  }
};

// PPTX Export with Layout Support
export const downloadPptx = (storyline, selectedLayout = 'title-2-columns') => {
  const pptx = new PptxGenJS();
  
  // Title slide
  const titleSlide = pptx.addSlide();
  titleSlide.addText(storyline.title || storyline.name || "Cigno Presentation", {
    x: 1, y: 2, w: 8, h: 2,
    fontSize: 32, bold: true, align: "center", color: "1f2937"
  });
  
  titleSlide.addText("Generated from Cigno Platform", {
    x: 1, y: 4.5, w: 8, h: 1,
    fontSize: 16, align: "center", color: "6b7280"
  });

  // Content slides
  storyline.sections?.forEach((section) => {
    const slide = pptx.addSlide();
    const layoutToUse = section.layout || selectedLayout;
    const generator = layoutGenerators[layoutToUse] || layoutGenerators['full-width'];
    
    generator(slide, section);
    
    // Add layout indicator
    slide.addText(`Layout: ${layoutToUse}`, {
      x: 8.5, y: 6.5, w: 1.5, h: 0.3,
      fontSize: 8, color: "9ca3af", align: "right"
    });
  });

  const fileName = `${storyline.title || storyline.name || 'cigno-presentation'}.pptx`;
  pptx.writeFile({ fileName });
};

// DOCX Export with Layout Awareness
export const downloadDocx = async (storyline, selectedLayout = 'title-2-columns') => {
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
    const layoutUsed = section.layout || selectedLayout;
    
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
    
    // Add layout-specific formatting
    if (layoutUsed === 'bcg-matrix' && section.keyPoints?.length >= 4) {
      sections.push(
        new Paragraph({
          text: "Strategic Matrix Analysis:",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        })
      );
      
      section.keyPoints.slice(0, 4).forEach((point, i) => {
        const quadrantNames = ['High Priority', 'Medium Priority', 'Opportunities', 'Risks'];
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${quadrantNames[i]}: `, bold: true }),
              new TextRun({ text: point.content || point })
            ],
            spacing: { after: 100 }
          })
        );
      });
    } else {
      // Standard key points
      section.keyPoints?.forEach((point) => {
        sections.push(
          new Paragraph({
            text: `• ${point.content || point}`,
            spacing: { after: 100 }
          })
        );
      });
    }
    
    // Add layout info
    sections.push(
      new Paragraph({
        text: `Applied Layout: ${layoutUsed}`,
        spacing: { before: 200, after: 400 },
        alignment: "right"
      })
    );
  });

  const doc = new Document({
    sections: [{
      children: sections
    }]
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `${storyline.title || storyline.name || 'cigno-document'}.docx`;
  saveAs(blob, fileName);
};

// XLSX Export with Layout Data
export const downloadXlsx = async (storyline, selectedLayout = 'title-2-columns') => {
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

  // Style headers
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE5E7EB' }
  };

  // Add data
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
  saveAs(new Blob([buffer]), fileName);
};

// Unified export hook
export const useStorylineExport = (storyline, selectedLayout) => {
  const download = (format) => {
    if (!storyline) {
      console.warn('No storyline data available for export');
      return;
    }

    switch (format) {
      case "pptx": 
        return downloadPptx(storyline, selectedLayout);
      case "docx": 
        return downloadDocx(storyline, selectedLayout);
      case "xlsx": 
        return downloadXlsx(storyline, selectedLayout);
      default: 
        throw new Error(`Unsupported format: ${format}`);
    }
  };

  return { download };
};