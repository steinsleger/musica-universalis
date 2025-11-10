import React, { useState, useEffect } from 'react';
import OrbitalSonification from './OrbitalSonification';
import Preloader from './components/ui/Preloader';
import ScreenAlert from './components/ui/ScreenAlert';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleLoad = (): void => {
      setIsLoading(false);
    };

    window.addEventListener('load', handleLoad);
    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  return (
    <>
      {isLoading && <Preloader />}
      <ErrorBoundary>
        <OrbitalSonification />
      </ErrorBoundary>
      <ScreenAlert />
    </>
  );
};

export default App;
