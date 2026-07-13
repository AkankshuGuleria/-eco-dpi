import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

interface PreloaderProps {
  onComplete: () => void;
}

/**
 * Cinematic preloader — 2.4 s full-screen reveal.
 * Shows an animated leaf + water-droplet SVG scene, then fades to the app.
 * Skip button appears after 1.2 s.
 * Entirely disabled when prefers-reduced-motion is set (fires onComplete immediately).
 */
export function Preloader({ onComplete }: PreloaderProps) {
  const wrapRef  = useRef<HTMLDivElement>(null);
  const dropRef  = useRef<SVGCircleElement>(null);
  const leafRef  = useRef<SVGGElement>(null);
  const rippleRef = useRef<SVGEllipseElement>(null);
  const splashRef = useRef<SVGGElement>(null);
  const logoRef  = useRef<HTMLDivElement>(null);
  const skipRef  = useRef<HTMLButtonElement>(null);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onComplete();
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ onComplete });

      // Drop falls from top
      tl.fromTo(dropRef.current, { attr: { cy: -40 } }, { attr: { cy: 195 }, duration: 0.7, ease: "power2.in" })
        // Leaf bends on impact
        .to(leafRef.current, { scaleY: 0.88, transformOrigin: "50% 100%", duration: 0.14, ease: "power1.in" }, "-=0.05")
        // Drop disappears, splash + ripple
        .set(dropRef.current, { attr: { r: 0 } })
        .to(leafRef.current, { scaleY: 1, duration: 0.38, ease: "elastic.out(1, 0.45)" })
        .fromTo(rippleRef.current, { attr: { rx: 0, ry: 0 }, opacity: 0.7 }, { attr: { rx: 55, ry: 14 }, opacity: 0, duration: 0.7, ease: "power2.out" }, "<")
        .fromTo(splashRef.current, { opacity: 0, scale: 0.3, transformOrigin: "50% 100%" }, { opacity: 1, scale: 1, duration: 0.28, ease: "back.out(2.5)" }, "<0.05")
        .to(splashRef.current, { opacity: 0, duration: 0.2, ease: "power2.in" }, "+=0.15")
        // Logo fades in
        .fromTo(logoRef.current, { opacity: 0, y: 14, filter: "blur(8px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.55, ease: "power3.out" }, "-=0.1")
        // Hold, then collapse whole thing upward
        .to(wrapRef.current, { y: "-102%", opacity: 0, duration: 0.65, ease: "power4.in", delay: 0.45 });
    }, wrapRef);

    // Skip button appears after 1.2 s
    const t = setTimeout(() => setCanSkip(true), 1200);

    return () => { ctx.revert(); clearTimeout(t); };
  }, [onComplete]);

  function skip() {
    gsap.to(wrapRef.current, { y: "-102%", opacity: 0, duration: 0.4, ease: "power3.in", onComplete });
  }

  return (
    <div ref={wrapRef} className="preloader" aria-label="Loading Eco-DPI" role="status">
      {/* Scene */}
      <svg className="preloader-scene" viewBox="0 0 260 260" aria-hidden="true">
        {/* Leaf */}
        <g ref={leafRef}>
          <ellipse cx="130" cy="205" rx="56" ry="22" fill="rgba(56,147,106,0.18)" />
          <path
            d="M130 230 C85 200 75 150 110 110 C120 95 130 80 130 60 C130 80 140 95 150 110 C185 150 175 200 130 230Z"
            fill="url(#leafGrad)"
            stroke="rgba(46,124,89,0.4)"
            strokeWidth="1"
          />
          <path d="M130 60 L130 230" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M130 130 C115 118 100 120 90 128" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" fill="none" />
          <path d="M130 155 C145 143 160 145 170 153" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" fill="none" />
        </g>
        {/* Water drop */}
        <circle ref={dropRef} cx="130" cy="-40" r="9" fill="url(#dropGrad)" />
        {/* Ripple */}
        <ellipse ref={rippleRef} cx="130" cy="195" rx="0" ry="0" fill="none" stroke="rgba(56,147,200,0.5)" strokeWidth="1.5" />
        {/* Splash particles */}
        <g ref={splashRef} opacity="0">
          {[[-18,-22],[-10,-30],[0,-32],[10,-30],[18,-22],[-24,-14],[24,-14]].map(([dx,dy],i) => (
            <circle key={i} cx={130 + dx} cy={195 + dy} r={1.8 + (i % 3) * 0.8} fill="rgba(80,180,220,0.7)" />
          ))}
        </g>
        <defs>
          <radialGradient id="leafGrad" cx="45%" cy="40%">
            <stop offset="0%" stopColor="#5bba84" />
            <stop offset="100%" stopColor="#1e6b45" />
          </radialGradient>
          <radialGradient id="dropGrad" cx="35%" cy="28%">
            <stop offset="0%" stopColor="#a8e6f8" />
            <stop offset="100%" stopColor="#3ab0d4" />
          </radialGradient>
        </defs>
      </svg>

      {/* Logo */}
      <div ref={logoRef} className="preloader-logo" style={{ opacity: 0 }}>
        <span className="preloader-mark" />
        <span className="preloader-wordmark">Eco-DPI</span>
        <p className="preloader-tagline">Environmental Intelligence Platform</p>
      </div>

      {/* Skip */}
      {canSkip && (
        <button ref={skipRef} className="preloader-skip" onClick={skip} type="button">
          Skip intro
        </button>
      )}
    </div>
  );
}
