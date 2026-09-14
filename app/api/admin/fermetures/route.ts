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

// POST = créer une fermeture
export async function POST(request: Request) {
  const body = await request.json();
  const { date_debut, date_fin, motif } = body;

  if (!date_debut || !date_fin) {
    return NextResponse.json(
      { error: "Dates requises" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const user = await verifierGerante(supabase);
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("fermetures_exceptionnelles")
    .insert({
      date_debut,
      date_fin,
      motif: motif || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ fermeture: data });
}

// DELETE = supprimer une fermeture
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID manquant" }, { status: 400 });
  }

  const supabase = await createClient();
  const user = await verifierGerante(supabase);
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { error } = await supabase
    .from("fermetures_exceptionnelles")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}