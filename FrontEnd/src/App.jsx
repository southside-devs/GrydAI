import React, { useState } from 'react';
import LaunchScreen from './components/LaunchScreen';
import LoadingScreen from './components/LoadingScreen';
import CustomCursor from './components/CustomCursor';
import LandingPage from './components/LandingPage';

export default function App() {
  const [hasLaunched, setHasLaunched] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [morphOrigin, setMorphOrigin] = useState(null);

  const [landingKey, setLandingKey] = useState(0);

  const handleLaunch = () => {
    setHasLaunched(true);
  };

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
      {/* 0. Initial Pre-Launch Screen */}
      {!hasLaunched && <LaunchScreen onLaunch={handleLaunch} />}

      {/* High-Tech Loading Screen with Gateway Flow & GrydAI Branding (triggers after Launch) */}
      {hasLaunched && isLoading && <LoadingScreen onComplete={handleLoadingComplete} />}

      {/* Interactive Cyber-Cursor with Thunder Bolt on Double-Click */}
      <CustomCursor morphFrom={morphOrigin} isLoaded={true} />

      {/* Hospital Microgrid Command Portal Landing Page */}
      <div
        key={landingKey}
        style={{
          opacity: hasLaunched && !isLoading ? 1 : 0,
          pointerEvents: hasLaunched && !isLoading ? 'auto' : 'none',
          transition: 'opacity 0.5s ease-out',
        }}
      >
        <LandingPage onReplay={handleReplay} onReload={handleReloadLanding} />
      </div>
    </div>
  );
}
