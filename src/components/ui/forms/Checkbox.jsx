import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

const Checkbox = forwardRef(({
  label,
  error,
  helperText,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="flex items-start">
      <input
        ref={ref}
        type="checkbox"
        className={clsx(
          'w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 mt-0.5',
          'disabled:bg-gray-100 disabled:border-gray-300 disabled:cursor-not-allowed',
          error && 'border-red-300 focus:ring-red-500',
          className
        )}
        {...props}
      />
      
      {label && (
        <label className="ml-2 text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      {error && (
        <p className="ml-2 text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="ml-2 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

export default Checkbox;
