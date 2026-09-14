"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Prestation } from "@/lib/types/database";

type Props = {
  prestations: Prestation[];
};

type FormState = {
  id?: string;
  nom: string;
  description: string;
  categorie: string;
  duree_min: number;
  buffer_min: number;
  prix: number;
  ordre_affichage: number;
  actif: boolean;
};

const EMPTY_FORM: FormState = {
  nom: "",
  description: "",
  categorie: "",
  duree_min: 60,
  buffer_min: 10,
  prix: 0,
  ordre_affichage: 0,
  actif: true,
};

export function ListePrestations({ prestations }: Props) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // Édition inline du prix
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>("");

  function ouvrirCreation() {
    setForm(EMPTY_FORM);
    setErreur(null);
    setModalOpen(true);
  }

  function ouvrirEdition(p: Prestation) {
    setForm({
      id: p.id,
      nom: p.nom,
      description: p.description ?? "",
      categorie: p.categorie ?? "",
      duree_min: p.duree_min,
      buffer_min: p.buffer_min,
      prix: Number(p.prix),
      ordre_affichage: p.ordre_affichage,
      actif: p.actif,
    });
    setErreur(null);
    setModalOpen(true);
  }

  async function sauvegarder(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErreur(null);

    try {
      const method = form.id ? "PATCH" : "POST";
      const body = form.id ? { id: form.id, ...form } : form;

      const res = await fetch("/api/admin/prestations", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setModalOpen(false);
      router.refresh();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  // Ouvrir l'édition inline du prix
  function commencerEditionPrix(p: Prestation) {
    setEditingPriceId(p.id);
    setTempPrice(String(p.prix));
  }

  // Sauvegarder le prix
  async function sauvegarderPrix(id: string) {
    const prixNum = Number(tempPrice);
    if (isNaN(prixNum) || prixNum < 0) {
      setEditingPriceId(null);
      return;
    }

    try {
      const res = await fetch("/api/admin/prestations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, prix: prixNum }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setEditingPriceId(null);
    }
  }

  async function basculerActif(id: string, actif: boolean) {
    try {
      const res = await fetch("/api/admin/prestations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, actif }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    }
  }

  async function supprimer(id: string) {
    if (
      !confirm(
        "Supprimer définitivement cette prestation ? Cette action est irréversible."
      )
    )
      return;

    try {
      const res = await fetch(`/api/admin/prestations?id=${id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (res.status === 409 && json.code === "HAS_RDV") {
        const ok = confirm(
          `${json.nb_rdv} rendez-vous existent pour cette prestation.\n\n` +
            `Vous ne pouvez pas la supprimer pour préserver l'historique.\n\n` +
            `Voulez-vous la DÉSACTIVER à la place ? Elle ne sera plus proposée aux clientes, mais restera dans votre historique.`
        );

        if (ok) {
          await basculerActif(id, false);
        }
        return;
      }

      if (!res.ok) throw new Error(json.error);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {prestations.length} prestation{prestations.length > 1 ? "s" : ""} ·{" "}
          <span style={{ color: "var(--accent-dark)" }}>
            💡 Cliquez sur un prix pour le modifier rapidement
          </span>
        </p>
        <button
          onClick={ouvrirCreation}
          className="px-4 py-2 rounded-full text-white text-sm"
          style={{ background: "var(--accent)" }}
        >
          + Ajouter une prestation
        </button>
      </div>

      {prestations.length === 0 ? (
        <div className="p-12 rounded-2xl border border-dashed border-neutral-300 text-center">
          <p className="text-base mb-1">Aucune prestation</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Commencez par ajouter votre premier soin.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {prestations.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-2xl border border-neutral-200 bg-white flex items-start justify-between gap-4"
              style={{ opacity: p.actif ? 1 : 0.6 }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p
                    className="text-xs uppercase tracking-wide"
                    style={{ color: "var(--muted)" }}
                  >
                    {p.categorie ?? "Sans catégorie"}
                  </p>
                  {!p.actif && (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: "#fee2e2", color: "#b91c1c" }}
                    >
                      Inactif
                    </span>
                  )}
                </div>
                <h3 className="text-lg mb-1">{p.nom}</h3>
                <p className="text-sm mb-2" style={{ color: "var(--muted)" }}>
                  {p.description ?? "—"}
                </p>
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  {p.duree_min} min · ordre {p.ordre_affichage}
                </p>
              </div>

              <div className="flex-shrink-0 text-right">
                {/* Prix inline éditable */}
                {editingPriceId === p.id ? (
                  <div className="flex items-center gap-1 mb-3 justify-end">
                    <input
                      type="number"
                      value={tempPrice}
                      onChange={(e) => setTempPrice(e.target.value)}
                      autoFocus
                      min={0}
                      className="w-24 px-2 py-1 rounded-lg border border-neutral-300 text-right text-sm focus:outline-none focus:border-neutral-500"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          sauvegarderPrix(p.id);
                        } else if (e.key === "Escape") {
                          setEditingPriceId(null);
                        }
                      }}
                    />
                    <span className="text-sm" style={{ color: "var(--muted)" }}>
                      DA
                    </span>
                    <button
                      onClick={() => sauvegarderPrix(p.id)}
                      className="ml-1 text-xs px-2 py-1 rounded-lg text-white"
                      style={{ background: "var(--accent)" }}
                    >
                      ✓
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => commencerEditionPrix(p)}
                    className="text-lg font-medium mb-3 hover:opacity-70 transition cursor-pointer"
                    style={{ color: "var(--accent-dark)" }}
                    title="Cliquer pour modifier le prix"
                  >
                    {p.prix} DA
                  </button>
                )}

                <div className="flex gap-2 justify-end flex-wrap">
                  <button
                    onClick={() => ouvrirEdition(p)}
                    className="text-xs px-3 py-1 rounded-full border border-neutral-200 hover:border-neutral-400"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => basculerActif(p.id, !p.actif)}
                    className="text-xs px-3 py-1 rounded-full border border-neutral-200 hover:border-neutral-400"
                  >
                    {p.actif ? "Désactiver" : "Réactiver"}
                  </button>
                  <button
                    onClick={() => supprimer(p.id)}
                    className="text-xs px-3 py-1 rounded-full"
                    style={{ background: "#fee2e2", color: "#b91c1c" }}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal (création/modification complète) */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 overflow-y-auto"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => !loading && setModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-light mb-6">
              {form.id ? "Modifier la prestation" : "Nouvelle prestation"}
            </h2>

            <form onSubmit={sauvegarder} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Nom *</label>
                <input
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-neutral-400"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-neutral-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Catégorie</label>
                <input
                  value={form.categorie}
                  onChange={(e) =>
                    setForm({ ...form, categorie: e.target.value })
                  }
                  placeholder="visage, epilation, ongles, massage…"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-neutral-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Durée (min) *</label>
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={form.duree_min}
                    onChange={(e) =>
                      setForm({ ...form, duree_min: Number(e.target.value) })
                    }
                    required
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-neutral-400"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Buffer (min)</label>
                  <input
                    type="number"
                    min={0}
                    step={5}
                    value={form.buffer_min}
                    onChange={(e) =>
                      setForm({ ...form, buffer_min: Number(e.target.value) })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-neutral-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Prix (DA) *</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={form.prix}
                    onChange={(e) =>
                      setForm({ ...form, prix: Number(e.target.value) })
                    }
                    required
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-neutral-400"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Ordre</label>
                  <input
                    type="number"
                    min={0}
                    value={form.ordre_affichage}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        ordre_affichage: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-neutral-400"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.actif}
                  onChange={(e) =>
                    setForm({ ...form, actif: e.target.checked })
                  }
                  className="w-5 h-5"
                />
                <span className="text-sm">Visible sur le site (actif)</span>
              </label>

              {erreur && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                  {erreur}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={loading}
                  className="flex-1 py-3 rounded-full border border-neutral-200 text-sm hover:bg-neutral-50 disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-full text-white text-sm disabled:opacity-50"
                  style={{ background: "var(--accent)" }}
                >
                  {loading ? "Enregistrement…" : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}