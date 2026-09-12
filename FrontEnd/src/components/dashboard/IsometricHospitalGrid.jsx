import React, { useState, useEffect, useRef } from 'react';

export default function IsometricHospitalGrid({ isAnomaly = false }) {
  const [isLoaded, setIsLoaded] = useState(false);
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
        ui_hint: 0,
        ui_loading: 0,
        ui_general_controls: 0,
        ui_animations: 0,
        success: (api) => {
          stateRef.current.api = api;
          api.start();
          api.addEventListener('viewerready', () => {
            setIsLoaded(true);

            // Fetch initial camera lookAt
            api.getCameraLookAt((err, camera) => {
              if (err || !camera) return;

              // Calibrated isometric building framing factor
              const zoomFactor = 0.28;
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

  // Zoom locked to current preset: prevent wheel / scroll zooming
  const handleWheel = (e) => {
    e.preventDefault();
  };

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
          className="absolute inset-0 z-30 cursor-none select-none touch-none"
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
            top: '-160px', // Pushes creator/title header completely out of view
            height: 'calc(100% + 320px)', // Extends iframe symmetrically so hint is pushed well below container while keeping model perfectly centered
            background: 'transparent',
          }}
        />

      </div>
    </div>
  );
}
