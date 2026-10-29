import React, { useState, useRef } from "react";
import { Footer } from "../components/Footer";
import { Page } from "../types";
import { CheckIcon, CopyIcon } from "../components/Icons";
import { Collapsible } from "../components/Reveal";
import "../styles/eco-learn.css";

interface EcoLearnPageProps {
  navigate: (page: Page) => void;
}

// ── Copy-to-clipboard helper (with execCommand fallback) ──────────────────────
async function copyToClipboard(text: string): Promise<"ok" | "fallback" | "fail"> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return "ok";
    } catch {
      /* fall through */
    }
  }
  // execCommand fallback for insecure contexts / older browsers / iOS
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:absolute;left:-9999px;top:-9999px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok ? "fallback" : "fail";
  } catch {
    return "fail";
  }
}

// ── CopyButton component ──────────────────────────────────────────────────────
function CopyButton({ getText, label }: { getText: () => string; label: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "fail">("idle");
  const liveRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  async function handleCopy() {
    const result = await copyToClipboard(getText());
    clearTimeout(timerRef.current);
    if (result === "fail") {
      setStatus("fail");
      if (liveRef.current) liveRef.current.textContent = "Copy failed — please select the text manually.";
    } else {
      setStatus("copied");
      if (liveRef.current) liveRef.current.textContent = "Copied to clipboard!";
      timerRef.current = setTimeout(() => {
        setStatus("idle");
        if (liveRef.current) liveRef.current.textContent = "";
      }, 2000);
    }
  }

  return (
    <div className="copy-btn-wrap">
      <button
        type="button"
        className={`copy-btn${status === "copied" ? " copied" : status === "fail" ? " fail" : ""}`}
        onClick={handleCopy}
        aria-label={`Copy ${label} to clipboard`}
        style={{ minWidth: 120, minHeight: 44 }}
      >
        {status === "copied" ? (
          <><CheckIcon size={16} /> Copied</>
        ) : status === "fail" ? (
          "Copy failed"
        ) : (
          <><CopyIcon size={16} /> Copy text</>
        )}
      </button>
      <span
        ref={liveRef}
        aria-live="polite"
        className="visually-hidden"
        role="status"
      />
      {status === "fail" && (
        <p className="copy-fail-msg" role="alert">
          Copy failed — please select and copy the text manually.
        </p>
      )}
    </div>
  );
}

// ── Explainer card ────────────────────────────────────────────────────────────
interface Source {
  label: string;
  url: string;
}

interface ExplainerProps {
  id: string;
  title: string;
  subtitle: string;
  problem: string;
  policy: string;
  responsibility: string;
  whatYouCanDo: string[];
  takeaway: string;
  sources: Source[];
  actionLabel?: string;
  actionCategory?: string;
  navigate: (page: Page) => void;
}

function buildPlainText(props: ExplainerProps): string {
  const lines: string[] = [];
  lines.push(props.title);
  lines.push(props.subtitle);
  lines.push("");
  lines.push("THE PROBLEM");
  lines.push(props.problem);
  lines.push("");
  lines.push("WHAT DOES THE POLICY SAY?");
  lines.push(props.policy);
  lines.push("");
  lines.push("WHO IS RESPONSIBLE?");
  lines.push(props.responsibility);
  lines.push("");
  lines.push("WHAT CAN YOU DO?");
  props.whatYouCanDo.forEach((item) => lines.push(`• ${item}`));
  lines.push("");
  lines.push(`THE TAKEAWAY: ${props.takeaway}`);
  lines.push("");
  lines.push("OFFICIAL SOURCES");
  props.sources.forEach((s) => lines.push(`• ${s.label} — ${s.url}`));
  return lines.join("\n");
}

function ExplainerCard(props: ExplainerProps) {
  const cardRef = useRef<HTMLElement>(null);

  return (
    <article id={props.id} ref={cardRef} className="explainer-card clay-card" aria-labelledby={`${props.id}-title`}>
      <header className="explainer-header">
        <div>
          <p className="signal">{props.subtitle}</p>
          <h2 id={`${props.id}-title`} className="explainer-title">{props.title}</h2>
        </div>
        <CopyButton getText={() => buildPlainText(props)} label={props.title} />
      </header>

      <Collapsible title="Read the full explainer" defaultOpen={false} className="explainer-details">
        <div className="explainer-body">
          <section className="explainer-section" aria-label="The problem">
            <h3>The problem</h3>
            <p>{props.problem}</p>
          </section>

          <section className="explainer-section" aria-label="What the policy says">
            <h3>What does the policy say?</h3>
            <p>{props.policy}</p>
          </section>

          <section className="explainer-section" aria-label="Who is responsible">
            <h3>Who is responsible?</h3>
            <p>{props.responsibility}</p>
          </section>

          <section className="explainer-section" aria-label="What you can do">
            <h3>What can you do?</h3>
            <ul className="explainer-list">
              {props.whatYouCanDo.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
            {props.actionLabel && (
              <button
                type="button"
                className="button secondary small explainer-action-link"
                onClick={() => props.navigate("take-action")}
              >
                {props.actionLabel}
              </button>
            )}
          </section>

          <section className="explainer-takeaway" aria-label="Takeaway">
            <p><strong>The takeaway:</strong> {props.takeaway}</p>
          </section>

          <section className="explainer-sources" aria-label="Official sources">
            <h3>Official sources</h3>
            <ul>
              {props.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </Collapsible>
    </article>
  );
}

// ── Page component ────────────────────────────────────────────────────────────
export function EcoLearnPage({ navigate }: EcoLearnPageProps) {
  return (
    <>
      <section className="eco-learn-page shell" aria-labelledby="eco-learn-title">
        <header className="eco-learn-header">
          <p className="signal">Policy explainers</p>
          <h1 id="eco-learn-title">Eco-Learn: Understanding Environmental Policy</h1>
          <p className="eco-learn-intro">
            Three plain-language explainers on India's key environmental policies — what they say,
            who is responsible, and what you can do. Each card can be copied in one click for sharing.
          </p>
        </header>

        <ExplainerCard
          id="explainer-waste"
          title="WHERE DOES OUR WASTE GO?"
          subtitle="The policy: Solid Waste Management Rules, 2026"
          problem="Our garbage does not disappear when it leaves our homes. Poor segregation, irregular collection and unsafe dumping can pollute our surroundings and make waste harder to process."
          policy="India's Solid Waste Management Rules, 2026, came into force on 1 April 2026. They mandate segregation of solid waste at source into four streams: wet waste, dry waste, sanitary waste and special-care waste. The rules also define responsibilities for local bodies and other waste generators, with provisions for environmentally sound collection, transportation and processing."
          responsibility="Citizens must segregate waste as required. Local bodies have responsibilities for waste collection, segregation and transportation. The wider system must ensure that different waste streams are handled and processed appropriately."
          whatYouCanDo={[
            "Keep different waste streams separate.",
            "Follow your local body's waste-collection instructions.",
            "Report persistent dumping or irregular collection to the appropriate local authority.",
          ]}
          takeaway="Waste management begins at home, but it succeeds only when citizens and public systems work together."
          sources={[
            {
              label: "PIB: New Solid Waste Management Rules, 2026",
              url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2219676&lang=1&reg=3",
            },
            {
              label: "CPCB: Centralised Solid Waste Management Portal",
              url: "https://www.swm.cpcb.gov.in/",
            },
          ]}
          actionLabel="See how to report a garbage dumping issue"
          actionCategory="garbage"
          navigate={navigate}
        />

        <ExplainerCard
          id="explainer-air"
          title="WHO IS RESPONSIBLE FOR THE AIR WE BREATHE?"
          subtitle="The programme: National Clean Air Programme (NCAP)"
          problem="Air pollution can come from several sources, including road dust, vehicles, industries, construction and waste burning. Tackling it requires coordinated action rather than relying on individuals alone."
          policy="Launched in 2019, India's National Clean Air Programme supports air-pollution mitigation in 130 cities through coordinated action by governments, urban local bodies and other stakeholders. According to a PIB update published on 7 September 2026, 108 cities recorded lower annual PM10 concentrations in FY 2025–26 compared with 2017–18. Of these, 72 recorded reductions exceeding 20%. These figures measure changes in PM10 and do not mean that all air pollution has been eliminated."
          responsibility="Government agencies and local bodies implement city-specific clean-air action plans. Citizens can contribute by following pollution-control guidance and reporting persistent local problems through appropriate channels."
          whatYouCanDo={[
            "Check official air-quality information.",
            "Report recurring waste burning or dust problems to the relevant authority.",
            "Support cleaner transport and responsible waste management.",
          ]}
          takeaway="Clean air needs evidence-based policy, effective implementation and public participation."
          sources={[
            {
              label: "PIB: India's Path to Blue Skies, September 2026",
              url: "https://www.pib.gov.in/PressNoteDetails.aspx?ModuleId=3&NoteId=159871&id=159871&lang=2&reg=48",
            },
            {
              label: "PRANA: Portal for Regulation of Air-pollution in Non-Attainment Cities",
              url: "https://prana.cpcb.gov.in/",
            },
          ]}
          actionLabel="See channels to report a local air-pollution issue"
          actionCategory="air"
          navigate={navigate}
        />

        <ExplainerCard
          id="explainer-plastic"
          title="WHO IS RESPONSIBLE FOR PLASTIC WASTE?"
          subtitle="The policy: Plastic Waste Management Rules and Extended Producer Responsibility (EPR)"
          problem="Plastic packaging can become a source of pollution when it is littered or not properly collected and processed. Consumers play a role, but responsibility cannot stop with the person who throws something away."
          policy="India's Plastic Waste Management Rules establish a regulatory framework for plastic waste. The Extended Producer Responsibility framework places specified obligations on producers, importers and brand owners for managing plastic packaging waste. These obligations include applicable recycling targets and requirements relating to recycled content."
          responsibility="Consumers should dispose of plastic responsibly. Local systems must support collection and appropriate processing, while regulated producers, importers and brand owners must fulfil their applicable EPR obligations."
          whatYouCanDo={[
            "Avoid unnecessary plastic where practical.",
            "Separate recyclable plastic from wet waste.",
            "Use appropriate collection and recycling channels.",
            "Report persistent plastic dumping to the relevant local authority.",
          ]}
          takeaway="Plastic pollution needs responsible consumers, effective collection systems and producer accountability."
          sources={[
            {
              label: "PIB: Circular Economy Framework and Extended Producer Responsibility, March 2026",
              url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2244104&lang=1&reg=1",
            },
            {
              label: "MoEFCC: Rules and Regulations",
              url: "https://moef.gov.in/rules-regulations-3",
            },
          ]}
          actionLabel="Report a plastic dumping issue"
          actionCategory="plastic"
          navigate={navigate}
        />
      </section>
      <Footer navigate={navigate} />
    </>
  );
}
