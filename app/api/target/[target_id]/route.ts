import { NextRequest, NextResponse } from "next/server";

import { getPool } from "@/lib/db";
import { notFound, serverError } from "@/lib/http";

export async function GET(request: NextRequest, context: { params: { target_id: string } }) {
  try {
    const targetId = context.params.target_id;
    if (!targetId) {
      return notFound("target_id is required");
    }

    const pool = getPool();

    // Get target general info
    const [targetRows] = await pool.query(
      `SELECT target_id, external_id, name, description
       FROM \`target\`
       WHERE target_id = ?
       LIMIT 1`,
      [targetId]
    );

    if ((targetRows as any[]).length === 0) {
      return notFound("target not found");
    }

    const targetRow = (targetRows as any[])[0];

    // Get related drugs with chemical info
    const [drugRows] = await pool.query(
      `SELECT 
         d.drug_id,
         d.drug_name,
         d.type,
         d.status,
         (SELECT ce.name 
          FROM drug_chemical_rel dcr 
          JOIN chemical_entity ce ON ce.entity_id = dcr.chemical_entity_id 
          WHERE dcr.drug_id = d.drug_id AND dcr.relation_role = 'ligand' 
          LIMIT 1) as ligand_name,
         (SELECT ce.name 
          FROM drug_chemical_rel dcr 
          JOIN chemical_entity ce ON ce.entity_id = dcr.chemical_entity_id 
          WHERE dcr.drug_id = d.drug_id AND dcr.relation_role = 'chelator' 
          LIMIT 1) as chelator_name,
         (SELECT ce.name 
          FROM drug_chemical_rel dcr 
          JOIN chemical_entity ce ON ce.entity_id = dcr.chemical_entity_id 
          WHERE dcr.drug_id = d.drug_id AND dcr.relation_role = 'radionuclide' 
          LIMIT 1) as radionuclide_name
       FROM drug_target dt
       JOIN rdc_drug d ON d.drug_id = dt.drug_id
       WHERE dt.target_id = ?
       ORDER BY d.drug_name ASC`,
      [targetId]
    );

    const detail = {
      general: {
        target_id: targetRow.target_id as string,
        external_id: (targetRow.external_id as string) ?? null,
        name: (targetRow.name as string) ?? null,
        description: (targetRow.description as string) ?? null,
      },
      related_drugs: (drugRows as any[]).map((row) => ({
        drug_id: row.drug_id as string,
        drug_name: row.drug_name as string,
        type: (row.type as string) ?? null,
        status: (row.status as string) ?? null,
        ligand_name: (row.ligand_name as string) ?? null,
        chelator_name: (row.chelator_name as string) ?? null,
        radionuclide_name: (row.radionuclide_name as string) ?? null,
      })),
    };

    return NextResponse.json(detail);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return serverError(message);
  }
}
