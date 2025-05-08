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
        await updateSW();
        setShowUpdate(false);
      } catch (error) {
        console.error('Failed to update:', error);
        // Fallback to regular refresh if update fails
        window.location.reload();
      }
    }
  };

  if (!showUpdate) return null;

  return (
    <div className="update-notification" style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
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