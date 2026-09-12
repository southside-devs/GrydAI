import React, { useState, useEffect, useRef, useCallback } from 'react';
import GatewayFlow from './ui/gateway-flow';

const PHASE_INIT = 0;
const PHASE_BOOT = 1;
const PHASE_READY = 2;
const PHASE_COLLAPSE = 3;

const STATUS_SEQUENCE = [
  'GRID VOLTAGE STABLE',
  'AUTOENCODER BASELINE LOCKED',
  'COMMAND PORTAL READY',
];

export default function LoadingScreen({ onComplete }) {
  const [phase, setPhase] = useState(PHASE_INIT);
  const [statusIdx, setStatusIdx] = useState(-1);
  const [progress, setProgress] = useState(0);
  const logoRef = useRef(null);

  useEffect(() => {
    const t0 = setTimeout(() => setPhase(PHASE_BOOT), 300);
    const t1 = setTimeout(() => setStatusIdx(0), 500);
    const t2 = setTimeout(() => { setStatusIdx(1); setProgress(45); }, 900);
    const t3 = setTimeout(() => { setStatusIdx(2); setProgress(85); }, 1300);
    const t4 = setTimeout(() => {
      setPhase(PHASE_READY);
      setProgress(100);
    }, 1600);
    const t5 = setTimeout(() => {
      setPhase(PHASE_COLLAPSE);
      setTimeout(() => {
        let coords = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        if (logoRef.current) {
          const rect = logoRef.current.getBoundingClientRect();
          coords = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        }
        onComplete(coords);
      }, 300);
    }, 1900);

    return () => [t0, t1, t2, t3, t4, t5].forEach(clearTimeout);
  }, [onComplete]);

  const isCollapsing = phase === PHASE_COLLAPSE;
  const isVisible = phase >= PHASE_BOOT;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50000,
        overflow: 'hidden',
        transition: isCollapsing ? 'opacity 0.28s ease-out' : 'none',
        opacity: isCollapsing ? 0 : 1,
        pointerEvents: isCollapsing ? 'none' : 'auto',
      }}
    >
      {/* Gateway Flow Background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <GatewayFlow
          mode="dark"
          speed={1.5}
          density={1.6}
          opacity={0.85}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* GrydAI Branding Overlay */}
      <div
        ref={logoRef}
        style={{
          position: 'absolute',
          top: '38%',
          left: '50%',
          transform: isCollapsing
            ? 'translate(-50%, -50%) scale(0.02)'
            : isVisible
            ? 'translate(-50%, -50%) scale(1)'
            : 'translate(-50%, -50%) scale(0.6)',
          opacity: isVisible ? 1 : 0,
          transition: isCollapsing
            ? 'transform 0.25s cubic-bezier(0.7, 0, 0.84, 0), opacity 0.2s ease'
            : 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            filter: 'drop-shadow(0 0 35px rgba(255, 230, 0, 0.5)) drop-shadow(0 0 80px rgba(255, 230, 0, 0.2))',
          }}
        >
          <img
            src="/assets/Clean BG.png"
            alt="GrydAI"
            style={{
              width: '400px',
              height: 'auto',
              objectFit: 'contain',
            }}
          />
        </div>

        <div
          style={{
            fontFamily: "'Chakra Petch', sans-serif",
            fontSize: '18px',
            fontWeight: 600,
            letterSpacing: '0.35em',
            color: 'rgba(255, 230, 0, 0.9)',
            marginTop: '6px',
            textShadow: '0 0 20px rgba(255, 230, 0, 0.4)',
          }}
        >
          AI LAYER FOR PREDICTIVE GRID MANAGEMENT
        </div>
      </div>

      {/* Bottom Telemetry Strip */}
      <div
        style={{
          position: 'absolute',
          bottom: '48px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.3s ease',
          zIndex: 20,
        }}
      >
        {/* Progress bar */}
        <div
          style={{
            width: '200px',
            height: '1px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              backgroundColor: '#ffe600',
              boxShadow: '0 0 8px #ffe600',
              transition: 'width 0.4s ease',
            }}
          />
        </div>

        {/* Status text */}
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            letterSpacing: '0.18em',
            color: 'rgba(255, 255, 255, 0.5)',
            minHeight: '14px',
          }}
        >
          {statusIdx >= 0 ? STATUS_SEQUENCE[statusIdx] : ''}
        </div>
      </div>

      {/* Corner HUD elements */}
      <div style={{ position: 'absolute', top: 24, left: 28, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(255,230,0,0.35)', letterSpacing: '0.12em', zIndex: 20 }}>
        TR-408 // SUBSTATION_ALPHA
      </div>
      <div style={{ position: 'absolute', top: 24, right: 28, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(16,185,129,0.5)', letterSpacing: '0.12em', zIndex: 20 }}>
        ● LIVE // 115200 BAUD
      </div>
    </div>
  );
}
