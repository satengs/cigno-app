/**
 * Document Service
 * Handles all document-related API calls to the knowledge base
 */

const API_BASE_URL = 'https://ai.vave.ch';
const API_KEY = 'd4abe60bb87d3f6156285c0e0341ccb7965b387638cab06ed4f7d8566e9b3111';

// Knowledge Base IDs
export const KNOWLEDGE_BASE_IDS = {
  INTERNAL: '68f39475dfc921b68ec3e7c5',
  EXTERNAL: ['68ee09bb3336fc38f961c113', '68dbb18b69a8c6e904fb940d']
};

class DocumentService {
  constructor() {
    this.apiKey = API_KEY;
    this.baseUrl = API_BASE_URL;
  }

  /**
   * Get headers for API requests
   */
  getHeaders() {
    return {
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Fetch all documents from a knowledge base
   * @param {string|Array} knowledgeBaseId - Knowledge base ID(s) to filter by
   * @param {Object} options - Optional filtering options
   * @returns {Promise<Array>} Array of document metadata
   */
  async fetchDocuments(knowledgeBaseId, options = {}) {
    try {
      const ids = Array.isArray(knowledgeBaseId) ? knowledgeBaseId : [knowledgeBaseId];
      const { excludeTitleContains } = options;
      
      console.log('📚 Fetching documents from knowledge bases:', ids);
      
      // Fetch from all knowledge bases
      const allDocuments = await Promise.all(
        ids.map(async (id) => {
          const url = `/api/documents?knowledgeBaseId=${id}`;
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            console.warn(`⚠️ Failed to fetch from knowledge base ${id}: ${response.status}`);
            return [];
          }

          const data = await response.json();
          return data.documents || [];
        })
      );

      // Flatten all documents
      let documents = allDocuments.flat();
      
      console.log('📦 Total documents before filtering:', documents.length);

      // Apply title exclusion filter if specified
      if (excludeTitleContains && Array.isArray(excludeTitleContains)) {
        const originalCount = documents.length;
        documents = documents.filter(doc => {
          const title = (doc.name || doc.title || '').toLowerCase();
          const shouldExclude = excludeTitleContains.some(term => 
            title.includes(term.toLowerCase())
          );
          return !shouldExclude;
        });
        console.log(`🔍 Filtered out ${originalCount - documents.length} documents containing excluded terms`);
      }
      
      console.log('✅ Documents fetched successfully:', documents.length);
      
      return documents;
    } catch (error) {
      console.error('❌ Error fetching documents:', error);
      throw error;
    }
  }

  /**
   * Get thumbnail URL for a document
   * @param {string} docId - Document ID
   * @returns {string} Thumbnail URL
   */
  getThumbnailUrl(docId) {
    return `${this.baseUrl}/api/documents/${docId}/thumbnail?apiKey=${this.apiKey}`;
  }

  /**
   * Get view URL for a document (opens PDF)
   * @param {string} docId - Document ID
   * @returns {string} View URL
   */
  getViewUrl(docId) {
    return `${this.baseUrl}/api/documents/${docId}/view?apiKey=${this.apiKey}`;
  }

  /**
   * Download document
   * @param {string} docId - Document ID
   * @param {string} filename - Filename for download
   */
  async downloadDocument(docId, filename) {
    try {
      const url = this.getViewUrl(docId);
      
      console.log('⬇️ Downloading document:', filename);
      
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`Failed to download document: ${response.status}`);
      }

      const blob = await response.blob();
      
      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || `document-${docId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      console.log('✅ Document downloaded successfully');
    } catch (error) {
      console.error('❌ Error downloading document:', error);
      throw error;
    }
  }

  /**
   * View document in new tab
   * @param {string} docId - Document ID
   */
  viewDocument(docId) {
    const url = this.getViewUrl(docId);
    window.open(url, '_blank');
  }

  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted size (e.g., "3.4 MB")
   */
  formatFileSize(bytes) {
    if (!bytes || bytes === 0) {
      console.log('⚠️ Missing file size in document data');
      return '';
    }
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }

  /**
   * Get document type label
   * @param {string} mimeType - MIME type
   * @returns {string} Human-readable type
   */
  getDocumentTypeLabel(mimeType) {
    const typeMap = {
      'application/pdf': 'PDF',
      'application/msword': 'Word',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
      'application/vnd.ms-excel': 'Excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
      'application/vnd.ms-powerpoint': 'PowerPoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint',
      'text/plain': 'Text',
      'text/csv': 'CSV'
    };

    return typeMap[mimeType] || 'Document';
  }
}

// Export singleton instance
const documentService = new DocumentService();
export default documentService;

