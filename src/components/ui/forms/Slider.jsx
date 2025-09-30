import React, { forwardRef, useState } from 'react';
import { clsx } from 'clsx';

const Slider = forwardRef(({
  label,
  min = 0,
  max = 100,
  step = 1,
  value,
  defaultValue,
  onChange,
  showValue = true,
  marks = [],
  className = '',
  ...props
}, ref) => {
  const [currentValue, setCurrentValue] = useState(value || defaultValue || min);

  const handleChange = (e) => {
    const newValue = parseInt(e.target.value);
    setCurrentValue(newValue);
    onChange?.(newValue);
  };

  const percentage = ((currentValue - min) / (max - min)) * 100;

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">{label}</label>
          {showValue && (
            <span className="text-sm text-gray-500">{currentValue}</span>
          )}
        </div>
      )}
      
      <div className="relative">
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue}
          onChange={handleChange}
          className={clsx(
            'w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-purple-500',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          style={{
            background: `linear-gradient(to right, #9333ea 0%, #9333ea ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`
          }}
          {...props}
        />
        
        {/* Custom thumb */}
        <div
          className="absolute top-1/2 w-4 h-4 rounded-full shadow transform -translate-y-1/2 pointer-events-none"
        style={{ backgroundColor: 'var(--border-primary)' }}
          style={{ left: `${percentage}%` }}
        />
        
        {/* Marks */}
        {marks.length > 0 && (
          <div className="flex justify-between mt-2">
            {marks.map((mark, index) => (
              <span
                key={index}
                className="text-xs text-gray-500"
                style={{ left: `${((mark.value - min) / (max - min)) * 100}%` }}
              >
                {mark.label || mark.value}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

Slider.displayName = 'Slider';

export default Slider;
