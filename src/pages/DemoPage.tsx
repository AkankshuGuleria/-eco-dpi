import React from "react";
import { IncidentMap } from "../components/IncidentMap";
import { Metric } from "../components/Shared";
import { demoLocation } from "../utils";
import { Incident } from "../types";
import "../styles/home.css";

interface DemoPageProps {
  navigate: (page: "home" | "login" | "citizen" | "admin" | "demo") => void;
}

const DEMO_INCIDENTS: Incident[] = [
  {
    incidentId: "DEMO-001",
    category: "Water logging",
    sector: "Sector 17",
    lat: 30.733315,
    lng: 76.779417,
    reports: 42,
    priority: 5,
    status: "Active",
    updated: "2 hours ago",
  },
  {
    incidentId: "DEMO-002",
    category: "Potholes",
    sector: "Sector 22",
    lat: 30.735,
    lng: 76.781,
    reports: 28,
    priority: 4,
    status: "In progress",
    updated: "5 hours ago",
  },
  {
    incidentId: "DEMO-003",
    category: "Garbage dump",
    sector: "Sector 35",
    lat: 30.74,
    lng: 76.77,
    reports: 15,
    priority: 3,
    status: "Active",
    updated: "1 day ago",
  },
];

export function DemoPage({ navigate }: DemoPageProps) {
  const reportTotal = DEMO_INCIDENTS.reduce((sum, i) => sum + i.reports, 0);
  const activeCount = DEMO_INCIDENTS.filter((i) => i.status !== "Resolved").length;
  const highPriority = DEMO_INCIDENTS.filter((i) => i.priority >= 4).length;

  return (
    <section className="hero shell" aria-labelledby="demo-title" style={{ paddingTop: "clamp(3rem, 7vw, 5rem)", paddingBottom: "clamp(4rem, 9vw, 7rem)" }}>
      <div className="hero-copy reveal">
        <p className="signal">Interactive demo</p>
        <h1 id="demo-title">Explore the Eco-DPI demo.</h1>
        <p className="hero-text">
          This standalone demo page shows sample incidents plotted on a live map.
          No login required — just browse the clustered reports and nearby hotspots.
        </p>
        <div className="hero-actions" aria-label="Demo actions">
          <button className="button primary" type="button" onClick={() => navigate("login")}>
            Login to Begin
          </button>
          <button className="button secondary" type="button" onClick={() => navigate("home")}>
            Back to Home
          </button>
        </div>
      </div>

      <div className="hero-stage">
        <div className="live-dashboard">
          <div className="live-topbar">
            <div>
              <span>Live database stream</span>
              <strong>Demo area</strong>
            </div>
            <em>Read-only preview</em>
          </div>

          <div className="live-metrics" aria-label="Demo report analysis">
            <Metric label="Reports" value={String(reportTotal)} />
            <Metric label="Active clusters" value={String(activeCount)} />
            <Metric label="High priority" value={String(highPriority)} />
          </div>

          <div className="nearby-map" style={{ position: "relative", height: "350px", overflow: "hidden", borderRadius: "12px" }}>
            <IncidentMap
              incidents={DEMO_INCIDENTS}
              center={demoLocation}
              zoom={13}
              interactive={true}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
