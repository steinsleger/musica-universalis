import { useEffect, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

export function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [updateSW, setUpdateSW] = useState(null);

  useEffect(() => {
    const sw = registerSW({
      onNeedRefresh() {
        setShowUpdate(true);
      },
      onOfflineReady() {
        console.log('App ready to work offline');
      },
    });
    setUpdateSW(sw);
  }, []);

  const handleUpdate = async () => {
    if (updateSW) {
      try {
        await updateSW(true); // Pass true to force skip waiting
        setShowUpdate(false);
      } catch (error) {
        console.error('Failed to update:', error);
        // Send the SKIP_WAITING message directly to the service worker
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
        }
        // Give the service worker time to activate, then reload
        setTimeout(() => window.location.reload(), 500);
      }
    }
  };
  
  const handleDismiss = () => {
    setShowUpdate(false);
  };

  if (!showUpdate) return null;

  return (
    <div className="update-notification" style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',  // Changed from right to left
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
    }}>
      {/* Add dismiss button */}
      <button 
        onClick={handleDismiss} 
        style={{
          position: 'absolute',
          top: '5px',
          right: '5px',
          backgroundColor: 'transparent',
          color: 'white',
          border: 'none',
          fontSize: '16px',
          cursor: 'pointer',
          padding: '2px 6px',
          lineHeight: '1'
        }}
        aria-label="Dismiss notification"
      >
        ✕
      </button>
      <p style={{ margin: 0 }}>A new version is available!</p>
      <button 
        onClick={handleUpdate}
        style={{
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        Update Now
      </button>
    </div>
  );
} 