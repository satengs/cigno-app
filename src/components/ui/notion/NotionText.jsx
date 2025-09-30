'use client';

import { useState } from 'react';
import NotionBlock from './NotionBlock';

export default function NotionText({ 
  content = '', 
  level = 'p', 
  placeholder = 'Type "/" for commands...',
  className = '',
  editable = true,
  onContentChange = null
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(content);

  const handleDoubleClick = () => {
    if (editable) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (onContentChange && text !== content) {
      onContentChange(text);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === 'Escape') {
      setText(content);
      setIsEditing(false);
    }
  };

  const renderContent = () => {
    if (isEditing) {
      return (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full resize-none border-none outline-none bg-transparent font-inherit text-inherit leading-inherit"
          autoFocus
          rows={1}
          style={{ minHeight: '1.5em' }}
        />
      );
    }

    if (!text.trim()) {
      return (
        <span className="text-gray-400 italic cursor-text" onDoubleClick={handleDoubleClick}>
          {placeholder}
        </span>
      );
    }

    return (
      <span onDoubleClick={handleDoubleClick} className="cursor-text">
        {text}
      </span>
    );
  };

  const levelClasses = {
    h1: 'text-3xl font-bold text-gray-900',
    h2: 'text-2xl font-semibold text-gray-900',
    h3: 'text-xl font-semibold text-gray-900',
    h4: 'text-lg font-medium text-gray-900',
    h5: 'text-base font-medium text-gray-900',
    h6: 'text-sm font-medium text-gray-900',
    p: 'text-base text-gray-800 leading-relaxed'
  };

  const Component = level;

  return (
    <NotionBlock className={className}>
      <Component className={`${levelClasses[level]} ${editable ? 'hover:bg-gray-100 rounded px-1 -mx-1 transition-colors' : ''}`}>
        {renderContent()}
      </Component>
    </NotionBlock>
  );
}
