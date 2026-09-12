import React, { useState, useRef, useEffect } from 'react';
import { Bell, User, Shield, Key, LogOut, Cpu, Radio, CheckCircle2, AlertTriangle, Zap, Activity, Clock } from 'lucide-react';

// Universal GrydAI Command Portal Navigation Bar

export default function Navbar({
  activeTab,
  setActiveTab,
  isConnected,
  onReload,
}) {
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Sample microgrid activity feed
  const [activities, setActivities] = useState([
    {
      id: 1,
      type: 'warning',
      title: 'Bus Voltage Spike Detected',
      desc: 'Substation B recorded 1.08 p.u. surge. Stabilized by BESS 2.',
      time: '2m ago',
      unread: true,
    },
    {
      id: 2,
      type: 'success',
      title: 'Solar PV Array Synchronized',
      desc: 'Clean gen input active: +420 kW feeding primary clinic grid.',
      time: '14m ago',
      unread: true,
    },
    {
      id: 3,
      type: 'info',
      title: 'Island Mode Ready',
      desc: 'Microgrid disconnect relay armed for storm protocol isolation.',
      time: '38m ago',
      unread: false,
    },
    {
      id: 4,
      type: 'success',
      title: 'Supervisor AM Session Authenticated',
      desc: 'Supervisor console linked via secure hardware token.',
      time: '1h ago',
      unread: false,
    },
  ]);

  const unreadCount = activities.filter((a) => a.unread).length;

  const markAllRead = () => {
    setActivities((prev) => prev.map((a) => ({ ...a, unread: false })));
  };

  // Close popups if clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
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
          className="absolute top-1 bottom-1 rounded-full bg-white/[0.08] border border-white/[0.18] backdrop-blur-2xl shadow-[0_0_15px_rgba(255,255,255,0.08)] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] pointer-events-none"
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
              className={`relative z-10 px-7 py-2.5 rounded-full text-base font-medium transition-colors duration-500 cursor-pointer ${
                isActive
                  ? 'text-white font-bold drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* Right Action Cluster & Connection Status */}
      <div className="flex items-center gap-3.5">
        {/* SIM / Hardware Connection Status (Live WebSocket State) */}
        <div
          className={`flex items-center gap-2.5 text-sm font-mono px-4.5 py-2.5 rounded-full border transition-all duration-500 cursor-default select-none backdrop-blur-md ${
            isConnected
              ? 'bg-[#10b981]/15 border-[#10b981]/40 text-[#10b981] shadow-[0_0_12px_rgba(16,185,129,0.2)]'
              : 'bg-[#ef4444]/15 border-[#ef4444]/40 text-[#ef4444] shadow-[0_0_12px_rgba(239,68,68,0.2)]'
          }`}
        >
          <span
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              isConnected
                ? 'bg-[#10b981] shadow-[0_0_8px_#10b981]'
                : 'bg-[#ef4444] shadow-[0_0_8px_#ef4444] animate-pulse'
            }`}
          />
          <span className="font-bold tracking-wider text-sm">
            {isConnected ? 'SIM: CONNECTED' : 'SIM: DISCONNECTED'}
          </span>
        </div>

        {/* Notifications Bell & Activity Feed Popup */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications((prev) => !prev)}
            title="System Activity & Alerts"
            className="w-11 h-11 rounded-full bg-[#0d121c] hover:bg-[#151c2c] border border-white/[0.08] hover:border-[#ffe600]/40 flex items-center justify-center text-[#94a3b8] hover:text-white transition-colors relative cursor-pointer focus:outline-none"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-[#ffe600] text-[#080b11] text-[10px] font-mono font-black rounded-full flex items-center justify-center ring-2 ring-[#080b11] shadow-[0_0_8px_#ffe600]">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Activity Notifications Popup */}
          {showNotifications && (
            <div className="absolute right-0 top-14 w-88 sm:w-96 rounded-2xl bg-[#0c1017]/95 border border-white/[0.14] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-200 text-left">
              {/* Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <Activity size={18} className="text-[#ffe600]" />
                  <h4 className="text-lg font-semibold text-white font-display">
                    Activity & Telemetry
                  </h4>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs font-mono text-[#ffe600]/80 hover:text-[#ffe600] transition-colors cursor-pointer"
                  >
                    Mark read
                  </button>
                )}
              </div>

              {/* Activity List */}
              <div className="py-2.5 divide-y divide-white/[0.05] max-h-76 overflow-y-auto custom-scrollbar">
                {activities.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setActivities((prev) =>
                        prev.map((a) =>
                          a.id === item.id ? { ...a, unread: false } : a
                        )
                      );
                    }}
                    className={`py-3 px-2.5 rounded-xl transition-all cursor-pointer flex items-start gap-3 ${
                      item.unread
                        ? 'bg-white/[0.04] hover:bg-white/[0.07]'
                        : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {item.type === 'warning' && (
                        <div className="w-8 h-8 rounded-lg bg-[#ef4444]/15 border border-[#ef4444]/30 flex items-center justify-center text-[#ef4444]">
                          <AlertTriangle size={17} />
                        </div>
                      )}
                      {item.type === 'success' && (
                        <div className="w-8 h-8 rounded-lg bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center text-[#10b981]">
                          <Zap size={17} />
                        </div>
                      )}
                      {item.type === 'info' && (
                        <div className="w-8 h-8 rounded-lg bg-[#3b82f6]/15 border border-[#3b82f6]/30 flex items-center justify-center text-[#3b82f6]">
                          <Shield size={17} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-base font-semibold text-white font-display truncate">
                          {item.title}
                        </span>
                        <span className="text-xs font-mono text-[#94a3b8] flex items-center gap-1 shrink-0">
                          <Clock size={12} />
                          {item.time}
                        </span>
                      </div>
                      <p className="text-sm font-mono text-[#94a3b8] leading-relaxed mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                    {item.unread && (
                      <span className="w-2 h-2 rounded-full bg-[#ffe600] shrink-0 mt-2 shadow-[0_0_6px_#ffe600]" />
                    )}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono text-[#94a3b8]">
                <span>Telemetry logs auto-synced</span>
                <span className="text-[#10b981] flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                  Live Feed
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar & Interactive Popup */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile((prev) => !prev)}
            title="Supervisor Profile"
            className="w-11 h-11 rounded-full bg-[#1e283d] hover:bg-[#283552] border border-white/[0.15] hover:border-[#ffe600]/50 flex items-center justify-center text-base font-mono font-bold text-white shadow-inner transition-all duration-200 cursor-pointer focus:outline-none"
          >
            AM
          </button>

          {/* Simple Clean Profile Popup */}
          {showProfile && (
            <div className="absolute right-0 top-14 w-88 sm:w-96 rounded-2xl bg-[#0c1017]/95 border border-white/[0.14] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-200 text-left">
              {/* Operator Header */}
              <div className="flex items-center gap-3.5 pb-4 border-b border-white/[0.08]">
                <div className="w-16 h-16 rounded-full bg-[#ffe600]/20 border border-[#ffe600]/60 flex items-center justify-center font-mono font-bold text-xl text-[#ffe600] shadow-[0_0_16px_rgba(255,230,0,0.35)] shrink-0">
                  AM
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xl font-bold text-white font-display truncate">
                    Alin M Hospital.
                  </h4>
                  <div className="text-sm font-mono text-[#94a3b8] truncate mt-0.5">
                    alinhospitals#3366
                  </div>
                  <div className="text-sm font-mono text-[#ffe600] flex items-center gap-1.5 mt-1 font-semibold">
                    <Shield size={15} className="text-[#ffe600]" />
                    <span>Role: Supervisor</span>
                  </div>
                </div>
              </div>

              {/* Status List */}
              <div className="py-4 space-y-3 text-base font-mono border-b border-white/[0.08]">
                <div className="flex items-center justify-between text-[#94a3b8]">
                  <span>Clearance Level</span>
                  <span className="text-[#ffe600] font-semibold">Tier-1 Alpha</span>
                </div>
                <div className="flex items-center justify-between text-[#94a3b8]">
                  <span>Assigned Substation</span>
                  <span className="text-white font-medium">ALIN M Main</span>
                </div>
                <div className="flex items-center justify-between text-[#94a3b8]">
                  <span>Session Telemetry</span>
                  <span className={`font-semibold ${isConnected ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                    {isConnected ? 'Active Sync' : 'Offline'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3.5 space-y-2">
                <button
                  onClick={() => setShowProfile(false)}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-base font-mono text-[#94a3b8] hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
                >
                  <Cpu size={18} className="text-[#ffe600]" />
                  <span>Telemetry Config</span>
                </button>
                <button
                  onClick={() => setShowProfile(false)}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-base font-mono text-[#ef4444] hover:bg-[#ef4444]/15 transition-all cursor-pointer"
                >
                  <LogOut size={18} />
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
