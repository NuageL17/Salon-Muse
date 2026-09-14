"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Horaire = {
  id: number;
  jour_semaine: number;
  ouverture: string | null;
  fermeture: string | null;
  ferme: boolean;
};

type Fermeture = {
  id: string;
  date_debut: string;
  date_fin: string;
  motif: string | null;
};

type Props = {
  horaires: Horaire[];
  fermetures: Fermeture[];
};

const JOURS = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

// Ordre d'affichage : lundi → dimanche
const ORDRE_AFFICHAGE = [1, 2, 3, 4, 5, 6, 0];

export function GestionHoraires({ horaires, fermetures }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // État initial : on remplit les 7 jours (au cas où certains manquent)
  const initial: Horaire[] = ORDRE_AFFICHAGE.map((jour) => {
    const existing = horaires.find((h) => h.jour_semaine === jour);
    return (
      existing ?? {
        id: 0,
        jour_semaine: jour,
        ouverture: "09:00",
        fermeture: "19:00",
        ferme: true,
      }
    );
  });

  const [jours, setJours] = useState<Horaire[]>(initial);

  // Formulaire fermeture
  const [fermetureForm, setFermetureForm] = useState({
    date_debut: "",
    date_fin: "",
    motif: "",
  });

  function updateJour(jour_semaine: number, updates: Partial<Horaire>) {
    setJours((prev) =>
      prev.map((j) =>
        j.jour_semaine === jour_semaine ? { ...j, ...updates } : j
      )
    );
  }

  async function sauvegarder() {
    setLoading(true);
    setErreur(null);
    setOk(null);

    try {
      const payload = jours.map((j) => ({
        jour_semaine: j.jour_semaine,
        ouverture: j.ferme ? null : j.ouverture,
        fermeture: j.ferme ? null : j.fermeture,
        ferme: j.ferme,
      }));

      const res = await fetch("/api/admin/horaires", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ horaires: payload }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setOk("Horaires enregistrés");
      router.refresh();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function ajouterFermeture(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErreur(null);
    setOk(null);

    try {
      // Convertir en timestamptz
      const date_debut = new Date(
        `${fermetureForm.date_debut}T00:00:00`
      ).toISOString();
      const date_fin = new Date(
        `${fermetureForm.date_fin}T23:59:59`
      ).toISOString();

      const res = await fetch("/api/admin/fermetures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date_debut,
          date_fin,
          motif: fermetureForm.motif,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setFermetureForm({ date_debut: "", date_fin: "", motif: "" });
      setOk("Fermeture ajoutée");
      router.refresh();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function supprimerFermeture(id: string) {
    if (!confirm("Supprimer cette fermeture ?")) return;

    try {
      const res = await fetch(`/api/admin/fermetures?id=${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    }
  }

  function formatDateFR(iso: string): string {
    return new Date(iso).toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-10">
      {/* Horaires hebdomadaires */}
      <div>
        <h2 className="text-2xl font-light mb-4">
          Horaires d&apos;ouverture
        </h2>
        <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
          Cochez les jours d&apos;ouverture et définissez les plages horaires.
        </p>

        <div className="space-y-3">
          {jours.map((j) => (
            <div
              key={j.jour_semaine}
              className="p-4 rounded-2xl border border-neutral-200 bg-white flex items-center gap-4 flex-wrap"
            >
              <label className="flex items-center gap-3 cursor-pointer w-40">
                <input
                  type="checkbox"
                  checked={!j.ferme}
                  onChange={(e) =>
                    updateJour(j.jour_semaine, { ferme: !e.target.checked })
                  }
                  className="w-5 h-5"
                />
                <span className="font-medium">
                  {JOURS[j.jour_semaine]}
                </span>
              </label>

              {j.ferme ? (
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  Fermé
                </p>
              ) : (
                <div className="flex items-center gap-3">
                  <input
                    type="time"
                    value={j.ouverture ?? "09:00"}
                    onChange={(e) =>
                      updateJour(j.jour_semaine, {
                        ouverture: e.target.value,
                      })
                    }
                    className="px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:border-neutral-400"
                  />
                  <span style={{ color: "var(--muted)" }}>à</span>
                  <input
                    type="time"
                    value={j.fermeture ?? "19:00"}
                    onChange={(e) =>
                      updateJour(j.jour_semaine, {
                        fermeture: e.target.value,
                      })
                    }
                    className="px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:border-neutral-400"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={sauvegarder}
            disabled={loading}
            className="px-6 py-3 rounded-full text-white text-sm disabled:opacity-50"
            style={{ background: "var(--accent)" }}
          >
            {loading ? "Enregistrement…" : "Enregistrer les horaires"}
          </button>
          {ok && (
            <span className="text-sm" style={{ color: "#2e7d32" }}>
              ✅ {ok}
            </span>
          )}
          {erreur && (
            <span className="text-sm" style={{ color: "#b91c1c" }}>
              ❌ {erreur}
            </span>
          )}
        </div>
      </div>

      {/* Fermetures exceptionnelles */}
      <div className="pt-8 border-t border-neutral-200">
        <h2 className="text-2xl font-light mb-4">
          Congés &amp; fermetures exceptionnelles
        </h2>
        <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
          Ajoutez ici les jours où le salon est fermé (congés, jours fériés,
          formations…). Ces périodes ne proposeront aucun créneau aux clientes.
        </p>

        {/* Formulaire d'ajout */}
        <form
          onSubmit={ajouterFermeture}
          className="p-5 rounded-2xl border border-neutral-200 bg-white mb-6 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-1">Du</label>
              <input
                type="date"
                required
                value={fermetureForm.date_debut}
                onChange={(e) =>
                  setFermetureForm({
                    ...fermetureForm,
                    date_debut: e.target.value,
                  })
                }
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-neutral-400"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Au</label>
              <input
                type="date"
                required
                value={fermetureForm.date_fin}
                onChange={(e) =>
                  setFermetureForm({
                    ...fermetureForm,
                    date_fin: e.target.value,
                  })
                }
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-neutral-400"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Motif (optionnel)</label>
              <input
                type="text"
                placeholder="Congés, formation…"
                value={fermetureForm.motif}
                onChange={(e) =>
                  setFermetureForm({
                    ...fermetureForm,
                    motif: e.target.value,
                  })
                }
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-neutral-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-full text-white text-sm disabled:opacity-50"
            style={{ background: "var(--accent)" }}
          >
            {loading ? "…" : "Ajouter cette fermeture"}
          </button>
        </form>

        {/* Liste des fermetures */}
        {fermetures.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-neutral-300 text-center">
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Aucune fermeture prévue.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {fermetures.map((f) => (
              <div
                key={f.id}
                className="p-4 rounded-2xl border border-neutral-200 bg-white flex items-center justify-between gap-4"
              >
                <div>
                  <p className="text-sm font-medium">
                    {formatDateFR(f.date_debut)}
                    {f.date_debut.slice(0, 10) !== f.date_fin.slice(0, 10) &&
                      ` → ${formatDateFR(f.date_fin)}`}
                  </p>
                  {f.motif && (
                    <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                      {f.motif}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => supprimerFermeture(f.id)}
                  className="text-xs px-3 py-1 rounded-full"
                  style={{ background: "#fee2e2", color: "#b91c1c" }}
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}