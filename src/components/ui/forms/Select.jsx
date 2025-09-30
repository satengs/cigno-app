import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';

const Select = forwardRef(({
  label,
  error,
  helperText,
  options = [],
  placeholder = 'Select an option',
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
        <select
          ref={ref}
          className={clsx(
            'block w-full px-3 py-2 pr-10 border rounded-lg shadow-sm transition-colors duration-200 appearance-none',
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
        >
          {placeholder && (
            <option value="" disabled style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
              {option.label}
            </option>
          ))}
        </select>
        
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <ChevronDown className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
        </div>
      </div>
      
      {(error || helperText) && (
        <p className="mt-1 text-sm" style={{ color: error ? '#dc2626' : 'var(--text-secondary)' }}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
