import React, { useState, useEffect } from 'react';
import OrbitalSonification from './OrbitalSonification';
import Preloader from './components/Preloader';
import ScreenAlert from './components/ScreenAlert';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.addEventListener('load', () => {
      setIsLoading(false);
    });
  }, []);

  return (
    <>
      {isLoading && <Preloader />}
      <OrbitalSonification />
      <ScreenAlert />
    </>
  );
};

export default App;
