'use client';

import { useState, useEffect } from 'react';

export default function AIStatusIndicator({ className = '' }) {
  const [status, setStatus] = useState({ 
    online: true, 
    message: 'AI Backend: Online', 
    lastChecked: null 
  });
  const [isVisible, setIsVisible] = useState(false);

  // Check AI backend status
  const checkAIStatus = async () => {
    try {
      const response = await fetch('/api/ai/status', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatus({
          online: data.online || false,
          message: data.message || 'AI Backend: Status Unknown',
          lastChecked: new Date().toLocaleTimeString()
        });
      } else {
        setStatus({
          online: false,
          message: 'AI Backend: Offline',
          lastChecked: new Date().toLocaleTimeString()
        });
      }
    } catch (error) {
      setStatus({
        online: false,
        message: 'AI Backend: Connection Error',
        lastChecked: new Date().toLocaleTimeString()
      });
    }
  };

  useEffect(() => {
    // Check status on mount
    checkAIStatus();
    
    // Check status every 30 seconds
    const interval = setInterval(checkAIStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Show indicator only when offline or when user hovers
  const shouldShow = !status.online || isVisible;

  if (!shouldShow) return null;

  return (
    <div 
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <div 
        className={`px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium ${
          status.online 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-amber-100 text-amber-800 border border-amber-200'
        }`}
      >
        <div 
          className={`w-2 h-2 rounded-full ${
            status.online ? 'bg-green-500' : 'bg-amber-500'
          }`}
        />
        <span>{status.message}</span>
        {status.lastChecked && (
          <span className="text-xs opacity-70">
            ({status.lastChecked})
          </span>
        )}
      </div>
      
      {!status.online && (
        <div className="mt-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
          <div className="font-medium mb-1">Offline Mode Active</div>
          <div>
            • Storylines use intelligent fallback logic<br/>
            • Core functionality remains available<br/>
            • Features may have limited AI assistance
          </div>
        </div>
      )}
    </div>
  );
}