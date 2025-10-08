import React, { useState } from 'react';
import { Check } from 'lucide-react';

const LAYOUT_OPTIONS = [
  {
    id: 'title-2-columns',
    name: 'Title + 2 Columns',
    description: 'Header with two equal content columns',
    recommended: true,
    preview: (
      <div className="w-full h-full bg-gray-50 rounded border">
        <div className="h-3 bg-gray-200 rounded-t border-b mb-1"></div>
        <div className="flex gap-1 p-1 h-12">
          <div className="flex-1 bg-gray-100 rounded"></div>
          <div className="flex-1 bg-gray-100 rounded"></div>
        </div>
      </div>
    )
  },
  {
    id: 'bcg-matrix',
    name: 'BCG Matrix',
    description: '2x2 matrix for strategic analysis',
    preview: (
      <div className="w-full h-full bg-gray-50 rounded border">
        <div className="h-2 bg-gray-200 rounded-t border-b mb-1"></div>
        <div className="grid grid-cols-2 gap-1 p-1 h-11">
          <div className="bg-gray-100 rounded"></div>
          <div className="bg-gray-100 rounded"></div>
          <div className="bg-gray-100 rounded"></div>
          <div className="bg-gray-100 rounded"></div>
        </div>
      </div>
    )
  },
  {
    id: 'three-columns',
    name: '3 Columns',
    description: 'Three equal content columns',
    preview: (
      <div className="w-full h-full bg-gray-50 rounded border">
        <div className="h-3 bg-gray-200 rounded-t border-b mb-1"></div>
        <div className="flex gap-1 p-1 h-12">
          <div className="flex-1 bg-gray-100 rounded"></div>
          <div className="flex-1 bg-gray-100 rounded"></div>
          <div className="flex-1 bg-gray-100 rounded"></div>
        </div>
      </div>
    )
  },
  {
    id: 'full-width',
    name: 'Full Width',
    description: 'Single column full width content',
    preview: (
      <div className="w-full h-full bg-gray-50 rounded border">
        <div className="h-3 bg-gray-200 rounded-t border-b mb-1"></div>
        <div className="p-1 h-12">
          <div className="w-full h-full bg-gray-100 rounded"></div>
        </div>
      </div>
    )
  },
  {
    id: 'timeline',
    name: 'Timeline Layout',
    description: 'Horizontal timeline with milestones',
    preview: (
      <div className="w-full h-full bg-gray-50 rounded border">
        <div className="h-3 bg-gray-200 rounded-t border-b mb-1"></div>
        <div className="p-1 h-12 flex items-center">
          <div className="flex-1 h-0.5 bg-gray-300"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full mx-1"></div>
          <div className="flex-1 h-0.5 bg-gray-300"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full mx-1"></div>
          <div className="flex-1 h-0.5 bg-gray-300"></div>
        </div>
      </div>
    )
  },
  {
    id: 'process-flow',
    name: 'Process Flow',
    description: 'Sequential process with arrows',
    preview: (
      <div className="w-full h-full bg-gray-50 rounded border">
        <div className="h-3 bg-gray-200 rounded-t border-b mb-1"></div>
        <div className="p-1 h-12 flex items-center justify-center gap-1">
          <div className="w-3 h-6 bg-gray-100 rounded"></div>
          <div className="w-1 h-0.5 bg-gray-300"></div>
          <div className="w-3 h-6 bg-gray-100 rounded"></div>
          <div className="w-1 h-0.5 bg-gray-300"></div>
          <div className="w-3 h-6 bg-gray-100 rounded"></div>
        </div>
      </div>
    )
  }
];

export default function DeliverableLayoutView({
  hasStoryline,
  onGenerateStoryline,
  isGeneratingStoryline,
  storyline,
  onApplyLayout
}) {
  const [selectedLayout, setSelectedLayout] = useState('title-2-columns');
  const [previewSection, setPreviewSection] = useState(null);

  // Get the first section or use selected section for preview
  const currentSection = previewSection 
    ? storyline?.sections?.find(s => s.id === previewSection)
    : storyline?.sections?.[0];
  
  const currentSectionIndex = storyline?.sections?.findIndex(s => s.id === currentSection?.id) ?? 0;

  if (!hasStoryline) {
    return (
      <div className="p-12 text-center text-gray-500">
        <p className="text-lg font-medium mb-3">Layout unavailable</p>
        <p className="text-sm">Generate a storyline first to unlock the layout view.</p>
        <button
          onClick={onGenerateStoryline}
          disabled={isGeneratingStoryline}
          className={`mt-4 px-4 py-2 rounded-sm text-sm font-medium ${
            isGeneratingStoryline
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}
        >
          {isGeneratingStoryline ? 'Generating...' : 'Generate Storyline'}
        </button>
      </div>
    );
  }

  const handleApplyLayout = (layoutId) => {
    if (onApplyLayout) {
      onApplyLayout(layoutId);
    }
    // Here you could implement the actual layout application logic
    console.log(`Applying layout: ${layoutId}`);
  };

  return (
    <div className="h-full flex">
      {/* Layout Options Sidebar */}
      <div className="w-80 border-r border-gray-200 bg-gray-50">
        <div className="p-4 border-b border-gray-200 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">Layout Options</h2>
          <p className="text-sm text-gray-600 mt-1">Choose a layout for your slides</p>
        </div>
        
        <div className="p-4 space-y-3 overflow-y-auto" style={{ height: 'calc(100vh - 120px)' }}>
          {LAYOUT_OPTIONS.map((layout) => (
            <div
              key={layout.id}
              onClick={() => setSelectedLayout(layout.id)}
              className={`relative p-3 border rounded-lg cursor-pointer transition-all ${
                selectedLayout === layout.id
                  ? 'border-gray-900 bg-white shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {layout.recommended && (
                <div className="absolute -top-2 -right-2 bg-gray-900 text-white text-xs px-2 py-1 rounded">
                  Recommended
                </div>
              )}
              
              <div className="flex items-start space-x-3">
                <div className="w-16 h-12 flex-shrink-0">
                  {layout.preview}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {layout.name}
                    </h3>
                    {selectedLayout === layout.id && (
                      <Check className="w-4 h-4 text-gray-900 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {layout.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t border-gray-200 bg-white">
          <button
            onClick={() => handleApplyLayout(selectedLayout)}
            className="w-full px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-sm hover:bg-gray-800 transition-colors"
          >
            Apply to All Slides
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 bg-white">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Slide Preview</h2>
              <p className="text-sm text-gray-600 mt-1">
                Preview how your content will look with the selected layout
              </p>
            </div>
            <div className="text-sm text-gray-500">
              {LAYOUT_OPTIONS.find(l => l.id === selectedLayout)?.name}
            </div>
          </div>
        </div>
        
        <div className="p-8 h-full overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            {/* Slide Preview */}
            <div className="aspect-[16/9] bg-white border border-gray-200 rounded-lg shadow-sm p-8">
              {selectedLayout === 'title-2-columns' && (
                <div className="h-full">
                  <div className="border-b border-gray-200 pb-4 mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {currentSection?.title || storyline?.title || 'Section Title'}
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                      Section {currentSectionIndex + 1} of {storyline?.sections?.length || 1}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-8 h-4/5">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">
                        {currentSection?.keyPoints?.[0]?.title || 'Key Points'}
                      </h3>
                      <div className="space-y-2 text-sm text-gray-600">
                        {currentSection?.keyPoints?.slice(0, 3).map((point, index) => (
                          <p key={index}>• {point.content || point}</p>
                        )) || (
                          <>
                            <p>• {currentSection?.description?.substring(0, 50) || 'Content point 1'}</p>
                            <p>• Content point 2</p>
                            <p>• Content point 3</p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">
                        {currentSection?.keyPoints?.[1]?.title || 'Additional Points'}
                      </h3>
                      <div className="space-y-2 text-sm text-gray-600">
                        {currentSection?.keyPoints?.slice(3, 6).map((point, index) => (
                          <p key={index}>• {point.content || point}</p>
                        )) || (
                          <>
                            <p>• Supporting detail 1</p>
                            <p>• Supporting detail 2</p>
                            <p>• Supporting detail 3</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {selectedLayout === 'bcg-matrix' && (
                <div className="h-full">
                  <div className="border-b border-gray-200 pb-4 mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {currentSection?.title || storyline?.title || 'Strategic Analysis Matrix'}
                    </h1>
                  </div>
                  <div className="grid grid-cols-2 gap-4 h-4/5">
                    {currentSection?.keyPoints?.slice(0, 4).map((point, index) => {
                      const colors = [
                        { bg: 'bg-green-50', border: 'border-green-200', title: 'text-green-800', text: 'text-green-700' },
                        { bg: 'bg-yellow-50', border: 'border-yellow-200', title: 'text-yellow-800', text: 'text-yellow-700' },
                        { bg: 'bg-blue-50', border: 'border-blue-200', title: 'text-blue-800', text: 'text-blue-700' },
                        { bg: 'bg-red-50', border: 'border-red-200', title: 'text-red-800', text: 'text-red-700' }
                      ];
                      const color = colors[index % 4];
                      return (
                        <div key={index} className={`border ${color.border} rounded p-4 ${color.bg}`}>
                          <h3 className={`font-semibold ${color.title}`}>
                            {point.title || point.split('.')[0] || `Quadrant ${index + 1}`}
                          </h3>
                          <p className={`text-sm ${color.text} mt-2`}>
                            {point.content || point.split('.').slice(1).join('.') || point}
                          </p>
                        </div>
                      );
                    }) || (
                      <>
                        <div className="border border-green-200 rounded p-4 bg-green-50">
                          <h3 className="font-semibold text-green-800">High Priority</h3>
                          <p className="text-sm text-green-700 mt-2">{currentSection?.description?.substring(0, 60) || 'High priority items'}</p>
                        </div>
                        <div className="border border-yellow-200 rounded p-4 bg-yellow-50">
                          <h3 className="font-semibold text-yellow-800">Medium Priority</h3>
                          <p className="text-sm text-yellow-700 mt-2">Medium priority considerations</p>
                        </div>
                        <div className="border border-blue-200 rounded p-4 bg-blue-50">
                          <h3 className="font-semibold text-blue-800">Opportunities</h3>
                          <p className="text-sm text-blue-700 mt-2">Growth opportunities</p>
                        </div>
                        <div className="border border-red-200 rounded p-4 bg-red-50">
                          <h3 className="font-semibold text-red-800">Risks</h3>
                          <p className="text-sm text-red-700 mt-2">Potential risks and challenges</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {selectedLayout === 'three-columns' && (
                <div className="h-full">
                  <div className="border-b border-gray-200 pb-4 mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {currentSection?.title || storyline?.title || 'Section Title'}
                    </h1>
                  </div>
                  <div className="grid grid-cols-3 gap-6 h-4/5">
                    {currentSection?.keyPoints?.slice(0, 3).map((point, index) => (
                      <div key={index} className="text-center">
                        <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">
                          {index + 1}
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {point.title || point.split('.')[0] || `Point ${index + 1}`}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {point.content || point.split('.').slice(1).join('.') || point}
                        </p>
                      </div>
                    )) || storyline?.sections?.slice(0, 3).map((section, index) => (
                      <div key={index} className="text-center">
                        <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">
                          {index + 1}
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {section.title || `Section ${index + 1}`}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {section.description || `Section ${index + 1} content`}
                        </p>
                      </div>
                    )) || (
                      <>
                        <div className="text-center">
                          <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">1</div>
                          <h3 className="font-semibold text-gray-900 mb-2">Phase 1</h3>
                          <p className="text-sm text-gray-600">First phase description</p>
                        </div>
                        <div className="text-center">
                          <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">2</div>
                          <h3 className="font-semibold text-gray-900 mb-2">Phase 2</h3>
                          <p className="text-sm text-gray-600">Second phase description</p>
                        </div>
                        <div className="text-center">
                          <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">3</div>
                          <h3 className="font-semibold text-gray-900 mb-2">Phase 3</h3>
                          <p className="text-sm text-gray-600">Third phase description</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {selectedLayout === 'full-width' && (
                <div className="h-full">
                  <div className="border-b border-gray-200 pb-4 mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {currentSection?.title || storyline?.title || 'Content Title'}
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                      {LAYOUT_OPTIONS.find(l => l.id === selectedLayout)?.description}
                    </p>
                  </div>
                  <div className="space-y-6 h-4/5 overflow-y-auto">
                    <div className="prose max-w-none">
                      <p className="text-gray-700 leading-relaxed">
                        {currentSection?.description || storyline?.executiveSummary || 'Full width content section'}
                      </p>
                    </div>
                    {currentSection?.keyPoints && (
                      <div className="space-y-3">
                        <h3 className="font-semibold text-gray-900">Key Points</h3>
                        <ul className="space-y-2">
                          {currentSection.keyPoints.map((point, index) => (
                            <li key={index} className="flex items-start">
                              <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                              <span className="text-gray-700">{point.content || point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedLayout === 'timeline' && (
                <div className="h-full">
                  <div className="border-b border-gray-200 pb-4 mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {currentSection?.title || storyline?.title || 'Timeline'}
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                      {LAYOUT_OPTIONS.find(l => l.id === selectedLayout)?.description}
                    </p>
                  </div>
                  <div className="h-4/5 flex items-center">
                    <div className="w-full">
                      <div className="flex items-center justify-between relative">
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-300 -translate-y-1/2"></div>
                        {(currentSection?.keyPoints?.slice(0, 4) || storyline?.sections?.slice(0, 4) || []).map((item, index) => (
                          <div key={index} className="relative bg-white px-2">
                            <div className="w-4 h-4 bg-gray-900 rounded-full mx-auto mb-3"></div>
                            <div className="text-center min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 mb-1">
                                {item.title || item.split('.')[0] || `Milestone ${index + 1}`}
                              </h4>
                              <p className="text-xs text-gray-600">
                                {item.content || item.description || `Step ${index + 1}`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedLayout === 'process-flow' && (
                <div className="h-full">
                  <div className="border-b border-gray-200 pb-4 mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {currentSection?.title || storyline?.title || 'Process Flow'}
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                      {LAYOUT_OPTIONS.find(l => l.id === selectedLayout)?.description}
                    </p>
                  </div>
                  <div className="h-4/5 flex items-center justify-center">
                    <div className="flex items-center space-x-4">
                      {(currentSection?.keyPoints?.slice(0, 3) || storyline?.sections?.slice(0, 3) || []).map((item, index, array) => (
                        <React.Fragment key={index}>
                          <div className="text-center">
                            <div className="w-24 h-16 bg-gray-100 border border-gray-300 rounded flex items-center justify-center mx-auto mb-2">
                              <span className="text-sm font-medium text-gray-700">
                                {item.title?.substring(0, 10) || `Step ${index + 1}`}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 max-w-24">
                              {item.content?.substring(0, 30) || item.description?.substring(0, 30) || `Process ${index + 1}`}
                            </p>
                          </div>
                          {index < array.length - 1 && (
                            <div className="flex items-center">
                              <div className="w-8 h-0.5 bg-gray-400"></div>
                              <div className="w-2 h-2 border-t-2 border-r-2 border-gray-400 transform rotate-45 -ml-1"></div>
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Section Navigation */}
            {storyline?.sections && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Apply to Specific Sections</h3>
                <div className="grid grid-cols-2 gap-3">
                  {storyline.sections.slice(0, 6).map((section, index) => (
                    <button
                      key={section.id || index}
                      onClick={() => setPreviewSection(section.id)}
                      className="text-left p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    >
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {section.title || `Section ${index + 1}`}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {section.status || 'draft'} • {section.estimatedSlides || 3} slides
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
