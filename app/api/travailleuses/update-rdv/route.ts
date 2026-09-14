import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.json();
  const { rdv_id, action, raison_annulation } = body as {
    rdv_id?: string;
    action?: "confirmer" | "annuler" | "terminer";
    raison_annulation?: string;
  };

  console.log("=== API update-rdv travailleuse ===");
  console.log("Body reçu:", { rdv_id, action, raison_annulation });

  if (!rdv_id || !action) {
    console.log("→ ERREUR : paramètres manquants");
    return NextResponse.json(
      { error: "Paramètres manquants" },
      { status: 400 }
    );
  }

  const supabaseUser = await createClient();
  const {
    data: { user },
  } = await supabaseUser.auth.getUser();

  console.log("User authentifié:", user?.id ?? "AUCUN");

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  console.log("Profile:", profile);
  console.log("Profile error:", profileError?.message ?? "aucune");

  if (profile?.role !== "travailleuse") {
    console.log("→ ERREUR : pas travailleuse, role =", profile?.role);
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  // Vérifier que le RDV existe
  const { data: rdv, error: rdvError } = await admin
    .from("rendez_vous")
    .select("id, praticienne_id, statut")
    .eq("id", rdv_id)
    .single();

  console.log("RDV trouvé:", rdv);
  console.log("RDV error:", rdvError?.message ?? "aucune");
  console.log("Praticienne du RDV:", rdv?.praticienne_id);
  console.log("User ID travailleuse:", user.id);
  console.log("Match ?", rdv?.praticienne_id === user.id);

  if (!rdv || rdv.praticienne_id !== user.id) {
    console.log("→ ERREUR : RDV pas assigné à cette travailleuse");
    return NextResponse.json(
      { error: "Ce RDV ne t'est pas assigné." },
      { status: 403 }
    );
  }

  let nouveauStatut: string;
  if (action === "confirmer") nouveauStatut = "confirme";
  else if (action === "terminer") nouveauStatut = "termine";
  else nouveauStatut = "annule_salon";

  const updates: Record<string, unknown> = {
    statut: nouveauStatut,
    updated_at: new Date().toISOString(),
  };

  if (action === "annuler" && raison_annulation) {
    updates.raison_annulation = raison_annulation;
  }

  console.log("Updates à appliquer:", updates);

  const { error } = await admin
    .from("rendez_vous")
    .update(updates)
    .eq("id", rdv_id);

  if (error) {
    console.log("→ ERREUR update:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log("✅ Succès ! Statut:", nouveauStatut);
  console.log("===================================");

  return NextResponse.json({ ok: true, statut: nouveauStatut });
}