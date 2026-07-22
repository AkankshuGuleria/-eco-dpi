"use client";

import React from "react";
import { Incident } from "../types";
import { categories } from "../utils";

interface ActiveRequestsGraph3DProps {
  incidents: Incident[];
}

export function ActiveRequestsGraph3D({ incidents }: ActiveRequestsGraph3DProps) {
  const activeIncidents = incidents.filter((i) => i.status !== "Resolved");
  
  const categoryCounts = categories.map((cat) => {
    const count = activeIncidents.filter((i) => i.category === cat).length;
    return { category: cat, count };
  }).filter((item) => item.count > 0);

  const maxCount = Math.max(...categoryCounts.map((c) => c.count), 1);

  return (
    <section className="graph-section shell" aria-label="Active requests by category">
      <div className="graph-header">
        <p className="signal">Live overview</p>
        <h2>Active requests by category</h2>
      </div>

      <div className="graph-scene">
        <div className="graph-floor" aria-hidden="true" />
        <div className="graph-bars">
          {categoryCounts.map((item, idx) => {
            const heightPct = (item.count / maxCount) * 100;
            const hue = 140 + idx * 18;
            return (
              <div
                key={item.category}
                className="graph-bar-wrap"
                style={{ "--delay": `${idx * 0.08}s` } as React.CSSProperties}
              >
                <div
                  className="graph-bar"
                  style={
                    {
                      "--h": `${heightPct}%`,
                      "--hue": `${hue}deg`,
                      "--count": item.count,
                    } as React.CSSProperties
                  }
                >
                  <div className="graph-bar-face graph-bar-front" />
                  <div className="graph-bar-face graph-bar-top" />
                  <div className="graph-bar-face graph-bar-side" />
                </div>
                <span className="graph-bar-label">{item.category}</span>
                <span className="graph-bar-count">{item.count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
