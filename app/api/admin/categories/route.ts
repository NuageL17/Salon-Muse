import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function verifierGerante() {
  const supabaseUser = await createClient();
  const {
    data: { user },
  } = await supabaseUser.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "gerante") return null;
  return { admin, user };
}

// POST : créer une catégorie ou sous-catégorie
export async function POST(request: Request) {
  const auth = await verifierGerante();
  if (!auth) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await request.json();
  const { nom, parent_id, ordre_affichage } = body;

  if (!nom) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  }

  const { data, error } = await auth.admin
    .from("categories")
    .insert({
      nom,
      parent_id: parent_id || null,
      ordre_affichage: ordre_affichage ?? 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ categorie: data });
}

// PATCH : modifier
export async function PATCH(request: Request) {
  const auth = await verifierGerante();
  if (!auth) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await request.json();
  const { id, nom, ordre_affichage } = body;

  if (!id) {
    return NextResponse.json({ error: "ID manquant" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (nom !== undefined) updates.nom = nom;
  if (ordre_affichage !== undefined) updates.ordre_affichage = ordre_affichage;

  const { data, error } = await auth.admin
    .from("categories")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ categorie: data });
}

// DELETE : supprimer avec vérification récursive
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

  // 1. Récupérer TOUTES les catégories pour construire l'arbre
  const { data: allCats } = await auth.admin
    .from("categories")
    .select("id, parent_id");

  // 2. Trouver TOUS les descendants (récursif)
  const descendants: string[] = [id];
  const toVisit = [id];
  while (toVisit.length > 0) {
    const currentId = toVisit.pop()!;
    const children = (allCats ?? []).filter((c) => c.parent_id === currentId);
    for (const child of children) {
      descendants.push(child.id);
      toVisit.push(child.id);
    }
  }

  // 3. Vérifier prestations dans tout le sous-arbre
  const { count: nbPrestations } = await auth.admin
    .from("prestations")
    .select("*", { count: "exact", head: true })
    .in("categorie_id", descendants);

  if ((nbPrestations ?? 0) > 0) {
    const suffixe =
      descendants.length > 1
        ? " (y compris ses sous-catégories)"
        : "";
    return NextResponse.json(
      {
        error: `${nbPrestations} prestation(s) utilisent cette catégorie${suffixe}. Supprimez ou déplacez d'abord ces prestations.`,
        code: "HAS_PRESTATIONS",
        nb_prestations: nbPrestations,
      },
      { status: 409 }
    );
  }

  // 4. Vérifier travailleuses dans tout le sous-arbre
  const { count: nbTravailleuses } = await auth.admin
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .in("categorie_id", descendants);

  if ((nbTravailleuses ?? 0) > 0) {
    const suffixe =
      descendants.length > 1 ? " (y compris ses sous-catégories)" : "";
    return NextResponse.json(
      {
        error: `${nbTravailleuses} travailleuse(s) sont dans cette catégorie${suffixe}. Réaffectez-les avant de supprimer.`,
        code: "HAS_TRAVAILLEUSES",
      },
      { status: 409 }
    );
  }

  // 5. Supprimer
  const { error } = await auth.admin.from("categories").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}