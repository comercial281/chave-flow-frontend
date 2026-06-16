import React, { useEffect, useRef } from 'react';

// Animated background: pure CSS aurora orbs + SVG flow nodes
// Zero JS runtime cost after mount — all animation in CSS @keyframes

const FlowBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Lightweight canvas: animated particles flowing along paths
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;

    // Flow nodes — positioned relative to canvas size
    const getNodes = () => [
      { x: W() * 0.15, y: H() * 0.25 },
      { x: W() * 0.42, y: H() * 0.18 },
      { x: W() * 0.70, y: H() * 0.32 },
      { x: W() * 0.28, y: H() * 0.55 },
      { x: W() * 0.58, y: H() * 0.62 },
      { x: W() * 0.82, y: H() * 0.50 },
      { x: W() * 0.20, y: H() * 0.80 },
      { x: W() * 0.50, y: H() * 0.85 },
      { x: W() * 0.75, y: H() * 0.78 },
    ];

    const edges = [
      [0, 1], [1, 2], [0, 3], [1, 4], [2, 5],
      [3, 4], [4, 5], [3, 6], [4, 7], [5, 8],
      [6, 7], [7, 8],
    ];

    // Particles traveling along edges
    type Particle = { edge: number; t: number; speed: number; alpha: number };
    const particles: Particle[] = edges.flatMap((_, i) =>
      Array.from({ length: 2 }, () => ({
        edge: i,
        t: Math.random(),
        speed: 0.0008 + Math.random() * 0.0006,
        alpha: 0.4 + Math.random() * 0.5,
      }))
    );

    let frame = 0;

    const draw = () => {
      const nodes = getNodes();
      ctx.clearRect(0, 0, W(), H());

      // Draw edges
      edges.forEach(([a, b]) => {
        const na = nodes[a], nb = nodes[b];
        const grad = ctx.createLinearGradient(na.x, na.y, nb.x, nb.y);
        grad.addColorStop(0, 'rgba(124, 58, 237, 0.12)');
        grad.addColorStop(0.5, 'rgba(147, 51, 234, 0.18)');
        grad.addColorStop(1, 'rgba(124, 58, 237, 0.08)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(na.x, na.y);
        ctx.lineTo(nb.x, nb.y);
        ctx.stroke();
      });

      // Draw nodes
      nodes.forEach((n, i) => {
        const pulse = 0.6 + 0.4 * Math.sin(frame * 0.02 + i * 0.9);
        const r = 3 + pulse;

        // Outer glow
        const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 6);
        glow.addColorStop(0, `rgba(147, 51, 234, ${0.15 * pulse})`);
        glow.addColorStop(1, 'rgba(147, 51, 234, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 6, 0, Math.PI * 2);
        ctx.fill();

        // Core dot
        ctx.fillStyle = `rgba(167, 100, 250, ${0.5 + 0.3 * pulse})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw particles
      particles.forEach(p => {
        p.t += p.speed;
        if (p.t > 1) p.t = 0;

        const [a, b] = edges[p.edge];
        const na = nodes[a], nb = nodes[b];
        const x = na.x + (nb.x - na.x) * p.t;
        const y = na.y + (nb.y - na.y) * p.t;

        ctx.fillStyle = `rgba(200, 150, 255, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      frame++;
      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      {/* Deep obsidian base */}
      <div className="absolute inset-0" style={{ background: '#0F0520' }} />

      {/* Aurora orbs — pure CSS, zero JS */}
      <div className="lmf-orb lmf-orb-1" />
      <div className="lmf-orb lmf-orb-2" />
      <div className="lmf-orb lmf-orb-3" />

      {/* Flow network canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.7 }}
      />

      {/* Vignette overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(15,5,32,0.7) 100%)',
        }}
      />
    </div>
  );
};

export default FlowBackground;
