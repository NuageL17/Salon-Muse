import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { rdv_id, action } = body as {
    rdv_id?: string;
    action?: "confirmer" | "annuler" | "terminer";
  };

  if (!rdv_id || !action) {
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "gerante") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  let nouveauStatut: string;
  if (action === "confirmer") nouveauStatut = "confirme";
  else if (action === "terminer") nouveauStatut = "termine";
  else nouveauStatut = "annule_salon";

  const { error } = await supabase
    .from("rendez_vous")
    .update({ statut: nouveauStatut, updated_at: new Date().toISOString() })
    .eq("id", rdv_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, statut: nouveauStatut });
}