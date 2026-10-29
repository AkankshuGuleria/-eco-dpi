import React, { useEffect, useRef } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Incident } from "../types";

interface IncidentMapProps {
  incidents: Incident[];
  center: { lat: number; lng: number };
  zoom?: number;
  interactive?: boolean;
  onMarkerClick?: (incident: Incident) => void;
}

const PRIORITY_COLORS = ["#8a8a8a", "#34a853", "#fbbc05", "#e8711a", "#ea4335"];

function createIncidentPopup(incident: Incident, color: string): HTMLElement {
  const content = document.createElement("div");
  content.style.cssText = "font-family:sans-serif;color:#222;min-width:150px;padding:0.2rem";

  const heading = document.createElement("h4");
  heading.textContent = incident.category;
  heading.style.cssText = `margin:0 0 5px;color:${color};font-size:14px`;
  content.append(heading);

  const addDetail = (label: string, value: string) => {
    const paragraph = document.createElement("p");
    paragraph.style.cssText = "margin:0 0 5px;font-size:12px";
    const strong = document.createElement("b");
    strong.textContent = `${label}:`;
    paragraph.append(strong, document.createTextNode(` ${value}`));
    content.append(paragraph);
  };

  addDetail("Sector", incident.sector);
  addDetail("Reports", `${incident.reports} times`);
  addDetail("Priority", `P${incident.priority}`);

  const status = document.createElement("span");
  status.textContent = incident.status;
  status.style.cssText = "display:inline-block;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:bold";
  if (incident.status === "Resolved") {
    status.style.backgroundColor = "#d4edda";
    status.style.color = "#155724";
  } else if (incident.status === "In progress") {
    status.style.backgroundColor = "#fff3cd";
    status.style.color = "#856404";
  } else {
    status.style.backgroundColor = "#f8d7da";
    status.style.color = "#721c24";
  }
  content.append(status);

  return content;
}

export function IncidentMap({
  incidents,
  center,
  zoom = 13,
  interactive = true,
  onMarkerClick,
}: IncidentMapProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersGroup = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    const container = mapElement.current;
    if (!container) return;

    const map = L.map(container, {
      zoomControl: interactive,
      dragging: interactive,
      scrollWheelZoom: false,
      touchZoom: interactive,
    }).setView([center.lat, center.lng], zoom);

    mapInstance.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    markersGroup.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapInstance.current = null;
      markersGroup.current = null;
    };
  }, [interactive]);

  useEffect(() => {
    mapInstance.current?.setView([center.lat, center.lng], zoom);
  }, [center.lat, center.lng, zoom]);

  useEffect(() => {
    const markers = markersGroup.current;
    if (!markers) return;
    markers.clearLayers();

    const userMarker = document.createElement("div");
    userMarker.style.cssText = "background:#4285F4;width:16px;height:16px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 10px rgba(0,0,0,0.5)";
    const userIcon = L.divIcon({
      className: "leaflet-user-marker",
      html: userMarker,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    L.marker([center.lat, center.lng], { icon: userIcon })
      .addTo(markers)
      .bindPopup("Your Location");

    incidents.forEach((incident) => {
      const color = PRIORITY_COLORS[incident.priority - 1] ?? PRIORITY_COLORS[0];
      const markerElement = document.createElement("div");
      markerElement.textContent = String(incident.reports);
      markerElement.style.cssText = `background:${color};color:white;font-weight:bold;width:24px;height:24px;border-radius:50%;border:2px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:11px;cursor:pointer`;

      const incidentIcon = L.divIcon({
        className: `leaflet-incident-marker prio-${incident.priority}`,
        html: markerElement,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      const marker = L.marker([incident.lat, incident.lng], { icon: incidentIcon })
        .addTo(markers)
        .bindPopup(createIncidentPopup(incident, color));

      if (onMarkerClick) {
        marker.on("click", () => onMarkerClick(incident));
      }
    });
  }, [incidents, center.lat, center.lng, onMarkerClick]);

  return (
    <div
      ref={mapElement}
      style={{
        width: "100%",
        height: "100%",
        minHeight: "350px",
        borderRadius: "16px",
        border: "1px solid rgba(255,255,255,0.1)",
        zIndex: 1,
      }}
    />
  );
}
