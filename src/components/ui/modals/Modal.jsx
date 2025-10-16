import React, { useEffect } from 'react';
import { clsx } from 'clsx';
import { X } from 'lucide-react';

const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
  customCloseIcon = null,
  className = '',
  fullHeight = false,
  ...props
}) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full mx-4'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-20 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className={clsx(
            'relative w-full rounded-xl shadow-2xl transform transition-all flex flex-col',
            fullHeight ? 'max-h-[calc(100vh-2rem)]' : 'max-h-[90vh]',
            sizes[size],
            className
          )}
          style={{ backgroundColor: 'var(--bg-primary)' }}
          onClick={(e) => e.stopPropagation()}
          {...props}
        >
          {/* Header - Fixed */}
          {(title || subtitle) && (
            <div className="px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--border-primary)' }}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {title && (
                    <h2 className="text-xl font-semibold flex items-center" style={{ color: 'var(--text-primary)' }}>
                      {title}
                    </h2>
                  )}
                  {subtitle && (
                    <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>
                  )}
                </div>
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="ml-4 p-1 rounded-lg transition-colors"
                    style={{ 
                      color: 'var(--text-secondary)',
                      backgroundColor: 'transparent'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-secondary)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    {customCloseIcon || <X className="w-5 h-5" />}
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="px-6 py-4">
              {children}
            </div>
          </div>

          {/* Footer - Fixed */}
          {footer && (
            <div className="border-t px-6 py-4 flex-shrink-0" style={{ borderColor: 'var(--border-primary)' }}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
