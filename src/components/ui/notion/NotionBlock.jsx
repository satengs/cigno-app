'use client';

import { useState } from 'react';
import { MoreHorizontal, Plus } from 'lucide-react';

export default function NotionBlock({ 
  children, 
  className = '', 
  showActions = true,
  onAdd = null,
  onMenu = null,
  variant = 'default'
}) {
  const [isHovered, setIsHovered] = useState(false);

  const baseClasses = "relative group transition-all duration-200";
  const variantClasses = {
    default: "",
    selected: "",
    focused: ""
  };

  const getVariantStyles = () => {
    if (variant === 'selected') {
      return {
        backgroundColor: 'var(--bg-secondary)',
        borderLeft: '2px solid var(--border-primary)'
      };
    }
    if (variant === 'focused') {
      return {
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-primary)',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
      };
    }
    return {
      backgroundColor: 'transparent'
    };
  };

  return (
    <div 
      className={`${baseClasses} ${className}`}
      style={getVariantStyles()}
      onMouseEnter={(e) => {
        setIsHovered(true);
        if (variant === 'default') {
          e.target.style.backgroundColor = 'var(--bg-secondary)';
        }
      }}
      onMouseLeave={(e) => {
        setIsHovered(false);
        if (variant === 'default') {
          e.target.style.backgroundColor = 'transparent';
        }
      }}
    >
      {/* Block Actions */}
      {showActions && (
        <div className={`absolute -left-8 top-1 opacity-0 group-hover:opacity-100 transition-opacity ${isHovered ? 'opacity-100' : ''}`}>
          <div className="flex items-center space-x-1">
            {onAdd && (
              <button
                onClick={onAdd}
                className="w-6 h-6 rounded flex items-center justify-center transition-colors"
                style={{
                  color: 'var(--text-secondary)',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'var(--bg-secondary)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
                title="Add block"
              >
                <Plus className="w-3 h-3" />
              </button>
            )}
            {onMenu && (
              <button
                onClick={onMenu}
                className="w-6 h-6 rounded flex items-center justify-center transition-colors"
                style={{
                  color: 'var(--text-secondary)',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'var(--bg-secondary)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
                title="More options"
              >
                <MoreHorizontal className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Block Content */}
      <div className="py-1 px-1">
        {children}
      </div>
    </div>
  );
}
