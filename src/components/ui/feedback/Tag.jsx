import React from 'react';
import { clsx } from 'clsx';
import { X } from 'lucide-react';

const Tag = ({
  children,
  variant = 'default',
  size = 'md',
  removable = false,
  onRemove,
  className = '',
  ...props
}) => {
  const getTagStyles = () => {
    const baseStyles = {
      border: '1px solid var(--border-primary)',
      transition: 'all 0.2s'
    };

    switch (variant) {
      case 'default':
        return { ...baseStyles, backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' };
      case 'primary':
        return { ...baseStyles, backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' };
      case 'success':
        return { ...baseStyles, backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' };
      case 'warning':
        return { ...baseStyles, backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' };
      case 'danger':
        return { ...baseStyles, backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' };
      case 'info':
        return { ...baseStyles, backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' };
      default:
        return { ...baseStyles, backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' };
    }
  };
  
  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        sizes[size],
        className
      )}
      style={getTagStyles()}
      {...props}
    >
      {children}
      
      {removable && (
        <button
          type="button"
          onClick={onRemove}
          className={clsx(
            'ml-1 rounded-full p-0.5 hover:bg-black hover:bg-opacity-10 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-offset-1',
            size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'
          )}
        >
          <X className="w-full h-full" />
        </button>
      )}
    </span>
  );
};

export default Tag;
