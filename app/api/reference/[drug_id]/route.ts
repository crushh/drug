import { NextRequest, NextResponse } from "next/server";

import { getDrugReferences } from "@/lib/rdc-data";
import { serverError, validationError } from "@/lib/http";

export async function GET(request: NextRequest, context: { params: { drug_id: string } }) {
  try {
    const drugId = context.params.drug_id;
    if (!drugId) {
      return validationError("missing path parameter drug_id", ["drug_id"]);
    }

    const references = await getDrugReferences(drugId);
    return NextResponse.json({
      drug_id: drugId,
      references,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return serverError(message);
  }
}
