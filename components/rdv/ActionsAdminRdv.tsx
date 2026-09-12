"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  rdvId: string;
  statut: string;
};

export function ActionsAdminRdv({ rdvId, statut }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAction(action: "confirmer" | "annuler" | "terminer") {
    const message =
      action === "confirmer"
        ? "Confirmer ce rendez-vous ?"
        : action === "terminer"
          ? "Marquer ce RDV comme terminé ? Le parrainage sera validé si applicable."
          : "Annuler ce rendez-vous ? La cliente devra être prévenue.";

    if (!confirm(message)) return;

    setLoading(action);
    setError(null);

    try {
      const res = await fetch("/api/admin/update-rdv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rdv_id: rdvId, action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(null);
    }
  }

  const peutConfirmer = statut === "en_attente";
  const peutTerminer = statut === "en_attente" || statut === "confirme";
  const peutAnnuler = statut === "en_attente" || statut === "confirme";

  return (
    <div className="mt-3 flex items-center gap-2 text-xs flex-wrap">
      {peutConfirmer && (
        <button
          onClick={() => handleAction("confirmer")}
          disabled={loading !== null}
          className="px-3 py-1 rounded-full text-white disabled:opacity-50"
          style={{ background: "#2e7d32" }}
        >
          {loading === "confirmer" ? "…" : "Confirmer"}
        </button>
      )}

      {peutTerminer && (
        <button
          onClick={() => handleAction("terminer")}
          disabled={loading !== null}
          className="px-3 py-1 rounded-full disabled:opacity-50"
          style={{ background: "#e3f2fd", color: "#1565c0" }}
        >
          {loading === "terminer" ? "…" : "Terminer"}
        </button>
      )}

      {peutAnnuler && (
        <button
          onClick={() => handleAction("annuler")}
          disabled={loading !== null}
          className="px-3 py-1 rounded-full disabled:opacity-50"
          style={{ background: "#fee2e2", color: "#b91c1c" }}
        >
          {loading === "annuler" ? "…" : "Annuler"}
        </button>
      )}

      {error && (
        <span className="text-xs" style={{ color: "#b91c1c" }}>
          {error}
        </span>
      )}
    </div>
  );
}