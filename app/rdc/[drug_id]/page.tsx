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
      <div style={{ color: "#16a34a", fontWeight: 600 }}>{label}</div>
      <div style={{ color: "#111827", marginTop: 4 }}>{renderValue(value)}</div>
    </div>
  );
}

const tableHeaderStyle: CSSProperties = {
  textAlign: "left",
  padding: 8,
  borderBottom: "1px solid #fcd34d",
  fontWeight: 600,
  color: "#16a34a",
  background: "#fff7ed",
};

const tableCellStyle: CSSProperties = {
  padding: 8,
  borderTop: "1px dashed #fcd34d",
  color: "#111827",
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
    <div style={{ border: "1px dashed #f59e0b", borderRadius: 10, overflowX: "auto" }}>
      <div style={{ padding: "8px 10px", color: "#16a34a", fontWeight: 600 }}>
        Detection time & Tumor-to-background ratios (T/B)
      </div>
      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
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
            <tr key={`${row.detection_time ?? "na"}-${idx}`}>
              <td style={tableCellStyle}>{renderValue(row.detection_time)}</td>
              {tbrKeys.map((key) => (
                <td key={key} style={tableCellStyle}>
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
  const [openAnimal, setOpenAnimal] = useState(false);
  const [openInVitro, setOpenInVitro] = useState(false);

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
  const biodistRecords = (animal?.studies ?? []).flatMap((s) => s.biodistribution ?? []);
  const biodistGroups = groupBiodistributionRows(biodistRecords);

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ margin: 0 }}>RDCInfo 详情页</h1>
      <p style={{ marginTop: 6, color: "#475569" }}>Drug ID: {drugId}</p>

      {error && <p style={{ color: "#b91c1c" }}>错误：{error}</p>}
      {loading && <p>Loading…</p>}

      {!!g && (
        <section
          style={{
            marginTop: 12,
            background: "#FFFBEB",
            border: "2px solid #1F2937",
            borderRadius: 12,
            padding: 18,
          }}
        >
          <h3 style={{ marginTop: 0 }}>General Information of This RDC</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, lineHeight: 1.9 }}>
            <li><strong>drug_id</strong>: {g.drug_id}</li>
            <li><strong>external_id</strong>: {g.external_id ?? "-"}</li>
            <li><strong>drug_name</strong>: {g.drug_name}</li>
            <li><strong>drug_synonyms</strong>: {g.drug_synonyms ?? "-"}</li>
            <li><strong>status</strong>: {g.status ?? "-"}</li>
            {/* <li><strong>type</strong>: {g.type ?? "-"}</li> */}
            <li><strong>smiles</strong>: {g.smiles ?? "-"}</li>
            <li><strong>structure_image</strong>: {g.structure_image ?? "-"}</li>
            <li>cold compound Name: {c?.compound_name ?? "-"}</li>
            <li>ligand Name: {c?.ligand_name ?? "-"}</li>
            <li>linker Name: {c?.linker_name ?? "-"}</li>
            <li>chelator Name: {c?.chelator_name ?? "-"}</li>
            <li>radionuclide Name: {c?.radionuclide_name ?? "-"}</li>
            <li><strong>chebi_id</strong>: {g.chebi_id ?? "-"}</li>
            <li><strong>pubchem_cid</strong>: {g.pubchem_cid ?? "-"}</li>
            <li><strong>pubchem_sid</strong>: {g.pubchem_sid ?? "-"}</li>
          </ul>
        </section>
      )}

      {/* 人体活性数据（按原型排版：字段两列/虚线分隔） */}
      <section
        style={{
          marginTop: 16,
          background: "#FFFBEB",
          border: "2px solid #1F2937",
          borderRadius: 12,
          padding: 18,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>详细活性数据 - 人体活性数据</h3>
          <button
            onClick={() => setOpenHuman((v) => !v)}
            style={{
              padding: "6px 12px",
              background: "#A7F3D0",
              border: "2px solid #047857",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            {openHuman ? "点击收起" : "点击展开"}
          </button>
        </div>

        {openHuman && (
          <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
            {(detail?.human_activity ?? []).map((row, idx) => (
              <div key={idx} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 8 }}>
                  {[
                    ["indication", row.indication],
                    ["patients", row.patients],
                    ["dosage", row.dosage],
                    ["frequency", row.frequency],
                    ["clinical_trial_number", row.clinical_trial_number],
                    ["results_description", row.results_description],
                    ["purpose", row.purpose],
                    ["clinical_endpoint", row.clinical_endpoint],
                    ["endpoint_period", row.endpoint_period],
                    ["efficacy_description", row.efficacy_description],
                    ["adverse_events_summary", row.adverse_events_summary],
                    ["security_indicators", row.security_indicators],
                  ].map(([label, value]) => (
                    <div key={label as string} style={{ border: "1px dashed #f59e0b", borderRadius: 8, padding: "8px 10px" }}>
                      <div style={{ color: "#16a34a" }}>{label}</div>
                      <div style={{ color: "#111827" }}>{(value as string) ?? "-"}</div>
                    </div>
                  ))}
                </div>
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
          background: "#FFFBEB",
          border: "2px solid #1F2937",
          borderRadius: 12,
          padding: 18,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>动物活性数据</h3>
          <button
            onClick={() => setOpenAnimal((v) => !v)}
            style={{ padding: "6px 12px", background: "#A7F3D0", border: "2px solid #047857", borderRadius: 8, cursor: "pointer" }}
          >
            {openAnimal ? "点击收起" : "点击展开"}
          </button>
        </div>

        {openAnimal && (
          <div style={{ display: "grid", gap: 14, marginTop: 12 }}>
            {/* PK */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10 }}>
              <div style={{ padding: "8px 10px", fontWeight: 600 }}>Realted Pharmacokinetics (PK)</div>
              <div style={{ padding: 10, display: "grid", gap: 10 }}>
                {(animal?.studies ?? []).flatMap((s) => s.pk).map((row, idx) => {
                  const dosage = (() => {
                    const parts = [
                      (row as any).pk_dosage_symbols ?? undefined,
                      (row as any).pk_dosage_value == null ? undefined : String((row as any).pk_dosage_value),
                      (row as any).pk_dosage_unit ?? undefined,
                    ].filter((v) => typeof v === 'string' ? v.trim().length > 0 : v !== undefined) as string[];
                    return parts.length > 0 ? parts.join(' ') : '-';
                  })();

                  const halfLife = (() => {
                    const parts = [
                      (row as any).half_life_value == null ? undefined : String((row as any).half_life_value),
                      (row as any).half_life_unit ?? undefined,
                    ].filter((v) => typeof v === 'string' ? v.trim().length > 0 : v !== undefined) as string[];
                    const combined = parts.length > 0 ? parts.join(' ') : undefined;
                    return combined ?? (row as any).half_life ?? '-';
                  })();

                  const pkResultPath = (() => {
                    const raw = (row as any).pk_result ?? (row as any).pk_image ?? null;
                    if (!raw || typeof raw !== 'string') return '-';
                    const name = raw.split('/').filter(Boolean).pop() ?? raw;
                    return `domain/file/${name}`;
                  })();

                  return (
                    <div key={idx} style={{ border: "1px dashed #f59e0b", borderRadius: 10, padding: 10, display: 'grid', gridTemplateColumns: 'auto 1fr auto 1fr auto 1fr', columnGap: 12, rowGap: 10 }}>
                      {/* Row 2: labels + values */}
                      <div style={{ color: '#16a34a', fontWeight: 600 }}>Animal model</div>
                      <div style={{ minWidth: 0, wordBreak: 'break-word' }}>{row.pk_animal_model ?? '-'}</div>
                      <div style={{ color: '#16a34a', fontWeight: 600 }}>Dosage</div>
                      <div style={{ minWidth: 0, wordBreak: 'break-word' }}>{dosage}</div>
                      <div style={{ color: '#16a34a', fontWeight: 600 }}>Half Life</div>
                      <div style={{ minWidth: 0, wordBreak: 'break-word' }}>{halfLife}</div>

                      {/* Row 3: PK_Result */}
                      <div style={{ color: '#16a34a', fontWeight: 600, gridColumn: '1 / span 1' }}>PK_Result</div>
                      <div style={{ gridColumn: '2 / 7', minWidth: 0, wordBreak: 'break-word' }}>{pkResultPath}</div>

                      {/* Row 4: PK_Description */}
                      <div style={{ color: '#16a34a', fontWeight: 600, gridColumn: '1 / span 1' }}>PK_Description</div>
                      <div style={{ gridColumn: '2 / 7', minWidth: 0, wordBreak: 'break-word' }}>{row.pk_description ?? '-'}</div>
                    </div>
                  );
                })}
                {(!animal || (animal.studies ?? []).every((s) => (s.pk ?? []).length === 0)) && (
                  <div style={{ color: "#64748b", padding: 8 }}>No PK data.</div>
                )}
              </div>
            </div>

            {/* Biodistribution */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflowX: "auto" }}>
              <div style={{ padding: "8px 10px", fontWeight: 600 }}>Related Biological Distribution</div>
              <div style={{ padding: 10, display: "grid", gap: 10 }}>
                {biodistGroups.map((group, idx) => {
                  const shared = group.shared;
                  const dosage = formatDosage(shared.dosage_symbols, shared.dosage_value, shared.dosage_unit);
                  return (
                    <div key={idx} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 10, display: "grid", gap: 10 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 8 }}>
                        <FieldBox label="Biological Distribution_Type" value={shared.biodist_type} />
                        <FieldBox label="Animal model" value={shared.animal_model} />
                        <FieldBox label="Dosage" value={dosage} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 8 }}>
                        <FieldBox label="Metabolism" value={shared.metabolism} />
                        <FieldBox label="Excretion" value={shared.excretion} />
                        <FieldBox label="Tumor retention time" value={shared.tumor_retention_time} />
                        <FieldBox label="Biodist result image" value={shared.biodist_result_image} />
                        <FieldBox label="Biodist description" value={shared.biodist_description} style={{ gridColumn: "span 3" }} />
                      </div>
                      <DetectionTbrTable rows={group.detectionRows} />
                    </div>
                  );
                })}
                {biodistGroups.length === 0 && (
                  <div style={{ color: "#64748b", padding: 8 }}>No biodistribution data.</div>
                )}
              </div>
            </div>

            {/* Efficacy */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflowX: "auto" }}>
              <div style={{ padding: "8px 10px", fontWeight: 600 }}>Related Efficacy</div>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>animal_model</th>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>dosage_symbols</th>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>dosage_value</th>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>dosage_unit</th>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>efficacy_description</th>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>adverse_reactions</th>
                  </tr>
                </thead>
                <tbody>
                  {(animal?.studies ?? []).flatMap((s) => s.efficacy).map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: 8, borderTop: "1px dashed #e5e7eb" }}>{row.efficacy_animal_model ?? "-"}</td>
                      <td style={{ padding: 8, borderTop: "1px dashed #e5e7eb" }}>{row.efficacy_dosage_symbols ?? "-"}</td>
                      <td style={{ padding: 8, borderTop: "1px dashed #e5e7eb" }}>{row.efficacy_dosage_value ?? "-"}</td>
                      <td style={{ padding: 8, borderTop: "1px dashed #e5e7eb" }}>{row.efficacy_dosage_unit ?? "-"}</td>
                      <td style={{ padding: 8, borderTop: "1px dashed #e5e7eb" }}>{row.efficacy_description ?? "-"}</td>
                      <td style={{ padding: 8, borderTop: "1px dashed #e5e7eb" }}>{row.adverse_reactions ?? "-"}</td>
                    </tr>
                  ))}
                  {(!animal || (animal.studies ?? []).every((s) => (s.efficacy ?? []).length === 0)) && (
                    <tr>
                      <td colSpan={6} style={{ padding: 12, color: "#64748b" }}>No efficacy data.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* 体外数据（按原型排版，按类别分卡片，字段虚线框） */}
      <section
        style={{
          marginTop: 16,
          background: "#FFFBEB",
          border: "2px solid #1F2937",
          borderRadius: 12,
          padding: 18,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>体外数据</h3>
          <button
            onClick={() => setOpenInVitro((v) => !v)}
            style={{ padding: "6px 12px", background: "#A7F3D0", border: "2px solid #047857", borderRadius: 8, cursor: "pointer" }}
          >
            {openInVitro ? "点击收起" : "点击展开"}
          </button>
        </div>

        {openInVitro && (
          <div style={{ display: "grid", gap: 14, marginTop: 12 }}>
            {(() => {
              if (!inVitro) return <div style={{ color: '#64748b' }}>No in vitro data.</div>;
              const keys = Object.keys(inVitro).filter((k) => k !== 'studies');
              if (keys.length === 0) return <div style={{ color: '#64748b' }}>No in vitro data.</div>;
              return keys.map((category) => {
                const rows = (inVitro[category] as Array<any>) ?? [];
                return (
                  <div key={category} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflowX: 'auto' }}>
                    <div style={{ padding: '8px 10px', fontWeight: 600 }}>{category.replace(/_/g, ' ')}</div>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e5e7eb' }}>measurement_type</th>
                          <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e5e7eb' }}>measurement_symbols</th>
                          <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e5e7eb' }}>measurement_value</th>
                          <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e5e7eb' }}>measurement_unit</th>
                          <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e5e7eb' }}>method_description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, i) => (
                          <tr key={i}>
                            <td style={{ padding: 8, borderTop: '1px dashed #e5e7eb' }}>{r.measurement_type ?? '-'}</td>
                            <td style={{ padding: 8, borderTop: '1px dashed #e5e7eb' }}>{r.measurement_symbols ?? '-'}</td>
                            <td style={{ padding: 8, borderTop: '1px dashed #e5e7eb' }}>{r.measurement_value ?? '-'}</td>
                            <td style={{ padding: 8, borderTop: '1px dashed #e5e7eb' }}>{r.measurement_unit ?? '-'}</td>
                            <td style={{ padding: 8, borderTop: '1px dashed #e5e7eb' }}>{r.method_description ?? '-'}</td>
                          </tr>
                        ))}
                        {rows.length === 0 && (
                          <tr>
                            <td colSpan={5} style={{ padding: 12, color: '#64748b' }}>No data.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </section>
    </main>
  );
}
