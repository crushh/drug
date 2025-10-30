import { NextRequest, NextResponse } from "next/server";

import { findDrugByName } from "@/lib/rdc-data";
import { notFound, validationError, serverError } from "@/lib/http";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const drugName = url.searchParams.get("drug_name");
    if (!drugName || !drugName.trim()) {
      return validationError("missing query parameter drug_name", ["drug_name"]);
    }
    const detail = await findDrugByName(drugName);
    if (!detail) {
      return notFound("drug " + drugName + " not found");
    }
    return NextResponse.json(detail);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return serverError(message);
  }
}
