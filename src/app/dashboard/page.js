'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import LeftNav from '../../components/layout/LeftNav';
import RightSection from '../../components/layout/RightSection';
import ContentPart from '../../components/layout/ContentPart';
import { useMenuManager } from '../../lib/hooks/useMenuManager';

export default function Dashboard() {
  // Get real data from database using useMenuManager
  const { 
    menuStructure, 
    isLoading, 
    refreshFromDatabase, 
    toggleCollapse,
    expandItem,
    collapseItem 
  } = useMenuManager();

  const searchParams = useSearchParams();
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const processedUrlRef = useRef(null);

  // Handle URL parameters for deliverable selection
  useEffect(() => {
    const deliverableId = searchParams.get('deliverable');
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
    } else if (!deliverableId) {
      // Reset the ref when no deliverable is selected
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
      console.log('⚠️ Unsupported item type, maintaining current selection. Type:', item?.type);
      // Don't change selectedItem for unsupported item types
    }
  };

  const handleItemDeleted = (deletedItem) => {
    // Clear selection if the deleted item was selected
    if (selectedItem && (selectedItem._id === deletedItem._id || selectedItem.id === deletedItem.id)) {
      setSelectedItem(null);
    }
    // Refresh the menu structure from database
    refreshFromDatabase();
  };

  const handleDeliverableNavigate = (deliverable) => {
    if (!deliverable) return;

    const deliverableId = deliverable._id || deliverable.id;
    const normalized = {
      ...deliverable,
      id: deliverableId,
      _id: deliverableId,
      type: 'deliverable'
    };

    if (deliverable.parentId && typeof expandItem === 'function') {
      expandItem(deliverable.parentId);
    }
    if (deliverableId && typeof expandItem === 'function') {
      expandItem(deliverableId);
    }

    handleItemSelect(normalized);
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left Navigation - Always Full Height */}
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
        <ContentPart 
          selectedItem={selectedItem}
          onItemSelect={handleItemSelect}
          onItemDeleted={handleItemDeleted}
          onDeliverableNavigate={handleDeliverableNavigate}
          refreshFromDatabase={refreshFromDatabase}
        />

        {/* Right Section */}
        <RightSection isModalOpen={isModalOpen} selectedItem={selectedItem} />
      </div>
      
    </div>
  );
}
