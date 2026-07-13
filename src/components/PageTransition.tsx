import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface PageTransitionProps {
  pageKey: string;
  children: React.ReactNode;
}

/**
 * Wraps page content in a GSAP-animated container.
 * On every pageKey change: fade+blur+scale out → swap children → fade+blur+scale in.
 * Skips animation when prefers-reduced-motion.
 */
export function PageTransition({ pageKey, children }: PageTransitionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prevKey = useRef(pageKey);

  useEffect(() => {
    if (prevKey.current === pageKey) return;
    prevKey.current = pageKey;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const el = ref.current;
    if (!el) return;

    gsap.fromTo(
      el,
      { opacity: 0, y: 18, filter: "blur(6px)", scale: 0.985 },
      { opacity: 1, y: 0, filter: "blur(0px)", scale: 1, duration: 0.52, ease: "power3.out", clearProps: "filter,scale" }
    );
  }, [pageKey]);

  // Initial mount reveal
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    gsap.fromTo(
      el,
      { opacity: 0, y: 22, filter: "blur(8px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.65, ease: "power3.out", delay: 0.05, clearProps: "filter" }
    );
  }, []);

  return (
    <div ref={ref} className="page-transition-wrap">
      {children}
    </div>
  );
}
