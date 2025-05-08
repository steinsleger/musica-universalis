import React, { useState, useEffect } from 'react';

const ScreenAlert = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Function to check if screen is portrait or small
    const checkScreenOrientation = () => {
      // Check if user has already dismissed the alert
      if (localStorage.getItem('screenAlertDismissed') === 'true') {
        setDismissed(true);
        return;
      }

      // Check if portrait (height > width) or small screen (width < 768px - typical tablet breakpoint)
      const isPortrait = window.innerHeight > window.innerWidth;
      const isSmallScreen = window.innerWidth < 768;
      
      setIsVisible(isPortrait || isSmallScreen);
    };

    // Check on initial load
    checkScreenOrientation();

    // Check on resize
    window.addEventListener('resize', checkScreenOrientation);
    
    // Check on orientation change for mobile devices
    window.addEventListener('orientationchange', checkScreenOrientation);

    return () => {
      window.removeEventListener('resize', checkScreenOrientation);
      window.removeEventListener('orientationchange', checkScreenOrientation);
    };
  }, []);

  // Handle dismissal of alert
  const handleDismiss = () => {
    setIsVisible(false);
    setDismissed(true);
    localStorage.setItem('screenAlertDismissed', 'true');
  };

  // Don't render anything if alert is dismissed or should not be visible
  if (dismissed || !isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '16px',
      left: '16px',
      right: '16px',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      color: 'white',
      padding: '16px',
      borderRadius: '8px',
      zIndex: 9999,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', width: '100%', marginBottom: '8px' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', flexShrink: 0 }}>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <h3 style={{ margin: '0', flexGrow: 1, fontSize: '18px' }}>Optimal Experience Alert</h3>
        <button 
          onClick={handleDismiss}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '20px',
            padding: '0',
            lineHeight: '1',
            flexShrink: 0
          }}
          aria-label="Close alert"
        >
          ×
        </button>
      </div>
      <p style={{ margin: '0', fontSize: '14px', lineHeight: '1.5' }}>
        For the best experience with Musica Universalis, we recommend using a landscape orientation and a larger screen size. The current view may limit some functionality.
      </p>
    </div>
  );
};

export default ScreenAlert; 