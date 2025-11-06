-- ---------------------------------------------------------------------
-- RDC 数据库规范化版本 (v2)
-- 合并化学实体并统一 in vitro 明细结构。
-- ---------------------------------------------------------------------

CREATE DATABASE IF NOT EXISTS `rdcdb`
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
USE `rdcdb`;

-- ---------------------------------------------------------------------
-- 核心：药物主表
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `rdc_drug` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增主键（内部引用）',
  `drug_id` VARCHAR(128) NOT NULL COMMENT '药物业务唯一标识符',
  `external_id` VARCHAR(128) DEFAULT NULL COMMENT '外部 RDC-Drug 标识',
  `type` VARCHAR(64) DEFAULT NULL COMMENT 'Treatment or Diagnosis',
  `drug_name` VARCHAR(255) NOT NULL COMMENT '药物名称',
  `drug_synonyms` TEXT DEFAULT NULL COMMENT '药物同义词/别名（逗号或 JSON）',
  `status` VARCHAR(64) DEFAULT NULL COMMENT '开发状态（preclinical/clinical/approved 等）',
  `main_pubmed` VARCHAR(64) DEFAULT NULL COMMENT '主要 PubMed ID',
  `main_doi` VARCHAR(255) DEFAULT NULL COMMENT '主要 DOI 标识符',
  `smiles` TEXT DEFAULT NULL COMMENT 'SMILES 分子式',
  `structure_image` VARCHAR(512) DEFAULT NULL COMMENT '结构图文件路径',
  `chebi_id` VARCHAR(64) DEFAULT NULL COMMENT 'ChEBI 数据库 ID',
  `pubchem_cid` VARCHAR(64) DEFAULT NULL COMMENT 'PubChem 化合物 CID',
  `pubchem_sid` VARCHAR(64) DEFAULT NULL COMMENT 'PubChem 物质 SID',
  `notes` TEXT DEFAULT NULL COMMENT '药物备注信息',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间（默认当前时间）',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录更新时间（自动维护）',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_drug_id` (`drug_id`),
  UNIQUE KEY `uk_external_id` (`external_id`),
  INDEX `idx_drug_name` (`drug_name`),
  INDEX `idx_status` (`status`),
  INDEX `idx_pubchem_cid` (`pubchem_cid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='药物主数据';

-- ---------------------------------------------------------------------
-- 核心：靶点主表及关联
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `target` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增主键（内部引用）',
  `target_id` VARCHAR(128) NOT NULL COMMENT '靶点业务唯一标识符',
  `name` VARCHAR(255) NOT NULL COMMENT '靶点名称',
  `external_id` VARCHAR(128) DEFAULT NULL COMMENT '外部靶点标识（如 UniProt）',
  `description` TEXT DEFAULT NULL COMMENT '靶点描述说明',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_target_id` (`target_id`),
  UNIQUE KEY `uk_name_external` (`name`, `external_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='靶点主数据';

CREATE TABLE IF NOT EXISTS `drug_target` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增主键（关联行标识）',
  `drug_id` VARCHAR(128) NOT NULL COMMENT '关联药物业务 ID（rdc_drug.drug_id）',
  `target_id` VARCHAR(128) NOT NULL COMMENT '关联靶点业务 ID（target.target_id）',
  `evidence` TEXT DEFAULT NULL COMMENT '关联证据/参考信息',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_drug_target` (`drug_id`, `target_id`),
  INDEX `idx_dt_drug` (`drug_id`),
  INDEX `idx_dt_target` (`target_id`),
  CONSTRAINT `fk_dt_drug` FOREIGN KEY (`drug_id`) REFERENCES `rdc_drug`(`drug_id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_dt_target` FOREIGN KEY (`target_id`) REFERENCES `target`(`target_id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='药物与靶点多对多关联';

-- ---------------------------------------------------------------------
-- 核心：适应症主表及关联
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `indication` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增主键（内部引用）',
  `indication_id` VARCHAR(128) NOT NULL COMMENT '适应症业务唯一标识符',
  `name` VARCHAR(255) NOT NULL COMMENT '适应症名称',
  `icd11_code` VARCHAR(64) DEFAULT NULL COMMENT 'ICD-11 疾病编码',
  `type` VARCHAR(50) DEFAULT NULL COMMENT '适应症类型（治疗/诊断等）',
  `description` TEXT DEFAULT NULL COMMENT '适应症描述信息',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_indication_id` (`indication_id`),
  UNIQUE KEY `uk_name_code` (`name`, `icd11_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='适应症主数据';

CREATE TABLE IF NOT EXISTS `drug_indication` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增主键（关联行标识）',
  `drug_id` VARCHAR(128) NOT NULL COMMENT '关联药物业务 ID（rdc_drug.drug_id）',
  `indication_id` VARCHAR(128) NOT NULL COMMENT '关联适应症业务 ID（indication.indication_id）',
  `evidence` TEXT DEFAULT NULL COMMENT '适应症关联证据/备注',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_drug_indication` (`drug_id`, `indication_id`),
  INDEX `idx_di_drug` (`drug_id`),
  INDEX `idx_di_indication` (`indication_id`),
  CONSTRAINT `fk_di_drug` FOREIGN KEY (`drug_id`) REFERENCES `rdc_drug`(`drug_id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_di_indication` FOREIGN KEY (`indication_id`) REFERENCES `indication`(`indication_id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='药物与适应症多对多关联';

-- ---------------------------------------------------------------------
-- 合并后的化学实体（compound/ligand/linker/chelator/radionuclide）
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `chemical_entity` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增主键（内部引用）',
  `entity_id` VARCHAR(128) NOT NULL COMMENT '化学实体在各类别内的业务编号',
   `entity_category` ENUM('cold_compound', 'ligand', 'linker', 'chelator', 'radionuclide') 
    NOT NULL COMMENT '化学实体类别',
  `name` VARCHAR(255) NOT NULL COMMENT '化学实体名称',
  `synonyms` TEXT DEFAULT NULL COMMENT '化学实体同义词/别名',
  `external_id` VARCHAR(128) DEFAULT NULL COMMENT '外部数据库编号',
  `smiles` TEXT DEFAULT NULL COMMENT 'SMILES 分子式',
  `structure_image` VARCHAR(512) DEFAULT NULL COMMENT '结构图文件路径',
  `formula` VARCHAR(128) DEFAULT NULL COMMENT '化学式/分子式',
  `iupac_name` TEXT DEFAULT NULL COMMENT 'IUPAC 名称',
  `inchi` TEXT DEFAULT NULL COMMENT 'InChI 字符串',
  `inchikey` VARCHAR(64) DEFAULT NULL COMMENT 'InChIKey',
  `pubchem_cid` VARCHAR(64) DEFAULT NULL COMMENT 'PubChem CID',
  `mol2d_path` VARCHAR(512) DEFAULT NULL COMMENT '2D MOL 文件路径',
  `mol3d_path` VARCHAR(512) DEFAULT NULL COMMENT '3D MOL 文件路径',
  `molecular_weight` DECIMAL(12,4) DEFAULT NULL COMMENT '分子量',
  `complexity` DECIMAL(12,4) DEFAULT NULL COMMENT '分子复杂度',
  `heavy_atom_count` INT DEFAULT NULL COMMENT '重原子数',
  `hbond_acceptors` INT DEFAULT NULL COMMENT '氢键受体数量',
  `hbond_donors` INT DEFAULT NULL COMMENT '氢键供体数量',
  `rotatable_bonds` INT DEFAULT NULL COMMENT '可旋转键数量',
  `logp` DECIMAL(8,3) DEFAULT NULL COMMENT 'LogP 分配系数',
  `tpsa` DECIMAL(10,3) DEFAULT NULL COMMENT 'TPSA 拓扑极性表面积',
  `ligand_type` VARCHAR(100) DEFAULT NULL COMMENT '配体类型（仅配体适用）',
  `linker_type` VARCHAR(100) DEFAULT NULL COMMENT '连接子类型（仅连接子适用）',
  `radionuclide_symbol` VARCHAR(32) DEFAULT NULL COMMENT '放射性核素符号（仅核素适用）',
  `radionuclide_half_life` VARCHAR(128) DEFAULT NULL COMMENT '放射性核素半衰期描述',
  `radionuclide_emission` VARCHAR(128) DEFAULT NULL COMMENT '放射性核素辐射类型',
  `radionuclide_energy` VARCHAR(128) DEFAULT NULL COMMENT '放射性核素辐射能量',
  `radiochemical_method_description` TEXT DEFAULT NULL COMMENT '放射化学方法描述',
  `radiochemical_yield` VARCHAR(32) DEFAULT NULL COMMENT '放射化学产率',
  `radiochemical_purity` VARCHAR(32) DEFAULT NULL COMMENT '放射化学纯度',
  `specific_activity` VARCHAR(32) DEFAULT NULL COMMENT '比活度（Specific activity）',
  `notes` TEXT DEFAULT NULL COMMENT '化学实体备注信息',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_entity_category_id` (`entity_category`, `entity_id`),
  UNIQUE KEY `uk_entity_id` (`entity_id`),
  INDEX `idx_ce_name` (`name`),
  INDEX `idx_ce_category` (`entity_category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='合并后的化学实体主数据';

CREATE TABLE IF NOT EXISTS `drug_chemical_rel` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增主键（关联行标识）',
  `drug_id` VARCHAR(128) NOT NULL COMMENT '关联药物业务 ID（rdc_drug.drug_id）',
  `relation_role` ENUM('cold_compound', 'ligand', 'linker', 'chelator', 'radionuclide') 
    NOT NULL COMMENT '关联化学实体类别',
  `chemical_entity_id` VARCHAR(128) NOT NULL COMMENT '关联化学实体业务编号（chemical_entity.entity_id）',
  `notes` TEXT DEFAULT NULL COMMENT '关联备注信息',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_drug_chemical` (`drug_id`, `relation_role`, `chemical_entity_id`),
  INDEX `idx_dcr_drug` (`drug_id`),
  INDEX `idx_dcr_entity` (`relation_role`, `chemical_entity_id`),
  CONSTRAINT `fk_dcr_drug` FOREIGN KEY (`drug_id`) REFERENCES `rdc_drug`(`drug_id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  -- CONSTRAINT `fk_dcr_entity` FOREIGN KEY (`relation_role`, `chemical_entity_id`) REFERENCES `chemical_entity`(`entity_category`, `entity_id`)
  --   ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='药物与化学实体多对多关联';

CREATE TABLE IF NOT EXISTS `chemical_affinity` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增主键（记录标识）',
  `affinity_id` VARCHAR(128) NOT NULL COMMENT '亲和力记录业务编号',
  `chemical_entity_id` VARCHAR(128) NOT NULL COMMENT '关联化学实体业务编号（chemical_entity.entity_id）',
  `affinity_type` VARCHAR(128) DEFAULT NULL COMMENT '亲和力类型（Kd/Ki/IC50 等）',
  `affinity_symbols` VARCHAR(32) DEFAULT NULL COMMENT '比较符号（=、<、>、≈ 等）',
  `affinity_value` DECIMAL(20,6) DEFAULT NULL COMMENT '亲和力数值',
  `affinity_unit` VARCHAR(64) DEFAULT NULL COMMENT '亲和力单位',
  `description` TEXT DEFAULT NULL COMMENT '亲和力描述说明',
  `source` VARCHAR(255) DEFAULT NULL COMMENT '数据来源（PMID/DOI/文献等）',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_affinity_id` (`affinity_id`),
  INDEX `idx_ca_entity` (`chemical_entity_id`),
  CONSTRAINT `fk_ca_entity` FOREIGN KEY (`chemical_entity_id`) REFERENCES `chemical_entity`(`entity_id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='化学实体亲和力信息';

-- ---------------------------------------------------------------------
-- In vitro 数据与统一测量表
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `in_vitro` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增主键（内部引用）',
  `in_vitro_id` VARCHAR(128) NOT NULL COMMENT '体外研究业务唯一编号',
  `drug_id` VARCHAR(128) NOT NULL COMMENT 'Business ID (rdc_drug.drug_id)',
  `pmid` VARCHAR(32) DEFAULT NULL COMMENT '关联文献 PMID',
  `doi` VARCHAR(128) DEFAULT NULL COMMENT '关联文献 DOI',
  `study_overview` TEXT DEFAULT NULL COMMENT '体外研究概览/稳定性描述',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_in_vitro_id` (`in_vitro_id`),
  INDEX `idx_iv_drug` (`drug_id`),
  CONSTRAINT `fk_iv_drug` FOREIGN KEY (`drug_id`) REFERENCES `rdc_drug`(`drug_id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='体外研究头信息';

CREATE TABLE IF NOT EXISTS `in_vitro_measurement` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增主键（明细记录）',
  `in_vitro_ref_id` VARCHAR(128) NOT NULL COMMENT 'Business ID (in_vitro.in_vitro_id)',
  `measurement_category` VARCHAR(64) NOT NULL COMMENT '测量类别（partition_coefficient/affinity/other 等）',
  `measurement_type` VARCHAR(64) NOT NULL COMMENT '测量类型（logP/IC50 等）',
  `measurement_symbols` VARCHAR(16) DEFAULT NULL COMMENT '比较符号（=、<、≤、≈ 等）',
  `measurement_value` VARCHAR(255) DEFAULT NULL COMMENT '测量数值',
  `measurement_unit` VARCHAR(32) DEFAULT NULL COMMENT '测量单位（nM、μM 等）',
  `method_description` TEXT DEFAULT NULL COMMENT '测量方法/细胞系/条件描述',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_ivm_ref` (`in_vitro_ref_id`),
  INDEX `idx_ivm_category` (`measurement_category`),
  CONSTRAINT `fk_ivm_ref` FOREIGN KEY (`in_vitro_ref_id`) REFERENCES `in_vitro`(`in_vitro_id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='体外研究测量明细';

-- ---------------------------------------------------------------------
-- 人体活性数据
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `human_activity` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增主键（内部引用）',
  `activity_id` VARCHAR(128) NOT NULL COMMENT '人体活性研究业务编号',
  `drug_id` VARCHAR(128) NOT NULL COMMENT 'Business ID (rdc_drug.drug_id)',
  `pmid` VARCHAR(32) DEFAULT NULL COMMENT '关联文献 PMID',
  `doi` VARCHAR(128) DEFAULT NULL COMMENT '关联文献 DOI',
  `clinical_trial_number` VARCHAR(64) DEFAULT NULL COMMENT '临床试验登记号（如 NCT 编号）',
  `indication` VARCHAR(255) DEFAULT NULL COMMENT '研究适应症描述',
  `patients` VARCHAR(255) DEFAULT NULL COMMENT '受试者描述/分组信息',
  `frequency` VARCHAR(128) DEFAULT NULL COMMENT '给药频次（qd/bid/weekly 等）',
  `dosage` VARCHAR(128) DEFAULT NULL COMMENT '剂量及单位',
  `clinical_endpoint` VARCHAR(255) DEFAULT NULL COMMENT '关键临床终点',
  `endpoint_period` VARCHAR(128) DEFAULT NULL COMMENT '终点评价周期',
  `purpose` TEXT DEFAULT NULL COMMENT '研究目的',
  `results_description` TEXT DEFAULT NULL COMMENT '结果描述',
  `efficacy_description` TEXT DEFAULT NULL COMMENT '疗效描述',
  `security_indicators` TEXT DEFAULT NULL COMMENT '安全性指标说明',
  `adverse_events_summary` TEXT DEFAULT NULL COMMENT '不良事件总结',
  -- `maximum_tolerated_dose` VARCHAR(128) DEFAULT NULL COMMENT '最大耐受剂量 (MTD)',
  -- `long_term_safety_toxicity` TEXT DEFAULT NULL COMMENT '长期安全性/毒性描述',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_activity_id` (`activity_id`),
  INDEX `idx_ha_drug` (`drug_id`),
  INDEX `idx_ha_pmid` (`pmid`),
  INDEX `idx_ha_doi` (`doi`),
  INDEX `idx_ha_trial` (`clinical_trial_number`),
  CONSTRAINT `fk_ha_drug` FOREIGN KEY (`drug_id`) REFERENCES `rdc_drug`(`drug_id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='人体活性/临床研究数据';

-- ---------------------------------------------------------------------
-- 动物体内研究（头表 + 明细）
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `animal_in_vivo_study` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增主键（内部引用）',
  `study_id` VARCHAR(128) NOT NULL COMMENT '体内研究业务编号',
  `drug_id` VARCHAR(128) NOT NULL COMMENT 'Business ID (rdc_drug.drug_id)',
  `pmid` VARCHAR(32) DEFAULT NULL COMMENT '关联文献 PMID',
  `doi` VARCHAR(128) DEFAULT NULL COMMENT '关联文献 DOI',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_study` (`study_id`),
  INDEX `idx_study_drug` (`drug_id`),
  CONSTRAINT `fk_study_drug` FOREIGN KEY (`drug_id`) REFERENCES `rdc_drug`(`drug_id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='动物体内研究头信息';

CREATE TABLE IF NOT EXISTS `animal_in_vivo_biodist` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增主键（明细记录）',
  `study_ref_id` VARCHAR(128) NOT NULL COMMENT 'Business ID (animal_in_vivo_study.study_id)',
  `dosage_symbols` VARCHAR(16) DEFAULT NULL COMMENT '剂量比较符号（=、≈、< 等）',
  `dosage_value` DECIMAL(12,4) DEFAULT NULL COMMENT '剂量数值',
  `dosage_unit` VARCHAR(32) DEFAULT NULL COMMENT '剂量单位（MBq、mg/kg 等）',
  `detection_time` VARCHAR(64) DEFAULT NULL COMMENT '检测时间点',
  `metabolism` TEXT DEFAULT NULL COMMENT '代谢情况描述',
  `excretion` TEXT DEFAULT NULL COMMENT '排泄情况描述',
  `tumor_retention_time` VARCHAR(64) DEFAULT NULL COMMENT '肿瘤滞留时间',
  `tbr_tumor_blood` DECIMAL(10,4) DEFAULT NULL COMMENT '肿瘤/血液 T/B 比值',
  `tbr_tumor_muscle` DECIMAL(10,4) DEFAULT NULL COMMENT '肿瘤/肌肉 T/B 比值',
  `tbr_tumor_kidney` DECIMAL(10,4) DEFAULT NULL COMMENT '肿瘤/肾脏 T/B 比值',
  `tbr_tumor_salivary_glands` DECIMAL(10,4) DEFAULT NULL COMMENT '肿瘤/唾液腺 T/B 比值',
  `tbr_tumor_liver` DECIMAL(10,4) DEFAULT NULL COMMENT '肿瘤/肝脏 T/B 比值',
  `tbr_tumor_lung` DECIMAL(10,4) DEFAULT NULL COMMENT '肿瘤/肺部 T/B 比值',
  `tbr_tumor_heart` DECIMAL(10,4) DEFAULT NULL COMMENT '肿瘤/心脏 T/B 比值',
  `biodist_type` VARCHAR(128) DEFAULT NULL COMMENT '生物分布研究类型',
  `animal_model` VARCHAR(255) DEFAULT NULL COMMENT '动物模型描述',
  `biodist_result_image` VARCHAR(512) DEFAULT NULL COMMENT '生物分布结果图像路径',
  `biodist_description` TEXT DEFAULT NULL COMMENT '生物分布总体描述',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_bd_study` (`study_ref_id`),
  INDEX `idx_bd_time` (`detection_time`),
  CONSTRAINT `fk_bd_study` FOREIGN KEY (`study_ref_id`) REFERENCES `animal_in_vivo_study`(`study_id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='动物体内研究生物分布明细';

CREATE TABLE IF NOT EXISTS `animal_in_vivo_pk` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增主键（明细记录）',
  `study_ref_id` VARCHAR(128) NOT NULL COMMENT 'Business ID (animal_in_vivo_study.study_id)',
  `pk_animal_model` VARCHAR(255) DEFAULT NULL COMMENT 'PK 研究使用的动物模型',
  `pk_dosage_symbols` VARCHAR(16) DEFAULT NULL COMMENT 'PK 剂量比较符号',
  `pk_dosage_value` DECIMAL(12,4) DEFAULT NULL COMMENT 'PK 剂量数值',
  `pk_dosage_unit` VARCHAR(32) DEFAULT NULL COMMENT 'PK 剂量单位',
  `pk_description` TEXT DEFAULT NULL COMMENT 'PK 结果描述说明',
  `half_life` VARCHAR(255) DEFAULT NULL COMMENT '半衰期值',
  `pk_image` VARCHAR(512) DEFAULT NULL COMMENT 'PK 结果图像路径',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_pk_study` (`study_ref_id`),
  CONSTRAINT `fk_pk_study` FOREIGN KEY (`study_ref_id`) REFERENCES `animal_in_vivo_study`(`study_id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='动物体内研究 PK 明细';

CREATE TABLE IF NOT EXISTS `animal_in_vivo_efficacy` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增主键（明细记录）',
  `study_ref_id` VARCHAR(128) NOT NULL COMMENT 'Business ID (animal_in_vivo_study.study_id)',
  `efficacy_animal_model` VARCHAR(255) DEFAULT NULL COMMENT '疗效研究使用的动物模型',
  `efficacy_dosage_symbols` VARCHAR(16) DEFAULT NULL COMMENT '疗效剂量比较符号',
  `efficacy_dosage_value` DECIMAL(12,4) DEFAULT NULL COMMENT '疗效剂量数值',
  `efficacy_dosage_unit` VARCHAR(32) DEFAULT NULL COMMENT '疗效剂量单位',
  `efficacy_description` TEXT DEFAULT NULL COMMENT '疗效描述信息',
  `efficacy_image` VARCHAR(512) DEFAULT NULL COMMENT '疗效结果图像路径',
  `adverse_reactions` TEXT DEFAULT NULL COMMENT '不良反应描述',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_eff_study` (`study_ref_id`),
  CONSTRAINT `fk_eff_study` FOREIGN KEY (`study_ref_id`) REFERENCES `animal_in_vivo_study`(`study_id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='动物体内研究疗效明细';

-- ---------------------------------------------------------------------
-- 参考文献主表及药物文献关联
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reference` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增主键（内部引用）',
  `reference_id` VARCHAR(128) NOT NULL COMMENT '参考文献业务唯一编号',
  `title` TEXT NOT NULL COMMENT '文献标题',
  `authors` TEXT DEFAULT NULL COMMENT '作者信息',
  `journal` VARCHAR(512) DEFAULT NULL COMMENT '期刊名称',
  `publication_date` DATE DEFAULT NULL COMMENT '发表日期',
  `volume` VARCHAR(50) DEFAULT NULL COMMENT '卷号',
  `issue` VARCHAR(50) DEFAULT NULL COMMENT '期号',
  `pages` VARCHAR(100) DEFAULT NULL COMMENT '页码范围',
  `doi` VARCHAR(255) DEFAULT NULL COMMENT 'DOI 标识',
  `pmid` VARCHAR(64) DEFAULT NULL COMMENT 'PubMed ID',
  `url` VARCHAR(512) DEFAULT NULL COMMENT '原文链接',
  `abstract` TEXT DEFAULT NULL COMMENT '文献摘要',
  `notes` TEXT DEFAULT NULL COMMENT '文献备注信息',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_reference_id` (`reference_id`),
  INDEX `idx_ref_doi` (`doi`),
  INDEX `idx_ref_pmid` (`pmid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='参考文献主数据';

CREATE TABLE IF NOT EXISTS `rdc_drug_reference` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增主键（关联行标识）',
  `drug_id` VARCHAR(128) NOT NULL COMMENT 'Business ID (rdc_drug.drug_id)',
  `reference_id` VARCHAR(128) NOT NULL COMMENT 'Business ID (reference.reference_id)',
  `note` TEXT DEFAULT NULL COMMENT '药物-文献关联备注',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_drug_ref` (`drug_id`, `reference_id`),
  INDEX `idx_drug` (`drug_id`),
  INDEX `idx_reference` (`reference_id`),
  CONSTRAINT `fk_drug_ref_drug` FOREIGN KEY (`drug_id`) REFERENCES `rdc_drug`(`drug_id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_drug_ref_reference` FOREIGN KEY (`reference_id`) REFERENCES `reference`(`reference_id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='药物与文献多对多关联';
-- ---------------------------------------------------------------------
-- RDC 数据库规范化版本 (v2)
-- 合并化学实体并统一 in vitro 明细结构?
-- ---------------------------------------------------------------------
