import { useEffect, useRef } from "react";

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  alpha: number;
  hue: number;
  life: number;
  maxLife: number;
}

/**
 * Full-screen Canvas particle field — floating organic glowing dots.
 * Two layers: slow-drifting large blobs + tiny fast sparks.
 * Pauses when tab is hidden. Respects prefers-reduced-motion.
 */
export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext("2d")!;
    let W = 0, H = 0;
    let raf = 0;
    let active = true;

    // Mouse parallax
    let mx = 0.5, my = 0.5;
    const onMouse = (e: MouseEvent) => { mx = e.clientX / W; my = e.clientY / H; };
    window.addEventListener("mousemove", onMouse, { passive: true });

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize, { passive: true });

    // Visibility pause
    const onVis = () => { active = !document.hidden; if (active) raf = requestAnimationFrame(tick); };
    document.addEventListener("visibilitychange", onVis);

    // Generate particle pool
    const BLOB_COUNT  = 18;
    const SPARK_COUNT = 55;

    function mkBlob(): Particle {
      return {
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - .5) * 0.15,
        vy: (Math.random() - .5) * 0.12,
        r: 60 + Math.random() * 80,
        alpha: 0.025 + Math.random() * 0.04,
        hue: 140 + Math.random() * 60,
        life: 0, maxLife: Infinity,
      };
    }

    function mkSpark(): Particle {
      return {
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - .5) * 0.4,
        vy: -0.1 - Math.random() * 0.3,
        r: 1.5 + Math.random() * 2.5,
        alpha: 0.5 + Math.random() * 0.5,
        hue: 140 + Math.random() * 80,
        life: 0, maxLife: 200 + Math.random() * 300,
      };
    }

    const blobs  = Array.from({ length: BLOB_COUNT },  mkBlob);
    const sparks = Array.from({ length: SPARK_COUNT }, mkSpark);

    function tick() {
      if (!active) return;

      ctx.clearRect(0, 0, W, H);

      // Blobs — slow radial glows
      for (const b of blobs) {
        b.x += b.vx + (mx - .5) * 0.3;
        b.y += b.vy + (my - .5) * 0.3;
        if (b.x < -b.r) b.x = W + b.r;
        if (b.x > W + b.r) b.x = -b.r;
        if (b.y < -b.r) b.y = H + b.r;
        if (b.y > H + b.r) b.y = -b.r;

        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        g.addColorStop(0, `hsla(${b.hue},60%,55%,${b.alpha})`);
        g.addColorStop(1, `hsla(${b.hue},60%,55%,0)`);
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      }

      // Sparks — tiny glowing particles
      for (let i = 0; i < sparks.length; i++) {
        const s = sparks[i];
        s.life++;
        s.x += s.vx;
        s.y += s.vy;
        const progress = s.life / s.maxLife;
        const fade = progress < 0.1 ? progress / 0.1 : progress > 0.8 ? 1 - (progress - 0.8) / 0.2 : 1;

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${s.hue},70%,65%,${s.alpha * fade})`;
        ctx.fill();

        if (s.life >= s.maxLife || s.y < -10) sparks[i] = mkSpark();
      }

      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="particle-canvas"
      aria-hidden="true"
      role="presentation"
    />
  );
}
