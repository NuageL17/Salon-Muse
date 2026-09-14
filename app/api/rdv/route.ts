import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { prestation_id, travailleuse_id, debut, notes } = body as {
    prestation_id?: string;
    travailleuse_id?: string;
    debut?: string;
    notes?: string;
  };

  if (!prestation_id || !travailleuse_id || !debut) {
    return NextResponse.json(
      { error: "Paramètres manquants" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data: prestation, error: prestationError } = await supabase
    .from("prestations")
    .select("duree_min, prix")
    .eq("id", prestation_id)
    .single();

  if (prestationError || !prestation) {
    return NextResponse.json(
      { error: "Prestation introuvable" },
      { status: 404 }
    );
  }

  const debutDate = new Date(debut);
  const finDate = new Date(
    debutDate.getTime() + prestation.duree_min * 60 * 1000
  );

  const { data: rdv, error } = await supabase
    .from("rendez_vous")
    .insert({
      cliente_id: user.id,
      praticienne_id: travailleuse_id,
      prestation_id,
      debut: debutDate.toISOString(),
      fin: finDate.toISOString(),
      statut: "en_attente",
      prix_applique: prestation.prix,
      notes: notes ?? null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23P01") {
      return NextResponse.json(
        { error: "Ce créneau vient d'être réservé. Choisissez-en un autre." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rdv });
}