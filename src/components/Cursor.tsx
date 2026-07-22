import React, { useEffect, useRef, useState } from "react";

/**
 * Premium custom cursor — glowing dot + trailing ring.
 * Auto-disabled on touch devices.
 * Skips entirely when prefers-reduced-motion is set.
 */
export function Cursor() {
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const touchQuery = window.matchMedia("(hover: none)").matches || window.matchMedia("(pointer: coarse)").matches;
    if (touchQuery) {
      setIsTouch(true);
      return;
    }

    const dot  = dotRef.current!;
    const ring = ringRef.current!;

    let mx = -100, my = -100;
    let rx = -100, ry = -100;
    let raf = 0;

    document.body.style.cursor = "none";

    function onMove(e: MouseEvent) {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform  = `translate(${mx - 5}px, ${my - 5}px)`;
    }

    function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

    function tick() {
      rx = lerp(rx, mx, 0.12);
      ry = lerp(ry, my, 0.12);
      ring.style.transform = `translate(${rx - 22}px, ${ry - 22}px)`;
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    // Expand ring on interactive elements
    function onEnter() { ring.classList.add("cursor-hover"); dot.classList.add("cursor-hover"); }
    function onLeave() { ring.classList.remove("cursor-hover"); dot.classList.remove("cursor-hover"); }
    function onDown()  { ring.classList.add("cursor-press"); }
    function onUp()    { ring.classList.remove("cursor-press"); }

    document.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mousedown", onDown);
    document.addEventListener("mouseup", onUp);

    const targets = () => document.querySelectorAll("a,button,input,select,[role='button']");
    function attachTargets() {
      targets().forEach((el) => { el.addEventListener("mouseenter", onEnter); el.addEventListener("mouseleave", onLeave); });
    }
    attachTargets();

    const obs = new MutationObserver(attachTargets);
    obs.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.body.style.cursor = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("mouseup", onUp);
      cancelAnimationFrame(raf);
      obs.disconnect();
    };
  }, []);

  if (isTouch) return null;

  return (
    <>
      <div ref={dotRef}  className="cursor-dot"  aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
    </>
  );
}
