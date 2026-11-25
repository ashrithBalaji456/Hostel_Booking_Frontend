import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
}

/**
 * Full-viewport ambient animated canvas combining drifting aurora glows,
 * flowing spatial light ribbons, and interactive constellation particles.
 * Respects `prefers-reduced-motion` and pauses when the tab is hidden.
 */
export function AmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let animId = 0;
    let isHidden = document.hidden;

    const pointer = { x: width * 0.5, y: height * 0.4, active: false };

    const palette = ['34, 211, 238', '99, 102, 241', '168, 85, 247', '56, 189, 248'];
    let particles: Particle[] = [];

    const initParticles = () => {
      const count = width < 768 ? 28 : 54;
      particles = Array.from({ length: count }, (_, idx) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.38,
        vy: (Math.random() - 0.5) * 0.34,
        radius: 1.1 + Math.random() * 1.6,
        color: palette[idx % palette.length],
        alpha: 0.32 + Math.random() * 0.45,
      }));
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles();
    };

    resize();

    const drawFrame = (timeMs: number) => {
      const t = timeMs * 0.00035;
      ctx.clearRect(0, 0, width, height);

      // 1. Drifting aurora nebula glows
      const orbs = [
        {
          cx: width * (0.22 + Math.sin(t * 0.9) * 0.09),
          cy: height * (0.28 + Math.cos(t * 0.7) * 0.08),
          r: Math.max(width, height) * 0.42,
          rgb: '34, 211, 238',
          a: 0.09,
        },
        {
          cx: width * (0.78 + Math.cos(t * 0.65) * 0.08),
          cy: height * (0.25 + Math.sin(t * 0.8) * 0.1),
          r: Math.max(width, height) * 0.44,
          rgb: '99, 102, 241',
          a: 0.11,
        },
        {
          cx: width * (0.52 + Math.sin(t * 0.5 + 1.4) * 0.12),
          cy: height * (0.78 + Math.cos(t * 0.6 + 0.8) * 0.08),
          r: Math.max(width, height) * 0.4,
          rgb: '168, 85, 247',
          a: 0.075,
        },
      ];

      for (const orb of orbs) {
        const grad = ctx.createRadialGradient(orb.cx, orb.cy, 0, orb.cx, orb.cy, orb.r);
        grad.addColorStop(0, `rgba(${orb.rgb}, ${orb.a})`);
        grad.addColorStop(0.55, `rgba(${orb.rgb}, ${orb.a * 0.35})`);
        grad.addColorStop(1, `rgba(${orb.rgb}, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      // 2. Subtle flowing spatial light ribbons
      for (let waveIdx = 0; waveIdx < 2; waveIdx++) {
        ctx.beginPath();
        const baseY = height * (0.36 + waveIdx * 0.28);
        const amp = 34 + waveIdx * 18;
        const freq = 0.0028 - waveIdx * 0.0006;
        const phase = t * (1.8 + waveIdx * 0.7);
        for (let x = 0; x <= width; x += 28) {
          const y = baseY + Math.sin(x * freq + phase) * amp + Math.cos(x * freq * 0.5 - phase * 0.8) * (amp * 0.45);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = waveIdx === 0 ? 'rgba(34, 211, 238, 0.08)' : 'rgba(129, 140, 248, 0.07)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // 3. Constellation particles & links
      const linkDist = width < 768 ? 105 : 145;
      const linkDistSq = linkDist * linkDist;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!reducedMotion) {
          p.x += p.vx;
          p.y += p.vy;

          if (pointer.active) {
            const dx = pointer.x - p.x;
            const dy = pointer.y - p.y;
            const distSq = dx * dx + dy * dy;
            if (distSq > 25 && distSq < 28000) {
              p.x += dx * 0.0022;
              p.y += dy * 0.0022;
            }
          }

          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
          if (p.y < -10) p.y = height + 10;
          if (p.y > height + 10) p.y = -10;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dSq = dx * dx + dy * dy;
          if (dSq < linkDistSq) {
            const strength = (1 - Math.sqrt(dSq) / linkDist) * 0.16;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(56, 189, 248, ${strength.toFixed(3)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }
    };

    const loop = (now: number) => {
      if (!isHidden) {
        drawFrame(now);
        animId = window.requestAnimationFrame(loop);
      }
    };

    if (reducedMotion) {
      drawFrame(0);
    } else {
      animId = window.requestAnimationFrame(loop);
    }

    const onPointerMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    };
    const onPointerLeave = () => {
      pointer.active = false;
    };
    const onVisibilityChange = () => {
      isHidden = document.hidden;
      if (!isHidden && !reducedMotion) {
        window.cancelAnimationFrame(animId);
        animId = window.requestAnimationFrame(loop);
      }
    };

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}
