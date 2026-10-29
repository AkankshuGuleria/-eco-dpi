import React from "react";
import { Incident, DeviceLocation } from "../types";
import { Metric } from "../components/Shared";
import { IncidentMap } from "../components/IncidentMap";
import { AnnouncementScrollStack } from "../components/AnnouncementScrollStack";
import { ActiveRequestsGraph3D } from "../components/ActiveRequestsGraph3D";
import { ImmersiveReportList } from "../components/ImmersiveReportList";
import { Footer } from "../components/Footer";
import { BookIcon, CheckCircleIcon, MapPinIcon } from "../components/Icons";
import { getDistanceKm, demoLocation } from "../utils";
import { Page } from "../types";
import "../styles/home.css";

interface HomePageProps {
  navigate: (page: Page) => void;
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
          <p className="signal">Environmental governance platform</p>
          <h1 id="hero-title">Understand policy.<br />Know what to do.<br />Report local issues.</h1>
          <p className="hero-text">
            Eco-DPI is an environmental governance platform that helps citizens understand environmental
            policy, know what to do, report local issues, and (where supported) track the response.
          </p>

          {/* Three primary CTAs */}
          <div className="hero-primary-actions" aria-label="Primary navigation options">
            <button
              id="cta-eco-learn"
              className="button primary hero-cta"
              type="button"
              onClick={() => navigate("eco-learn")}
            >
              <BookIcon size={20} />
              <span className="hero-cta-text">
                Eco-Learn
                <span className="hero-cta-sub">Understand policy</span>
              </span>
            </button>
            <button
              id="cta-report"
              className="button primary hero-cta"
              type="button"
              onClick={() => navigate(isLoggedIn ? "citizen" : "login")}
            >
              <MapPinIcon size={20} />
              <span className="hero-cta-text">
                Report an Issue
                <span className="hero-cta-sub">Submit a local report</span>
              </span>
            </button>
            <button
              id="cta-take-action"
              className="button primary hero-cta"
              type="button"
              onClick={() => navigate("take-action")}
            >
              <CheckCircleIcon size={20} />
              <span className="hero-cta-text">
                Take Action
                <span className="hero-cta-sub">Practical guides</span>
              </span>
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
      <Footer navigate={navigate} />
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

        <div className="nearby-map map-panel">
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
