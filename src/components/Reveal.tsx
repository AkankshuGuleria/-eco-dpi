import React, { useEffect, useId, useState } from "react";
import { ChevronDownIcon } from "./Icons";

interface CollapsibleProps {
  title: string;
  children: React.ReactNode;
  /** Open by default on wide screens, closed on small screens. */
  defaultOpen?: boolean;
  className?: string;
}

/**
 * Progressive-disclosure block. Collapsed by default on phones so long
 * explainer pages stay scan-friendly. Fully keyboard accessible.
 */
export function Collapsible({ title, children, defaultOpen, className = "" }: CollapsibleProps) {
  const id = useId();
  const [open, setOpen] = useState(() => {
    if (defaultOpen !== undefined) return defaultOpen;
    if (typeof window === "undefined") return true;
    return window.matchMedia("(min-width: 768px)").matches;
  });

  // Follow the viewport only while the user has not touched the control.
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (touched) return;
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = (e: MediaQueryListEvent) => setOpen(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [touched]);

  return (
    <div className={`collapsible${open ? " is-open" : ""} ${className}`.trim()}>
      <button
        type="button"
        className="collapsible-trigger"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => {
          setTouched(true);
          setOpen((v) => !v);
        }}
      >
        <span>{title}</span>
        <ChevronDownIcon size={20} />
      </button>
      <div id={`${id}-panel`} className="collapsible-panel" hidden={!open}>
        {children}
      </div>
    </div>
  );
}

interface CappedListProps<T> {
  items: T[];
  limit?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Singular noun used in the "Show all N …" label. */
  noun?: string;
  className?: string;
  listClassName?: string;
}

/**
 * Renders at most `limit` items and reveals the rest on demand, so a busy
 * feed never pushes the rest of the page off-screen.
 */
export function CappedList<T>({
  items,
  limit = 5,
  renderItem,
  noun = "items",
  className = "",
  listClassName = "",
}: CappedListProps<T>) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? items : items.slice(0, limit);
  const hiddenCount = Math.max(0, items.length - limit);

  return (
    <div className={className}>
      <div className={listClassName}>{shown.map(renderItem)}</div>
      {hiddenCount > 0 && (
        <button
          type="button"
          className="button ghost small cap-list-toggle"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Show fewer" : `Show all ${items.length} ${noun}`}
        </button>
      )}
    </div>
  );
}
