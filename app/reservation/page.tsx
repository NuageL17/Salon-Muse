import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Prestation } from "@/lib/types/database";
import { ReservationWizard } from "./ReservationWizard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Categorie = {
  id: string;
  nom: string;
  parent_id: string | null;
  ordre_affichage: number;
};

export default async function ReservationPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const admin = createAdminClient();

  const { data: prestations } = await admin
    .from("prestations")
    .select("*")
    .eq("actif", true)
    .order("ordre_affichage");

  const { data: categories } = await admin
    .from("categories")
    .select("id, nom, parent_id, ordre_affichage")
    .order("ordre_affichage", { ascending: true });

  return (
    <main className="min-h-screen">
      <header className="border-b border-neutral-200">
        <nav className="mx-auto max-w-6xl flex items-center justify-between p-6">
          <Link href="/" className="text-xl font-medium tracking-wide">
            Salon Muse
          </Link>
          <Link
            href="/mon-compte"
            className="text-sm hover:opacity-60"
            style={{ color: "var(--muted)" }}
          >
            Mon compte
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <p
          className="text-sm tracking-[0.2em] uppercase mb-4 text-center"
          style={{ color: "var(--muted)" }}
        >
          Réservation
        </p>
        <h1 className="text-4xl font-light mb-12 text-center">
          Prenez rendez-vous
        </h1>

        <ReservationWizard
          prestations={
            (prestations ?? []) as unknown as (Prestation & {
              categorie_id: string | null;
            })[]
          }
          categories={(categories ?? []) as Categorie[]}
        />
      </section>
    </main>
  );
}