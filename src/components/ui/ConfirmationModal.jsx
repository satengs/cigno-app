'use client';

import { useState, useEffect } from 'react';

export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  type = "warning" // warning, danger, info
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isVisible) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: '⚠️',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          buttonBg: '#ef4444',
          buttonHoverBg: '#dc2626',
          borderColor: 'border-red-200'
        };
      case 'warning':
        return {
          icon: '⚠️',
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          buttonBg: '#f59e0b',
          buttonHoverBg: '#d97706',
          borderColor: 'border-yellow-200'
        };
      case 'info':
        return {
          icon: 'ℹ️',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          buttonBg: '#3b82f6',
          buttonHoverBg: '#2563eb',
          borderColor: 'border-blue-200'
        };
      default:
        return {
          icon: '❓',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600',
          buttonBg: '#6b7280',
          buttonHoverBg: '#4b5563',
          borderColor: 'border-gray-200'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div 
        className={`rounded-lg shadow-xl max-w-md w-full mx-4 border ${styles.borderColor}`}
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${styles.iconBg}`}>
              <span className={`text-xl ${styles.iconColor}`}>{styles.icon}</span>
            </div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
          </div>
          
          <div className="mb-6">
            <p className="whitespace-pre-line" style={{ color: 'var(--text-secondary)' }}>{message}</p>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              style={{ 
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-tertiary)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--bg-secondary)'}
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              style={{ backgroundColor: styles.buttonBg }}
              onMouseEnter={(e) => e.target.style.backgroundColor = styles.buttonHoverBg}
              onMouseLeave={(e) => e.target.style.backgroundColor = styles.buttonBg}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
