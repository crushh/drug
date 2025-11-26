"use client";

import { useEffect, useMemo } from "react";
import type { CSSProperties, ReactNode } from "react";

export type HumanActivity = {
  clinical_trial_number: string | null;
  indication: string | null;
  patients: string | null;
  dosage: string | null;
  frequency: string | null;
  results_description: string | null;
  purpose: string | null;
  clinical_endpoint: string | null;
  endpoint_period: string | null;
  efficacy_description: string | null;
  adverse_events_summary: string | null;
  security_indicators: string | null;
};

export type BiodistributionEntry = {
  biodist_type: string | null;
  animal_model: string | null;
  dosage_symbols: string | null;
  dosage_value: number | null;
  dosage_unit: string | null;
  metabolism: string | null;
  excretion: string | null;
  detection_time: string | null;
  tumor_retention_time: string | null;
  tbr?: Record<string, number | null | undefined>;
  biodist_result_image: string | null;
  biodist_description: string | null;
};

export type AnimalStudy = {
  study_id: string;
  pmid: string | null;
  doi: string | null;
  pk: Array<{
    pk_animal_model: string | null;
    pk_dosage_symbols: string | null;
    pk_dosage_value: number | null;
    pk_dosage_unit: string | null;
    half_life: string | null;
    half_life_value?: number | null;
    half_life_unit?: string | null;
    pk_result?: string | null;
    pk_image?: string | null;
    pk_description: string | null;
  }>;
  biodistribution: BiodistributionEntry[];
  efficacy: Array<{
    efficacy_animal_model: string | null;
    efficacy_dosage_symbols: string | null;
    efficacy_dosage_value: number | null;
    efficacy_dosage_unit: string | null;
    efficacy_description: string | null;
    adverse_reactions: string | null;
  }>;
};

export type AnimalInVivo = {
  studies: AnimalStudy[];
};

export type InVitro = Record<string, unknown> & {
  studies?: Array<{ in_vitro_id: string; study_overview: string | null }>;
};

const tableHeaderStyle: CSSProperties = {
  textAlign: "left",
  padding: "8px 10px",
  borderBottom: "1px solid #d4d4d8",
  fontWeight: 700,
  color: "#0f172a",
  fontSize: 14,
  background: "#f8fafc",
};

const tableCellStyle: CSSProperties = {
  padding: "8px 10px",
  borderTop: "1px solid #e5e7eb",
  color: "#0f172a",
  fontSize: 14,
};

export function renderValue(value: ReactNode) {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string") {
    return value.trim().length > 0 ? value : "-";
  }
  return value;
}

export function formatDosage(symbols: string | null, value: number | string | null, unit: string | null) {
  const symbolPart = typeof symbols === "string" ? symbols.trim() : "";
  const valuePart =
    value === null || value === undefined
      ? ""
      : typeof value === "number"
        ? Number.isFinite(value)
          ? `${value}`
          : ""
        : value.toString().trim();
  const unitPart = typeof unit === "string" ? unit.trim() : "";
  const combined = `${symbolPart}${valuePart}${unitPart}`.trim();
  return combined.length > 0 ? combined : "-";
}

const TBR_LABELS: Record<string, string> = {
  tumor_blood: "肿瘤/血液 T/B",
  tumor_muscle: "肿瘤/肌肉 T/B",
  tumor_kidney: "肿瘤/肾脏 T/B",
  tumor_salivary_glands: "肿瘤/唾液腺 T/B",
  tumor_liver: "肿瘤/肝脏 T/B",
  tumor_lung: "肿瘤/肺部 T/B",
  tumor_heart: "肿瘤/心脏 T/B",
};

export type DetectionTbrRow = {
  detection_time: string | null;
  tbr: Record<string, number | null | undefined>;
};

export type BiodistGroup = {
  shared: Omit<BiodistributionEntry, "detection_time" | "tbr">;
  detectionRows: DetectionTbrRow[];
};

function DetectionTbrTable({ rows }: { rows: DetectionTbrRow[] }) {
  if (rows.length === 0) return null;
  const tbrKeys = Object.keys(TBR_LABELS) as Array<keyof typeof TBR_LABELS>;
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 6, overflowX: "auto" }}>
      <div
        style={{
          padding: "8px 10px",
          color: "#0f172a",
          fontWeight: 700,
          background: "#f8fafc",
          borderBottom: "1px solid #d4d4d8",
        }}
      >
        Detection time & Tumor-to-background ratios (T/B)
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={tableHeaderStyle}>Detection time</th>
            {tbrKeys.map((key) => (
              <th key={key} style={tableHeaderStyle}>
                {TBR_LABELS[key]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={`${row.detection_time ?? "na"}-${idx}`} style={{ background: idx % 2 === 0 ? "#fff" : "#f8fafc" }}>
              <td style={{ ...tableCellStyle, borderBottom: "1px solid #e5e7eb" }}>{renderValue(row.detection_time)}</td>
              {tbrKeys.map((key) => (
                <td key={key} style={{ ...tableCellStyle, borderBottom: "1px solid #e5e7eb" }}>
                  {renderValue((row.tbr ?? {})[key] ?? null)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function groupBiodistributionRows(rows: BiodistributionEntry[]): BiodistGroup[] {
  const map = new Map<string, BiodistGroup>();
  for (const row of rows) {
    const { detection_time, tbr, ...rest } = row;
    const shared = rest;
    const key = JSON.stringify(shared);
    if (!map.has(key)) {
      map.set(key, { shared, detectionRows: [] });
    }
    map.get(key)!.detectionRows.push({
      detection_time: detection_time ?? null,
      tbr: tbr ?? {},
    });
  }
  return Array.from(map.values());
}

export function HumanActivitySection({
  items,
  open,
  onToggle,
  openItems,
  onToggleItem,
}: {
  items: HumanActivity[];
  open: boolean;
  onToggle: () => void;
  openItems: Record<number, boolean>;
  onToggleItem: (idx: number) => void;
}) {
  return (
    <section
      style={{
        marginTop: 16,
        background: "#F8FAFC",
        border: "1px solid #2aa3a3",
        borderRadius: 6,
        overflow: "hidden",
      }}
    >
      <div
        onClick={onToggle}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 12px",
          background: "#bcecec",
          color: "#0f3f3f",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>{open ? "▾" : "▸"}</span>
          <span>详细活性数据 - 人体活性数据</span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 600 }}>
          Click To Hide/Show <span style={{ fontWeight: 800 }}>{items.length}</span> Activity Data Related to This Level
        </span>
      </div>

      {open && (
        <div style={{ display: "grid" }}>
          {items.map((row, idx) => (
            <div key={idx} style={{ background: "#fff", borderRadius: 4, padding: 10, display: "grid", gap: 10 }}>
              <div
                onClick={() => onToggleItem(idx)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                  padding: "6px 8px",
                  borderRadius: 4,
                  background: "#f8fafc",
                  border: "1px solid #e5e7eb",
                  color: "#0f172a",
                }}
              >
                <div style={{ fontWeight: 700, color: "#008b8b", fontSize: 14 }}>Experiment {idx + 1} Reporting the Activity Data of This RDC</div>
                <div style={{ color: "#008b8b", fontWeight: 600, fontSize: 14 }}>[{idx + 1}] {openItems[idx] ?? true ? "▾" : "▸"}</div>
              </div>

              {(openItems[idx] ?? true) && (
                <div style={{ border: "1px solid #cbd5e1", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", background: "#f1f5f9", borderBottom: "1px solid #cbd5e1" }}>
                    <div style={{ padding: "10px 12px", color: "#0f172a", fontWeight: 700, fontSize: 14 }}>incication</div>
                    <div style={{ padding: "10px 12px", color: "#0f172a", fontSize: 14 }}>{renderValue(row.indication)}</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", background: "#fff", borderBottom: "1px solid #cbd5e1" }}>
                    <div style={{ padding: "10px 12px", color: "#0f172a", fontWeight: 700, fontSize: 14 }}>Patients</div>
                    <div style={{ padding: "10px 12px", color: "#0f172a", fontSize: 14 }}>{renderValue(row.patients)}</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 180px 1fr", background: "#f8fafc", borderBottom: "1px solid #cbd5e1" }}>
                    <div style={{ padding: "10px 12px", color: "#0f172a", fontWeight: 700, fontSize: 14, borderRight: "1px solid #cbd5e1" }}>dosage</div>
                    <div style={{ padding: "10px 12px", color: "#0f172a", fontSize: 14, borderRight: "1px solid #cbd5e1" }}>{renderValue(row.dosage)}</div>
                    <div style={{ padding: "10px 12px", color: "#0f172a", fontWeight: 700, fontSize: 14, borderRight: "1px solid #cbd5e1" }}>Frequency</div>
                    <div style={{ padding: "10px 12px", color: "#0f172a", fontSize: 14 }}>{renderValue(row.frequency)}</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 180px 1fr", padding: "10px 12px", background: "#fff", borderBottom: "1px solid #cbd5e1", color: "#0f172a", fontWeight: 700, fontSize: 14 }}>
                    Realted clinical Trial
                  </div>
                  {[
                    ["clinical Number", row.clinical_trial_number],
                    ["Results-Description", row.results_description],
                    ["Purpose", row.purpose],
                    ["clinical endpoint", row.clinical_endpoint],
                    ["Endpoint indicator period", row.endpoint_period],
                    ["Description of efficacy", row.efficacy_description],
                    ["Adverse events", row.adverse_events_summary],
                    ["security indication", row.security_indicators],
                  ].map(([label, value], i) => (
                    <div
                      key={label}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "220px 1fr",
                        background: i % 2 === 0 ? "#f8fafc" : "#fff",
                        borderBottom: i === 7 ? "none" : "1px solid #cbd5e1",
                      }}
                    >
                      <div style={{ padding: "10px 12px", color: "#0f172a", fontWeight: 700, fontSize: 14 }}>{label}</div>
                      <div style={{ padding: "10px 12px", color: "#0f172a", lineHeight: 1.5, fontSize: 14 }}>{renderValue(value as any)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {items.length === 0 && <div style={{ color: "#64748b", padding: 10 }}>No human activity data.</div>}
        </div>
      )}
    </section>
  );
}

export function AnimalSection({
  animal,
  open,
  onToggle,
  openBiodistItems,
  onToggleBiodistItem,
}: {
  animal?: AnimalInVivo;
  open: boolean;
  onToggle: () => void;
  openBiodistItems: Record<number, boolean>;
  onToggleBiodistItem: (idx: number) => void;
}) {
  const biodistRecords = useMemo(
    () => (animal?.studies ?? []).flatMap((s) => s.biodistribution ?? []),
    [animal?.studies]
  );
  console.log('animal', animal);
  const biodistGroups = useMemo(() => groupBiodistributionRows(biodistRecords), [biodistRecords]);

  return (
    <section
      style={{
        marginTop: 16,
        background: "#F8FAFC",
        border: "1px solid #2aa3a3",
        borderRadius: 6,
        overflow: "hidden",
      }}
    >
      <div
        onClick={onToggle}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 12px",
          background: "#bcecec",
          color: "#0f3f3f",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>{open ? "▾" : "▸"}</span>
          <span>动物活性数据</span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 600 }}>
          Click To Hide/Show Activity Data Related to This Level
        </span>
      </div>

      {open && (
        <div style={{ display: "grid", gap: 14, marginTop: 12 }}>
          <div style={{ background: "#fff", borderRadius: 4, overflowX: "auto" }}>
            <div style={{ padding: "8px 10px", fontWeight: 700, color: "#0f172a", background: "#f1f5f9", borderBottom: "1px solid #cbd5e1" }}>Related Biological Distribution</div>
            <div style={{ padding: 10, display: "grid", gap: 10 }}>
              {biodistGroups.map((group, idx) => {
                const shared = group.shared;
                const dosage = formatDosage(shared.dosage_symbols, shared.dosage_value, shared.dosage_unit);
                return (
                  <div key={idx} style={{ border: "1px solid #e5e7eb", borderRadius: 6, display: "grid", gap: 10, background: "#fff" }}>
                    <div
                      onClick={() => onToggleBiodistItem(idx)}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: "6px 8px", borderRadius: 4, background: "#f8fafc", border: "1px solid #e5e7eb" }}
                    >
                      <div style={{ fontWeight: 700, color: "#008b8b" }}>Experiment {idx + 1} Reporting the Activity Data of This RDC</div>
                      <div style={{ color: "#008b8b", fontWeight: 600 }}>[{idx + 1}] {openBiodistItems[idx] ?? true ? "▾" : "▸"}</div>
                    </div>

                    {(openBiodistItems[idx] ?? true) && (
                      <>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <tbody>
                            {[
                              ["Biological Distribution_Type", renderValue(shared.biodist_type)],
                              ["Animal model", renderValue(shared.animal_model)],
                              ["Dosage", renderValue(dosage)],
                              ["Metabolism", renderValue(shared.metabolism)],
                              ["Excretion", renderValue(shared.excretion)],
                              ["Tumor retention time", renderValue(shared.tumor_retention_time)],
                              ["Biodist result image", renderValue(shared.biodist_result_image)],
                              ["Biodist description", renderValue(shared.biodist_description)],
                            ].map(([label, value], i, arr) => (
                              <tr key={label}>
                                <td style={{ padding: "8px 10px", borderTop: i === 0 ? "1px solid #d4d4d8" : "1px solid #e5e7eb", borderBottom: i === arr.length - 1 ? "1px solid #d4d4d8" : "1px solid #e5e7eb", width: "26%", fontWeight: 700, color: "#0f172a", background: "#f8fafc", fontSize: 14 }}>
                                  {label}
                                </td>
                                <td style={{ padding: "8px 10px", borderTop: i === 0 ? "1px solid #d4d4d8" : "1px solid #e5e7eb", borderBottom: i === arr.length - 1 ? "1px solid #d4d4d8" : "1px solid #e5e7eb", color: "#0f172a", lineHeight: 1.5 }}>
                                  {value as any}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        <div style={{ border: "1px solid #e5e7eb", borderRadius: 6, overflow: "hidden" }}>
                          <DetectionTbrTable rows={group.detectionRows} />
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
              {biodistGroups.length === 0 && <div style={{ color: "#64748b", padding: 8 }}>No biodistribution data.</div>}
            </div>
          </div>

          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6 }}>
            <div style={{ padding: "8px 10px", fontWeight: 700, color: "#0f172a", background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>Related Efficacy</div>
            <div style={{ padding: 10, display: "grid", gap: 10 }}>
              {(animal?.studies ?? []).flatMap((s) => s.efficacy ?? []).map((row, idx) => {
                const dosage = formatDosage(row.efficacy_dosage_symbols, row.efficacy_dosage_value, row.efficacy_dosage_unit);
                return (
                  <div key={idx} style={{ border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <tbody>
                        {[
                          ["Animal model", renderValue(row.efficacy_animal_model)],
                          ["Dosage", dosage],
                          ["Description of efficacy", renderValue(row.efficacy_description)],
                          ["Adverse reactions", renderValue(row.adverse_reactions)],
                        ].map(([label, value], i, arr) => (
                          <tr key={label}>
                            <td style={{ padding: "8px 10px", borderTop: i === 0 ? "1px solid #d4d4d8" : "1px solid #e5e7eb", borderBottom: i === arr.length - 1 ? "1px solid #d4d4d8" : "1px solid #e5e7eb", width: "26%", fontWeight: 700, color: "#0f172a", background: "#f8fafc", fontSize: 14 }}>
                              {label}
                            </td>
                            <td style={{ padding: "8px 10px", borderTop: i === 0 ? "1px solid #d4d4d8" : "1px solid #e5e7eb", borderBottom: i === arr.length - 1 ? "1px solid #d4d4d8" : "1px solid #e5e7eb", color: "#0f172a", lineHeight: 1.5, fontSize: 14 }}>
                              {value as any}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
              {(!animal || (animal.studies ?? []).every((s) => (s.efficacy ?? []).length === 0)) && (
                <div style={{ color: "#64748b", padding: 8 }}>No efficacy data.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export function InVitroSection({
  data,
  open,
  onToggle,
}: {
  data?: InVitro;
  open: boolean;
  onToggle: () => void;
}) {
  const lowerKeyMap = useMemo(
    () => Object.fromEntries(Object.entries(data ?? {}).map(([k, v]) => [k.toLowerCase(), v])),
    [data]
  );

  const partitionRows = useMemo(() => {
    const v = (lowerKeyMap as any)?.partition_coefficient;
    return Array.isArray(v) ? (v as Array<any>) : [];
  }, [lowerKeyMap]);

  const affinityRows = useMemo(() => {
    const v = (lowerKeyMap as any)?.affinity;
    return Array.isArray(v) ? (v as Array<any>) : [];
  }, [lowerKeyMap]);

  const stabilityOverview = useMemo(() => {
    const stability = (lowerKeyMap as any)?.stability;
    if (Array.isArray(stability)) {
      const pick = stability.find((item) => item && typeof item === "object" && "study_overview" in item) ?? stability[0];
      if (pick && typeof pick === "object" && "study_overview" in pick) return (pick as any).study_overview ?? null;
    } else if (stability && typeof stability === "object") {
      return (stability as any).study_overview ?? null;
    }
    const studies = (lowerKeyMap as any)?.studies;
    if (Array.isArray(studies) && studies.length > 0) return studies[0]?.study_overview ?? null;
    return null;
  }, [lowerKeyMap]);

  const hasData = partitionRows.length > 0 || affinityRows.length > 0 || !!stabilityOverview;

  return (
    <section
      style={{
        marginTop: 16,
        background: "#F8FAFC",
        border: "1px solid #2aa3a3",
        borderRadius: 6,
        overflow: "hidden",
      }}
    >
      <div
        onClick={onToggle}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 12px",
          background: "#bcecec",
          color: "#0f3f3f",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>{open ? "▾" : "▸"}</span>
          <span>体外数据</span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 600 }}>
          Click To Hide/Show Activity Data Related to This Level
        </span>
      </div>

      {open && (
        <div style={{ display: "grid", gap: 14, marginTop: 12 }}>
          {!hasData && <div style={{ color: "#64748b", padding: 10 }}>No in vitro data.</div>}

          {partitionRows.length > 0 && (
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, padding: 8, display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 700, color: "#0f172a", background: "#f8fafc", borderRadius: 4, padding: "6px 8px", border: "1px solid #e5e7eb" }}>Realted Partition coefficient</div>
              {partitionRows.map((row, idx) => {
                const value = formatDosage(row.measurement_symbols, row.measurement_value, row.measurement_unit);
                return (
                  <table key={idx} style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e5e7eb", borderRadius: 4, overflow: "hidden", background: "#fff" }}>
                    <tbody>
                      {[
                        ["Partition coefficient-Type", renderValue(row.measurement_type)],
                        ["Partition coefficient-Value", value],
                        ["Partition coefficient-Description", renderValue(row.method_description)],
                      ].map(([label, val], i, arr) => (
                        <tr key={label}>
                          <td style={{ padding: "8px 10px", borderTop: i === 0 ? "1px solid #d4d4d8" : "1px solid #e5e7eb", borderBottom: i === arr.length - 1 ? "1px solid #d4d4d8" : "1px solid #e5e7eb", width: "26%", fontWeight: 700, color: "#0f172a", background: "#f8fafc" }}>
                            {label}
                          </td>
                          <td style={{ padding: "8px 10px", borderTop: i === 0 ? "1px solid #d4d4d8" : "1px solid #e5e7eb", borderBottom: i === arr.length - 1 ? "1px solid #d4d4d8" : "1px solid #e5e7eb", color: "#0f172a", lineHeight: 1.5, fontSize: 14 }}>
                            {val as any}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })}
            </div>
          )}

          {affinityRows.length > 0 && (
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, padding: 8, display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 700, color: "#0f172a", background: "#f8fafc", borderRadius: 4, padding: "6px 8px", border: "1px solid #e5e7eb" }}>Realted affinity</div>
              {affinityRows.map((row, idx) => {
                const value = formatDosage(row.measurement_symbols, row.measurement_value, row.measurement_unit);
                return (
                  <table key={idx} style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e5e7eb", borderRadius: 4, overflow: "hidden", background: "#fff" }}>
                    <tbody>
                      {[
                        ["affinity-Type", renderValue(row.measurement_type)],
                        ["affinity-value", value],
                        ["affinity-method description", renderValue(row.method_description)],
                      ].map(([label, val], i, arr) => (
                        <tr key={label}>
                          <td style={{ padding: "8px 10px", borderTop: i === 0 ? "1px solid #d4d4d8" : "1px solid #e5e7eb", borderBottom: i === arr.length - 1 ? "1px solid #d4d4d8" : "1px solid #e5e7eb", width: "26%", fontWeight: 700, color: "#0f172a", background: "#f8fafc", fontSize: 14 }}>
                            {label}
                          </td>
                          <td style={{ padding: "8px 10px", borderTop: i === 0 ? "1px solid #d4d4d8" : "1px solid #e5e7eb", borderBottom: i === arr.length - 1 ? "1px solid #d4d4d8" : "1px solid #e5e7eb", color: "#0f172a", lineHeight: 1.5, fontSize: 14 }}>
                            {val as any}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })}
            </div>
          )}

          {!!stabilityOverview && (
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, padding: 8, display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 700, color: "#0f172a", background: "#f8fafc", borderRadius: 4, padding: "6px 8px", border: "1px solid #e5e7eb" }}>Realted stability</div>
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: 10, background: "#fff" }}>
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 12, rowGap: 6, alignItems: "start" }}>
                  <div style={{ color: "#0f172a", fontWeight: 700, fontSize: 14 }}>in vitro stability</div>
                  <div style={{ color: "#0f172a", minWidth: 0, wordBreak: "break-word", fontSize: 14 }}>{renderValue(stabilityOverview)}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
