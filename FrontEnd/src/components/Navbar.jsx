import React, { useState, useRef, useEffect } from 'react';
import { Bell, User, Shield, Key, LogOut, Cpu, Radio } from 'lucide-react';

// Universal GrydAI Command Portal Navigation Bar

export default function Navbar({
  activeTab,
  setActiveTab,
  isConnected,
  onReload,
}) {
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef(null);

  // Close popup if clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-12 flex items-center justify-between z-30 mb-4 relative select-none">
      {/* Left: GrydAI Brand Mark (Click to reload landing page) */}
      <div className="relative h-12 flex items-center min-w-[340px]">
        <button
          onClick={onReload}
          title="GrydAI — Intelligent Microgrid Defense"
          className="interactive-target absolute left-0 top-1/2 -translate-y-1/2 p-0 m-0 border-0 bg-transparent text-left focus:outline-none group cursor-pointer"
        >
          <img
            src="/assets/Clean BG.png"
            alt="GrydAI"
            className="h-60 w-auto max-w-[620px] object-contain drop-shadow-[0_0_50px_rgba(255,230,0,0.9)] group-hover:scale-105 group-hover:drop-shadow-[0_0_75px_rgba(255,230,0,1)] transition-all duration-300"
          />
        </button>
      </div>

      {/* Navigation Tabs with Glassy Sliding Ease Indicator */}
      <nav className="relative flex items-center bg-[#0d121c]/90 border border-white/[0.08] rounded-full p-1 shadow-lg backdrop-blur-md overflow-hidden">
        {/* Animated Glassy Gliding Pill */}
        <div
          className="absolute top-1 bottom-1 rounded-full bg-gradient-to-r from-white/[0.14] via-white/[0.08] to-white/[0.04] border border-white/[0.22] backdrop-blur-2xl shadow-[0_0_20px_rgba(255,255,255,0.1),inset_0_1px_1px_rgba(255,255,255,0.25)] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] pointer-events-none"
          style={{
            width: 'calc((100% - 8px) / 3)',
            transform: `translateX(${
              activeTab === 'Dashboard'
                ? '0%'
                : activeTab === 'Analytics'
                ? '100%'
                : '200%'
            })`,
          }}
        />

        {['Dashboard', 'Analytics', 'Diagnostics'].map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative z-10 px-5 py-1.5 rounded-full text-xs font-medium transition-colors duration-500 ${
                isActive
                  ? 'text-white font-semibold drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* Right Action Cluster & Connection Status */}
      <div className="flex items-center gap-3">
        {/* SIM / Hardware Connection Status (Live WebSocket State) */}
        <div
          className={`flex items-center gap-2 text-[11px] font-mono px-3.5 py-1.5 rounded-full border transition-all duration-500 cursor-default select-none backdrop-blur-md ${
            isConnected
              ? 'bg-[#10b981]/15 border-[#10b981]/40 text-[#10b981] shadow-[0_0_12px_rgba(16,185,129,0.2)]'
              : 'bg-[#ef4444]/15 border-[#ef4444]/40 text-[#ef4444] shadow-[0_0_12px_rgba(239,68,68,0.2)]'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              isConnected
                ? 'bg-[#10b981] shadow-[0_0_8px_#10b981]'
                : 'bg-[#ef4444] shadow-[0_0_8px_#ef4444] animate-pulse'
            }`}
          />
          <span className="font-semibold tracking-wider">
            {isConnected ? 'SIM: CONNECTED' : 'SIM: DISCONNECTED'}
          </span>
        </div>

        <button className="w-9 h-9 rounded-full bg-[#0d121c] border border-white/[0.08] flex items-center justify-center text-[#94a3b8] hover:text-white hover:border-[#ffe600]/40 transition-colors">
          <Bell size={15} />
        </button>

        {/* Profile Avatar & Interactive Popup */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile((prev) => !prev)}
            title="Operator Profile"
            className="w-9 h-9 rounded-full bg-[#1e283d] hover:bg-[#283552] border border-white/[0.15] hover:border-[#ffe600]/50 flex items-center justify-center text-xs font-mono font-bold text-white shadow-inner transition-all duration-200 cursor-pointer focus:outline-none"
          >
            EK
          </button>

          {/* Simple Clean Profile Popup */}
          {showProfile && (
            <div className="absolute right-0 top-12 w-64 rounded-2xl bg-[#0c1017]/95 border border-white/[0.12] p-4 shadow-[0_15px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-200 text-left">
              {/* Operator Header */}
              <div className="flex items-center gap-3 pb-3 border-b border-white/[0.08]">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#ffe600]/20 to-[#ffe600]/40 border border-[#ffe600]/50 flex items-center justify-center font-mono font-bold text-sm text-[#ffe600] shadow-[0_0_12px_rgba(255,230,0,0.3)]">
                  EK
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white font-display">
                    Eng. Ethan Kane
                  </h4>
                  <div className="text-[10px] font-mono text-[#94a3b8] flex items-center gap-1">
                    <Shield size={10} className="text-[#ffe600]" />
                    <span>Grid Chief Operator</span>
                  </div>
                </div>
              </div>

              {/* Status List */}
              <div className="py-3 space-y-2 text-xs font-mono border-b border-white/[0.08]">
                <div className="flex items-center justify-between text-[#94a3b8]">
                  <span>Clearance Level</span>
                  <span className="text-[#ffe600] font-semibold">Tier-1 Alpha</span>
                </div>
                <div className="flex items-center justify-between text-[#94a3b8]">
                  <span>Assigned Substation</span>
                  <span className="text-white">ALIN M Main</span>
                </div>
                <div className="flex items-center justify-between text-[#94a3b8]">
                  <span>Session Telemetry</span>
                  <span className={isConnected ? 'text-[#10b981]' : 'text-[#ef4444]'}>
                    {isConnected ? 'Active Sync' : 'Offline'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 space-y-1">
                <button
                  onClick={() => setShowProfile(false)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-mono text-[#94a3b8] hover:text-white hover:bg-white/[0.05] transition-all"
                >
                  <Cpu size={13} className="text-[#ffe600]" />
                  <span>Telemetry Config</span>
                </button>
                <button
                  onClick={() => setShowProfile(false)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-mono text-[#ef4444] hover:bg-[#ef4444]/10 transition-all"
                >
                  <LogOut size={13} />
                  <span>Disconnect Console</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
