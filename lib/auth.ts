import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireGerante() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "gerante") {
    redirect("/mon-compte");
  }

  return { supabase, user };
}