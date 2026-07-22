"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  {
    icon: "📱",
    title: "Citizen reports issue",
    body: "Open the map, tap your location, and describe the environmental issue — pothole, illegal dumping, water leak, or air quality concern.",
    accent: "var(--green-500)",
  },
  {
    icon: "📍",
    title: "Browser captures location",
    body: "We request device geolocation with consent. The report is anchored to your exact position so responders know exactly where to go.",
    accent: "var(--teal-500)",
  },
  {
    icon: "🗄️",
    title: "MongoDB backend stores data",
    body: "Every report is written to a live MongoDB instance. Structured, indexed, and instantly available for dashboards and analytics.",
    accent: "var(--sky-500)",
  },
  {
    icon: "🔗",
    title: "Nearby reports merge",
    body: "Same-category reports within 120 meters automatically cluster into a single high-priority signal, reducing noise for administrators.",
    accent: "var(--amber-500)",
  },
  {
    icon: "📊",
    title: "Dashboard shows hotspots",
    body: "Admins see a real-time map of clusters, priority bars, and status pipelines. No refresh required — the stream is live.",
    accent: "var(--green-600)",
  },
];

export function CinematicScrollStack() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".cinematic-card");
      if (cards.length < 2) return;

      cards.forEach((card, i) => {
        if (i === cards.length - 1) return;

        ScrollTrigger.create({
          trigger: card,
          start: "top top",
          endTrigger: cards[cards.length - 1],
          end: "top top",
          pin: true,
          pinSpacing: false,
        });

        gsap.to(card, {
          scale: 0.88,
          opacity: 0.3,
          filter: "blur(2px)",
          ease: "none",
          scrollTrigger: {
            trigger: cards[i + 1],
            start: "top bottom",
            end: "top top",
            scrub: true,
          },
        });
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} className="cinematic-section shell" aria-labelledby="cinematic-heading">
      <div className="cinematic-header">
        <p className="signal">How it works</p>
        <h2 id="cinematic-heading">A nature-first civic loop — one report to city action.</h2>
      </div>

      <div className="cinematic-stack">
        {STEPS.map((step, i) => (
          <div
            key={i}
            className="cinematic-card"
            style={{ "--card-index": i } as React.CSSProperties}
          >
            <div className="cinematic-frame">
              <div className="cinematic-step-num">0{i + 1}</div>
              <div className="cinematic-icon" aria-hidden="true">{step.icon}</div>
              <div className="cinematic-body">
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </div>
            <div className="cinematic-rim" />
          </div>
        ))}
      </div>
    </section>
  );
}
