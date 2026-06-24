#!/bin/bash
set -e

cd /Users/renguofeng/Downloads/新建文件夹16/drug

commands=(
  "npm run upsert:csv -- --table rdc_drug --csv csv_templates_normalized/rdc_drug.csv --replace-table --apply"
  "npm run upsert:csv -- --table chemical_entity --csv csv_templates_normalized/chemical_entity.csv --replace-table --apply"
  "npm run upsert:csv -- --table indication --csv csv_templates_normalized/indication.csv --replace-table --apply"
  "npm run upsert:csv -- --table reference --csv csv_templates_normalized/reference.csv --replace-table --apply"
  "npm run upsert:csv -- --table target --csv csv_templates_normalized/target.csv --replace-table --apply"
  "npm run upsert:csv -- --table chemical_affinity --csv csv_templates_normalized/chemical_affinity.csv --replace-table --apply"
  "npm run upsert:csv -- --table drug_indication --csv csv_templates_normalized/drug_indication.csv --replace-table --apply"
  "npm run upsert:csv -- --table drug_target --csv csv_templates_normalized/drug_target.csv --replace-table --apply"
  "npm run upsert:csv -- --table animal_in_vivo_study --csv csv_templates_normalized/animal_in_vivo_study.csv --replace-table --apply"
  "npm run upsert:csv -- --table animal_in_vivo_biodist --csv csv_templates_normalized/animal_in_vivo_biodist.csv --replace-table --apply"
  "npm run upsert:csv -- --table animal_in_vivo_efficacy --csv csv_templates_normalized/animal_in_vivo_efficacy.csv --replace-table --apply"
  "npm run upsert:csv -- --table drug_chemical_rel --csv csv_templates_normalized/drug_chemical_rel.csv --replace-table --apply"
  "npm run upsert:csv -- --table human_activity --csv csv_templates_normalized/human_activity.csv --replace-table --apply"
  "npm run upsert:csv -- --table in_vitro --csv csv_templates_normalized/in_vitro.csv --replace-table --apply"
  "npm run upsert:csv -- --table in_vitro_measurement --csv csv_templates_normalized/in_vitro_measurement.csv --replace-table --apply"
  "npm run upsert:csv -- --table rdc_drug_reference --csv csv_templates_normalized/rdc_drug_reference.csv --replace-table --apply"
)

for i in "${!commands[@]}"; do
  echo ""
  echo "========================================"
  echo "[$((i+1))/${#commands[@]}] Running: ${commands[$i]}"
  echo "========================================"
  eval "${commands[$i]}"
done

echo ""
echo "========================================"
echo "All commands completed!"
echo "========================================"
