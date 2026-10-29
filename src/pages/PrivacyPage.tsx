import React from "react";
import { Footer } from "../components/Footer";
import { Page } from "../types";
import { ArrowLeftIcon } from "../components/Icons";

interface PrivacyPageProps {
  navigate: (page: Page) => void;
}

export function PrivacyPage({ navigate }: PrivacyPageProps) {
  return (
    <>
      <section className="privacy-page shell" aria-labelledby="privacy-title">
        <div className="privacy-content clay-card">
          <p className="signal">Data and privacy</p>
          <h1 id="privacy-title">Privacy Notice</h1>
          <p className="privacy-date"><em>Last updated: October 2026</em></p>

          <p>
            This is a plain-language notice explaining what data Eco-DPI collects, why,
            who can see it, and how long it is kept. Please read it before submitting a report
            or granting location access.
          </p>

          <h2>What we collect</h2>
          <ul>
            <li>
              <strong>Location (GPS coordinates):</strong> When you submit a report, we collect
              the latitude and longitude of the reported issue. We request your device's GPS
              location only to place the report on the map accurately. You can deny permission
              — in that case a default demo location is used and labelled as such.
            </li>
            <li>
              <strong>Report category and description:</strong> The category of environmental
              issue you select (e.g. garbage dump, air pollution).
            </li>
            <li>
              <strong>Photos:</strong> If you attach a photo to a report. Currently, photo
              upload is available in the interface but file storage is not yet fully connected
              to the backend — this feature is labelled as in progress.
            </li>
            <li>
              <strong>Contact details (optional):</strong> If you register with an email address
              or phone number for login, we store that identifier to identify your account.
              Google sign-in stores your Google account email.
            </li>
          </ul>

          <h2>Why we collect it</h2>
          <ul>
            <li>Location and report category: to display the issue on a public map so administrators and other citizens can see where problems are reported.</li>
            <li>Contact details: to authenticate you and associate reports with your account so you can track your own submissions.</li>
          </ul>

          <h2>Who can see it</h2>
          <ul>
            <li><strong>Public map and dashboard:</strong> Report category, approximate location, and status are publicly visible. Personal details (name, email, phone number) are <strong>not</strong> shown on the public map or dashboard.</li>
            <li><strong>Administrators:</strong> Verified administrators can see all reports including their exact coordinates. They cannot see your personal contact details through the public interface.</li>
            <li><strong>We do not share your data</strong> with third parties for commercial purposes.</li>
          </ul>

          <h2>How long we keep it</h2>
          <p>
            Data retention periods have not yet been formally decided for this prototype.
            We will update this notice when a retention policy is confirmed. If you would like
            your data removed in the meantime, contact the administrator at the email shown
            in the project repository.
          </p>

          <h2>Location and camera permissions</h2>
          <p>
            We request your device location only when you submit a report. You will see a
            browser permission prompt before this happens. If you deny, the report can still
            be submitted using a default demo location. We do not access your camera — any
            photo you upload is selected by you from your device's files or camera roll.
          </p>

          <h2>Cookies and storage</h2>
          <p>
            We store a login token in your browser's <code>localStorage</code> to keep you
            logged in between sessions. We do not use advertising or tracking cookies.
          </p>

          <h2>Changes to this notice</h2>
          <p>
            If we change how we handle your data in a material way, we will update the date
            at the top of this notice.
          </p>

          <div className="privacy-back">
            <button type="button" className="button secondary" onClick={() => navigate("home")}>
              <ArrowLeftIcon size={18} />
              Back to home
            </button>
          </div>
        </div>
      </section>
      <Footer navigate={navigate} />
    </>
  );
}
