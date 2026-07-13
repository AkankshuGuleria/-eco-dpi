import React from "react";
import { Incident } from "../types";

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

export function IncidentMiniCard({ incident }: { incident: Incident }) {
  const pillClass =
    incident.status === "Active"
      ? "status-pill active"
      : incident.status === "Resolved"
      ? "status-pill resolved"
      : "status-pill progress";

  return (
    <article className="clay-card-sm mini-incident">
      <span>{incident.incidentId}</span>
      <strong>{incident.category}</strong>
      <small>
        {incident.sector} &mdash;{" "}
        <span className={pillClass}>{incident.status}</span>
      </small>
    </article>
  );
}
