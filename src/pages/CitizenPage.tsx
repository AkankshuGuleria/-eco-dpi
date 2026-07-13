import React, { useState } from "react";
import { Incident, DeviceLocation } from "../types";
import { IncidentMiniCard } from "../components/Shared";
import { IncidentMap } from "../components/IncidentMap";
import {
  getDistanceKm,
  categories,
  demoLocation,
  ReportType,
  ACTIVITY_CATEGORIES,
  ACTIVITY_TYPES,
  ActivityCategory,
  COMPLAINT_CATEGORIES,
  COMPLAINT_TYPES,
  ComplaintCategory,
} from "../utils";
import "../styles/citizen.css";

interface CitizenDashboardProps {
  currentUser: any;
  incidents: Incident[];
  addIncident: (category: string, location?: DeviceLocation) => Promise<unknown>;
  navigate: (page: "home" | "login" | "citizen" | "admin") => void;
  deviceLocation: DeviceLocation | null;
  setDeviceLocation: (loc: DeviceLocation) => void;
  dbConnected: boolean;
  onLogout: () => void;
}

export function CitizenDashboard({
  currentUser, incidents, addIncident, navigate, deviceLocation, setDeviceLocation, dbConnected, onLogout
}: CitizenDashboardProps) {
  const [reportType, setReportType]             = useState<ReportType | "">("");
  const [activityCategory, setActivityCategory] = useState<ActivityCategory | "">("");
  const [activityType, setActivityType]         = useState("");
  const [complaintCategory, setComplaintCategory] = useState<ComplaintCategory | "">("");
  const [complaintType, setComplaintType]         = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [location, setLocation] = useState({
    lat: (deviceLocation ?? demoLocation).lat.toFixed(6),
    lng: (deviceLocation ?? demoLocation).lng.toFixed(6),
    state: deviceLocation ? "Device location ready" : "Demo Chandigarh location ready",
  });

  const reportOrigin = deviceLocation ?? demoLocation;
  const myReports = incidents
    .filter((i) => getDistanceKm(reportOrigin.lat, reportOrigin.lng, i.lat, i.lng) <= 5)
    .slice(0, 4);

  function handleReportTypeChange(val: string) {
    setReportType(val as ReportType | "");
    setActivityCategory("");
    setActivityType("");
    setComplaintCategory("");
    setComplaintType("");
  }

  function handleActivityCategoryChange(val: string) {
    setActivityCategory(val as ActivityCategory | "");
    setActivityType("");
  }

  function handleComplaintCategoryChange(val: string) {
    setComplaintCategory(val as ComplaintCategory | "");
    setComplaintType("");
  }

  function isFormValid(): boolean {
    if (!reportType) return false;
    if (reportType === "activity") return !!activityCategory && !!activityType;
    if (reportType === "complaint") return !!complaintCategory && !!complaintType;
    return false;
  }

  function captureLocation() {
    if (!navigator.geolocation) {
      setLocation((c) => ({ ...c, state: "Geolocation not supported in this browser." }));
      return;
    }
    setLocation((c) => ({ ...c, state: "Requesting permission…" }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
          state: "✓ Location captured successfully",
        });
        setDeviceLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: "Your device location" });
      },
      () => setLocation((c) => ({ ...c, state: "Permission denied — demo location kept." })),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid()) return;

    const leafCategory =
      reportType === "activity" ? activityType : complaintType;

    setSubmitting(true);
    setLastResult(null);

    try {
      await addIncident(leafCategory, {
        lat: Number(location.lat),
        lng: Number(location.lng),
        label: deviceLocation ? "Your device location" : "Demo Chandigarh location",
      });
      setLastResult("✓ Report submitted successfully.");
    } catch (err: any) {
      setLastResult("⚠ Failed to submit: " + (err.message || "unreachable backend"));
    } finally {
      setSubmitting(false);
    }
  }

  const activityTypes =
    activityCategory ? ACTIVITY_TYPES[activityCategory as ActivityCategory] : [];
  const complaintTypes =
    complaintCategory ? COMPLAINT_TYPES[complaintCategory as ComplaintCategory] : [];

  const displayName = currentUser ? (currentUser.email || currentUser.phone || currentUser.identity) : "Authenticated Citizen";
  const isAdmin = currentUser?.role === "admin" || (currentUser?.email && currentUser.email.toLowerCase() === "akankshuguleria2000@gmail.com");

  return (
    <section className="dashboard shell" aria-labelledby="citizen-title">
      <div className="dashboard-head">
        <div>
          <p className="signal">Citizen portal</p>
          <h1 id="citizen-title">Welcome, {displayName}.</h1>
          <p style={{ marginTop: "0.2rem" }}>
            <span className="db-status">
              <span className={`db-dot ${dbConnected ? "connected" : "disconnected"}`} />
              {dbConnected ? "MongoDB connected" : "Backend offline"}
            </span>
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.8rem" }}>
          {isAdmin && (
            <button className="button secondary" type="button" onClick={() => navigate("admin")}>
              Go to Admin View
            </button>
          )}
          <button className="button secondary" type="button" onClick={onLogout} style={{ border: "1px solid rgba(255, 100, 100, 0.4)", color: "rgba(255, 150, 150, 0.9)" }}>
            Logout
          </button>
        </div>
      </div>

      <div className="citizen-layout" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "2rem" }}>
        <div>
          {/* Real Leaflet Map */}
          <div style={{ height: "400px", marginBottom: "2rem", position: "relative" }}>
            <IncidentMap
              incidents={incidents}
              center={deviceLocation ?? demoLocation}
              zoom={13}
            />
          </div>

          <form className="report-card clay-card" onSubmit={handleSubmit} style={{ width: "100%", maxWidth: "100%" }}>
            <h3>📝 New report</h3>

            {/* ── Level 1: Report Type ──────────────────────────────────────── */}
            <label htmlFor="report-type-select">
              Report type
              <select
                id="report-type-select"
                value={reportType}
                onChange={(e) => handleReportTypeChange(e.target.value)}
                required
              >
                <option value="" disabled>Select report type…</option>
                <option value="activity">Activity / Event</option>
                <option value="complaint">Complaint / Civic Issue</option>
              </select>
            </label>

            {/* ── Level 2a: Activity Category ───────────────────────────────── */}
            {reportType === "activity" && (
              <label htmlFor="activity-category-select" className="cascade-field">
                Activity category
                <select
                  id="activity-category-select"
                  value={activityCategory}
                  onChange={(e) => handleActivityCategoryChange(e.target.value)}
                  required
                >
                  <option value="" disabled>Select activity category…</option>
                  {ACTIVITY_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
            )}

            {/* ── Level 3a: Activity Type ───────────────────────────────────── */}
            {reportType === "activity" && activityCategory && (
              <label htmlFor="activity-type-select" className="cascade-field">
                Activity type
                <select
                  id="activity-type-select"
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                  required
                >
                  <option value="" disabled>Select activity type…</option>
                  {activityTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>
            )}

            {/* ── Level 2b: Complaint Category ──────────────────────────────── */}
            {reportType === "complaint" && (
              <label htmlFor="complaint-category-select" className="cascade-field">
                Complaint category
                <select
                  id="complaint-category-select"
                  value={complaintCategory}
                  onChange={(e) => handleComplaintCategoryChange(e.target.value)}
                  required
                >
                  <option value="" disabled>Select complaint category…</option>
                  {COMPLAINT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
            )}

            {/* ── Level 3b: Complaint Type ──────────────────────────────────── */}
            {reportType === "complaint" && complaintCategory && (
              <label htmlFor="complaint-type-select" className="cascade-field">
                Complaint type
                <select
                  id="complaint-type-select"
                  value={complaintType}
                  onChange={(e) => setComplaintType(e.target.value)}
                  required
                >
                  <option value="" disabled>Select complaint type…</option>
                  {complaintTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>
            )}

            {/* ── Location ─────────────────────────────────────────────────── */}
            <div className="field-grid">
              <label>
                Latitude
                <input value={location.lat} readOnly aria-readonly="true" />
              </label>
              <label>
                Longitude
                <input value={location.lng} readOnly aria-readonly="true" />
              </label>
            </div>

            <p className="status-note" role="status">{location.state}</p>

            <button
              className="location-capture-btn"
              type="button"
              onClick={captureLocation}
            >
              📡 Capture current location
            </button>

            <label htmlFor="photo-upload">
              Upload photo <span style={{ fontWeight: 400, color: "var(--quiet)" }}>(optional)</span>
              <input id="photo-upload" type="file" accept="image/*" />
            </label>

            {lastResult && (
              <p className="status-note" role="alert" style={{ background: lastResult.startsWith("✓") ? undefined : "rgba(240,200,200,.7)" }}>
                {lastResult}
              </p>
            )}

            <button
              className="button primary wide"
              type="submit"
              disabled={submitting || !isFormValid()}
            >
              {submitting ? "Submitting…" : "Submit report"}
            </button>
          </form>
        </div>

        <aside className="help-stack" aria-label="Guidance and nearby reports">
          <article className="easy-card clay-card">
            <strong>🗺 Nearby signal</strong>
            <p>Choose a category, capture your location, and submit. Same-category reports within 120 m are strengthened automatically in MongoDB.</p>
          </article>
          {myReports.map((i) => (
            <IncidentMiniCard incident={i} key={i.incidentId} />
          ))}
          {myReports.length === 0 && (
            <p className="status-note">No incidents within 5 km. Be the first to report!</p>
          )}
        </aside>
      </div>
    </section>
  );
}
