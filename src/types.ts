// Shared types used across all pages

export type Page = "home" | "login" | "citizen" | "admin";
export type Role = "citizen" | "admin";
export type Status = "Active" | "In progress" | "Resolved";

export interface Incident {
  _id?: string;
  incidentId: string;
  category: string;
  sector: string;
  lat: number;
  lng: number;
  reports: number;
  priority: number;
  status: Status;
  updated: string;
}

export interface DeviceLocation {
  lat: number;
  lng: number;
  label: string;
}
