import React, { useState } from 'react';
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react';

const LAYOUT_OPTIONS = [
  {
    id: 'title-2-columns',
    name: 'Title + 2 Columns',
    description: 'Header with two equal content columns',
    recommended: true,
    preview: (
      <div className="w-full h-full rounded border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
        <div className="h-3 rounded-t border-b mb-1" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}></div>
        <div className="flex gap-1 p-1 h-12">
          <div className="flex-1 rounded" style={{ backgroundColor: 'var(--bg-primary)' }}></div>
          <div className="flex-1 rounded" style={{ backgroundColor: 'var(--bg-primary)' }}></div>
        </div>
      </div>
    )
  },
  {
    id: 'bcg-matrix',
    name: 'BCG Matrix',
    description: '2x2 matrix for strategic analysis',
    preview: (
      <div className="w-full h-full rounded border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
        <div className="h-2 rounded-t border-b mb-1" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}></div>
        <div className="grid grid-cols-2 gap-1 p-1 h-11">
          <div className="rounded" style={{ backgroundColor: 'var(--bg-primary)' }}></div>
          <div className="rounded" style={{ backgroundColor: 'var(--bg-primary)' }}></div>
          <div className="rounded" style={{ backgroundColor: 'var(--bg-primary)' }}></div>
          <div className="rounded" style={{ backgroundColor: 'var(--bg-primary)' }}></div>
        </div>
      </div>
    )
  },
  {
    id: 'three-columns',
    name: '3 Columns',
    description: 'Three equal content columns',
    preview: (
      <div className="w-full h-full rounded border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
        <div className="h-3 rounded-t border-b mb-1" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}></div>
        <div className="flex gap-1 p-1 h-12">
          <div className="flex-1 rounded" style={{ backgroundColor: 'var(--bg-primary)' }}></div>
          <div className="flex-1 rounded" style={{ backgroundColor: 'var(--bg-primary)' }}></div>
          <div className="flex-1 rounded" style={{ backgroundColor: 'var(--bg-primary)' }}></div>
        </div>
      </div>
    )
  },
  {
    id: 'full-width',
    name: 'Full Width',
    description: 'Single column full width content',
    preview: (
      <div className="w-full h-full rounded border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
        <div className="h-3 rounded-t border-b mb-1" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}></div>
        <div className="p-1 h-12">
          <div className="w-full h-full rounded" style={{ backgroundColor: 'var(--bg-primary)' }}></div>
        </div>
      </div>
    )
  },
  {
    id: 'timeline',
    name: 'Timeline Layout',
    description: 'Horizontal timeline with milestones',
    preview: (
      <div className="w-full h-full rounded border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
        <div className="h-3 rounded-t border-b mb-1" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}></div>
        <div className="p-1 h-12 flex items-center">
          <div className="flex-1 h-0.5" style={{ backgroundColor: 'var(--border-secondary)' }}></div>
          <div className="w-2 h-2 rounded-full mx-1" style={{ backgroundColor: 'var(--text-primary)' }}></div>
          <div className="flex-1 h-0.5" style={{ backgroundColor: 'var(--border-secondary)' }}></div>
          <div className="w-2 h-2 rounded-full mx-1" style={{ backgroundColor: 'var(--text-primary)' }}></div>
          <div className="flex-1 h-0.5" style={{ backgroundColor: 'var(--border-secondary)' }}></div>
        </div>
      </div>
    )
  },
  {
    id: 'process-flow',
    name: 'Process Flow',
    description: 'Sequential process with arrows',
    preview: (
      <div className="w-full h-full rounded border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
        <div className="h-3 rounded-t border-b mb-1" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}></div>
        <div className="p-1 h-12 flex items-center justify-center gap-1">
          <div className="w-3 h-6 rounded" style={{ backgroundColor: 'var(--bg-primary)' }}></div>
          <div className="w-1 h-0.5" style={{ backgroundColor: 'var(--border-secondary)' }}></div>
          <div className="w-3 h-6 rounded" style={{ backgroundColor: 'var(--bg-primary)' }}></div>
          <div className="w-1 h-0.5" style={{ backgroundColor: 'var(--border-secondary)' }}></div>
          <div className="w-3 h-6 rounded" style={{ backgroundColor: 'var(--bg-primary)' }}></div>
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
  onApplyLayout,
  selectedLayout = 'title-2-columns',
  onStorylineChange,
  onApplyLayoutToAll
}) {
  const [previewSection, setPreviewSection] = useState(null);
  const [collapsedSections, setCollapsedSections] = useState(new Set());

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
    console.log(`Applying layout ${layoutId} to all slides`);
    
    if (!storyline || !onStorylineChange) {
      console.warn('Cannot apply layout to all: storyline or onStorylineChange not available');
      return;
    }
    
    // Apply the layout to all sections
    const updatedStoryline = {
      ...storyline,
      sections: storyline.sections?.map(section => ({
        ...section,
        layout: layoutId,
        layoutAppliedAt: new Date().toISOString()
      })) || []
    };
    
    // Propagate the change up to parent
    onStorylineChange(updatedStoryline);
    console.log(`✅ Applied layout ${layoutId} to all ${storyline.sections?.length || 0} sections`);
    
    if (onApplyLayout) {
      onApplyLayout(layoutId);
    }
    
    if (onApplyLayoutToAll) {
      onApplyLayoutToAll(layoutId);
    }
  };

  const handleApplyLayoutToSection = (sectionId) => {
    console.log(`Applying layout ${selectedLayout} to section: ${sectionId}`);
    
    if (!storyline || !onStorylineChange) {
      console.warn('Cannot apply layout: storyline or onStorylineChange not available');
      return;
    }
    
    // Update the storyline with the layout for this specific section
    const updatedStoryline = {
      ...storyline,
      sections: storyline.sections?.map(section => {
        if (section.id === sectionId || section.title === sectionId) {
          return {
            ...section,
            layout: selectedLayout,
            layoutAppliedAt: new Date().toISOString()
          };
        }
        return section;
      }) || []
    };
    
    // Propagate the change up to parent
    onStorylineChange(updatedStoryline);
    console.log(`✅ Applied layout ${selectedLayout} to section: ${sectionId}`);
  };

  const handleResetLayoutForSection = (sectionId) => {
    console.log(`Resetting layout for section: ${sectionId}`);
    
    if (!storyline || !onStorylineChange) {
      console.warn('Cannot reset layout: storyline or onStorylineChange not available');
      return;
    }
    
    // Remove the custom layout from this specific section
    const updatedStoryline = {
      ...storyline,
      sections: storyline.sections?.map(section => {
        if (section.id === sectionId || section.title === sectionId) {
          const { layout, layoutAppliedAt, ...sectionWithoutLayout } = section;
          return sectionWithoutLayout;
        }
        return section;
      }) || []
    };
    
    // Propagate the change up to parent
    onStorylineChange(updatedStoryline);
    console.log(`✅ Reset layout for section: ${sectionId}`);
  };

  const toggleSectionCollapse = (sectionId) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  return (
    <div className="h-full flex relative">
      {/* Preview Area */}
      <div className="flex-1 bg-white">
        <div className="p-6 border-b" style={{ borderColor: 'var(--border-primary)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Slide Preview</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                Preview how your content will look with the selected layout
              </p>
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {LAYOUT_OPTIONS.find(l => l.id === selectedLayout)?.name}
            </div>
          </div>
        </div>
        
        <div className="p-8 h-full overflow-y-auto pb-20">
          <div className="max-w-4xl mx-auto">
            {/* Slide Preview */}
            <div className="aspect-[16/9] bg-white rounded-lg shadow-sm p-8" style={{ border: '1px solid var(--border-primary)' }}>
              {selectedLayout === 'title-2-columns' && (
                <div className="h-full">
                  <div className="border-b pb-4 mb-6" style={{ borderColor: 'var(--border-primary)' }}>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {currentSection?.title || storyline?.title || 'Section Title'}
                    </h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                      Section {currentSectionIndex + 1} of {storyline?.sections?.length || 1}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-8 h-4/5">
                    <div className="space-y-4">
                      <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {currentSection?.keyPoints?.[0]?.title || 'Key Points'}
                      </h3>
                      <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
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
                      <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {currentSection?.keyPoints?.[1]?.title || 'Additional Points'}
                      </h3>
                      <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
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
                  <div className="border-b pb-4 mb-6" style={{ borderColor: 'var(--border-primary)' }}>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
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
                  <div className="border-b pb-4 mb-6" style={{ borderColor: 'var(--border-primary)' }}>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {currentSection?.title || storyline?.title || 'Section Title'}
                    </h1>
                  </div>
                  <div className="grid grid-cols-3 gap-6 h-4/5">
                    {currentSection?.keyPoints?.slice(0, 3).map((point, index) => (
                      <div key={index} className="text-center">
                        <div className="w-12 h-12 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4" style={{ backgroundColor: 'var(--text-primary)' }}>
                          {index + 1}
                        </div>
                        <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                          {point.title || point.split('.')[0] || `Point ${index + 1}`}
                        </h3>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
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
                          <div className="w-12 h-12 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4" style={{ backgroundColor: 'var(--text-primary)' }}>1</div>
                          <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Phase 1</h3>
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>First phase description</p>
                        </div>
                        <div className="text-center">
                          <div className="w-12 h-12 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4" style={{ backgroundColor: 'var(--text-primary)' }}>2</div>
                          <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Phase 2</h3>
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Second phase description</p>
                        </div>
                        <div className="text-center">
                          <div className="w-12 h-12 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4" style={{ backgroundColor: 'var(--text-primary)' }}>3</div>
                          <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Phase 3</h3>
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Third phase description</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {selectedLayout === 'full-width' && (
                <div className="h-full">
                  <div className="border-b pb-4 mb-6" style={{ borderColor: 'var(--border-primary)' }}>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {currentSection?.title || storyline?.title || 'Content Title'}
                    </h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {LAYOUT_OPTIONS.find(l => l.id === selectedLayout)?.description}
                    </p>
                  </div>
                  <div className="space-y-6 h-4/5 overflow-y-auto">
                    <div className="prose max-w-none">
                      <p className="leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                        {currentSection?.description || storyline?.executiveSummary || 'Full width content section'}
                      </p>
                    </div>
                    {currentSection?.keyPoints && (
                      <div className="space-y-3">
                        <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Key Points</h3>
                        <ul className="space-y-2">
                          {currentSection.keyPoints.map((point, index) => (
                            <li key={index} className="flex items-start">
                              <span className="w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0" style={{ backgroundColor: 'var(--text-secondary)' }}></span>
                              <span style={{ color: 'var(--text-primary)' }}>{point.content || point}</span>
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
                  <div className="border-b pb-4 mb-6" style={{ borderColor: 'var(--border-primary)' }}>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {currentSection?.title || storyline?.title || 'Timeline'}
                    </h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {LAYOUT_OPTIONS.find(l => l.id === selectedLayout)?.description}
                    </p>
                  </div>
                  <div className="h-4/5 flex items-center">
                    <div className="w-full">
                      <div className="flex items-center justify-between relative">
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2" style={{ backgroundColor: 'var(--border-secondary)' }}></div>
                        {(currentSection?.keyPoints?.slice(0, 4) || storyline?.sections?.slice(0, 4) || []).map((item, index) => (
                          <div key={index} className="relative bg-white px-2">
                            <div className="w-4 h-4 rounded-full mx-auto mb-3" style={{ backgroundColor: 'var(--text-primary)' }}></div>
                            <div className="text-center min-w-0">
                              <h4 className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                                {item.title || item.split('.')[0] || `Milestone ${index + 1}`}
                              </h4>
                              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
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
                  <div className="border-b pb-4 mb-6" style={{ borderColor: 'var(--border-primary)' }}>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {currentSection?.title || storyline?.title || 'Process Flow'}
                    </h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {LAYOUT_OPTIONS.find(l => l.id === selectedLayout)?.description}
                    </p>
                  </div>
                  <div className="h-4/5 flex items-center justify-center">
                    <div className="flex items-center space-x-4">
                      {(currentSection?.keyPoints?.slice(0, 3) || storyline?.sections?.slice(0, 3) || []).map((item, index, array) => (
                        <React.Fragment key={index}>
                          <div className="text-center">
                            <div className="w-24 h-16 rounded flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
                              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                {item.title?.substring(0, 10) || `Step ${index + 1}`}
                              </span>
                            </div>
                            <p className="text-xs max-w-24" style={{ color: 'var(--text-secondary)' }}>
                              {item.content?.substring(0, 30) || item.description?.substring(0, 30) || `Process ${index + 1}`}
                            </p>
                          </div>
                          {index < array.length - 1 && (
                            <div className="flex items-center">
                              <div className="w-8 h-0.5" style={{ backgroundColor: 'var(--border-secondary)' }}></div>
                              <div className="w-2 h-2 border-t-2 border-r-2 transform rotate-45 -ml-1" style={{ borderColor: 'var(--border-secondary)' }}></div>
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Apply to Specific Sections - Thinner */}
            {storyline?.sections && (
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Apply to Specific Sections</h3>
                <div className="grid grid-cols-2 gap-2">
                  {(storyline?.sections || [
                    { id: '1', title: 'Executive Summary', status: 'draft', slides: 1 },
                    { id: '2', title: 'Market Context & Analysis', status: 'draft', slides: 1 },
                    { id: '3', title: 'Strategic Implications', status: 'draft', slides: 1 },
                    { id: '4', title: 'Technical Architecture', status: 'draft', slides: 1 },
                    { id: '5', title: 'Risk Assessment & Compliance', status: 'draft', slides: 1 },
                    { id: '6', title: 'Implementation Roadmap', status: 'draft', slides: 1 }
                  ]).slice(0, 6).map((section, index) => (
                    <div key={section.id || index} className="relative">
                      {/* Section with Collapse Arrow and Index */}
                      <div className="flex items-start gap-1">
                        {/* Collapse Arrow - Consistent with RightSection pattern */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSectionCollapse(section.id || index);
                          }}
                          className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-200 transition-colors mt-0.5"
                          title={collapsedSections.has(section.id || index) ? 'Expand section' : 'Collapse section'}
                          style={{ backgroundColor: 'transparent' }}
                        >
                          {collapsedSections.has(section.id || index) ? (
                            <ChevronUp className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                          ) : (
                            <ChevronDown className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                          )}
                        </button>

                        {/* Index Number */}
                        <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium mt-0.5" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                          {index + 1}
                        </div>

                        {/* Section Content */}
                        <div className="flex-1 relative">
                          <div 
                            className={`rounded transition-colors cursor-pointer ${
                              previewSection === section.id ? 'ring-1' : ''
                            }`}
                            style={{ 
                              border: '1px solid var(--border-primary)',
                              backgroundColor: previewSection === section.id ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                              ringColor: previewSection === section.id ? 'var(--text-primary)' : 'transparent'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.borderColor = 'var(--border-secondary)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.borderColor = 'var(--border-primary)';
                            }}
                            onClick={() => setPreviewSection(section.id)}
                          >
                            {/* Section Header */}
                            <div className="p-1.5 pr-8">
                              <div className="text-xs font-medium truncate leading-tight" style={{ color: 'var(--text-primary)' }}>
                                {section.title || `Section ${index + 1}`}
                              </div>
                              {!collapsedSections.has(section.id || index) && (
                                <div className="text-xs flex items-center gap-1 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                                  <span>{section.status || 'draft'}</span>
                                  {section.layout && (
                                    <span className="px-1 py-0.5 text-xs rounded bg-blue-100 text-blue-700">
                                      {LAYOUT_OPTIONS.find(l => l.id === section.layout)?.name.split(' ')[0] || 'Custom'}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            {/* Expanded Content */}
                            {!collapsedSections.has(section.id || index) && (
                              <div className="px-1.5 pb-1.5">
                                {section.description && (
                                  <div className="text-xs mt-1 px-2" style={{ color: 'var(--text-secondary)' }}>
                                    {section.description.length > 80 
                                      ? `${section.description.substring(0, 80)}...` 
                                      : section.description
                                    }
                                  </div>
                                )}
                                {section.keyPoints && section.keyPoints.length > 0 && (
                                  <div className="text-xs mt-1 px-2" style={{ color: 'var(--text-secondary)' }}>
                                    {section.keyPoints.length} key point{section.keyPoints.length !== 1 ? 's' : ''}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Action Icons - Top Right */}
                          <div className="absolute top-1 right-1 flex gap-0.5 z-10">
                            {/* Apply Layout Icon */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApplyLayoutToSection(section.id || section.title);
                              }}
                              className="p-0.5 rounded transition-colors hover:bg-green-100"
                              style={{ 
                                backgroundColor: 'white',
                                border: '1px solid var(--border-primary)'
                              }}
                              title="Apply Layout"
                            >
                              <Check size={8} className="text-green-600" />
                            </button>
                            
                            {/* Reset Layout Icon */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResetLayoutForSection(section.id || section.title);
                              }}
                              className="p-0.5 rounded transition-colors hover:bg-red-100"
                              style={{ 
                                backgroundColor: 'white',
                                border: '1px solid var(--border-primary)'
                              }}
                              title="Reset Layout"
                            >
                              <X size={8} className="text-red-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
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
