import React from "react";
import heroImage from "../assets/eco-dpi-hero.png";
import { Incident, DeviceLocation } from "../types";
import { Metric } from "../components/Shared";
import { IncidentMap } from "../components/IncidentMap";
import { getDistanceKm, demoLocation } from "../utils";
import "../styles/home.css";

const flowSteps = [
  "Citizen reports issue",
  "Browser captures location",
  "MongoDB backend stores data",
  "Nearby reports merge",
  "Dashboard shows hotspots",
];

interface HomePageProps {
  navigate: (page: "home" | "login" | "citizen" | "admin") => void;
  incidents: Incident[];
  addIncident: (category: string, location?: DeviceLocation) => void;
  isLoggedIn: boolean;
  deviceLocation: DeviceLocation | null;
  loading: boolean;
}

function tallyCategoryCounts(incidents: Incident[]): { label: string; count: number }[] {
  const map = new Map<string, number>();
  for (const inc of incidents) {
    map.set(inc.category, (map.get(inc.category) ?? 0) + inc.reports);
  }
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

export function HomePage({ navigate, incidents, addIncident, isLoggedIn, deviceLocation, loading }: HomePageProps) {
  const activeCount = incidents.filter((i) => i.status !== "Resolved").length;
  const reportTotal = incidents.reduce((sum, i) => sum + i.reports, 0);

  return (
    <>
      <section className="hero shell" aria-labelledby="hero-title">
        <div className="hero-copy reveal">
          <p className="signal">Environmental public infrastructure</p>
          <h1 id="hero-title">Report civic issues.<br />See your area respond.</h1>
          <p className="hero-text">
            Eco-DPI connects citizens and administrators through location-aware reporting.
            Reports are stored securely in MongoDB. Authenticated citizens can map and submit new reports directly.
          </p>
          <div className="hero-actions" aria-label="Primary actions">
            {isLoggedIn ? (
              <button className="button primary" type="button" onClick={() => navigate("citizen")}>
                Go to Dashboard
              </button>
            ) : (
              <button className="button primary" type="button" onClick={() => navigate("login")}>
                Login to Begin
              </button>
            )}
            <button className="button secondary" type="button" onClick={() => navigate("citizen")}>
              Add a report
            </button>
          </div>
        </div>

        <LiveCityDashboard
          incidents={incidents}
          addIncident={addIncident}
          deviceLocation={deviceLocation}
          isLoggedIn={isLoggedIn}
          reportTotal={reportTotal}
          activeCount={activeCount}
          loading={loading}
        />
      </section>

      <section className="shell promise-grid reveal-stagger" aria-label="Eco-DPI highlights">
        {[
          ["📍 Location aware", "Login requests device location so the map opens around your nearby area."],
          ["⚡ Live & persistent", "Reports go straight to MongoDB — no data loss on refresh."],
          ["🧩 Cluster ready", "Same-category reports within 120m merge into one stronger signal."],
        ].map(([title, text]) => (
          <article className="clay-card" key={String(title)}>
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <section className="story shell" aria-labelledby="flow-title">
        <div className="reveal">
          <p className="signal">How it works</p>
          <h2 id="flow-title">A nature-first civic loop from one report to city action.</h2>
        </div>
        <ol className="timeline-3d">
          {flowSteps.map((step, i) => (
            <li key={step} style={{ "--i": i } as React.CSSProperties}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <strong>{step}</strong>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}

interface LiveCityDashboardProps {
  incidents: Incident[];
  addIncident: (category: string, location?: DeviceLocation) => void;
  deviceLocation: DeviceLocation | null;
  isLoggedIn: boolean;
  reportTotal: number;
  activeCount: number;
  loading: boolean;
}

function LiveCityDashboard({
  incidents, deviceLocation, isLoggedIn, reportTotal, activeCount, loading,
}: LiveCityDashboardProps) {
  const center = deviceLocation ?? demoLocation;

  const nearby = incidents
    .map((i) => ({ ...i, distance: getDistanceKm(center.lat, center.lng, i.lat, i.lng) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 8);

  const highPriority = nearby.filter((i) => i.priority >= 4).length;

  const chartData = tallyCategoryCounts(nearby);
  const maxCount = chartData[0]?.count ?? 1;

  return (
    <section className="hero-stage" aria-label="Live nearby environmental dashboard">
      <div className="dashboard-visual" aria-hidden="true">
        <img src={heroImage} alt="" />
      </div>

      <div className="live-dashboard">
        <div className="live-topbar">
          <div>
            <span>Live database stream</span>
            <strong>{deviceLocation ? "Near your device" : "Chandigarh demo area"}</strong>
          </div>
          <em>{isLoggedIn ? "Location on" : "Login to localize"}</em>
        </div>

        <div className="live-metrics" aria-label="Live report analysis">
          <Metric label="Reports" value={loading ? "…" : String(reportTotal)} />
          <Metric label="Active clusters" value={loading ? "…" : String(activeCount)} />
          <Metric label="High priority" value={loading ? "…" : String(highPriority)} />
        </div>

        <div className="nearby-map" style={{ position: "relative", height: "350px", overflow: "hidden", borderRadius: "12px" }}>
          <IncidentMap
            incidents={nearby}
            center={center}
            zoom={12}
            interactive={true}
          />
        </div>

        <div className="nearby-panel">
          <div className="hotspot-header">
            <span className="hotspot-title">🔥 Highest reported issues nearby</span>
            <em className="hotspot-badge">{isLoggedIn ? "Near your device" : "Chandigarh demo"}</em>
          </div>

          {loading ? (
            <p className="hotspot-empty">Loading data…</p>
          ) : chartData.length === 0 ? (
            <p className="hotspot-empty">No reports in this area yet.</p>
          ) : (
            <ol className="hotspot-chart" aria-label="Top reported categories nearby">
              {chartData.map(({ label, count }, idx) => {
                const pct = Math.round((count / maxCount) * 100);
                return (
                  <li key={label} className="hotspot-row" style={{ "--delay": `${idx * 80}ms` } as React.CSSProperties}>
                    <span className="hotspot-rank">#{idx + 1}</span>
                    <div className="hotspot-bar-wrap">
                      <span className="hotspot-label">{label}</span>
                      <div className="hotspot-bar-track">
                        <div
                          className="hotspot-bar-fill"
                          style={{ "--pct": `${pct}%` } as React.CSSProperties}
                          aria-label={`${count} reports`}
                        />
                      </div>
                    </div>
                    <span className="hotspot-count">{count}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}
