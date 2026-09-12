import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // Vérifier que le RDV appartient bien à la cliente et qu'il est annulable
  const { data: rdv, error: fetchError } = await supabase
    .from("rendez_vous")
    .select("id, cliente_id, statut, debut")
    .eq("id", id)
    .single();

  if (fetchError || !rdv) {
    return NextResponse.json({ error: "RDV introuvable" }, { status: 404 });
  }

  if (rdv.cliente_id !== user.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  if (!["en_attente", "confirme"].includes(rdv.statut)) {
    return NextResponse.json(
      { error: "Ce RDV ne peut plus être annulé" },
      { status: 400 }
    );
  }

  // Annuler
  const { error } = await supabase
    .from("rendez_vous")
    .update({ statut: "annule_cliente", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}