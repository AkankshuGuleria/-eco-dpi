import React, { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import { Page, Incident, DeviceLocation, AppUser } from "./types";
import {
  fetchIncidents,
  fetchAdminIncidents,
  createIncident,
  checkHealth,
  getCurrentUser,
  fetchAnnouncements,
  ApiError,
} from "./api";
import { demoLocation } from "./utils";
import { pageFromPath, pathForPage, PUBLIC_PAGES, safeNextPath } from "./routing";

import { AnimatedBackground, Header } from "./components/Header";
import { HomePage }          from "./pages/HomePage";
import { LoginPage }         from "./pages/LoginPage";
import { SignupPage }        from "./pages/SignupPage";
import { AdminLoginPage }    from "./pages/AdminLoginPage";
import { CitizenDashboard }  from "./pages/CitizenPage";
import { AdminDashboard }    from "./pages/AdminPage";
import { DemoPage }          from "./pages/DemoPage";
import { EcoLearnPage }      from "./pages/EcoLearnPage";
import { TakeActionPage }    from "./pages/TakeActionPage";
import { PrivacyPage }       from "./pages/PrivacyPage";
import { Preloader }         from "./components/Preloader";
import { ParticleField }     from "./components/ParticleField";
import { Cursor }            from "./components/Cursor";
import { PageTransition }    from "./components/PageTransition";
import { useSmoothScroll, useScrollReveal } from "./hooks/useMotion";

import "./styles/globals.css";
import "./styles/motion.css";

const TOKEN_KEY = "eco-dpi-token";

function App() {
  const [page, setPage]               = useState<Page>(() =>
    typeof window === "undefined" ? "home" : pageFromPath(window.location.pathname)
  );
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isLoggedIn, setIsLoggedIn]   = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [deviceLocation, setDeviceLocation] = useState<DeviceLocation | null>(null);
  const [, setLocationStatus] = useState("Location permission is required to show nearby reports.");
  const [incidents, setIncidents]     = useState<Incident[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [dbConnected, setDbConnected] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPreloader, setShowPreloader] = useState(true);

  useSmoothScroll();
  useScrollReveal(page);

  /* ── Session bootstrap + revalidation ────────────────────────────────── */
  const loadSession = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setCurrentUser(null);
      setIsLoggedIn(false);
      setAuthChecked(true);
      return;
    }
    try {
      const res = await getCurrentUser();
      if (res?.user) {
        setCurrentUser(res.user);
        setIsLoggedIn(true);
      } else {
        localStorage.removeItem(TOKEN_KEY);
        setCurrentUser(null);
        setIsLoggedIn(false);
      }
    } catch (err) {
      // Only drop the session when the server rejects the token. A network
      // outage should not silently sign the user out.
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        localStorage.removeItem(TOKEN_KEY);
        setCurrentUser(null);
        setIsLoggedIn(false);
      }
    } finally {
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  /* ── Back/forward buttons ────────────────────────────────────────────── */
  useEffect(() => {
    const onPop = () => {
      setPage(pageFromPath(window.location.pathname));
      window.scrollTo({ top: 0, behavior: "auto" });
    };
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) loadSession();
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [loadSession]);

  /* ── Health + data bootstrap ─────────────────────────────────────────── */
  useEffect(() => {
    if (!authChecked) return;
    let active = true;

    async function init() {
      setLoading(true);
      try {
        const health = await checkHealth();
        if (active) setDbConnected(health.db === "connected");
      } catch (err) {
        if (active) setDbConnected(false);
        console.warn("[eco-dpi] Backend health check failed.", err);
      }

      try {
        const loadIncidents = currentUser?.role === "admin" ? fetchAdminIncidents : fetchIncidents;
        const data = await loadIncidents();
        if (active) setIncidents(data);
      } catch (err) {
        console.warn("[eco-dpi] Backend unreachable — no incidents loaded.", err);
      }

      try {
        const data = await fetchAnnouncements();
        if (active) setAnnouncements(data);
      } catch (err) {
        console.warn("[eco-dpi] Backend unreachable — no announcements loaded.", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    void init();
    return () => {
      active = false;
    };
  }, [authChecked, currentUser?.role]);

  /* ── Poll incidents + announcements every 30 s ───────────────────────── */
  useEffect(() => {
    if (!dbConnected) return;
    const id = setInterval(async () => {
      try {
        const loadIncidents = currentUser?.role === "admin" ? fetchAdminIncidents : fetchIncidents;
        setIncidents(await loadIncidents());
      } catch (err) {
        console.warn("[eco-dpi] Failed to refresh incidents.", err);
      }
      try {
        setAnnouncements(await fetchAnnouncements());
      } catch (err) {
        console.warn("[eco-dpi] Failed to refresh announcements.", err);
      }
    }, 30_000);
    return () => clearInterval(id);
  }, [dbConnected, currentUser?.role]);

  /* ── Route guard (UX only — every protected API re-checks the role) ─── */
  const redirectToAuth = useCallback((target: Page) => {
    const dest: Page = target === "admin" ? "admin-login" : "login";
    const next = `?next=${encodeURIComponent(pathForPage(target))}`;
    window.history.replaceState({ page: dest }, "", pathForPage(dest) + next);
    setPage(dest);
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    if (page === "admin" && !currentUser) {
      redirectToAuth("admin");
      return;
    }
    if (!PUBLIC_PAGES.includes(page) && !currentUser) {
      redirectToAuth(page);
    }
  }, [authChecked, currentUser, page, redirectToAuth]);

  const isAdmin = currentUser?.role === "admin";

  /* ── Navigation ──────────────────────────────────────────────────────── */
  const navigate = useCallback(
    (target: Page) => {
      if (!PUBLIC_PAGES.includes(target) && !currentUser) {
        redirectToAuth(target);
        window.scrollTo({ top: 0, behavior: "auto" });
        return;
      }

      window.history.pushState({ page: target }, "", pathForPage(target));
      setPage(target);
      window.scrollTo({ top: 0, behavior: "auto" });
    },
    [currentUser, redirectToAuth]
  );

  const handlePreloaderDone = useCallback(() => {
    setShowPreloader(false);
  }, []);

  /* ── Location ────────────────────────────────────────────────────────── */
  const requestLocation = (callback: () => void) => {
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation is not supported by this browser.");
      callback();
      return;
    }

    setLoginLoading(true);
    setLocationStatus("Requesting device location…");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDeviceLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: "Your device location",
        });
        setLocationStatus("Location connected successfully.");
        setLoginLoading(false);
        callback();
      },
      () => {
        setLoginLoading(false);
        setLocationStatus("Permission denied. Demo location will be used.");
        callback();
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  /* ── Auth handlers ───────────────────────────────────────────────────── */
  const handleLoginSuccess = useCallback((token: string, user: AppUser) => {
    localStorage.setItem(TOKEN_KEY, token);
    setCurrentUser(user);
    setIsLoggedIn(true);
    setAuthChecked(true);

    const next = safeNextPath(new URLSearchParams(window.location.search).get("next"));
    const authPages: Page[] = ["login", "signup", "admin-login"];

    let dest: Page;
    if (next && !authPages.includes(next)) {
      dest = next;
    } else {
      dest = user.role === "admin" ? "admin" : "citizen";
    }

    // A citizen must never land on the admin dashboard.
    if (dest === "admin" && user.role !== "admin") dest = "citizen";

    window.history.replaceState({ page: dest }, "", pathForPage(dest));
    setPage(dest);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setCurrentUser(null);
    setIsLoggedIn(false);
    window.history.replaceState({ page: "home" }, "", pathForPage("home"));
    setPage("home");
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

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
      <Header
        page={page}
        navigate={navigate}
        isAdmin={isAdmin}
        isLoggedIn={isLoggedIn}
        user={currentUser}
        onLogout={handleLogout}
      />

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
              navigate={navigate}
              onLoginSuccess={handleLoginSuccess}
              locationStatus={undefined}
              loading={loginLoading}
              onRequestLocation={requestLocation}
            />
          )}

          {page === "signup" && (
            <SignupPage navigate={navigate} onLoginSuccess={handleLoginSuccess} />
          )}

          {page === "admin-login" && (
            <AdminLoginPage navigate={navigate} onLoginSuccess={handleLoginSuccess} />
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

          {page === "eco-learn" && (
            <EcoLearnPage navigate={navigate} />
          )}

          {page === "take-action" && (
            <TakeActionPage navigate={navigate} />
          )}

          {page === "privacy" && (
            <PrivacyPage navigate={navigate} />
          )}
        </PageTransition>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
