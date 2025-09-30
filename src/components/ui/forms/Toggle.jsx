import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

const Toggle = forwardRef(({
  label,
  error,
  helperText,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="flex items-center justify-between">
      {label && (
        <span className="text-sm font-medium text-gray-700">{label}</span>
      )}
      
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={props.checked}
        className={clsx(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          props.checked ? 'bg-purple-600' : 'bg-gray-200',
          className
        )}
        {...props}
      >
        <span
          className={clsx(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
            props.checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
      
      {(error || helperText) && (
        <p className={clsx(
          'text-sm',
          error ? 'text-red-600' : 'text-gray-500'
        )}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Toggle.displayName = 'Toggle';

export default Toggle;
