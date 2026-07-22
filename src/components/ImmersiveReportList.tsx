"use client";

import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Incident } from "../types";
import { getDistanceKm, demoLocation } from "../utils";

gsap.registerPlugin(ScrollTrigger);

interface ImmersiveReportListProps {
  incidents: Incident[];
  deviceLocation: { lat: number; lng: number; label: string } | null;
}

export function ImmersiveReportList({ incidents, deviceLocation }: ImmersiveReportListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const center = deviceLocation ?? demoLocation;

  const sorted = [...incidents]
    .map((i) => ({ ...i, dist: getDistanceKm(center.lat, center.lng, i.lat, i.lng) }))
    .sort((a, b) => a.dist - b.dist);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".immersive-report-card").forEach((card, i) => {
        gsap.from(card, {
          opacity: 0,
          y: 40,
          rotateX: -8,
          scale: 0.96,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top bottom-=40",
          },
          delay: i * 0.06,
        });
      });
    }, listRef);
    return () => ctx.revert();
  }, [sorted.length]);

  const statusColor = (s: string) => {
    if (s === "Active") return "#ef4444";
    if (s === "Resolved") return "#22c55e";
    return "#f59e0b";
  };

  return (
    <section className="immersive-section shell" aria-label="Recent reports">
      <div className="immersive-header">
        <p className="signal">All reports</p>
        <h2>Recent environmental issues near you</h2>
      </div>

      <div ref={listRef} className="immersive-list">
        {sorted.length === 0 && (
          <div className="immersive-empty">
            <p>No reports yet. Be the first to submit.</p>
          </div>
        )}
        {sorted.map((incident, idx) => (
          <article
            key={incident.incidentId}
            className="immersive-report-card"
            style={
              {
                "--delay": `${idx * 0.06}s`,
                "--status": statusColor(incident.status),
              } as React.CSSProperties
            }
          >
            <div className="immersive-card-inner">
              <div className="immersive-card-top">
                <span className="immersive-id">{incident.incidentId}</span>
                <span
                  className="immersive-status-pill"
                  style={{ background: `${statusColor(incident.status)}18`, color: statusColor(incident.status) }}
                >
                  {incident.status}
                </span>
              </div>
              <h3>{incident.category}</h3>
              <p className="immersive-sector">{incident.sector}</p>
              <div className="immersive-meta-row">
                <span>📍 {incident.dist.toFixed(1)} km away</span>
                <span>📊 {incident.reports} report{incident.reports !== 1 ? "s" : ""}</span>
                <span>⚡ Priority {incident.priority}/5</span>
              </div>
            </div>
            <div className="immersive-rim" />
          </article>
        ))}
      </div>
    </section>
  );
}
