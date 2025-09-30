import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

const Input = forwardRef(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
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
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span style={{ color: 'var(--text-secondary)' }}>{leftIcon}</span>
          </div>
        )}
        
        <input
          ref={ref}
          className={clsx(
            'block w-full px-3 py-2 border rounded-lg shadow-sm transition-colors duration-200',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
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
          placeholder={domProps.placeholder}
          {...domProps}
        />
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span style={{ color: 'var(--text-secondary)' }}>{rightIcon}</span>
          </div>
        )}
      </div>
      
      {(error || helperText) && (
        <p className="mt-1 text-sm" style={{ color: error ? '#dc2626' : 'var(--text-secondary)' }}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
