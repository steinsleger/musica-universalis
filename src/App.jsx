// src/App.jsx
import React, { useState, useEffect } from 'react';
import OrbitalSonification from './OrbitalSonification';
import Preloader from './components/Preloader';
import { UpdateNotification } from './components/UpdateNotification';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait for all resources to load
    window.addEventListener('load', () => {
      setIsLoading(false);
    });
  }, []);

  // Add version check effect
  useEffect(() => {
    // Check for updates every hour
    const checkForUpdates = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
        }
      } catch (error) {
        console.error('Failed to check for updates:', error);
      }
    };

    // Check immediately and then every hour
    checkForUpdates();
    const interval = setInterval(checkForUpdates, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {isLoading && <Preloader />}
      <OrbitalSonification />
      <UpdateNotification />
    </>
  );
}

export default App;