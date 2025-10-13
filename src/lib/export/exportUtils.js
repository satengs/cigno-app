// Client-side export utilities using API endpoints

// Unified download function using API
const downloadViaAPI = async (storyline, format, selectedLayout = 'title-2-columns') => {
  try {
    const response = await fetch('/api/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        storyline,
        format,
        selectedLayout
      })
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    // Get the file as a blob
    const blob = await response.blob();
    const contentDisposition = response.headers.get('Content-Disposition');
    const fileName = contentDisposition 
      ? contentDisposition.split('filename=')[1].replace(/"/g, '')
      : `cigno-export.${format}`;

    // Trigger download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error(`Export failed:`, error);
    throw error;
  }
};

// Individual format functions (now using API)
export const downloadPptx = async (storyline, selectedLayout = 'title-2-columns') => {
  return downloadViaAPI(storyline, 'pptx', selectedLayout);
};

export const downloadDocx = async (storyline, selectedLayout = 'title-2-columns') => {
  return downloadViaAPI(storyline, 'docx', selectedLayout);
};

export const downloadXlsx = async (storyline, selectedLayout = 'title-2-columns') => {
  return downloadViaAPI(storyline, 'xlsx', selectedLayout);
};

// Unified export hook
export const useStorylineExport = (storyline, selectedLayout) => {
  const download = async (format) => {
    if (!storyline) {
      console.warn('No storyline data available for export');
      return;
    }

    try {
      switch (format) {
        case "pptx": 
          return await downloadPptx(storyline, selectedLayout);
        case "docx": 
          return await downloadDocx(storyline, selectedLayout);
        case "xlsx": 
          return await downloadXlsx(storyline, selectedLayout);
        default: 
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error) {
      console.error(`Export failed for format ${format}:`, error);
      throw error;
    }
  };

  return { download };
};