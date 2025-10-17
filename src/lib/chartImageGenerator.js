// Color palette for charts (hex colors that work with PptxGenJS)
const CHART_COLORS = [
  'FF6B6B', // Red
  '4ECDC4', // Teal
  '45B7D1', // Blue
  '96CEB4', // Green
  'FFEAA7', // Yellow
  'DDA0DD', // Plum
  '98D8C8', // Mint
  'F7DC6F', // Gold
  'BB8FCE', // Light Purple
  '85C1E9'  // Light Blue
];

// Convert HSL to hex color
function hslToHex(h, s, l) {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Get hex color for chart bars
function getHexColor(index) {
  if (index < CHART_COLORS.length) {
    return CHART_COLORS[index];
  }
  // Generate a color for indices beyond our palette
  const hue = (index * 137.5) % 360; // Golden angle for good distribution
  return hslToHex(hue, 70, 50).replace('#', '');
}

// Chart reference management
let chartRefs = { current: {} };

export function registerChartRef(id, chart) {
  chartRefs.current[id] = chart;
}

export function getChartRef(id) {
  return chartRefs.current[id];
}

export function clearChartRefs() {
  chartRefs.current = {};
}

// Simple chart data formatter for PowerPoint export
export function formatChartDataForPPT(chartConfig) {
  if (!chartConfig || !chartConfig.data) {
    return null;
  }

  const { labels, datasets } = chartConfig.data;
  if (!labels || !datasets || datasets.length === 0) {
    return null;
  }

  // Create a simple table representation of the chart data
  const tableData = [];
  
  // Add header row
  const headerRow = ['Category', ...datasets.map(dataset => dataset.label || 'Value')];
  tableData.push(headerRow);
  
  // Add data rows
  labels.forEach((label, index) => {
    const row = [label, ...datasets.map(dataset => dataset.data[index] || 0)];
    tableData.push(row);
  });

  return tableData;
}

export function generateChartVisualization(slide, chart, x, y, w, h) {
  if (!chart.config || !chart.config.data) {
    return false;
  }

  const { labels, datasets } = chart.config.data;
  if (!labels || !datasets || datasets.length === 0) {
    return false;
  }

  // Register chart reference
  const chartId = chart.id || `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  registerChartRef(chartId, chart);

  try {
        // Add chart title (smaller)
        slide.addText(chart.title || 'Chart', {
          x: x,
          y: y,
          w: w,
          h: 0.2,
          fontSize: 10,
          bold: true,
          color: '1f2937',
          align: 'center'
        });

    // Create a visual representation using shapes and text
    // Since PptxGenJS doesn't have built-in charts, we'll create a bar chart using shapes
    try {
      const maxValue = Math.max(...datasets.flatMap(d => d.data));
      const barWidth = (w / (labels.length * 2)) * 0.5; // 50% smaller bars
      const chartHeight = (h - 0.4) * 0.5; // 50% smaller chart height
      const barSpacing = barWidth * 0.1; // Smaller spacing
      
      // Add axis labels (smaller)
      labels.forEach((label, index) => {
        slide.addText(label, {
          x: x + (index * barWidth * 2) + barWidth * 0.5,
          y: y + h - 0.15,
          w: barWidth,
          h: 0.15,
          fontSize: 6,
          color: '666666',
          align: 'center'
        });
      });

      // Add value labels on top of bars
      datasets.forEach((dataset, datasetIndex) => {
        dataset.data.forEach((value, index) => {
          const barHeight = (value / maxValue) * chartHeight;
          const barX = x + (index * barWidth * 2) + (datasetIndex * barWidth) + barSpacing;
          const barY = y + 0.4 + chartHeight - barHeight;
          
          // Add bar
          slide.addShape('rect', {
            x: barX,
            y: barY,
            w: barWidth - barSpacing,
            h: barHeight,
            fill: { color: getHexColor(datasetIndex) },
            line: { color: '333333', width: 1 }
          });
          
          // Add value label (smaller)
          slide.addText(value.toString(), {
            x: barX,
            y: barY - 0.1,
            w: barWidth - barSpacing,
            h: 0.1,
            fontSize: 6,
            color: '333333',
            align: 'center'
          });
        });
      });

      // Add legend (smaller)
      if (datasets.length > 1) {
        datasets.forEach((dataset, index) => {
          slide.addShape('rect', {
            x: x + (index * 0.8),
            y: y + 0.1,
            w: 0.1,
            h: 0.05,
            fill: { color: getHexColor(index) }
          });
          slide.addText(dataset.label || `Series ${index + 1}`, {
            x: x + (index * 0.8) + 0.15,
            y: y + 0.1,
            w: 0.6,
            h: 0.05,
            fontSize: 6,
            color: '333333'
          });
        });
      }

    } catch (chartError) {
      console.log('Chart creation failed, using text format:', chartError.message);
      
      // Fallback: Add chart data as formatted text (smaller)
      let currentY = y + 0.2;
      const lineHeight = 0.15;
      
      // Add header
      const headerText = ['Category', ...labels].join(' | ');
      slide.addText(headerText, {
        x: x,
        y: currentY,
        w: w,
        h: lineHeight,
        fontSize: 8,
        bold: true,
        color: '1f2937'
      });
      currentY += lineHeight;
      
      // Add separator line
      slide.addText('─'.repeat(30), {
        x: x,
        y: currentY,
        w: w,
        h: lineHeight,
        fontSize: 6,
        color: 'CCCCCC'
      });
      currentY += lineHeight;
      
      // Add data rows
      datasets.forEach(dataset => {
        const rowText = `${dataset.label || 'Value'} | ${dataset.data.join(' | ')}`;
        slide.addText(rowText, {
          x: x,
          y: currentY,
          w: w,
          h: lineHeight,
          fontSize: 8,
          color: '374151'
        });
        currentY += lineHeight;
      });
    }

    return true;
  } catch (error) {
    console.error('Error creating chart visualization:', error);
    return false;
  }
}

export async function generateMultipleChartImages(charts) {
  // This function now returns chart data for PowerPoint table generation
  return charts.map((chart, index) => ({
    chartId: chart.id || `chart-${index}`,
    title: chart.title || `Chart ${index + 1}`,
    config: chart.config,
    tableData: formatChartDataForPPT(chart.config)
  }));
}
