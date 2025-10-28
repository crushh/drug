export type DrugStatus =
  | "Approved"
  | "New Drug Application"
  | "Phase 3"
  | "Phase 2"
  | "Phase 1"
  | "Investigational New Drug"
  | "Clinical candidate"
  | "Investigative"
  | "Terminated in phase 3"
  | "Terminated in phase 2"
  | "Terminated in phase 1"
  | "Terminated"
  | (string & {});

export interface RdcDrug {
  drugId: string;
  externalId?: string;
  type?: string;
  drugName: string;
  drugSynonyms?: string;
  status?: DrugStatus;
  mainPubmed?: string;
  mainDoi?: string;
  smiles?: string;
  structureImage?: string;
  chebiId?: string;
  pubchemCid?: string;
  pubchemSid?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type EntityCategory =
  | "compound"
  | "ligand"
  | "linker"
  | "chelator"
  | "radionuclide";

export interface ChemicalEntity {
  entityCategory: EntityCategory;
  entityId: string;
  name: string;
  synonyms?: string;
  smiles?: string;
  formula?: string;
  structureImage?: string;
  mol2dPath?: string;
  mol3dPath?: string;
  pubchemCid?: string;
  inchi?: string;
  inchikey?: string;
  iupacName?: string;
  molecularWeight?: number;
  complexity?: number;
  heavyAtomCount?: number;
  hbondAcceptors?: number;
  hbondDonors?: number;
  rotatableBonds?: number;
  logp?: number;
  tpsa?: number;
  linkerType?: string | null;
  radionuclideSymbol?: string | null;
  radionuclideHalfLife?: string | null;
  radionuclideEmission?: string | null;
  radionuclideEnergy?: string | null;
}

export interface DrugChemicalRelation {
  drugId: string;
  entityCategory: EntityCategory;
  entityId: string;
  relationRole?: string;
}

export interface HumanActivity {
  drugId: string;
  clinicalTrialNumber?: string;
  indication?: string;
  patients?: string;
  dosage?: string;
  frequency?: string;
  resultsDescription?: string;
  purpose?: string;
  clinicalEndpoint?: string;
  endpointPeriod?: string;
  efficacyDescription?: string;
  adverseEventsSummary?: string;
  securityIndicators?: string;
}

export interface AnimalInVivoStudy {
  studyId: string;
  drugId: string;
  pmid?: string;
  doi?: string;
}

export interface AnimalInVivoPk {
  studyRefId: string;
  pkAnimalModel?: string;
  pkDosageSymbols?: string;
  pkDosageValue?: number;
  pkDosageUnit?: string;
  pkDescription?: string;
  halfLife?: string;
  pkImage?: string;
}

export interface AnimalInVivoBiodist {
  studyRefId: string;
  biodistType?: string;
  animalModel?: string;
  dosageSymbols?: string;
  dosageValue?: number;
  dosageUnit?: string;
  metabolism?: string;
  excretion?: string;
  detectionTime?: string;
  tumorRetentionTime?: string;
  tbrTumorBlood?: number;
  tbrTumorMuscle?: number;
  tbrTumorKidney?: number;
  tbrTumorSalivaryGlands?: number;
  tbrTumorLiver?: number;
  tbrTumorLung?: number;
  tbrTumorHeart?: number;
  biodistResultImage?: string;
  biodistDescription?: string;
}

export interface AnimalInVivoEfficacy {
  studyRefId: string;
  efficacyAnimalModel?: string;
  efficacyDosageSymbols?: string;
  efficacyDosageValue?: number;
  efficacyDosageUnit?: string;
  efficacyDescription?: string;
  adverseReactions?: string;
}

export interface InVitroStudy {
  inVitroId: string;
  drugId: string;
  studyOverview?: string;
  notes?: string;
}

export interface InVitroMeasurement {
  inVitroRefId: string;
  measurementCategory: string;
  measurementType?: string;
  measurementSymbols?: string;
  measurementValue?: number;
  measurementUnit?: string;
  methodDescription?: string;
}