"use client";

import { useEffect, useMemo, useState } from "react";

type SearchItem = { drug_id: string; drug_name: string; status: string | null };

type DetailResponse = {
  general?: {
    drug_id: string;
    drug_name: string;
    status: string | null;
    type: string | null;
  };
  chemicals?: {
    compound_name?: string | null;
    ligand_name?: string | null;
    linker_name?: string | null;
    chelator_name?: string | null;
    radionuclide_name?: string | null;
    entities?: Record<string, Array<{ entity_id: string; name: string }>>;
  };
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

        // Fetch details for each (chemicals summary)
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

      {error && <p style={{ color: "#b91c1c" }}>错误：{error}</p>}
      {loading && <p>Loading…</p>}

      <div style={{ display: "grid", gap: 16 }}>
        {items.map((it) => {
          const d = details[it.drug_id];
          const g = d?.general;
          const c = d?.chemicals;

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
                    background: "#FBCFE8",
                    border: "2px solid #9D174D",
                    color: "#111827",
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
                <div style={{ color: "#111827" }}>RDC Name： <span style={{ fontWeight: 600 }}>{g?.drug_name ?? it.drug_name}</span></div>
                <div>
                  {/* placeholder to keep grid aligned with button column */}
                </div>

                <div style={{ color: "#111827" }}>Drug Status： <span>{g?.status ?? it.status ?? "-"}</span></div>
                <div>
                  <a
                    href={`/rdc/${it.drug_id}`}
                    style={{
                      padding: "6px 12px",
                      background: "#FBCFE8",
                      border: "2px solid #9D174D",
                      color: "#111827",
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

                <div style={{ color: "#fb923c" }}>Type： {g?.type ?? "-"}</div>
                <div />

                <div style={{ color: "#16a34a" }}>cold compound Name： {c?.compound_name ?? "-"}</div>
                <a
                  href={(() => {
                    const id = chemicalFirstEntityId(it.drug_id, "compound");
                    return id ? `/api/chemical/compound/${id}` : "#";
                  })()}
                  target="_blank"
                  style={{ padding: "6px 12px", background: "#A7F3D0", border: "2px solid #047857", borderRadius: 8, textDecoration: "none", color: "#064e3b", fontWeight: 600 }}
                >
                  cold compound Info
                </a>

                <div>ligand Name： {c?.ligand_name ?? "-"}</div>
                <a
                  href={(() => {
                    const id = chemicalFirstEntityId(it.drug_id, "ligand");
                    return id ? `/api/chemical/ligand/${id}` : "#";
                  })()}
                  target="_blank"
                  style={{ padding: "6px 12px", background: "#BFDBFE", border: "2px solid #1D4ED8", borderRadius: 8, textDecoration: "none", color: "#1e3a8a", fontWeight: 600 }}
                >
                  ligand Info
                </a>

                <div>linker Name： {c?.linker_name ?? "-"}</div>
                <a
                  href={(() => {
                    const id = chemicalFirstEntityId(it.drug_id, "linker");
                    return id ? `/api/chemical/linker/${id}` : "#";
                  })()}
                  target="_blank"
                  style={{ padding: "6px 12px", background: "#FDE68A", border: "2px solid #B45309", borderRadius: 8, textDecoration: "none", color: "#7c2d12", fontWeight: 600 }}
                >
                  linker Info
                </a>

                <div>chelator Name： {c?.chelator_name ?? "-"}</div>
                <a
                  href={(() => {
                    const id = chemicalFirstEntityId(it.drug_id, "chelator");
                    return id ? `/api/chemical/chelator/${id}` : "#";
                  })()}
                  target="_blank"
                  style={{ padding: "6px 12px", background: "#FCD34D", border: "2px solid #92400E", borderRadius: 8, textDecoration: "none", color: "#7c2d12", fontWeight: 600 }}
                >
                  chelator Info
                </a>

                <div>radionuclide Name： {c?.radionuclide_name ?? "-"}</div>
                <a
                  href={(() => {
                    const id = chemicalFirstEntityId(it.drug_id, "radionuclide");
                    return id ? `/api/chemical/radionuclide/${id}` : "#";
                  })()}
                  target="_blank"
                  style={{ padding: "6px 12px", background: "#DDD6FE", border: "2px solid #6D28D9", borderRadius: 8, textDecoration: "none", color: "#1e3a8a", fontWeight: 600 }}
                >
                  radionuclide Info
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
