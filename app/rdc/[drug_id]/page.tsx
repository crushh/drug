"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

type General = {
  drug_id: string;
  external_id: string | null;
  drug_name: string;
  drug_synonyms: string | null;
  status: string | null;
  type: string | null;
  smiles: string | null;
  structure_image: string | null;
  chebi_id: string | null;
  pubchem_cid: string | null;
  pubchem_sid: string | null;
};

type HumanActivity = {
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

type Chemicals = {
  compound_name?: string | null;
  ligand_name?: string | null;
  linker_name?: string | null;
  chelator_name?: string | null;
  radionuclide_name?: string | null;
};

type Detail = {
  general?: General;
  chemicals?: Chemicals;
  human_activity?: HumanActivity[];
  animal_in_vivo?: {
    studies: Array<{
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
      biodistribution: Array<{
        biodist_type: string | null;
        animal_model: string | null;
        dosage_symbols: string | null;
        dosage_value: number | null;
        dosage_unit: string | null;
        detection_time: string | null;
        tumor_retention_time: string | null;
        tbr?: {
          tumor_blood?: number | null;
          tumor_muscle?: number | null;
          tumor_kidney?: number | null;
          tumor_salivary_glands?: number | null;
          tumor_liver?: number | null;
          tumor_lung?: number | null;
          tumor_heart?: number | null;
        };
      }>;
      efficacy: Array<{
        efficacy_animal_model: string | null;
        efficacy_dosage_symbols: string | null;
        efficacy_dosage_value: number | null;
        efficacy_dosage_unit: string | null;
        efficacy_description: string | null;
        adverse_reactions: string | null;
      }>;
    }>;
  };
  in_vitro?: Record<string, unknown> & { studies?: Array<{ in_vitro_id: string; study_overview: string | null }>; };
};

type AnimalStudy = NonNullable<Detail["animal_in_vivo"]>["studies"][number];
type BiodistributionEntry = AnimalStudy["biodistribution"][number];
type ReferenceItem = {
  reference_id: string;
  title: string;
  authors: string | null;
  journal: string | null;
  publication_date: string | null;
  volume: string | null;
  issue: string | null;
  pages: string | null;
  doi: string | null;
  pmid: string | null;
  url: string | null;
  abstract: string | null;
  notes: string | null;
  relation_note: string | null;
};

type BiodistSharedFields = {
  biodist_type: string | null;
  animal_model: string | null;
  dosage_symbols: string | null;
  dosage_value: number | null;
  dosage_unit: string | null;
  metabolism: string | null;
  excretion: string | null;
  tumor_retention_time: string | null;
  biodist_result_image: string | null;
  biodist_description: string | null;
};

type DetectionTbrRow = {
  detection_time: string | null;
  tbr: Record<string, number | null | undefined>;
};

type BiodistGroup = {
  shared: BiodistSharedFields;
  detectionRows: DetectionTbrRow[];
};

const fieldBoxStyle: CSSProperties = {
  border: "1px dashed #f59e0b",
  borderRadius: 8,
  padding: 8,
};

type FieldBoxProps = {
  label: string;
  value: ReactNode;
  style?: CSSProperties;
};

function FieldBox({ label, value, style }: FieldBoxProps) {
  return (
    <div style={{ ...fieldBoxStyle, ...style }}>
      <div style={{ color: "#16a34a", fontWeight: 600, fontSize: 14 }}>{label}</div>
      <div style={{ color: "#111827", marginTop: 4, fontSize: 14 }}>{renderValue(value)}</div>
    </div>
  );
}

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

function renderValue(value: ReactNode) {
  if (value === null || value === undefined) {
    return "-";
  }
  if (typeof value === "string") {
    return value.trim().length > 0 ? value : "-";
  }
  return value;
}

function formatDosage(symbols: string | null, value: number | string | null, unit: string | null) {
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

function DetectionTbrTable({ rows }: { rows: DetectionTbrRow[] }) {
  if (rows.length === 0) return null;
  const tbrKeys = Object.keys(TBR_LABELS) as Array<keyof typeof TBR_LABELS>;
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 6, overflowX: "auto" }}>
      <div style={{ padding: "8px 10px", color: "#0f172a", fontWeight: 700, background: "#f8fafc", borderBottom: "1px solid #d4d4d8" }}>
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

function groupBiodistributionRows(rows: BiodistributionEntry[]): BiodistGroup[] {
  const map = new Map<string, BiodistGroup>();
  for (const row of rows) {
    const shared: BiodistSharedFields = {
      biodist_type: row.biodist_type ?? null,
      animal_model: row.animal_model ?? null,
      dosage_symbols: row.dosage_symbols ?? null,
      dosage_value: row.dosage_value ?? null,
      dosage_unit: row.dosage_unit ?? null,
      metabolism: row.metabolism ?? null,
      excretion: row.excretion ?? null,
      tumor_retention_time: row.tumor_retention_time ?? null,
      biodist_result_image: row.biodist_result_image ?? null,
      biodist_description: row.biodist_description ?? null,
    };
    const key = JSON.stringify(shared);
    if (!map.has(key)) {
      map.set(key, { shared, detectionRows: [] });
    }
    map.get(key)!.detectionRows.push({
      detection_time: row.detection_time ?? null,
      tbr: row.tbr ?? {},
    });
  }
  return Array.from(map.values());
}

export default function DrugDetailPage({ params }: { params: { drug_id: string } }) {
  const drugId = useMemo(() => params.drug_id, [params]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);

  const [openHuman, setOpenHuman] = useState(true);
  const [openHumanItems, setOpenHumanItems] = useState<Record<number, boolean>>({});
  const [openAnimal, setOpenAnimal] = useState(true);
  const [openInVitro, setOpenInVitro] = useState(true);
  const [openReferences, setOpenReferences] = useState(true);
  const [openGeneral, setOpenGeneral] = useState(true);
  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const [referencesLoading, setReferencesLoading] = useState(false);
  const [referencesError, setReferencesError] = useState<string | null>(null);
  const [openBiodistItems, setOpenBiodistItems] = useState<Record<number, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `/api/rdc/${encodeURIComponent(drugId)}?expand=chemicals,human_activity,animal_in_vivo,in_vitro&all_entities=true`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.message || `HTTP ${res.status}`);
        }
        const data = (await res.json()) as Detail;
        if (!cancelled) setDetail(data);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [drugId]);

  const g = detail?.general;
  const c = detail?.chemicals;
  const animal = detail?.animal_in_vivo;
  const inVitro = detail?.in_vitro as (Record<string, Array<any>> & { studies?: Array<any> }) | undefined;
  const biodistRecords = useMemo(
    () => (animal?.studies ?? []).flatMap((s) => s.biodistribution ?? []),
    [animal?.studies]
  );
  const biodistGroups = useMemo(() => groupBiodistributionRows(biodistRecords), [biodistRecords]);

  useEffect(() => {
    const next: Record<number, boolean> = {};
    (detail?.human_activity ?? []).forEach((_, i) => {
      next[i] = true;
    });
    setOpenHumanItems(next);
  }, [detail?.human_activity]);

  useEffect(() => {
    setOpenBiodistItems((prev) => {
      const next: Record<number, boolean> = { ...prev };
      biodistGroups.forEach((_, i) => {
        if (!(i in next)) next[i] = true;
      });
      Object.keys(next)
        .map((k) => Number(k))
        .forEach((i) => {
          if (i >= biodistGroups.length) delete next[i];
        });
      return next;
    });
  }, [biodistGroups]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setReferencesLoading(true);
      setReferencesError(null);
      setReferences([]);
      try {
        const res = await fetch(`/api/reference/${encodeURIComponent(drugId)}`, { cache: "no-store" });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.message || `HTTP ${res.status}`);
        }
        const data = (await res.json()) as { references: ReferenceItem[] };
        if (!cancelled) setReferences(data.references ?? []);
      } catch (e: any) {
        if (!cancelled) setReferencesError(e?.message || String(e));
      } finally {
        if (!cancelled) setReferencesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [drugId]);

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ margin: 0 }}>RDCInfo 详情页</h1>
      <p style={{ marginTop: 6, color: "#475569" }}>Drug ID: {drugId}</p>

      {error && <p style={{ color: "#b91c1c" }}>错误：{error}</p>}
      {loading && <p>Loading…</p>}

      {!!g && (
        <section
          style={{
          marginTop: 16,
          background: "#F8FAFC",
          border: "1px solid #0f766e",
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
            background: "#0f766e",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer", 
            }}
          >
            <span>General Information of This RDC</span>
            <span style={{ fontSize: 16 }}>{openGeneral ? "▾" : "▸"}</span>
          </div>
          {openGeneral && (
            <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" ,padding:10}}>
              <tbody>
                {[
                  ["drug_id", g.drug_id],
                  ["external_id", g.external_id ?? "-"],
                  ["drug_name", g.drug_name],
                  ["drug_synonyms", g.drug_synonyms ?? "-"],
                  ["status", g.status ?? "-"],
                  ["smiles", g.smiles ?? "-"],
                  ["structure_image", g.structure_image ?? "-"],
                  ["cold compound Name", c?.compound_name ?? "-"],
                  ["ligand Name", c?.ligand_name ?? "-"],
                  ["linker Name", c?.linker_name ?? "-"],
                  ["chelator Name", c?.chelator_name ?? "-"],
                  ["radionuclide Name", c?.radionuclide_name ?? "-"],
                  ["chebi_id", g.chebi_id ?? "-"],
                  ["pubchem_cid", g.pubchem_cid ?? "-"],
                  ["pubchem_sid", g.pubchem_sid ?? "-"],
                ].map(([label, value], i, arr) => (
                  <tr key={label}>
                    <td
                      style={{
                        padding: "9px 12px",
                        borderTop: i === 0 ? "1px solid #d4d4d8" : "1px solid #e5e7eb",
                        borderBottom: i === arr.length - 1 ? "1px solid #d4d4d8" : "1px solid #e5e7eb",
                        width: "22%",
                        fontWeight: 700,
                        color: "#0f172a",
                        fontSize: 14,
                      }}
                    >
                      {label}
                    </td>
                    <td
                      style={{
                        padding: "9px 12px",
                        borderTop: i === 0 ? "1px solid #d4d4d8" : "1px solid #e5e7eb",
                        borderBottom: i === arr.length - 1 ? "1px solid #d4d4d8" : "1px solid #e5e7eb",
                        color: "#0f172a",
                        fontSize: 14,
                        lineHeight: 1.5,
                      }}
                    >
                      {value as any}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {/* 人体活性数据（按原型排版：字段两列/虚线分隔） */}
      <section
        style={{
           marginTop: 16,
          background: "#F8FAFC",
          border: "1px solid #0f766e",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <div  onClick={() => setOpenHuman((v) => !v)} 
          style={{ 
             display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 12px",
            background: "#0f766e",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer", 
          }}>
          <span>详细活性数据 - 人体活性数据</span>
          <span>
            {openHuman ?"▾" : "▸"}
          </span>
        </div>

        {openHuman && (
          <div style={{ display: "grid" }}>
                {(detail?.human_activity ?? []).map((row, idx) => (
                  <div key={idx} style={{ background: "#fff", borderRadius: 8, padding: 10, display: "grid", gap: 10 }}>
                    <div
                      onClick={() => setOpenHumanItems((prev) => ({ ...prev, [idx]: !(prev[idx] ?? true) }))}
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
                      <div style={{ color: "#008b8b", fontWeight: 600, fontSize: 14 }}>[{idx + 1}] {openHumanItems[idx] ?? true ? "▾" : "▸"}</div>
                    </div>

                {(openHumanItems[idx] ?? true) && (
                  <>
                    <div style={{ border: "1px solid #cbd5e1", borderRadius: 8, overflow: "hidden" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", background: "#f1f5f9", borderBottom: "1px solid #cbd5e1" }}>
                        <div style={{ padding: "10px 12px", color: "#0f172a", fontWeight: 700, fontSize: 14 }}>incication</div>
                        <div style={{ padding: "10px 12px", color: "#0f172a", fontSize: 14 }}>{renderValue(row.indication)}</div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", background: "#fff", borderBottom: "1px solid #cbd5e1" }}>
                        <div style={{ padding: "10px 12px", color: "#0f172a", fontWeight: 700, fontSize: 14 }}>Patients</div>
                        <div style={{ padding: "10px 12px", color: "#0f172a", fontSize: 14 }}>{renderValue(row.patients)}</div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 180px 1fr", background: "#f8fafc",borderBottom: "1px solid #cbd5e1"}}>
                        <div style={{ padding: "10px 12px", color: "#0f172a", fontWeight: 700, fontSize: 14, borderRight: "1px solid #cbd5e1" }}>dosage</div>
                        <div style={{ padding: "10px 12px", color: "#0f172a", fontSize: 14, borderRight: "1px solid #cbd5e1" }}>{renderValue(row.dosage)}</div>
                        <div style={{ padding: "10px 12px", color: "#0f172a", fontWeight: 700, fontSize: 14, borderRight: "1px solid #cbd5e1" }}>Frequency</div>
                        <div style={{ padding: "10px 12px", color: "#0f172a", fontSize: 14 }}>{renderValue(row.frequency)}</div>
                      </div>
                    

                      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 180px 1fr",padding: "10px 12px", background: "#fff" ,borderBottom: "1px solid #cbd5e1",color: "#0f172a", fontWeight: 700, fontSize: 14 }}>Realted clinical Trial</div>
                     
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
                  </>
                )}
              </div>
            ))}
            {(!detail?.human_activity || detail.human_activity.length === 0) && (
              <div style={{ color: "#64748b" }}>No human activity data.</div>
            )}
          </div>
        )}
      </section>

      {/* 动物活性数据 */}
      <section
        style={{
           marginTop: 16,
          background: "#F8FAFC",
          border: "1px solid #0f766e",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <div 
         onClick={() => setOpenAnimal((v) => !v)}
        style={{ 
           display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 12px",
            background: "#0f766e",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer", 
         }}>
         <span>动物活性数据</span>
          <span>
            {openAnimal ?"▾" : "▸"}
          </span>
        </div>

        {openAnimal && (
          <div style={{ display: "grid", gap: 14, marginTop: 12 }}>

            {/* Biodistribution */}
            <div style={{ background: "#fff", borderRadius: 8, overflowX: "auto" }}>
              <div style={{ padding: "8px 10px", fontWeight: 700, color: "#0f172a", background: "#f1f5f9", borderBottom: "1px solid #cbd5e1" }}>Related Biological Distribution</div>
              <div style={{ padding: 10, display: "grid", gap: 10 }}>
                {biodistGroups.map((group, idx) => {
                  const shared = group.shared;
                  const dosage = formatDosage(shared.dosage_symbols, shared.dosage_value, shared.dosage_unit);
                  return (
                    <div key={idx} style={{ border: "1px solid #e5e7eb", borderRadius: 6, display: "grid", gap: 10, background: "#fff" }}>
                      <div
                        onClick={() => setOpenBiodistItems((prev) => ({ ...prev, [idx]: !(prev[idx] ?? true) }))}
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
                {biodistGroups.length === 0 && (
                  <div style={{ color: "#64748b", padding: 8 }}>No biodistribution data.</div>
                )}
              </div>
            </div>

            {/* Efficacy */}
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

      {/* 体外数据 */}
      <section
        style={{
          marginTop: 16,
          background: "#F8FAFC",
          border: "1px solid #0f766e",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <div 
         onClick={() => setOpenInVitro((v) => !v)}
         style={{  display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 12px",
            background: "#0f766e",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer", }}>
          <span>体外数据</span>
         <span>
            {openInVitro ? "▾" : "▸"}
          </span>
        </div>

        {openInVitro && (
          <div style={{ display: "grid", gap: 14, marginTop: 12 }}>
            {(() => {
              if (!inVitro) return <div style={{ color: '#64748b' }}>No in vitro data.</div>;
              const lowerKeyMap = Object.fromEntries(Object.entries(inVitro).map(([k, v]) => [k.toLowerCase(), v]));
              const partitionRows = Array.isArray((lowerKeyMap as any)?.partition_coefficient) ? (lowerKeyMap as any).partition_coefficient as Array<any> : [];
              const affinityRows = Array.isArray((lowerKeyMap as any)?.affinity) ? (lowerKeyMap as any).affinity as Array<any> : [];
              const stabilityOverview = (() => {
                const stability = (lowerKeyMap as any)?.stability;
                if (Array.isArray(stability)) {
                  const pick = stability.find((item) => item && typeof item === 'object' && 'study_overview' in item) ?? stability[0];
                  if (pick && typeof pick === 'object' && 'study_overview' in pick) return (pick as any).study_overview ?? null;
                  return null;
                }
                if (stability && typeof stability === 'object') {
                  return (stability as any).study_overview ?? null;
                }
                return null;
              })() ?? (() => {
                const studies = (lowerKeyMap as any)?.studies;
                if (Array.isArray(studies) && studies.length > 0) return studies[0]?.study_overview ?? null;
                return null;
              })();
              const hasData = partitionRows.length > 0 || affinityRows.length > 0 || !!stabilityOverview;
              if (!hasData) return <div style={{ color: '#64748b' }}>No in vitro data.</div>;
              return (
                <div style={{ display: 'grid', gap: 12 }}>
                  {partitionRows.length > 0 && (
                    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: 8, display: 'grid', gap: 6 }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', background: "#f8fafc", borderRadius: 4, padding: "6px 8px", border: "1px solid #e5e7eb" }}>Realted Partition coefficient</div>
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
                    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: 8, display: 'grid', gap: 6 }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', background: "#f8fafc", borderRadius: 4, padding: "6px 8px", border: "1px solid #e5e7eb" }}>Realted affinity</div>
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
                    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: 8, display: 'grid', gap: 6 }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', background: "#f8fafc", borderRadius: 4, padding: "6px 8px", border: "1px solid #e5e7eb" }}>Realted stability</div>
                      <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 10, background: "#fff" }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 12, rowGap: 6, alignItems: 'start' }}>
                          <div style={{ color: '#0f172a', fontWeight: 700, fontSize: 14 }}>in vitro stability</div>
                          <div style={{ color: '#0f172a', minWidth: 0, wordBreak: 'break-word', fontSize: 14 }}>{renderValue(stabilityOverview)}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </section>

      {/* 参考文献 */}
      <section
        style={{
          marginTop: 16,
          background: "#F8FAFC",
          border: "1px solid #0f766e",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <div
          onClick={() => setOpenReferences((v) => !v)}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 12px",
            background: "#0f766e",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          <span>References</span>
          <span style={{ fontSize: 18 }}>{openReferences ? "▾" : "▸"}</span>
        </div>

        {openReferences && (
          <div style={{ padding: 12, background: "#fff" }}>
            {referencesLoading && <div style={{ color: "#64748b" }}>Loading references…</div>}
            {referencesError && <div style={{ color: "#b91c1c" }}>Failed to load references: {referencesError}</div>}
            {!referencesLoading && !referencesError && references.length === 0 && (
              <div style={{ color: "#64748b" }}>No references.</div>
            )}
            {references.length > 0 && (
              <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
                {references.map((ref, idx) => {
                  const dateStr = ref.publication_date ? ref.publication_date.split("T")[0] : null;
                  return (
                    <div
                      key={ref.reference_id || idx}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "120px 1fr",
                        gap: 12,
                        padding: 12,
                        background: idx % 2 === 0 ? "#f8fafc" : "#fff",
                        borderBottom: idx === references.length - 1 ? "none" : "1px solid #e2e8f0",
                      }}
                    >
                      <div style={{ color: "#0f766e", fontWeight: 700, fontStyle: "italic" }}>{`Ref ${idx + 1}`}</div>
                      <div style={{ display: "grid", gap: 6 }}>
                        <div style={{ color: "#0f172a", lineHeight: 1.5 }}>{ref.title}</div>
                        <div style={{ color: "#475569", fontSize: 13, display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {ref.authors && <span>{ref.authors}</span>}
                          {ref.journal && <span>{ref.journal}</span>}
                          {dateStr && <span>{dateStr}</span>}
                          {ref.volume && <span>Vol {ref.volume}</span>}
                          {ref.issue && <span>Issue {ref.issue}</span>}
                          {ref.pages && <span>pp. {ref.pages}</span>}
                          {ref.doi && <span>doi: {ref.doi}</span>}
                          {ref.pmid && <span>pmid: {ref.pmid}</span>}
                        </div>
                        {ref.url && (
                          <a
                            href={ref.url}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: "#0ea5e9", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 4 }}
                          >
                            Visit source ↗
                          </a>
                        )}
                        {ref.relation_note && (
                          <div style={{ color: "#0f766e", fontSize: 12 }}>Note: {ref.relation_note}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
