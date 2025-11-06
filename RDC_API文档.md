# RDC API 文档 (Draft v1)

本文件是当前 Radioligand Drug Conjugates (RDC) 项目对外（前端 ↔ 后端）的接口契约。
接口的字段、结构和查询行为，来自你的页面原型 & 需求描述，并与当前库表结构绑定。
各字段来源的库表在文中都标了引用。这些库表包括 `rdc_drug`, `drug_chemical_rel`, `chemical_entity`, `human_activity`, `animal_in_vivo_*`, `in_vitro*` 等。

---

## 0. 页面与交互流程概览

### 0.1 首页（搜索页）

* 用户可以：

  * 在输入框输入关键字，模糊匹配药物名（RDC Name） → `/api/rdc/search`
  * 通过下拉框选择药物的研发/审批状态（如 Approved、Phase 1、Investigational New Drug 等），再从该状态下的药物列表中选择 → `/api/rdc/by-status`
    这些状态值来自 `rdc_drug.status`。
  * 点击“search”按钮后，按精确药物名获取该药物基础信息 → `/api/rdc/detail`
  * 或直接进入 RDC 列表页（分页浏览全部药物） → `/api/rdc`

### 0.2 RDC 列表页

* 展示药物列表，每条包含：

  * `drug_id` / `drug_name` / `status` / `type`
  * `cold_compound_name`, `ligand_name`, `linker_name`, `chelator_name`, `radionuclide_name`
* 支持分页参数 `page` / `page_size`
* 来源接口：`GET /api/rdc`
* 这些化学成分名称来自 `chemical_entity`，通过中间表 `drug_chemical_rel` 基于 `drug_id` 关联。 

### 0.3 RDC 详情页

* 点击“RDC Info”进入
* 页面包含：

  * 药物基础信息（ID、别名、SMILES、结构图、PubChem/ChEBI 等）
  * 该药物的活性数据：

    * 人体活性（临床/试验/给药信息）
    * 动物体内活性（PK、分布、疗效、不良反应）
    * 体外实验信息（分配系数、亲和力、稳定性）
* 接口：`GET /api/rdc/{drug_id}`
* 活性数据来自 `human_activity`, `animal_in_vivo_*`, `in_vitro*` 系列表，均按 `drug_id` 关联到同一个药。   

### 0.4 化学实体详情页（Cold Compound / Linker / Ligand / Chelator / Radionuclide）

* 从 RDC 详情页右侧按钮进入，比如 “cold compound Info”
* 展示两块内容：

  1. 该化学实体自身的理化性质、结构、标识符
  2. 使用了该化学实体的所有 RDC 的活性数据（与 RDC 详情页的活性数据结构一致）
* 接口：`GET /api/chemical/{entity_category}/{entity_id}`
* 化学实体数据来源表：`chemical_entity`。
* “它被哪些药用了”通过 `drug_chemical_rel` 反查出相关的 `drug_id`。

---

## 1. 通用约定

### Base URL

`/api`

### 鉴权

目前接口按公开检索场景描述。后续如需权限，可在请求头中加入：

```http
Authorization: Bearer <token>
```

### 时间格式

所有时间（如 `created_at`, `updated_at`）返回 ISO 8601 字符串，UTC 或携带时区。
`rdc_drug` 表中包含 `created_at` / `updated_at` 字段用于审计和排序。

### 分页约定

* 查询参数：

  * `page`: 第几页（从 1 开始）
  * `page_size`: 每页条数（默认 20，上限 100）
* 响应体：

  * `page`, `page_size`, `total`

### 错误响应统一格式

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "资源不存在",
    "details": []
  }
}
```

常见错误码：

* `400 Bad Request`（参数非法）
* `404 Not Found`
* `422 VALIDATION_ERROR`（缺字段/格式错误）
* `500 SERVER_ERROR`

---

## 2. 初始化接口：状态下拉字典

### GET `/api/rdc/init`

#### 描述

* 页面初始化时获取状态枚举，给首页“按状态搜索”下拉使用。
* 状态值对应 `rdc_drug.status` 字段（例如 Approved / Phase 1 / Investigational New Drug / Terminated 等）。

#### 请求参数

无

#### 响应示例

```json
{
  "dicts": {
    "status": [
      { "value": "Approved", "label": "Approved" },
      { "value": "New Drug Application", "label": "New Drug Application" },
      { "value": "Phase 3", "label": "Phase 3" },
      { "value": "Phase 2", "label": "Phase 2" },
      { "value": "Phase 1", "label": "Phase 1" },
      { "value": "Investigational New Drug", "label": "Investigational New Drug" },
      { "value": "Clinical candidate", "label": "Clinical candidate" },
      { "value": "Investigative", "label": "Investigative" },
      { "value": "Terminated in phase 3", "label": "Terminated in phase 3" },
      { "value": "Terminated in phase 2", "label": "Terminated in phase 2" },
      { "value": "Terminated in phase 1", "label": "Terminated in phase 1" },
      { "value": "Terminated", "label": "Terminated" }
    ]
  }
}
```

---

## 3. RDC 列表（分页 + 五大组件）

### GET `/api/rdc`

#### 描述

* 用于 RDC 列表页，也是主结果列表。
* 每条记录需要展示药物本身 + 五种关键成分的名称（compound、ligand、linker、chelator、radionuclide）。
* 支持分页和过滤。

`rdc_drug` 存药物主信息 (`drug_id`, `drug_name`, `status`, `type`, `created_at` 等)，并作为其他表的主外键（通过业务主键 `drug_id` 关联）。
`drug_chemical_rel` 表将 `drug_id` 和化学实体 (`entity_category`, `entity_id`) 关联，用于知道这个 drug 使用了哪种 cold compound / linker / chelator / radionuclide 等。
`chemical_entity` 表保存化学实体的名称（`name`）、类型（`entity_category`）等。

#### 查询参数

* `page` (int, 可选，默认 `1`)
* `page_size` (int, 可选，默认 `20`，最大 `100`)
* `q` (string, 可选)：按药物名模糊搜索；匹配 `rdc_drug.drug_name LIKE %q%`。
* `status` (string, 可选)：按药物状态精确筛选；匹配 `rdc_drug.status = :status`。
* `sort` (string, 可选)：排序字段，例如

  * `created_at:desc`（默认）
  * `drug_name:asc`
  * `drug_name:desc`

#### 响应字段（items[*]）

* `drug_id`：药物业务唯一标识符 → `rdc_drug.drug_id`
* `drug_name`：药物名称 → `rdc_drug.drug_name`
* `status`：研发/临床/审批状态 → `rdc_drug.status`
* `type`：治疗/诊断类型（在原型中以“Type: 诊断还是治疗”显示）→ `rdc_drug.type`。
* `cold_compound_name`
* `ligand_name`
* `linker_name`
* `chelator_name`
* `radionuclide_name`

以上五个名称来自 `chemical_entity.name`，通过 `drug_chemical_rel` 查 `drug_id` 对应的 `entity_category`（compound / ligand / linker / chelator / radionuclide），优先展示 `relation_role='active'` 的那条，否则取一条最合适的记录。 
后端可以在 SQL 里用子查询或 LEFT JOIN + GROUP_CONCAT 取这些名称。

#### 响应示例

```json
{
  "items": [
    {
      "drug_id": "RDC-0001",
      "drug_name": "Trastuzumab",
      "status": "Approved",
      "type": "Treatment",
      "cold_compound_name": "ColdCompound-X",
      "ligand_name": "Ligand-A",
      "linker_name": "MC-Val-Cit-PABC",
      "chelator_name": "DOTA",
      "radionuclide_name": "Lu-177",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "page": 1,
  "page_size": 20,
  "total": 1234
}
```

#### SQL 查询思路（offset 分页）

1. 从 `rdc_drug` 按筛选/排序取一页；
2. 对该页中的每个 `drug_id`，用子查询或批量 JOIN `drug_chemical_rel` → `chemical_entity`，按照不同的 `entity_category`（compound/ligand/linker/chelator/radionuclide）选出名称；
3. 返回合并后的结果集。

#### 性能索引建议

* `idx_drug_name` 已在 `rdc_drug(drug_name)` 上，帮助 `LIKE` 搜索。
* 建议：

  * `CREATE INDEX idx_rdc_status ON rdc_drug(status);`
  * `CREATE INDEX idx_rel_drug_cat ON drug_chemical_rel(drug_id, entity_category);`（常用来给列表展示五类组件名）

---

## 4. 模糊搜索药物名（首页输入框联想）

### GET `/api/rdc/search`

#### 描述

* 关键字模糊匹配药物名，返回候选药物列表，供下拉自动完成使用。
* 基于 `rdc_drug.drug_name LIKE %q%`。

#### 查询参数

* `q` (string, 必填)：关键字
* `limit` (int, 可选，默认 20)

#### 响应示例

```json
{
  "items": [
    { "drug_id": "RDC-0001", "drug_name": "Trastuzumab", "status": "Approved" },
    { "drug_id": "RDC-0002", "drug_name": "Pertuzumab", "status": "Phase 3" }
  ]
}
```

---

## 5. 按状态筛选药物（首页下拉第二步）

### GET `/api/rdc/by-status`

#### 描述

* 用户先选一个状态（如 Phase 3），再显示处于该状态下的所有药物列表。
* 用于 “Step1 选状态 → Step2 选药名” 这种两级选择。
* 匹配 `rdc_drug.status = :status`。

#### 查询参数

* `status` (string, 必填)
* `limit` (int, 可选，默认 50)

#### 响应示例

```json
{
  "items": [
    { "drug_id": "RDC-0010", "drug_name": "ExampleDrugA", "status": "Phase 3" },
    { "drug_id": "RDC-0011", "drug_name": "ExampleDrugB", "status": "Phase 3" }
  ]
}
```

---

## 6. 精确匹配药物名（首页“search”按钮）

### GET `/api/rdc/detail`

#### 描述

* 精确匹配某个 `drug_name`，返回药物基础信息。
* 适合在用户最终确认药名后展示“该药的基本卡片”。

`rdc_drug` 表包含药物的业务标识、外部标识、同义词、状态、类型、结构信息、公共数据库引用（ChEBI / PubChem）等。

#### 查询参数

* `drug_name` (string, 必填)：等值匹配 `rdc_drug.drug_name = :drug_name`。

#### 响应示例

```json
{
  "drug_id": "RDC-0002",
  "external_id": "EXT-123",
  "drug_name": "Pertuzumab",
  "drug_synonyms": "Synonym A; Synonym B",
  "status": "Phase 3",
  "type": "Treatment",
  "smiles": "C1=CC=...N2",
  "structure_image": "/static/structures/RDC-0002.png",
  "chebi_id": "CHEBI:12345",
  "pubchem_cid": "123456",
  "pubchem_sid": "654321",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

---

## 7. RDC 全量详情（“RDC Info”跳转页）

### GET `/api/rdc/{drug_id}`

#### 描述

* 展示完整的药物信息：

  * General 信息（基础字段）
  * chemicals（该药用到的 cold compound / ligand / linker / chelator / radionuclide）
  * human_activity（人体临床/应用信息）
  * animal_in_vivo（动物试验：PK, 生物分布, 疗效, 不良反应）
  * in_vitro（体外实验：分配系数、亲和力、稳定性）

**药物主信息来自 `rdc_drug`：**

* `drug_id`、`external_id`、`drug_name`、`drug_synonyms`、`status`、`type`（治疗 or 诊断）、`smiles`、`structure_image`、`chebi_id`、`pubchem_cid`、`pubchem_sid`、`created_at`、`updated_at`。

**化学成分来自 `drug_chemical_rel` + `chemical_entity`：**

* 通过 `drug_chemical_rel(drug_id, entity_category, entity_id)` 找出该药用到的化学实体；
* 再从 `chemical_entity` 里取 `name`、`entity_id`、`entity_category` 等信息；
* 五类实体分别是 compound / ligand / linker / chelator / radionuclide。 

**人体活性来自 `human_activity`：**

* 每个 drug 可能对应多条 `human_activity` 记录，字段包括：

  * `clinical_trial_number`, `indication`, `patients`, `dosage`, `frequency`,
  * `results_description`, `purpose`,
  * `clinical_endpoint`, `endpoint_period`,
  * `efficacy_description`, `adverse_events_summary`, `security_indicators`。

**动物体内活性来自以下表：**

* `animal_in_vivo_study`（一条动物研究：`study_id`, `drug_id`, `pmid`, `doi`）
* `animal_in_vivo_pk`（PK：`pk_animal_model`, 剂量符号/数值/单位，`half_life`, `pk_image`, `pk_description`）
* `animal_in_vivo_biodist`（生物分布：`biodist_type`, `animal_model`, 剂量、`metabolism`, `excretion`, `detection_time`, `tumor_retention_time`, T/B 指标如 `tbr_tumor_blood` ... `tbr_tumor_heart`, `biodist_result_image`, `biodist_description`）
* `animal_in_vivo_efficacy`（疗效 & 不良反应：`efficacy_animal_model`, 剂量符号/数值/单位，`efficacy_description`, `adverse_reactions`）
  这些表通过 `study_ref_id` 对应 `animal_in_vivo_study.study_id` 以及 `animal_in_vivo_study.drug_id` 将数据挂到药物上。

**体外实验 in_vitro 来自：**

* `in_vitro`（`drug_id` → `study_overview` 等整体描述）
* `in_vitro_measurement`（按 `in_vitro_ref_id` 关联 `in_vitro.in_vitro_id`；字段包括

  * `measurement_category`（例如 `partition_coefficient`, `affinity`）
  * `measurement_type`
  * `measurement_symbols`（例如 `<`, `≈`, `=`）
  * `measurement_value`
  * `measurement_unit`
  * `method_description`）

#### 路径参数

* `drug_id` (string, 必填)：业务主键（不是自增 id，而是类似 `"RDC-0002"` 的业务ID）。

#### 查询参数

* `expand` (string，可选)：逗号分隔，支持以下片段：

  * `human_activity`
  * `animal_in_vivo`
  * `in_vitro`
  * `chemicals`

  如果没传，后端可以只返回 `general` / `chemicals` 的基础信息，用于快速加载第一页。
* `all_entities` (boolean，可选，默认 `false`)：

  * `false`：`chemicals` 里只给代表名称（`linker_name`, `radionuclide_name` 这种单值）
  * `true`：`chemicals.entities` 中每个类别（compound/linker/...）返回一个数组，列出所有相关实体（含 `entity_id`, `name`, `relation_role` 等）

#### 响应示例

```json
{
  "general": {
    "drug_id": "RDC-0002",
    "external_id": "EXT-123",
    "drug_name": "Pertuzumab",
    "drug_synonyms": "Synonym A; Synonym B",
    "status": "Phase 3",
    "type": "Treatment",
    "smiles": "C1=CC=...N2",
    "structure_image": "/img/RDC-0002.png",
    "chebi_id": "CHEBI:12345",
    "pubchem_cid": "123456",
    "pubchem_sid": "654321"
  },
  "chemicals": {
    "compound_name": "ColdCompound-X",
    "ligand_name": "Ligand-A",
    "linker_name": "MC-Val-Cit-PABC",
    "chelator_name": "DOTA",
    "radionuclide_name": "Lu-177",
    "entities": {
      "compound": [
        { "entity_id": "CMP-001", "name": "ColdCompound-X", "relation_role": "active" }
      ],
      "ligand": [
        { "entity_id": "LIG-001", "name": "Ligand-A" }
      ],
      "linker": [
        { "entity_id": "LNK-001", "name": "MC-Val-Cit-PABC" }
      ],
      "chelator": [
        { "entity_id": "CHT-001", "name": "DOTA" }
      ],
      "radionuclide": [
        { "entity_id": "RAD-001", "name": "Lu-177" }
      ]
    }
  },
  "human_activity": [
    {
      "clinical_trial_number": "NCT00000000",
      "indication": "适应症",
      "patients": "受试者群体信息",
      "dosage": "10 mg/kg",
      "frequency": "weekly",
      "results_description": "临床结果描述",
      "purpose": "研究目的",
      "clinical_endpoint": "ORR",
      "endpoint_period": "8 weeks",
      "efficacy_description": "疗效总结",
      "adverse_events_summary": "AE 概述",
      "security_indicators": "安全性指标"
    }
  ],
  "animal_in_vivo": {
    "studies": [
      {
        "study_id": "STUDY-01",
        "pmid": "12345678",
        "doi": "10.xxxx/yyyy",
        "pk": [
          {
            "pk_animal_model": "Mouse xenograft",
            "pk_dosage_symbols": "≈",
            "pk_dosage_value": 5,
            "pk_dosage_unit": "mg/kg",
            "pk_image": "/img/pk.png",
            "pk_description": "PK结果说明",
            "half_life": "2.5h"
          }
        ],
        "biodistribution": [
          {
            "biodist_type": "Type A",
            "animal_model": "Mouse",
            "dosage_symbols": "=",
            "dosage_value": 10,
            "dosage_unit": "MBq",
            "metabolism": "代谢情况",
            "excretion": "排泄情况",
            "detection_time": "2h",
            "tumor_retention_time": "24h",
            "tbr": {
              "tumor_blood": 12.3,
              "tumor_muscle": 5.4,
              "tumor_kidney": 2.1,
              "tumor_salivary_glands": 1.1,
              "tumor_liver": 0.8,
              "tumor_lung": 3.2,
              "tumor_heart": 4.5
            },
            "biodist_result_image": "/img/biodist.png",
            "biodist_description": "分布描述"
          }
        ],
        "efficacy": [
          {
            "efficacy_animal_model": "Mouse",
            "efficacy_dosage_symbols": "<",
            "efficacy_dosage_value": 10,
            "efficacy_dosage_unit": "MBq",
            "efficacy_description": "抑瘤率 xx%",
            "adverse_reactions": "轻微体重下降"
          }
        ]
      }
    ]
  },
  "in_vitro": {
    "partition_coefficient": [
      {
        "measurement_type": "logP",
        "measurement_symbols": "=",
        "measurement_value": 3.14,
        "measurement_unit": "",
        "method_description": "octanol/water ..."
      }
    ],
    "affinity": [
      {
        "measurement_type": "IC50",
        "measurement_symbols": "<",
        "measurement_value": 0.6,
        "measurement_unit": "nM",
        "method_description": "binding assay ..."
      }
    ],
    "stability": {
      "study_overview": "serum stable 24h"
    }
  }
}
```

---

## 8. 化学实体详情页（Cold Compound / Linker / Ligand / Chelator / Radionuclide Info）

### GET `/api/chemical/{entity_category}/{entity_id}`

#### 描述

* 在 RDC 详情页右侧的 “cold compound Info / linker Info / ligand Info / chelator Info / radionuclide Info” 按钮点击后调用。
* 返回两部分：

  1. `basic`: 该化学实体本身的基础结构信息 / 理化性质 / 公共数据库标识
  2. `rdc_activity`: 使用了该化学实体的所有 RDC 药物，以及这些药物完整的活性数据块（`human_activity`, `animal_in_vivo`, `in_vitro`），等价于分别调用 `/api/rdc/{drug_id}` 对每个药。

化学实体的静态信息来自 `chemical_entity`：
包含 `entity_category` (compound / linker / ...)、`entity_id`、`name`、`synonyms`、`smiles`、`formula`、`structure_image`、`mol2d_path`、`mol3d_path`、`pubchem_cid`、`inchi`、`inchikey`、`iupac_name`、理化性质（`molecular_weight`, `complexity`, `heavy_atom_count`, `hbond_acceptors`, `hbond_donors`, `rotatable_bonds`, `logp`, `tpsa`）、以及类别专属字段如 `linker_type`、`radionuclide_symbol`, `radionuclide_half_life`, `radionuclide_emission`, `radionuclide_energy`。

化学实体和药物的关联通过 `drug_chemical_rel`，该表记录了 `drug_id`、`entity_category`、`entity_id`、`relation_role` 等，用来表示“该 drug 使用了这个 linker / compound / radionuclide 等”。

一旦拿到这些关联的 `drug_id`，可以为每个药直接复用 `/api/rdc/{drug_id}` 的活性数据拼装出 `rdc_activity[]`。这些活性数据依赖 `rdc_drug`、`human_activity`、`animal_in_vivo_*`、`in_vitro*`。    

#### 路径参数

* `entity_category` (string)：允许值：`compound`, `ligand`, `linker`, `chelator`, `radionuclide`
* `entity_id` (string)：化学实体的业务主键 → `chemical_entity.entity_id`。

#### 查询参数

* `include_activity` (boolean, 可选，默认 `true`)

  * `true`: 返回 `rdc_activity`，包含所有相关药物及其完整活性数据块
  * `false`: 只返回 `basic`

#### 响应示例

```json
{
  "basic": {
    "entity_category": "compound",
    "entity_id": "CMP-001",
    "name": "Cold Compound Name",
    "synonyms": "CCN; X-123",
    "smiles": "C1=CC=...N2",
    "formula": "C10H12N2O",
    "structure_image": "/img/compound_struct.png",
    "mol2d_path": "/mol/CMP-001_2d.mol",
    "mol3d_path": "/mol/CMP-001_3d.mol",
    "pubchem_cid": "123456",
    "inchi": "InChI=1S/…",
    "inchikey": "ABCDEFG-HIJKL",
    "iupac_name": "IUPAC long name",
    "molecular_weight": 1234.56,
    "complexity": 88.1,
    "heavy_atom_count": 42,
    "hbond_acceptors": 5,
    "hbond_donors": 2,
    "rotatable_bonds": 7,
    "logp": 3.14,
    "tpsa": 44.2,
    "linker_type": null,
    "radionuclide_symbol": null,
    "radionuclide_half_life": null,
    "radionuclide_emission": null,
    "radionuclide_energy": null
  },
  "rdc_activity": [
    {
      "drug_id": "RDC-0001",
      "drug_name": "ExampleDrug",
      "status": "Approved",
      "type": "Treatment",
      "human_activity": [ ... ],
      "animal_in_vivo": { ... },
      "in_vitro": { ... }
    }
  ]
}
```

---

## 9. 错误码 / 状态码

| code             | http | 说明                        |
| ---------------- | ---- | ------------------------- |
| VALIDATION_ERROR | 422  | 参数缺失或格式非法（如缺少必填查询参数）      |
| NOT_FOUND        | 404  | 找不到指定 drug / chemical 等资源 |
| SERVER_ERROR     | 500  | 服务器内部错误                   |

---

## 10. 性能 / 实现注意事项

1. **索引**

   * 模糊搜索药物名时使用 `rdc_drug.drug_name` 上的索引（`idx_drug_name`），以及可选的全文索引/搜索引擎优化。
   * 为 `rdc_drug.status` 建单列索引，提升 `/api/rdc/by-status` 和 `/api/rdc` 的状态筛选。
   * 为 `drug_chemical_rel(drug_id, entity_category)` 建复合索引，提高列表页中五大组分名的查询效率，以及 RD C详情页 chemicals 块查询效率。
   * 为 `human_activity(drug_id)`、`animal_in_vivo_study.drug_id`、`in_vitro(drug_id)` 建索引，后端可以一次性查出所有活性数据并按 `drug_id` 分组，避免 N+1。  

2. **批量组装数据**

   * `/api/rdc/{drug_id}`：

     * 查 `rdc_drug` 一条
     * 批量拉该 drug 的 human_activity, in_vitro, animal_in_vivo_*
     * 拼成统一 JSON 返回
   * `/api/chemical/{entity_category}/{entity_id}`：

     * 先找所有关联的 `drug_id` (from `drug_chemical_rel`)
     * 对这些 `drug_id` 一次性批处理活性数据（human/animal/ vitro）
     * 再组装为 `rdc_activity[]` 返回

3. **大数据分页**

   * `/api/rdc` 可以采用 offset 分页（page / page_size）来配合 `total` 统计。
   * 如果后续数据量非常大，可升级为 keyset 分页，通过 `(created_at, id)` 或类似复合索引来翻页，后端只返回 `next_cursor` 而不是 `page`。
     需要在 `rdc_drug` 上建立 `(created_at DESC, id DESC)` 组合索引以保证稳定翻页。

---

## 11. 前端交互 → API 映射总结表

| 交互位置 / 按钮说明                                      | 行为                              | API 调用                                                 |
| ------------------------------------------------ | ------------------------------- | ------------------------------------------------------ |
| 首页输入框（实时联想）                                      | 按关键字模糊匹配药物名                     | `GET /api/rdc/search?q=...`                            |
| 首页“按状态选择药物”第 1 步                                 | 获取状态枚举                          | `GET /api/rdc/init`                                    |
| 首页“按状态选择药物”第 2 步                                 | 根据状态拿到候选药物列表                    | `GET /api/rdc/by-status?status=...`                    |
| 首页“search”按钮                                     | 用户选好了某个药物名，拿该药物基础信息             | `GET /api/rdc/detail?drug_name=...`                    |
| RDC 列表页                                          | 展示所有药物（含5类化学成分名称），支持分页、筛选、排序    | `GET /api/rdc?page=...&page_size=...&q=...&status=...` |
| RDC 列表中点击“RDC Info”/详情链接                         | 查看该药物的完整信息（基础信息+活性数据+chemicals） | `GET /api/rdc/{drug_id}`                               |
| RDC 详情页右侧 “cold compound Info / linker Info ...” | 查看这个成分的详细结构 & 被它关联的所有RDC及对应活性数据 | `GET /api/chemical/{entity_category}/{entity_id}`      |

---

**到这里为止，你的原型涉及到的所有页面、按钮、展开区块、明细面板，都已经有了对应的 API、请求参数、响应结构、字段来源和性能建议。**
