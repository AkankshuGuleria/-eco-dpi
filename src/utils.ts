import type React from "react";

// Shared utility functions
export function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const radius = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function getMarkerStyle(
  center: { lat: number; lng: number },
  incident: { lat: number; lng: number }
): React.CSSProperties {
  const latDelta = incident.lat - center.lat;
  const lngDelta = incident.lng - center.lng;
  const x = Math.min(86, Math.max(10, 50 + lngDelta * 850));
  const y = Math.min(86, Math.max(10, 50 - latDelta * 850));
  return { left: `${x}%`, top: `${y}%` };
}

export const demoLocation = { lat: 30.733315, lng: 76.779417, label: "Demo area" };

export const categories = [
  "Water logging",
  "Potholes",
  "Air quality spike",
  "Garbage dump",
  "Broken street light",
  "Sewage overflow",
];

// ── Two-level reporting taxonomy ──────────────────────────────────────────────
export type ReportType = "activity" | "complaint";

export const ACTIVITY_CATEGORIES = [
  "Environmental & Climate Action",
  "Social Welfare & Awareness",
  "Public Health & Safety",
] as const;
export type ActivityCategory = typeof ACTIVITY_CATEGORIES[number];

export const ACTIVITY_TYPES: Record<ActivityCategory, readonly string[]> = {
  "Environmental & Climate Action": [
    "Tree Plantation",
    "Plantation Drive",
    "Lake Cleanup",
    "Cleanup Drive",
    "E-Waste Collection Drive",
    "Plastic Collection",
    "Plastic-Free Campaign",
    "Water Conservation Drive",
    "Biodiversity Survey",
  ],
  "Social Welfare & Awareness": [
    "Drug Abuse Awareness",
    "Women Empowerment Workshop",
    "Literacy Drive",
    "Child Rights Awareness",
    "Road Safety Awareness",
    "Awareness Campaign",
    "Citizen Volunteer Drive",
  ],
  "Public Health & Safety": [
    "Blood Donation Camp",
    "Health Checkup Camp",
    "Vaccination Drive",
    "Mental Health Awareness",
    "Hygiene Awareness Campaign",
  ],
};

export const COMPLAINT_CATEGORIES = [
  "Civic Infrastructure Anomalies",
] as const;
export type ComplaintCategory = typeof COMPLAINT_CATEGORIES[number];

export const COMPLAINT_TYPES: Record<ComplaintCategory, readonly string[]> = {
  "Civic Infrastructure Anomalies": [
    // Utilities
    "Water Logging",
    "Sewage Overflow",
    "Water Supply Issue",
    "Electricity Issue",
    // Roads & Infrastructure
    "Potholes",
    "Broken Road",
    "Damaged Footpath",
    "Broken Streetlights",
    "Encroachment",
    // Sanitation
    "Garbage Dump",
    "Open Garbage",
    "Drain Blockage",
    "Public Toilet Issue",
    "Plastic Waste",
    // Environment
    "Air Pollution",
    "Water Pollution",
    "Noise Pollution",
    "Illegal Dumping",
    "Tree Damage",
  ],
};
