import React, { useEffect, useRef } from 'react';

/**
 * GridCanvas: Generates a high-tech 3D electrical grid perspective
 * with flowing pulses, nodes, and voltage sine waves.
 */
export default function GridCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    let time = 0;

    const render = () => {
      time += 0.015;
      ctx.fillStyle = '#06080d';
      ctx.fillRect(0, 0, width, height);

      // Draw perspective grid lines
      const horizonY = height * 0.45;
      const fov = 350;
      const numLines = 24;

      ctx.lineWidth = 1;

      // Vertical perspective vanishing lines
      for (let i = -numLines; i <= numLines; i++) {
        const xOffset = (i / numLines) * (width * 1.5);
        ctx.beginPath();
        ctx.strokeStyle = i % 4 === 0 ? 'rgba(255, 230, 0, 0.16)' : 'rgba(30, 41, 59, 0.45)';
        ctx.moveTo(width / 2, horizonY);
        ctx.lineTo(width / 2 + xOffset * 2.2, height);
        ctx.stroke();
      }

      // Horizontal depth lines (moving towards viewer)
      const numRungs = 18;
      for (let r = 0; r < numRungs; r++) {
        const progress = ((r / numRungs) + (time * 0.2)) % 1;
        const y = horizonY + Math.pow(progress, 2.2) * (height - horizonY);
        const alpha = Math.min(progress * 1.2, 0.8) * 0.35;

        ctx.beginPath();
        ctx.strokeStyle = `rgba(255, 230, 0, ${alpha})`;
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();

        // Occasional energy spark traveling across rung
        if (r % 3 === 0) {
          const sparkX = ((Math.sin(time * 3 + r) + 1) / 2) * width;
          ctx.beginPath();
          ctx.arc(sparkX, y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = '#ffe600';
          ctx.fill();
        }
      }

      // Digital horizon line
      ctx.fillStyle = 'rgba(255, 230, 0, 0.05)';
      ctx.fillRect(0, horizonY - 1, width, 2);

      // Oscillating electrical waveform in the sky/upper atmosphere
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 230, 0, 0.25)';
      ctx.lineWidth = 1.5;
      for (let x = 0; x < width; x += 10) {
        const y = horizonY * 0.4 + Math.sin(x * 0.008 + time * 2) * 22 * Math.cos(x * 0.002);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.85
      }}
    />
  );
}
