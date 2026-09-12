import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Prestation } from "@/lib/types/database";
import { ReservationWizard } from "./ReservationWizard";

export default async function ReservationPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const { data: prestations } = await supabase
    .from("prestations")
    .select("*")
    .eq("actif", true)
    .order("ordre_affichage");

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

        <ReservationWizard prestations={(prestations ?? []) as Prestation[]} />
      </section>
    </main>
  );
}