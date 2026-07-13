import { Incident } from "./types";

const BASE = "http://localhost:4000/api";

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
  if (!res.ok) throw new Error("Failed to fetch incidents");
  return res.json();
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
  if (!res.ok) throw new Error("Failed to create incident");
  return res.json();
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
  if (!res.ok) throw new Error("Failed to update status");
  return res.json();
}

export async function deleteIncident(incidentId: string): Promise<{ deleted: boolean }> {
  const res = await fetch(`${BASE}/incidents/${incidentId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete incident");
  return res.json();
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
  if (!res.ok) throw new Error("Failed to update priority");
  return res.json();
}

export async function checkHealth(): Promise<{ status: string; db: string }> {
  const res = await fetch(`${BASE}/health`);
  return res.json();
}

// Authentication Calls

export async function registerWithPassword(email: string, password: string): Promise<any> {
  const res = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Registration failed");
  }
  return res.json();
}

export async function loginWithPassword(email: string, password: string): Promise<any> {
  const res = await fetch(`${BASE}/auth/login/password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Login failed");
  }
  return res.json();
}

export async function sendOtp(phone: string): Promise<any> {
  const res = await fetch(`${BASE}/auth/otp/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to send OTP");
  }
  return res.json();
}

export async function verifyOtp(phone: string, otp: string): Promise<any> {
  const res = await fetch(`${BASE}/auth/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, otp }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "OTP verification failed");
  }
  return res.json();
}

export async function loginWithGoogleDirect(email: string, googleId: string, name?: string): Promise<any> {
  const res = await fetch(`${BASE}/auth/google/direct`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, googleId, name }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Google Login failed");
  }
  return res.json();
}

export async function getCurrentUser(): Promise<any> {
  const res = await fetch(`${BASE}/auth/me`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error("Session invalid");
  return res.json();
}
