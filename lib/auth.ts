import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function requireGerante() {
  const supabaseUser = await createClient();

  const {
    data: { user },
  } = await supabaseUser.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const supabaseAdmin = createAdminClient();

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "gerante") {
    redirect("/mon-compte");
  }

  return { supabase: supabaseAdmin, user };
}

export async function requireTravailleuse() {
  const supabaseUser = await createClient();

  const {
    data: { user },
  } = await supabaseUser.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const supabaseAdmin = createAdminClient();

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role, prenom, nom, telephone, categorie_id")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "travailleuse") {
    redirect("/mon-compte");
  }

  return { supabase: supabaseAdmin, user, profile };
}