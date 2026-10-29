import React from "react";

interface FooterProps {
  navigate?: (page: "home" | "login" | "citizen" | "admin" | "demo" | "eco-learn" | "take-action" | "privacy") => void;
}

export function Footer({ navigate }: FooterProps) {
  return (
    <footer className="site-footer" aria-labelledby="footer-title">
      <div className="footer-inner shell">
        <div className="footer-brand">
          <div className="footer-brand-mark" aria-hidden="true" />
          <h3 id="footer-title">Eco-DPI</h3>
          <p>
            An environmental governance platform that helps citizens understand
            environmental policy, know what to do, report local issues, and
            (where supported) track the response.
          </p>
        </div>

        <div className="footer-links">
          <div className="footer-col">
            <h4>Platform</h4>
            <ul>
              <li><button type="button" className="footer-nav-link" onClick={() => navigate?.("home")}>Home</button></li>
              <li><button type="button" className="footer-nav-link" onClick={() => navigate?.("eco-learn")}>Eco-Learn</button></li>
              <li><button type="button" className="footer-nav-link" onClick={() => navigate?.("take-action")}>Take Action</button></li>
              <li><button type="button" className="footer-nav-link" onClick={() => navigate?.("citizen")}>Report an Issue</button></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            <ul>
              <li><button type="button" className="footer-nav-link" onClick={() => navigate?.("privacy")}>Privacy Notice</button></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Eco-DPI. All rights reserved. | <button type="button" className="footer-nav-link" onClick={() => navigate?.("privacy")}>Privacy Notice</button></p>
        </div>
      </div>
    </footer>
  );
}
