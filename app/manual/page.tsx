"use client";

import { useState } from "react";
import { manualSections } from "./manual-data";

const PRIMARY_COLOR = "#0090B5";

export default function ManualPage() {
  const [openStates, setOpenStates] = useState<boolean[]>(
    manualSections.map(() => false)
  );

  const toggle = (idx: number) => {
    setOpenStates((prev) => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  };

  return (
    <main style={{ padding: 24 }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24, color: PRIMARY_COLOR }}>
          Manual
        </h1>

        {manualSections.map((section, idx) => (
          <section key={idx} style={{ marginBottom: 20 }}>
            <div
              onClick={() => toggle(idx)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                background: PRIMARY_COLOR,
                color: "#fff",
                fontWeight: 700,
                fontSize: 16,
                cursor: "pointer",
                borderRadius: 8,
              }}
            >
              <span>{section.title}</span>
              <span style={{ fontSize: 18 }}>{openStates[idx] ? "▾" : "▸"}</span>
            </div>
            {openStates[idx] && (
              <div
                style={{
                  padding: 16,
                  border: `1px solid ${PRIMARY_COLOR}`,
                  borderTop: "none",
                  borderRadius: "0 0 8px 8px",
                  lineHeight: 1.8,
                  color: "#374151",
                }}
                dangerouslySetInnerHTML={{ __html: section.content }}
              />
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
