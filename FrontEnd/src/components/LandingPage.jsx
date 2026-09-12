import React, { useState, useEffect, useRef } from 'react';
import { Plus, CheckCircle2 } from 'lucide-react';
import Navbar from './Navbar';
import VoltageTelemetryCard from './dashboard/VoltageTelemetryCard';
import CurrentTelemetryCard from './dashboard/CurrentTelemetryCard';
import StabilityIndexCard from './dashboard/StabilityIndexCard';
import TotalEnergyCard from './dashboard/TotalEnergyCard';
import IsometricHospitalGrid from './dashboard/IsometricHospitalGrid';
import AIDetectionBanner from './dashboard/AIDetectionBanner';
import TransformerEventCard from './dashboard/TransformerEventCard';
import AnalyticsView from './dashboard/AnalyticsView';

export default function LandingPage({ onReplay, onReload }) {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isAnomaly, setIsAnomaly] = useState(false);
  const [notification, setNotification] = useState(null);
  const notifTimeoutRef = useRef(null);

  const [isConnected, setIsConnected] = useState(false);

  const [telemetry, setTelemetry] = useState({
    voltage: 0.0,
    current: 0.0,
    frequency: 0.0,
    waveform: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  });

  const [stability, setStability] = useState(0.0);
  const [energyPercent, setEnergyPercent] = useState(0);
  const [currentKw, setCurrentKw] = useState(0);

  const handleReportEvent = () => {
    if (notifTimeoutRef.current) clearTimeout(notifTimeoutRef.current);
    setNotification({
      title: 'Incident Reported',
      message: 'Event logged and reported',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    });
    notifTimeoutRef.current = setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  useEffect(() => {
    let ws = null;
    let isMounted = true;
    let reconnectTimeout = null;

    const connectWebSocket = () => {
      try {
        ws = new WebSocket('ws://localhost:8000/ws');

        ws.onopen = () => {
          if (isMounted) setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data && data.metrics) {
              setTelemetry((prev) => ({
                ...prev,
                voltage: Number((data.metrics.voltage_sim ?? data.metrics.voltage ?? 0).toFixed(1)),
                current: Number((data.metrics.current_sim ?? data.metrics.current ?? 0).toFixed(1)),
                frequency: Number((data.metrics.frequency_sim ?? data.metrics.frequency ?? 0).toFixed(1)),
                waveform: data.metrics.waveform ?? prev.waveform,
              }));
              if (data.metrics.stability !== undefined) setStability(data.metrics.stability);
              if (data.metrics.energy_percent !== undefined) setEnergyPercent(data.metrics.energy_percent);
              if (data.metrics.current_kw !== undefined) setCurrentKw(data.metrics.current_kw);
            }
            if (data && data.ai_prediction) {
              const status = data.ai_prediction.grid_status;
              setIsAnomaly(status > 0);
            }
          } catch (e) {}
        };

        ws.onclose = () => {
          if (isMounted) {
            setIsConnected(false);
            reconnectTimeout = setTimeout(connectWebSocket, 3000);
          }
        };

        ws.onerror = () => {
          if (isMounted) setIsConnected(false);
        };
      } catch (e) {
        if (isMounted) {
          setIsConnected(false);
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
        }
      }
    };

    connectWebSocket();

    return () => {
      isMounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#000000] text-slate-100 flex flex-col justify-between p-3 xs:p-4 sm:p-6 lg:p-8 xl:p-10 relative overflow-x-hidden select-none">
      {/* 1. UNIVERSAL NAVBAR (Dashboard, Analytics) */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isConnected={isConnected}
        onReload={onReload}
      />

      {/* 2. MAIN CENTER HERO & ISOMETRIC VIEW (WITH SOLID TAB TRANSITION) */}
      <div className="flex-1 flex flex-col justify-center relative z-10 my-2">
        {/* DASHBOARD VIEW */}
        <div
          className={`w-full transition-all duration-750 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            activeTab === 'Dashboard'
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 translate-y-4 pointer-events-none hidden'
          }`}
        >
          <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left Info Column */}
            <div className="lg:col-span-4 flex flex-col justify-center space-y-4 sm:space-y-6 text-center lg:text-left items-center lg:items-start">
              <div className="space-y-3 sm:space-y-4">
                <h1 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.15] font-display">
                  Real-Time{' '}
                  <span className="text-[#ffe600]">
                    Predictive
                  </span>
                  <br />
                  Grid Management
                </h1>
                <p className="text-xs xs:text-sm lg:text-base text-[#94a3b8] leading-relaxed max-w-md font-normal mx-auto lg:mx-0">
                  An AI Layer for Real-Time Power monitoring that flags grid failures minutes before they happen
                </p>
              </div>

              <div className="inline-flex items-center justify-between bg-[#0d121c] border border-white/[0.08] rounded-xl p-3 xs:p-3.5 w-full max-w-[270px]">
                <div className="text-left">
                  <div className="text-[10px] xs:text-[11px] font-mono tracking-widest text-[#64748b] uppercase font-semibold">
                    GRID ACTIVE
                  </div>
                  <div className="text-sm xs:text-base font-bold text-white font-display tracking-wide mt-0.5">
                    ALIN M Hospital
                  </div>
                </div>
                <button className="w-7 xs:w-8 h-7 xs:h-8 rounded-lg bg-[#1e283d] border border-white/[0.1] flex items-center justify-center text-[#ffe600] hover:scale-105 transition-transform cursor-pointer">
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Middle 3D Model Column */}
            <div className="lg:col-span-5 h-[260px] xs:h-[300px] sm:h-[350px] lg:h-[420px] flex items-center justify-center relative w-full overflow-hidden">
              <IsometricHospitalGrid isAnomaly={isAnomaly} />
            </div>

            {/* Right Detection & Event Column */}
            <div className="lg:col-span-3 flex flex-col items-center lg:items-end gap-4 w-full">
              <div className="w-full max-w-[260px] xs:max-w-[280px] sm:max-w-60 relative flex flex-col items-center">
                <img
                  src="/assets/pikachu.png"
                  alt="Pikachu" 
                  className="w-20 xs:w-24 h-auto object-contain block -mb-10 xs:-mb-12 translate-x-14 xs:translate-x-20 select-none pointer-events-none z-20 relative"
                />
                <AIDetectionBanner
                  confidence={isAnomaly ? 94.8 : 0.0}
                  title="Power Outage"
                  status={isAnomaly ? 'CONFIRMED' : 'STANDBY'}
                  isAnomaly={isAnomaly}
                />
              </div>
              <div className="w-full max-w-[260px] xs:max-w-[280px] sm:max-w-60">
                <TransformerEventCard
                  transformerId="TX-02"
                  time="00:00"
                  nodeLabel="LV Winding Phase-B"
                  onReport={handleReportEvent}
                />
              </div>
            </div>
          </main>
        </div>

        {/* ANALYTICS VIEW */}
        <div
          className={`w-full transition-all duration-750 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            activeTab === 'Analytics'
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 translate-y-4 pointer-events-none hidden'
          }`}
        >
          <AnalyticsView />
        </div>
      </div>

      {/* 3. BOTTOM TELEMETRY DOCK (Shown on Dashboard tab) */}
      {activeTab === 'Dashboard' && (
        <footer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 z-20 mt-4 sm:mt-2">
          <VoltageTelemetryCard
            voltage={telemetry.voltage}
            frequency={telemetry.frequency}
            waveform={telemetry.waveform}
          />
          <CurrentTelemetryCard
            current={telemetry.current}
            frequency={telemetry.frequency}
            waveform={telemetry.waveform}
          />
          <StabilityIndexCard
            stability={stability}
            status={isAnomaly ? 'Warning' : 'Standby'}
          />
          <TotalEnergyCard
            percentage={energyPercent}
            currentKw={currentKw}
            limitKw={0}
          />
        </footer>
      )}

      {/* 4. BOTTOM-RIGHT AUTO-DISMISSING REPORT NOTIFICATION */}
      {notification && (
        <div
          className="fixed bottom-6 right-6 z-50 bg-[#ffe600] text-black px-4 py-3.5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.8)] flex items-start gap-3 max-w-sm animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-auto border border-[#ffd700]"
        >
          <div className="w-8 h-8 rounded-xl bg-black/10 flex items-center justify-center text-black shrink-0 mt-0.5">
            <CheckCircle2 size={18} strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0 font-mono text-left">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black text-black tracking-tight">
                {notification.title}
              </span>
              <span className="text-[10px] text-black/70 font-semibold">
                {notification.time}
              </span>
            </div>
            <p className="text-[11px] text-black/90 font-medium mt-0.5 leading-snug">
              {notification.message}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
