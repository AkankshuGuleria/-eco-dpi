import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Incident } from "../types";

gsap.registerPlugin(ScrollTrigger);

// ---------- helpers ----------
function statusMeta(status: string) {
  switch (status) {
    case "Active":    return { color: "#ff6b6b", glow: "rgba(255,107,107,.35)", icon: "⚡", label: "Active" };
    case "Resolved":  return { color: "#4caf7d", glow: "rgba(76,175,125,.35)",  icon: "✓",  label: "Resolved" };
    default:          return { color: "#f59e0b", glow: "rgba(245,158,11,.35)",  icon: "↻",  label: "In Progress" };
  }
}

function priorityBar(priority: number) {
  const pct = Math.min(100, Math.round((priority / 5) * 100));
  const col =
    priority >= 4 ? "#ff6b6b" :
    priority >= 3 ? "#f59e0b" :
                    "#4caf7d";
  return { pct, col };
}

// ---------- single 3-D card ----------
interface NotifCardProps {
  incident: Incident;
  index: number;
  total: number;
}

function NotifCard({ incident, index, total }: NotifCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const meta = statusMeta(incident.status);
  const { pct, col } = priorityBar(incident.priority);

  /* 3-D tilt on mouse move */
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    function onMove(e: MouseEvent) {
      const { left, top, width, height } = el!.getBoundingClientRect();
      const rx = ((e.clientY - top)  / height - 0.5) * 18;
      const ry = ((e.clientX - left) / width  - 0.5) * 22;
      el!.style.transform = `perspective(900px) rotateX(${-rx}deg) rotateY(${ry}deg) scale3d(1.03,1.03,1.03)`;
    }
    function onLeave() {
      el!.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
    }

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  /* hue rotates slightly per card index so the stack feels layered */
  const hueShift = index * 18;

  return (
    <div
      ref={cardRef}
      className="notif-3d-card"
      style={
        {
          "--card-glow": meta.glow,
          "--card-accent": meta.color,
          "--hue-shift": `${hueShift}deg`,
        } as React.CSSProperties
      }
    >
      {/* top row */}
      <div className="notif-card-top">
        <span className="notif-card-id">{incident.incidentId}</span>
        <span
          className="notif-card-status-badge"
          style={{
            background: `${meta.color}22`,
            color: meta.color,
            boxShadow: `0 0 10px ${meta.glow}`,
          }}
        >
          {meta.icon} {meta.label}
        </span>
      </div>

      {/* category headline */}
      <h3 className="notif-card-title">{incident.category}</h3>

      {/* sector */}
      <p className="notif-card-sector">
        <svg
          width="12" height="12" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ display: "inline", verticalAlign: "middle", marginRight: "5px" }}
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        {incident.sector}
      </p>

      {/* priority bar */}
      <div className="notif-card-priority-row">
        <span className="notif-card-priority-label">Priority</span>
        <div className="notif-card-priority-track">
          <div
            className="notif-card-priority-fill"
            style={{ width: `${pct}%`, background: col, boxShadow: `0 0 8px ${col}88` }}
          />
        </div>
        <span className="notif-card-priority-val" style={{ color: col }}>{incident.priority}/5</span>
      </div>

      {/* reports + updated */}
      <div className="notif-card-footer">
        <div className="notif-card-reports">
          <svg
            width="13" height="13" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          {incident.reports} report{incident.reports !== 1 ? "s" : ""}
        </div>
        <div className="notif-card-updated">{incident.updated}</div>
      </div>

      {/* card index indicator */}
      <div className="notif-card-counter">{index + 1} / {total}</div>

      {/* rim light overlay */}
      <div className="notif-card-rim" />
    </div>
  );
}

// ---------- empty state ----------
function EmptyNotif() {
  return (
    <div className="notif-empty">
      <div className="notif-empty-icon">
        <svg
          width="40" height="40" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="1.4"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      </div>
      <p>No incidents within 5 km.</p>
      <span>Be the first to report something!</span>
    </div>
  );
}

// ---------- main scroll-stack wrapper ----------
interface NotificationScrollStackProps {
  incidents: Incident[];
}

export function NotificationScrollStack({ incidents }: NotificationScrollStackProps) {
  const wrapRef = useRef<HTMLDivElement>(null);

  /* GSAP sticky-stack — each card pins then scales/fades as next enters */
  useEffect(() => {
    if (incidents.length === 0) return;

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        const cards = gsap.utils.toArray<HTMLElement>(".stack-notif-card");
        if (cards.length < 2) return;

        cards.forEach((card, i) => {
          if (i === cards.length - 1) return;

          /* pin each card at viewport top (+ nav offset) */
          ScrollTrigger.create({
            trigger: card,
            start: "top top+=88",
            endTrigger: cards[cards.length - 1],
            end: "top top+=88",
            pin: true,
            pinSpacing: false,
          });

          /* shrink + fade as next card scrolls in */
          gsap.to(card, {
            scale: 0.88,
            opacity: 0.4,
            filter: "blur(1.5px)",
            ease: "none",
            scrollTrigger: {
              trigger: cards[i + 1],
              start: "top bottom",
              end: "top top+=88",
              scrub: true,
            },
          });
        });
      }, wrapRef);

      return () => ctx.revert();
    });

    return () => mm.revert();
  }, [incidents]);

  return (
    <section className="notif-scroll-section" aria-label="Nearby incident notifications">
      {/* section header */}
      <div className="notif-scroll-header">
        <div className="notif-scroll-eyebrow">
          <span className="notif-pulse" />
          Live nearby
        </div>
        <h2 className="notif-scroll-title">Incident Notifications</h2>
        <p className="notif-scroll-sub">
          Scroll through reports within 5 km of your position
        </p>
      </div>

      {incidents.length === 0 ? (
        <EmptyNotif />
      ) : (
        <div ref={wrapRef} className="notif-stack-wrap">
          {incidents.map((incident, i) => (
            <div key={incident.incidentId} className="stack-notif-card">
              <NotifCard incident={incident} index={i} total={incidents.length} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
