"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TEMPLATES = [
  {
    nom: "Promo",
    titre: "Offre spéciale 🌸",
    corps: "-20% sur tous les soins visage cette semaine !",
  },
  {
    nom: "Rappel",
    titre: "Votre RDV approche",
    corps: "N'oubliez pas votre rendez-vous demain au salon.",
  },
  {
    nom: "Nouveau soin",
    titre: "Nouveau au salon ✨",
    corps: "Découvrez notre nouveau soin hydratant aux huiles précieuses.",
  },
  {
    nom: "Réactivation",
    titre: "Vous nous manquez 💆‍♀️",
    corps: "Cela fait un moment ! -15% sur votre prochain soin.",
  },
];

export function FormulaireNotif() {
  const router = useRouter();
  const [titre, setTitre] = useState("");
  const [corps, setCorps] = useState("");
  const [url, setUrl] = useState("/mon-compte");
  const [loading, setLoading] = useState(false);
  const [resultat, setResultat] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResultat(null);
    setErreur(null);

    try {
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titre, corps, url }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setResultat(
        `✅ Notification envoyée à ${json.envoyes} appareil${
          json.envoyes > 1 ? "s" : ""
        }.`
      );
      setTitre("");
      setCorps("");
      router.refresh();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <p
          className="text-xs uppercase tracking-wide mb-2"
          style={{ color: "var(--muted)" }}
        >
          Modèles rapides
        </p>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.nom}
              type="button"
              onClick={() => {
                setTitre(t.titre);
                setCorps(t.corps);
              }}
              className="text-xs px-3 py-1 rounded-full border border-neutral-200 hover:border-neutral-400"
            >
              {t.nom}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm mb-1">Titre</label>
        <input
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          required
          maxLength={50}
          placeholder="Ex : Offre spéciale 🌸"
          className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:border-neutral-400"
        />
      </div>

      <div>
        <label className="block text-sm mb-1">Message</label>
        <textarea
          value={corps}
          onChange={(e) => setCorps(e.target.value)}
          required
          maxLength={200}
          rows={4}
          placeholder="Votre message…"
          className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:border-neutral-400 resize-none"
        />
        <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
          {corps.length}/200 caractères
        </p>
      </div>

      <div>
        <label className="block text-sm mb-1">Lien à ouvrir au clic</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:border-neutral-400 font-mono text-sm"
        />
      </div>

      {erreur && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {erreur}
        </div>
      )}

      {resultat && (
        <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-sm text-green-700">
          {resultat}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 rounded-full text-white text-lg transition hover:opacity-90 disabled:opacity-50"
        style={{ background: "var(--accent)" }}
      >
        {loading ? "Envoi…" : "Envoyer la notification"}
      </button>
    </form>
  );
}