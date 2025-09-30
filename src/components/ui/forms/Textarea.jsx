import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

const Textarea = forwardRef(({
  label,
  error,
  helperText,
  rows = 4,
  className = '',
  ...props
}, ref) => {
  // Filter out non-DOM props to prevent React warnings
  const { helpText, ...domProps } = props;
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          {label}
        </label>
      )}
      
      <textarea
        ref={ref}
        rows={rows}
        className={clsx(
          'block w-full px-3 py-2 border rounded-lg shadow-sm transition-colors duration-200 resize-vertical',
          className
        )}
        style={{
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          borderColor: error ? '#dc2626' : 'var(--border-primary)',
          outline: 'none'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#9333ea';
          e.target.style.boxShadow = '0 0 0 2px rgba(147, 51, 234, 0.2)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? '#dc2626' : 'var(--border-primary)';
          e.target.style.boxShadow = 'none';
        }}
        {...domProps}
      />
      
      {(error || helperText) && (
        <p className="mt-1 text-sm" style={{ color: error ? '#dc2626' : 'var(--text-secondary)' }}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;
