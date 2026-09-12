import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Prestation } from "@/lib/types/database";

export default async function PrestationsPage() {
  const supabase = await createClient();

  const { data: prestations, error } = await supabase
    .from("prestations")
    .select("*")
    .eq("actif", true)
    .order("ordre_affichage", { ascending: true });

  if (error) {
    return (
      <main className="p-12 max-w-3xl mx-auto">
        <h1 className="text-3xl font-light mb-6">Erreur</h1>
        <pre className="p-4 rounded-xl bg-red-50 text-sm text-red-700 whitespace-pre-wrap">
          {error.message}
        </pre>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-neutral-200">
        <nav className="mx-auto max-w-6xl flex items-center justify-between p-6">
          <Link href="/" className="text-xl font-medium tracking-wide">
            Salon Muse
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/prestations" className="opacity-60">
              Prestations
            </Link>
            <Link href="/galerie" className="hover:opacity-60">
              Galerie
            </Link>
            <Link href="/contact" className="hover:opacity-60">
              Contact
            </Link>
            <Link
              href="/reservation"
              className="px-4 py-2 rounded-full text-white"
              style={{ background: "var(--accent)" }}
            >
              Prendre RDV
            </Link>
          </div>
        </nav>
      </header>

      {/* Contenu */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <p
          className="text-sm tracking-[0.2em] uppercase mb-4"
          style={{ color: "var(--muted)" }}
        >
          Nos soins
        </p>
        <h1 className="text-4xl md:text-5xl font-light mb-4">
          Nos prestations
        </h1>
        <p className="text-lg mb-12" style={{ color: "var(--muted)" }}>
          {prestations?.length ?? 0} soin{(prestations?.length ?? 0) > 1 ? "s" : ""} disponible{(prestations?.length ?? 0) > 1 ? "s" : ""}
        </p>

        {prestations && prestations.length === 0 && (
          <div className="p-8 rounded-2xl border border-dashed border-neutral-300 text-center">
            <p className="mb-2">Aucune prestation en base.</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {prestations?.map((p: Prestation) => (
            <article
              key={p.id}
              className="p-6 rounded-2xl border border-neutral-200 bg-white flex flex-col"
            >
              {p.categorie && (
                <p
                  className="text-xs tracking-[0.15em] uppercase mb-2"
                  style={{ color: "var(--muted)" }}
                >
                  {p.categorie}
                </p>
              )}
              <h2 className="text-xl mb-2">{p.nom}</h2>
              <p
                className="text-sm mb-4 flex-1"
                style={{ color: "var(--muted)" }}
              >
                {p.description}
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                <span className="text-sm" style={{ color: "var(--muted)" }}>
                  {p.duree_min} min
                </span>
                <span className="text-lg font-medium" style={{ color: "var(--accent-dark)" }}>
                  {p.prix} €
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}