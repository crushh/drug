# CSV 数据校验报告

本报告由 `validate_csv_data.py` 生成。脚本只读取 CSV 和 SQL 文件，不会修改任何数据。

## 概要

- 文件数: 16
- 数据行数: 36715
- 问题数: 0

## 优先修复建议

先修父表（如 `chemical_entity`、`reference`、`rdc_drug`、`target`、`indication`）的枚举、日期、数字格式问题，再修关联表外键问题。外键错误很多是前置表数据不合法导致的连锁问题。

## 字段格式基础校验通过行数（不含外键）

| 表 | 数量 |
|---|---:|
| rdc_drug | 2053 |
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
