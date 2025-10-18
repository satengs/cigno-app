'use client';

import { useState } from 'react';
import { FileText, Download, Eye, ExternalLink, TrendingUp } from 'lucide-react';
import documentService from '../../lib/services/DocumentService';

/**
 * DocumentCard Component
 * Displays a document with metadata and actions
 */
export default function DocumentCard({ document, type = 'internal', index = 0 }) {
  const [isLoading, setIsLoading] = useState(false);

  // Log the full document object to see its structure
  console.log('📄 Document data received:', document);

  const {
    _id,
    id,
    name,
    title,
    description,
    size,
    fileSize,
    mimeType,
    type: docType,
    confidence,
    relevance,
    metadata
  } = document;

  const docId = _id || id;

  // Format the data - check multiple possible field names (prioritize title over name for user-friendliness)
  const displayName = title || name || metadata?.title || metadata?.name || 'Untitled Document';
  const displayDescription = description || metadata?.description || 'No description available';
  const fileSizeBytes = size || fileSize || metadata?.size || metadata?.fileSize || 0;
  const fileType = documentService.getDocumentTypeLabel(mimeType || docType || metadata?.mimeType || metadata?.type || 'application/pdf');
  const confidenceScore = confidence || relevance || metadata?.confidence || metadata?.relevance || 9;
  const confidencePercentage = Math.round(confidenceScore * 10);

  console.log('📊 Formatted document data:', {
    docId,
    displayName,
    fileSizeBytes,
    fileType,
    confidenceScore
  });

  // Handle view document
  const handleView = () => {
    if (!docId) {
      console.error('No document ID available');
      return;
    }
    documentService.viewDocument(docId);
  };

  // Handle download
  const handleDownload = async () => {
    if (!docId) {
      console.error('No document ID available');
      return;
    }
    setIsLoading(true);
    try {
      await documentService.downloadDocument(docId, `${displayName}.pdf`);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get confidence color based on score - matching screenshot design
  const getConfidenceColor = () => {
    if (confidenceScore >= 8) return '#D97706'; // amber-600
    if (confidenceScore >= 5) return '#D97706'; // amber-600
    return '#9CA3AF'; // gray-400
  };

  // Get confidence label
  const getConfidenceLabel = () => {
    if (confidenceScore >= 9) return 'Strong';
    if (confidenceScore >= 7) return 'Good';
    if (confidenceScore >= 5) return 'Moderate';
    return 'Weak';
  };

  return (
    <div 
      className="p-3 rounded-lg border transition-all hover:shadow-sm"
      style={{ 
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-primary)'
      }}
    >
      {/* Content */}
      <div className="flex flex-col space-y-2">
        {/* Number and Title */}
        <div className="flex items-start gap-2">
          <span 
            className="flex-shrink-0 text-sm font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {index + 1}
          </span>
          <div className="flex-1">
            <h4 
              className="text-sm font-semibold mb-1"
              style={{ color: 'var(--text-primary)' }}
              title={displayName}
            >
              {displayName}
            </h4>
            {/* Description */}
            <p 
              className="text-xs line-clamp-2"
              style={{ color: 'var(--text-secondary)' }}
              title={displayDescription}
            >
              {displayDescription}
            </p>
          </div>
        </div>

        {/* Confidence Score */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3" style={{ color: '#9CA3AF' }} />
            <span 
              className="text-xs font-normal"
              style={{ color: '#6B7280' }}
            >
              Confidence : {confidenceScore}/10
            </span>
          </div>

          {/* Segmented progress bar with small vertical bars */}
          <div className="flex gap-1">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="rounded-sm transition-all duration-300"
                style={{
                  width: '5px',
                  height: '12px',
                  backgroundColor: i < (confidenceScore * 3) ? '#D1D5DB' : '#E5E7EB'
                }}
              />
            ))}
          </div>
        </div>

        {/* Metadata badges */}
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <div className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
            <span>{fileType}</span>
          </div>
          {fileSizeBytes > 0 && (
            <div className="flex items-center gap-1">
              <Download className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
              <span>{documentService.formatFileSize(fileSizeBytes)}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
            <span>{type === 'internal' ? 'Internal Report' : 'External Source'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

