# CSV 数据校验报告

本报告由 `validate_csv_data.py` 生成。脚本只读取 CSV 和 SQL 文件，不会修改任何数据。

## 概要

- 文件数: 16
- 数据行数: 36716
- 问题数: 2053

## 优先修复建议

先修父表（如 `chemical_entity`、`reference`、`rdc_drug`、`target`、`indication`）的枚举、日期、数字格式问题，再修关联表外键问题。外键错误很多是前置表数据不合法导致的连锁问题。

## 字段格式基础校验通过行数（不含外键）

| 表 | 数量 |
|---|---:|
| rdc_drug | 1 |
| target | 135 |
| indication | 107 |
| chemical_entity | 3439 |
| reference | 1491 |
| drug_target | 2097 |
| drug_indication | 2921 |
| drug_chemical_rel | 9166 |
| chemical_affinity | 577 |
| in_vitro | 1582 |
| in_vitro_measurement | 1268 |
| human_activity | 796 |
| animal_in_vivo_study | 2604 |
| animal_in_vivo_biodist | 6009 |
| animal_in_vivo_efficacy | 271 |
| rdc_drug_reference | 2199 |

## 问题分组

### 1. 可空唯一键空字符串风险 (2052 条)

**类型**: `UNIQUE_EMPTY_STRING_RISK`

**问题**: SQL 中该 UNIQUE KEY 字段可为 NULL，但 CSV 空单元格如被导入为空字符串 `''`，MySQL 会将多个 `''` 视为重复值。

**修复建议**: 导入时将空值映射为 NULL，或从 CSV 中移除该可空字段让数据库使用默认 NULL。

**涉及表**: rdc_drug: 2052

**样例**:
- `rdc_drug.csv` 行 3: `external_id` = `` uk_external_id: external_id=; first line=2
- `rdc_drug.csv` 行 4: `external_id` = `` uk_external_id: external_id=; first line=2
- `rdc_drug.csv` 行 5: `external_id` = `` uk_external_id: external_id=; first line=2
- `rdc_drug.csv` 行 6: `external_id` = `` uk_external_id: external_id=; first line=2
- `rdc_drug.csv` 行 7: `external_id` = `` uk_external_id: external_id=; first line=2
- `rdc_drug.csv` 行 8: `external_id` = `` uk_external_id: external_id=; first line=2
- `rdc_drug.csv` 行 9: `external_id` = `` uk_external_id: external_id=; first line=2
- `rdc_drug.csv` 行 10: `external_id` = `` uk_external_id: external_id=; first line=2

### 2. 唯一键重复 (1 条)

**类型**: `UNIQUE_DUPLICATE`

**问题**: 该表的 UNIQUE KEY 被重复使用。

**修复建议**: 去重，保留一行；如需保留多条，需调整唯一键设计。

**涉及表**: indication: 1

**样例**:
- `indication.csv` 行 70: `name,icd11_code` = `Myocardial Infarction|BA41.Z` uk_name_code: name=Myocardial Infarction, icd11_code=BA41.Z; first line=8
