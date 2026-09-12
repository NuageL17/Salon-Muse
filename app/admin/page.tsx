import Link from "next/link";
import { requireGerante } from "@/lib/auth";
import { ActionsAdminRdv } from "@/components/rdv/ActionsAdminRdv";

type RdvAdmin = {
  id: string;
  debut: string;
  fin: string;
  statut: string;
  prix_applique: number | null;
  notes: string | null;
  clientes: {
    prenom: string | null;
    nom: string | null;
    telephone: string | null;
  } | null;
  prestations: {
    nom: string;
    categorie: string | null;
    duree_min: number;
  } | null;
};

function formatDateHeure(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function badgeStatut(statut: string): {
  label: string;
  bg: string;
  color: string;
} {
  switch (statut) {
    case "confirme":
      return { label: "Confirmé", bg: "#e8f5e9", color: "#2e7d32" };
    case "annule_salon":
      return { label: "Annulé (salon)", bg: "#fee2e2", color: "#b91c1c" };
    case "annule_cliente":
      return { label: "Annulé (cliente)", bg: "#fee2e2", color: "#b91c1c" };
    case "en_attente":
    default:
      return { label: "En attente", bg: "#fff8e1", color: "#a07900" };
  }
}

export default async function AdminPage() {
  const { supabase } = await requireGerante();

  const now = new Date().toISOString();

  const { data: rdvs, error } = await supabase
    .from("rendez_vous")
    .select(
      "id, debut, fin, statut, prix_applique, notes, clientes:profiles!rendez_vous_cliente_id_fkey (prenom, nom, telephone), prestations (nom, categorie, duree_min)"
    )
    .in("statut", ["en_attente", "confirme", "annule_salon", "annule_cliente"])
    .gte(
      "debut",
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    )
    .order("debut", { ascending: true });

  const liste = (rdvs ?? []) as unknown as RdvAdmin[];

  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  const demain = new Date(aujourdhui);
  demain.setDate(demain.getDate() + 1);

  const actifs = liste.filter(
    (r) => r.statut === "en_attente" || r.statut === "confirme"
  );
  const annules = liste.filter((r) =>
    ["annule_salon", "annule_cliente"].includes(r.statut)
  );

  const rdvAujourdhui = actifs.filter((r) => {
    const d = new Date(r.debut);
    return d >= aujourdhui && d < demain;
  });

  const caPrevisionnel = actifs.reduce(
    (sum, r) => sum + (r.prix_applique ?? 0),
    0
  );

  return (
    <main className="min-h-screen">
      <header className="border-b border-neutral-200">
        <nav className="mx-auto max-w-6xl flex items-center justify-between p-6">
          <Link href="/" className="text-xl font-medium tracking-wide">
            Salon Muse <span className="text-xs opacity-60">· Admin</span>
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/admin/notifications" className="hover:opacity-60">
              Notifications
            </Link>
            <Link href="/mon-compte" className="hover:opacity-60">
              Mon espace
            </Link>
            <form action="/auth/signout" method="post">
              <button type="submit" className="hover:opacity-60">
                Déconnexion
              </button>
            </form>
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <p
          className="text-sm tracking-[0.2em] uppercase mb-4"
          style={{ color: "var(--muted)" }}
        >
          Tableau de bord
        </p>
        <h1 className="text-4xl font-light mb-10">Rendez-vous</h1>

        {/* Stats */}
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
            <p className="text-3xl font-light">{actifs.length}</p>
          </div>
          <div className="p-5 rounded-2xl border border-neutral-200 bg-white">
            <p
              className="text-xs uppercase tracking-wide mb-1"
              style={{ color: "var(--muted)" }}
            >
              CA prévisionnel
            </p>
            <p
              className="text-3xl font-light"
              style={{ color: "var(--accent-dark)" }}
            >
              {caPrevisionnel} €
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 mb-6">
            {error.message}
          </div>
        )}

        {/* RDV actifs */}
        <h2 className="text-xl font-light mb-4">À venir</h2>
        {actifs.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-neutral-300 text-center mb-12">
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Aucun rendez-vous à venir.
            </p>
          </div>
        ) : (
          <div className="space-y-3 mb-12">
            {actifs.map((rdv) => (
              <RdvCarte key={rdv.id} rdv={rdv} />
            ))}
          </div>
        )}

        {/* RDV annulés */}
        {annules.length > 0 && (
          <>
            <h2
              className="text-xl font-light mb-4"
              style={{ color: "var(--muted)" }}
            >
              Annulés récemment
            </h2>
            <div className="space-y-3">
              {annules.map((rdv) => (
                <RdvCarte key={rdv.id} rdv={rdv} />
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function RdvCarte({ rdv }: { rdv: RdvAdmin }) {
  const badge = badgeStatut(rdv.statut);
  const estAnnule = ["annule_salon", "annule_cliente"].includes(rdv.statut);

  return (
    <div
      className="p-5 rounded-2xl border border-neutral-200 bg-white"
      style={{ opacity: estAnnule ? 0.6 : 1 }}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Date / heure */}
        <div className="flex-shrink-0 w-32">
          <p
            className="text-xs uppercase tracking-wide"
            style={{ color: "var(--muted)" }}
          >
            {formatDateHeure(rdv.debut)}
          </p>
          <p className="text-sm mt-1">{rdv.prestations?.duree_min} min</p>
        </div>

        {/* Détails + actions */}
        <div className="flex-1 min-w-0">
          <p
            className="text-xs uppercase tracking-wide mb-1"
            style={{ color: "var(--muted)" }}
          >
            {rdv.prestations?.categorie}
          </p>
          <h3 className="text-lg mb-1">
            {rdv.prestations?.nom ?? "Prestation"}
          </h3>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {rdv.clientes?.prenom ?? "?"} {rdv.clientes?.nom ?? ""}
            {rdv.clientes?.telephone && ` · ${rdv.clientes.telephone}`}
          </p>
          {rdv.notes && (
            <p
              className="text-xs mt-2 italic"
              style={{ color: "var(--muted)" }}
            >
              « {rdv.notes} »
            </p>
          )}
          {!estAnnule && (
            <ActionsAdminRdv rdvId={rdv.id} statut={rdv.statut} />
          )}
        </div>

        {/* Prix + Statut */}
        <div className="flex-shrink-0 text-right">
          <p
            className="text-lg font-medium mb-2"
            style={{ color: "var(--accent-dark)" }}
          >
            {rdv.prix_applique} €
          </p>
          <span
            className="inline-block text-xs px-2 py-1 rounded-full"
            style={{ background: badge.bg, color: badge.color }}
          >
            {badge.label}
          </span>
        </div>
      </div>
    </div>
  );
}