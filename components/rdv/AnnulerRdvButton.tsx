"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  rdvId: string;
};

export function AnnulerRdvButton({ rdvId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnnuler() {
    if (
      !confirm(
        "Annuler ce rendez-vous ? Cette action est définitive."
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/rdv/${rdvId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setLoading(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        onClick={handleAnnuler}
        disabled={loading}
        className="text-xs hover:opacity-60 disabled:opacity-50"
        style={{ color: "#b91c1c" }}
      >
        {loading ? "Annulation…" : "Annuler ce rendez-vous"}
      </button>
      {error && (
        <p className="text-xs mt-1" style={{ color: "#b91c1c" }}>
          {error}
        </p>
      )}
    </div>
  );
}