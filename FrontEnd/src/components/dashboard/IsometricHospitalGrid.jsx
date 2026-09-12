import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Network, Eye, EyeOff, Radio, Sun, BatteryCharging, Activity, Zap, Shield, ChevronRight, X, Maximize2 } from 'lucide-react';

export default function IsometricHospitalGrid({ isAnomaly = false, telemetry = {} }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showCircuit, setShowCircuit] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState('ats');

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showCircuit) {
        setShowCircuit(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCircuit]);
  const iframeRef = useRef(null);
  const stateRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    angle: 0,
    elevation: 0,
    radius: 0,
    baseAngle: 0,
    baseElevation: 0,
    target: [0, 0, 0],
    api: null,
  });

  // Model ID: f91637b01dde4749aafd56ea37fa3b21
  useEffect(() => {
    let animFrame = null;

    const initSketchfab = () => {
      if (!window.Sketchfab || !iframeRef.current) {
        setTimeout(initSketchfab, 250);
        return;
      }

      const client = new window.Sketchfab(iframeRef.current);
      client.init('f91637b01dde4749aafd56ea37fa3b21', {
        autostart: 1,
        preload: 1,
        transparent: 1,
        ui_theme: 'dark',
        ui_infos: 0,
        ui_controls: 0,
        ui_watermark: 0,
        ui_vr: 0,
        ui_help: 0,
        ui_settings: 0,
        ui_inspector: 0,
        ui_annotations: 0,
        ui_stop: 0,
        ui_ar: 0,
        ui_fadeout: 0,
        success: (api) => {
          stateRef.current.api = api;
          api.start();
          api.addEventListener('viewerready', () => {
            setIsLoaded(true);

            // Fetch initial camera lookAt
            api.getCameraLookAt((err, camera) => {
              if (err || !camera) return;

              // Calibrated gentle zoom in factor
              const zoomFactor = 0.16;
              const dx = camera.position[0] - camera.target[0];
              const dy = camera.position[1] - camera.target[1];
              const dz = camera.position[2] - camera.target[2];
              const r = Math.sqrt(dx * dx + dy * dy) * zoomFactor;

              stateRef.current.radius = r;
              stateRef.current.baseAngle = Math.atan2(dy, dx);
              stateRef.current.baseElevation = dz * zoomFactor;
              stateRef.current.elevation = dz * zoomFactor;
              stateRef.current.target = camera.target;

              // Continuous orbital loop + user drag response
              const loop = () => {
                const s = stateRef.current;
                if (!s.isDragging) {
                  s.angle += 0.0035; // Continuous passive rotation when not dragging
                }

                const curAngle = s.baseAngle + s.angle;
                const newX = s.target[0] + s.radius * Math.cos(curAngle);
                const newY = s.target[1] + s.radius * Math.sin(curAngle);
                const newZ = s.target[2] + s.elevation;

                api.setCameraLookAt(
                  [newX, newY, newZ],
                  s.target,
                  0,
                  () => {}
                );

                animFrame = requestAnimationFrame(loop);
              };

              animFrame = requestAnimationFrame(loop);
            });
          });
        },
        error: () => {
          setIsLoaded(true);
        },
      });
    };

    initSketchfab();

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, []);

  // Handle Drag / Orbit Interaction while keeping custom cursor active
  const handlePointerDown = (e) => {
    stateRef.current.isDragging = true;
    stateRef.current.startX = e.clientX;
    stateRef.current.startY = e.clientY;

    window.dispatchEvent(
      new MouseEvent('mousedown', {
        clientX: e.clientX,
        clientY: e.clientY,
        bubbles: true,
      })
    );
  };

  const handlePointerMove = (e) => {
    // Keep custom cursor locked to pointer
    window.dispatchEvent(
      new MouseEvent('mousemove', {
        clientX: e.clientX,
        clientY: e.clientY,
        bubbles: true,
      })
    );

    const s = stateRef.current;
    if (s.isDragging) {
      const deltaX = e.clientX - s.startX;
      const deltaY = e.clientY - s.startY;
      s.startX = e.clientX;
      s.startY = e.clientY;

      // Orbit horizontal rotation with drag
      s.angle -= deltaX * 0.008;
      // Orbit pitch / elevation with vertical drag
      s.elevation = Math.max(
        s.baseElevation * 0.3,
        Math.min(s.baseElevation * 2.5, s.elevation + deltaY * 0.25)
      );
    }
  };

  const handlePointerUp = (e) => {
    stateRef.current.isDragging = false;
    window.dispatchEvent(
      new MouseEvent('mouseup', {
        clientX: e.clientX,
        clientY: e.clientY,
        bubbles: true,
      })
    );
  };

  // Pinch / Scroll to Zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const s = stateRef.current;
    if (s.radius) {
      const zoomDelta = e.deltaY * 0.05;
      s.radius = Math.max(15, Math.min(120, s.radius + zoomDelta));
    }
  };

  // Dynamic Hospital Microgrid Circuit Hotspot Nodes calibrated directly to circuit.png features
  const circuitNodes = [
    {
      id: 'ats',
      name: 'Automatic Transfer Switch (ATS)',
      category: 'Switchboard Core',
      top: '13.5%',
      left: '37.0%',
      voltage: `${telemetry.voltage ? (telemetry.voltage * 1.73).toFixed(1) : '415.2'} V`,
      load: 'Sub-cycle Fast Transfer',
      status: isAnomaly ? 'Bypass Engaged' : 'Dual-Path Active',
      statusColor: isAnomaly ? 'text-[#ffe600]' : 'text-[#10b981]',
      statusBg: isAnomaly ? 'bg-[#ffe600]/20 border-[#ffe600]' : 'bg-[#10b981]/20 border-[#10b981]',
      desc: 'High-speed solid-state ATS switching between utility supply and emergency diesel bus within sub-cycle latency.',
    },
    {
      id: 'life_safety',
      name: 'Automatic Switchboard (Life Safety)',
      category: 'Emergency Branch',
      top: '35.5%',
      left: '36.5%',
      voltage: '240.0 V',
      load: '44.8 kW Continuous',
      status: 'Protected Circuit',
      statusColor: 'text-[#10b981]',
      statusBg: 'bg-[#10b981]/20 border-[#10b981]',
      desc: 'Dedicated automatic life safety switchboard powering egress pathways, alarms, and emergency lights.',
    },
    {
      id: 'isolation',
      name: 'Medical Isolation Systems (OR A & B)',
      category: 'Critical Care Branch',
      top: '58.0%',
      left: '66.0%',
      voltage: '230.1 V Isolated',
      load: '88.6 kW Zero-Leakage',
      status: isAnomaly ? 'Isolated Feed Secure' : 'Zero Ground Leakage',
      statusColor: 'text-[#10b981]',
      statusBg: 'bg-[#10b981]/20 border-[#10b981]',
      desc: 'Medical isolation transformers & Line Isolation Monitors (LIM) preventing microshock hazards in surgical suites.',
    },
    {
      id: 'distribution',
      name: 'Main Distribution Panel (d.2 fb)',
      category: 'Main Branch Bus',
      top: '9.0%',
      left: '67.5%',
      voltage: '120.0 V / 240.0 V',
      load: '285 A @ 1200 kHz',
      status: 'Harmonics Filtered',
      statusColor: 'text-[#10b981]',
      statusBg: 'bg-[#10b981]/20 border-[#10b981]',
      desc: 'Circuit breaker panel distributing power across clinical lighting, receptacles, and heavy medical motors.',
    },
  ];

  const activeNode = circuitNodes.find((n) => n.id === selectedNodeId) || circuitNodes[0];

  return (
    <div className="relative w-full h-[380px] lg:h-[440px] flex items-center justify-center select-none cursor-none">
      {/* Loading placeholder skeleton while 3D model initializes */}
      {!isLoaded && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-[#94a3b8] pointer-events-none">
          <div className="w-8 h-8 rounded-full border-2 border-[#ffe600] border-t-transparent animate-spin mb-3" />
          <span className="text-xs font-mono tracking-wider text-slate-400">
            INITIALIZING 3D HOSPITAL TWIN...
          </span>
        </div>
      )}

      {/* Frame with crop offsets and transparent interactive drag surface */}
      <div
        className="relative w-full h-full overflow-hidden cursor-none"
        onWheel={handleWheel}
      >
        {/* Full Interactive Canvas Overlay for orbit drag, zoom, and custom cursor tracking */}
        <div
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onWheel={handleWheel}
          className="absolute inset-0 z-20 cursor-none select-none touch-none"
          style={{ cursor: 'none' }}
        />

        <iframe
          ref={iframeRef}
          id="sketchfab-hospital-iframe"
          title="Hospital 3D Digital Twin"
          src=""
          frameBorder="0"
          allow="autoplay; fullscreen; xr-spatial-tracking"
          xr-spatial-tracking="true"
          execution-while-out-of-viewport="true"
          execution-while-not-rendered="true"
          web-share="true"
          allowFullScreen
          className="w-full absolute inset-x-0 border-0 outline-none transform scale-100 origin-center pointer-events-none"
          style={{
            top: '-52px', // Pushes creator/title header completely out of view
            height: 'calc(100% + 106px)', // Extends iframe so model stays centered
            background: 'transparent',
          }}
        />

        {/* Lower Right Corner Circuit Map Button */}
        <div className="absolute right-3.5 bottom-3.5 z-30 pointer-events-auto">
          <button
            onClick={() => setShowCircuit(true)}
            title="Open Full Hospital Microgrid Circuit Schematic"
            className="px-3.5 py-2 rounded-xl border border-white/[0.18] hover:border-[#ffe600]/60 bg-[#0c1017]/95 hover:bg-[#151c2c] text-white font-mono text-xs font-bold transition-all duration-200 flex items-center gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.8)] cursor-pointer focus:outline-none"
          >
            <Network size={15} className="text-[#ffe600]" />
            <span>CIRCUIT MAP</span>
          </button>
        </div>
      </div>

      {/* Expansive Hospital Microgrid Circuit Modal rendered directly to body over everything */}
      {showCircuit && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[999999] flex items-start sm:items-center justify-center pt-14 pb-6 px-3 sm:px-6 select-none cursor-none animate-in fade-in duration-200 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCircuit(false);
          }}
        >
          {/* Dimmed backdrop */}
          <div
            className="fixed inset-0 bg-[#000000]/92 backdrop-blur-md cursor-none"
            onClick={() => setShowCircuit(false)}
          />

          {/* Large Modal Box */}
          <div className="relative w-full max-w-6xl h-[84vh] max-h-[880px] bg-[#080b11] border border-white/[0.22] rounded-3xl p-4 sm:p-6 shadow-[0_25px_90px_rgba(0,0,0,1)] z-10 flex flex-col justify-between overflow-hidden text-left animate-in fade-in zoom-in-95 duration-200 my-auto cursor-none">
            {/* Top Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.12] relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ffe600]/15 border border-[#ffe600]/30 flex items-center justify-center text-[#ffe600] shrink-0">
                  <Network size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold tracking-widest text-[#ffe600] uppercase">
                      HOSPITAL MICROGRID CIRCUIT BLUEPRINT
                    </span>
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${isAnomaly ? 'bg-[#ef4444]/20 border-[#ef4444] text-[#ef4444]' : 'bg-[#10b981]/20 border-[#10b981] text-[#10b981]'}`}>
                      {isAnomaly ? 'SURGE ROUTING ACTIVE' : 'RING BUS NOMINAL'}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-xl font-bold font-display text-white mt-0.5 tracking-tight">
                    Alin M Hospital Electrical Schematic Single-Line Diagram
                  </h3>
                </div>
              </div>

              {/* Close Button X */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowCircuit(false)}
                  title="Close Circuit Map (Esc)"
                  aria-label="Close"
                  className="px-3.5 py-2 rounded-xl bg-[#1e2330] hover:bg-[#ef4444] text-white hover:text-white border border-white/[0.2] hover:border-[#ef4444] flex items-center gap-2 transition-all cursor-none shadow-lg focus:outline-none"
                >
                  <span className="text-xs font-mono font-bold tracking-wide">CLOSE</span>
                  <X size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Expansive Blueprint Canvas Area with Live Node Hotspots */}
            <div className="relative flex-1 my-3 overflow-hidden flex items-center justify-center bg-black rounded-2xl border border-white/[0.08] shadow-inner p-2">
              {/* Aspect-Ratio Preserving Inner Wrapper locked to 16:9 circuit blueprint */}
              <div className="relative w-full h-full max-w-full max-h-full aspect-[1920/1080] flex items-center justify-center">
                {/* Technical schematic blueprint image */}
                <img
                  src="/assets/circuit.png"
                  alt="Hospital Microgrid Electrical Circuit Diagram"
                  className="w-full h-full object-contain filter contrast-125 brightness-105 select-none pointer-events-none"
                />

                {/* Dynamic Interactive Hotspot Nodes pinned on diagram components */}
                {circuitNodes.map((node) => {
                  const isSelected = selectedNodeId === node.id;
                  return (
                    <div
                      key={node.id}
                      style={{ top: node.top, left: node.left }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-30"
                    >
                      <button
                        onClick={() => setSelectedNodeId(node.id)}
                        title={`${node.name} — Click to inspect`}
                        className={`relative group p-1 rounded-full cursor-none focus:outline-none transition-all duration-200 ${
                          isSelected ? 'scale-125' : 'hover:scale-115'
                        }`}
                      >
                        {/* Crisp solid node marker without neon glow */}
                        <span className={`relative flex items-center justify-center w-5 h-5 rounded-full border ${
                          isSelected
                            ? 'bg-[#ffe600] text-[#080b11] border-white font-bold text-[9px]'
                            : isAnomaly && node.id === 'ats'
                            ? 'bg-[#ef4444] text-white border-white text-[9px] font-bold'
                            : 'bg-[#10b981] text-white border-white text-[9px] font-bold'
                        }`}>
                          ⚡
                        </span>

                        {/* Floating name badge */}
                        <div className={`absolute left-1/2 -translate-x-1/2 -top-7 whitespace-nowrap px-2 py-0.5 rounded text-xs font-mono font-bold border transition-all pointer-events-none z-40 ${
                          isSelected
                            ? 'bg-[#ffe600] text-[#080b11] border-white opacity-100'
                            : 'bg-[#080b11] text-white border-white/[0.2] opacity-0 group-hover:opacity-100'
                        }`}>
                          {node.name.split(' (')[0]}
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Selected Node Inspector & Live Telemetry Strip */}
            <div className="p-3 sm:p-4 rounded-2xl bg-[#040609] border border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-3">
                <span className="text-[#ffe600] font-bold px-2 py-0.5 rounded bg-[#ffe600]/10 border border-[#ffe600]/30">
                  {activeNode.category}
                </span>
                <span className="text-white font-semibold text-sm">{activeNode.name}</span>
                <span className="text-[#64748b] hidden md:inline">• {activeNode.desc}</span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-[#94a3b8]">Voltage: <strong className="text-white">{activeNode.voltage}</strong></span>
                <span className="text-[#94a3b8]">Load: <strong className="text-white">{activeNode.load}</strong></span>
                <span className={`font-bold px-2 py-0.5 rounded border ${activeNode.statusBg} ${activeNode.statusColor}`}>
                  {activeNode.status}
                </span>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
