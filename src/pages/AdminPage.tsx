import React, { useMemo, useState } from "react";
import { Incident, Announcement } from "../types";
import { Metric } from "../components/Shared";
import { IncidentMap } from "../components/IncidentMap";
import { updateIncidentStatus, deleteIncident, updateIncidentPriority, fetchAllAnnouncements, createAnnouncement, approveAnnouncement, rejectAnnouncement, deleteAnnouncement } from "../api";
import { demoLocation } from "../utils";
import "../styles/admin.css";

interface AdminDashboardProps {
  currentUser: any;
  incidents: Incident[];
  setIncidents: React.Dispatch<React.SetStateAction<Incident[]>>;
  navigate: (page: "home" | "login" | "citizen" | "admin") => void;
  onLogout: () => void;
  announcements: Announcement[];
  setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
}

type SortKey = "priority" | "reports" | "updated";

const STATUS_CYCLE: Record<Incident["status"], Incident["status"]> = {
  "Active":      "In progress",
  "In progress": "Resolved",
  "Resolved":    "Active",
};

function exportCSV(rows: Incident[]) {
  const header = ["ID", "Category", "Sector", "Status", "Priority", "Reports", "Lat", "Lng", "Updated"];
  const lines = rows.map((i) =>
    [i.incidentId, i.category, i.sector, i.status, i.priority, i.reports, i.lat, i.lng, i.updated]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement("a"), { href: url, download: "eco-dpi-incidents.csv" });
  a.click();
  URL.revokeObjectURL(url);
}

function relativeTime(updated: string): string {
  const ms = Date.now() - new Date(updated).getTime();
  if (isNaN(ms) || ms < 0) return updated;
  if (ms < 60_000)   return "just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)} min ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)} hr ago`;
  return `${Math.floor(ms / 86_400_000)} day${Math.floor(ms / 86_400_000) > 1 ? "s" : ""} ago`;
}

export function AdminDashboard({ currentUser, incidents, setIncidents, navigate, onLogout, announcements, setAnnouncements }: AdminDashboardProps) {
  const [filter,        setFilter]        = useState("All");
  const [sortKey,       setSortKey]       = useState<SortKey>("priority");
  const [deleting,      setDeleting]      = useState<string | null>(null);
  const [cycling,       setCycling]       = useState<string | null>(null);
  const [adjusting,     setAdjusting]     = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchText,    setSearchText]    = useState("");

  // Guard: require admin user (Gmail hardcoded checking or role admin)
  const isAdmin = currentUser?.role === "admin" || (currentUser?.email && currentUser.email.toLowerCase() === "akankshuguleria2000@gmail.com");

  const visibleIncidents = useMemo(() => {
    const statusFilters = ["All", "Active", "In progress", "Resolved"];
    let list = incidents.filter((i) => {
      if (filter === "All") return true;
      if (statusFilters.includes(filter)) return i.status === filter;
      return i.category.toLowerCase().includes(filter.toLowerCase());
    });
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      list = list.filter((i) => i.category.toLowerCase().includes(q) || i.sector.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (sortKey === "priority") return b.priority - a.priority;
      if (sortKey === "reports")  return b.reports  - a.reports;
      const ta = new Date(a.updated).getTime();
      const tb = new Date(b.updated).getTime();
      if (isNaN(ta) && isNaN(tb)) return 0;
      if (isNaN(ta)) return 1;
      if (isNaN(tb)) return -1;
      return tb - ta;
    });
  }, [filter, searchText, sortKey, incidents]);

  const totalReports   = visibleIncidents.reduce((s, i) => s + i.reports, 0);
  const resolvedCount  = visibleIncidents.filter((i) => i.status === "Resolved").length;
  const activeCount    = visibleIncidents.filter((i) => i.status === "Active").length;
  const maxPriority    = Math.max(...visibleIncidents.map((i) => i.priority), 0);

  const categoryStats = useMemo(() => {
    const map = new Map<string, number>();
    for (const i of visibleIncidents) map.set(i.category, (map.get(i.category) ?? 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [visibleIncidents]);

  async function handleStatusCycle(incident: Incident) {
    if (cycling === incident.incidentId) return;
    const next = STATUS_CYCLE[incident.status];
    setCycling(incident.incidentId);
    try {
      const updated = await updateIncidentStatus(incident.incidentId, next);
      setIncidents((cur) => cur.map((i) => i.incidentId === incident.incidentId ? { ...i, ...updated } : i));
    } catch { console.error("Failed to update status"); }
    finally { setCycling(null); }
  }

  async function handlePriorityChange(incident: Incident, delta: 1 | -1) {
    const next = Math.min(5, Math.max(1, incident.priority + delta));
    if (next === incident.priority) return;
    setAdjusting(incident.incidentId);
    try {
      const updated = await updateIncidentPriority(incident.incidentId, next);
      setIncidents((cur) => cur.map((i) => i.incidentId === incident.incidentId ? { ...i, ...updated } : i));
    } catch { console.error("Failed to update priority"); }
    finally { setAdjusting(null); }
  }

  async function handleDelete(incidentId: string) {
    setDeleteConfirm(null);
    setDeleting(incidentId);
    try {
      await deleteIncident(incidentId);
      setIncidents((cur) => cur.filter((i) => i.incidentId !== incidentId));
    } catch { console.error("Failed to delete"); }
    finally { setDeleting(null); }
  }

  // ── Announcement management ──
  const [showAnnForm, setShowAnnForm] = useState(false);
  const [annTitle, setAnnTitle] = useState("");
  const [annMessage, setAnnMessage] = useState("");
  const [annType, setAnnType] = useState<Announcement["type"]>("event");
  const [annDate, setAnnDate] = useState("");
  const [annTime, setAnnTime] = useState("");
  const [annLocation, setAnnLocation] = useState("");
  const [annBusy, setAnnBusy] = useState(false);
  const [annError, setAnnError] = useState("");

  const pendingAnnouncements = announcements.filter((a) => a.status === "pending");

  async function loadAnnouncements() {
    try {
      const all = await fetchAllAnnouncements();
      setAnnouncements(all);
    } catch { /* ignore */ }
  }

  async function handleCreateAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    if (!annTitle.trim() || !annMessage.trim()) {
      setAnnError("Title and message are required.");
      return;
    }
    setAnnBusy(true);
    setAnnError("");
    try {
      await createAnnouncement({
        title: annTitle.trim(),
        message: annMessage.trim(),
        type: annType,
        eventDate: annType === "event" && annDate ? new Date(annDate).toISOString() : undefined,
        eventTime: annTime.trim() || undefined,
        location: annLocation.trim() || undefined,
      });
      setAnnTitle(""); setAnnMessage(""); setAnnDate(""); setAnnTime(""); setAnnLocation("");
      setShowAnnForm(false);
      await loadAnnouncements();
    } catch (err: any) {
      setAnnError(err.message || "Failed to create announcement");
    } finally {
      setAnnBusy(false);
    }
  }

  async function handleAnnAction(id: string, action: "approve" | "reject" | "delete") {
    try {
      if (action === "approve") await approveAnnouncement(id);
      else if (action === "reject") await rejectAnnouncement(id);
      else await deleteAnnouncement(id);
      await loadAnnouncements();
    } catch (err: any) {
      setAnnError(err.message || "Action failed");
    }
  }

  if (!isAdmin) {
    return (
      <section className="admin-dashboard shell" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center" }}>
        <div className="clay-card" style={{ padding: "2.5rem", maxWidth: "450px" }}>
          <h2 style={{ color: "#ea4335", marginBottom: "1rem" }}>⚠️ Access Denied</h2>
          <p style={{ color: "var(--quiet)", marginBottom: "2rem" }}>
            The admin portal is strictly visible to authenticated administrators only. If you are an admin, please login with the authorized email address.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <button className="button primary" onClick={() => navigate("login")}>Login as Admin</button>
            <button className="button secondary" onClick={() => navigate("home")}>Back to Home</button>
          </div>
        </div>
      </section>
    );
  }

  const pillClass = (s: string) =>
    s === "Active" ? "status-pill active" : s === "Resolved" ? "status-pill resolved" : "status-pill progress";

  return (
    <section className="admin-dashboard shell" aria-labelledby="admin-title">
      <div className="dashboard-head">
        <div>
          <p className="signal">Admin dashboard</p>
          <h1 id="admin-title">Monitor clusters, hotspots, and priority.</h1>
          <p>Logged in as: {currentUser?.email || "Admin"}</p>
        </div>
        <div style={{ display: "flex", gap: ".7rem", flexWrap: "wrap" }}>
          <button
            className="button secondary small"
            type="button"
            onClick={() => exportCSV(visibleIncidents)}
            title="Download visible incidents as CSV"
          >
            ⬇ Export CSV
          </button>
          <button className="button secondary" type="button" onClick={() => navigate("citizen")}>
            Citizen portal
          </button>
          <button className="button secondary" type="button" onClick={onLogout} style={{ border: "1px solid rgba(255, 100, 100, 0.4)", color: "rgba(255, 150, 150, 0.9)" }}>
            Logout
          </button>
        </div>
      </div>

      <div className="admin-metrics" aria-label="Dashboard metrics">
        <Metric label="Total reports"    value={String(totalReports)} />
        <Metric label="Active clusters"  value={String(activeCount)} />
        <Metric label="Resolved"         value={String(resolvedCount)} />
        <Metric label="Highest priority" value={String(maxPriority)} />
      </div>

      {/* Announcements management */}
      <section className="ann-admin clay-card" aria-label="Announcements">
        <div className="ann-admin-head">
          <div>
            <p className="signal">City announcements</p>
            <h3>📢 Events, notices &amp; alerts shown on the home page</h3>
          </div>
          <button className="button primary small" type="button" onClick={() => setShowAnnForm((v) => !v)}>
            {showAnnForm ? "Close" : "+ New announcement"}
          </button>
        </div>

        {annError && (
          <div className="error-banner" style={{ background: "rgba(240,80,80,.18)", borderLeft: "4px solid #e0533d", padding: ".6rem .8rem", borderRadius: "6px", marginBottom: ".8rem", fontSize: ".85rem" }}>
            ⚠️ {annError}
          </div>
        )}

        {showAnnForm && (
          <form className="ann-form" onSubmit={handleCreateAnnouncement}>
            <div className="ann-form-row">
              <label>
                Type
                <select value={annType} onChange={(e) => setAnnType(e.target.value as Announcement["type"])}>
                  <option value="event">Event (needs approval)</option>
                  <option value="notice">Notice</option>
                  <option value="alert">Alert</option>
                  <option value="update">Update</option>
                </select>
              </label>
              <label>
                Title
                <input type="text" value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} placeholder="Blood donation camp" />
              </label>
            </div>
            <label className="ann-full">
              Message
              <textarea value={annMessage} onChange={(e) => setAnnMessage(e.target.value)} rows={2} placeholder="Join us for a community blood donation drive…" />
            </label>
            <div className="ann-form-row">
              <label>
                Date {annType === "event" && <span className="req">*</span>}
                <input type="date" value={annDate} onChange={(e) => setAnnDate(e.target.value)} />
              </label>
              <label>
                Time
                <input type="text" value={annTime} onChange={(e) => setAnnTime(e.target.value)} placeholder="10:00 AM – 4:00 PM" />
              </label>
              <label>
                Location
                <input type="text" value={annLocation} onChange={(e) => setAnnLocation(e.target.value)} placeholder="Sector 17 Plaza" />
              </label>
            </div>
            <div className="ann-form-actions">
              <button className="button primary small" type="submit" disabled={annBusy}>
                {annBusy ? "Saving…" : "Create announcement"}
              </button>
            </div>
            {annType === "event" && (
              <p className="ann-hint">Events are created as <strong>pending</strong> and must be approved before they appear publicly.</p>
            )}
          </form>
        )}

        {pendingAnnouncements.length > 0 && (
          <div className="ann-pending">
            <h4>⏳ Pending approval ({pendingAnnouncements.length})</h4>
            {pendingAnnouncements.map((a) => (
              <div className="ann-item" key={a._id}>
                <div className="ann-item-body">
                  <strong>{a.title}</strong>
                  <span>{a.message}{a.eventDate ? ` · ${new Date(a.eventDate).toLocaleDateString()}` : ""}</span>
                </div>
                <div className="ann-item-actions">
                  <button className="button primary small" type="button" onClick={() => handleAnnAction(a._id!, "approve")}>Approve</button>
                  <button className="button secondary small" type="button" onClick={() => handleAnnAction(a._id!, "reject")}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="ann-list">
          <h4>All announcements ({announcements.length})</h4>
          {announcements.length === 0 && <p className="status-note">No announcements yet.</p>}
          {announcements.map((a) => (
            <div className="ann-item" key={a._id}>
              <div className="ann-item-body">
                <strong>
                  {a.title}
                  <span className={`ann-status ${a.status}`}>{a.status}</span>
                </strong>
                <span>{a.message}{a.eventDate ? ` · ${new Date(a.eventDate).toLocaleDateString()}` : ""}</span>
              </div>
              <div className="ann-item-actions">
                {a.status !== "approved" && (
                  <button className="button primary small" type="button" onClick={() => handleAnnAction(a._id!, "approve")}>Approve</button>
                )}
                <button className="delete-btn" type="button" title="Delete" onClick={() => handleAnnAction(a._id!, "delete")}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="admin-controls">
        <div className="filter-bar" role="group" aria-label="Filter by status">
          {(["All", "Active", "In progress", "Resolved"] as const).map((f) => (
            <button
              key={f}
              className={`filter-chip${filter === f ? " active" : ""}`}
              type="button"
              onClick={() => { setFilter(f); setSearchText(""); }}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="admin-toolbar">
          <input
            className="filter-search"
            type="search"
            placeholder="Search category / sector…"
            value={searchText}
            onChange={(e) => { setSearchText(e.target.value); setFilter("All"); }}
            aria-label="Search incidents"
          />
          <span className="sort-label">Sort:</span>
          {(["priority", "reports", "updated"] as SortKey[]).map((k) => (
            <button
              key={k}
              className={`filter-chip${sortKey === k ? " active" : ""}`}
              type="button"
              onClick={() => setSortKey(k)}
            >
              {k === "priority" ? "⬆ Priority" : k === "reports" ? "📊 Reports" : "🕒 Newest"}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-layout">
        <div>
          {/* Real Leaflet Map */}
          <div style={{ height: "400px", marginBottom: "2rem", position: "relative" }}>
            <IncidentMap
              incidents={visibleIncidents}
              center={demoLocation}
              zoom={13}
            />
          </div>

          <div className="stats-breakdown clay-card">
            <h3>📊 Category breakdown</h3>
            {categoryStats.length === 0
              ? <p className="status-note">No data.</p>
              : <ol className="stats-list">
                  {categoryStats.map(([cat, cnt]) => (
                    <li key={cat} className="stats-row">
                      <span className="stats-label">{cat}</span>
                      <span className="stats-bar-track">
                        <span
                          className="stats-bar-fill"
                          style={{ "--w": `${Math.round((cnt / (categoryStats[0]?.[1] ?? 1)) * 100)}%` } as React.CSSProperties}
                        />
                      </span>
                      <span className="stats-count">{cnt}</span>
                    </li>
                  ))}
                </ol>
            }
          </div>
        </div>

        <aside className="incident-panel clay-card" aria-label="Incident list">
          <h3>📋 Incidents ({visibleIncidents.length})</h3>
          <div className="incident-list">
            {visibleIncidents.length === 0 && (
              <p className="status-note">No incidents match this filter.</p>
            )}
            {visibleIncidents.map((incident) => (
              <article className="incident-row admin-row" key={incident.incidentId}>
                <div className="incident-info">
                  <strong>{incident.category}</strong>
                  <span>{incident.sector} · {incident.reports} report{incident.reports !== 1 ? "s" : ""}</span>
                  <span className="incident-time">{relativeTime(incident.updated)}</span>
                </div>

                <div className="incident-actions">
                  <button
                    className={pillClass(incident.status)}
                    type="button"
                    onClick={() => handleStatusCycle(incident)}
                    disabled={cycling === incident.incidentId}
                    title="Click to advance status"
                  >
                    {cycling === incident.incidentId ? "…" : incident.status}
                  </button>

                  <div className="priority-editor" aria-label={`Priority: ${incident.priority}`}>
                    <button
                      className="prio-btn"
                      type="button"
                      onClick={() => handlePriorityChange(incident, -1)}
                      disabled={incident.priority <= 1 || adjusting === incident.incidentId}
                      title="Lower priority"
                    >−</button>
                    <span className={`prio-badge prio-${incident.priority}`} title="Priority">
                      P{incident.priority}
                    </span>
                    <button
                      className="prio-btn"
                      type="button"
                      onClick={() => handlePriorityChange(incident, 1)}
                      disabled={incident.priority >= 5 || adjusting === incident.incidentId}
                      title="Raise priority"
                    >+</button>
                  </div>

                  {deleteConfirm === incident.incidentId ? (
                    <span className="delete-confirm-row">
                      <button
                        className="delete-confirm-btn"
                        type="button"
                        onClick={() => handleDelete(incident.incidentId)}
                        disabled={deleting === incident.incidentId}
                      >
                        {deleting === incident.incidentId ? "…" : "Confirm delete"}
                      </button>
                      <button className="delete-cancel-btn" type="button" onClick={() => setDeleteConfirm(null)}>
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      className="delete-btn"
                      type="button"
                      onClick={() => setDeleteConfirm(incident.incidentId)}
                      title="Remove report"
                      aria-label={`Delete ${incident.category}`}
                    >🗑</button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
