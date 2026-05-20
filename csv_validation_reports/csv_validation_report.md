# CSV 数据校验报告

本报告由 `validate_csv_data.py` 生成。脚本只读取 CSV 和 SQL 文件，不会修改任何数据。

## 概要

- 文件数: 16
- 数据行数: 27855
- 问题数: 7650

## 优先修复建议

先修父表（如 `chemical_entity`、`reference`、`rdc_drug`、`target`、`indication`）的枚举、日期、数字格式问题，再修关联表外键问题。外键错误很多是前置表数据不合法导致的连锁问题。

## 字段格式基础校验通过行数（不含外键）

| 表 | 数量 |
|---|---:|
| rdc_drug | 2051 |
| target | 135 |
| indication | 108 |
| chemical_entity | 0 |
| reference | 17 |
| drug_target | 1981 |
| drug_indication | 2368 |
| drug_chemical_rel | 0 |
| chemical_affinity | 590 |
| in_vitro | 1568 |
| in_vitro_measurement | 1318 |
| human_activity | 869 |
| animal_in_vivo_study | 2611 |
| animal_in_vivo_biodist | 6049 |
| animal_in_vivo_efficacy | 271 |
| rdc_drug_reference | 2239 |

## 问题分组

### 1. 枚举值错误 (3798 条)

**类型**: `ENUM_INVALID`

**问题**: 字段值不在 SQL ENUM 允许范围内。

**修复建议**: 按 SQL 里的枚举值统一修改，注意大小写。

**涉及表**: drug_chemical_rel: 2047, chemical_entity: 1751

**样例**:
- `chemical_entity.csv` 行 2: `entity_category` = `Radionuclide` 允许值: cold_compound, ligand, linker, chelator, radionuclide
- `chemical_entity.csv` 行 3: `entity_category` = `Radionuclide` 允许值: cold_compound, ligand, linker, chelator, radionuclide
- `chemical_entity.csv` 行 4: `entity_category` = `Radionuclide` 允许值: cold_compound, ligand, linker, chelator, radionuclide
- `chemical_entity.csv` 行 5: `entity_category` = `Radionuclide` 允许值: cold_compound, ligand, linker, chelator, radionuclide
- `chemical_entity.csv` 行 6: `entity_category` = `Radionuclide` 允许值: cold_compound, ligand, linker, chelator, radionuclide
- `chemical_entity.csv` 行 7: `entity_category` = `Radionuclide` 允许值: cold_compound, ligand, linker, chelator, radionuclide
- `chemical_entity.csv` 行 8: `entity_category` = `Radionuclide` 允许值: cold_compound, ligand, linker, chelator, radionuclide
- `chemical_entity.csv` 行 9: `entity_category` = `Radionuclide` 允许值: cold_compound, ligand, linker, chelator, radionuclide

### 2. 外键缺失 (1583 条)

**类型**: `FK_MISSING_PARENT`

**问题**: 关联表引用的父表 ID 不存在。

**修复建议**: 先补齐父表记录。如果一个单元格有多个 ID，需要拆成多行。

**涉及表**: chemical_affinity: 589, drug_indication: 265, in_vitro_measurement: 200, human_activity: 155, rdc_drug_reference: 144, drug_target: 99, animal_in_vivo_biodist: 88, animal_in_vivo_study: 21, animal_in_vivo_efficacy: 15, in_vitro: 6, drug_chemical_rel: 1

**样例**:
- `drug_target.csv` 行 370: `drug_id` = `RDC00694` drug_id -> rdc_drug.drug_id
- `drug_target.csv` 行 606: `drug_id` = `RDC01124` drug_id -> rdc_drug.drug_id
- `drug_target.csv` 行 695: `drug_id` = `RDC01244` drug_id -> rdc_drug.drug_id
- `drug_target.csv` 行 723: `drug_id` = `RDC01300` drug_id -> rdc_drug.drug_id
- `drug_target.csv` 行 730: `drug_id` = `RDC01312` drug_id -> rdc_drug.drug_id
- `drug_target.csv` 行 1075: `drug_id` = `RDC01773` drug_id -> rdc_drug.drug_id
- `drug_target.csv` 行 1374: `drug_id` = `RDC02187` drug_id -> rdc_drug.drug_id
- `drug_target.csv` 行 1431: `drug_id` = `RDC02269` drug_id -> rdc_drug.drug_id

### 3. 日期格式错误 (1471 条)

**类型**: `DATE_INVALID`

**问题**: SQL 要求 DATE，CSV 日期不是 YYYY-MM-DD。

**修复建议**: 统一改成 YYYY-MM-DD，例如 20-Jun-25 -> 2025-06-20。

**涉及表**: reference: 1471

**样例**:
- `reference.csv` 行 2: `publication_date` = `20-Jun-25` 
- `reference.csv` 行 3: `publication_date` = `24-Sep-21` 
- `reference.csv` 行 4: `publication_date` = `19-Jan-11` 
- `reference.csv` 行 5: `publication_date` = `13-May-25` 
- `reference.csv` 行 6: `publication_date` = `7-Oct-22` 
- `reference.csv` 行 7: `publication_date` = `7-Oct-22` 
- `reference.csv` 行 8: `publication_date` = `13-Apr-11` 
- `reference.csv` 行 9: `publication_date` = `15-Jun-07` 

### 4. 唯一键重复 (504 条)

**类型**: `UNIQUE_DUPLICATE`

**问题**: 该表的 UNIQUE KEY 被重复使用。

**修复建议**: 去重，保留一行；如需保留多条，需调整唯一键设计。

**涉及表**: chemical_entity: 304, rdc_drug_reference: 108, drug_indication: 59, reference: 16, animal_in_vivo_study: 9, in_vitro: 6, rdc_drug: 1, drug_target: 1

**样例**:
- `rdc_drug.csv` 行 738: `drug_id` = `RDC01070` uk_drug_id: drug_id=RDC01070; first line=694
- `chemical_entity.csv` 行 269: `entity_category,entity_id` = `RDC|RDC00116` uk_entity_category_id: entity_category=RDC, entity_id=RDC00116; first line=70
- `chemical_entity.csv` 行 269: `entity_id` = `RDC00116` uk_entity_id: entity_id=RDC00116; first line=70
- `chemical_entity.csv` 行 287: `entity_category,entity_id` = `RDC|RDC00515` uk_entity_category_id: entity_category=RDC, entity_id=RDC00515; first line=286
- `chemical_entity.csv` 行 287: `entity_id` = `RDC00515` uk_entity_id: entity_id=RDC00515; first line=286
- `chemical_entity.csv` 行 290: `entity_category,entity_id` = `RDC|RDC00513` uk_entity_category_id: entity_category=RDC, entity_id=RDC00513; first line=284
- `chemical_entity.csv` 行 290: `entity_id` = `RDC00513` uk_entity_id: entity_id=RDC00513; first line=284
- `chemical_entity.csv` 行 294: `entity_category,entity_id` = `RDC|RDC00514` uk_entity_category_id: entity_category=RDC, entity_id=RDC00514; first line=285

### 5. 单元格包含多个 ID (204 条)

**类型**: `MULTIPLE_IDS`

**问题**: 关联字段中出现逗号或分号分隔的多个 ID。

**修复建议**: 关联表应该一行一个关联，请拆成多行。

**涉及表**: drug_indication: 149, drug_target: 55

**样例**:
- `drug_target.csv` 行 16: `target_id` = `TAR0023, TAR0065, TAR0064` 
- `drug_target.csv` 行 24: `target_id` = `TAR0023, TAR0020` 
- `drug_target.csv` 行 42: `target_id` = `TAR0015, TAR0023` 
- `drug_target.csv` 行 43: `target_id` = `TAR0015, TAR0023` 
- `drug_target.csv` 行 44: `target_id` = `TAR0015, TAR0023` 
- `drug_target.csv` 行 51: `target_id` = `TAR0063,TAR0023` 
- `drug_target.csv` 行 52: `target_id` = `TAR0063,TAR0023` 
- `drug_target.csv` 行 59: `target_id` = `TAR0015, TAR0023` 

### 6. 必填字段为空 (45 条)

**类型**: `REQUIRED_EMPTY`

**问题**: SQL 中该字段为 NOT NULL，CSV 中为空。

**修复建议**: 补齐该字段，或删除该行无效数据。

**涉及表**: drug_chemical_rel: 24, drug_target: 10, in_vitro_measurement: 6, rdc_drug_reference: 3, drug_indication: 1, animal_in_vivo_biodist: 1

**样例**:
- `drug_target.csv` 行 1993: `target_id` = `` 
- `drug_target.csv` 行 1994: `target_id` = `` 
- `drug_target.csv` 行 2001: `target_id` = `` 
- `drug_target.csv` 行 2009: `target_id` = `` 
- `drug_target.csv` 行 2010: `target_id` = `` 
- `drug_target.csv` 行 2011: `target_id` = `` 
- `drug_target.csv` 行 2017: `target_id` = `` 
- `drug_target.csv` 行 2018: `target_id` = `` 

### 7. 空表头 (21 条)

**类型**: `HEADER_BLANK`

**问题**: CSV 存在空列名。

**修复建议**: 删除多余空列，或者填写正确字段名。

**涉及表**: rdc_drug: 14, in_vitro: 4, drug_indication: 3

**样例**:
- `rdc_drug.csv` 行 1: `#18` = `` 
- `rdc_drug.csv` 行 1: `#19` = `` 
- `rdc_drug.csv` 行 1: `#20` = `` 
- `rdc_drug.csv` 行 1: `#21` = `` 
- `rdc_drug.csv` 行 1: `#22` = `` 
- `rdc_drug.csv` 行 1: `#23` = `` 
- `rdc_drug.csv` 行 1: `#24` = `` 
- `rdc_drug.csv` 行 1: `#25` = `` 

### 8. 日期时间格式错误 (18 条)

**类型**: `DATETIME_INVALID`

**问题**: SQL 要求 DATETIME，CSV 格式不符合 YYYY-MM-DD HH:MM:SS。

**修复建议**: 改成 YYYY-MM-DD HH:MM:SS，或留空让数据库使用默认时间。

**涉及表**: animal_in_vivo_biodist: 18

**样例**:
- `animal_in_vivo_biodist.csv` 行 1591: `created_at` = `-` 
- `animal_in_vivo_biodist.csv` 行 1596: `created_at` = `-` 
- `animal_in_vivo_biodist.csv` 行 1597: `created_at` = `-` 
- `animal_in_vivo_biodist.csv` 行 1597: `updated_at` = `-` 
- `animal_in_vivo_biodist.csv` 行 1598: `created_at` = `-` 
- `animal_in_vivo_biodist.csv` 行 1598: `updated_at` = `-` 
- `animal_in_vivo_biodist.csv` 行 1603: `created_at` = `-` 
- `animal_in_vivo_biodist.csv` 行 1603: `updated_at` = `-` 

### 9. 表头使用了别名 (6 条)

**类型**: `HEADER_ALIAS`

**问题**: CSV 表头与建表字段不完全一致，脚本已按内置规则映射。

**修复建议**: 建议把 CSV 表头直接改成 SQL 里的字段名。

**涉及表**: rdc_drug: 2, animal_in_vivo_biodist: 2, drug_indication: 1, animal_in_vivo_study: 1

**样例**:
- `rdc_drug.csv` 行 1: `Type` = `type` Type -> type
- `rdc_drug.csv` 行 1: `MOA` = `moa` MOA -> moa
- `drug_indication.csv` 行 1: `RDC-ID` = `drug_id` RDC-ID -> drug_id
- `animal_in_vivo_study.csv` 行 1: `drug-id` = `drug_id` drug-id -> drug_id
- `animal_in_vivo_biodist.csv` 行 1: `Type` = `biodist_type` Type -> biodist_type
- `animal_in_vivo_biodist.csv` 行 1: `Cell lines` = `cell_lines` Cell lines -> cell_lines
