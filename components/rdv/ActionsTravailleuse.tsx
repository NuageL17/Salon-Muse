"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  rdvId: string;
  statut: string;
};

export function ActionsTravailleuse({ rdvId, statut }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [annulationOpen, setAnnulationOpen] = useState(false);
  const [raison, setRaison] = useState("");

  async function handleAction(
    action: "confirmer" | "terminer" | "annuler",
    raisonTexte?: string
  ) {
    setLoading(action);
    setError(null);

    try {
      const res = await fetch("/api/travailleuses/update-rdv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rdv_id: rdvId,
          action,
          raison_annulation: raisonTexte ?? null,
        }),
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

  function confirmerAction() {
    if (!confirm("Confirmer ce rendez-vous ?")) return;
    handleAction("confirmer");
  }

  function terminerAction() {
    if (!confirm("Marquer ce RDV comme terminé ?")) return;
    handleAction("terminer");
  }

  function validerAnnulation() {
    if (!raison.trim()) {
      setError("Merci d'indiquer la raison de l'annulation.");
      return;
    }
    handleAction("annuler", raison.trim());
    setAnnulationOpen(false);
    setRaison("");
  }

  const peutConfirmer = statut === "en_attente";
  const peutTerminer = statut === "en_attente" || statut === "confirme";
  const peutAnnuler = statut === "en_attente" || statut === "confirme";

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2 text-xs flex-wrap">
        {peutConfirmer && (
          <button
            onClick={confirmerAction}
            disabled={loading !== null}
            className="px-3 py-1 rounded-full text-white disabled:opacity-50"
            style={{ background: "#2e7d32" }}
          >
            {loading === "confirmer" ? "…" : "Confirmer"}
          </button>
        )}

        {peutTerminer && (
          <button
            onClick={terminerAction}
            disabled={loading !== null}
            className="px-3 py-1 rounded-full disabled:opacity-50"
            style={{ background: "#e3f2fd", color: "#1565c0" }}
          >
            {loading === "terminer" ? "…" : "Terminer"}
          </button>
        )}

        {peutAnnuler && (
          <button
            onClick={() => setAnnulationOpen(true)}
            disabled={loading !== null}
            className="px-3 py-1 rounded-full disabled:opacity-50"
            style={{ background: "#fee2e2", color: "#b91c1c" }}
          >
            {loading === "annuler" ? "…" : "Annuler"}
          </button>
        )}
      </div>

      {/* Modal d'annulation avec raison */}
      {annulationOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => !loading && setAnnulationOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-light mb-2">
              Annuler ce rendez-vous
            </h3>
            <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
              Indiquez la raison (visible par la gérante et la cliente).
            </p>

            <textarea
              value={raison}
              onChange={(e) => setRaison(e.target.value)}
              rows={3}
              autoFocus
              placeholder="Ex : Indisponible, matériel manquant, imprévu…"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:border-neutral-400 resize-none mb-4"
            />

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setAnnulationOpen(false);
                  setRaison("");
                  setError(null);
                }}
                disabled={loading !== null}
                className="flex-1 py-3 rounded-full border border-neutral-200 text-sm hover:bg-neutral-50 disabled:opacity-50"
              >
                Retour
              </button>
              <button
                onClick={validerAnnulation}
                disabled={loading !== null}
                className="flex-1 py-3 rounded-full text-white text-sm disabled:opacity-50"
                style={{ background: "#b91c1c" }}
              >
                {loading === "annuler" ? "Annulation…" : "Confirmer l'annulation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}