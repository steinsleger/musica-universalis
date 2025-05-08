import React, { useEffect, useState } from 'react';
import '../scss/preloader.scss';

const Preloader = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time or wait for actual resources to load
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!isLoading) return null;

  return (
    <div 
      className="preloader" 
      role="status" 
      aria-live="polite"
    >
      <div 
        className="orbital-container"
        aria-hidden="true"
      >
        <div className="orbit orbit-1">
          <div className="planet planet-1"></div>
        </div>
        <div className="orbit orbit-2">
          <div className="planet planet-2"></div>
        </div>
        <div className="orbit orbit-3">
          <div className="planet planet-3"></div>
        </div>
        <div className="sun"></div>
      </div>
      <div className="loading-text" aria-label="Loading application">Loading...</div>
    </div>
  );
};

export default Preloader; 