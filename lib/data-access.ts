import {
  AnimalInVivoBiodist,
  AnimalInVivoEfficacy,
  AnimalInVivoPk,
  AnimalInVivoStudy,
  ChemicalEntity,
  DrugChemicalRelation,
  EntityCategory,
  HumanActivity,
  InVitroMeasurement,
  InVitroStudy,
  RdcDrug,
} from "./types";
import {
  animalInVivoBiodistRecords,
  animalInVivoEfficacyRecords,
  animalInVivoPkRecords,
  animalInVivoStudies,
  chemicalEntities,
  drugChemicalRelations,
  drugs,
  humanActivities,
  inVitroMeasurements,
  inVitroStudies,
  statusOptions,
} from "./mock-data";

export interface ListDrugsParams {
  page: number;
  pageSize: number;
  q?: string;
  status?: string;
  sort?: string;
}

export interface DrugDetailOptions {
  expand?: Set<string>;
  allEntities?: boolean;
}

export interface ChemicalDetailOptions {
  includeActivity: boolean;
}

const entityCategories: EntityCategory[] = [
  "compound",
  "ligand",
  "linker",
  "chelator",
  "radionuclide",
];

const drugMap = new Map<string, RdcDrug>(drugs.map((drug) => [drug.drugId, drug]));
const chemicalMap = new Map<string, ChemicalEntity>(
  chemicalEntities.map((entity) => [entity.entityId, entity])
);
const relationsByDrug = buildLookup(drugChemicalRelations, (item) => item.drugId);
const humanActivityByDrug = buildLookup(humanActivities, (item) => item.drugId);
const studiesByDrug = buildLookup(animalInVivoStudies, (item) => item.drugId);
const pkByStudy = buildLookup(animalInVivoPkRecords, (item) => item.studyRefId);
const biodistByStudy = buildLookup(animalInVivoBiodistRecords, (item) => item.studyRefId);
const efficacyByStudy = buildLookup(animalInVivoEfficacyRecords, (item) => item.studyRefId);
const inVitroByDrug = buildLookup(inVitroStudies, (item) => item.drugId);
const measurementsByStudy = buildLookup(inVitroMeasurements, (item) => item.inVitroRefId);

function buildLookup<T>(items: T[], getKey: (item: T) => string) {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = getKey(item);
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(item);
  }
  return map;
}

function normalizeSort(sort?: string): { field: "created_at" | "drug_name"; order: "asc" | "desc" } {
  if (!sort) {
    return { field: "created_at", order: "desc" };
  }
  const [fieldRaw, orderRaw] = sort.split(":");
  const field = fieldRaw === "drug_name" ? "drug_name" : "created_at";
  const order = orderRaw === "asc" ? "asc" : "desc";
  return { field, order };
}

function compareDrugs(a: RdcDrug, b: RdcDrug, sort: { field: "created_at" | "drug_name"; order: "asc" | "desc" }) {
  const direction = sort.order === "asc" ? 1 : -1;
  if (sort.field === "drug_name") {
    return a.drugName.localeCompare(b.drugName) * direction;
  }
  const aDate = Date.parse(a.createdAt);
  const bDate = Date.parse(b.createdAt);
  return (aDate - bDate) * direction;
}

function paginate<T>(items: T[], page: number, pageSize: number) {
  const safePage = Math.max(page, 1);
  const safePageSize = Math.min(Math.max(pageSize, 1), 100);
  const start = (safePage - 1) * safePageSize;
  const end = start + safePageSize;
  return {
    page: safePage,
    pageSize: safePageSize,
    total: items.length,
    slice: items.slice(start, end),
  };
}

function pickPrimaryChemicalName(drugId: string, category: EntityCategory) {
  const relations = relationsByDrug.get(drugId) ?? [];
  const matches = relations.filter((rel) => rel.entityCategory === category);
  if (matches.length === 0) {
    return undefined;
  }
  const preferred = matches.find((item) => item.relationRole === "active") ?? matches[0];
  return chemicalMap.get(preferred.entityId)?.name;
}

function collectChemicalEntities(drugId: string) {
  const relations = relationsByDrug.get(drugId) ?? [];
  const grouped: Record<EntityCategory, Array<{ entity_id: string; name: string; relation_role?: string }>> = {
    compound: [],
    ligand: [],
    linker: [],
    chelator: [],
    radionuclide: [],
  };

  for (const relation of relations) {
    const entity = chemicalMap.get(relation.entityId);
    if (!entity) continue;
    grouped[relation.entityCategory].push({
      entity_id: entity.entityId,
      name: entity.name,
      relation_role: relation.relationRole,
    });
  }

  return grouped;
}

export function listStatusDict() {
  return statusOptions.map((value) => ({ value, label: value }));
}

export function searchDrugs({ q, limit = 20 }: { q: string; limit?: number }) {
  const query = q.trim().toLowerCase();
  const matches = drugs.filter((drug) => drug.drugName.toLowerCase().includes(query));
  return matches.slice(0, Math.max(1, limit)).map((drug) => ({
    drug_id: drug.drugId,
    drug_name: drug.drugName,
    status: drug.status ?? null,
  }));
}

export function listDrugs(params: ListDrugsParams) {
  const { page, pageSize, q, status, sort } = params;
  const normalizedSort = normalizeSort(sort);

  let filtered = [...drugs];

  if (q && q.trim()) {
    const query = q.trim().toLowerCase();
    filtered = filtered.filter((drug) => drug.drugName.toLowerCase().includes(query));
  }

  if (status && status.trim()) {
    filtered = filtered.filter((drug) => drug.status === status);
  }

  filtered.sort((a, b) => compareDrugs(a, b, normalizedSort));

  const { page: currentPage, pageSize: size, total, slice } = paginate(filtered, page, pageSize);

  const items = slice.map((drug) => {
    const base = {
      drug_id: drug.drugId,
      drug_name: drug.drugName,
      status: drug.status ?? null,
      type: drug.type ?? null,
      cold_compound_name: pickPrimaryChemicalName(drug.drugId, "compound") ?? null,
      ligand_name: pickPrimaryChemicalName(drug.drugId, "ligand") ?? null,
      linker_name: pickPrimaryChemicalName(drug.drugId, "linker") ?? null,
      chelator_name: pickPrimaryChemicalName(drug.drugId, "chelator") ?? null,
      radionuclide_name: pickPrimaryChemicalName(drug.drugId, "radionuclide") ?? null,
      created_at: drug.createdAt,
    };
    return base;
  });

  return {
    items,
    page: currentPage,
    page_size: size,
    total,
  };
}

export function listByStatus({ status, limit = 50 }: { status: string; limit?: number }) {
  const matches = drugs
    .filter((drug) => drug.status === status)
    .slice(0, Math.max(1, limit))
    .map((drug) => ({
      drug_id: drug.drugId,
      drug_name: drug.drugName,
      status: drug.status ?? null,
    }));
  return matches;
}

export function findDrugByName(drugName: string) {
  const match = drugs.find((drug) => drug.drugName.toLowerCase() === drugName.toLowerCase());
  if (!match) return undefined;
  return {
    drug_id: match.drugId,
    external_id: match.externalId ?? null,
    drug_name: match.drugName,
    drug_synonyms: match.drugSynonyms ?? null,
    status: match.status ?? null,
    type: match.type ?? null,
    smiles: match.smiles ?? null,
    structure_image: match.structureImage ?? null,
    chebi_id: match.chebiId ?? null,
    pubchem_cid: match.pubchemCid ?? null,
    pubchem_sid: match.pubchemSid ?? null,
    updated_at: match.updatedAt,
  };
}

export function getDrugDetail(drugId: string, options: DrugDetailOptions = {}) {
  const drug = drugMap.get(drugId);
  if (!drug) return undefined;
  const expand = options.expand ?? new Set<string>();
  const allEntities = options.allEntities ?? false;

  const detail: Record<string, unknown> = {
    general: {
      drug_id: drug.drugId,
      external_id: drug.externalId ?? null,
      drug_name: drug.drugName,
      drug_synonyms: drug.drugSynonyms ?? null,
      status: drug.status ?? null,
      type: drug.type ?? null,
      smiles: drug.smiles ?? null,
      structure_image: drug.structureImage ?? null,
      chebi_id: drug.chebiId ?? null,
      pubchem_cid: drug.pubchemCid ?? null,
      pubchem_sid: drug.pubchemSid ?? null,
      created_at: drug.createdAt,
      updated_at: drug.updatedAt,
    },
  };

  if (!options.expand || expand.has("chemicals") || options.allEntities) {
    detail.chemicals = buildChemicalBlock(drug.drugId, allEntities);
  }

  if (expand.has("human_activity")) {
    detail.human_activity = (humanActivityByDrug.get(drug.drugId) ?? []).map(mapHumanActivity);
  }

  if (expand.has("animal_in_vivo")) {
    detail.animal_in_vivo = buildAnimalInVivoBlock(drug.drugId);
  }

  if (expand.has("in_vitro")) {
    detail.in_vitro = buildInVitroBlock(drug.drugId);
  }

  return detail;
}

function buildChemicalBlock(drugId: string, allEntities: boolean) {
  const block: Record<string, unknown> = {
    compound_name: pickPrimaryChemicalName(drugId, "compound") ?? null,
    ligand_name: pickPrimaryChemicalName(drugId, "ligand") ?? null,
    linker_name: pickPrimaryChemicalName(drugId, "linker") ?? null,
    chelator_name: pickPrimaryChemicalName(drugId, "chelator") ?? null,
    radionuclide_name: pickPrimaryChemicalName(drugId, "radionuclide") ?? null,
  };

  if (allEntities) {
    block.entities = collectChemicalEntities(drugId);
  }

  return block;
}

function mapHumanActivity(activity: HumanActivity) {
  return {
    clinical_trial_number: activity.clinicalTrialNumber ?? null,
    indication: activity.indication ?? null,
    patients: activity.patients ?? null,
    dosage: activity.dosage ?? null,
    frequency: activity.frequency ?? null,
    results_description: activity.resultsDescription ?? null,
    purpose: activity.purpose ?? null,
    clinical_endpoint: activity.clinicalEndpoint ?? null,
    endpoint_period: activity.endpointPeriod ?? null,
    efficacy_description: activity.efficacyDescription ?? null,
    adverse_events_summary: activity.adverseEventsSummary ?? null,
    security_indicators: activity.securityIndicators ?? null,
  };
}

function buildAnimalInVivoBlock(drugId: string) {
  const studies = studiesByDrug.get(drugId) ?? [];
  const mapped = studies.map((study) => ({
    study_id: study.studyId,
    pmid: study.pmid ?? null,
    doi: study.doi ?? null,
    pk: (pkByStudy.get(study.studyId) ?? []).map(mapPk),
    biodistribution: (biodistByStudy.get(study.studyId) ?? []).map(mapBiodist),
    efficacy: (efficacyByStudy.get(study.studyId) ?? []).map(mapEfficacy),
  }));
  return { studies: mapped };
}

function mapPk(record: AnimalInVivoPk) {
  return {
    pk_animal_model: record.pkAnimalModel ?? null,
    pk_dosage_symbols: record.pkDosageSymbols ?? null,
    pk_dosage_value: record.pkDosageValue ?? null,
    pk_dosage_unit: record.pkDosageUnit ?? null,
    pk_description: record.pkDescription ?? null,
    half_life: record.halfLife ?? null,
    pk_image: record.pkImage ?? null,
  };
}

function mapBiodist(record: AnimalInVivoBiodist) {
  return {
    biodist_type: record.biodistType ?? null,
    animal_model: record.animalModel ?? null,
    dosage_symbols: record.dosageSymbols ?? null,
    dosage_value: record.dosageValue ?? null,
    dosage_unit: record.dosageUnit ?? null,
    metabolism: record.metabolism ?? null,
    excretion: record.excretion ?? null,
    detection_time: record.detectionTime ?? null,
    tumor_retention_time: record.tumorRetentionTime ?? null,
    tbr: {
      tumor_blood: record.tbrTumorBlood ?? null,
      tumor_muscle: record.tbrTumorMuscle ?? null,
      tumor_kidney: record.tbrTumorKidney ?? null,
      tumor_salivary_glands: record.tbrTumorSalivaryGlands ?? null,
      tumor_liver: record.tbrTumorLiver ?? null,
      tumor_lung: record.tbrTumorLung ?? null,
      tumor_heart: record.tbrTumorHeart ?? null,
    },
    biodist_result_image: record.biodistResultImage ?? null,
    biodist_description: record.biodistDescription ?? null,
  };
}

function mapEfficacy(record: AnimalInVivoEfficacy) {
  return {
    efficacy_animal_model: record.efficacyAnimalModel ?? null,
    efficacy_dosage_symbols: record.efficacyDosageSymbols ?? null,
    efficacy_dosage_value: record.efficacyDosageValue ?? null,
    efficacy_dosage_unit: record.efficacyDosageUnit ?? null,
    efficacy_description: record.efficacyDescription ?? null,
    adverse_reactions: record.adverseReactions ?? null,
  };
}

function buildInVitroBlock(drugId: string) {
  const studies = inVitroByDrug.get(drugId) ?? [];
  const overview = studies.map((study) => ({
    in_vitro_id: study.inVitroId,
    study_overview: study.studyOverview ?? null,
    notes: study.notes ?? null,
  }));

  const measurementGroups: Record<string, ReturnType<typeof mapMeasurement>[]> = {};
  for (const study of studies) {
    const measurements = measurementsByStudy.get(study.inVitroId) ?? [];
    for (const measurement of measurements) {
      const key = measurement.measurementCategory;
      if (!measurementGroups[key]) {
        measurementGroups[key] = [];
      }
      measurementGroups[key].push(mapMeasurement(measurement));
    }
  }

  return {
    studies: overview,
    ...measurementGroups,
  };
}

function mapMeasurement(measurement: InVitroMeasurement) {
  return {
    measurement_type: measurement.measurementType ?? null,
    measurement_symbols: measurement.measurementSymbols ?? null,
    measurement_value: measurement.measurementValue ?? null,
    measurement_unit: measurement.measurementUnit ?? null,
    method_description: measurement.methodDescription ?? null,
  };
}

export function getChemicalDetail(entityCategory: EntityCategory, entityId: string, options: ChemicalDetailOptions) {
  const entity = chemicalEntities.find(
    (item) => item.entityCategory === entityCategory && item.entityId === entityId
  );
  if (!entity) return undefined;

  const basic = {
    entity_category: entity.entityCategory,
    entity_id: entity.entityId,
    name: entity.name,
    synonyms: entity.synonyms ?? null,
    smiles: entity.smiles ?? null,
    formula: entity.formula ?? null,
    structure_image: entity.structureImage ?? null,
    mol2d_path: entity.mol2dPath ?? null,
    mol3d_path: entity.mol3dPath ?? null,
    pubchem_cid: entity.pubchemCid ?? null,
    inchi: entity.inchi ?? null,
    inchikey: entity.inchikey ?? null,
    iupac_name: entity.iupacName ?? null,
    molecular_weight: entity.molecularWeight ?? null,
    complexity: entity.complexity ?? null,
    heavy_atom_count: entity.heavyAtomCount ?? null,
    hbond_acceptors: entity.hbondAcceptors ?? null,
    hbond_donors: entity.hbondDonors ?? null,
    rotatable_bonds: entity.rotatableBonds ?? null,
    logp: entity.logp ?? null,
    tpsa: entity.tpsa ?? null,
    linker_type: entity.linkerType ?? null,
    radionuclide_symbol: entity.radionuclideSymbol ?? null,
    radionuclide_half_life: entity.radionuclideHalfLife ?? null,
    radionuclide_emission: entity.radionuclideEmission ?? null,
    radionuclide_energy: entity.radionuclideEnergy ?? null,
  };

  if (!options.includeActivity) {
    return { basic };
  }

  const relatedDrugs = drugChemicalRelations
    .filter((relation) => relation.entityCategory === entityCategory && relation.entityId === entityId)
    .map((relation) => relation.drugId);

  const uniqueDrugIds = Array.from(new Set(relatedDrugs));
  const rdcActivity = uniqueDrugIds
    .map((id) => getDrugDetail(id, {
      expand: new Set(["chemicals", "human_activity", "animal_in_vivo", "in_vitro"]),
      allEntities: true,
    }))
    .filter((detail): detail is NonNullable<typeof detail> => Boolean(detail))
    .map((detail) => ({
      drug_id: (detail.general as { drug_id: string }).drug_id,
      drug_name: (detail.general as { drug_name: string }).drug_name,
      status: (detail.general as { status: string | null }).status ?? null,
      type: (detail.general as { type: string | null }).type ?? null,
      human_activity: detail.human_activity ?? [],
      animal_in_vivo: detail.animal_in_vivo ?? { studies: [] },
      in_vitro: detail.in_vitro ?? {},
    }));

  return { basic, rdc_activity: rdcActivity };
}

export function validateEntityCategory(value: string): value is EntityCategory {
  return (entityCategories as string[]).includes(value);
}

export function getDrugById(drugId: string) {
  return drugMap.get(drugId);
}

export function listEntityCategories() {
  return entityCategories;
}
