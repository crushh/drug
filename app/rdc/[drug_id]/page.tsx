"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
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
import { buildAssetUrl } from "@/lib/assets";

function getLightEntityCategoryColor(category: string) {
  const map: Record<string, string> = {
    cold_compound: "#dcfce7",
    ligand: "#dbeafe",
    linker: "#fef3c7",
    chelator: "#ffedd5",
    radionuclide: "#ede9fe",
  };
  return map[category] ?? "#e0f2fe";
}

type General = {
  drug_id: string;
  external_id: string | null;
  drug_name: string;
  drug_synonyms: string | null;
  status: string | null;
  type: string | null;
  smiles: string | null;
  moa: string | null;
  structure_image: string | null;
  chebi_id: string | null;
  pubchem_cid: string | null;
  pubchem_sid: string | null;
};

type Chemicals = {
  compound_name?: string | null;
  ligand_name?: string | null;
  linker_name?: string | null;
  chelator_name?: string | null;
  radionuclide_name?: string | null;
  mol2d_path?: string | null;
  mol3d_path?: string | null;
  entities?: Record<string, Array<{ entity_id: string; name: string }>>;
};

type TargetItem = {
  target_id: string | null;
  name: string | null;
  external_id: string | null;
  description: string | null;
};

type IndicationItem = {
  indication_id: string | null;
  name: string | null;
  icd11_code: string | null;
  description: string | null;
};

type Detail = {
  general?: General;
  chemicals?: Chemicals;
  targets?: TargetItem[];
  indications?: IndicationItem[];
  human_activity?: HumanActivity[];
  animal_in_vivo?: AnimalInVivo;
  in_vitro?: InVitro;
};

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
  const [openBiologicalContext, setOpenBiologicalContext] = useState(true);
  const [openActivitySection, setOpenActivitySection] = useState(true);
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

  function chemicalFirstEntityId(category: string): string | undefined {
    const ents = detail?.chemicals?.entities?.[category];
    return ents && ents.length > 0 ? ents[0].entity_id : undefined;
  }

  const g = detail?.general;
  const c = detail?.chemicals;
  const targets = detail?.targets ?? [];
  const indications = detail?.indications ?? [];
  const animal = detail?.animal_in_vivo;
  const inVitro = detail?.in_vitro;
  const biodistGroups = useMemo(
    () => groupBiodistributionRows((animal?.studies ?? []).flatMap((s) => s.biodistribution ?? [])),
    [animal?.studies]
  );

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

  const fieldOrDash = (value: string | null | undefined) => {
    const trimmed = typeof value === "string" ? value.trim() : "";
    return trimmed.length > 0 ? trimmed : "-";
  };

  const metadataPillStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 24,
    padding: "3px 8px",
    borderRadius: 999,
    background: "#e0f2fe",
    color: "#075985",
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1.3,
    overflowWrap: "anywhere" as const,
  };

  const renderBiologicalCard = (
    item: TargetItem | IndicationItem,
    idx: number,
    kind: "target" | "indication"
  ) => {
    const isIndication = kind === "indication";
    const primaryMeta = isIndication ? (item as IndicationItem).icd11_code : (item as TargetItem).external_id;
    const itemId = isIndication ? (item as IndicationItem).indication_id : (item as TargetItem).target_id;
    const linkableExternalId = !isIndication && typeof primaryMeta === "string" && primaryMeta.trim().length > 0;

    return (
      <div
        key={`${kind}-${idx}`}
        style={{
          border: "1px solid #dbeafe",
          borderRadius: 8,
          background: idx % 2 === 0 ? "#f8fbff" : "#fff",
          padding: 12,
          display: "grid",
          gap: 8,
          minWidth: 0,
        }}
      >
        <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
          <div style={{ color: "#0f172a", fontSize: 15, fontWeight: 800, lineHeight: 1.35, overflowWrap: "anywhere" }}>
            {fieldOrDash(item.name)}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <span style={metadataPillStyle}>
              {isIndication ? "Indication ID" : "Target ID"}: {fieldOrDash(itemId)}
            </span>
            <span style={metadataPillStyle}>
              {isIndication ? "ICD-11" : "External ID"}:{" "}
              {linkableExternalId ? (
                <a
                  href={`https://ttd.idrblab.cn/data/target/details/${encodeURIComponent(primaryMeta.trim())}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: 2 }}
                >
                  {fieldOrDash(primaryMeta)}
                </a>
              ) : (
                fieldOrDash(primaryMeta)
              )}
            </span>
          </div>
        </div>
        <div style={{ color: "#334155", fontSize: 13, lineHeight: 1.55, overflowWrap: "anywhere" }}>
          {fieldOrDash(item.description)}
        </div>
      </div>
    );
  };

  const renderBiologicalColumn = (
    title: string,
    count: number,
    items: Array<TargetItem | IndicationItem>,
    kind: "target" | "indication"
  ) => (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden", minWidth: 0 }}>
      <div
        style={{
          padding: "9px 12px",
          background: "#f1f5f9",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span style={{ color: "#0f172a", fontWeight: 800 }}>{title}</span>
        <span style={{ color: PRIMARY_COLOR, fontSize: 12, fontWeight: 800 }}>{count}</span>
      </div>
      <div style={{ padding: 12, display: "grid", gap: 10, background: "#fff" }}>
        {items.length > 0 ? (
          items.map((item, idx) => renderBiologicalCard(item, idx, kind))
        ) : (
          <div style={{ color: "#64748b", fontSize: 13 }}>No data.</div>
        )}
      </div>
    </div>
  );

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ margin: 0 }}>RDCInfo Detail Page</h1>
      <p style={{ marginTop: 6, color: "#475569" }}>Drug ID: {drugId}</p>

      {error && <p style={{ color: "#b91c1c" }}>Error: {error}</p>}
      {loading && <p>Loading…</p>}

      {!!g && (
        <section
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
            <span>General Information of This RDC</span>
            <span style={{ fontSize: 16 }}>{openGeneral ? "▾" : "▸"}</span>
          </div>
          {openGeneral && (
            <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse", background: "#fff" ,padding:10}}>
	              <tbody>
	                {[
                  ["drug_id", g.drug_id],
                  ["external_id", g.external_id ?? "-"],
                  ["drug_name", g.drug_name],
                  ["drug_synonyms", g.drug_synonyms ?? "-"],
                  ["status", g.status ?? "-"],
                  ["indication", indications && indications.length > 0
                    ? indications.map((ind: IndicationItem, idx: number) => `${ind.indication_id || "-"} | ${ind.name || "-"} | ${ind.icd11_code || "-"}`).join("; ")
                    : "-"],
                  ["smiles", g.smiles ?? "-"],
	                  ["moa", g.moa ?? "-"],
	                  ["structure_image", g.structure_image ?? "-"],
	                  ["cold compound Name", c?.compound_name ?? "-"],
	                  ["ligand Name", c?.ligand_name ?? "-"],
	                  ["linker Name", c?.linker_name ?? "-"],
	                  ["chelator Name", c?.chelator_name ?? "-"],
	                  ["radionuclide Name", c?.radionuclide_name ?? "-"],
	                  ["chebi_id", g.chebi_id ?? "-"],
                    ["radiochemical_method_description", (g as any).radiochemical_method_description ?? "-"],
	                  ["radiochemical_yield", (g as any).radiochemical_yield ?? "-"],
	                  ["radiochemical_purity", (g as any).radiochemical_purity ?? "-"],
	                  ["specific_activity", (g as any).specific_activity ?? "-"],
	                  ["pubchem_cid", g.pubchem_cid ?? "-"],
	                  ["pubchem_sid", g.pubchem_sid ?? "-"],
	                ].map(([label, value], i, arr) => {
	                  const isCold = label === "cold compound Name";
	                  const isLigand = label === "ligand Name";
	                  const isLinker = label === "linker Name";
	                  const isChelator = label === "chelator Name";
	                  const isRadionuclide = label === "radionuclide Name";
                    const isChebiId = label === "chebi_id";
                    const isPubchemCid = label === "pubchem_cid";
                    const isPubchemSid = label === "pubchem_sid";

	                  let content: any = value as any;

                  if (label === "structure_image" && value && value !== "-") {
                    const assetBase = process.env.NEXT_PUBLIC_ASSET_BASE ?? "";
                    const imgSrc = (value as string).startsWith("http")
                      ? (value as string)
                      : `${assetBase}/structure/${value as string}.png`;
                    const mol2dName = c?.mol2d_path ? c.mol2d_path : null;
                    const mol3dName = c?.mol3d_path ? c.mol3d_path : null;
                    const mol2d = buildAssetUrl(mol2dName, "rdc_2d", "cdxml");
                    const mol3d = buildAssetUrl(mol3dName, "rdc_3d", "sdf");
                    content = (
                      <div>
                        <img
                          src={imgSrc}
                          alt="Structure"
                          style={{ maxWidth: "100%", maxHeight: 300, objectFit: "contain", display: "block" }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                        <div style={{ display: "flex", justifyContent: "center", gap: 40, flexWrap: "wrap", marginTop: 8 }}>
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
                              <span>3D SDF</span>
                            </a>
                          ) : (
                            <span style={{ color: "#94a3b8" }}>3D SDF not available</span>
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
                    );
                  }

                  if (isCold || isLigand || isLinker || isChelator || isRadionuclide) {
	                    let category = "";
	                    let buttonLabel = "";

	                    if (isCold) {
	                      category = "cold_compound";
	                      buttonLabel = "cold compound Info";
	                    } else if (isLigand) {
	                      category = "ligand";
	                      buttonLabel = "ligand Info";
	                    } else if (isLinker) {
	                      category = "linker";
	                      buttonLabel = "linker Info";
	                    } else if (isChelator) {
	                      category = "chelator";
	                      buttonLabel = "chelator Info";
	                    } else if (isRadionuclide) {
	                      category = "radionuclide";
	                      buttonLabel = "radionuclide Info";
	                    }

	                    const entityId = category ? chemicalFirstEntityId(category) : undefined;

	                    if (entityId && category) {
                      const color = getEntityCategoryColor(category);
                      const bgColor = getLightEntityCategoryColor(category);
                      content = (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 12,
                            minWidth: 0,
                          }}
                        >
                          <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>{value as any}</span>
                          <a
                            href={`/chemical/${category}/${encodeURIComponent(entityId)}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              padding: "6px 12px",
                              borderRadius: 8,
                              textDecoration: "none",
                              fontSize: 14,
                              fontWeight: 600,
                              background: bgColor,
                              border: `1px solid ${color}`,
                              color: color,
                              display: "inline-block",
                              flexShrink: 0,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {buttonLabel}
                          </a>
                        </div>
                      );
                    }
	                  }

                    if (isChebiId || isPubchemCid || isPubchemSid) {
                      const idValue = typeof value === "string" ? value.trim() : "";
                      if (idValue && idValue !== "-") {
                        let href = "";
                        if (isChebiId) {
                          href = `https://www.ebi.ac.uk/chembl/explore/compound/${encodeURIComponent(idValue)}`;
                        } else if (isPubchemCid) {
                          href = `https://pubchem.ncbi.nlm.nih.gov/compound/${encodeURIComponent(idValue)}`;
                        } else {
                          href = `https://pubchem.ncbi.nlm.nih.gov/substance/${encodeURIComponent(idValue)}`;
                        }

                        content = (
                          <a
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: "#0ea5e9", fontWeight: 700, textDecoration: "none", overflowWrap: "anywhere" }}
                          >
                            {idValue} ↗
                          </a>
                        );
                      }
                    }

	                  return (
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
                            overflowWrap: "anywhere",
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
                            overflowWrap: "anywhere",
	                        }}
	                      >
	                        {content}
	                      </td>
	                    </tr>
	                  );
	                })}
	              </tbody>
	            </table>
          )}
        </section>
      )}

      {!!g && (
        <section
          style={{
            marginTop: 16,
            background: "#F8FAFC",
            border: `1px solid ${PRIMARY_COLOR}`,
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <div
            onClick={() => setOpenBiologicalContext((v) => !v)}
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
            <span>Biological Context</span>
            <span style={{ fontSize: 16 }}>{openBiologicalContext ? "▾" : "▸"}</span>
          </div>
          {openBiologicalContext && (
            <div
              style={{
                padding: 12,
                background: "#fff",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 12,
              }}
            >
              {renderBiologicalColumn("Targets", targets.length, targets, "target")}
              {renderBiologicalColumn("Indications", indications.length, indications, "indication")}
            </div>
          )}
        </section>
      )}

	      <section
	        style={{
	          marginTop: 16,
	          background: "#F8FAFC",
	          border: `1px solid ${PRIMARY_COLOR}`,
	          borderRadius: 10,
	          overflow: "hidden",
	        }}
	      >
	        <div
	          onClick={() => setOpenActivitySection((v) => !v)}
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
	          <span>Full List of Activity Data of This RDC</span>
	          <span style={{ fontSize: 16 }}>{openActivitySection ? "▾" : "▸"}</span>
	        </div>

	        {openActivitySection && (
	          <div style={{ padding: 12, background: "#fff", display: "grid", gap: 12 }}>
	            <HumanActivitySection
	              items={detail?.human_activity ?? []}
	              open={openHuman}
	              onToggle={() => setOpenHuman((v) => !v)}
	              openItems={openHumanItems}
	              onToggleItem={(idx) =>
	                setOpenHumanItems((prev) => ({ ...prev, [idx]: !(prev[idx] ?? true) }))
	              }
	            />

	            <AnimalSection
	              animal={animal}
	              open={openAnimal}
	              onToggle={() => setOpenAnimal((v) => !v)}
	              openBiodistItems={openBiodistItems}
	              onToggleBiodistItem={(idx) =>
	                setOpenBiodistItems((prev) => ({ ...prev, [idx]: !(prev[idx] ?? true) }))
	              }
	            />

	            <InVitroSection
	              data={inVitro}
	              open={openInVitro}
	              onToggle={() => setOpenInVitro((v) => !v)}
	            />
	          </div>
	        )}
	      </section>

      {/* References */}
      <section
        style={{
          marginTop: 16,
          background: "#F8FAFC",
          border: `1px solid ${PRIMARY_COLOR}`,
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
            background: PRIMARY_COLOR,
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
                      <div style={{ color: PRIMARY_COLOR, fontWeight: 700, fontStyle: "italic" }}>{`Ref ${idx + 1}`}</div>
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
                            <div style={{ color: PRIMARY_COLOR, fontSize: 12 }}>Note: {ref.relation_note}</div>
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
