# RDC 项目交接文档

本文档面向新接手开发人员，说明项目职责、技术栈、本地启动、数据库、数据更新、部署和常见维护流程。

## 项目概览

这是一个 RDC 数据查询项目，前端页面和后端 API 都由同一个 Next.js 应用提供。

线上访问地址：

```text
https://rdcdb.com/
```

核心能力：

```text
RDC 药物列表、搜索和详情
化学实体详情
药物、靶点、适应症、化学实体、文献和实验数据查询
CSV 数据校验和 MySQL 数据更新
GitHub Actions 手动部署代码和更新数据库数据
```

## 技术栈

```text
Next.js 14
React 18
TypeScript
MySQL
mysql2
Node.js 20
Python 3，用于 CSV 校验脚本
PM2，用于线上 Node 服务守护
Nginx，用于线上反向代理
```

## 重要目录

```text
app/                         Next.js 页面和 API 路由
app/api/                     后端 API
app/components/              前端组件
lib/                         数据访问、类型、工具函数
scripts/upsert_table_from_csv.js
                             CSV 与 MySQL 对比/写入脚本
csv_templates_normalized/    标准化 CSV 数据源
csv_validation_reports/      本地 CSV 校验报告输出目录
main.sql                     MySQL 表结构
validate_csv_data.py         CSV 全量校验脚本
.github/workflows/           GitHub Actions 工作流
docs/                        项目文档
```

## 环境变量

本地环境变量文件：

```text
.env.local
```

需要配置：

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASS=password
DB_NAME=rdcdb
NEXT_PUBLIC_ASSET_BASE=http://tfonpalg3.hn-bkt.clouddn.com
```

说明：

```text
DB_HOST/DB_PORT/DB_USER/DB_PASS/DB_NAME 用于连接 MySQL
NEXT_PUBLIC_ASSET_BASE 用于前端资源地址
```

不要把生产数据库密码提交到仓库。

## 本地开发

安装依赖：

```bash
npm ci
```

启动开发服务：

```bash
npm run dev
```

本地访问：

```text
http://localhost:3101
```

构建：

```bash
npm run build
```

Lint：

```bash
npm run lint
```

## 数据库

默认数据库名：

```text
rdcdb
```

建表脚本：

```text
main.sql
```

导入数据库示例：

```bash
mysql -u root -p rdcdb < main.sql
```

如果使用本地导出的 dump：

```bash
mysql -u root -p rdcdb < dump-rdcdb-xxxx.sql
```

项目运行时通过 `lib/db.ts` 创建 MySQL 连接池。

## API 路由

主要 API：

```text
GET /api/rdc
GET /api/rdc/search
GET /api/rdc/by-status
GET /api/rdc/detail
GET /api/rdc/init
GET /api/rdc/[drug_id]
GET /api/chemical/search
GET /api/chemical/[entity_category]/[entity_id]
GET /api/chemical/[entity_category]/[entity_id]/rdc-list
GET /api/reference/[drug_id]
```

主要页面：

```text
/                         首页
/rdc/search               RDC 搜索页
/rdc/[drug_id]            RDC 详情页
/chemical/[entity_category]/[entity_id]
                          化学实体详情页
```

主要数据读取逻辑：

```text
lib/rdc-data.ts
lib/data-access.ts
```

## CSV 数据源

CSV 数据位于：

```text
csv_templates_normalized/
```

当前主要 CSV：

```text
rdc_drug.csv
target.csv
drug_target.csv
indication.csv
drug_indication.csv
chemical_entity.csv
drug_chemical_rel.csv
chemical_affinity.csv
in_vitro.csv
in_vitro_measurement.csv
human_activity.csv
animal_in_vivo_study.csv
animal_in_vivo_biodist.csv
animal_in_vivo_efficacy.csv
reference.csv
rdc_drug_reference.csv
```

## CSV 校验

校验脚本：

```text
validate_csv_data.py
```

本地运行：

```bash
python validate_csv_data.py --schema main.sql --csv-dir csv_templates_normalized --out csv_validation_reports
```

输出：

```text
csv_validation_reports/csv_validation_report.md
csv_validation_reports/csv_validation_summary.csv
csv_validation_reports/csv_validation_details.csv
```

注意：`rdc_drug.external_id` 为空会进入报告，但不作为阻断错误。

## CSV 写入 MySQL

脚本：

```text
scripts/upsert_table_from_csv.js
```

dry-run 示例：

```bash
npm run upsert:csv -- --table drug_chemical_rel --csv csv_templates_normalized/drug_chemical_rel.csv --key drug_id,relation_role,chemical_entity_id
```

apply 示例：

```bash
npm run upsert:csv -- --table drug_chemical_rel --csv csv_templates_normalized/drug_chemical_rel.csv --key drug_id,relation_role,chemical_entity_id --apply
```

没有稳定业务唯一键的表使用整表替换：

```bash
npm run upsert:csv -- --table in_vitro_measurement --csv csv_templates_normalized/in_vitro_measurement.csv --replace-table --apply
```

整表替换会先创建备份表，再删除目标表当前数据，并插入 CSV 全量数据。

## GitHub Actions

### 代码部署

workflow：

```text
.github/workflows/deploy-code.yml
```

GitHub 页面入口：

```text
Actions -> Deploy Code -> Run workflow
```

参数：

```text
branch: main
confirm_deploy: DEPLOY_TO_PRODUCTION
```

功能：

```text
SSH 登录阿里云服务器
进入项目目录
git pull
npm ci
npm run build
pm2 restart
```

### 数据更新

workflow：

```text
.github/workflows/database-csv-patch.yml
```

GitHub 页面入口：

```text
Actions -> Database CSV Patch -> Run workflow
```

参数：

```text
table: 要 apply 的目标表
csv: CSV 路径；留空时使用 csv_templates_normalized/<table>.csv
mode: dry-run 或 apply
confirm_apply: apply 时必须填写 APPLY_TO_PRODUCTION
```

dry-run 会对比所有 CSV 和 MySQL 当前数据。

apply 会写入用户选择的 `table`。

更多细节见：

```text
docs/drug_chemical_rel_workflow_manual.md
```

## GitHub Secrets

代码部署需要：

```text
DEPLOY_HOST
DEPLOY_USER
DEPLOY_PORT
DEPLOY_PATH
DEPLOY_SSH_KEY
PM2_APP_NAME
```

数据库更新需要：

```text
DB_HOST
DB_PORT
DB_USER
DB_PASS
DB_NAME
```

如果 secrets 放在 GitHub Environment 中，workflow 的 `environment` 名称必须和 GitHub 环境名一致。

## 线上部署结构

当前线上结构：

```text
Nginx -> 127.0.0.1:3101 -> Next.js
Next.js -> 127.0.0.1:3306 -> MySQL
PM2 管理 Next.js 进程
```

常用服务器命令：

```bash
pm2 status
pm2 logs rdc-api
pm2 restart rdc-api
systemctl status nginx
systemctl status mysql
```

手动部署命令：

```bash
cd /var/www/drug
git fetch origin main
git checkout main
git pull --ff-only origin main
npm ci
npm run build
pm2 restart rdc-api
pm2 save
```

实际目录以 GitHub Secret `DEPLOY_PATH` 为准。

## 常见维护场景

### 修改前端页面

主要看：

```text
app/page.tsx
app/rdc/[drug_id]/page.tsx
app/rdc/search/page.tsx
app/chemical/[entity_category]/[entity_id]/page.tsx
app/components/
```

修改后：

```bash
npm run build
```

然后通过 `Deploy Code` 发布。

### 修改 API 查询逻辑

主要看：

```text
app/api/
lib/rdc-data.ts
lib/data-access.ts
lib/db.ts
```

修改后至少运行：

```bash
npm run build
```

### 更新 CSV 数据

推荐流程：

```text
1. 修改 csv_templates_normalized 下的 CSV
2. 本地运行 validate_csv_data.py
3. 提交代码
4. GitHub Actions 运行 Database CSV Patch dry-run
5. 确认目标表 diff
6. 再运行 apply
```

### 修改数据库结构

需要同步修改：

```text
main.sql
csv_templates_normalized/*.csv
validate_csv_data.py 中的校验逻辑，如有必要
scripts/upsert_table_from_csv.js 中的写入/对比逻辑，如有必要
lib/rdc-data.ts 或 API 查询逻辑
```

数据库结构修改需要谨慎安排迁移步骤，不建议直接在生产库手动改完后不同步 `main.sql`。

## 注意事项

1. 生产数据更新必须先 dry-run，再 apply。
2. `--apply` 会真实写数据库，本地执行前必须确认 `.env.local` 连接的是哪个库。
3. 整表替换表必须保证 CSV 是完整数据集。
4. 不要提交生产密码、SSH 私钥或 `.env.local`。
5. 不建议提交 `__pycache__`、`.next`、`node_modules`。
6. 修改 workflow 后，要在 GitHub Actions 页面确认显示名和参数符合预期。

