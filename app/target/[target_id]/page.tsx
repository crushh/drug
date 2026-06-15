"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

const PRIMARY_COLOR = "#0090B5";

type TargetGeneral = {
  target_id: string;
  external_id: string | null;
  name: string;
  description: string | null;
};

type RelatedDrug = {
  drug_id: string;
  drug_name: string;
  type: string | null;
  status: string | null;
  ligand_name: string | null;
  chelator_name: string | null;
  radionuclide_name: string | null;
};

type TargetDetail = {
  general?: TargetGeneral;
  related_drugs?: RelatedDrug[];
};

export default function TargetDetailPage({
  params,
}: {
  params: { target_id: string };
}) {
  const targetId = useMemo(() => params.target_id, [params]);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<TargetDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openGeneral, setOpenGeneral] = useState(true);
  const [openRelated, setOpenRelated] = useState(true);
  const [hoveredDrug, setHoveredDrug] = useState<RelatedDrug | null>(null);
  const [hoveredTarget, setHoveredTarget] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setError(null);
      setLoading(true);
      setDetail(null);
      try {
        const res = await fetch(`/api/target/${encodeURIComponent(targetId)}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.message || `HTTP ${res.status}`);
        }
        const data = (await res.json()) as TargetDetail;
        if (!cancelled) setDetail(data);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (targetId) run();
    return () => {
      cancelled = true;
    };
  }, [targetId]);

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const g = detail?.general;
  const relatedDrugs = useMemo(() => detail?.related_drugs ?? [], [detail?.related_drugs]);

  // Generate positions for drugs in a circle
  const drugPositions = useMemo(() => {
    if (relatedDrugs.length === 0) return [];
    const radius = 180;
    const centerX = 250;
    const centerY = 250;
    return relatedDrugs.map((drug, index) => {
      const angle = (index / relatedDrugs.length) * 2 * Math.PI - Math.PI / 2;
      return {
        ...drug,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        angle,
      };
    });
  }, [relatedDrugs]);

  const tooltipStyle: CSSProperties = {
    position: "fixed",
    left: mousePos.x + 15,
    top: mousePos.y + 15,
    background: "#fff",
    border: "2px solid #1F2937",
    borderRadius: 8,
    padding: 12,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    zIndex: 1000,
    minWidth: 200,
    pointerEvents: "none",
  };

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ margin: "0 0 16px 0", fontSize: 24, fontWeight: 700 }}>
        Target: {g?.name || targetId}
      </h1>

      {error && <p style={{ color: "#b91c1c" }}>Error: {error}</p>}
      {loading && <p>Loading…</p>}

      {!loading && !error && g && (
        <>
          {/* General Information */}
          <div
            style={{
              marginTop: 16,
              background: "#F8FAFC",
              border: `1px solid ${PRIMARY_COLOR}`,
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            <div
              onClick={() => setOpenGeneral((v) => !v)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 12px",
                background: PRIMARY_COLOR,
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <span>General Information of This Target</span>
              <span style={{ fontSize: 16 }}>{openGeneral ? "▾" : "▸"}</span>
            </div>
            {openGeneral && (
              <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse", background: "#fff" }}>
                <tbody>
                  {[
                    ["target_id", g.target_id],
                    ["external_id", g.external_id ?? "-"],
                    ["name", g.name],
                    ["description", g.description ?? "-"],
                  ].map(([label, value], i, arr) => (
                    <tr
                      key={label as string}
                      style={{
                        borderBottom: i === arr.length - 1 ? undefined : "1px solid #e2e8f0",
                      }}
                    >
                      <td
                        style={{
                          width: 220,
                          padding: "10px 12px",
                          background: "#f1f5f9",
                          fontWeight: 600,
                          color: "#0f172a",
                          verticalAlign: "top",
                        }}
                      >
                        {label}
                      </td>
                      <td
                        style={{
                          padding: "10px 12px",
                          color: "#0f172a",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {value as string}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Related RDCs Visualization */}
          {relatedDrugs.length > 0 && (
            <div
              style={{
                marginTop: 16,
                background: "#F8FAFC",
                border: `1px solid ${PRIMARY_COLOR}`,
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              <div
                onClick={() => setOpenRelated((v) => !v)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 12px",
                  background: PRIMARY_COLOR,
                  color: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <span>Related RDCs ({relatedDrugs.length})</span>
                <span style={{ fontSize: 16 }}>{openRelated ? "▾" : "▸"}</span>
              </div>
              {openRelated && (
                <div style={{ padding: 24, background: "#fff", display: "flex", justifyContent: "center" }}>
                  <svg width={500} height={500} onMouseMove={handleMouseMove}>
                    {/* Lines to drugs - gray */}
                    {drugPositions.map((drug, index) => (
                      <line
                        key={`line-${index}`}
                        x1={250}
                        y1={250}
                        x2={drug.x}
                        y2={drug.y}
                        stroke="#9ca3af"
                        strokeWidth={1}
                      />
                    ))}

                    {/* Drug circles - white with #C2C0D9 border, smaller */}
                    {drugPositions.map((drug, index) => {
                      // Calculate rotation angle in degrees (convert from radians)
                      let rotationAngle = (drug.angle * 180) / Math.PI;
                      // Determine text anchor and rotation adjustment based on position
                      const isRightSide = Math.cos(drug.angle) >= 0;
                      // For left side, flip the text so it reads outward
                      if (!isRightSide) {
                        rotationAngle += 180;
                      }
                      return (
                        <g key={`drug-${index}`}>
                          <circle
                            cx={drug.x}
                            cy={drug.y}
                            r={5}
                            fill="#ffffff"
                            stroke="#C2C0D9"
                            strokeWidth={2}
                            style={{ cursor: "pointer" }}
                            onMouseEnter={() => setHoveredDrug(drug)}
                            onMouseLeave={() => setHoveredDrug(null)}
                            onClick={() => window.open(`/rdc/${drug.drug_id}`, "_blank")}
                          />
                          <text
                            x={drug.x}
                            y={drug.y}
                            textAnchor={isRightSide ? "start" : "end"}
                            dominantBaseline="middle"
                            fill="#1F2937"
                            fontSize={8}
                            fontWeight={600}
                            transform={`rotate(${rotationAngle}, ${drug.x}, ${drug.y}) translate(${isRightSide ? 8 : -8}, 0)`}
                            style={{ pointerEvents: "none" }}
                          >
                            {drug.drug_id}
                          </text>
                        </g>
                      );
                    })}

                    {/* Invisible center area for hover - no visual display */}
                    <circle
                      cx={250}
                      cy={250}
                      r={40}
                      fill="transparent"
                      stroke="none"
                      style={{ cursor: "pointer" }}
                      onMouseEnter={() => setHoveredTarget(true)}
                      onMouseLeave={() => setHoveredTarget(false)}
                    />
                  </svg>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Drug Tooltip */}
      {hoveredDrug && (
        <div style={tooltipStyle}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: "#0f172a" }}>
            {hoveredDrug.drug_name}
          </div>
          <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
            <div><strong>ID:</strong> {hoveredDrug.drug_id}</div>
            <div><strong>Name:</strong> {hoveredDrug.drug_name}</div>
            <div><strong>Type:</strong> {hoveredDrug.type ?? "-"}</div>
            <div><strong>Status:</strong> {hoveredDrug.status ?? "-"}</div>
            <div><strong>Ligand:</strong> {hoveredDrug.ligand_name ?? "-"}</div>
            <div><strong>Chelator:</strong> {hoveredDrug.chelator_name ?? "-"}</div>
            <div><strong>Radionuclide:</strong> {hoveredDrug.radionuclide_name ?? "-"}</div>
          </div>
        </div>
      )}

      {/* Target Tooltip */}
      {hoveredTarget && g && (
        <div style={tooltipStyle}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: "#0f172a" }}>
            {g.name}
          </div>
          <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
            <div><strong>Target ID:</strong> {g.target_id}</div>
            <div><strong>External ID:</strong> {g.external_id ?? "-"}</div>
            <div><strong>Name:</strong> {g.name}</div>
            <div><strong>Description:</strong> {g.description ?? "-"}</div>
          </div>
        </div>
      )}
    </main>
  );
}
