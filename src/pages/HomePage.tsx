import React from "react";
import { Incident, DeviceLocation } from "../types";
import { Metric } from "../components/Shared";
import { IncidentMap } from "../components/IncidentMap";
import { AnnouncementScrollStack } from "../components/AnnouncementScrollStack";
import { ActiveRequestsGraph3D } from "../components/ActiveRequestsGraph3D";
import { ImmersiveReportList } from "../components/ImmersiveReportList";
import { Footer } from "../components/Footer";
import { getDistanceKm, demoLocation } from "../utils";
import "../styles/home.css";

interface HomePageProps {
  navigate: (page: "home" | "login" | "citizen" | "admin" | "demo") => void;
  incidents: Incident[];
  addIncident: (category: string, location?: DeviceLocation) => void;
  isLoggedIn: boolean;
  deviceLocation: DeviceLocation | null;
  loading: boolean;
  announcements: any[];
}

export function HomePage({ navigate, incidents, addIncident, isLoggedIn, deviceLocation, loading, announcements }: HomePageProps) {
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
            <button className="button secondary" type="button" onClick={() => navigate("demo")}>
              View Demo
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

      <AnnouncementScrollStack announcements={announcements} />
      <ActiveRequestsGraph3D incidents={incidents} />
      <ImmersiveReportList incidents={incidents} deviceLocation={deviceLocation} />
      <Footer />
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

  return (
    <section className="hero-stage" aria-label="Live nearby environmental dashboard">
      <div className="live-dashboard">
        <div className="live-topbar">
          <div>
            <span>Live database stream</span>
            <strong>{deviceLocation ? "Near your device" : "Demo area"}</strong>
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
      </div>
    </section>
  );
}
