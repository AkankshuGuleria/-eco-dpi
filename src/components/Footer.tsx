import React from "react";

export function Footer() {
  return (
    <footer className="site-footer" aria-labelledby="footer-title">
      <div className="footer-inner shell">
        <div className="footer-brand">
          <div className="footer-brand-mark" aria-hidden="true" />
          <h3 id="footer-title">Eco-DPI</h3>
          <p>Environmental public infrastructure for citizens and administrators.</p>
        </div>

        <div className="footer-links">
          <div className="footer-col">
            <h4>Platform</h4>
            <ul>
              <li><a href="#home">Home</a></li>
              <li><a href="#reports">Reports</a></li>
              <li><a href="#login">Login</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Contact</h4>
            <ul>
              <li><a href="mailto:hello@eco-dpi.app">hello@eco-dpi.app</a></li>
              <li><a href="tel:+911234567890">+91 12345 67890</a></li>
              <li><span>Sector 22, Chandigarh</span></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            <ul>
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#terms">Terms of Service</a></li>
              <li><a href="#cookies">Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Eco-DPI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
