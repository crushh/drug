import { RowDataPacket } from "mysql2";

import { getPool } from "./db";
import { parseExpandParam } from "./query";

export interface ListDrugsParams {
  page: number;
  pageSize: number;
  q?: string;
  status?: string;
  sort?: string;
}

export type ExpandSegment = "human_activity" | "animal_in_vivo" | "in_vitro" | "chemicals";

export interface DrugDetailOptions {
  expand?: Set<ExpandSegment>;
  allEntities?: boolean;
}

const ENTITY_CATEGORIES = ["compound", "ligand", "linker", "chelator", "radionuclide"] as const;

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

function toDateTime(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeSort(sort?: string) {
  switch (sort) {
    case "drug_name:asc":
      return "d.drug_name ASC";
    case "drug_name:desc":
      return "d.drug_name DESC";
    case "created_at:asc":
      return "d.created_at ASC";
    case "created_at:desc":
    default:
      return "d.created_at DESC";
  }
}

export async function listStatusDict() {
  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT DISTINCT status FROM rdc_drug WHERE status IS NOT NULL AND status <> '' ORDER BY status"
  );
  return rows
    .map((row) => row.status as string | null)
    .filter((status): status is string => typeof status === "string" && status.trim().length > 0)
    .map((value) => ({ value, label: value }));
}

export async function searchDrugs({ q, limit = 20 }: { q: string; limit?: number }) {
  const pool = getPool();
  const query = `%${q.trim()}%`;
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT drug_id, drug_name, status FROM rdc_drug
     WHERE drug_name LIKE ?
     ORDER BY drug_name ASC
     LIMIT ?`,
    [query, safeLimit]
  );

  return rows.map((row) => ({
    drug_id: row.drug_id as string,
    drug_name: row.drug_name as string,
    status: (row.status as string) ?? null,
  }));
}

export async function listDrugs(params: ListDrugsParams) {
  const pool = getPool();
  const { page, pageSize, q, status, sort } = params;
  const filters: string[] = [];
  const filterParams: unknown[] = [];

  if (q && q.trim()) {
    filters.push("d.drug_name LIKE ?");
    filterParams.push(`%${q.trim()}%`);
  }
  if (status && status.trim()) {
    filters.push("d.status = ?");
    filterParams.push(status.trim());
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const orderClause = normalizeSort(sort);
  const safePage = Math.max(page, 1);
  const safePageSize = Math.min(Math.max(pageSize, 1), 100);
  const offset = (safePage - 1) * safePageSize;

  const [items] = await pool.query<RowDataPacket[]>(
    `SELECT
       d.drug_id,
       d.drug_name,
       d.status,
       d.type,
       MAX(CASE WHEN dcr.relation_role = 'compound' THEN ce.name END) AS cold_compound_name,
       MAX(CASE WHEN dcr.relation_role = 'ligand' THEN ce.name END) AS ligand_name,
       MAX(CASE WHEN dcr.relation_role = 'linker' THEN ce.name END) AS linker_name,
       MAX(CASE WHEN dcr.relation_role = 'chelator' THEN ce.name END) AS chelator_name,
       MAX(CASE WHEN dcr.relation_role = 'radionuclide' THEN ce.name END) AS radionuclide_name,
       d.created_at
     FROM rdc_drug d
     LEFT JOIN drug_chemical_rel dcr ON d.drug_id = dcr.drug_id
     LEFT JOIN chemical_entity ce ON ce.entity_id = dcr.chemical_entity_id
     ${whereClause}
     GROUP BY d.drug_id, d.drug_name, d.status, d.type, d.created_at
     ORDER BY ${orderClause}
     LIMIT ? OFFSET ?`,
    [...filterParams, safePageSize, offset]
  );

  const [totalRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM rdc_drug d ${whereClause}`,
    filterParams
  );

  const total = Number(totalRows[0]?.total ?? 0);

  return {
    items: items.map((row) => ({
      drug_id: row.drug_id as string,
      drug_name: row.drug_name as string,
      status: (row.status as string) ?? null,
      type: (row.type as string) ?? null,
      cold_compound_name: (row.cold_compound_name as string) ?? null,
      ligand_name: (row.ligand_name as string) ?? null,
      linker_name: (row.linker_name as string) ?? null,
      chelator_name: (row.chelator_name as string) ?? null,
      radionuclide_name: (row.radionuclide_name as string) ?? null,
      created_at: toDateTime(row.created_at),
    })),
    page: safePage,
    page_size: safePageSize,
    total,
  };
}

export async function listByStatus({ status, limit = 50 }: { status: string; limit?: number }) {
  const pool = getPool();
  const safeLimit = Math.min(Math.max(limit, 1), 200);
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT drug_id, drug_name, status
     FROM rdc_drug
     WHERE status = ?
     ORDER BY drug_name ASC
     LIMIT ?`,
    [status.trim(), safeLimit]
  );

  return rows.map((row) => ({
    drug_id: row.drug_id as string,
    drug_name: row.drug_name as string,
    status: (row.status as string) ?? null,
  }));
}

export async function findDrugByName(drugName: string) {
  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT
       drug_id,
       external_id,
       drug_name,
       drug_synonyms,
       status,
       type,
       smiles,
       structure_image,
       chebi_id,
       pubchem_cid,
       pubchem_sid,
       updated_at
     FROM rdc_drug
     WHERE drug_name = ?
     LIMIT 1`,
    [drugName.trim()]
  );

  if (rows.length === 0) {
    return undefined;
  }

  const row = rows[0];
  return {
    drug_id: row.drug_id as string,
    external_id: (row.external_id as string) ?? null,
    drug_name: row.drug_name as string,
    drug_synonyms: (row.drug_synonyms as string) ?? null,
    status: (row.status as string) ?? null,
    type: (row.type as string) ?? null,
    smiles: (row.smiles as string) ?? null,
    structure_image: (row.structure_image as string) ?? null,
    chebi_id: (row.chebi_id as string) ?? null,
    pubchem_cid: (row.pubchem_cid as string) ?? null,
    pubchem_sid: (row.pubchem_sid as string) ?? null,
    updated_at: toDateTime(row.updated_at),
  };
}

export async function getDrugDetail(drugId: string, options: DrugDetailOptions = {}) {
  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT
       drug_id,
       external_id,
       drug_name,
       drug_synonyms,
       status,
       type,
       smiles,
       structure_image,
       chebi_id,
       pubchem_cid,
       pubchem_sid,
       created_at,
       updated_at
     FROM rdc_drug
     WHERE drug_id = ?
     LIMIT 1`,
    [drugId]
  );

  if (rows.length === 0) {
    return undefined;
  }

  const row = rows[0];
  const expand = options.expand ?? new Set<ExpandSegment>();
  const allEntities = options.allEntities ?? false;

  const detail: Record<string, unknown> = {
    general: {
      drug_id: row.drug_id as string,
      external_id: (row.external_id as string) ?? null,
      drug_name: row.drug_name as string,
      drug_synonyms: (row.drug_synonyms as string) ?? null,
      status: (row.status as string) ?? null,
      type: (row.type as string) ?? null,
      smiles: (row.smiles as string) ?? null,
      structure_image: (row.structure_image as string) ?? null,
      chebi_id: (row.chebi_id as string) ?? null,
      pubchem_cid: (row.pubchem_cid as string) ?? null,
      pubchem_sid: (row.pubchem_sid as string) ?? null,
      created_at: toDateTime(row.created_at),
      updated_at: toDateTime(row.updated_at),
    },
  };

  detail.chemicals = await buildChemicalBlock(drugId, allEntities);

  if (expand.has("human_activity")) {
    detail.human_activity = await fetchHumanActivity(drugId);
  }

  if (expand.has("animal_in_vivo")) {
    detail.animal_in_vivo = await fetchAnimalInVivo(drugId);
  }

  if (expand.has("in_vitro")) {
    detail.in_vitro = await fetchInVitro(drugId);
  }

  return detail;
}

async function buildChemicalBlock(drugId: string, allEntities: boolean) {
  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT dcr.relation_role, dcr.chemical_entity_id, ce.name
     FROM drug_chemical_rel dcr
     JOIN chemical_entity ce ON ce.entity_id = dcr.chemical_entity_id
     WHERE dcr.drug_id = ?
     ORDER BY dcr.relation_role, ce.name`,
    [drugId]
  );

  const summary: Record<string, string | null> = {
    compound: null,
    ligand: null,
    linker: null,
    chelator: null,
    radionuclide: null,
  };

  const grouped: Record<string, Array<{ entity_id: string; name: string; relation_role?: string }>> = {
    compound: [],
    ligand: [],
    linker: [],
    chelator: [],
    radionuclide: [],
  };

  for (const row of rows) {
    const category = String(row.relation_role ?? "").toLowerCase();
    if (!ENTITY_CATEGORIES.includes(category as (typeof ENTITY_CATEGORIES)[number])) {
      continue;
    }
    if (!summary[category]) {
      summary[category] = (row.name as string) ?? null;
    }
    grouped[category].push({
      entity_id: row.chemical_entity_id as string,
      name: (row.name as string) ?? "",
      relation_role: row.relation_role as string,
    });
  }

  const block: Record<string, unknown> = {
    compound_name: summary.compound,
    ligand_name: summary.ligand,
    linker_name: summary.linker,
    chelator_name: summary.chelator,
    radionuclide_name: summary.radionuclide,
  };

  if (allEntities) {
    block.entities = grouped;
  }

  return block;
}

async function fetchHumanActivity(drugId: string) {
  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT clinical_trial_number, indication, patients, dosage, frequency,
            results_description, purpose, clinical_endpoint, endpoint_period,
            efficacy_description, adverse_events_summary, security_indicators
     FROM human_activity
     WHERE drug_id = ?
     ORDER BY created_at ASC, id ASC`,
    [drugId]
  );

  return rows.map((row) => ({
    clinical_trial_number: (row.clinical_trial_number as string) ?? null,
    indication: (row.indication as string) ?? null,
    patients: (row.patients as string) ?? null,
    dosage: (row.dosage as string) ?? null,
    frequency: (row.frequency as string) ?? null,
    results_description: (row.results_description as string) ?? null,
    purpose: (row.purpose as string) ?? null,
    clinical_endpoint: (row.clinical_endpoint as string) ?? null,
    endpoint_period: (row.endpoint_period as string) ?? null,
    efficacy_description: (row.efficacy_description as string) ?? null,
    adverse_events_summary: (row.adverse_events_summary as string) ?? null,
    security_indicators: (row.security_indicators as string) ?? null,
  }));
}

async function fetchAnimalInVivo(drugId: string) {
  const pool = getPool();
  const [studies] = await pool.query<RowDataPacket[]>(
    `SELECT study_id, pmid, doi
     FROM animal_in_vivo_study
     WHERE drug_id = ?
     ORDER BY created_at ASC, id ASC`,
    [drugId]
  );

  if (studies.length === 0) {
    return { studies: [] };
  }

  const studyIds = studies.map((row) => row.study_id as string);
  const placeholders = studyIds.map(() => "?").join(",");

  const [pkRows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM animal_in_vivo_pk WHERE study_ref_id IN (${placeholders}) ORDER BY id ASC`,
    studyIds
  );
  const [biodistRows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM animal_in_vivo_biodist WHERE study_ref_id IN (${placeholders}) ORDER BY id ASC`,
    studyIds
  );
  const [efficacyRows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM animal_in_vivo_efficacy WHERE study_ref_id IN (${placeholders}) ORDER BY id ASC`,
    studyIds
  );

  const pkByStudy = groupBy(pkRows, (row) => row.study_ref_id as string);
  const biodistByStudy = groupBy(biodistRows, (row) => row.study_ref_id as string);
  const efficacyByStudy = groupBy(efficacyRows, (row) => row.study_ref_id as string);

  const mapped = studies.map((study) => {
    const studyId = study.study_id as string;
    return {
      study_id: studyId,
      pmid: (study.pmid as string) ?? null,
      doi: (study.doi as string) ?? null,
      pk: (pkByStudy.get(studyId) ?? []).map(mapPk),
      biodistribution: (biodistByStudy.get(studyId) ?? []).map(mapBiodist),
      efficacy: (efficacyByStudy.get(studyId) ?? []).map(mapEfficacy),
    };
  });

  return { studies: mapped };
}

function mapPk(row: RowDataPacket) {
  return {
    pk_animal_model: (row.pk_animal_model as string) ?? null,
    pk_dosage_symbols: (row.pk_dosage_symbols as string) ?? null,
    pk_dosage_value: toNumber(row.pk_dosage_value),
    pk_dosage_unit: (row.pk_dosage_unit as string) ?? null,
    pk_description: (row.pk_description as string) ?? null,
    half_life: (row.half_life as string) ?? null,
    pk_image: (row.pk_image as string) ?? null,
  };
}

function mapBiodist(row: RowDataPacket) {
  return {
    biodist_type: (row.biodist_type as string) ?? null,
    animal_model: (row.animal_model as string) ?? null,
    dosage_symbols: (row.dosage_symbols as string) ?? null,
    dosage_value: toNumber(row.dosage_value),
    dosage_unit: (row.dosage_unit as string) ?? null,
    metabolism: (row.metabolism as string) ?? null,
    excretion: (row.excretion as string) ?? null,
    detection_time: (row.detection_time as string) ?? null,
    tumor_retention_time: (row.tumor_retention_time as string) ?? null,
    tbr: {
      tumor_blood: toNumber(row.tbr_tumor_blood),
      tumor_muscle: toNumber(row.tbr_tumor_muscle),
      tumor_kidney: toNumber(row.tbr_tumor_kidney),
      tumor_salivary_glands: toNumber(row.tbr_tumor_salivary_glands),
      tumor_liver: toNumber(row.tbr_tumor_liver),
      tumor_lung: toNumber(row.tbr_tumor_lung),
      tumor_heart: toNumber(row.tbr_tumor_heart),
    },
    biodist_result_image: (row.biodist_result_image as string) ?? null,
    biodist_description: (row.biodist_description as string) ?? null,
  };
}

function mapEfficacy(row: RowDataPacket) {
  return {
    efficacy_animal_model: (row.efficacy_animal_model as string) ?? null,
    efficacy_dosage_symbols: (row.efficacy_dosage_symbols as string) ?? null,
    efficacy_dosage_value: toNumber(row.efficacy_dosage_value),
    efficacy_dosage_unit: (row.efficacy_dosage_unit as string) ?? null,
    efficacy_description: (row.efficacy_description as string) ?? null,
    adverse_reactions: (row.adverse_reactions as string) ?? null,
  };
}

async function fetchInVitro(drugId: string) {
  const pool = getPool();
  const [studies] = await pool.query<RowDataPacket[]>(
    `SELECT in_vitro_id, study_overview, notes
     FROM in_vitro
     WHERE drug_id = ?
     ORDER BY created_at ASC, id ASC`,
    [drugId]
  );

  if (studies.length === 0) {
    return { studies: [] };
  }

  const studyIds = studies.map((row) => row.in_vitro_id as string);
  const placeholders = studyIds.map(() => "?").join(",");
  const [measurements] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM in_vitro_measurement WHERE in_vitro_ref_id IN (${placeholders}) ORDER BY id ASC`,
    studyIds
  );

  const measurementGroups = new Map<string, Array<ReturnType<typeof mapMeasurement>>>();

  for (const measurement of measurements) {
    const category = (measurement.measurement_category as string) ?? "other";
    if (!measurementGroups.has(category)) {
      measurementGroups.set(category, []);
    }
    measurementGroups.get(category)!.push(mapMeasurement(measurement));
  }

  return {
    studies: studies.map((study) => ({
      in_vitro_id: study.in_vitro_id as string,
      study_overview: (study.study_overview as string) ?? null,
      notes: (study.notes as string) ?? null,
    })),
    ...Object.fromEntries(measurementGroups.entries()),
  };
}

function mapMeasurement(row: RowDataPacket) {
  return {
    measurement_type: (row.measurement_type as string) ?? null,
    measurement_symbols: (row.measurement_symbols as string) ?? null,
    measurement_value: toNumber(row.measurement_value),
    measurement_unit: (row.measurement_unit as string) ?? null,
    method_description: (row.method_description as string) ?? null,
  };
}

function groupBy(rows: RowDataPacket[], getter: (row: RowDataPacket) => string) {
  const map = new Map<string, RowDataPacket[]>();
  for (const row of rows) {
    const key = getter(row);
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(row);
  }
  return map;
}
