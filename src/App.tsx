import React, { useState, useEffect } from 'react';
import OrbitalSonification from './OrbitalSonification';
import Preloader from './components/Preloader';
import { UpdateNotification } from './components/UpdateNotification';
import ScreenAlert from './components/ScreenAlert';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.addEventListener('load', () => {
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    const checkForUpdates = async (): Promise<void> => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
        }
      } catch (error) {
        console.error('Failed to check for updates:', error);
      }
    };

    checkForUpdates();
    const interval = setInterval(checkForUpdates, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {isLoading && <Preloader />}
      <OrbitalSonification />
      <UpdateNotification />
      <ScreenAlert />
    </>
  );
};

export default App;
