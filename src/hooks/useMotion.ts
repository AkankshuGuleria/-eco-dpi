import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Initializes Lenis smooth scrolling + GSAP ScrollTrigger integration.
 * Also wires up Intersection Observer reveal animations for .reveal elements.
 * Returns a cleanup function.
 */
export function useSmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    // Sync with GSAP ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return lenisRef;
}

/**
 * Attaches Intersection Observer scroll-reveal to all .reveal elements.
 * Staggers children inside .reveal-stagger containers.
 */
export function useScrollReveal() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    const targets = document.querySelectorAll(".reveal, .reveal-stagger > *");
    targets.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);
}

/**
 * Count-up animation for metric numbers using GSAP.
 * Call after data loads.
 */
export function animateCounters() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  document.querySelectorAll("[data-count]").forEach((el) => {
    const target = parseFloat(el.getAttribute("data-count") ?? "0");
    gsap.fromTo(
      el,
      { textContent: 0 },
      {
        textContent: target,
        duration: 1.4,
        ease: "power2.out",
        snap: { textContent: 1 },
        scrollTrigger: { trigger: el, start: "top 85%" },
      }
    );
  });
}
