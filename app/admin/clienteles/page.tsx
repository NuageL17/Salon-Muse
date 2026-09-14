import Link from "next/link";
import { requireGerante } from "@/lib/auth";

type Cliente = {
  id: string;
  prenom: string | null;
  nom: string | null;
  telephone: string | null;
  code_parrainage: string | null;
  points_fidelite: number | null;
  created_at: string;
};

export default async function ClientelesAdminPage() {
  const { supabase } = await requireGerante();

  // Récupérer toutes les clientes (hors gérantes)
  const { data: clientes, error } = await supabase
    .from("profiles")
    .select("id, prenom, nom, telephone, code_parrainage, points_fidelite, created_at")
    .eq("role", "cliente")
    .order("created_at", { ascending: false });

  // Compter les RDV de chaque cliente
  const clientesIds = (clientes ?? []).map((c) => c.id);
  const { data: rdvs } = clientesIds.length
    ? await supabase
        .from("rendez_vous")
        .select("cliente_id, statut")
        .in("cliente_id", clientesIds)
    : { data: [] as { cliente_id: string; statut: string }[] };

  const statsParCliente = new Map<
    string,
    { total: number; termines: number }
  >();
  (rdvs ?? []).forEach((r) => {
    const stats = statsParCliente.get(r.cliente_id) ?? {
      total: 0,
      termines: 0,
    };
    stats.total++;
    if (r.statut === "termine") stats.termines++;
    statsParCliente.set(r.cliente_id, stats);
  });

  const liste = (clientes ?? []) as Cliente[];

  return (
    <section className="p-6 md:p-10 max-w-5xl mx-auto">
      <p
        className="text-sm tracking-[0.2em] uppercase mb-3"
        style={{ color: "var(--muted)" }}
      >
        Base clientes
      </p>
      <h1 className="text-4xl font-light mb-2">Clientèles</h1>
      <p className="text-sm mb-10" style={{ color: "var(--muted)" }}>
        {liste.length} cliente{liste.length > 1 ? "s" : ""} enregistrée
        {liste.length > 1 ? "s" : ""}
      </p>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 mb-6">
          {error.message}
        </div>
      )}

      {liste.length === 0 ? (
        <div className="p-12 rounded-2xl border border-dashed border-neutral-300 text-center">
          <p className="text-base mb-1">Aucune cliente</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Les clientes s&apos;inscriront via le site.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {liste.map((c) => {
            const stats = statsParCliente.get(c.id) ?? {
              total: 0,
              termines: 0,
            };
            return (
              <Link
                key={c.id}
                href={`/admin/clienteles/${c.id}`}
                className="block p-5 rounded-2xl border border-neutral-200 bg-white hover:border-neutral-400 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white text-base font-medium flex-shrink-0"
                      style={{ background: "var(--accent)" }}
                    >
                      {(c.prenom?.[0] ?? "?").toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg">
                        {c.prenom ?? "—"} {c.nom ?? ""}
                      </h3>
                      <p
                        className="text-sm"
                        style={{ color: "var(--muted)" }}
                      >
                        {c.telephone ?? "Pas de téléphone"}
                      </p>
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <p
                      className="text-lg font-medium mb-1"
                      style={{ color: "var(--accent-dark)" }}
                    >
                      {c.points_fidelite ?? 0} pts
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--muted)" }}
                    >
                      {stats.termines} RDV terminé
                      {stats.termines > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}