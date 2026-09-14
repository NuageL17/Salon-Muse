import { requireGerante } from "@/lib/auth";
import { FiltresPlanning } from "@/components/admin/FiltresPlanning";

type RdvAdmin = {
  id: string;
  debut: string;
  fin: string;
  statut: string;
  prix_applique: number | null;
  notes: string | null;
  reference_photo_url: string | null;
  raison_annulation: string | null;
  clientes: {
    prenom: string | null;
    nom: string | null;
    telephone: string | null;
  } | null;
  travailleuse: {
    prenom: string | null;
    nom: string | null;
  } | null;
  prestations: {
    nom: string;
    categorie: string | null;
    duree_min: number;
  } | null;
};

export default async function AdminPage() {
  const { supabase } = await requireGerante();

  const { data: rdvs, error } = await supabase
    .from("rendez_vous")
    .select(
      "id, debut, fin, statut, prix_applique, notes, reference_photo_url, raison_annulation, clientes:profiles!rendez_vous_cliente_id_fkey (prenom, nom, telephone), travailleuse:profiles!rendez_vous_praticienne_id_fkey (prenom, nom), prestations (nom, categorie, duree_min)"
    )
    .in("statut", [
      "en_attente",
      "confirme",
      "termine",
      "annule_salon",
      "annule_cliente",
    ])
    .gte("debut", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order("debut", { ascending: true });

  const { data: categories } = await supabase
    .from("categories")
    .select("id, nom")
    .order("ordre_affichage", { ascending: true });

  const liste = (rdvs ?? []) as unknown as RdvAdmin[];

  // Stats rapides
  const maintenant = new Date();
  maintenant.setHours(0, 0, 0, 0);
  const demain = new Date(maintenant);
  demain.setDate(demain.getDate() + 1);

  const actifs = liste.filter(
    (r) => r.statut === "en_attente" || r.statut === "confirme"
  );
  const rdvAujourdhui = actifs.filter((r) => {
    const d = new Date(r.debut);
    return d >= maintenant && d < demain;
  });
  const caPrevisionnel = actifs.reduce(
    (sum, r) => sum + (r.prix_applique ?? 0),
    0
  );

  return (
    <section className="p-6 md:p-10 max-w-6xl mx-auto">
      <p
        className="text-sm tracking-[0.2em] uppercase mb-3"
        style={{ color: "var(--muted)" }}
      >
        Tableau de bord
      </p>
      <h1 className="text-4xl font-light mb-10">Rendez-vous</h1>

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
            {caPrevisionnel} DA
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 mb-6">
          {error.message}
        </div>
      )}

      <FiltresPlanning rdvs={liste} categories={categories ?? []} />
    </section>
  );
}