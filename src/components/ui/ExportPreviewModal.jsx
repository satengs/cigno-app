'use client';

import { useState } from 'react';
import { X, FileText, Presentation, Sheet } from 'lucide-react';
import { renderFrameworkContent } from '../../lib/frameworkRenderer';
import dynamic from 'next/dynamic';

const ChartPreview = dynamic(() => import('../storyline/ChartPreview'), { 
  ssr: false,
  loading: () => <div className="h-32 flex items-center justify-center text-gray-500">Loading chart...</div>
});

const LAYOUT_OPTIONS = [
  { id: 'title-2-columns', name: 'Title + 2 Columns' },
  { id: 'bcg-matrix', name: 'BCG Matrix' },
  { id: 'three-columns', name: '3 Columns' },
  { id: 'full-width', name: 'Full Width' },
  { id: 'timeline', name: 'Timeline Layout' },
  { id: 'process-flow', name: 'Process Flow' }
];

export default function ExportPreviewModal({ isOpen, onClose, storyline, selectedLayout, onExport }) {
  const [previewFormat, setPreviewFormat] = useState('pptx');
  const [expandedSections, setExpandedSections] = useState(new Set());

  const toggleSectionExpansion = (sectionId) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const renderSectionPreview = (section) => {
    if (!section) return null;

    // Render framework content if available
    if (section.framework) {
      const rendered = renderFrameworkContent(
        section.framework, 
        section.slideContent, 
        section.keyPoints || [], 
        section.citations || []
      );

      return (
        <div className="space-y-4">
          {/* Framework HTML content */}
          <div 
            className="prose prose-sm prose-slate max-w-none"
            dangerouslySetInnerHTML={{ __html: rendered.html }}
          />
          
          {/* Charts */}
          {section.charts && section.charts.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Charts</h4>
              {section.framework === 'market_sizing' && section.charts.length > 1 ? (
                <div className="grid grid-cols-2 gap-3">
                  {section.charts.map((chart) => (
                    <div key={chart.id} className="bg-white rounded-lg border p-3">
                      <h5 className="text-xs font-medium text-gray-800 mb-2 text-center">
                        {chart.title}
                      </h5>
                      <div className="h-32">
                        <ChartPreview chart={chart} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {section.charts.map((chart) => (
                    <div key={chart.id} className="bg-white rounded-lg border p-3">
                      <h5 className="text-sm font-medium text-gray-800 mb-2">
                        {chart.title}
                      </h5>
                      <div className="h-40">
                        <ChartPreview chart={chart} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    // Render regular section content
    return (
      <div className="space-y-3">
        {section.description && (
          <p className="text-sm text-gray-700">{section.description}</p>
        )}
        {section.keyPoints && section.keyPoints.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Key Points</h4>
            <ul className="space-y-1">
              {section.keyPoints.map((point, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start">
                  <span className="mr-2">•</span>
                  <span>{typeof point === 'string' ? point : point.content || point.text || ''}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  const formatIcons = {
    pptx: <Presentation size={16} />,
    docx: <FileText size={16} />,
    xlsx: <Sheet size={16} />
  };

  const formatNames = {
    pptx: 'PowerPoint Presentation',
    docx: 'Word Document',
    xlsx: 'Excel Spreadsheet'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-primary)' }}>
          <div className="flex items-center gap-2">
            <Presentation size={20} style={{ color: 'var(--text-primary)' }} />
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Export Preview
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
          >
            <X size={20} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Format Selection */}
        <div className="p-4 border-b" style={{ borderColor: 'var(--border-primary)' }}>
          <div className="flex gap-2">
            {Object.entries(formatNames).map(([format, name]) => (
              <button
                key={format}
                onClick={() => setPreviewFormat(format)}
                className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
                  previewFormat === format 
                    ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {formatIcons[format]}
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Preview Content */}
        <div className="p-4 overflow-y-auto max-h-[50vh]">
          <div className="space-y-4">
            {/* Document Info */}
            <div className="bg-gray-50 p-3 rounded">
              <h3 className="font-medium text-gray-900 mb-2">Document Information</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Title:</strong> {storyline?.title || storyline?.name || 'Cigno Presentation'}</p>
                <p><strong>Sections:</strong> {storyline?.sections?.length || 0}</p>
                <p><strong>Format:</strong> {formatNames[previewFormat]}</p>
                <p><strong>Default Layout:</strong> {LAYOUT_OPTIONS.find(l => l.id === selectedLayout)?.name || selectedLayout}</p>
              </div>
            </div>

            {/* Sections Preview */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Sections to Export</h3>
              <div className="space-y-3">
                {storyline?.sections?.map((section, index) => {
                  const sectionId = section.id || index;
                  const isExpanded = expandedSections.has(sectionId);
                  
                  return (
                    <div key={sectionId} className="border rounded-lg" style={{ borderColor: 'var(--border-primary)' }}>
                      {/* Section Header */}
                      <div 
                        className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => toggleSectionExpansion(sectionId)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                {index + 1}. {section.title}
                              </h4>
                              <span className="text-xs text-gray-400">
                                {isExpanded ? '▼' : '▶'}
                              </span>
                            </div>
                            {section.description && (
                              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                                {section.description.substring(0, 100)}
                                {section.description.length > 100 ? '...' : ''}
                              </p>
                            )}
                            {/* Show framework-specific content */}
                            {section.framework && (
                              <div className="mt-2 space-y-1">
                                {section.insights && section.insights.length > 0 && (
                                  <div className="text-xs text-blue-600">
                                    {section.insights.length} insights
                                  </div>
                                )}
                                {section.charts && section.charts.length > 0 && (
                                  <div className="text-xs text-green-600">
                                    {section.charts.length} charts
                                  </div>
                                )}
                                <div className="text-xs text-purple-600">
                                  {section.framework.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Framework
                                </div>
                              </div>
                            )}
                            
                            {/* Show key points for non-framework sections */}
                            {!section.framework && section.keyPoints && section.keyPoints.length > 0 && (
                              <div className="mt-2">
                                <span className="text-xs text-gray-500">
                                  {section.keyPoints.length} key points
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-3 text-right">
                            <div className="text-xs px-2 py-1 rounded" style={{ 
                              backgroundColor: section.layout ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                              color: 'var(--text-secondary)'
                            }}>
                              {section.layout 
                                ? LAYOUT_OPTIONS.find(l => l.id === section.layout)?.name || section.layout
                                : `Default (${LAYOUT_OPTIONS.find(l => l.id === selectedLayout)?.name})`
                              }
                            </div>
                            <div className="text-xs mt-1 text-gray-500">
                              {section.status || 'draft'}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Expanded Content Preview */}
                      {isExpanded && (
                        <div className="border-t p-4 bg-gray-50" style={{ borderColor: 'var(--border-primary)' }}>
                          <div className="max-h-96 overflow-y-auto">
                            {renderSectionPreview(section)}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Format-specific Preview */}
            <div className="bg-blue-50 p-3 rounded">
              <h4 className="font-medium text-blue-900 mb-2">
                {formatNames[previewFormat]} Features
              </h4>
              <div className="text-sm text-blue-800">
                {previewFormat === 'pptx' && (
                  <ul className="space-y-1">
                    <li>• Title slide with presentation name</li>
                    <li>• One slide per section with applied layout</li>
                    <li>• Framework content (insights, charts, data tables)</li>
                    <li>• Visual layouts (2-columns, matrix, timeline, etc.)</li>
                    <li>• Chart data and visualizations included</li>
                  </ul>
                )}
                {previewFormat === 'docx' && (
                  <ul className="space-y-1">
                    <li>• Structured document with headings</li>
                    <li>• Framework content (insights, charts, data tables)</li>
                    <li>• Section descriptions and key points</li>
                    <li>• Chart data and visualizations included</li>
                    <li>• Professional document styling</li>
                  </ul>
                )}
                {previewFormat === 'xlsx' && (
                  <ul className="space-y-1">
                    <li>• Structured data table with sections</li>
                    <li>• Columns for title, description, key points</li>
                    <li>• Applied layout tracking</li>
                    <li>• Status and metadata information</li>
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onExport(previewFormat);
              onClose();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            {formatIcons[previewFormat]}
            Export as {formatNames[previewFormat]}
          </button>
        </div>
      </div>
    </div>
  );
}