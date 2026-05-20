# CSV 导入错误报告

校验对象：`csv_templates_normalized/`，按 `main.sql` 的建表规则导入临时 MySQL 库验证。临时库已删除，正式 `rdcdb` 未被修改。

## 概要

- 行级导入错误：10120 条
- 表头问题：27 处
- 优先修复：`chemical_entity.entity_category` 枚举值、`reference.publication_date` 日期格式，以及 DECIMAL 字段里的范围值或 ± 误差值。这些父表问题会造成大量后续外键错误。

## 成功导入行数

| 表 | 成功行数 |
|---|---:|
| rdc_drug | 2051 |
| target | 135 |
| indication | 107 |
| chemical_entity | 54 |
| reference | 24 |
| drug_target | 1937 |
| drug_indication | 2252 |
| drug_chemical_rel | 2031 |
| chemical_affinity | 0 |
| in_vitro | 1562 |
| in_vitro_measurement | 1112 |
| human_activity | 690 |
| animal_in_vivo_study | 2590 |
| animal_in_vivo_biodist | 2976 |
| animal_in_vivo_efficacy | 171 |
| rdc_drug_reference | 43 |

## 表头问题

| 表 | 问题 | 列 |
|---|---|---|
| animal_in_vivo_biodist | 使用了别名表头 | Type -> biodist_type |
| animal_in_vivo_biodist | 非建表字段，已忽略 | Cell lines |
| animal_in_vivo_study | 使用了别名表头 | drug-id -> drug_id |
| drug_indication | 使用了别名表头 | RDC-ID -> drug_id |
| drug_indication | 空表头 | (blank #3)<br>(blank #4)<br>(blank #5) |
| in_vitro | 空表头 | (blank #8)<br>(blank #9)<br>(blank #10)<br>(blank #11) |
| rdc_drug | 使用了别名表头 | Type -> type |
| rdc_drug | 非建表字段，已忽略 | MOA |
| rdc_drug | 空表头 | (blank #18)<br>(blank #19)<br>(blank #20)<br>(blank #21)<br>(blank #22)<br>(blank #23)<br>(blank #24)<br>(blank #25)<br>(blank #26)<br>(blank #27)<br>(blank #28)<br>(blank #29)<br>(blank #30)<br>(blank #31) |

## 错误分组

### 1. 外键缺失（2197 行）

**问题**：rdc_drug_reference.reference_id 引用了不存在的 reference.reference_id。

**涉及表**：rdc_drug_reference：2197

**修复建议**：先补齐父表记录。如果一个单元格有多个 ID，需要拆成多行。注意前置表导入失败会造成连锁外键错误。

**样例**：
- rdc_drug_reference.csv 第 2 行：drug_id=RDC00751; reference_id=RE00751
- rdc_drug_reference.csv 第 3 行：drug_id=RDC00752; reference_id=RE00751
- rdc_drug_reference.csv 第 4 行：drug_id=RDC00754; reference_id=RE00753
- rdc_drug_reference.csv 第 5 行：drug_id=RDC00755; reference_id=RE00754
- rdc_drug_reference.csv 第 6 行：drug_id=RDC00756; reference_id=RE00754
- rdc_drug_reference.csv 第 7 行：drug_id=RDC00757; reference_id=RE00754
- rdc_drug_reference.csv 第 8 行：drug_id=RDC00758; reference_id=RE00754
- rdc_drug_reference.csv 第 9 行：drug_id=RDC00759; reference_id=RE00755

### 2. 数字格式错误（2146 行）

**问题**：animal_in_vivo_biodist.dosage_value 是 DECIMAL 类型，但 CSV 里有范围、均值±误差、日期或文本。

**涉及表**：animal_in_vivo_biodist：2146

**修复建议**：只保留一个纯数字，或者调整表结构增加 raw_value / min / max / error 等字段。

**样例**：
- animal_in_vivo_biodist.csv 第 6 行：study_ref_id=BIO00101; biodist_type=Imaging; animal_model=SCID mice were subcutaneously injected into the right flank with H2009 or MDA-MB-231 cells; dosage_symbols==; dosage_value=15-20; dosage_unit=MBq
- animal_in_vivo_biodist.csv 第 7 行：study_ref_id=BIO00101; biodist_type=Imaging; animal_model=SCID mice were subcutaneously injected into the right flank with H2009 or MDA-MB-231 cells; dosage_symbols==; dosage_value=15-20; dosage_unit=MBq
- animal_in_vivo_biodist.csv 第 8 行：study_ref_id=BIO00101; biodist_type=Imaging; animal_model=SCID mice were subcutaneously injected into the right flank with H2009 or MDA-MB-231 cells; dosage_symbols==; dosage_value=15-20; dosage_unit=MBq
- animal_in_vivo_biodist.csv 第 50 行：study_ref_id=BIO00118; biodist_type=Ex vivo biodistribution; animal_model=Subcutaneous implantation of BxPC-3 cells into the left shoulder of 6-8 week old female nu; dosage_symbols==; dosage_value=3-3.7; dosage_unit=MBq
- animal_in_vivo_biodist.csv 第 51 行：study_ref_id=BIO00118; biodist_type=Ex vivo biodistribution; animal_model=Subcutaneous implantation of BxPC-3 cells into the left shoulder of 6-8 week old female nu; dosage_symbols==; dosage_value=3-3.7; dosage_unit=MBq
- animal_in_vivo_biodist.csv 第 52 行：study_ref_id=BIO00119; biodist_type=Ex vivo biodistribution; animal_model=Subcutaneous implantation of BxPC-3 cells into the left shoulder of 6-8 week old female nu; dosage_symbols==; dosage_value=3-3.7; dosage_unit=MBq
- animal_in_vivo_biodist.csv 第 53 行：study_ref_id=BIO00119; biodist_type=Ex vivo biodistribution; animal_model=Subcutaneous implantation of BxPC-3 cells into the left shoulder of 6-8 week old female nu; dosage_symbols==; dosage_value=3-3.7; dosage_unit=MBq
- animal_in_vivo_biodist.csv 第 54 行：study_ref_id=BIO00120; biodist_type=Ex vivo biodistribution; animal_model=Subcutaneous implantation of BxPC-3 cells into the left shoulder of 6-8 week old female nu; dosage_symbols==; dosage_value=3-3.7; dosage_unit=MBq

### 3. 枚举值错误（1697 行）

**问题**：chemical_entity.entity_category 只允许 cold_compound、ligand、linker、chelator、radionuclide，CSV 里有其它值。

**涉及表**：chemical_entity：1697

**修复建议**：统一枚举值，例如 Radionuclide -> radionuclide。entity_category=RDC 的行很可能不应放在 chemical_entity 表。

**样例**：
- chemical_entity.csv 第 56 行：entity_id=RDC00100; entity_category=RDC; name=[68Ga]Ga-D0103
- chemical_entity.csv 第 57 行：entity_id=RDC00101; entity_category=RDC; name=[68Ga]Ga-Trivehexin
- chemical_entity.csv 第 58 行：entity_id=RDC00102; entity_category=RDC; name=[90Y]Y-3PRGD2
- chemical_entity.csv 第 59 行：entity_id=RDC00103; entity_category=RDC; name=[111In]In-3PRGD2
- chemical_entity.csv 第 60 行：entity_id=RDC00104; entity_category=RDC; name=[111In]In-RGD4
- chemical_entity.csv 第 61 行：entity_id=RDC00105; entity_category=RDC; name=[90Y]Y-RGD4
- chemical_entity.csv 第 62 行：entity_id=RDC00106; entity_category=RDC; name=[99mTc]Tc-(RGD)6
- chemical_entity.csv 第 63 行：entity_id=RDC00107; entity_category=RDC; name=[99mTc]Tc-(RGD)4

### 4. 日期格式错误（1464 行）

**问题**：reference.publication_date 是 DATE 类型，CSV 使用了 20-Jun-25、2026 Jan 10 等格式。

**涉及表**：reference：1464

**修复建议**：导入前统一转为 YYYY-MM-DD，例如 20-Jun-25 -> 2025-06-20。

**样例**：
- reference.csv 第 2 行：reference_id=RE00100; title=PET/CT imaging of esophageal cancer targeting tumor cell specific αvβ6-integrin expression; journal=European journal of nuclear medicine and molecular imaging; publication_date=20-Jun-25; doi=10.1007/s00259-025-07408-7
- reference.csv 第 3 行：reference_id=RE00101; title=PET/CT imaging of head-and-neck and pancreatic cancer in humans by targeting the "Cancer I; journal=European journal of nuclear medicine and molecular imaging; publication_date=24-Sep-21; volume=49; issue=4
- reference.csv 第 4 行：reference_id=RE00102; title=Two ⁹⁰Y-labeled multimeric RGD peptides RGD4 and 3PRGD2 for integrin targeted radionuclide; journal=Molecular pharmaceutics; publication_date=19-Jan-11; volume=8; issue=2
- reference.csv 第 5 行：reference_id=RE00103; title=Design of a Tetravalent RGD Peptide Capable of Simultaneous Binding with Multiple Integrin; journal=Journal of medicinal chemistry; publication_date=13-May-25; volume=68; issue=6
- reference.csv 第 6 行：reference_id=RE00104; title=Preclinical Evaluation of 68Ga- and 177Lu-Labeled Integrin αvβ6-Targeting Radiotheranostic; journal=Journal of nuclear medicine : official publication, Society of Nuclear Medicine; publication_date=7-Oct-22; volume=64; issue=4
- reference.csv 第 7 行：reference_id=RE00104; title=Preclinical Evaluation of 68Ga- and 177Lu-Labeled Integrin αvβ6-Targeting Radiotheranostic; journal=Journal of nuclear medicine : official publication, Society of Nuclear Medicine; publication_date=7-Oct-22; volume=64; issue=4
- reference.csv 第 8 行：reference_id=RE00105; title=[68Ga]NODAGA-RGD for imaging αvβ3 integrin expression; journal=European journal of nuclear medicine and molecular imaging; publication_date=13-Apr-11; volume=38; issue=7
- reference.csv 第 9 行：reference_id=RE00106; title=(64)Cu-labeled tetrameric and octameric RGD peptides for small-animal PET of tumor alpha(v; journal=Journal of nuclear medicine : official publication, Society of Nuclear Medicine; publication_date=15-Jun-07; volume=48; issue=7

### 5. 数字格式错误（717 行）

**问题**：animal_in_vivo_biodist.tbr_tumor_blood 是 DECIMAL 类型，但 CSV 里有范围、均值±误差、日期或文本。

**涉及表**：animal_in_vivo_biodist：717

**修复建议**：只保留一个纯数字，或者调整表结构增加 raw_value / min / max / error 等字段。

**样例**：
- animal_in_vivo_biodist.csv 第 9 行：study_ref_id=BIO00102; biodist_type=Ex vivo biodistribution; animal_model=In SCID mice, human lung adenocarcinoma cell line H2009 cell line was subcutaneously trans; dosage_symbols==; dosage_value=3; dosage_unit=MBq
- animal_in_vivo_biodist.csv 第 10 行：study_ref_id=BIO00103; biodist_type=Ex vivo biodistribution; animal_model=In SCID mice, human lung adenocarcinoma cell line H2009 cell line was subcutaneously trans; dosage_symbols==; dosage_value=3; dosage_unit=MBq
- animal_in_vivo_biodist.csv 第 35 行：study_ref_id=BIO00108; biodist_type=Ex vivo biodistribution; animal_model=5-week-old male BALB c nu/nu mice were subcutaneously injected with MDA-MB-435S cells in t; dosage_symbols==; dosage_value=0.01; dosage_unit=MBq
- animal_in_vivo_biodist.csv 第 36 行：study_ref_id=BIO00108; biodist_type=Ex vivo biodistribution; animal_model=5-week-old male BALB c nu/nu mice were subcutaneously injected with MDA-MB-435S cells in t; dosage_symbols==; dosage_value=0.01; dosage_unit=MBq
- animal_in_vivo_biodist.csv 第 37 行：study_ref_id=BIO00108; biodist_type=Ex vivo biodistribution; animal_model=5-week-old male BALB c nu/nu mice were subcutaneously injected with MDA-MB-435S cells in t; dosage_symbols==; dosage_value=0.01; dosage_unit=MBq
- animal_in_vivo_biodist.csv 第 38 行：study_ref_id=BIO00109; biodist_type=Ex vivo biodistribution; animal_model=5-week-old male BALB c nu/nu mice were subcutaneously injected with MDA-MB-435S cells in t; dosage_symbols==; dosage_value=0.01; dosage_unit=MBq
- animal_in_vivo_biodist.csv 第 39 行：study_ref_id=BIO00109; biodist_type=Ex vivo biodistribution; animal_model=5-week-old male BALB c nu/nu mice were subcutaneously injected with MDA-MB-435S cells in t; dosage_symbols==; dosage_value=0.01; dosage_unit=MBq
- animal_in_vivo_biodist.csv 第 40 行：study_ref_id=BIO00109; biodist_type=Ex vivo biodistribution; animal_model=5-week-old male BALB c nu/nu mice were subcutaneously injected with MDA-MB-435S cells in t; dosage_symbols==; dosage_value=0.01; dosage_unit=MBq

### 6. 数字格式错误（309 行）

**问题**：chemical_affinity.affinity_value 是 DECIMAL 类型，但 CSV 里有范围、均值±误差、日期或文本。

**涉及表**：chemical_affinity：309

**修复建议**：只保留一个纯数字，或者调整表结构增加 raw_value / min / max / error 等字段。

**样例**：
- chemical_affinity.csv 第 2 行：affinity_id=CHAF00001; chemical_entity_id=CC02020; affinity_type=IC50; affinity_symbols==; affinity_value=50.0 ± 4.4; affinity_unit=nM
- chemical_affinity.csv 第 3 行：affinity_id=CHAF00002; chemical_entity_id=CC02021; affinity_type=IC50; affinity_symbols==; affinity_value=29.0 ± 0.6; affinity_unit=nM
- chemical_affinity.csv 第 4 行：affinity_id=CHAF00003; chemical_entity_id=CC02022; affinity_type=IC50; affinity_symbols==; affinity_value=2.8±1.0; affinity_unit=nM
- chemical_affinity.csv 第 5 行：affinity_id=CHAF00004; chemical_entity_id=CC02023; affinity_type=IC50; affinity_symbols==; affinity_value=2.8±1.0; affinity_unit=nM
- chemical_affinity.csv 第 6 行：affinity_id=CHAF00005; chemical_entity_id=CC02024; affinity_type=IC50; affinity_symbols==; affinity_value=（3.2 ± 0.9） * 10^-7; affinity_unit=M
- chemical_affinity.csv 第 7 行：affinity_id=CHAF00006; chemical_entity_id=LIG00103; affinity_type=IC50; affinity_symbols==; affinity_value=（3.5 ± 0.3） * 10^-8; affinity_unit=M
- chemical_affinity.csv 第 8 行：affinity_id=CHAF00007; chemical_entity_id=CC02025; affinity_type=IC50; affinity_symbols==; affinity_value=（1.1 ± 0.2）*10^−7; affinity_unit=M
- chemical_affinity.csv 第 9 行：affinity_id=CHAF00008; chemical_entity_id=LIG00103; affinity_type=IC50; affinity_symbols==; affinity_value=（1.0 ± 0.2）*10^−8; affinity_unit=M

### 7. 外键缺失（281 行）

**问题**：chemical_affinity.chemical_entity_id 引用了不存在的 chemical_entity.entity_id。

**涉及表**：chemical_affinity：281

**修复建议**：先补齐父表记录。如果一个单元格有多个 ID，需要拆成多行。注意前置表导入失败会造成连锁外键错误。

**样例**：
- chemical_affinity.csv 第 21 行：affinity_id=CHAF00020; chemical_entity_id=LIG00102; affinity_type=IC50; affinity_symbols==; affinity_value=0.9; affinity_unit=nM
- chemical_affinity.csv 第 40 行：affinity_id=CHAF00039; chemical_entity_id=CC00139; affinity_type=IC50; affinity_symbols==; affinity_value=304.8; affinity_unit=nM
- chemical_affinity.csv 第 41 行：affinity_id=CHAF00040; chemical_entity_id=LIG00127; affinity_type=IC50; affinity_symbols==; affinity_value=252.8; affinity_unit=nM
- chemical_affinity.csv 第 42 行：affinity_id=CHAF00041; chemical_entity_id=LIG00111; affinity_type=IC50; affinity_symbols==; affinity_value=1081.8; affinity_unit=nM
- chemical_affinity.csv 第 54 行：affinity_id=CHAF00053; chemical_entity_id=CC00139; affinity_type=IC50; affinity_symbols==; affinity_value=304.8; affinity_unit=nM
- chemical_affinity.csv 第 55 行：affinity_id=CHAF00054; chemical_entity_id=LIG00127; affinity_type=IC50; affinity_symbols==; affinity_value=252.8; affinity_unit=nM
- chemical_affinity.csv 第 56 行：affinity_id=CHAF00055; chemical_entity_id=LIG00111; affinity_type=IC50; affinity_symbols==; affinity_value=1081.8; affinity_unit=nM
- chemical_affinity.csv 第 57 行：affinity_id=CHAF00056; chemical_entity_id=LIG00127; affinity_type=IC50; affinity_symbols==; affinity_value=1354.5; affinity_unit=nM

### 8. 外键缺失（262 行）

**问题**：drug_indication.indication_id 引用了不存在的 indication.indication_id。

**涉及表**：drug_indication：262

**修复建议**：先补齐父表记录。如果一个单元格有多个 ID，需要拆成多行。注意前置表导入失败会造成连锁外键错误。

**样例**：
- drug_indication.csv 第 2 行：drug_id=RDC02854; indication_id=IN00139
- drug_indication.csv 第 4 行：drug_id=RDC00008; indication_id=IN00139
- drug_indication.csv 第 14 行：drug_id=RDC00031; indication_id=IN00009, IN00062, IN00056
- drug_indication.csv 第 20 行：drug_id=RDC00034; indication_id=IN00138
- drug_indication.csv 第 24 行：drug_id=RDC00035; indication_id=IN00138
- drug_indication.csv 第 125 行：drug_id=RDC00085; indication_id=IN00138
- drug_indication.csv 第 187 行：drug_id=RDC00152; indication_id=IN00006, IN00001, IN00050, IN00009, IN00042, IN00056
- drug_indication.csv 第 188 行：drug_id=RDC00153; indication_id=IN00006, IN00001, IN00050, IN00009, IN00042, IN00056

### 9. 外键缺失（206 行）

**问题**：in_vitro_measurement.in_vitro_ref_id 引用了不存在的 in_vitro.in_vitro_id。

**涉及表**：in_vitro_measurement：206

**修复建议**：先补齐父表记录。如果一个单元格有多个 ID，需要拆成多行。注意前置表导入失败会造成连锁外键错误。

**样例**：
- in_vitro_measurement.csv 第 66 行：in_vitro_ref_id=VI00257; measurement_category=Affinity; measurement_type=IC50; measurement_symbols==; measurement_value=86 ± 7; measurement_unit=nM
- in_vitro_measurement.csv 第 80 行：in_vitro_ref_id=VI00309; measurement_category=Partition_coefficient; measurement_type=LogP; measurement_symbols==; measurement_value=-1.68
- in_vitro_measurement.csv 第 81 行：in_vitro_ref_id=VIO0309; measurement_category=Affinity; measurement_type=Ki; measurement_symbols==; measurement_value=13.2±5.4; measurement_unit=nM
- in_vitro_measurement.csv 第 82 行：in_vitro_ref_id=VIO0312; measurement_category=Affinity; measurement_type=IC50; measurement_symbols==; measurement_value=68.9±0.2; measurement_unit=nM
- in_vitro_measurement.csv 第 89 行：in_vitro_ref_id=VI00340; measurement_category=Affinity; measurement_type=Kd; measurement_symbols==; measurement_value=1.25 ± 0.16; measurement_unit=nM
- in_vitro_measurement.csv 第 97 行：in_vitro_ref_id=VI00355; measurement_category=Affinity; measurement_type=Kd; measurement_symbols==; measurement_value=6.6 ± 2.0; measurement_unit=nM
- in_vitro_measurement.csv 第 98 行：in_vitro_ref_id=VI00356; measurement_category=Affinity; measurement_type=Kd; measurement_symbols==; measurement_value=6.6 ± 2.0; measurement_unit=nM
- in_vitro_measurement.csv 第 102 行：in_vitro_ref_id=VI00388; measurement_category=Partition_coefficient; measurement_type=Log P; measurement_symbols==; measurement_value=-2.40 ± 0.05; method_description=The test compound is added to an immiscible n-octanol-water two-phase system and thoroughl

### 10. 外键缺失（151 行）

**问题**：human_activity.drug_id 引用了不存在的 rdc_drug.drug_id。

**涉及表**：human_activity：151

**修复建议**：先补齐父表记录。如果一个单元格有多个 ID，需要拆成多行。注意前置表导入失败会造成连锁外键错误。

**样例**：
- human_activity.csv 第 34 行：activity_id=HU0033; drug_id=RDC00466; pmid=18483090; doi=10.2967/jnumed.107.049452; indication=Detecting tumor lesions in patients with metastatic breast cancer; patients=7 Breast cancer patients with distant metastasis have occurred.(age>25y,performance status
- human_activity.csv 第 35 行：activity_id=HU0034; drug_id=RDC00466; pmid=18483090; doi=10.2967/jnumed.107.049452; indication=Detecting tumor lesions in patients with metastatic breast cancer; patients=7 Breast cancer patients with distant metastasis have occurred.(age>25y,performance status
- human_activity.csv 第 47 行：activity_id=HU0046; drug_id=RDC00606; pmid=25168627; doi=10.2967/jnumed.114.144543; indication=Imaging of somatostatin receptor-positive tumors (Neuroendocrine tumors); patients=Imaging of neuroendocrine tumors and their metastases
- human_activity.csv 第 48 行：activity_id=HU0047; drug_id=RDC00606; pmid=30953466; doi=10.1186/s12885-019-5540-5; indication=Detection of SSTR2 expression in MTC lesions; patients=Treated cohort (N=10); Retrospective untreated cohort (N=35)
- human_activity.csv 第 75 行：activity_id=HU0074; drug_id=RDC00609; pmid=30014345; doi=10.1007/s11307-018-1252-5; indication=Grade 1/Grade 2 Pancreatic Neuroendocrine Tumors; patients=31
- human_activity.csv 第 76 行：activity_id=HU0075; drug_id=RDC00609; pmid=30014345; doi=10.1007/s11307-018-1252-5; indication=Grade 1/Grade 2 Pancreatic Neuroendocrine Tumors; patients=31
- human_activity.csv 第 103 行：activity_id=HU0102; drug_id=RDC00609; pmid=31755622; doi=10.1002/hed.26024; indication=Somatostatin receptor-positive metastatic medullary thyroid carcinoma (MTC); patients=43 patients (35 male, 8 female; median age 48 years, range 25-80)
- human_activity.csv 第 104 行：activity_id=HU0103; drug_id=RDC00609; pmid=31755622; doi=10.1002/hed.26024; indication=Somatostatin receptor-positive metastatic medullary thyroid carcinoma (MTC); patients=43 patients (35 male, 8 female; median age 48 years, range 25-80)

### 11. 外键缺失（107 行）

**问题**：rdc_drug_reference.drug_id 引用了不存在的 rdc_drug.drug_id。

**涉及表**：rdc_drug_reference：107

**修复建议**：先补齐父表记录。如果一个单元格有多个 ID，需要拆成多行。注意前置表导入失败会造成连锁外键错误。

**样例**：
- rdc_drug_reference.csv 第 33 行：drug_id=RDC00057; reference_id=RE001465
- rdc_drug_reference.csv 第 100 行：drug_id=RDC00920; reference_id=RE01389
- rdc_drug_reference.csv 第 195 行：drug_id=RDC00130; reference_id=RE00114
- rdc_drug_reference.csv 第 322 行：drug_id=RDC00296; reference_id=RE00210
- rdc_drug_reference.csv 第 323 行：drug_id=RDC00297; reference_id=RE00211
- rdc_drug_reference.csv 第 324 行：drug_id=RDC00298; reference_id=RE00212
- rdc_drug_reference.csv 第 325 行：drug_id=RDC00300; reference_id=RE00213
- rdc_drug_reference.csv 第 326 行：drug_id=RDC00302; reference_id=RE00214

### 12. 外键缺失（90 行）

**问题**：drug_target.target_id 引用了不存在的 target.target_id。

**涉及表**：drug_target：90

**修复建议**：先补齐父表记录。如果一个单元格有多个 ID，需要拆成多行。注意前置表导入失败会造成连锁外键错误。

**样例**：
- drug_target.csv 第 16 行：drug_id=RDC00116; target_id=TAR0023, TAR0065, TAR0064
- drug_target.csv 第 24 行：drug_id=RDC00124; target_id=TAR0023, TAR0020
- drug_target.csv 第 42 行：drug_id=RDC00149; target_id=TAR0015, TAR0023
- drug_target.csv 第 43 行：drug_id=RDC00150; target_id=TAR0015, TAR0023
- drug_target.csv 第 44 行：drug_id=RDC00151; target_id=TAR0015, TAR0023
- drug_target.csv 第 45 行：drug_id=RDC00152; target_id=TAR0003，TAR0023
- drug_target.csv 第 46 行：drug_id=RDC00153; target_id=TAR0003，TAR0023
- drug_target.csv 第 47 行：drug_id=RDC00154; target_id=TAR0003，TAR0023

### 13. 数字格式错误（77 行）

**问题**：animal_in_vivo_efficacy.efficacy_dosage_value 是 DECIMAL 类型，但 CSV 里有范围、均值±误差、日期或文本。

**涉及表**：animal_in_vivo_efficacy：77

**修复建议**：只保留一个纯数字，或者调整表结构增加 raw_value / min / max / error 等字段。

**样例**：
- animal_in_vivo_efficacy.csv 第 4 行：study_ref_id=EF00114; efficacy_animal_model=BxPC-3 cells (5 3 106) were implanted subcutaneously into the left shoulder of 6- to 8-wk-; efficacy_dosage_symbols==; efficacy_dosage_value=3.7–5.55; efficacy_dosage_unit=MBq; efficacy_description=Fractionated administration (2×37 MBq) prolongs median survival time, providing a new para
- animal_in_vivo_efficacy.csv 第 26 行：study_ref_id=FE00519; efficacy_animal_model=Nude mice with advanced human bladder carcinoma; efficacy_dosage_symbols==; efficacy_dosage_value=0.46-0.93; efficacy_dosage_unit=MBq; efficacy_description=Mean survival increased from 65.4d to 141.5d, 33% survival >268d
- animal_in_vivo_efficacy.csv 第 34 行：study_ref_id=EF00611; efficacy_animal_model=BALB/c nude mice with A-427cells; efficacy_dosage_symbols==; efficacy_dosage_value=​400​ or ​500; efficacy_dosage_unit=μCi​; efficacy_description=Mice given two intratumoral AdSSTr2 injections + four 400/500 μCi [90Y]-SMT 487 doses had 
- animal_in_vivo_efficacy.csv 第 37 行：study_ref_id=EF00613; efficacy_animal_model=BALB/c nude mice bearing A549 lung cancer xenografts; efficacy_dosage_symbols==; efficacy_dosage_value=370 or 740; efficacy_dosage_unit=kBq; efficacy_description=TUNEL assay detected significantly more apoptotic cells in radioligand-treated groups, sho
- animal_in_vivo_efficacy.csv 第 38 行：study_ref_id=EF00614; efficacy_animal_model=BALB/c nude mice with C666-1 xenografts; efficacy_dosage_symbols==; efficacy_dosage_value=18.5​​, ​​29.6​; efficacy_dosage_unit=MBq; efficacy_description=Highly potent.​​ ​​Dose-dependent tumor growth inhibition and regression.​​ 29.6 MBq group
- animal_in_vivo_efficacy.csv 第 40 行：study_ref_id=EF00618; efficacy_animal_model=Male 6–8-week-old BALB/c (nu/nu) nude mice bearing CA20948 cells; efficacy_dosage_symbols==; efficacy_dosage_value=2~4; efficacy_dosage_unit=MBq; efficacy_description=Higher tumour uptakes were found in CA20948 tumour-bearing animals compared to those in H6
- animal_in_vivo_efficacy.csv 第 41 行：study_ref_id=EF00619; efficacy_animal_model=Male 6–8-week-old BALB/c (nu/nu) nude mice bearing H69 cells; efficacy_dosage_symbols==; efficacy_dosage_value=2~4; efficacy_dosage_unit=MBq; efficacy_description=For H69 tumour-bearing mice, the highest tumour uptake was found to be 9.8 ± 2.4 %IA/g. Ne
- animal_in_vivo_efficacy.csv 第 44 行：study_ref_id=EF00622; efficacy_animal_model=H69 xenograft mice; efficacy_dosage_symbols==; efficacy_dosage_value=46.3, 148; efficacy_dosage_unit=kBq; efficacy_description=Animals treated with 225Ac-MACROPAATE demonstrated a significant tumor growth delay and im

### 14. 外键缺失（73 行）

**问题**：animal_in_vivo_biodist.study_ref_id 引用了不存在的 animal_in_vivo_study.study_id。

**涉及表**：animal_in_vivo_biodist：73

**修复建议**：先补齐父表记录。如果一个单元格有多个 ID，需要拆成多行。注意前置表导入失败会造成连锁外键错误。

**样例**：
- animal_in_vivo_biodist.csv 第 1618 行：study_ref_id=BIO01451; biodist_type=Ex vivo biodistribution; animal_model=4-5-week-old BALB/c nude mice (subcutaneous inoculation of U87MG cells into the right trun; dosage_symbols==; dosage_value=0.6; dosage_unit=MBq
- animal_in_vivo_biodist.csv 第 1619 行：study_ref_id=BIO01451; biodist_type=Ex vivo biodistribution; animal_model=4-5-week-old BALB/c nude mice (subcutaneous inoculation of U87MG cells into the right trun; dosage_symbols==; dosage_value=0.6; dosage_unit=MBq
- animal_in_vivo_biodist.csv 第 1620 行：study_ref_id=BIO01451; biodist_type=Ex vivo biodistribution; animal_model=4-5-week-old BALB/c nude mice (subcutaneous inoculation of U87MG cells into the right trun; dosage_symbols==; dosage_value=0.6; dosage_unit=MBq
- animal_in_vivo_biodist.csv 第 1621 行：study_ref_id=BIO01451; biodist_type=Ex vivo biodistribution; animal_model=4-5-week-old BALB/c nude mice (subcutaneous inoculation of U87MG cells into the right trun; dosage_symbols==; dosage_value=0.6; dosage_unit=MBq
- animal_in_vivo_biodist.csv 第 1622 行：study_ref_id=BIO01451; biodist_type=Ex vivo biodistribution; animal_model=4-5-week-old BALB/c nude mice (subcutaneous inoculation of U87MG cells into the right trun; dosage_symbols==; dosage_value=0.6; dosage_unit=MBq
- animal_in_vivo_biodist.csv 第 1623 行：study_ref_id=BIO01451; biodist_type=Ex vivo biodistribution; animal_model=4-5-week-old BALB/c nude mice (subcutaneous inoculation of U87MG cells into the right trun; dosage_symbols==; dosage_value=0.6; dosage_unit=MBq
- animal_in_vivo_biodist.csv 第 2163 行：study_ref_id=BIO02081; biodist_type=Imaging; animal_model=C57BL/6 mice bearing MEER tumors; dosage_symbols==; dosage_value=50; dosage_unit=µg
- animal_in_vivo_biodist.csv 第 2369 行：study_ref_id=BIO02208; biodist_type=Ex vivo biodistribution; animal_model=Injection of 4T1 cells into the mammary gland of 8-week-old female Balb-c mice; metabolism=Hepatobiliary and renal

### 15. 唯一键重复（69 行）

**问题**：违反 UNIQUE KEY，通常是同一关联重复录入。

**涉及表**：drug_indication：51，animal_in_vivo_study：9，in_vitro：6，rdc_drug：1，indication：1，drug_target：1

**修复建议**：去重，保留一行或合并备注字段。

**样例**：
- rdc_drug.csv 第 738 行：drug_id=RDC01070; drug_name=[177Lu]Lu-girentuximab; drug_synonyms=177Lu-girentuximab; 177Lu-TLX250; [177Lu]Lu-girentuximab; status=Phase 3; type=Treatment; main_pubmed=26706103
- indication.csv 第 70 行：indication_id=IN00070; name=Myocardial Infarction; icd11_code=BA41.Z; description=Myocardial infarction is a life-threatening cardiovascular condition caused by abrupt bloc
- drug_target.csv 第 1895 行：drug_id=RDC01070; target_id=TAR0018
- drug_indication.csv 第 102 行：drug_id=RDC00070; indication_id=IN00041
- drug_indication.csv 第 104 行：drug_id=RDC00071; indication_id=IN00041
- drug_indication.csv 第 124 行：drug_id=RDC00084; indication_id=IN00041
- drug_indication.csv 第 363 行：drug_id=RDC00351; indication_id=IN00056
- drug_indication.csv 第 497 行：drug_id=RDC00522; indication_id=IN00072

### 16. 数字格式错误（65 行）

**问题**：animal_in_vivo_biodist.tbr_tumor_muscle 是 DECIMAL 类型，但 CSV 里有范围、均值±误差、日期或文本。

**涉及表**：animal_in_vivo_biodist：65

**修复建议**：只保留一个纯数字，或者调整表结构增加 raw_value / min / max / error 等字段。

**样例**：
- animal_in_vivo_biodist.csv 第 146 行：study_ref_id=BIO00157; biodist_type=Ex vivo biodistribution; animal_model=Subcutaneous inoculation of BxPC-3 cells on the right anterior ventral side of female BALB; detection_time=0.5h; metabolism=We assessed the metabolic stability of 99mTc–HYNIC–cHK in normal BALB/c mice by analyzing 
- animal_in_vivo_biodist.csv 第 264 行：study_ref_id=BIO01430; biodist_type=Ex vivo biodistribution; animal_model=Female CF-1 mice carrying PC3 cells; metabolism=The drug exhibits high stability in the body, with no significant metal displacement or me
- animal_in_vivo_biodist.csv 第 265 行：study_ref_id=BIO01430; biodist_type=Ex vivo biodistribution; animal_model=Female CF-1 mice carrying PC3 cells; metabolism=The drug exhibits high stability in the body, with no significant metal displacement or me
- animal_in_vivo_biodist.csv 第 266 行：study_ref_id=BIO01430; biodist_type=Ex vivo biodistribution; animal_model=Female CF-1 mice carrying PC3 cells; metabolism=The drug exhibits high stability in the body, with no significant metal displacement or me
- animal_in_vivo_biodist.csv 第 328 行：study_ref_id=BIO00252; biodist_type=Ex vivo biodistribution; animal_model=Subcutaneous implantation of U87MG cells into the right upper abdomen of female BALB/nude ; dosage_symbols==; dosage_value=15; dosage_unit=μCi
- animal_in_vivo_biodist.csv 第 340 行：study_ref_id=BIO00258; biodist_type=Imaging; animal_model=Subcutaneous injection of U87MG tumor into the forelimbs of 3-4 week old female thymus fre; dosage_symbols==; dosage_value=3.7; dosage_unit=MBq
- animal_in_vivo_biodist.csv 第 399 行：study_ref_id=BIO00293; biodist_type=Ex vivo biodistribution; animal_model=Subcutaneous implantation of BxPC-3 cells in mice; dosage_symbols==; dosage_value=5.5; dosage_unit=MBq
- animal_in_vivo_biodist.csv 第 402 行：study_ref_id=BIO00294; biodist_type=Imaging; animal_model=Subcutaneous implantation of BxPC-3 cells in mice; dosage_symbols==; dosage_value=37; dosage_unit=MBq

### 17. 字段过长（54 行）

**问题**：CSV 内容超过 main.sql 里 VARCHAR 字段的长度限制。

**涉及表**：human_activity：28，animal_in_vivo_biodist：17，animal_in_vivo_efficacy：9

**修复建议**：缩短内容，或把该字段改成 TEXT / 更大的 VARCHAR。

**样例**：
- human_activity.csv 第 36 行：activity_id=HU0035; drug_id=RDC00606; doi=10.1002/bip.10256; indication=Neuroendocrine tumours; patients=30 end-stage patients with mainly neuroendocrine tumours.; frequency=At least 2 weeks intervals between administrations and a total of eight administrations is
- human_activity.csv 第 40 行：activity_id=HU0039; drug_id=RDC00621; doi=10.1007/s00259-005-1872-2; indication=Somatostatin receptor (sstr)positive tumours; patients=Six patients with somatostatin receptor (sstr)-positive tumours; frequency=After injection of 137±28 MBq [123I]Mtr-TOCA, dynamic data acquisition of the upper abdome
- human_activity.csv 第 41 行：activity_id=HU0040; drug_id=RDC00621; doi=10.1007/s00259-005-1872-2; indication=Somatostatin receptor (sstr)positive tumours; patients=Six patients with somatostatin receptor (sstr)-positive tumours; frequency=After injection of 137±28 MBq [123I]Mtr-TOCA, dynamic data acquisition of the upper abdome
- human_activity.csv 第 42 行：activity_id=HU0041; drug_id=RDC00622; doi=10.1007/s00259-005-1872-2; indication=Somatostatin receptor (sstr)positive tumours; patients=Six patients with somatostatin receptor (sstr)-positive tumours; frequency=After injection of 137±28 MBq [123I]Mtr-TOCA, dynamic data acquisition of the upper abdome
- human_activity.csv 第 295 行：activity_id=HU0294; drug_id=RDC01385; pmid=27635024; doi=10.2967/jnumed.116.178939; indication=mCRPC; patients=Two male patients. One 73-year-old with metastatic castration-resistant prostate cancer (m
- human_activity.csv 第 296 行：activity_id=HU0295; drug_id=RDC01237; pmid=27056618; doi=10.2967/jnumed.116.173757; indication=mCRPC; patients=n=82; all male;​​ Median age: ​​73 years​​ (range 43-87). Heavily pre-treated: 99% had pri
- human_activity.csv 第 297 行：activity_id=HU0296; drug_id=RDC01237; pmid=27056618; doi=10.2967/jnumed.116.173757; indication=mCRPC; patients=n=82; all male;​​ Median age: ​​73 years​​ (range 43-87). Heavily pre-treated: 99% had pri
- human_activity.csv 第 370 行：activity_id=HU0369; drug_id=RDC01720; pmid=32817142; doi=10.2967/jnumed.120.248799; indication=Breast Cancer; patients=29 patients with untreated primary breast cancer.

### 18. 数字格式错误（53 行）

**问题**：animal_in_vivo_biodist.tbr_tumor_kidney 是 DECIMAL 类型，但 CSV 里有范围、均值±误差、日期或文本。

**涉及表**：animal_in_vivo_biodist：53

**修复建议**：只保留一个纯数字，或者调整表结构增加 raw_value / min / max / error 等字段。

**样例**：
- animal_in_vivo_biodist.csv 第 689 行：study_ref_id=BIO00732; biodist_type=Ex vivo biodistribution; animal_model=Subcutaneous inoculation of DX3puro and DX3puro β 6 cells into the contralateral scapula o; dosage_symbols==; dosage_value=50; dosage_unit=μCi
- animal_in_vivo_biodist.csv 第 775 行：study_ref_id=BIO00768; biodist_type=Ex vivo biodistribution; animal_model=BALB/κ nude mice (half male and half female, 4-6 weeks old) were subcutaneously injected w; dosage_symbols==; dosage_value=1.11; dosage_unit=MBq
- animal_in_vivo_biodist.csv 第 776 行：study_ref_id=BIO00768; biodist_type=Ex vivo biodistribution; animal_model=BALB/κ nude mice (half male and half female, 4-6 weeks old) were subcutaneously injected w; dosage_symbols==; dosage_value=1.11; dosage_unit=MBq
- animal_in_vivo_biodist.csv 第 777 行：study_ref_id=BIO00768; biodist_type=Ex vivo biodistribution; animal_model=BALB/κ nude mice (half male and half female, 4-6 weeks old) were subcutaneously injected w; dosage_symbols==; dosage_value=1.11; dosage_unit=MBq
- animal_in_vivo_biodist.csv 第 883 行：study_ref_id=BIO00843; biodist_type=Ex vivo biodistribution; animal_model=c-neu Oncomouse mammary adenocarcinoma model; dosage_symbols==; dosage_value=2; dosage_unit=mCi/kg
- animal_in_vivo_biodist.csv 第 884 行：study_ref_id=BIO00843; biodist_type=Ex vivo biodistribution; animal_model=c-neu Oncomouse mammary adenocarcinoma model; dosage_symbols==; dosage_value=2; dosage_unit=mCi/kg
- animal_in_vivo_biodist.csv 第 885 行：study_ref_id=BIO00843; biodist_type=Ex vivo biodistribution; animal_model=c-neu Oncomouse mammary adenocarcinoma model; dosage_symbols==; dosage_value=2; dosage_unit=mCi/kg
- animal_in_vivo_biodist.csv 第 886 行：study_ref_id=BIO00843; biodist_type=Ex vivo biodistribution; animal_model=c-neu Oncomouse mammary adenocarcinoma model; dosage_symbols==; dosage_value=2; dosage_unit=mCi/kg

### 19. 必填字段为空（36 行）

**问题**：NOT NULL 字段为空。

**涉及表**：drug_chemical_rel：18，drug_target：10，in_vitro_measurement：4，rdc_drug_reference：2，drug_indication：1，animal_in_vivo_biodist：1

**修复建议**：补齐必填 ID 或值，或删除无效空行。

**样例**：
- drug_target.csv 第 1993 行：drug_id=RDC02815
- drug_target.csv 第 1994 行：drug_id=RDC02816
- drug_target.csv 第 2001 行：drug_id=RDC02823
- drug_target.csv 第 2009 行：drug_id=RDC02831
- drug_target.csv 第 2010 行：drug_id=RDC02832
- drug_target.csv 第 2011 行：drug_id=RDC02833
- drug_target.csv 第 2017 行：drug_id=RDC02839
- drug_target.csv 第 2018 行：drug_id=RDC02840

### 20. 外键缺失（21 行）

**问题**：animal_in_vivo_study.drug_id 引用了不存在的 rdc_drug.drug_id。

**涉及表**：animal_in_vivo_study：21

**修复建议**：先补齐父表记录。如果一个单元格有多个 ID，需要拆成多行。注意前置表导入失败会造成连锁外键错误。

**样例**：
- animal_in_vivo_study.csv 第 519 行：study_id=BIO01212; drug_id=RDC00630; pmid=11948475; doi=10.1002/ijc.10295
- animal_in_vivo_study.csv 第 656 行：study_id=BIO01451; drug_id=RDC00771; pmid=34591481; doi=10.1021/acs.molpharmaceut.1c00566
- animal_in_vivo_study.csv 第 657 行：study_id=BIO01452; drug_id=RDC00771; pmid=34591481; doi=10.1021/acs.molpharmaceut.1c00566
- animal_in_vivo_study.csv 第 1026 行：study_id=BIO02208; drug_id=RDC01102; pmid=40733128; doi=10.3390/pharmaceutics17070920
- animal_in_vivo_study.csv 第 1125 行：study_id=BIO02336; drug_id=RDC01239; pmid=26629713; doi=10.1021/acs.jmedchem.5b01268
- animal_in_vivo_study.csv 第 1156 行：study_id=BIO02390; drug_id=RDC01304; pmid=16713147; doi=10.1016/j.ijpharm.2006.04.011
- animal_in_vivo_study.csv 第 1227 行：study_id=BIO02466; drug_id=RDC01416; pmid=40049746; doi=10.2967/jnumed.124.268508
- animal_in_vivo_study.csv 第 1228 行：study_id=BIO02467; drug_id=RDC01416; pmid=40049746; doi=10.2967/jnumed.124.268508

### 21. 外键缺失（14 行）

**问题**：animal_in_vivo_efficacy.study_ref_id 引用了不存在的 animal_in_vivo_study.study_id。

**涉及表**：animal_in_vivo_efficacy：14

**修复建议**：先补齐父表记录。如果一个单元格有多个 ID，需要拆成多行。注意前置表导入失败会造成连锁外键错误。

**样例**：
- animal_in_vivo_efficacy.csv 第 19 行：study_ref_id=FE00512; efficacy_animal_model=Athymic CD1 nu/nu mice with subcutaneous ​​MDA-MB-231/H2N​​ (HER2mod/EGFRmod) or ​​TrR1​​ ; efficacy_dosage_symbols==; efficacy_dosage_value=10; efficacy_dosage_unit=ug/MBq; efficacy_description=A single dose (11.1 MBq, 10 μg) significantly inhibited tumor growth in both trastuzumab-s
- animal_in_vivo_efficacy.csv 第 20 行：study_ref_id=FE00513; efficacy_animal_model=NOD/SCID mice with s.c. PANC-1 xenografts; efficacy_dosage_symbols==; efficacy_dosage_value=10; efficacy_dosage_unit=MBq; efficacy_description=TDT=51.8 days vs 15.6 days control
- animal_in_vivo_efficacy.csv 第 21 行：study_ref_id=FE00514; efficacy_animal_model=NRG mice with s.c. PANC-1 xenografts; efficacy_dosage_symbols==; efficacy_dosage_value=10; efficacy_dosage_unit=MBq; efficacy_description=TDT=20.9 days vs 9.1 days control
- animal_in_vivo_efficacy.csv 第 22 行：study_ref_id=FE00515; efficacy_animal_model=NOD/SCID mice with s.c. PANC-1 xenografts; efficacy_dosage_symbols==; efficacy_dosage_value=10; efficacy_dosage_unit=MBq; efficacy_description=TDT=28.1 days vs 15.6 days control
- animal_in_vivo_efficacy.csv 第 23 行：study_ref_id=FE00516; efficacy_animal_model=NRG mice with MDA-MB-231 tumors; efficacy_dosage_symbols==; efficacy_dosage_value=22; efficacy_dosage_unit=MBq; efficacy_description=Significantly delayed tumor growth and prolonged median survival
- animal_in_vivo_efficacy.csv 第 24 行：study_ref_id=FE00517; efficacy_animal_model=TE-8 xenograft in BALB/c nude mice; efficacy_dosage_symbols==; efficacy_dosage_value=12.95; efficacy_dosage_unit=MBq; efficacy_description=Radioimmunotherapy significantly inhibited tumor growth (34.3% reduction vs baseline, P<0.
- animal_in_vivo_efficacy.csv 第 25 行：study_ref_id=FE00518; efficacy_animal_model=UM-SCC-22B tumor bearing nude mice; efficacy_dosage_symbols==; efficacy_dosage_value=14.8; efficacy_dosage_unit=MBq; efficacy_description=¹⁷⁷Lu-Pan maintained durable response (36-day complete suppression)
- animal_in_vivo_efficacy.csv 第 27 行：study_ref_id=FE00520; efficacy_animal_model=Female Swiss nu/nu mice with EJ28-luc bladder carcinoma; efficacy_dosage_symbols==; efficacy_dosage_value=0.925; efficacy_dosage_unit=MBq; efficacy_description=90% survival >300 d when treated 1h after cell instillation

### 22. 外键缺失（9 行）

**问题**：drug_target.drug_id 引用了不存在的 rdc_drug.drug_id。

**涉及表**：drug_target：9

**修复建议**：先补齐父表记录。如果一个单元格有多个 ID，需要拆成多行。注意前置表导入失败会造成连锁外键错误。

**样例**：
- drug_target.csv 第 370 行：drug_id=RDC00694; target_id=TAR0002
- drug_target.csv 第 606 行：drug_id=RDC01124; target_id=TAR0005
- drug_target.csv 第 695 行：drug_id=RDC01244; target_id=TAR0001
- drug_target.csv 第 723 行：drug_id=RDC01300; target_id=TAR0001
- drug_target.csv 第 730 行：drug_id=RDC01312; target_id=TAR0001
- drug_target.csv 第 1075 行：drug_id=RDC01773; target_id=TAR0016
- drug_target.csv 第 1374 行：drug_id=RDC02187; target_id=TAR0020
- drug_target.csv 第 1431 行：drug_id=RDC02269; target_id=TAR0006

### 23. 外键缺失（6 行）

**问题**：in_vitro.drug_id 引用了不存在的 rdc_drug.drug_id。

**涉及表**：in_vitro：6

**修复建议**：先补齐父表记录。如果一个单元格有多个 ID，需要拆成多行。注意前置表导入失败会造成连锁外键错误。

**样例**：
- in_vitro.csv 第 68 行：in_vitro_id=VI00178; drug_id=RDC00178; pmid=24480266; doi=10.1016/j.nucmedbio.2013.11.006
- in_vitro.csv 第 789 行：in_vitro_id=VI01551; drug_id=RDC01551; pmid=39626113; doi=10.1021/acs.jmedchem.4c02656; study_overview=All 12 tracers in physiological saline did not show significant degradation within 4 hours
- in_vitro.csv 第 870 行：in_vitro_id=VI01699; drug_id=RDC01706; pmid=30608701; doi=10.1021/acs.molpharmaceut.8b00922; study_overview=At least 3 hours. In PBS or under high-concentration histidine challenge, the protein-asso
- in_vitro.csv 第 1238 行：in_vitro_id=VI02253; drug_id=RDC02292; doi=10.1007/s10967-020-07043-6; study_overview=At 0.5 h, 1 h, and 24 h of incubation, the protein binding rates were 1.8±0.6%, 4.8±0.5%, 
- in_vitro.csv 第 1465 行：in_vitro_id=VI00968; drug_id=RDC00968; pmid=41552550; doi=10.1021/acsomega.5c10157; study_overview=This study developed [¹⁸F]FNA-folate, a novel PET tracer for inflammation, via N-acylation
- in_vitro.csv 第 1541 行：in_vitro_id=VI00052; drug_id=RDC00052; pmid=39013156; doi=10.1021/acs.jmedchem.4c00448

### 24. 数字格式错误（6 行）

**问题**：animal_in_vivo_biodist.tbr_tumor_liver 是 DECIMAL 类型，但 CSV 里有范围、均值±误差、日期或文本。

**涉及表**：animal_in_vivo_biodist：6

**修复建议**：只保留一个纯数字，或者调整表结构增加 raw_value / min / max / error 等字段。

**样例**：
- animal_in_vivo_biodist.csv 第 397 行：study_ref_id=BIO00293; biodist_type=Ex vivo biodistribution; animal_model=Subcutaneous implantation of BxPC-3 cells in mice; dosage_symbols==; dosage_value=5.5; dosage_unit=MBq
- animal_in_vivo_biodist.csv 第 401 行：study_ref_id=BIO00293; biodist_type=Ex vivo biodistribution; animal_model=Subcutaneous implantation of BxPC-3 cells in mice; dosage_symbols==; dosage_value=5.5; dosage_unit=MBq
- animal_in_vivo_biodist.csv 第 789 行：study_ref_id=BIO00810; biodist_type=Ex vivo biodistribution; animal_model=nude mice (n = 5 per time point) bearing receptor-positive M-21 human melanoma xenografts; dosage_symbols==; dosage_value=5; dosage_unit=Ci/<0.1μg
- animal_in_vivo_biodist.csv 第 1018 行：study_ref_id=BIO01058; biodist_type=Ex vivo biodistribution; animal_model=Female BALB/C nu/nu mice bearing A431 xenografts; dosage_symbols==; dosage_value=800; dosage_unit=kBq
- animal_in_vivo_biodist.csv 第 1188 行：study_ref_id=BIO01136; biodist_type=Ex vivo biodistribution; animal_model=BALB/C nu/nu mice bearing U-87 MG xenografts; dosage_symbols==; dosage_value=380; dosage_unit=kBq
- animal_in_vivo_biodist.csv 第 4179 行：study_ref_id=BIO04067; biodist_type=Ex vivo biodistribution; animal_model=Female BALB/Cnu/nu Mice Bearing SKOV-3 Xenografts; dosage_symbols==; dosage_value=10; dosage_unit=kBq

### 25. 其它错误（6 行）

**问题**：ER_TRUNCATED_WRONG_VALUE: Incorrect datetime value: '-' for column 'created_at' at row 1

**涉及表**：animal_in_vivo_biodist：6

**修复建议**：查看明细行后按 MySQL 报错处理。

**样例**：
- animal_in_vivo_biodist.csv 第 1591 行：study_ref_id=BIO01443; biodist_type=Imaging; animal_model=12-week-old male C57BL/6 mice (26-30 g), all subjected to unilateral supraspinatus tendon ; dosage_symbols==; dosage_value=0.2; dosage_unit=mCi
- animal_in_vivo_biodist.csv 第 1596 行：study_ref_id=BIO01444; biodist_type=Ex vivo biodistribution; animal_model=nude mice bearing subcutaneous HT-1080.hFAP tumor; dosage_symbols==; dosage_value=3.85; dosage_unit=MBq/kg
- animal_in_vivo_biodist.csv 第 1597 行：study_ref_id=BIO01445; biodist_type=Ex vivo biodistribution; animal_model=6-week-old female nu/nu mice (CDX model: subcutaneous injection of HT-1080-FAP cells; PDX ; dosage_symbols==; dosage_value=925; dosage_unit=kBq
- animal_in_vivo_biodist.csv 第 1608 行：study_ref_id=BIO01448; biodist_type=Ex vivo biodistribution; animal_model=6-week-old female nu/nu mice (PDX model: subcutaneous implantation of pancreatic cancer pa; dosage_symbols==; dosage_value=925; dosage_unit=kBq
- animal_in_vivo_biodist.csv 第 1609 行：study_ref_id=BIO01449; biodist_type=Ex vivo biodistribution; animal_model=4-5-week-old BALB/c nude mice (subcutaneous inoculation of U87MG cells into the right trun; dosage_symbols==; dosage_value=0.6; dosage_unit=MBq
- animal_in_vivo_biodist.csv 第 1616 行：study_ref_id=BIO01450; biodist_type=Imaging; animal_model=4-5-week-old BALB/c nude mice (subcutaneous inoculation of U87MG cells into the right trun; dosage_symbols==; dosage_value=0.7; dosage_unit=MBq

### 26. 外键缺失（3 行）

**问题**：drug_indication.drug_id 引用了不存在的 rdc_drug.drug_id。

**涉及表**：drug_indication：3

**修复建议**：先补齐父表记录。如果一个单元格有多个 ID，需要拆成多行。注意前置表导入失败会造成连锁外键错误。

**样例**：
- drug_indication.csv 第 986 行：drug_id=RDC01134; indication_id=IN00024
- drug_indication.csv 第 987 行：drug_id=RDC01134; indication_id=IN00042
- drug_indication.csv 第 988 行：drug_id=RDC01134; indication_id=IN00088

### 27. 外键缺失（1 行）

**问题**：drug_chemical_rel.drug_id 引用了不存在的 rdc_drug.drug_id。

**涉及表**：drug_chemical_rel：1

**修复建议**：先补齐父表记录。如果一个单元格有多个 ID，需要拆成多行。注意前置表导入失败会造成连锁外键错误。

**样例**：
- drug_chemical_rel.csv 第 713 行：drug_id=RDC01065; chemical_entity_id=RAD0007; relation_role=Radionuclide

