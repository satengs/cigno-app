'use client';

import { useState } from 'react';
import NotionBlock from './NotionBlock';
import { Plus, MoreHorizontal } from 'lucide-react';

export default function NotionList({ 
  items = [], 
  type = 'bullet', 
  className = '',
  editable = true,
  onItemsChange = null
}) {
  const [listItems, setListItems] = useState(items);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingText, setEditingText] = useState('');

  const handleAddItem = (index) => {
    const newItems = [...listItems];
    newItems.splice(index + 1, 0, '');
    setListItems(newItems);
    setEditingIndex(index + 1);
    setEditingText('');
    if (onItemsChange) onItemsChange(newItems);
  };

  const handleEditItem = (index) => {
    setEditingIndex(index);
    setEditingText(listItems[index]);
  };

  const handleSaveItem = (index) => {
    const newItems = [...listItems];
    newItems[index] = editingText;
    setListItems(newItems);
    setEditingIndex(null);
    setEditingText('');
    if (onItemsChange) onItemsChange(newItems);
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddItem(index);
    }
    if (e.key === 'Escape') {
      setEditingIndex(null);
      setEditingText('');
    }
  };

  const handleDeleteItem = (index) => {
    if (listItems.length > 1) {
      const newItems = listItems.filter((_, i) => i !== index);
      setListItems(newItems);
      if (onItemsChange) onItemsChange(newItems);
    }
  };

  const renderBullet = (index) => {
    if (type === 'numbered') {
      return (
        <span className="w-6 text-sm text-gray-500 font-mono text-right select-none">
          {index + 1}.
        </span>
      );
    }
    return (
      <span className="w-6 text-gray-400 text-center select-none">
        •
      </span>
    );
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {listItems.map((item, index) => (
        <NotionBlock key={index} className="flex items-start space-x-2">
          {renderBullet(index)}
          
          <div className="flex-1 min-w-0">
            {editingIndex === index ? (
              <textarea
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                onBlur={() => handleSaveItem(index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="w-full resize-none border-none outline-none bg-transparent text-gray-800 leading-relaxed"
                autoFocus
                rows={1}
                style={{ minHeight: '1.5em' }}
              />
            ) : (
              <div className="flex items-center group">
                <span 
                  className={`text-gray-800 leading-relaxed cursor-text ${editable ? 'hover:bg-gray-100 rounded px-1 -mx-1 transition-colors' : ''}`}
                  onDoubleClick={() => editable && handleEditItem(index)}
                >
                  {item || 'Empty list item'}
                </span>
                
                {editable && (
                  <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                    <button
                      onClick={() => handleAddItem(index)}
                      className="w-5 h-5 rounded hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
                      title="Add item"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(index)}
                      className="w-5 h-5 rounded hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
                      title="Delete item"
                    >
                      <MoreHorizontal className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </NotionBlock>
      ))}
      
      {editable && (
        <NotionBlock className="flex items-start space-x-2">
          {renderBullet(listItems.length)}
          <button
            onClick={() => handleAddItem(listItems.length - 1)}
            className="text-gray-400 hover:text-gray-600 transition-colors text-left flex-1 min-w-0"
          >
            <span className="text-gray-400 italic">Add a list item...</span>
          </button>
        </NotionBlock>
      )}
    </div>
  );
}
