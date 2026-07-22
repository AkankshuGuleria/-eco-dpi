// Shared types used across all pages

export type Page = "home" | "login" | "citizen" | "admin" | "demo";
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

export type AnnouncementType = "event" | "notice" | "alert" | "update";
export type AnnouncementStatus = "pending" | "approved" | "rejected";

export interface Announcement {
  _id?: string;
  title: string;
  message: string;
  type: AnnouncementType;
  status: AnnouncementStatus;
  eventDate?: string;
  eventTime?: string;
  location?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}
