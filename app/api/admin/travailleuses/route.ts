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

// POST : créer une travailleuse
export async function POST(request: Request) {
  const auth = await verifierGerante();
  if (!auth) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await request.json();
  const { prenom, nom, telephone, categorie_id, email, password } = body;

  if (!prenom || !categorie_id || !email || !password) {
    return NextResponse.json(
      { error: "Prénom, catégorie, email et mot de passe sont requis" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Le mot de passe doit faire au moins 6 caractères" },
      { status: 400 }
    );
  }

  // 1. Créer l'utilisateur via l'API admin
  const { data: newUser, error: userError } =
    await auth.admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { prenom, nom, telephone },
    });

  if (userError || !newUser.user) {
    return NextResponse.json(
      { error: userError?.message ?? "Erreur création utilisateur" },
      { status: 500 }
    );
  }

  // 2. Mettre à jour le profil : rôle travailleuse + catégorie
  const { error: profileError } = await auth.admin
    .from("profiles")
    .update({
      role: "travailleuse",
      categorie_id,
      prenom,
      nom,
      telephone: telephone || null,
    })
    .eq("id", newUser.user.id);

  if (profileError) {
    return NextResponse.json(
      { error: profileError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, id: newUser.user.id });
}

// PATCH : modifier une travailleuse
export async function PATCH(request: Request) {
  const auth = await verifierGerante();
  if (!auth) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await request.json();
  const { id, prenom, nom, telephone, categorie_id } = body;

  if (!id) {
    return NextResponse.json({ error: "ID manquant" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (prenom !== undefined) updates.prenom = prenom;
  if (nom !== undefined) updates.nom = nom;
  if (telephone !== undefined) updates.telephone = telephone || null;
  if (categorie_id !== undefined) updates.categorie_id = categorie_id;

  const { error } = await auth.admin
    .from("profiles")
    .update(updates)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// DELETE : supprimer une travailleuse
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

  // Vérifier qu'il n'y a pas de RDV futurs
  const { count } = await auth.admin
    .from("rendez_vous")
    .select("*", { count: "exact", head: true })
    .eq("praticienne_id", id)
    .gte("debut", new Date().toISOString())
    .in("statut", ["en_attente", "confirme"]);

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      {
        error: `${count} rendez-vous à venir sont assignés à cette personne. Réaffectez-les avant de la supprimer.`,
      },
      { status: 409 }
    );
  }

  // Supprimer l'utilisateur (cascade sur profiles)
  const { error } = await auth.admin.auth.admin.deleteUser(id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}