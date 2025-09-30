'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import NotionBlock from './NotionBlock';

export default function NotionToggle({ 
  title = 'Toggle Section', 
  children, 
  defaultOpen = false,
  className = '',
  editable = true,
  onTitleChange = null
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isEditing, setIsEditing] = useState(false);
  const [titleText, setTitleText] = useState(title);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleTitleDoubleClick = () => {
    if (editable) {
      setIsEditing(true);
    }
  };

  const handleTitleBlur = () => {
    setIsEditing(false);
    if (onTitleChange && titleText !== title) {
      onTitleChange(titleText);
    }
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleBlur();
    }
    if (e.key === 'Escape') {
      setTitleText(title);
      setIsEditing(false);
    }
  };

  return (
    <div className={className}>
      <NotionBlock className="flex items-start space-x-2">
        <button
          onClick={handleToggle}
          className="w-5 h-5 mt-1 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
          title={isOpen ? 'Collapse' : 'Expand'}
        >
          {isOpen ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <textarea
              value={titleText}
              onChange={(e) => setTitleText(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              className="w-full resize-none border-none outline-none bg-transparent text-gray-800 font-medium leading-relaxed"
              autoFocus
              rows={1}
              style={{ minHeight: '1.5em' }}
            />
          ) : (
            <span 
              className={`text-gray-800 font-medium leading-relaxed cursor-pointer ${editable ? 'hover:bg-gray-100 rounded px-1 -mx-1 transition-colors' : ''}`}
              onDoubleClick={handleTitleDoubleClick}
            >
              {titleText}
            </span>
          )}
        </div>
      </NotionBlock>
      
      {isOpen && (
        <div className="ml-7 border-l border-gray-200 pl-4 mt-2">
          {children}
        </div>
      )}
    </div>
  );
}
