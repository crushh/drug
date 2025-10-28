import { NextRequest, NextResponse } from "next/server";

import { getChemicalDetail, validateEntityCategory } from "@/lib/data-access";
import { notFound, validationError } from "@/lib/http";
import { parseBooleanParam } from "@/lib/query";

export function GET(
  request: NextRequest,
  context: { params: { entity_category: string; entity_id: string } }
) {
  const { entity_category: categoryParam, entity_id: entityId } = context.params;
  if (!categoryParam) {
    return validationError("缺少路径参数 entity_category", ["entity_category"]);
  }
  if (!entityId) {
    return validationError("缺少路径参数 entity_id", ["entity_id"]);
  }

  if (!validateEntityCategory(categoryParam)) {
    return validationError(`entity_category 不支持 ${categoryParam}`, ["entity_category"]);
  }

  const includeActivity = parseBooleanParam(
    new URL(request.url).searchParams.get("include_activity"),
    true
  );

  const detail = getChemicalDetail(categoryParam, entityId, { includeActivity });

  if (!detail) {
    return notFound(`未找到化学实体 ${entityId}`);
  }

  return NextResponse.json(detail);
}
