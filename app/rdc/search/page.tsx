"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getEntityCategoryColor, PRIMARY_COLOR } from "@/lib/entity-category-colors";

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

type SearchItem = {
  drug_id: string;
  drug_name: string;
  status: string | null;
  type: string | null;
  cold_compound_name: string | null;
  ligand_name: string | null;
  linker_name: string | null;
  chelator_name: string | null;
  radionuclide_name: string | null;
  ligand_ids?: string[];
  ligand_names?: string[];
};

type DetailResponse = {
  chemicals?: {
    entities?: Record<string, Array<{ entity_id: string; name: string }>>;
  };
  targets?: Array<{ target_id: string; name: string | null; external_id: string | null; description: string | null }>;
};

export default function SearchListPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const qParam = useMemo(() => {
    const raw = searchParams?.q;
    return Array.isArray(raw) ? raw[0] ?? "" : raw ?? "";
  }, [searchParams]);

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<SearchItem[]>([]);
  const [details, setDetails] = useState<Record<string, DetailResponse>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setError(null);
      setLoading(true);
      setItems([]);
      setDetails({});
      try {
        const params = new URLSearchParams({ q: qParam, limit: "50" });
        const res = await fetch(`/api/rdc/search?${params}`, { cache: "no-store" });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.message || `HTTP ${res.status}`);
        }
        const data = await res.json();
        const list: SearchItem[] = (data?.items ?? []) as SearchItem[];
        if (cancelled) return;
        setItems(list);

        // Fetch details for each (chemicals and targets summary)
        const detailPairs = await Promise.all(
          list.map(async (it) => {
            const r = await fetch(`/api/rdc/${encodeURIComponent(it.drug_id)}?expand=chemicals&all_entities=true`, {
              cache: "no-store",
            });
            const json = (await r.json()) as DetailResponse;
            return [it.drug_id, json] as const;
          })
        );
        if (cancelled) return;
        setDetails(Object.fromEntries(detailPairs));
      } catch (e: any) {
        if (!cancelled) setError(e?.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (qParam && qParam.trim()) run();
    return () => {
      cancelled = true;
    };
  }, [qParam]);

  function chemicalFirstEntityId(drugId: string, category: string): string | undefined {
    const ents = details[drugId]?.chemicals?.entities?.[category];
    return ents && ents.length > 0 ? ents[0].entity_id : undefined;
  }

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ margin: 0 }}>Search for Radioligand Drug Conjugates</h1>
      <p style={{ marginTop: 6, color: "#475569" }}>You are searching for: {qParam || "(empty)"}</p>

      {error && <p style={{ color: "#b91c1c" }}>Error: {error}</p>}
      {loading && <p>Loading…</p>}

      <div style={{ display: "grid", gap: 16 }}>
        {items.map((it) => {
          const detail = details[it.drug_id];
          const c = detail?.chemicals;

          const line = (
            <div
              key={it.drug_id}
              style={{
                background: "#FFFBEB", // warm light background
                border: "2px solid #1F2937",
                borderRadius: 12,
                padding: 18,
                boxShadow: "0 2px 0 rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, color: "#111827", fontWeight: 600 }}>RDC ID:</div>
                  <a
                    href={`/rdc/${it.drug_id}`}
                    style={{ color: "#16A34A", textDecoration: "none", fontWeight: 700 }}
                  >
                    {it.drug_id}
                  </a>
                </div>
                <a
                  href={`/rdc/${it.drug_id}`}
                  style={{
                    padding: "6px 12px",
                    background: "#fce7f3",
                    border: "1px solid #9D174D",
                    color: "#9D174D",
                    borderRadius: 8,
                    textDecoration: "none",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  RDC Info
                </a>
              </div>

              <hr style={{ border: 0, borderTop: "2px solid #1F2937", margin: "12px 0" }} />

              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", rowGap: 10, columnGap: 12, alignItems: "center" }}>
                <div style={{ color: "#111827" }}>RDC Name： <span style={{ fontWeight: 600 }}>{it.drug_name}</span></div>
                <div>
                  {/* placeholder to keep grid aligned with button column */}
                </div>

                <div style={{ color: "#111827" }}>Drug Status： <span>{it.status ?? "-"}</span></div>
                <div>
                  <a
                    href={`/rdc/${it.drug_id}`}
                    style={{
                      padding: "6px 12px",
                      background: "#fce7f3",
                      border: "1px solid #9D174D",
                      color: "#9D174D",
                      borderRadius: 8,
                      textDecoration: "none",
                      fontSize: 14,
                      fontWeight: 600,
                      display: "inline-block",
                    }}
                  >
                    RDC Info
                  </a>
                </div>

                <div style={{ color: "#111827" }}>Type： {it.type ?? "-"}</div>
                <div />

                <div style={{ color: "#111827" }}>cold compound Name： {it.cold_compound_name ?? "-"}</div>
                <a
                  href={(() => {
                    const id = chemicalFirstEntityId(it.drug_id, "cold_compound");
                    return id ? `/chemical/cold_compound/${id}` : "#";
                  })()}
                  target="_blank"
                  style={{
                    padding: "6px 12px",
                    background: getLightEntityCategoryColor("cold_compound"),
                    border: "1px solid " + getEntityCategoryColor("cold_compound"),
                    borderRadius: 8,
                    textDecoration: "none",
                    color: getEntityCategoryColor("cold_compound"),
                    fontWeight: 600,
                  }}
                >
                  cold compound Info
                </a>

                {it.ligand_names && it.ligand_names.length > 0 ? (
                  it.ligand_names.map((name, idx) => (
                    <React.Fragment key={idx}>
                      <div>ligand Name： {name}</div>
                      <a
                        href={it.ligand_ids?.[idx] ? `/chemical/ligand/${it.ligand_ids[idx]}` : "#"}
                        target="_blank"
                        style={{
                          padding: "6px 12px",
                          background: getLightEntityCategoryColor("ligand"),
                          border: "1px solid " + getEntityCategoryColor("ligand"),
                          borderRadius: 8,
                          textDecoration: "none",
                          color: getEntityCategoryColor("ligand"),
                          fontWeight: 600,
                        }}
                      >
                        ligand Info
                      </a>
                    </React.Fragment>
                  ))
                ) : (
                  <>
                    <div>ligand Name： {it.ligand_name ?? "-"}</div>
                    <a
                      href={(() => {
                        const id = chemicalFirstEntityId(it.drug_id, "ligand");
                        return id ? `/chemical/ligand/${id}` : "#";
                      })()}
                      target="_blank"
                      style={{
                        padding: "6px 12px",
                        background: getLightEntityCategoryColor("ligand"),
                        border: "1px solid " + getEntityCategoryColor("ligand"),
                        borderRadius: 8,
                        textDecoration: "none",
                        color: getEntityCategoryColor("ligand"),
                        fontWeight: 600,
                      }}
                    >
                      ligand Info
                    </a>
                  </>
                )}

                <div>linker Name： {it.linker_name ?? "-"}</div>
                <a
                  href={(() => {
                    const id = chemicalFirstEntityId(it.drug_id, "linker");
                    return id ? `/chemical/linker/${id}` : "#";
                  })()}
                  target="_blank"
                  style={{
                    padding: "6px 12px",
                    background: getLightEntityCategoryColor("linker"),
                    border: "1px solid " + getEntityCategoryColor("linker"),
                    borderRadius: 8,
                    textDecoration: "none",
                    color: getEntityCategoryColor("linker"),
                    fontWeight: 600,
                  }}
                >
                  linker Info
                </a>

                <div>chelator Name： {it.chelator_name ?? "-"}</div>
                <a
                  href={(() => {
                    const id = chemicalFirstEntityId(it.drug_id, "chelator");
                    return id ? `/chemical/chelator/${id}` : "#";
                  })()}
                  target="_blank"
                  style={{
                    padding: "6px 12px",
                    background: getLightEntityCategoryColor("chelator"),
                    border: "1px solid " + getEntityCategoryColor("chelator"),
                    borderRadius: 8,
                    textDecoration: "none",
                    color: getEntityCategoryColor("chelator"),
                    fontWeight: 600,
                  }}
                >
                  chelator Info
                </a>

                <div>radionuclide Name： {it.radionuclide_name ?? "-"}</div>
                <a
                  href={(() => {
                    const id = chemicalFirstEntityId(it.drug_id, "radionuclide");
                    return id ? `/chemical/radionuclide/${id}` : "#";
                  })()}
                  target="_blank"
                  style={{
                    padding: "6px 12px",
                    background: getLightEntityCategoryColor("radionuclide"),
                    border: "1px solid " + getEntityCategoryColor("radionuclide"),
                    borderRadius: 8,
                    textDecoration: "none",
                    color: getEntityCategoryColor("radionuclide"),
                    fontWeight: 600,
                  }}
                >
                  radionuclide Info
                </a>

                <div>target Name： {(() => {
                  const targets = details[it.drug_id]?.targets;
                  return targets && targets.length > 0
                    ? targets.map(t => t.name).filter(Boolean).join(", ")
                    : "-";
                })()}</div>
                <a
                  href={(() => {
                    const targets = details[it.drug_id]?.targets;
                    const firstTarget = targets && targets.length > 0 ? targets[0] : null;
                    return firstTarget?.target_id ? `/target/${firstTarget.target_id}` : "#";
                  })()}
                  target="_blank"
                  style={{
                    padding: "6px 12px",
                    background: "#dbeafe",
                    border: "1px solid #3b82f6",
                    borderRadius: 8,
                    textDecoration: "none",
                    color: "#3b82f6",
                    fontWeight: 600,
                  }}
                >
                  target Info
                </a>
              </div>
            </div>
          );

          return line;
        })}
      </div>
    </main>
  );
}
