# RDC 项目说明

## Next.js API 实现
- 代码目录：`rdc-api`
- 启动步骤：
  1. `cd rdc-api`
  2. （首次）`npm install`
  3. 本地开发：`npm run dev`
  4. 构建/校验：`npm run build` 或 `npm run lint`

### 已实现接口（基于文档 Mock 数据）
- `GET /api/rdc/init`：初始化状态枚举
- `GET /api/rdc`：RDC 列表（分页、过滤、排序）
- `GET /api/rdc/search`：药物名模糊搜索
- `GET /api/rdc/by-status`：根据状态筛选药物
- `GET /api/rdc/detail`：按药物名精确查询基础信息
- `GET /api/rdc/{drug_id}`：药物详情，支持 `expand` 与 `all_entities`
- `GET /api/chemical/{entity_category}/{entity_id}`：化学实体详情，可带 `include_activity`

数据源位于 `rdc-api/lib/mock-data.ts`，结构参考 `main.sql` 中的库表约束。查询聚合与字段映射位于 `rdc-api/lib/data-access.ts`。

## 验证
- `npm run lint`
- `npm run build`
