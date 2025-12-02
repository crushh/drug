"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import { getEntityCategoryColor, PRIMARY_COLOR } from "@/lib/entity-category-colors";

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

type RdcSummary = {
  drug_id: string;
  drug_name: string;
  status: string | null;
  compound_name: string | null;
  ligand_name: string | null;
  linker_name: string | null;
  chelator_name: string | null;
  radionuclide_name: string | null;
};

type ChemicalDetail = {
  basic?: Basic;
  rdc_activity?: RdcActivity[];
  rdcs?: RdcSummary[];
};

const ASSET_BASE = (process.env.NEXT_PUBLIC_ASSET_BASE ?? "").replace(/\/+$/, "");

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

function buildAssetUrl(path?: string | null, folder?: string) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.replace(/^\/+/, "");
  const prefix = folder ? `${folder.replace(/\/+$/, "")}/` : "";
  const base = ASSET_BASE ? `${ASSET_BASE}/` : "";
  return `${base}${prefix}${normalized}`;
}

function RdcActivityCard({ activity }: { activity: RdcActivity }) {
  const [openHuman, setOpenHuman] = useState(true);
  const [openHumanItems, setOpenHumanItems] = useState<Record<number, boolean>>({});
  const [openAnimal, setOpenAnimal] = useState(true);
  const [openBiodistItems, setOpenBiodistItems] = useState<Record<number, boolean>>({});
  const [openInVitro, setOpenInVitro] = useState(true);
  const [open, setOpen] = useState(true);

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
    <div style={{ overflow: "hidden" }}>
      <div
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px",
          background: "#1fa1a8",
          color: "#fff",
          cursor: "pointer",
          borderRadius: "4px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700 }}>
          <span style={{ fontSize: 16 }}>{open ? "▾" : "▸"}</span>
          <span style={{ fontSize: 15 }}>
            {activity.drug_name} [{activity.status ?? "-"}]
          </span>
        </div>
        <a
          href={`/rdc/${activity.drug_id}`}
          target="_blank"
          rel="noreferrer"
          style={{
            padding: "6px 12px",
            background: PRIMARY_COLOR,
            boxShadow: "4px 3px 0 0 #565656",
            color: "#fff",
            borderRadius: 8,
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 700,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          RDC Info
        </a>
      </div>

      {open && (
        <div style={{ display: "grid" }}>

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
      )}
    </div>
  );
}

export default function ChemicalDetailPage({
  params,
}: {
  params: { entity_category: string; entity_id: string };
}) {
  const { entity_category, entity_id } = params;
  const mainColor = getEntityCategoryColor(entity_category);
  const isSummaryOnlyCategory =
    entity_category === "ligand" || entity_category === "chelator" || entity_category === "radionuclide";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<ChemicalDetail | null>(null);
  const [openBasic, setOpenBasic] = useState(true);
  const [openRdcSection, setOpenRdcSection] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const url = isSummaryOnlyCategory
          ? `/api/chemical/${encodeURIComponent(entity_category)}/${encodeURIComponent(
              entity_id
            )}/rdc-list`
          : `/api/chemical/${encodeURIComponent(entity_category)}/${encodeURIComponent(
              entity_id
            )}?include_activity=true`;
        const res = await fetch(url, { cache: "no-store" });
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
  }, [entity_category, entity_id, isSummaryOnlyCategory]);

  const basic = detail?.basic;
  const rdcActivity = detail?.rdc_activity ?? [];
  const rdcList = detail?.rdcs ?? [];

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
    <main>
      {/* <h1 style={{ margin: 0 }}>Chemical Entity Detail</h1>
      <p style={{ marginTop: 6, color: "#475569" }}>
        Category: {entity_category} | Entity ID: {entity_id}
      </p> */}

      {error && <p style={{ color: "#b91c1c" }}>错误：{error}</p>}
      {loading && <p>Loading…</p>}

      {!!basic && (
        <section
          style={{
            marginTop: 16,
            background: "#F8FAFC",
            border: `1px solid ${mainColor}`,
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
              background: mainColor,
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <span>General Information of this {entity_category}  </span>
            <span style={{ fontSize: 16 }}>{openBasic ? "▾" : "▸"}</span>
          </div>
          {openBasic && (
            <div style={{ display: "grid", gap: 12, padding: 12, background: "#fff" }}>
              {(() => {
                const structureName =
                  typeof basic.structure_image === "string" && basic.structure_image
                    ? `${basic.structure_image}.png`
                    : null;
                const structureUrl = buildAssetUrl(structureName, "structure");
                const displayStructureUrl = structureUrl ? `${structureUrl}?imageMogr2/format/png` : null;
                const mol2dName = typeof basic.mol2d_path === "string" && basic.mol2d_path ? `${basic.mol2d_path}.mol` : null;
                const mol3dName = typeof basic.mol3d_path === "string" && basic.mol3d_path ? `${basic.mol3d_path}.sdf` : null;
                const mol2d = buildAssetUrl(mol2dName, "rdc_2d");
                const mol3d = buildAssetUrl(mol3dName, "rdc_3d");
                return (
                  <div style={{ width: "100%", overflowX: "auto" }}>
                    <table style={{ width: "100%", minWidth: 360, borderCollapse: "collapse" }}>
                      <tbody>
                        {basicRows.map(([label, value], i, arr) => {
                          const row = (
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
                                  wordBreak: "break-word",
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
                                  wordBreak: "break-word",
                                }}
                              >
                                {renderValue(value)}
                              </td>
                            </tr>
                          );

                          if (label !== "synonyms") {
                            return row;
                          }

                          return (
                            <React.Fragment key={label}>
                              {row}
                              <tr>
                                <td
                                  style={{
                                    padding: "12px",
                                    borderTop: "1px solid #e5e7eb",
                                    borderBottom: "1px solid #e5e7eb",
                                    width: "24%",
                                    fontWeight: 700,
                                    color: "#0f172a",
                                    fontSize: 14,
                                    verticalAlign: "top",
                                    wordBreak: "break-word",
                                  }}
                                >
                                  Structure
                                </td>
                                <td
                                  style={{
                                    borderTop: "1px solid #e5e7eb",
                                    borderBottom: "1px solid #e5e7eb",
                                    color: "#0f172a",
                                    fontSize: 14,
                                    lineHeight: 1.5,
                                    wordBreak: "break-word",
                                  }}
                                >
                                  <div
                                    style={{
                                      borderRadius: 10,
                                      padding: 12,
                                      display: "grid",
                                      gap: 10,
                                    }}
                                  >
                                    <div
                                      style={{
                                        minHeight: 220,
                                        border: "1px solid #e5e7eb",
                                        borderRadius: 8,
                                        background: "#fff",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        padding: 12,
                                      }}
                                    >
                                    {structureUrl ? (
                                      <img
                                        src={structureUrl}
                                        alt="structure"
                                        style={{
                                          width: "100%",
                                          height: "100%",
                                          maxWidth: "min(766px, 100%)",
                                            objectFit: "contain",
                                            borderRadius: 4,
                                          }}
                                        />
                                      ) : (
                                        <span style={{ color: "#94a3b8" }}>No structure image</span>
                                      )}
                                    </div>
                                    <div style={{ height: 1, background: "#e2e8f0", margin: "4px 0" }} />
                                    <div style={{ display: "flex", justifyContent: "center", gap: 40, flexWrap: "wrap" }}>
                                      {mol3d ? (
                                        <a
                                          href={mol3d}
                                          download
                                          style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 6,
                                            color: "#0f9e9e",
                                            fontWeight: 700,
                                            textDecoration: "none",
                                          }}
                                        >
                                          <span style={{ fontSize: 18 }}>⬇</span>
                                          <span>3D MOL</span>
                                        </a>
                                      ) : (
                                        <span style={{ color: "#94a3b8" }}>3D MOL not available</span>
                                      )}
                                      {mol2d ? (
                                        <a
                                          href={mol2d}
                                          download
                                          style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 6,
                                            color: "#0f9e9e",
                                            fontWeight: 700,
                                            textDecoration: "none",
                                          }}
                                        >
                                          <span style={{ fontSize: 18 }}>⬇</span>
                                          <span>2D MOL</span>
                                        </a>
                                      ) : (
                                        <span style={{ color: "#94a3b8" }}>2D MOL not available</span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          )}
        </section>
      )}

      {!isSummaryOnlyCategory && (
        <section
          style={{
            marginTop: 16,
            background: "#F8FAFC",
            border: `1px solid ${mainColor}`,
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <div
            onClick={() => setOpenRdcSection((v) => !v)}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 12px",
              background: mainColor,
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <span>Full Information of The Activity Data of The RDC(s) Related to This {entity_category} </span>
            <span style={{ fontSize: 16 }}>{openRdcSection ? "▾" : "▸"}</span>
          </div>

          {openRdcSection && (
            <div
              style={{
                display: "grid",
                gap: 14,
                padding: 10,
              }}
            >
              {rdcActivity.map((activity) => (
                <RdcActivityCard key={activity.drug_id} activity={activity} />
              ))}
              {rdcActivity.length === 0 && (
                <div style={{ color: "#64748b", padding: 8 }}>No RDC activity found for this chemical entity.</div>
              )}
            </div>
          )}
        </section>
      )}

      {isSummaryOnlyCategory && (
        <section
          style={{
            marginTop: 16,
            background: "#F8FAFC",
            border: `1px solid ${mainColor}`,
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <div
            onClick={() => setOpenRdcSection((v) => !v)}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 12px",
              background: mainColor,
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <span>与此目标相关的 RDC 完整列表</span>
            <span style={{ fontSize: 16 }}>{openRdcSection ? "▾" : "▸"}</span>
          </div>

          {openRdcSection && (
            <div
              style={{
                padding: 12,
                background: "#fff",
              }}
            >
              <div
                style={{
                  overflow: "hidden",
                  background: "#fff",
                }}
              >
                <div
                  style={{
                    padding: "8px 12px",
                    fontWeight: 700,
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      minWidth: 720,
                    }}
                  >
                    <thead>
                      <tr>
                        {[
                          "RDC Info",
                          "RDC Name",
                          "cold compound",
                          "ligand",
                          "linker",
                          "chelator",
                          "radionuclide",
                        ].map((label, idx) => (
                          <th
                            key={label}
                            style={{
                              padding: "10px 12px",
                              borderBottom: "1px solid #e5e7eb",
                              textAlign: label === "RDC Info" ? "left" : "center",
                              fontSize: 14,
                              fontWeight: 600,
                              color: "#111827",
                              whiteSpace: "nowrap",
                              position: idx === 0 ? "sticky" as const : undefined,
                              left: idx === 0 ? 0 : undefined,
                              zIndex: idx === 0 ? 2 : undefined,
                              background: idx === 0 ? "#fff" : undefined,
                            }}
                          >
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rdcList.map((item) => (
                        <tr key={item.drug_id}>
                          <td
                            style={{
                              padding: "12px",
                              borderBottom: "1px solid #e5e7eb",
                              position: "sticky",
                              left: 0,
                              zIndex: 1,
                              background: "#fff",
                            }}
                          >
                            <a
                              href={`/rdc/${encodeURIComponent(item.drug_id)}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                padding: "6px 12px",
                                background: PRIMARY_COLOR,
                                borderRadius: 8,
                                boxShadow: "rgb(86, 86, 86) 4px 3px 0px 0px",
                                textDecoration: "none",
                                color: "#fff",
                                fontSize: 14,
                                fontWeight: 700,
                                display: "inline-block",
                              }}
                            >
                              RDC
                            </a>
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              borderBottom: "1px solid #e5e7eb",
                              fontSize: 14,
                              color: "#111827",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.drug_name || "-"}
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              borderBottom: "1px solid #e5e7eb",
                              fontSize: 14,
                              color: "#111827",
                              textAlign: "center",
                            }}
                          >
                            {item.compound_name || "-"}
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              borderBottom: "1px solid #e5e7eb",
                              fontSize: 14,
                              color: "#111827",
                              textAlign: "center",
                            }}
                          >
                            {item.ligand_name || "-"}
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              borderBottom: "1px solid #e5e7eb",
                              fontSize: 14,
                              color: "#111827",
                              textAlign: "center",
                            }}
                          >
                            {item.linker_name || "-"}
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              borderBottom: "1px solid #e5e7eb",
                              fontSize: 14,
                              color: "#111827",
                              textAlign: "center",
                            }}
                          >
                            {item.chelator_name || "-"}
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              borderBottom: "1px solid #e5e7eb",
                              fontSize: 14,
                              color: "#111827",
                              textAlign: "center",
                            }}
                          >
                            {item.radionuclide_name || "-"}
                          </td>
                        </tr>
                      ))}
                      {rdcList.length === 0 && (
                        <tr>
                          <td
                            colSpan={7}
                            style={{
                              padding: "14px 12px",
                              textAlign: "center",
                              fontSize: 14,
                              color: "#64748b",
                            }}
                          >
                            No RDC found for this chemical entity.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
