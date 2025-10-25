'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { useMenuManager } from '../../lib/hooks/useMenuManager';
import LeftNav from '../../components/layout/LeftNav';
import RightSection from '../../components/layout/RightSection';
import ContentPart from '../../components/layout/ContentPart';

function DashboardWithSearchParams() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentContentView, setCurrentContentView] = useState('detailed');
  const [selectedLayout, setSelectedLayout] = useState('title-2-columns');
  const [currentStoryline, setCurrentStoryline] = useState(null);
  const processedUrlRef = useRef(null);

  // Use real menu manager instead of mock data
  const { 
    menuStructure, 
    isLoading, 
    refreshFromDatabase, 
    toggleCollapse,
    expandItem,
    collapseItem 
  } = useMenuManager();

  // Handle URL parameters for deliverable and client selection
  useEffect(() => {
    const deliverableId = searchParams.get('deliverable');
    const projectId = searchParams.get('project');
    const clientId = searchParams.get('client');
    const view = searchParams.get('view');
    const layoutType = searchParams.get('layoutType');
    
    if (deliverableId && menuStructure.length > 0 && !isLoading) {
      // Create a unique key for this URL combination
      const currentUrl = `${deliverableId}-${view || 'details'}-${layoutType || ''}`;
      
      // Check if we've already processed this exact URL to avoid infinite loops
      if (processedUrlRef.current === currentUrl) {
        return;
      }

      // Find the deliverable in the menu structure
      const findDeliverable = (items) => {
        for (const item of items) {
          if (item.type === 'deliverable' && (item._id === deliverableId || item.id === deliverableId)) {
            return item;
          }
          if (item.children) {
            const found = findDeliverable(item.children);
            if (found) return found;
          }
        }
        return null;
      };

      const deliverable = findDeliverable(menuStructure);
      if (deliverable) {
        // Mark this URL as processed
        processedUrlRef.current = currentUrl;
        
        // Expand parent items to show the deliverable
        if (deliverable.parentId) {
          expandItem(deliverable.parentId);
        }
        
        // Select the deliverable
        setSelectedItem({
          ...deliverable,
          type: 'deliverable',
          _view: view || 'details', // Store the requested view
          _layoutType: layoutType // Store the layout type for specific layout views
        });
      }
    } else if (projectId && menuStructure.length > 0 && !isLoading) {
      const currentUrl = `project-${projectId}`;

      if (processedUrlRef.current !== currentUrl) {
        const findProject = (items, parentId = null) => {
          for (const item of items) {
            if (item.type === 'project' && (item._id === projectId || item.id === projectId)) {
              return { item, parentId };
            }
            if (item.children) {
              const found = findProject(item.children, item.id || item._id);
              if (found) return found;
            }
          }
          return null;
        };

        const projectMatch = findProject(menuStructure);
        if (projectMatch?.item) {
          processedUrlRef.current = currentUrl;
          if (projectMatch.parentId) {
            expandItem(projectMatch.parentId);
          }
          setSelectedItem({
            ...projectMatch.item,
            type: 'project'
          });
        }
      }
    } else if (clientId && menuStructure.length > 0 && !isLoading) {
      // Handle client selection
      const findClient = (items) => {
        for (const item of items) {
          if (item.type === 'client' && (item._id === clientId || item.id === clientId)) {
            return item;
          }
          if (item.children) {
            const found = findClient(item.children);
            if (found) return found;
          }
        }
        return null;
      };

      const client = findClient(menuStructure);
      if (client) {
        // Select the client for client details view
        setSelectedItem({
          ...client,
          type: 'client'
        });
      }
    } else if (!deliverableId && !projectId && !clientId) {
      // Reset the ref when no item is selected
      processedUrlRef.current = null;
    }
  }, [searchParams, menuStructure, isLoading, expandItem]);
  
  const handleItemSelect = (item) => {
    console.log('🎯 Dashboard handleItemSelect called with:', {
      item,
      itemId: item?._id || item?.id,
      itemType: item?.type,
      previousSelectedItem: selectedItem
    });
    
    // Handle different item selection scenarios
    if (item && typeof item === 'object' && (item.type === 'deliverable' || item.type === 'client' || item.type === 'project') && (item._id || item.id)) {
      console.log('✅ Setting selectedItem for', item.type + ':', item._id || item.id);
      setSelectedItem(item);
    } else if (item === null || item === undefined) {
      console.log('🔄 Clearing selectedItem');
      setSelectedItem(null);
    } else if (item === false || typeof item !== 'object') {
      console.log('⚠️ Invalid item type, ignoring selection change. Item:', item);
      // Don't change selectedItem for invalid items like false, strings, etc.
    } else {
      console.log('⚠️ Unexpected item type, ignoring selection change. Item:', item);
    }
  };

  const handleDeliverableNavigate = (deliverable) => {
    console.log('🎯 Dashboard handleDeliverableNavigate called with:', deliverable);
    setSelectedItem(deliverable);
  };

  const handleViewChange = (view) => {
    console.log('🎯 Dashboard handleViewChange called with:', view);
    setCurrentContentView(view);
  };

  const handleStorylineChange = (storyline) => {
    console.log('🎯 Dashboard handleStorylineChange called with:', storyline);
    setCurrentStoryline(storyline);
  };

  const handleLayoutChange = (layout) => {
    console.log('🎯 Dashboard handleLayoutChange called with:', layout);
    setSelectedLayout(layout);
  };

  const handleApplyLayoutToAll = (layoutId) => {
    console.log(`Dashboard: Apply layout ${layoutId} to all slides`);
    // Apply the layout to all sections in the current storyline
    if (currentStoryline) {
      const updatedStoryline = {
        ...currentStoryline,
        sections: currentStoryline.sections?.map(section => ({
          ...section,
          layout: layoutId,
          layoutAppliedAt: new Date().toISOString()
        })) || []
      };
      setCurrentStoryline(updatedStoryline);
      console.log(`✅ Applied layout ${layoutId} to all ${currentStoryline.sections?.length || 0} sections from RightSection`);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left Navigation */}
      <LeftNav 
        menuStructure={menuStructure}
        isLoading={isLoading}
        refreshFromDatabase={refreshFromDatabase}
        toggleCollapse={toggleCollapse}
        expandItem={expandItem}
        collapseItem={collapseItem}
        onItemSelect={handleItemSelect}
        onModalStateChange={setIsModalOpen}
        selectedItem={selectedItem}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0">
        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <ContentPart
            selectedItem={selectedItem}
            onItemSelect={handleItemSelect}
            onItemDeleted={refreshFromDatabase}
            onDeliverableNavigate={handleDeliverableNavigate}
            refreshFromDatabase={refreshFromDatabase}
            onViewChange={handleViewChange}
            selectedLayout={selectedLayout}
            onStorylineChange={handleStorylineChange}
          />
        </div>

        {/* Right Section */}
        <RightSection 
          isModalOpen={isModalOpen} 
          selectedItem={selectedItem} 
          showLayoutOptions={selectedItem?.type === 'deliverable' && (currentContentView === 'layout' || currentContentView === 'storyline')}
          selectedLayout={selectedLayout}
          onLayoutChange={handleLayoutChange}
          storyline={currentStoryline}
          onApplyLayoutToAll={handleApplyLayoutToAll}
          availableLayouts={['default', 'title-2-columns', 'bcg-matrix', 'three-columns', 'full-width', 'timeline', 'process-flow']}
        />
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    }>
      <DashboardWithSearchParams />
    </Suspense>
  );
}
