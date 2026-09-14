import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function verifierGerante(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "gerante") return null;
  return user;
}

// POST = sauvegarder tous les horaires d'un coup
export async function POST(request: Request) {
  const body = await request.json();
  const { horaires } = body as {
    horaires: {
      jour_semaine: number;
      ouverture: string | null;
      fermeture: string | null;
      ferme: boolean;
    }[];
  };

  if (!horaires || !Array.isArray(horaires)) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const supabase = await createClient();
  const user = await verifierGerante(supabase);
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  // Supprimer l'ancien + réinsérer
  await supabase.from("horaires_salon").delete().neq("jour_semaine", -1);

  const { error } = await supabase.from("horaires_salon").insert(horaires);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}