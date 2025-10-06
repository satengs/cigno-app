'use client';

import { useState } from 'react';

export default function SectionNavigator({ sections = [], currentSectionIndex = 0, onSectionChange }) {
  const currentSection = sections[currentSectionIndex];
  const totalSections = sections.length;

  const handlePrevious = () => {
    if (currentSectionIndex > 0) {
      onSectionChange(currentSectionIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentSectionIndex < totalSections - 1) {
      onSectionChange(currentSectionIndex + 1);
    }
  };

  if (!sections.length) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500">
        No sections available
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-white">
      {/* Section Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {currentSection?.title || 'Untitled Section'}
          </h2>
          <p className="text-sm text-gray-500">
            Page {currentSectionIndex + 1} of {totalSections}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {/* Section Status */}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            currentSection?.status === 'final' ? 'bg-green-100 text-green-800' :
            currentSection?.status === 'in_review' ? 'bg-yellow-100 text-yellow-800' :
            currentSection?.status === 'draft' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {currentSection?.status?.replace('_', ' ') || 'not started'}
          </span>
        </div>
      </div>

      {/* Section Content */}
      <div className="p-6">
        {/* Section Description */}
        {currentSection?.description && (
          <div className="mb-6">
            <p className="text-gray-700">{currentSection.description}</p>
          </div>
        )}

        {/* Key Points */}
        {currentSection?.keyPoints?.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Key Points</h3>
            <ul className="space-y-2">
              {currentSection.keyPoints.map((point, index) => (
                <li key={index} className="flex items-start">
                  <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></span>
                  <span className="text-gray-700">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Content Blocks */}
        {currentSection?.contentBlocks?.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Content</h3>
            <div className="space-y-4">
              {currentSection.contentBlocks.map((block, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">{block.type}</h4>
                  {block.items?.length > 0 && (
                    <ul className="space-y-1">
                      {block.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="text-gray-700 text-sm">
                          • {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estimated Slides */}
        {currentSection?.estimatedSlides && (
          <div className="text-sm text-gray-500">
            Estimated slides: {currentSection.estimatedSlides}
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between p-4 border-t bg-gray-50">
        <button
          onClick={handlePrevious}
          disabled={currentSectionIndex === 0}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            currentSectionIndex === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          ← Previous
        </button>
        
        <div className="flex space-x-1">
          {sections.map((_, index) => (
            <button
              key={index}
              onClick={() => onSectionChange(index)}
              className={`w-3 h-3 rounded-full ${
                index === currentSectionIndex
                  ? 'bg-blue-500'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={currentSectionIndex === totalSections - 1}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            currentSectionIndex === totalSections - 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          Next →
        </button>
      </div>
    </div>
  );
}