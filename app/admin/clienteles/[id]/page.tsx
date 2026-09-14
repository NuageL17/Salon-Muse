import Link from "next/link";
import { notFound } from "next/navigation";
import { requireGerante } from "@/lib/auth";

type Params = {
  params: Promise<{ id: string }>;
};

function formatDateHeure(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
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
      return { label: "Annulé salon", bg: "#fee2e2", color: "#b91c1c" };
    case "annule_cliente":
      return { label: "Annulé cliente", bg: "#fee2e2", color: "#b91c1c" };
    case "no_show":
      return { label: "No-show", bg: "#fce4ec", color: "#880e4f" };
    case "en_attente":
    default:
      return { label: "En attente", bg: "#fff8e1", color: "#a07900" };
  }
}

export default async function ClienteDetailPage({ params }: Params) {
  const { id } = await params;
  const { supabase } = await requireGerante();

  // Profil
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!profile) {
    notFound();
  }

  // Historique RDV
  const { data: rdvs } = await supabase
    .from("rendez_vous")
    .select(
      "id, debut, statut, prix_applique, notes, prestations (nom, categorie, duree_min)"
    )
    .eq("cliente_id", id)
    .order("debut", { ascending: false });

  // Parrainage : qui l'a parrainée + ses filleuls
  const { data: parrainage } = await supabase
    .from("parrainages")
    .select(
      "id, code_utilise, statut, parrain_id, recompense_parrain, created_at"
    )
    .eq("filleul_id", id)
    .maybeSingle();

  let parrainProfil: { prenom: string | null; nom: string | null } | null = null;
  if (parrainage?.parrain_id) {
    const { data } = await supabase
      .from("profiles")
      .select("prenom, nom")
      .eq("id", parrainage.parrain_id)
      .single();
    parrainProfil = data;
  }

  // Ses filleuls
  const { data: filleulsData } = await supabase
    .from("parrainages")
    .select("id, statut, created_at, recompense_parrain, filleul_id")
    .eq("parrain_id", id);

  const filleulIds = (filleulsData ?? []).map((f) => f.filleul_id);
  const { data: profilsFilleuls } = filleulIds.length
    ? await supabase
        .from("profiles")
        .select("id, prenom, nom")
        .in("id", filleulIds)
    : { data: [] as { id: string; prenom: string | null; nom: string | null }[] };

  // Historique fidélité
  const { data: transactions } = await supabase
    .from("transactions_fidelite")
    .select("id, points, motif, created_at")
    .eq("cliente_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  const listeRdv = rdvs ?? [];
  const rdvTermines = listeRdv.filter((r) => r.statut === "termine");
  const totalDepense = rdvTermines.reduce(
    (sum, r) => sum + (r.prix_applique ?? 0),
    0
  );

  return (
    <section className="p-6 md:p-10 max-w-5xl mx-auto">
      <Link
        href="/admin/clienteles"
        className="text-sm mb-6 inline-block hover:opacity-60"
        style={{ color: "var(--muted)" }}
      >
        ← Retour aux clientèles
      </Link>

      {/* En-tête cliente */}
      <div className="p-6 rounded-2xl border border-neutral-200 bg-white mb-6">
        <div className="flex items-start gap-5 flex-wrap">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-medium flex-shrink-0"
            style={{ background: "var(--accent)" }}
          >
            {(profile.prenom?.[0] ?? "?").toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-light mb-2">
              {profile.prenom ?? "—"} {profile.nom ?? ""}
            </h1>
            <div className="space-y-1 text-sm">
              <p>
                <span style={{ color: "var(--muted)" }}>Téléphone : </span>
                {profile.telephone ?? "—"}
              </p>
              <p>
                <span style={{ color: "var(--muted)" }}>Inscrite le : </span>
                {new Date(profile.created_at).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <p>
                <span style={{ color: "var(--muted)" }}>
                  Code de parrainage :{" "}
                </span>
                <span className="font-mono">{profile.code_parrainage}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <div className="p-5 rounded-2xl border border-neutral-200 bg-white">
          <p
            className="text-xs uppercase tracking-wide mb-1"
            style={{ color: "var(--muted)" }}
          >
            Points fidélité
          </p>
          <p
            className="text-3xl font-light"
            style={{ color: "var(--accent-dark)" }}
          >
            {profile.points_fidelite ?? 0}
          </p>
        </div>
        <div className="p-5 rounded-2xl border border-neutral-200 bg-white">
          <p
            className="text-xs uppercase tracking-wide mb-1"
            style={{ color: "var(--muted)" }}
          >
            RDV terminés
          </p>
          <p className="text-3xl font-light">{rdvTermines.length}</p>
        </div>
        <div className="p-5 rounded-2xl border border-neutral-200 bg-white">
          <p
            className="text-xs uppercase tracking-wide mb-1"
            style={{ color: "var(--muted)" }}
          >
            Total dépensé
          </p>
          <p
            className="text-3xl font-light"
            style={{ color: "var(--accent-dark)" }}
          >
            {totalDepense} €
          </p>
        </div>
      </div>

      {/* Parrainage */}
      {(parrainProfil || (filleulsData && filleulsData.length > 0)) && (
        <div className="p-6 rounded-2xl border border-neutral-200 bg-white mb-6">
          <h2 className="text-lg font-medium mb-4">Parrainage</h2>

          {parrainProfil && (
            <div className="mb-4">
              <p
                className="text-xs uppercase tracking-wide mb-1"
                style={{ color: "var(--muted)" }}
              >
                Parrainée par
              </p>
              <p className="text-sm">
                {parrainProfil.prenom} {parrainProfil.nom}
                {parrainage && (
                  <span
                    className="ml-2 text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background:
                        parrainage.statut === "valide"
                          ? "#e8f5e9"
                          : "#fff8e1",
                      color:
                        parrainage.statut === "valide"
                          ? "#2e7d32"
                          : "#a07900",
                    }}
                  >
                    {parrainage.statut === "valide" ? "Validé" : "En attente"}
                  </span>
                )}
              </p>
            </div>
          )}

          {filleulsData && filleulsData.length > 0 && (
            <div>
              <p
                className="text-xs uppercase tracking-wide mb-2"
                style={{ color: "var(--muted)" }}
              >
                A parrainé {filleulsData.length} personne
                {filleulsData.length > 1 ? "s" : ""}
              </p>
              <div className="space-y-2">
                {filleulsData.map((f) => {
                  const p = profilsFilleuls?.find((x) => x.id === f.filleul_id);
                  return (
                    <div
                      key={f.id}
                      className="flex items-center justify-between text-sm p-2 rounded-lg bg-neutral-50"
                    >
                      <span>
                        {p?.prenom ?? "?"} {p?.nom ?? ""}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background:
                            f.statut === "valide" ? "#e8f5e9" : "#fff8e1",
                          color:
                            f.statut === "valide" ? "#2e7d32" : "#a07900",
                        }}
                      >
                        {f.statut === "valide" ? "Validé" : "En attente"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Historique RDV */}
      <h2 className="text-xl font-light mb-4">Historique des RDV</h2>
      {listeRdv.length === 0 ? (
        <div className="p-8 rounded-2xl border border-dashed border-neutral-300 text-center mb-8">
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Aucun rendez-vous pour cette cliente.
          </p>
        </div>
      ) : (
        <div className="space-y-2 mb-8">
          {listeRdv.map((r) => {
            const badge = badgeStatut(r.statut);
            const p = r.prestations as unknown as {
              nom: string;
              categorie: string | null;
              duree_min: number;
            } | null;
            return (
              <div
                key={r.id}
                className="p-4 rounded-xl border border-neutral-200 bg-white flex items-center justify-between gap-4"
              >
                <div>
                  <p className="text-sm font-medium">{p?.nom ?? "—"}</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    {formatDateHeure(r.debut)}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className="inline-block text-xs px-2 py-1 rounded-full mb-1"
                    style={{ background: badge.bg, color: badge.color }}
                  >
                    {badge.label}
                  </span>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--accent-dark)" }}
                  >
                    {r.prix_applique} €
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Historique fidélité */}
      {transactions && transactions.length > 0 && (
        <>
          <h2 className="text-xl font-light mb-4">
            Historique de points
          </h2>
          <div className="space-y-2">
            {transactions.map((t) => (
              <div
                key={t.id}
                className="p-3 rounded-xl border border-neutral-200 bg-white flex items-center justify-between"
              >
                <div>
                  <p className="text-sm">{t.motif}</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    {new Date(t.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <p
                  className="text-sm font-medium"
                  style={{
                    color: t.points >= 0 ? "#2e7d32" : "#b91c1c",
                  }}
                >
                  {t.points >= 0 ? "+" : ""}
                  {t.points} pts
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}