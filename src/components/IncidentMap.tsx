import React, { useEffect, useRef } from "react";
import { Incident } from "../types";

interface IncidentMapProps {
  incidents: Incident[];
  center: { lat: number; lng: number };
  zoom?: number;
  interactive?: boolean;
  onMarkerClick?: (incident: Incident) => void;
}

export function IncidentMap({
  incidents,
  center,
  zoom = 13,
  interactive = true,
  onMarkerClick,
}: IncidentMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapInstance = useRef<any>(null);
  const markersGroup = useRef<any>(null);

  useEffect(() => {
    // Dynamically load Leaflet CSS if it hasn't been loaded already
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    // Wait until window.L (Leaflet) is loaded
    const initMap = () => {
      const L = (window as any).L;
      if (!L) {
        setTimeout(initMap, 100);
        return;
      }

      // Initialize map instance if not already initialized
      if (!leafletMapInstance.current) {
        leafletMapInstance.current = L.map(mapRef.current, {
          zoomControl: interactive,
          dragging: interactive,
          scrollWheelZoom: interactive && false, // Disable scroll zoom by default for better page scrolling
          touchZoom: interactive,
        }).setView([center.lat, center.lng], zoom);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(leafletMapInstance.current);

        markersGroup.current = L.layerGroup().addTo(leafletMapInstance.current);
      } else {
        leafletMapInstance.current.setView([center.lat, center.lng], zoom);
      }

      // Clear old markers
      markersGroup.current.clearLayers();

      // Add user pin marker
      const userIcon = L.divIcon({
        className: "leaflet-user-marker",
        html: `<div style="background: #4285F4; width: 16px; height: 16px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      L.marker([center.lat, center.lng], { icon: userIcon })
        .addTo(markersGroup.current)
        .bindPopup("Your Location");

      // Add incident markers
      incidents.forEach((incident) => {
        // Color based on priority (1-5)
        const colors = ["#8a8a8a", "#34a853", "#fbbc05", "#e8711a", "#ea4335"];
        const color = colors[incident.priority - 1] || colors[0];
        
        const incidentIcon = L.divIcon({
          className: `leaflet-incident-marker prio-${incident.priority}`,
          html: `
            <div style="
              background: ${color};
              color: white;
              font-weight: bold;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              border: 2px solid white;
              box-shadow: 0 2px 5px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 11px;
              cursor: pointer;
            ">
              ${incident.reports}
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([incident.lat, incident.lng], { icon: incidentIcon })
          .addTo(markersGroup.current);

        // Bind popup info
        marker.bindPopup(`
          <div style="font-family: sans-serif; color: #222; min-width: 150px; padding: 0.2rem;">
            <h4 style="margin: 0 0 5px 0; color: ${color}; font-size: 14px;">${incident.category}</h4>
            <p style="margin: 0 0 5px 0; font-size: 12px;"><b>Sector:</b> ${incident.sector}</p>
            <p style="margin: 0 0 5px 0; font-size: 12px;"><b>Reports:</b> ${incident.reports} times</p>
            <p style="margin: 0 0 5px 0; font-size: 12px;"><b>Priority:</b> P${incident.priority}</p>
            <span style="
              display: inline-block;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: bold;
              background: ${incident.status === 'Resolved' ? '#d4edda' : incident.status === 'In progress' ? '#fff3cd' : '#f8d7da'};
              color: ${incident.status === 'Resolved' ? '#155724' : incident.status === 'In progress' ? '#856404' : '#721c24'};
            ">${incident.status}</span>
          </div>
        `);

        if (onMarkerClick) {
          marker.on("click", () => onMarkerClick(incident));
        }
      });
    };

    // Load leaflet script if not loaded, otherwise initialize map
    if (!(window as any).L) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = initMap;
      document.body.appendChild(script);
    } else {
      initMap();
    }

    return () => {
      // Properly tear down the Leaflet instance so remounts don't throw
      // "Map container is already initialized".
      if (leafletMapInstance.current) {
        try {
          leafletMapInstance.current.off();
          leafletMapInstance.current.remove();
        } catch {
          /* ignore teardown errors */
        }
        leafletMapInstance.current = null;
        markersGroup.current = null;
      }
    };
  }, [incidents, center, zoom, interactive, onMarkerClick]);

  return (
    <div
      ref={mapRef}
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
