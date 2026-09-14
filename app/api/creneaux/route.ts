import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const prestationId = searchParams.get("prestation_id");
  const travailleuseId = searchParams.get("travailleuse_id");
  const date = searchParams.get("date");

  if (!prestationId || !travailleuseId || !date) {
    return NextResponse.json(
      { error: "Paramètres manquants" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // On utilise la nouvelle fonction qui prend en compte la travailleuse
  const { data, error } = await supabase.rpc("creneaux_travailleuse", {
    p_prestation_id: prestationId,
    p_travailleuse_id: travailleuseId,
    p_date: date,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const slots = (data ?? []).map((row: { debut: string }) => row.debut);
  return NextResponse.json({ slots });
}