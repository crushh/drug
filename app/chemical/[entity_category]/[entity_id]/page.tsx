"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  AnimalSection,
  HumanActivitySection,
  InVitroSection,
  groupBiodistributionRows,
  renderValue,
  type AnimalInVivo,
  type HumanActivity,
  type InVitro,
} from "@/app/components/activity-sections";

type Basic = {
  entity_category: string;
  entity_id: string;
  name: string | null;
  synonyms: string | null;
  smiles: string | null;
  formula: string | null;
  structure_image: string | null;
  mol2d_path: string | null;
  mol3d_path: string | null;
  pubchem_cid: string | null;
  inchi: string | null;
  inchikey: string | null;
  iupac_name: string | null;
  molecular_weight: number | null;
  complexity: number | null;
  heavy_atom_count: number | null;
  hbond_acceptors: number | null;
  hbond_donors: number | null;
  rotatable_bonds: number | null;
  logp: number | null;
  tpsa: number | null;
  linker_type: string | null;
  radionuclide_symbol: string | null;
  radionuclide_half_life: string | null;
  radionuclide_emission: string | null;
  radionuclide_energy: string | null;
};

type RdcActivity = {
  drug_id: string;
  drug_name: string;
  status: string | null;
  type: string | null;
  human_activity?: HumanActivity[];
  animal_in_vivo?: AnimalInVivo;
  in_vitro?: InVitro;
};

type ChemicalDetail = {
  basic?: Basic;
  rdc_activity?: RdcActivity[];
};

type FieldBoxProps = {
  label: string;
  value: ReactNode;
  style?: CSSProperties;
};

const fieldBoxStyle: CSSProperties = {
  border: "1px dashed #f59e0b",
  borderRadius: 8,
  padding: 8,
};

function FieldBox({ label, value, style }: FieldBoxProps) {
  return (
    <div style={{ ...fieldBoxStyle, ...style }}>
      <div style={{ color: "#16a34a", fontWeight: 600, fontSize: 14 }}>{label}</div>
      <div style={{ color: "#111827", marginTop: 4, fontSize: 14 }}>{renderValue(value)}</div>
    </div>
  );
}

function RdcActivityCard({ activity }: { activity: RdcActivity }) {
  const [openHuman, setOpenHuman] = useState(true);
  const [openHumanItems, setOpenHumanItems] = useState<Record<number, boolean>>({});
  const [openAnimal, setOpenAnimal] = useState(true);
  const [openBiodistItems, setOpenBiodistItems] = useState<Record<number, boolean>>({});
  const [openInVitro, setOpenInVitro] = useState(true);

  const biodistGroups = useMemo(
    () => groupBiodistributionRows((activity.animal_in_vivo?.studies ?? []).flatMap((s) => s.biodistribution ?? [])),
    [activity.animal_in_vivo?.studies]
  );

  useEffect(() => {
    const next: Record<number, boolean> = {};
    (activity.human_activity ?? []).forEach((_, i) => {
      next[i] = true;
    });
    setOpenHumanItems(next);
  }, [activity.human_activity]);

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

  return (
    <div
      style={{
        border: "2px solid #0f766e",
        borderRadius: 12,
        padding: 16,
        background: "#F8FAFC",
        boxShadow: "0 2px 0 rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ display: "grid", gap: 4 }}>
          <div style={{ fontSize: 14, color: "#111827", fontWeight: 600 }}>RDC ID:</div>
          <a
            href={`/rdc/${activity.drug_id}`}
            style={{ color: "#16A34A", textDecoration: "none", fontWeight: 700 }}
            target="_blank"
            rel="noreferrer"
          >
            {activity.drug_id}
          </a>
        </div>
        <a
          href={`/rdc/${activity.drug_id}`}
          target="_blank"
          rel="noreferrer"
          style={{
            padding: "6px 12px",
            background: "#0f766e",
            border: "2px solid #0f172a",
            color: "#fff",
            borderRadius: 8,
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          RDC Info
        </a>
      </div>
      <div style={{ color: "#111827", fontSize: 16, fontWeight: 700 }}>{activity.drug_name}</div>
      <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ background: "#DCFCE7", color: "#065f46", padding: "4px 8px", borderRadius: 8, fontWeight: 600 }}>
          Status: {renderValue(activity.status)}
        </span>
        <span style={{ background: "#E0F2FE", color: "#1d4ed8", padding: "4px 8px", borderRadius: 8, fontWeight: 600 }}>
          Type: {renderValue(activity.type)}
        </span>
      </div>

      <HumanActivitySection
        items={activity.human_activity ?? []}
        open={openHuman}
        onToggle={() => setOpenHuman((v) => !v)}
        openItems={openHumanItems}
        onToggleItem={(idx) => setOpenHumanItems((prev) => ({ ...prev, [idx]: !(prev[idx] ?? true) }))}
      />

      <AnimalSection
        animal={activity.animal_in_vivo}
        open={openAnimal}
        onToggle={() => setOpenAnimal((v) => !v)}
        openBiodistItems={openBiodistItems}
        onToggleBiodistItem={(idx) => setOpenBiodistItems((prev) => ({ ...prev, [idx]: !(prev[idx] ?? true) }))}
      />

      <InVitroSection data={activity.in_vitro} open={openInVitro} onToggle={() => setOpenInVitro((v) => !v)} />
    </div>
  );
}

export default function ChemicalDetailPage({
  params,
}: {
  params: { entity_category: string; entity_id: string };
}) {
  const { entity_category, entity_id } = params;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<ChemicalDetail | null>(null);
  const [openBasic, setOpenBasic] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/chemical/${encodeURIComponent(entity_category)}/${encodeURIComponent(entity_id)}?include_activity=true`,
          { cache: "no-store" }
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.message || `HTTP ${res.status}`);
        }
        const data = (await res.json()) as ChemicalDetail;
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
  }, [entity_category, entity_id]);

  const basic = detail?.basic;

  const basicRows: Array<[string, ReactNode]> = [
    ["entity_category", basic?.entity_category ?? "-"],
    ["entity_id", basic?.entity_id ?? "-"],
    ["name", basic?.name ?? "-"],
    ["synonyms", basic?.synonyms ?? "-"],
    ["smiles", basic?.smiles ?? "-"],
    ["formula", basic?.formula ?? "-"],
    ["pubchem_cid", basic?.pubchem_cid ?? "-"],
    ["inchi", basic?.inchi ?? "-"],
    ["inchikey", basic?.inchikey ?? "-"],
    ["iupac_name", basic?.iupac_name ?? "-"],
    ["molecular_weight", basic?.molecular_weight ?? "-"],
    ["complexity", basic?.complexity ?? "-"],
    ["heavy_atom_count", basic?.heavy_atom_count ?? "-"],
    ["hbond_acceptors", basic?.hbond_acceptors ?? "-"],
    ["hbond_donors", basic?.hbond_donors ?? "-"],
    ["rotatable_bonds", basic?.rotatable_bonds ?? "-"],
    ["logp", basic?.logp ?? "-"],
    ["tpsa", basic?.tpsa ?? "-"],
    ["linker_type", basic?.linker_type ?? "-"],
    ["radionuclide_symbol", basic?.radionuclide_symbol ?? "-"],
    ["radionuclide_half_life", basic?.radionuclide_half_life ?? "-"],
    ["radionuclide_emission", basic?.radionuclide_emission ?? "-"],
    ["radionuclide_energy", basic?.radionuclide_energy ?? "-"],
  ];

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ margin: 0 }}>Chemical Entity Detail</h1>
      <p style={{ marginTop: 6, color: "#475569" }}>
        Category: {entity_category} | Entity ID: {entity_id}
      </p>

      {error && <p style={{ color: "#b91c1c" }}>错误：{error}</p>}
      {loading && <p>Loading…</p>}

      {!!basic && (
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
            onClick={() => setOpenBasic((v) => !v)}
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
            <span>Basic Information</span>
            <span style={{ fontSize: 16 }}>{openBasic ? "▾" : "▸"}</span>
          </div>
          {openBasic && (
            <div style={{ display: "grid", gap: 12, padding: 12, background: "#fff" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                {["structure_image", "mol2d_path", "mol3d_path"].map((key) => {
                  const val =
                    key === "structure_image" ? basic.structure_image : key === "mol2d_path" ? basic.mol2d_path : basic.mol3d_path;
                  const content =
                    key === "structure_image" && typeof val === "string" ? (
                      <img
                        src={val}
                        alt="structure"
                        style={{ maxWidth: "100%", maxHeight: 200, objectFit: "contain", borderRadius: 6, border: "1px solid #e5e7eb" }}
                      />
                    ) : val ? (
                      <a href={val} target="_blank" rel="noreferrer" style={{ color: "#0ea5e9" }}>
                        {val}
                      </a>
                    ) : (
                      "-"
                    );
                  return <FieldBox key={key} label={key} value={content} />;
                })}
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  {basicRows.map(([label, value], i, arr) => (
                    <tr key={label}>
                      <td
                        style={{
                          padding: "9px 12px",
                          borderTop: i === 0 ? "1px solid #d4d4d8" : "1px solid #e5e7eb",
                          borderBottom: i === arr.length - 1 ? "1px solid #d4d4d8" : "1px solid #e5e7eb",
                          width: "24%",
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
                        {renderValue(value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <section
        style={{
          marginTop: 18,
          background: "#fff",
          border: "2px solid #0f766e",
          borderRadius: 12,
          padding: 14,
          display: "grid",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 18 }}>RDC 活性数据（与该化学实体关联）</div>
          <div style={{ color: "#475569" }}>
            共 {detail?.rdc_activity?.length ?? 0} 条 | 点击卡片查看完整活性数据
          </div>
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          {(detail?.rdc_activity ?? []).map((activity) => (
            <RdcActivityCard key={activity.drug_id} activity={activity} />
          ))}
          {(detail?.rdc_activity ?? []).length === 0 && (
            <div style={{ color: "#64748b", padding: 8 }}>No RDC activity found for this chemical entity.</div>
          )}
        </div>
      </section>
    </main>
  );
}
