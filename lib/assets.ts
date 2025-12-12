const ASSET_BASE = (process.env.NEXT_PUBLIC_ASSET_BASE ?? "").replace(/\/+$/, "");

export function buildAssetUrl(path?: string | null, folder?: string) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.replace(/^\/+/, "");
  const prefix = folder ? `${folder.replace(/\/+$/, "")}/` : "";
  const base = ASSET_BASE ? `${ASSET_BASE}/` : "";
  return `${base}${prefix}${normalized}`;
}

export { ASSET_BASE };

