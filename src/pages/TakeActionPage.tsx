import React from "react";
import { Footer } from "../components/Footer";
import { Page } from "../types";
import { Collapsible } from "../components/Reveal";
import "../styles/take-action.css";

interface TakeActionPageProps {
  navigate: (page: Page) => void;
}

interface GuideProps {
  id: string;
  number: string;
  title: string;
  intro: string;
  steps: string[];
  officialLinks?: { label: string; url: string }[];
  reportCategory?: string;
  reportLabel?: string;
  note?: string;
  navigate: (page: Page) => void;
  onReport?: () => void;
}

function ActionGuide({ id, number, title, intro, steps, officialLinks, reportCategory, reportLabel, note, navigate, onReport }: GuideProps) {
  return (
    <article id={id} className="action-guide clay-card" aria-labelledby={`${id}-title`}>
      <header className="action-guide-header">
        <span className="action-guide-number" aria-hidden="true">{number}</span>
        <h2 id={`${id}-title`} className="action-guide-title">{title}</h2>
      </header>

      <p className="action-guide-intro">{intro}</p>

      {note && (
        <div className="action-note" role="note">
          <strong>Note:</strong> {note}
        </div>
      )}

      <Collapsible title={`Steps (${steps.length})`} className="action-steps-block">
        <ol className="action-steps" aria-label="Steps">
          {steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </Collapsible>

      {officialLinks && officialLinks.length > 0 && (
        <div className="action-official-links">
          <h3>Relevant official portals</h3>
          <ul>
            {officialLinks.map((link) => (
              <li key={link.url}>
                <a href={link.url} target="_blank" rel="noopener noreferrer">{link.label}</a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {reportLabel && (
        <button
          type="button"
          className="button primary action-report-btn"
          onClick={onReport ?? (() => navigate("citizen"))}
          style={{ minHeight: 44 }}
        >
          {reportLabel}
        </button>
      )}
    </article>
  );
}

export function TakeActionPage({ navigate }: TakeActionPageProps) {
  // Navigate to citizen page. Query-param pre-selection is not supported in the current
  // SPA setup (no URL routing), so we navigate to the citizen page and the user can
  // select the category there.
  function goReport() {
    navigate("citizen");
  }

  return (
    <>
      <section className="take-action-page shell" aria-labelledby="take-action-title">
        <header className="take-action-header">
          <p className="signal">Practical guides</p>
          <h1 id="take-action-title">Take Action: What You Can Do</h1>
          <p className="take-action-intro">
            Three practical guides to help you act on environmental issues in your area.
            Complaint mechanisms and responsible authorities vary by location — always check
            your local municipal body or State Pollution Control Board.
          </p>
          <div className="take-action-disclaimer" role="note">
            <strong>Important:</strong> Complaint mechanisms, timelines and responsible authorities vary by city
            and state. This guide cannot promise a specific outcome or response time. Use official
            channels and contact your local body directly if in doubt.
          </div>
        </header>

        <ActionGuide
          id="guide-garbage"
          number="01"
          title="How to complain about garbage dumping in your neighbourhood"
          intro="Persistent illegal dumping or irregular waste collection can be reported to your local municipal authority. Here is how to do it."
          note="Complaint mechanisms vary by location. Check your local municipal body (Municipal Corporation, Nagar Panchayat, etc.) for the specific procedure in your area."
          steps={[
            "Identify and document the problem: note the location (address or landmark), take photos if safe to do so, and note roughly how long the issue has persisted.",
            "Find your local municipal body: search online for your city's Municipal Corporation or Nagar Panchayat. Most have a public grievance or complaint portal.",
            "Submit your complaint: use the official portal, helpline, or in-person office. Include location details, photos if accepted, and a brief description.",
            "Note your complaint reference number: keep this for follow-up.",
            "Follow up: if there is no response within a reasonable time, contact the local body again using your reference number.",
            "If the local body is unresponsive: escalate to your State Pollution Control Board for environment-related dumping issues.",
          ]}
          officialLinks={[
            {
              label: "CPCB: Centralised Solid Waste Management Portal",
              url: "https://www.swm.cpcb.gov.in/",
            },
          ]}
          reportLabel="Also report it here on Eco-DPI"
          navigate={navigate}
          onReport={goReport}
        />

        <ActionGuide
          id="guide-segregate"
          number="02"
          title="How to segregate waste at home"
          intro="India's Solid Waste Management Rules, 2026 require waste segregation at source into four streams. Here is what each stream means and how to keep them separate."
          steps={[
            "Wet waste (green bin): kitchen and food waste — vegetable peels, cooked food, tea leaves, fruit scraps. This is compostable organic waste.",
            "Dry waste (blue bin): clean paper, cardboard, plastic bottles, glass, metal cans, tetra packs, old newspapers. Rinse plastic and glass before placing in this stream.",
            "Sanitary waste (yellow or separate bag): diapers, sanitary napkins, razors, bandages, cotton swabs. Wrap securely in newspaper or a sealed bag.",
            "Special-care waste (separate): household hazardous items such as batteries, electronics (e-waste), medicines, paint tins, chemicals. Do not mix with other streams. Check for local e-waste or hazardous-waste collection drives in your area.",
            "Use clearly labelled bins at home for each stream so every household member can participate.",
            "Hand waste to the designated municipal collection vehicle and follow your local body's schedule.",
          ]}
          note="Your local body may use slightly different colour coding or labels. Follow their instructions if they differ from the above."
          officialLinks={[
            {
              label: "PIB: New Solid Waste Management Rules, 2026",
              url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2219676&lang=1&reg=3",
            },
          ]}
          navigate={navigate}
        />

        <ActionGuide
          id="guide-air"
          number="03"
          title="Possible channels to report a local air-pollution issue"
          intro="If you observe recurring waste burning, industrial smoke, construction dust or other air-pollution problems in your area, here are possible ways to report."
          note="Check what is actually available in your state and city. Not all channels listed below are operational in every location. We have only listed channels we can verify exist as official portals."
          steps={[
            "Document the issue: note the location, approximate time, source of pollution (e.g. waste burning, construction site, vehicle), and take photos if safe.",
            "Check the PRANA portal: the CPCB's PRANA portal covers 131 non-attainment cities under the National Clean Air Programme. Check if your city is covered and whether a complaint channel is available.",
            "Contact your State Pollution Control Board (SPCB): each state has an SPCB or Pollution Control Committee. Find yours via the CPCB website and check for a public complaint mechanism.",
            "Contact your local municipal body: for localised issues such as waste burning or dust from construction, your municipal corporation may be the first point of contact.",
            "For persistent or serious industrial pollution: contact your SPCB directly. For very serious issues, the National Green Tribunal (NGT) accepts applications from citizens.",
            "Keep records of all complaints submitted including dates and reference numbers.",
          ]}
          officialLinks={[
            {
              label: "PRANA: Portal for Regulation of Air-pollution in Non-Attainment Cities (CPCB)",
              url: "https://prana.cpcb.gov.in/",
            },
            {
              label: "CPCB: Central Pollution Control Board",
              url: "https://cpcb.nic.in/",
            },
          ]}
          reportLabel="Also report it here on Eco-DPI"
          navigate={navigate}
          onReport={goReport}
        />
      </section>
      <Footer navigate={navigate} />
    </>
  );
}
