"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getEntityCategoryColor, PRIMARY_COLOR } from "@/lib/entity-category-colors";

type StatusOption = { value: string; label: string };
type DrugItem = { drug_id: string; drug_name: string; status: string | null };
type ChemicalItem = { entity_id: string; name: string };

type ChemicalEntityCategory = "cold_compound" | "ligand" | "linker" | "chelator" | "radionuclide";
type SearchTabKey = "rdc" | ChemicalEntityCategory;

function makeAlphaColor(hex: string, alphaHex: string) {
  if (/^#([0-9a-fA-F]{6})$/.test(hex)) {
    return `${hex}${alphaHex}`;
  }
  return hex;
}

function getChemicalLabel(category: ChemicalEntityCategory) {
  switch (category) {
    case "cold_compound":
      return "Compound";
    case "ligand":
      return "Ligand";
    case "linker":
      return "Linker";
    case "chelator":
      return "Chelator";
    case "radionuclide":
      return "Radionuclide";
    default:
      return category;
  }
}

function TileMenu({ activeKey, onSelect }: { activeKey: SearchTabKey; onSelect: (key: SearchTabKey) => void }) {
  const items = useMemo<Array<{ key: SearchTabKey; label: string }>>(
    () => [
      { key: "rdc", label: "Search for RDC" },
      { key: "cold_compound", label: "Search for Compound" },
      { key: "ligand", label: "Search for Ligand" },
      { key: "linker", label: "Search for Linker" },
      { key: "chelator", label: "Search for Chelator" },
      { key: "radionuclide", label: "Search for Radionuclide" },
    ],
    []
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
      {items.map((it) => (
        <button
          key={it.key}
          type="button"
          onClick={() => onSelect(it.key)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 88,
            borderRadius: 12,
            border: (() => {
              const base =
                it.key === "rdc"
                  ? PRIMARY_COLOR
                  : getEntityCategoryColor(it.key as ChemicalEntityCategory);
              const width = it.key === activeKey ? 2 : 1;
              return `${width}px solid ${base}`;
            })(),
            background: (() => {
              if (it.key === activeKey) {
                const base =
                  it.key === "rdc"
                    ? PRIMARY_COLOR
                    : getEntityCategoryColor(it.key as ChemicalEntityCategory);
                return makeAlphaColor(base, "1A");
              }
              return "#fff";
            })(),
            textDecoration: "none",
            color:
              it.key === "rdc"
                ? "#0f172a"
                : getEntityCategoryColor(it.key as ChemicalEntityCategory),
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            cursor: "pointer",
          }}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

export default function HomePage() {
  // Top fuzzy search
  const [q, setQ] = useState("");
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SearchTabKey>("rdc");

  // Bottom dependent selects
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);
  const [statusLoading, setStatusLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [namesLoading, setNamesLoading] = useState(false);
  const [namesByStatus, setNamesByStatus] = useState<DrugItem[]>([]);
  const [selectedDrugName, setSelectedDrugName] = useState("");

  // Chemical entity search state
  const [chemicalQ, setChemicalQ] = useState("");
  const [chemicalItems, setChemicalItems] = useState<ChemicalItem[]>([]);
  const [chemicalLoading, setChemicalLoading] = useState(false);

  const isRdcMode = activeTab === "rdc";

  // Load status dict on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatusLoading(true);
      try {
        const res = await fetch(`/api/rdc/init`, { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) {
          const opts: StatusOption[] = (data?.dicts?.status ?? []) as StatusOption[];
          setStatusOptions(opts);
        }
      } catch (e) {
        // ignore in UI
      } finally {
        if (!cancelled) setStatusLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Reset chemical search when tab changes
  useEffect(() => {
    setChemicalQ("");
    setChemicalItems([]);
    setChemicalLoading(false);
  }, [activeTab]);

  function doSearch(keywordOverride?: string) {
    const keyword = (keywordOverride ?? q).trim();
    if (!keyword) return;
    const params = new URLSearchParams({ q: keyword });
    router.push(`/rdc/search?${params.toString()}`);
  }

  async function onStatusChange(value: string) {
    setSelectedStatus(value);
    setSelectedDrugName("");
    setNamesByStatus([]);
    if (!value) return;
    setNamesLoading(true);
    try {
      const params = new URLSearchParams({ status: value, limit: "200" });
      const res = await fetch(`/api/rdc/by-status?${params}`, { cache: "no-store" });
      const data = await res.json();
      setNamesByStatus((data?.items ?? []) as DrugItem[]);
    } catch (e) {
      // ignore in UI
    } finally {
      setNamesLoading(false);
    }
  }

  function resetStatus() {
    setSelectedStatus("");
    setNamesByStatus([]);
    setSelectedDrugName("");
  }

  async function doChemicalSearch(keywordOverride?: string) {
    if (activeTab === "rdc") return;
    const entityCategory = activeTab as ChemicalEntityCategory;
    const keyword = (keywordOverride ?? chemicalQ).trim();
    if (!keyword) return;

    setChemicalLoading(true);
    try {
      const params = new URLSearchParams({
        entity_category: entityCategory,
        q: keyword,
        limit: "20",
      });
      const res = await fetch(`/api/chemical/search?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) {
        // 简单忽略错误，不在首页弹错误框
        setChemicalItems([]);
        return;
      }
      const data = await res.json();
      setChemicalItems((data?.items ?? []) as ChemicalItem[]);
    } catch {
      // ignore in UI
      setChemicalItems([]);
    } finally {
      setChemicalLoading(false);
    }
  }

  return (
    <main style={{ padding: "24px" }}>
      <h1 style={{ margin: 0, marginBottom: 12 }}>RDC Portal</h1>
      <p style={{ marginTop: 0, color: "#475569" }}>快速查找放射性药物缀合体（RDC）与相关实体。</p>

      {/* Top: six submenu tiles */}
      <TileMenu activeKey={activeTab} onSelect={setActiveTab} />

      {isRdcMode ? (
        <>
          {/* Search for RDC name */}
          <section
            style={{
              marginTop: 18,
              background: "#e6fffb",
              border: "1px solid #99f6e4",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <h3 style={{ marginTop: 0 }}>Search for RDC:</h3>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                aria-label="RDC Name"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") doSearch();
                }}
                placeholder="输入 RDC 名称，按 Enter 搜索"
                style={{
                  flex: 1,
                  height: 40,
                  padding: "0 12px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  outline: "none",
                }}
              />
              <button
                onClick={() => doSearch()}
                disabled={!q.trim()}
                style={{
                  height: 40,
                  padding: "0 16px",
                  borderRadius: 8,
                  border: 0,
                  background: "#0ea5e9",
                  color: "#fff",
                  cursor: "pointer",
                  opacity: !q.trim() ? 0.6 : 1,
                }}
              >
                Search
              </button>
            </div>
          </section>

          {/* Search by Status */}
          <section
            style={{
              marginTop: 18,
              background: "#ecfeff",
              border: "1px solid #bae6fd",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <h3 style={{ marginTop: 0 }}>Search for RDC Entries by Status:</h3>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
              Tips: 先选择状态，再选择 RDC 名称。
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
              <select
                aria-label="Select status"
                value={selectedStatus}
                onChange={(e) => onStatusChange(e.target.value)}
                disabled={statusLoading}
                style={{
                  flex: 1,
                  height: 40,
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  padding: "0 12px",
                  background: "#fff",
                }}
              >
                <option value="">Step 1: 请选择一个状态</option>
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                onClick={resetStatus}
                style={{
                  height: 40,
                  padding: "0 16px",
                  borderRadius: 8,
                  border: 0,
                  background: "#22c55e",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Reset
              </button>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select
                aria-label="Select RDC name"
                value={selectedDrugName}
                onChange={(e) => setSelectedDrugName(e.target.value)}
                disabled={!selectedStatus || namesLoading}
                style={{
                  flex: 1,
                  height: 40,
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  padding: "0 12px",
                  background: "#fff",
                }}
              >
                <option value="">Step 2: 请选择一个 RDC 名称</option>
                {namesByStatus.map((it) => (
                  <option key={it.drug_id} value={it.drug_name}>
                    {it.drug_name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => doSearch(selectedDrugName)}
                disabled={!selectedDrugName}
                style={{
                  height: 40,
                  padding: "0 16px",
                  borderRadius: 8,
                  border: 0,
                  background: "#0ea5e9",
                  color: "#fff",
                  cursor: "pointer",
                  opacity: selectedDrugName ? 1 : 0.6,
                }}
              >
                Search
              </button>
            </div>
          </section>
        </>
      ) : (
        (() => {
          const entityCategory = activeTab as ChemicalEntityCategory;
          const label = getChemicalLabel(entityCategory);
          const accentColor = getEntityCategoryColor(entityCategory);
          return (
            <section
              style={{
                marginTop: 18,
                background: makeAlphaColor(accentColor, "14"),
                border: `1px solid ${accentColor}`,
                borderRadius: 12,
                padding: 16,
              }}
            >
              <h3 style={{ marginTop: 0 }}>{`Search for ${label}:`}</h3>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
                {`Tips: 输入 ${label} 名称，按 Enter 搜索，点击结果进入详情页。`}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  aria-label={`${label} Name`}
                  value={chemicalQ}
                  onChange={(e) => setChemicalQ(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") doChemicalSearch();
                  }}
                  placeholder={`输入 ${label} 名称，按 Enter 搜索`}
                  style={{
                    flex: 1,
                    height: 40,
                    padding: "0 12px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    outline: "none",
                  }}
                />
                <button
                  onClick={() => doChemicalSearch()}
                  disabled={!chemicalQ.trim() || chemicalLoading}
                  style={{
                    height: 40,
                    padding: "0 16px",
                    borderRadius: 8,
                    border: 0,
                    background: accentColor,
                    color: "#fff",
                    cursor: "pointer",
                    opacity: !chemicalQ.trim() || chemicalLoading ? 0.6 : 1,
                  }}
                >
                  {chemicalLoading ? "Searching..." : "Search"}
                </button>
              </div>

              <div style={{ marginTop: 12 }}>
                {!chemicalLoading && chemicalItems.length === 0 && chemicalQ.trim() && (
                  <div style={{ fontSize: 12, color: "#94a3b8", padding: 4 }}>No result.</div>
                )}
                {chemicalItems.length > 0 && (
                  <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0 0" }}>
                    {chemicalItems.map((item) => (
                      <li key={item.entity_id} style={{ marginBottom: 8 }}>
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/chemical/${entityCategory}/${encodeURIComponent(item.entity_id)}`
                            )
                          }
                          style={{
                            width: "100%",
                            textAlign: "left",
                            borderRadius: 8,
                            border: "1px solid #cbd5e1",
                            padding: "8px 10px",
                            background: "#fff",
                            cursor: "pointer",
                          }}
                        >
                          <div style={{ fontWeight: 500, color: "#0f172a" }}>{item.name}</div>
                          <div style={{ fontSize: 12, color: "#64748b" }}>{item.entity_id}</div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          );
        })()
      )}
    </main>
  );
}
