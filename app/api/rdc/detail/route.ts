import { NextRequest, NextResponse } from "next/server";

import { findDrugByName } from "@/lib/data-access";
import { notFound, validationError } from "@/lib/http";

export function GET(request: NextRequest) {
  const url = new URL(request.url);
  const drugName = url.searchParams.get("drug_name");
  if (!drugName || !drugName.trim()) {
    return validationError("缺少查询参数 drug_name", ["drug_name"]);
  }
  const detail = findDrugByName(drugName);
  if (!detail) {
    return notFound(`未找到药物 ${drugName}`);
  }
  return NextResponse.json(detail);
}
