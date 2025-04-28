// src/App.jsx
import React, { useState, useEffect } from 'react';
import OrbitalSonification from './OrbitalSonification';
import Preloader from './components/Preloader';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait for all resources to load
    window.addEventListener('load', () => {
      setIsLoading(false);
    });
  }, []);

  return (
    <>
      {isLoading && <Preloader />}
      <OrbitalSonification />
    </>
  );
}

export default App;