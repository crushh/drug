export const PRIMARY_COLOR = "#0f766e";

export const ENTITY_CATEGORY_COLORS: Record<string, string> = {
  cold_compound: "#2f9e44",
  ligand: "#1971c2",
  linker: "#f08c00",
  chelator: "#e8590c",
  radionuclide: "#6741d9",
};

export function getEntityCategoryColor(category?: string | null) {
  if (!category) return PRIMARY_COLOR;
  return ENTITY_CATEGORY_COLORS[category] ?? PRIMARY_COLOR;
}
