import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AnnulerRdvButton } from "@/components/rdv/AnnulerRdvButton";
import { ActiverPush } from "@/components/notifications/ActiverPush";

type RdvAvecPrestation = {
  id: string;
  debut: string;
  fin: string;
  statut: string;
  prix_applique: number | null;
  notes: string | null;
  prestations: {
    nom: string;
    categorie: string | null;
    duree_min: number;
  } | null;
};

type Filleul = {
  id: string;
  statut: string;
  created_at: string;
  valide_le: string | null;
  recompense_parrain: number | null;
  code_utilise: string;
  filleul: {
    prenom: string | null;
    nom: string | null;
  } | null;
};

function formatDateHeure(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function MonComptePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: rdvs } = await supabase
    .from("rendez_vous")
    .select(
      "id, debut, fin, statut, prix_applique, notes, prestations (nom, categorie, duree_min)"
    )
    .eq("cliente_id", user.id)
    .in("statut", ["en_attente", "confirme", "en_cours"])
    .gte("debut", new Date().toISOString())
    .order("debut", { ascending: true });

  const prochains = (rdvs ?? []) as unknown as RdvAvecPrestation[];

  // Parrainages : 2 requêtes séparées (jointure + profils filleuls)
  const { data: parrainagesData } = await supabase
    .from("parrainages")
    .select(
      "id, statut, created_at, valide_le, recompense_parrain, code_utilise, filleul_id"
    )
    .eq("parrain_id", user.id)
    .order("created_at", { ascending: false });

  const filleulIds = (parrainagesData ?? []).map((p) => p.filleul_id);
  const { data: profilsFilleuls } = filleulIds.length
    ? await supabase
        .from("profiles")
        .select("id, prenom, nom")
        .in("id", filleulIds)
    : {
        data: [] as {
          id: string;
          prenom: string | null;
          nom: string | null;
        }[],
      };

  const mesFilleuls = (parrainagesData ?? []).map((p) => ({
    id: p.id,
    statut: p.statut,
    created_at: p.created_at,
    valide_le: p.valide_le,
    recompense_parrain: p.recompense_parrain,
    code_utilise: p.code_utilise,
    filleul: profilsFilleuls?.find((f) => f.id === p.filleul_id) ?? null,
  })) as Filleul[];

  return (
    <main className="min-h-screen">
      <header className="border-b border-neutral-200">
        <nav className="mx-auto max-w-6xl flex items-center justify-between p-6">
          <Link href="/" className="text-xl font-medium tracking-wide">
            Salon Muse
          </Link>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-sm hover:opacity-60"
              style={{ color: "var(--muted)" }}
            >
              Se déconnecter
            </button>
          </form>
        </nav>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-16">
        <p
          className="text-sm tracking-[0.2em] uppercase mb-4"
          style={{ color: "var(--muted)" }}
        >
          Espace cliente
        </p>
        <h1 className="text-4xl font-light mb-10">
          Bonjour {profile?.prenom ?? user.email}
        </h1>

        {/* Prochains rendez-vous */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-light">Mes prochains rendez-vous</h2>
            <Link
              href="/reservation"
              className="text-sm px-4 py-2 rounded-full text-white"
              style={{ background: "var(--accent)" }}
            >
              + Réserver
            </Link>
          </div>

          {prochains.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-neutral-300 text-center">
              <p className="mb-2">Aucun rendez-vous à venir.</p>
              <Link
                href="/reservation"
                className="text-sm underline"
                style={{ color: "var(--accent-dark)" }}
              >
                Réserver un soin
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {prochains.map((rdv) => (
                <div
                  key={rdv.id}
                  className="p-5 rounded-2xl border border-neutral-200 bg-white"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p
                        className="text-xs uppercase tracking-wide mb-1"
                        style={{ color: "var(--muted)" }}
                      >
                        {rdv.prestations?.categorie}
                      </p>
                      <h3 className="text-lg">
                        {rdv.prestations?.nom ?? "Prestation"}
                      </h3>
                    </div>
                    <span
                      className="text-xs px-2 py-1 rounded-full"
                      style={{
                        background:
                          rdv.statut === "confirme" ? "#e8f5e9" : "#fff8e1",
                        color:
                          rdv.statut === "confirme" ? "#2e7d32" : "#a07900",
                      }}
                    >
                      {rdv.statut === "confirme"
                        ? "Confirmé"
                        : rdv.statut === "en_attente"
                          ? "En attente"
                          : rdv.statut}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: "var(--muted)" }}>
                    {formatDateHeure(rdv.debut)} ·{" "}
                    {rdv.prestations?.duree_min} min
                  </p>
                  {rdv.prix_applique != null && (
                    <p
                      className="text-sm mt-2 font-medium"
                      style={{ color: "var(--accent-dark)" }}
                    >
                      {rdv.prix_applique} €
                    </p>
                  )}
                  {rdv.notes && (
                    <p
                      className="text-xs mt-2 italic"
                      style={{ color: "var(--muted)" }}
                    >
                      « {rdv.notes} »
                    </p>
                  )}
                  <AnnulerRdvButton rdvId={rdv.id} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mes filleuls */}
        <div className="mb-12">
          <h2 className="text-xl font-light mb-4">Mes filleuls</h2>

          {mesFilleuls.length === 0 ? (
            <div className="p-6 rounded-2xl border border-dashed border-neutral-300 text-center">
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Aucun filleul pour l&apos;instant. Partagez votre code{" "}
                <span className="font-mono font-medium">
                  {profile?.code_parrainage}
                </span>{" "}
                à vos amies !
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {mesFilleuls.map((f) => (
                <div
                  key={f.id}
                  className="p-4 rounded-2xl border border-neutral-200 bg-white flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm">
                      {f.filleul?.prenom ?? "Inconnu"} {f.filleul?.nom ?? ""}
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {new Date(f.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className="inline-block text-xs px-2 py-1 rounded-full"
                      style={{
                        background:
                          f.statut === "valide" ? "#e8f5e9" : "#fff8e1",
                        color:
                          f.statut === "valide" ? "#2e7d32" : "#a07900",
                      }}
                    >
                      {f.statut === "valide" ? "Validé" : "En attente"}
                    </span>
                    {f.statut === "valide" && f.recompense_parrain != null && (
                      <p
                        className="text-xs mt-1 font-medium"
                        style={{ color: "var(--accent-dark)" }}
                      >
                        +{f.recompense_parrain} pts
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cartes profil + notifications */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-6 rounded-2xl border border-neutral-200 bg-white">
            <p
              className="text-xs uppercase tracking-wide mb-2"
              style={{ color: "var(--muted)" }}
            >
              Code de parrainage
            </p>
            <p className="font-mono text-lg">{profile?.code_parrainage}</p>
            <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
              Partagez ce code à vos amies.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-neutral-200 bg-white">
            <p
              className="text-xs uppercase tracking-wide mb-2"
              style={{ color: "var(--muted)" }}
            >
              Points fidélité
            </p>
            <p
              className="text-3xl font-light"
              style={{ color: "var(--accent-dark)" }}
            >
              {profile?.points_fidelite ?? 0}
            </p>
          </div>

          <div className="md:col-span-2">
            <ActiverPush />
          </div>
        </div>
      </section>
    </main>
  );
}