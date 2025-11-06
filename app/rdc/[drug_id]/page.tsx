"use client";

import { useEffect, useMemo, useState } from "react";

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
            <li><strong>type</strong>: {g.type ?? "-"}</li>
            <li><strong>smiles</strong>: {g.smiles ?? "-"}</li>
            <li><strong>structure_image</strong>: {g.structure_image ?? "-"}</li>
            <li style={{ color: "#16a34a" }}>compound Name: {c?.compound_name ?? "-"}</li>
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
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflowX: "auto" }}>
              <div style={{ padding: "8px 10px", fontWeight: 600 }}>Related Pharmacokinetics (PK)</div>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>animal_model</th>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>dosage_symbols</th>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>dosage_value</th>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>dosage_unit</th>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>half_life</th>
                    <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>pk_description</th>
                  </tr>
                </thead>
                <tbody>
                  {(animal?.studies ?? []).flatMap((s) => s.pk).map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: 8, borderTop: "1px dashed #e5e7eb" }}>{row.pk_animal_model ?? "-"}</td>
                      <td style={{ padding: 8, borderTop: "1px dashed #e5e7eb" }}>{row.pk_dosage_symbols ?? "-"}</td>
                      <td style={{ padding: 8, borderTop: "1px dashed #e5e7eb" }}>{row.pk_dosage_value ?? "-"}</td>
                      <td style={{ padding: 8, borderTop: "1px dashed #e5e7eb" }}>{row.pk_dosage_unit ?? "-"}</td>
                      <td style={{ padding: 8, borderTop: "1px dashed #e5e7eb" }}>{row.half_life ?? "-"}</td>
                      <td style={{ padding: 8, borderTop: "1px dashed #e5e7eb" }}>{row.pk_description ?? "-"}</td>
                    </tr>
                  ))}
                  {(!animal || (animal.studies ?? []).every((s) => (s.pk ?? []).length === 0)) && (
                    <tr>
                      <td colSpan={6} style={{ padding: 12, color: "#64748b" }}>No PK data.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Biodistribution */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflowX: "auto" }}>
              <div style={{ padding: "8px 10px", fontWeight: 600 }}>Related Biological Distribution</div>
              <div style={{ padding: 10, display: "grid", gap: 10 }}>
                {(animal?.studies ?? []).flatMap((s) => s.biodistribution).map((row, idx) => (
                  <div key={idx} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 10 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 8 }}>
                      {[
                        ["biodist_type", row.biodist_type],
                        ["animal_model", row.animal_model],
                        ["dosage_symbols", row.dosage_symbols],
                        ["dosage_value", String(row.dosage_value ?? "-")],
                        ["dosage_unit", row.dosage_unit],
                        ["detection_time", row.detection_time],
                        ["tumor_retention_time", row.tumor_retention_time],
                      ].map(([label, value]) => (
                        <div key={label as string} style={{ border: "1px dashed #f59e0b", borderRadius: 8, padding: 8 }}>
                          <div style={{ color: "#16a34a" }}>{label}</div>
                          <div>{(value as string) ?? "-"}</div>
                        </div>
                      ))}
                    </div>
                    {row.tbr && (
                      <div style={{ marginTop: 8, color: "#334155" }}>
                        <div style={{ fontWeight: 600, marginBottom: 6 }}>Tumor-to-background ratios (T/B)</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8 }}>
                          {Object.entries(row.tbr).map(([k,v]) => (
                            <div key={k} style={{ border: '1px dashed #f59e0b', borderRadius: 8, padding: 8 }}>
                              <div style={{ color: '#16a34a' }}>{k.replace('tumor_', '').replace(/_/g,' ')}</div>
                              <div>{v ?? '-'}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {(!animal || (animal.studies ?? []).every((s) => (s.biodistribution ?? []).length === 0)) && (
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
