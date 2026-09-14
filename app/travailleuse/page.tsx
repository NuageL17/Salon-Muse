import Link from "next/link";
import { requireTravailleuse } from "@/lib/auth";
import { DeconnexionTravailleuse } from "./DeconnexionTravailleuse";
import { ActionsTravailleuse } from "@/components/rdv/ActionsTravailleuse";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RdvTravailleuse = {
  id: string;
  debut: string;
  fin: string;
  statut: string;
  prix_applique: number | null;
  notes: string | null;
  reference_photo_url: string | null;
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
    case "termine":
      return { label: "Terminé", bg: "#e3f2fd", color: "#1565c0" };
    case "annule_salon":
      return { label: "Annulé", bg: "#fee2e2", color: "#b91c1c" };
    case "annule_cliente":
      return { label: "Annulé (cliente)", bg: "#fee2e2", color: "#b91c1c" };
    case "en_attente":
    default:
      return { label: "En attente", bg: "#fff8e1", color: "#a07900" };
  }
}

export default async function TravailleusePage() {
  const { supabase, user, profile } = await requireTravailleuse();

  // Nom de la catégorie
  let categorieNom = "Sans catégorie";
  if (profile?.categorie_id) {
    const { data: cat } = await supabase
      .from("categories")
      .select("nom")
      .eq("id", profile.categorie_id)
      .single();
    if (cat) categorieNom = cat.nom;
  }

  // RDV à venir (mêmes filtres que côté admin)
  const { data: rdvs } = await supabase
    .from("rendez_vous")
    .select(
      "id, debut, fin, statut, prix_applique, notes, reference_photo_url, clientes:profiles!rendez_vous_cliente_id_fkey (prenom, nom, telephone), prestations (nom, categorie, duree_min)"
    )
    .eq("praticienne_id", user.id)
    .in("statut", ["en_attente", "confirme"])
    .gte("debut", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order("debut", { ascending: true });

  // RDV annulés récents
  const { data: rdvsAnnules } = await supabase
    .from("rendez_vous")
    .select(
      "id, debut, fin, statut, prix_applique, notes, reference_photo_url, clientes:profiles!rendez_vous_cliente_id_fkey (prenom, nom, telephone), prestations (nom, categorie, duree_min)"
    )
    .eq("praticienne_id", user.id)
    .in("statut", ["annule_salon", "annule_cliente"])
    .gte("debut", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order("debut", { ascending: false });

  const liste = (rdvs ?? []) as unknown as RdvTravailleuse[];
  const listeAnnules = (rdvsAnnules ?? []) as unknown as RdvTravailleuse[];

  // Filtrer aujourd'hui
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const rdvAujourdhui = liste.filter((r) => {
    const d = new Date(r.debut);
    return d >= today && d < tomorrow;
  });

  // CA prévisionnel (RDV à venir non annulés)
  const caPrevisionnel = liste.reduce(
    (sum, r) => sum + (r.prix_applique ?? 0),
    0
  );

  return (
    <main className="min-h-screen">
      <header className="border-b border-neutral-200">
        <nav className="mx-auto max-w-6xl flex items-center justify-between p-6">
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

      <section className="mx-auto max-w-6xl px-6 py-12">
        <p
          className="text-sm tracking-[0.2em] uppercase mb-3"
          style={{ color: "var(--muted)" }}
        >
          Bonjour
        </p>
        <h1 className="text-4xl font-light mb-2">
          {profile.prenom} {profile.nom ?? ""}
        </h1>
        <p className="text-sm mb-10" style={{ color: "var(--muted)" }}>
          Catégorie : <span className="font-medium">{categorieNom}</span>
        </p>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-10">
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
              À venir
            </p>
            <p className="text-3xl font-light">{liste.length}</p>
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
              {caPrevisionnel} DA
            </p>
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

        {/* Planning à venir */}
        <h2 className="text-xl font-light mb-4">Mon planning à venir</h2>
        {liste.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-neutral-300 text-center mb-12">
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Aucun rendez-vous à venir.
            </p>
          </div>
        ) : (
          <div className="space-y-3 mb-12">
            {liste.map((rdv) => (
              <RdvCarteTravailleuse key={rdv.id} rdv={rdv} />
            ))}
          </div>
        )}

        {/* RDV annulés */}
        {listeAnnules.length > 0 && (
          <>
            <h2
              className="text-xl font-light mb-4"
              style={{ color: "var(--muted)" }}
            >
              Annulés récemment
            </h2>
            <div className="space-y-3">
              {listeAnnules.map((rdv) => (
                <RdvCarteTravailleuse key={rdv.id} rdv={rdv} />
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function RdvCarteTravailleuse({ rdv }: { rdv: RdvTravailleuse }) {
  const badge = badgeStatut(rdv.statut);
  const estAnnule = ["annule_salon", "annule_cliente"].includes(rdv.statut);

  return (
    <div
      className="p-5 rounded-2xl border border-neutral-200 bg-white"
      style={{ opacity: estAnnule ? 0.6 : 1 }}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Date / durée */}
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
            👤 {rdv.clientes?.prenom ?? "?"} {rdv.clientes?.nom ?? ""}
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
          {rdv.reference_photo_url && (
            <a
              href={rdv.reference_photo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3"
            >
              <img
                src={rdv.reference_photo_url}
                alt="Référence"
                className="w-24 h-24 object-cover rounded-xl border border-neutral-200 hover:opacity-80 transition"
              />
            </a>
          )}
          {!estAnnule && (
            <ActionsTravailleuse rdvId={rdv.id} statut={rdv.statut} />
          )}
        </div>

        {/* Prix + Statut */}
        <div className="flex-shrink-0 text-right">
          <p
            className="text-lg font-medium mb-2"
            style={{ color: "var(--accent-dark)" }}
          >
            {rdv.prix_applique} DA
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