import { NextRequest, NextResponse } from "next/server";

import { getDrugDetail, ExpandSegment } from "@/lib/rdc-data";
import { notFound, validationError, serverError } from "@/lib/http";
import { parseBooleanParam, parseExpandParam } from "@/lib/query";

const ALLOWED_EXPAND = new Set(["human_activity", "animal_in_vivo", "in_vitro", "chemicals"]);

export async function GET(request: NextRequest, context: { params: { drug_id: string } }) {
  try {
    const drugId = context.params.drug_id;
    if (!drugId) {
      return validationError("missing path parameter drug_id", ["drug_id"]);
    }

    const url = new URL(request.url);
    const expandParam = url.searchParams.get("expand");
    const rawExpand = expandParam ? parseExpandParam(expandParam) : undefined;

    if (rawExpand) {
      for (const value of rawExpand) {
        if (!ALLOWED_EXPAND.has(value)) {
          return validationError("expand option " + value + " is not supported", ["expand"]);
        }
      }
    }

    const allEntities = parseBooleanParam(url.searchParams.get("all_entities"), false);

    const detail = await getDrugDetail(drugId, {
      expand: rawExpand as Set<ExpandSegment> | undefined,
      allEntities,
    });

    if (!detail) {
      return notFound("drug " + drugId + " not found");
    }

    if (rawExpand && !rawExpand.has("human_activity")) {
      detail.human_activity = [];
    }
    if (rawExpand && !rawExpand.has("animal_in_vivo")) {
      detail.animal_in_vivo = { studies: [] };
    }
    if (rawExpand && !rawExpand.has("in_vitro")) {
      detail.in_vitro = {};
    }

    return NextResponse.json(detail);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return serverError(message);
  }
}
