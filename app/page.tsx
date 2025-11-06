"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type StatusOption = { value: string; label: string };
type DrugItem = { drug_id: string; drug_name: string; status: string | null };

function TileMenu() {
  const items = useMemo(
    () => [
      { key: "rdc", label: "Search for RDC" },
      { key: "compound", label: "Search for Compound" },
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
        <a
          key={it.key}
          href="#"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 88,
            borderRadius: 12,
            border: "1px solid #d1d5db",
            background: "#fff",
            textDecoration: "none",
            color: "#0f172a",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          }}
        >
          {it.label}
        </a>
      ))}
    </div>
  );
}

export default function HomePage() {
  // Top fuzzy search
  const [q, setQ] = useState("");
  const router = useRouter();

  // Bottom dependent selects
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);
  const [statusLoading, setStatusLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [namesLoading, setNamesLoading] = useState(false);
  const [namesByStatus, setNamesByStatus] = useState<DrugItem[]>([]);
  const [selectedDrugName, setSelectedDrugName] = useState("");

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

  function openDetailByName(name: string) {
    if (!name) return;
    const url = `/api/rdc/detail?drug_name=${encodeURIComponent(name)}`;
    window.open(url, "_blank");
  }

  return (
    <main style={{ padding: "24px" }}>
      <h1 style={{ margin: 0, marginBottom: 12 }}>RDC Portal</h1>
      <p style={{ marginTop: 0, color: "#475569" }}>快速查找放射性药物缀合体（RDC）与相关实体。</p>

      {/* Top: six submenu tiles */}
      <TileMenu />

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
    </main>
  );
}
