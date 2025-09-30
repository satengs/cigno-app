'use client';

import { useState } from 'react';
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

  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleItemSelect = (item) => {
    setSelectedItem(item);
  };

  const handleItemDeleted = (deletedItem) => {
    // Clear selection if the deleted item was selected
    if (selectedItem && (selectedItem._id === deletedItem._id || selectedItem.id === deletedItem.id)) {
      setSelectedItem(null);
    }
    // Refresh the menu structure from database
    refreshFromDatabase();
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
      />

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0">
        {/* Content Area */}
        <ContentPart 
          selectedItem={selectedItem}
          onItemSelect={handleItemSelect}
          onItemDeleted={handleItemDeleted}
        />

        {/* Right Section */}
        <RightSection isModalOpen={isModalOpen} selectedItem={selectedItem} />
      </div>
      
    </div>
  );
}