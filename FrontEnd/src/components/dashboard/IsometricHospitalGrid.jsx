import React, { useState, useEffect } from 'react';

export default function IsometricHospitalGrid({ isAnomaly = true }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center select-none pointer-events-auto">
      <svg viewBox="0 0 640 400" className="w-full h-full max-w-[620px] overflow-visible drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)]">
        <defs>
          <linearGradient id="floorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e2536" />
            <stop offset="100%" stopColor="#111624" />
          </linearGradient>
          <linearGradient id="wallLeftGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#252f45" />
            <stop offset="100%" stopColor="#161c2a" />
          </linearGradient>
          <linearGradient id="wallRightGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1a2233" />
            <stop offset="100%" stopColor="#0e131d" />
          </linearGradient>
          <linearGradient id="boxTopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2c3750" />
            <stop offset="100%" stopColor="#1f273b" />
          </linearGradient>
        </defs>
        <polygon points="320,80 560,200 320,320 80,200" fill="url(#floorGrad)" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1.2" />
        <polygon points="80,200 320,320 320,332 80,212" fill="#0c1017" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
        <polygon points="320,320 560,200 560,212 320,332" fill="#080b10" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
        <polygon points="80,200 320,80 320,0 80,120" fill="url(#wallLeftGrad)" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1" opacity="0.9" />
        <polygon points="120,135 180,105 180,75 120,105" fill="#111827" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="2 2" opacity="0.6" />
        <polygon points="320,80 560,200 560,120 320,0" fill="url(#wallRightGrad)" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" opacity="0.9" />
        <polygon points="320,80 430,135 430,95 320,40" fill="#1c2436" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" />
        <g transform="translate(310, 110)">
          <ellipse cx="0" cy="0" rx="42" ry="21" fill="rgba(239, 68, 68, 0.08)" stroke={isAnomaly ? '#ef4444' : '#10b981'} strokeWidth="1.5" strokeDasharray="3 3" className={isAnomaly ? 'animate-pulse' : ''} />
          <ellipse cx="0" cy="0" rx="28" ry="14" fill="rgba(239, 68, 68, 0.15)" stroke={isAnomaly ? '#ef4444' : '#10b981'} strokeWidth="1" />
          <path d="M -3 -10 L 3 -10 L 3 -3 L 10 -3 L 10 3 L 3 3 L 3 10 L -3 10 L -3 3 L -10 3 L -10 -3 L -3 -3 Z" fill="#ef4444" stroke="#ef4444" strokeWidth="1" style={{ filter: 'drop-shadow(0 0 8px rgba(239,68,68,0.8))' }} />
        </g>
        <g transform="translate(100, 175)">
          <polygon points="0,30 28,44 28,14 0,0" fill="#1e283d" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
          <polygon points="28,44 56,30 56,0 28,14" fill="#141c2c" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
          <polygon points="0,0 28,14 56,0 28,-14" fill="url(#boxTopGrad)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
          <circle cx="28" cy="20" r="2" fill="#ffe600" style={{ filter: 'drop-shadow(0 0 4px #ffe600)' }} />
        </g>
        <g transform="translate(325, 160)">
          <polygon points="0,15 24,27 48,15 24,3" fill="#1c2538" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
          <polygon points="12,10 36,22 36,2 12,-10" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
          <line x1="16" y1="5" x2="32" y2="13" stroke="#38bdf8" strokeWidth="1.5" opacity="0.8" />
          <line x1="16" y1="0" x2="32" y2="8" stroke="#ffe600" strokeWidth="1" opacity="0.8" />
        </g>
        <g transform="translate(420, 155)">
          <polygon points="0,40 24,52 24,2 0,-10" fill="#1a2233" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
          <polygon points="24,52 48,40 48,-10 24,2" fill="#101622" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
          <polygon points="0,-10 24,2 48,-10 24,-22" fill="#26334a" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
          <circle cx="20" cy="12" r="1.5" fill="#10b981" />
          <circle cx="20" cy="20" r="1.5" fill="#f59e0b" />
          <circle cx="20" cy="28" r="1.5" fill="#3b82f6" />
        </g>
        <g transform="translate(400, 110)">
          <polygon points="0,18 20,28 40,18 20,8" fill="#1c2436" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
          <polygon points="0,18 20,28 20,38 0,28" fill="#141a28" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
          <polygon points="20,28 40,18 40,28 20,38" fill="#0d121c" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
        </g>
        <path d="M 128 205 L 155 218 L 220 195 L 310 225 L 370 190 L 440 205" fill="none" stroke="#ffe600" strokeWidth="2.5" strokeDasharray="5 5" opacity="0.95" style={{ filter: 'drop-shadow(0 0 6px rgba(255,230,0,0.8))' }} />
        <path d="M 310 225 L 310 195 L 340 178" fill="none" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.75" />
        <circle cx="128" cy="205" r="4.5" fill="#ffe600" style={{ filter: 'drop-shadow(0 0 4px #ffe600)' }} />
        <circle cx="128" cy="205" r="2" fill="#ffffff" />
        <circle cx="220" cy="195" r="3.5" fill="#ffe600" />
        <circle cx="310" cy="225" r="5" fill="#ffe600" style={{ filter: 'drop-shadow(0 0 6px #ffe600)' }} />
        <circle cx="310" cy="225" r="2.5" fill="#ffffff" />
        <circle cx="370" cy="190" r="4" fill="#06b6d4" style={{ filter: 'drop-shadow(0 0 6px #06b6d4)' }} />
        <line x1="310" y1="90" x2="310" y2="70" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
        <circle cx="310" cy="70" r="3" fill="#ef4444" />
      </svg>
    </div>
  );
}
