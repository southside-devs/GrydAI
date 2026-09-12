import React, { useState } from 'react';
import LoadingScreen from './components/LoadingScreen';
import CustomCursor from './components/CustomCursor';
import LandingPage from './components/LandingPage';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [morphOrigin, setMorphOrigin] = useState(null);

  const [landingKey, setLandingKey] = useState(0);

  const handleLoadingComplete = (centerCoords) => {
    setMorphOrigin(centerCoords);
    setIsLoading(false);
  };

  const handleReplay = () => {
    setMorphOrigin(null);
    setIsLoading(true);
  };

  const handleReloadLanding = () => {
    setLandingKey((prev) => prev + 1);
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* High-Tech Loading Screen with Gateway Flow & GrydAI Branding */}
      {isLoading && <LoadingScreen onComplete={handleLoadingComplete} />}

      {/* Interactive Cyber-Cursor with Thunder Bolt on Double-Click */}
      <CustomCursor morphFrom={morphOrigin} isLoaded={!isLoading} />

      {/* Hospital Microgrid Command Portal Landing Page */}
      {!isLoading && (
        <div key={landingKey} style={{ animation: 'fadeIn 0.5s ease-out forwards' }}>
          <LandingPage onReplay={handleReplay} onReload={handleReloadLanding} />
        </div>
      )}
    </div>
  );
}
