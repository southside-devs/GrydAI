import React, { useEffect, useRef, useState } from 'react';
import { Zap } from 'lucide-react';

/**
 * Enhanced Cybernetic Mouse Pointer:
 * - Dual-layer physics: Instant reactive core + smooth trailing tactical halo
 * - Dynamic trailing particle sparks when moving
 * - Rotating sniper/radar crosshair with angle corner brackets
 * - Mini voltage lightning bolt embedded directly in the cursor
 * - High-speed magnetic reaction on click and hover
 */
// Generate a jagged forked lightning bolt path
function generateBoltPath(x, y) {
  const bolts = [];
  const numBranches = 2 + Math.floor(Math.random() * 2);
  for (let b = 0; b < numBranches; b++) {
    const points = [{ x, y }];
    const segments = 6 + Math.floor(Math.random() * 5);
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2; // mostly upward
    let cx = x, cy = y;
    for (let i = 0; i < segments; i++) {
      const len = 18 + Math.random() * 28;
      const jitter = (Math.random() - 0.5) * 1.4;
      cx += Math.cos(angle + jitter) * len;
      cy += Math.sin(angle + jitter) * len;
      points.push({ x: cx, y: cy });
    }
    bolts.push(points);
  }
  return bolts;
}

export default function CustomCursor({ morphFrom, isLoaded }) {
  const [coords, setCoords] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [trail, setTrail] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [sparks, setSparks] = useState([]);
  const [thunders, setThunders] = useState([]);

  const posRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const trailRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const sparksRef = useRef([]);

  useEffect(() => {
    if (morphFrom) {
      posRef.current = { x: morphFrom.x, y: morphFrom.y };
      trailRef.current = { x: morphFrom.x, y: morphFrom.y };
      setCoords({ x: morphFrom.x, y: morphFrom.y });
      setTrail({ x: morphFrom.x, y: morphFrom.y });
    }

    let lastSparkTime = 0;

    const onMouseMove = (e) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      setCoords({ x: e.clientX, y: e.clientY });

      // Spawn energetic spark trails when moving
      const now = performance.now();
      if (now - lastSparkTime > 45) {
        lastSparkTime = now;
        const newSpark = {
          id: Math.random(),
          x: e.clientX + (Math.random() - 0.5) * 12,
          y: e.clientY + (Math.random() - 0.5) * 12,
          size: Math.random() * 3 + 1.5,
          alpha: 1,
        };
        sparksRef.current = [...sparksRef.current.slice(-12), newSpark];
        setSparks([...sparksRef.current]);
      }

      const target = e.target;
      const interactive =
        target.closest('button') ||
        target.closest('a') ||
        target.closest('.interactive-target');
      setIsHovered(!!interactive);
    };

    const onMouseDown = () => setIsClicked(true);
    const onMouseUp = () => setIsClicked(false);

    const onDblClick = (e) => {
      const bolt = {
        id: Math.random(),
        x: e.clientX,
        y: e.clientY,
        paths: generateBoltPath(e.clientX, e.clientY),
        born: performance.now(),
        flash: true,
      };
      setThunders(prev => [...prev, bolt]);
      // Remove after animation
      setTimeout(() => {
        setThunders(prev => prev.filter(t => t.id !== bolt.id));
      }, 500);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('dblclick', onDblClick);

    // Smooth animation loop for the trailing outer halo & particles
    let animId;
    const animate = () => {
      // Elastic easing for the outer halo
      trailRef.current.x += (posRef.current.x - trailRef.current.x) * 0.28;
      trailRef.current.y += (posRef.current.y - trailRef.current.y) * 0.28;
      setTrail({ x: trailRef.current.x, y: trailRef.current.y });

      // Decay sparks
      if (sparksRef.current.length > 0) {
        sparksRef.current = sparksRef.current
          .map(s => ({ ...s, alpha: s.alpha - 0.08, size: s.size * 0.94 }))
          .filter(s => s.alpha > 0);
        setSparks([...sparksRef.current]);
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('dblclick', onDblClick);
      cancelAnimationFrame(animId);
    };
  }, [morphFrom]);

  if (!isLoaded && !morphFrom) return null;

  const haloSize = isHovered ? 56 : isClicked ? 28 : 42;

  return (
    <>
      {/* THUNDER BOLT EFFECT on double-click */}
      {thunders.map(t => (
        <ThunderEffect key={t.id} thunder={t} />
      ))}
      {/* Dynamic Energy Sparks Trail */}
      {sparks.map(spark => (
        <div
          key={spark.id}
          style={{
            position: 'fixed',
            left: `${spark.x}px`,
            top: `${spark.y}px`,
            width: `${spark.size}px`,
            height: `${spark.size}px`,
            borderRadius: '50%',
            backgroundColor: '#ffe600',
            opacity: spark.alpha,
            pointerEvents: 'none',
            zIndex: 99990,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}

      {/* 1. Trailing Outer Tactical Reticle */}
      <div
        style={{
          position: 'fixed',
          left: `${trail.x}px`,
          top: `${trail.y}px`,
          width: `${haloSize}px`,
          height: `${haloSize}px`,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 99998,
          transition: 'width 0.18s cubic-bezier(0.16, 1, 0.3, 1), height 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Outer Circular Ring with Corner Radar Notches */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: isHovered
              ? '1.5px solid #ffe600'
              : '1px solid rgba(255, 230, 0, 0.65)',
            animation: isHovered ? 'radar-sweep 2s linear infinite' : 'none',
          }}
        />

        {/* 4 Precision Corner Crosshair Brackets */}
        <div
          style={{
            position: 'absolute',
            top: '-2px',
            left: '50%',
            width: '2px',
            height: '6px',
            backgroundColor: '#ffe600',
            transform: 'translateX(-50%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-2px',
            left: '50%',
            width: '2px',
            height: '6px',
            backgroundColor: '#ffe600',
            transform: 'translateX(-50%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '-2px',
            top: '50%',
            width: '6px',
            height: '2px',
            backgroundColor: '#ffe600',
            transform: 'translateY(-50%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: '-2px',
            top: '50%',
            width: '6px',
            height: '2px',
            backgroundColor: '#ffe600',
            transform: 'translateY(-50%)',
          }}
        />
      </div>

      {/* 2. Zero-Latency Instant Center Core (Locks to true mouse coordinate) */}
      <div
        style={{
          position: 'fixed',
          left: `${coords.x}px`,
          top: `${coords.y}px`,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Solid Lightning Core Emblem */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Zap
            size={isHovered ? 16 : isClicked ? 12 : 14}
            color="#ffe600"
            fill="#ffe600"
            style={{
              transform: isClicked ? 'scale(0.85) rotate(-10deg)' : 'scale(1)',
              transition: 'transform 0.1s ease',
            }}
          />
        </div>
      </div>
    </>
  );
}

/** Renders a single forked lightning bolt with screen flash and shockwave ring */
function ThunderEffect({ thunder }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let animId;
    const start = performance.now();

    const draw = () => {
      const elapsed = performance.now() - start;
      const alpha = Math.max(0, 1 - elapsed / 400);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw lightning bolt branches
      thunder.paths.forEach((points, bi) => {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255, 230, 0, ${alpha})`;
        ctx.lineWidth = bi === 0 ? 3 : 1.5;
        points.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();

        // White hot core
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
        ctx.lineWidth = bi === 0 ? 1.5 : 0.8;
        points.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
      });

      // Shockwave ring expanding from click point
      const ringRadius = elapsed * 0.6;
      const ringAlpha = Math.max(0, 0.5 - elapsed / 600);
      ctx.beginPath();
      ctx.arc(thunder.x, thunder.y, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 230, 0, ${ringAlpha})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      if (elapsed < 450) {
        animId = requestAnimationFrame(draw);
      }
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, [thunder]);

  // Brief screen flash
  const [flash, setFlash] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setFlash(false), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {/* Screen flash overlay */}
      {flash && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(255, 230, 0, 0.12)',
            pointerEvents: 'none',
            zIndex: 99980,
          }}
        />
      )}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 99985,
        }}
      />
    </>
  );
}
