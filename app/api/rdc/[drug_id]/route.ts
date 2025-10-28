import { NextRequest, NextResponse } from "next/server";

import { getDrugDetail } from "@/lib/data-access";
import { notFound, validationError } from "@/lib/http";
import { parseBooleanParam, parseExpandParam } from "@/lib/query";

const ALLOWED_EXPAND = new Set(["human_activity", "animal_in_vivo", "in_vitro", "chemicals"]);

export function GET(request: NextRequest, context: { params: { drug_id: string } }) {
  const drugId = context.params.drug_id;
  if (!drugId) {
    return validationError("缺少路径参数 drug_id", ["drug_id"]);
  }

  const url = new URL(request.url);
  const expandParam = url.searchParams.get("expand");
  const expandSet = expandParam ? parseExpandParam(expandParam) : undefined;

  if (expandSet) {
    for (const value of expandSet) {
      if (!ALLOWED_EXPAND.has(value)) {
        return validationError(`expand 不支持 ${value}`, ["expand"]);
      }
    }
  }

  const allEntities = parseBooleanParam(url.searchParams.get("all_entities"), false);

  const detail = getDrugDetail(drugId, {
    expand: expandSet,
    allEntities,
  });

  if (!detail) {
    return notFound(`未找到药物 ${drugId}`);
  }

  if (expandSet && !expandSet.has("human_activity")) {
    detail.human_activity = [];
  }
  if (expandSet && !expandSet.has("animal_in_vivo")) {
    detail.animal_in_vivo = { studies: [] };
  }
  if (expandSet && !expandSet.has("in_vitro")) {
    detail.in_vitro = {};
  }

  return NextResponse.json(detail);
}
