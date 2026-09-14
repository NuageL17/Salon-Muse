import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function verifierGerante() {
  const supabaseUser = await createClient();
  const {
    data: { user },
  } = await supabaseUser.auth.getUser();

  if (!user) return null;

  // Utilise le client admin pour contourner la RLS
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "gerante") return null;
  return { admin, user };
}

export async function POST(request: Request) {
  const auth = await verifierGerante();
  if (!auth) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await request.json();
  const {
    nom,
    description,
    categorie,
    duree_min,
    buffer_min,
    prix,
    ordre_affichage,
    actif,
  } = body;

  if (!nom || !duree_min || prix == null) {
    return NextResponse.json(
      { error: "Nom, durée et prix sont requis" },
      { status: 400 }
    );
  }

  const { data, error } = await auth.admin
    .from("prestations")
    .insert({
      nom,
      description: description || null,
      categorie: categorie || null,
      duree_min,
      buffer_min: buffer_min ?? 10,
      prix,
      ordre_affichage: ordre_affichage ?? 0,
      actif: actif ?? true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ prestation: data });
}

export async function PATCH(request: Request) {
  const auth = await verifierGerante();
  if (!auth) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "ID manquant" }, { status: 400 });
  }

  const { data, error } = await auth.admin
    .from("prestations")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ prestation: data });
}

export async function DELETE(request: Request) {
  const auth = await verifierGerante();
  if (!auth) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID manquant" }, { status: 400 });
  }

  // Vérifier s'il y a des RDV liés
  const { count } = await auth.admin
    .from("rendez_vous")
    .select("*", { count: "exact", head: true })
    .eq("prestation_id", id);

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      {
        error: "Des rendez-vous existent pour cette prestation.",
        code: "HAS_RDV",
        nb_rdv: count,
      },
      { status: 409 }
    );
  }

  const { error } = await auth.admin.from("prestations").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}