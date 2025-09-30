'use client';

import { useState } from 'react';
import { Info, AlertTriangle, CheckCircle, Lightbulb, AlertCircle } from 'lucide-react';
import NotionBlock from './NotionBlock';

export default function NotionCallout({ 
  icon = 'info',
  children, 
  className = '',
  variant = 'default',
  editable = true,
  onContentChange = null
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(children);

  const iconMap = {
    info: Info,
    warning: AlertTriangle,
    success: CheckCircle,
    idea: Lightbulb,
    error: AlertCircle
  };

  const getVariantStyles = () => {
    const baseStyles = {
      borderLeft: '4px solid var(--border-primary)',
      transition: 'all 0.2s'
    };

    switch (variant) {
      case 'default':
        return { ...baseStyles, backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' };
      case 'warning':
        return { ...baseStyles, backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' };
      case 'success':
        return { ...baseStyles, backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' };
      case 'idea':
        return { ...baseStyles, backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' };
      case 'error':
        return { ...baseStyles, backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' };
      default:
        return { ...baseStyles, backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' };
    }
  };

  const IconComponent = iconMap[icon] || Info;

  const handleDoubleClick = () => {
    if (editable) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (onContentChange && content !== children) {
      onContentChange(content);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === 'Escape') {
      setContent(children);
      setIsEditing(false);
    }
  };

  return (
    <NotionBlock className={`rounded-r-lg p-4 ${className}`} style={getVariantStyles()}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          <IconComponent className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="w-full resize-none border-none outline-none bg-transparent font-inherit text-inherit leading-inherit"
              autoFocus
              rows={1}
              style={{ minHeight: '1.5em' }}
            />
          ) : (
            <div 
              className={`leading-relaxed ${editable ? 'hover:bg-white/50 rounded px-1 -mx-1 transition-colors cursor-text' : ''}`}
              onDoubleClick={handleDoubleClick}
            >
              {content}
            </div>
          )}
        </div>
      </div>
    </NotionBlock>
  );
}
