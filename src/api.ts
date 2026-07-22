import { Incident } from "./types";

const BASE = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

async function readJson<T>(res: Response, fallbackMessage: string): Promise<T> {
  const text = await res.text();
  if (!text) {
    throw new Error(fallbackMessage);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(text.startsWith("<") ? fallbackMessage : text);
  }
}

async function requestJson<T>(res: Response, fallbackMessage: string): Promise<T> {
  if (!res.ok) {
    const body = await readJson<{ error?: string }>(res, fallbackMessage);
    throw new Error(body.error || fallbackMessage);
  }

  return readJson<T>(res, fallbackMessage);
}

// Helper to get authorization headers
function getHeaders(): HeadersInit {
  const token = localStorage.getItem("eco-dpi-token");
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchIncidents(): Promise<Incident[]> {
  const res = await fetch(`${BASE}/incidents`);
  return requestJson<Incident[]>(res, "Failed to fetch incidents");
}

export async function createIncident(payload: {
  category: string;
  lat: number;
  lng: number;
  sector?: string;
}): Promise<{ merged: boolean; incident: Incident }> {
  const res = await fetch(`${BASE}/incidents`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return requestJson<{ merged: boolean; incident: Incident }>(res, "Failed to create incident");
}

export async function updateIncidentStatus(
  incidentId: string,
  status: "Active" | "In progress" | "Resolved"
): Promise<Incident> {
  const res = await fetch(`${BASE}/incidents/${incidentId}/status`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ status }),
  });
  return requestJson<Incident>(res, "Failed to update status");
}

export async function deleteIncident(incidentId: string): Promise<{ deleted: boolean }> {
  const res = await fetch(`${BASE}/incidents/${incidentId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return requestJson<{ deleted: boolean }>(res, "Failed to delete incident");
}

export async function updateIncidentPriority(
  incidentId: string,
  priority: number
): Promise<Incident> {
  const res = await fetch(`${BASE}/incidents/${incidentId}/priority`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ priority }),
  });
  return requestJson<Incident>(res, "Failed to update priority");
}

export async function checkHealth(): Promise<{ status: string; db: string }> {
  const res = await fetch(`${BASE}/health`);
  return requestJson<{ status: string; db: string }>(res, "Failed to check API health");
}

// Announcements / notifications

export async function fetchAnnouncements(): Promise<any[]> {
  const res = await fetch(`${BASE}/announcements`);
  return requestJson<any[]>(res, "Failed to fetch announcements");
}

export async function fetchAllAnnouncements(): Promise<any[]> {
  const res = await fetch(`${BASE}/announcements/all`, { headers: getHeaders() });
  return requestJson<any[]>(res, "Failed to fetch announcements");
}

export async function createAnnouncement(payload: {
  title: string;
  message: string;
  type?: "event" | "notice" | "alert" | "update";
  eventDate?: string;
  eventTime?: string;
  location?: string;
}): Promise<any> {
  const res = await fetch(`${BASE}/announcements`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return requestJson<any>(res, "Failed to create announcement");
}

export async function approveAnnouncement(id: string): Promise<any> {
  const res = await fetch(`${BASE}/announcements/${id}/approve`, {
    method: "PATCH",
    headers: getHeaders(),
  });
  return requestJson<any>(res, "Failed to approve announcement");
}

export async function rejectAnnouncement(id: string): Promise<any> {
  const res = await fetch(`${BASE}/announcements/${id}/reject`, {
    method: "PATCH",
    headers: getHeaders(),
  });
  return requestJson<any>(res, "Failed to reject announcement");
}

export async function deleteAnnouncement(id: string): Promise<{ deleted: boolean }> {
  const res = await fetch(`${BASE}/announcements/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return requestJson<{ deleted: boolean }>(res, "Failed to delete announcement");
}

// Authentication Calls

export async function registerWithPassword(email: string, password: string): Promise<any> {
  const res = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return requestJson<any>(res, "Registration failed");
}

export async function loginWithPassword(email: string, password: string): Promise<any> {
  const res = await fetch(`${BASE}/auth/login/password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return requestJson<any>(res, "Login failed");
}

export async function sendOtp(phone: string): Promise<{
  message: string;
  delivery: "sms" | "console";
  phone: string;
  devOtp?: string;
  devNote?: string;
}> {
  const res = await fetch(`${BASE}/auth/otp/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  return requestJson<{
    message: string;
    delivery: "sms" | "console";
    phone: string;
    devOtp?: string;
    devNote?: string;
  }>(res, "Failed to send OTP");
}

export async function verifyOtp(phone: string, otp: string): Promise<any> {
  const res = await fetch(`${BASE}/auth/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, otp }),
  });
  return requestJson<any>(res, "OTP verification failed");
}

export async function loginWithGoogleDirect(email: string, googleId: string, name?: string): Promise<any> {
  const res = await fetch(`${BASE}/auth/google/direct`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, googleId, name }),
  });
  return requestJson<any>(res, "Google Login failed");
}

export async function getCurrentUser(): Promise<any> {
  const res = await fetch(`${BASE}/auth/me`, {
    headers: getHeaders(),
  });
  return requestJson<any>(res, "Session invalid");
}
