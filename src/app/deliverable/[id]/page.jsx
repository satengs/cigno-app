'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useMenuManager } from '../../../lib/hooks/useMenuManager';
import ContentPart from '../../../components/layout/ContentPart';
import RightSection from '../../../components/layout/RightSection';
import LeftNav from '../../../components/layout/LeftNav';

const normalizeDeliverableItem = (item) => {
  if (!item) return item;

  const originalType = item.type;
  const originalMetadata = item.metadata || {};
  const inferredDeliverableType = originalMetadata.deliverableType || originalMetadata.type || originalType;

  return {
    ...item,
    type: 'deliverable',
    deliverableType: inferredDeliverableType || 'deliverable',
    metadata: {
      ...originalMetadata,
      originalType: originalMetadata.originalType || originalType,
      deliverableType: inferredDeliverableType || originalMetadata.deliverableType,
    },
  };
};

export default function DeliverablePage() {
  const { id } = useParams();
  const router = useRouter();
  const [deliverable, setDeliverable] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState('detailed');
  const [selectedLayout, setSelectedLayout] = useState('default');
  const [storyline, setStoryline] = useState(null);
  const [layoutAISuggestion, setLayoutAISuggestion] = useState(null);
  const layoutAISuggestionHandlerRef = useRef(null);

  const handleLayoutAISuggestionChange = useCallback((suggestion, handler) => {
    setLayoutAISuggestion(suggestion);
    layoutAISuggestionHandlerRef.current = typeof handler === 'function' ? handler : null;
  }, []);

  const handleLayoutAISuggestionClick = useCallback(() => {
    if (layoutAISuggestionHandlerRef.current) {
      return layoutAISuggestionHandlerRef.current();
    }
    return null;
  }, []);

  // Get menu structure for navigation
  const {
    menuStructure,
    isLoading: menuLoading,
    refreshFromDatabase,
    toggleCollapse,
    expandItem,
    collapseItem
  } = useMenuManager();

  // Find deliverable data from menu structure
  useEffect(() => {
    if (id && menuStructure.length > 0) {
      const findDeliverable = (items) => {
        for (const item of items) {
          if (item.type === 'deliverable' && (item._id === id || item.id === id)) {
            return item;
          }
          if (item.children) {
            const found = findDeliverable(item.children);
            if (found) return found;
          }
        }
        return null;
      };

      const deliverableData = findDeliverable(menuStructure);
      if (deliverableData) {
        console.log('✅ Found deliverable data:', deliverableData);
        setDeliverable(normalizeDeliverableItem(deliverableData));
        setIsLoading(false);
      } else {
        console.error('❌ Deliverable not found in menu structure');
        router.push('/dashboard');
      }
    }
  }, [id, menuStructure, router]);

  const availableLayouts = useMemo(
    () => ['default', 'title-2-columns', 'bcg-matrix', 'three-columns', 'full-width', 'timeline', 'process-flow'],
    []
  );

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading deliverable...</p>
        </div>
      </div>
    );
  }

  if (!deliverable) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Deliverable not found</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleLayoutChange = (layoutId) => {
    setSelectedLayout(layoutId);
  };

  const handleApplyLayoutToAll = (layoutId) => {
    if (!storyline || !storyline.sections) {
      return;
    }

    const updated = {
      ...storyline,
      sections: storyline.sections.map(section => ({
        ...section,
        layout: layoutId,
        layoutAppliedAt: new Date().toISOString()
      }))
    };
    setStoryline(updated);
  };

  const showLayoutOptions = currentView === 'layout';

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left Navigation */}
      <LeftNav 
        menuStructure={menuStructure && menuStructure.length > 0 ? menuStructure : undefined}
        isLoading={typeof menuLoading === 'boolean' ? menuLoading : undefined}
        refreshFromDatabase={refreshFromDatabase}
        toggleCollapse={toggleCollapse}
        expandItem={expandItem}
        collapseItem={collapseItem}
        onItemSelect={() => {}} // Handle selection if needed
        onModalStateChange={setIsModalOpen}
        selectedItem={deliverable}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0">
        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <ContentPart
            selectedItem={deliverable}
            onItemSelect={() => {}}
            onItemDeleted={refreshFromDatabase}
            onDeliverableNavigate={() => {}}
            refreshFromDatabase={refreshFromDatabase}
            onViewChange={setCurrentView}
            selectedLayout={selectedLayout}
            onStorylineChange={setStoryline}
            onLayoutChange={handleLayoutChange}
            onLayoutAISuggestionChange={handleLayoutAISuggestionChange}
          />
        </div>

        {/* Right Section */}
        <RightSection 
          isModalOpen={isModalOpen} 
          selectedItem={deliverable} 
          showLayoutOptions={showLayoutOptions}
          selectedLayout={selectedLayout}
          onLayoutChange={handleLayoutChange}
          storyline={storyline}
          onApplyLayoutToAll={handleApplyLayoutToAll}
          availableLayouts={availableLayouts}
          layoutAISuggestion={layoutAISuggestion}
          onAISuggestionClick={handleLayoutAISuggestionClick}
        />
      </div>
    </div>
  );
}
