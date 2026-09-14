import Link from "next/link";
import { requireTravailleuse } from "@/lib/auth";
import { DeconnexionTravailleuse } from "./DeconnexionTravailleuse";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TravailleusePage() {
  const { supabase, user, profile } = await requireTravailleuse();

  let categorieNom = "Sans catégorie";
  if (profile?.categorie_id) {
    const { data: cat } = await supabase
      .from("categories")
      .select("nom")
      .eq("id", profile.categorie_id)
      .single();
    if (cat) categorieNom = cat.nom;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: rdvs } = await supabase
    .from("rendez_vous")
    .select(
      "id, debut, fin, statut, notes, prestations (nom, duree_min), clientes:profiles!rendez_vous_cliente_id_fkey (prenom, nom, telephone)"
    )
    .eq("praticienne_id", user.id)
    .gte("debut", today.toISOString())
    .in("statut", ["en_attente", "confirme"])
    .order("debut", { ascending: true });

  const liste = rdvs ?? [];

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const rdvAujourdhui = liste.filter((r) => {
    const d = new Date(r.debut);
    return d >= today && d < tomorrow;
  });

  function formatHeure(iso: string) {
    return new Date(iso).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-neutral-200">
        <nav className="mx-auto max-w-5xl flex items-center justify-between p-6">
          <div>
            <Link href="/" className="text-xl font-medium tracking-wide">
              Salon Muse
            </Link>
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
              Espace travailleuse
            </p>
          </div>
          <DeconnexionTravailleuse />
        </nav>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-12">
        <p
          className="text-sm tracking-[0.2em] uppercase mb-3"
          style={{ color: "var(--muted)" }}
        >
          Bonjour
        </p>
        <h1 className="text-4xl font-light mb-2">{profile.prenom}</h1>
        <p className="text-sm mb-10" style={{ color: "var(--muted)" }}>
          Catégorie : <span className="font-medium">{categorieNom}</span>
        </p>

        <div className="grid gap-4 md:grid-cols-3 mb-10">
          <div className="p-5 rounded-2xl border border-neutral-200 bg-white">
            <p
              className="text-xs uppercase tracking-wide mb-1"
              style={{ color: "var(--muted)" }}
            >
              Aujourd&apos;hui
            </p>
            <p className="text-3xl font-light">{rdvAujourdhui.length}</p>
          </div>
          <div className="p-5 rounded-2xl border border-neutral-200 bg-white">
            <p
              className="text-xs uppercase tracking-wide mb-1"
              style={{ color: "var(--muted)" }}
            >
              À venir (total)
            </p>
            <p className="text-3xl font-light">{liste.length}</p>
          </div>
          <div className="p-5 rounded-2xl border border-neutral-200 bg-white">
            <p
              className="text-xs uppercase tracking-wide mb-1"
              style={{ color: "var(--muted)" }}
            >
              Mon téléphone
            </p>
            <p className="text-sm mt-1">{profile.telephone ?? "—"}</p>
          </div>
        </div>

        <h2 className="text-xl font-light mb-4">
          Mon planning d&apos;aujourd&apos;hui
        </h2>
        {rdvAujourdhui.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-neutral-300 text-center mb-10">
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Aucun rendez-vous aujourd&apos;hui.
            </p>
          </div>
        ) : (
          <div className="space-y-3 mb-10">
            {rdvAujourdhui.map((r) => {
              const p = r.prestations as unknown as {
                nom: string;
                duree_min: number;
              } | null;
              const c = r.clientes as unknown as {
                prenom: string | null;
                nom: string | null;
                telephone: string | null;
              } | null;
              return (
                <div
                  key={r.id}
                  className="p-5 rounded-2xl border border-neutral-200 bg-white flex items-start justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs uppercase tracking-wide mb-1"
                      style={{ color: "var(--muted)" }}
                    >
                      {formatHeure(r.debut)} · {p?.duree_min} min
                    </p>
                    <h3 className="text-lg mb-1">{p?.nom}</h3>
                    <p className="text-sm" style={{ color: "var(--muted)" }}>
                      👤 {c?.prenom ?? "?"} {c?.nom ?? ""}
                      {c?.telephone && ` · ${c.telephone}`}
                    </p>
                    {r.notes && (
                      <p
                        className="text-xs mt-2 italic"
                        style={{ color: "var(--muted)" }}
                      >
                        « {r.notes} »
                      </p>
                    )}
                  </div>
                  <span
                    className="text-xs px-2 py-1 rounded-full"
                    style={{
                      background:
                        r.statut === "confirme" ? "#e8f5e9" : "#fff8e1",
                      color:
                        r.statut === "confirme" ? "#2e7d32" : "#a07900",
                    }}
                  >
                    {r.statut === "confirme" ? "Confirmé" : "En attente"}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <h2 className="text-xl font-light mb-4">
          Tous mes rendez-vous à venir
        </h2>
        {liste.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-neutral-300 text-center">
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Aucun rendez-vous à venir.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {liste.map((r) => {
              const p = r.prestations as unknown as {
                nom: string;
                duree_min: number;
              } | null;
              const c = r.clientes as unknown as {
                prenom: string | null;
                nom: string | null;
              } | null;
              return (
                <div
                  key={r.id}
                  className="p-4 rounded-xl border border-neutral-200 bg-white flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-sm font-medium">{p?.nom}</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {formatDate(r.debut)} à {formatHeure(r.debut)}
                    </p>
                  </div>
                  <p className="text-sm" style={{ color: "var(--muted)" }}>
                    {c?.prenom ?? ""} {c?.nom ?? ""}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}