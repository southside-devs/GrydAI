import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import Navbar from './Navbar';
import TelemetryCard from './dashboard/TelemetryCard';
import StabilityIndexCard from './dashboard/StabilityIndexCard';
import ImpactCard from './dashboard/ImpactCard';
import TotalEnergyCard from './dashboard/TotalEnergyCard';
import IsometricHospitalGrid from './dashboard/IsometricHospitalGrid';
import AIDetectionBanner from './dashboard/AIDetectionBanner';

export default function LandingPage({ onReplay, onReload }) {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isAnomaly, setIsAnomaly] = useState(false);

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
    <div className="min-h-screen w-full bg-[#000000] text-slate-100 flex flex-col justify-between p-6 lg:p-10 relative overflow-hidden select-none">
      {/* Background Cybernetic Glow & Ambient Lights */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,230,0,0.06),rgba(0,0,0,0))] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-500/[0.03] blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/[0.03] blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

      {/* 1. UNIVERSAL NAVBAR (Dashboard, Analytics, Diagnostics) */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isConnected={isConnected}
        onReload={onReload}
      />

      {/* 2. MAIN CENTER HERO & ISOMETRIC VIEW (WITH GLASSY TAB TRANSITION) */}
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
            <div className="lg:col-span-4 flex flex-col justify-center space-y-6">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.15] font-display">
                  Real-Time{' '}
                  <span className="text-[#ffe600] drop-shadow-[0_0_15px_rgba(255,230,0,0.5)]">
                    Predictive
                  </span>
                  <br />
                  Grid Management
                </h1>
                <p className="text-sm lg:text-base text-[#94a3b8] leading-relaxed max-w-md font-normal">
                  An AI Layer for Real-Time Power monitoring that flags grid failures minutes before they happen
                </p>
              </div>

              <div className="inline-flex items-center justify-between bg-[#0d121c]/90 border border-white/[0.08] rounded-xl p-3.5 max-w-[270px] shadow-lg backdrop-blur-sm">
                <div>
                  <div className="text-[11px] font-mono tracking-widest text-[#64748b] uppercase font-semibold">
                    GRID ACTIVE
                  </div>
                  <div className="text-base font-bold text-white font-display tracking-wide mt-0.5">
                    ALIN M Hospital
                  </div>
                </div>
                <button className="w-8 h-8 rounded-lg bg-[#1e283d] border border-white/[0.1] flex items-center justify-center text-[#ffe600] hover:scale-105 transition-transform cursor-pointer">
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 h-[380px] lg:h-[420px] flex items-center justify-center relative">
              <IsometricHospitalGrid isAnomaly={isAnomaly} />
            </div>

            <div className="lg:col-span-3 flex justify-end items-start">
              <AIDetectionBanner
                confidence={isAnomaly ? 94.8 : 0.0}
                title="Power Outage"
                status={isAnomaly ? 'CONFIRMED' : 'STANDBY'}
                isAnomaly={isAnomaly}
              />
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
          <div className="bg-[#0c1017]/80 border border-white/[0.08] backdrop-blur-xl rounded-3xl p-8 max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#ffe600]/[0.03] blur-[80px] rounded-full pointer-events-none" />
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4 mb-6">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-[#ffe600] uppercase font-bold">
                  TELEMETRY INTELLIGENCE // ANALYTICS
                </span>
                <h2 className="text-2xl font-bold font-display text-white mt-1">
                  Grid Frequency & Phase Analytics
                </h2>
              </div>
              <div className="px-3 py-1 rounded-full bg-[#ffe600]/10 border border-[#ffe600]/30 text-[#ffe600] text-xs font-mono">
                SIGNAL ARCHIVE • ZERO-DATA MODE
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div className="text-xs text-[#94a3b8]">Sampling Rate</div>
                <div className="text-xl font-mono font-bold text-white mt-1">0 kS/s</div>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div className="text-xs text-[#94a3b8]">THD (Harmonic Distortion)</div>
                <div className="text-xl font-mono font-bold text-white mt-1">0.00%</div>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div className="text-xs text-[#94a3b8]">Peak Divergence</div>
                <div className="text-xl font-mono font-bold text-white mt-1">0.0 ms</div>
              </div>
            </div>
            <div className="h-44 w-full rounded-xl bg-[#080b11] border border-white/[0.05] p-4 flex flex-col justify-between">
              <div className="flex justify-between text-[11px] font-mono text-[#64748b]">
                <span>AWAITING STREAMING BUFFER</span>
                <span>FFT SPECTRUM: INACTIVE</span>
              </div>
              <div className="flex items-center justify-center text-xs font-mono text-[#475569]">
                Connecting to GrydAI Telemetry WebSocket daemon...
              </div>
              <div className="flex justify-between text-[10px] font-mono text-[#334155]">
                <span>0 Hz</span>
                <span>25 Hz</span>
                <span>50 Hz</span>
                <span>75 Hz</span>
                <span>100 Hz</span>
              </div>
            </div>
          </div>
        </div>

        {/* DIAGNOSTICS VIEW */}
        <div
          className={`w-full transition-all duration-750 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            activeTab === 'Diagnostics'
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 translate-y-4 pointer-events-none hidden'
          }`}
        >
          <div className="bg-[#0c1017]/80 border border-white/[0.08] backdrop-blur-xl rounded-3xl p-8 max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-80 h-80 bg-cyan-500/[0.03] blur-[80px] rounded-full pointer-events-none" />
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4 mb-6">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-[#06b6d4] uppercase font-bold">
                  HARDWARE HEALTH // DIAGNOSTICS
                </span>
                <h2 className="text-2xl font-bold font-display text-white mt-1">
                  Substation Node Health
                </h2>
              </div>
              <div className="px-3 py-1 rounded-full bg-[#06b6d4]/10 border border-[#06b6d4]/30 text-[#06b6d4] text-xs font-mono">
                DIAGNOSTIC BUS • READY
              </div>
            </div>
            <div className="space-y-3">
              {[
                { name: 'Feeder Sub-Transformer 01', status: 'Standby', code: 'NODE_0x00' },
                { name: 'Hospital Critical Circuit Backup', status: 'Standby', code: 'NODE_0x01' },
                { name: 'Solar PV Inverter Coupling', status: 'Standby', code: 'NODE_0x02' },
                { name: 'Lithium BESS Energy Storage Link', status: 'Standby', code: 'NODE_0x03' },
              ].map((node) => (
                <div key={node.name} className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-all">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-[#64748b]" />
                    <span className="text-sm font-medium text-white">{node.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-[#64748b]">{node.code}</span>
                    <span className="px-2 py-0.5 rounded bg-white/[0.05] text-[#94a3b8]">{node.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM TELEMETRY DOCK */}
      <footer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 z-20 mt-2">
        <TelemetryCard telemetry={telemetry} />
        <StabilityIndexCard stability={stability} status={isAnomaly ? 'Warning' : 'Standby'} />
        <ImpactCard earning={0.00} co2SavedKm="0" co2OffsetMt="0.0" />
        <TotalEnergyCard percentage={energyPercent} currentKw={currentKw} limitKw={0} />
      </footer>
    </div>
  );
}
