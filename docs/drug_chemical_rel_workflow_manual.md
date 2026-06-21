# Database CSV Patch 操作手册

本文档说明如何使用 `.github/workflows/database-csv-patch.yml` 中的 `Database CSV Patch` 工作流，校验 CSV、对比线上 MySQL，并在确认后写入指定数据表。

## 功能范围

这个 workflow 不再只服务 `drug_chemical_rel`。它可以在 apply 模式下写入项目中 `csv_templates_normalized` 目录对应的任意表。

支持的表：

```text
rdc_drug
target
drug_target
indication
drug_indication
chemical_entity
drug_chemical_rel
chemical_affinity
in_vitro
in_vitro_measurement
human_activity
animal_in_vivo_study
animal_in_vivo_biodist
animal_in_vivo_efficacy
reference
rdc_drug_reference
```

## 入口

进入 GitHub 仓库：

```text
Actions -> Database CSV Patch -> Run workflow
```

参数说明：

```text
table: apply 时要写入的目标表
csv: CSV 路径；留空时自动使用 csv_templates_normalized/<table>.csv
mode: dry-run 或 apply
confirm_apply: apply 模式必须填写 APPLY_TO_PRODUCTION
```

## 推荐流程

### 1. 先提交 CSV

把要更新的 CSV 提交到仓库，例如：

```text
csv_templates_normalized/drug_chemical_rel.csv
csv_templates_normalized/chemical_entity.csv
csv_templates_normalized/reference.csv
```

### 2. 先跑 dry-run

选择：

```text
mode: dry-run
confirm_apply: 留空
```

dry-run 会执行：

```text
1. 校验输入参数
2. 运行 validate_csv_data.py 做全量 CSV 校验
3. 上传 csv-validation-reports artifact
4. 检查 upsert_table_from_csv.js 语法
5. 对比所有 CSV 和 MySQL 当前数据
```

注意：dry-run 会对比所有表，不只对比你选择的 `table`。

### 3. 检查目标表结果

在日志 `Dry-run all database diffs` 中找到目标表，例如：

```text
Dry-run diff: drug_chemical_rel
```

重点确认：

```text
CSV rows
Existing DB rows
Will insert
Will update
Unchanged
Insert samples
Update samples
```

没有稳定唯一键的明细表会显示：

```text
CSV-only rows
DB-only rows
Unchanged
```

### 4. 再跑 apply

确认 dry-run 符合预期后，再运行：

```text
mode: apply
confirm_apply: APPLY_TO_PRODUCTION
```

如果 `csv` 留空，workflow 会自动使用：

```text
csv_templates_normalized/<table>.csv
```

## 写入策略

有稳定业务唯一键的表使用 upsert：

```text
rdc_drug: drug_id
target: target_id
drug_target: drug_id,target_id
indication: indication_id
drug_indication: drug_id,indication_id
chemical_entity: entity_category,entity_id
drug_chemical_rel: drug_id,relation_role,chemical_entity_id
chemical_affinity: affinity_id
in_vitro: in_vitro_id
human_activity: activity_id
animal_in_vivo_study: study_id
reference: reference_id
rdc_drug_reference: drug_id,reference_id
```

没有稳定业务唯一键的明细表，apply 时使用整表替换：

```text
in_vitro_measurement
animal_in_vivo_biodist
animal_in_vivo_efficacy
```

整表替换会先创建备份表，再删除目标表当前数据，并插入 CSV 全量数据。

## CSV 校验

校验脚本：

```text
validate_csv_data.py
```

报告 artifact：

```text
csv-validation-reports
```

`rdc_drug.external_id` 为空会出现在报告中，但不会阻断 workflow。

会阻断的典型问题：

```text
引用编号不存在
重复记录
必填字段为空
枚举值非法
数字或日期格式非法
字段过长
CSV 文件缺失
```

## 本地命令

CSV 校验：

```bash
python validate_csv_data.py --schema main.sql --csv-dir csv_templates_normalized --out csv_validation_reports
```

指定表 dry-run：

```bash
npm run upsert:csv -- --table drug_chemical_rel --csv csv_templates_normalized/drug_chemical_rel.csv --key drug_id,relation_role,chemical_entity_id
```

指定表 apply：

```bash
npm run upsert:csv -- --table drug_chemical_rel --csv csv_templates_normalized/drug_chemical_rel.csv --key drug_id,relation_role,chemical_entity_id --apply
```

整表替换 apply 示例：

```bash

npm run upsert:csv -- --table rdc_drug --csv csv_templates_normalized/rdc_drug.csv --replace-table --apply


# chemical_entity
npm run upsert:csv -- --table chemical_entity --csv csv_templates_normalized/chemical_entity.csv --replace-table --apply

# indication
npm run upsert:csv -- --table indication --csv csv_templates_normalized/indication.csv --replace-table --apply

# drug_indication
npm run upsert:csv -- --table drug_indication --csv csv_templates_normalized/drug_indication.csv --replace-table --apply

# reference
npm run upsert:csv -- --table reference --csv csv_templates_normalized/reference.csv --replace-table --apply

# target
npm run upsert:csv -- --table target --csv csv_templates_normalized/target.csv --replace-table --apply



npm run upsert:csv -- --table drug_target --csv csv_templates_normalized/drug_target.csv --replace-table --apply

npm run upsert:csv -- --table animal_in_vivo_study --csv csv_templates_normalized/animal_in_vivo_study.csv --replace-table --apply

npm run upsert:csv -- --table animal_in_vivo_biodist --csv csv_templates_normalized/animal_in_vivo_biodist.csv --replace-table --apply

npm run upsert:csv -- --table animal_in_vivo_efficacy --csv csv_templates_normalized/animal_in_vivo_efficacy.csv --replace-table --apply



npm run upsert:csv -- --table chemical_affinity --csv csv_templates_normalized/chemical_affinity.csv --replace-table --apply



npm run upsert:csv -- --table drug_chemical_rel --csv csv_templates_normalized/drug_chemical_rel.csv --replace-table --apply


npm run upsert:csv -- --table human_activity --csv csv_templates_normalized/human_activity.csv --replace-table --apply

npm run upsert:csv -- --table in_vitro --csv csv_templates_normalized/in_vitro.csv --replace-table --apply

npm run upsert:csv -- --table in_vitro_measurement --csv csv_templates_normalized/in_vitro_measurement.csv --replace-table --apply


npm run upsert:csv -- --table rdc_drug_reference --csv csv_templates_normalized/rdc_drug_reference.csv --replace-table --apply


```

## 注意事项

1. 生产库更新前必须先跑 dry-run。
2. apply 时必须填写 `APPLY_TO_PRODUCTION`。
3. 对整表替换表要特别谨慎，确认 CSV 是完整数据集。
4. 本地执行 `--apply` 前必须确认 `.env.local` 指向的是正确数据库。
5. apply 失败时，先查看日志和自动创建的备份表。
