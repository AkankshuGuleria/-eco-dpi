"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const TYPE_STYLES: Record<string, { icon: string; accent: string; glow: string; label: string }> = {
  event: { icon: "📅", accent: "#3b82f6", glow: "rgba(59,130,246,.35)", label: "Event" },
  notice: { icon: "📢", accent: "#34d399", glow: "rgba(52,211,153,.35)", label: "Notice" },
  alert: { icon: "🚨", accent: "#f87171", glow: "rgba(248,113,113,.35)", label: "Alert" },
  update: { icon: "🛠️", accent: "#fbbf24", glow: "rgba(251,191,36,.35)", label: "Update" },
};

export function AnnouncementScrollStack({ announcements }: { announcements: any[] }) {
  const approved = announcements.filter((a: any) => a.status === "approved");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (approved.length === 0) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".ann-3d-card").forEach((card, i) => {
        gsap.from(card, {
          opacity: 0,
          y: 50,
          rotateX: -12,
          scale: 0.9,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top bottom-=60",
          },
          delay: i * 0.1,
        });
      });
    }, rootRef);
    return () => ctx.revert();
  }, [approved.length]);

  return (
    <section ref={rootRef} className="ann-section shell" aria-label="Announcements">
      <div className="ann-header">
        <p className="signal">What&apos;s happening</p>
        <h2>Upcoming events &amp; approved notices.</h2>
      </div>

      {approved.length === 0 ? (
        <div className="ann-empty-state">
          <div className="ann-empty-icon" aria-hidden="true">📭</div>
          <p className="ann-empty-text">No upcoming events or notices right now.</p>
          <p className="ann-empty-sub">Check back later for city updates.</p>
        </div>
      ) : (
        <div className="ann-grid">
          {approved.map((a: any, idx: number) => {
            const meta = TYPE_STYLES[a.type] || TYPE_STYLES.notice;
            return (
              <div
                key={a._id}
                className="ann-3d-card"
                style={
                  {
                    "--ann-accent": meta.accent,
                    "--ann-glow": meta.glow,
                    "--delay": `${idx * 0.08}s`,
                  } as React.CSSProperties
                }
              >
                <div className="ann-3d-rim" />
                <div className="ann-3d-inner">
                  <div className="ann-3d-top">
                    <span className="ann-3d-icon" aria-hidden="true">{meta.icon}</span>
                    <span className="ann-3d-type" style={{ background: `${meta.accent}18`, color: meta.accent, boxShadow: `0 0 12px ${meta.glow}` }}>
                      {meta.label}
                    </span>
                  </div>
                  <h3>{a.title}</h3>
                  <p>{a.message}</p>
                  {(a.eventDate || a.eventTime || a.location) && (
                    <div className="ann-3d-meta">
                      {a.eventDate && <span>📅 {new Date(a.eventDate).toLocaleDateString()}</span>}
                      {a.eventTime && <span>🕐 {a.eventTime}</span>}
                      {a.location && <span>📍 {a.location}</span>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
