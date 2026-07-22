import React, { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import { Page, Incident, DeviceLocation } from "./types";
import { fetchIncidents, createIncident, checkHealth, getCurrentUser, fetchAnnouncements } from "./api";
import { demoLocation } from "./utils";

import { AnimatedBackground, Header } from "./components/Header";
import { HomePage }          from "./pages/HomePage";
import { LoginPage }         from "./pages/LoginPage";
import { CitizenDashboard }  from "./pages/CitizenPage";
import { AdminDashboard }    from "./pages/AdminPage";
import { DemoPage }          from "./pages/DemoPage";
import { Preloader }         from "./components/Preloader";
import { ParticleField }     from "./components/ParticleField";
import { Cursor }            from "./components/Cursor";
import { PageTransition }    from "./components/PageTransition";
import { useSmoothScroll, useScrollReveal } from "./hooks/useMotion";

import "./styles/globals.css";
import "./styles/motion.css";

function App() {
  const [page, setPage]               = useState<Page>("home");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn]   = useState(false);
  const [deviceLocation, setDeviceLocation] = useState<DeviceLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState("Location permission is required to show nearby reports.");
  const [incidents, setIncidents]     = useState<Incident[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [dbConnected, setDbConnected] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  
  const [showPreloader, setShowPreloader] = useState(
    () => !sessionStorage.getItem("eco-dpi-loaded")
  );

  useSmoothScroll();
  useScrollReveal();

  // Try to load current user on mount (auto-login if token exists)
  useEffect(() => {
    async function checkUserSession() {
      const token = localStorage.getItem("eco-dpi-token");
      if (token) {
        try {
          const res = await getCurrentUser();
          if (res.user) {
            setCurrentUser(res.user);
            setIsLoggedIn(true);
          } else {
            localStorage.removeItem("eco-dpi-token");
          }
        } catch {
          localStorage.removeItem("eco-dpi-token");
        }
      }
    }
    checkUserSession();
  }, [page]);

  // Check backend health + load incidents on mount
  useEffect(() => {
    async function init() {
      try {
        const health = await checkHealth();
        setDbConnected(health.db === "connected");
      } catch {
        setDbConnected(false);
      }

      try {
        const data = await fetchIncidents();
        setIncidents(data);
      } catch {
        console.warn("[eco-dpi] Backend unreachable — no incidents loaded.");
      }

      try {
        const ann = await fetchAnnouncements();
        setAnnouncements(ann);
      } catch {
        console.warn("[eco-dpi] Backend unreachable — no announcements loaded.");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Poll incidents + announcements every 30 s when page is visible
  useEffect(() => {
    if (!dbConnected) return;
    const id = setInterval(async () => {
      try {
        const data = await fetchIncidents();
        setIncidents(data);
      } catch { /* silent */ }
      try {
        const ann = await fetchAnnouncements();
        setAnnouncements(ann);
      } catch { /* silent */ }
    }, 30_000);
    return () => clearInterval(id);
  }, [dbConnected]);

  const isAdmin = currentUser?.role === "admin" || (currentUser?.email && currentUser.email.toLowerCase() === "akankshuguleria2000@gmail.com");

  // Navigate guard helper
  function navigate(nextPage: Page) {
    // If navigating to citizen page and not logged in, redirect to login
    if (nextPage === "citizen" && !localStorage.getItem("eco-dpi-token")) {
      setPage("login");
    } else {
      setPage(nextPage);
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function handlePreloaderDone() {
    sessionStorage.setItem("eco-dpi-loaded", "1");
    setShowPreloader(false);
  }

  // Handle location request on demand during login submission
  const requestLocation = (callback: () => void) => {
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation is not supported by your browser.");
      callback(); // Continue anyway (graceful fallback)
      return;
    }

    setLoginLoading(true);
    setLocationStatus("Requesting device location…");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDeviceLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: "Your device location"
        });
        setLocationStatus("Location connected successfully.");
        setLoginLoading(false);
        callback();
      },
      () => {
        setLoginLoading(false);
        setLocationStatus("Permission denied. Demo location will be used.");
        callback(); // Fallback to demo area
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleLoginSuccess = (token: string, user: any) => {
    localStorage.setItem("eco-dpi-token", token);
    setCurrentUser(user);
    setIsLoggedIn(true);

    const isAdmin = user.role === "admin" || (user.email && user.email.toLowerCase() === "akankshuguleria2000@gmail.com");
    navigate(isAdmin ? "admin" : "citizen");
  };

  const handleLogout = () => {
    localStorage.removeItem("eco-dpi-token");
    setCurrentUser(null);
    setIsLoggedIn(false);
    navigate("home");
  };

  const addIncident = useCallback(
    async (category: string, location?: DeviceLocation) => {
      const loc = location ?? deviceLocation ?? demoLocation;
      try {
        const { incident } = await createIncident({
          category,
          lat: loc.lat,
          lng: loc.lng,
          sector: loc.label === "Your device location" ? "Near you" : "Sector 22"
        });
        setIncidents(await fetchIncidents());
        return incident;
      } catch (err: any) {
        // Fallback optimistic update if offline or failed (use a temporary client id)
        setIncidents((cur) => [
          {
            incidentId: `LOCAL-${Date.now()}`,
            category,
            sector: loc.label === "Your device location" ? "Near you" : "Sector 22",
            lat: loc.lat,
            lng: loc.lng,
            reports: 1,
            priority: 1,
            status: "Active",
            updated: "just now",
          },
          ...cur,
        ]);
        throw err;
      }
    },
    [deviceLocation],
  );

  return (
    <div className="site">
      {showPreloader && <Preloader onComplete={handlePreloaderDone} />}
      <Cursor />
      <ParticleField />
      <AnimatedBackground />
      <a className="skip-link" href="#main">Skip to main content</a>
      <Header page={page} navigate={navigate} isAdmin={isAdmin} />

      <main id="main">
        <PageTransition pageKey={page}>
          {page === "home" && (
            <HomePage
              navigate={navigate}
              incidents={incidents}
              addIncident={addIncident}
              isLoggedIn={isLoggedIn}
              deviceLocation={deviceLocation}
              loading={loading}
              announcements={announcements}
            />
          )}

          {page === "login" && (
            <LoginPage
              onLoginSuccess={handleLoginSuccess}
              locationStatus={locationStatus}
              loading={loginLoading}
              onRequestLocation={requestLocation}
            />
          )}

          {page === "citizen" && (
            <CitizenDashboard
              currentUser={currentUser}
              incidents={incidents}
              addIncident={addIncident}
              navigate={navigate}
              deviceLocation={deviceLocation}
              setDeviceLocation={setDeviceLocation}
              dbConnected={dbConnected}
              onLogout={handleLogout}
            />
          )}

          {page === "admin" && (
            <AdminDashboard
              currentUser={currentUser}
              incidents={incidents}
              setIncidents={setIncidents}
              navigate={navigate}
              onLogout={handleLogout}
              announcements={announcements}
              setAnnouncements={setAnnouncements}
            />
          )}

          {page === "demo" && (
            <DemoPage navigate={navigate} />
          )}
        </PageTransition>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
