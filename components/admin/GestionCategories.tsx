"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type Categorie = {
  id: string;
  nom: string;
  parent_id: string | null;
  ordre_affichage: number;
};

type Props = {
  categories: Categorie[];
  nbPrestationsParCategorie: Record<string, number>;
  nbTravailleusesParCategorie: Record<string, number>;
};

type FormState = {
  id?: string;
  nom: string;
  parent_id: string | null;
  ordre_affichage: number;
};

const EMPTY_FORM: FormState = {
  nom: "",
  parent_id: null,
  ordre_affichage: 0,
};

export function GestionCategories({
  categories,
  nbPrestationsParCategorie,
  nbTravailleusesParCategorie,
}: Props) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // Message d'erreur en haut de page
  const [messageErreur, setMessageErreur] = useState<string | null>(null);

  function ouvrirCreationPrincipale() {
    setForm({ ...EMPTY_FORM, parent_id: null });
    setErreur(null);
    setModalOpen(true);
  }

  function ouvrirCreationSous(parentId: string) {
    setForm({ ...EMPTY_FORM, parent_id: parentId });
    setErreur(null);
    setModalOpen(true);
  }

  function ouvrirEdition(c: Categorie) {
    setForm({
      id: c.id,
      nom: c.nom,
      parent_id: c.parent_id,
      ordre_affichage: c.ordre_affichage,
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
      const res = await fetch("/api/admin/categories", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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

  async function supprimer(id: string, nom: string) {
    setMessageErreur(null);

    if (
      !confirm(
        `Supprimer "${nom}" ?\n\nCette action est irréversible.`
      )
    )
      return;

    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (res.status === 409) {
        setMessageErreur(json.error);
        // Auto-effacer après 8 secondes
        setTimeout(() => setMessageErreur(null), 8000);
        return;
      }

      if (!res.ok) throw new Error(json.error);
      router.refresh();
    } catch (e) {
      setMessageErreur(e instanceof Error ? e.message : "Erreur");
      setTimeout(() => setMessageErreur(null), 8000);
    }
  }

  const principales = categories
    .filter((c) => !c.parent_id)
    .sort((a, b) => a.ordre_affichage - b.ordre_affichage);

  function getEnfants(parentId: string) {
    return categories
      .filter((c) => c.parent_id === parentId)
      .sort((a, b) => a.ordre_affichage - b.ordre_affichage);
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {categories.length} catégorie{categories.length > 1 ? "s" : ""} au
          total
        </p>
        <button
          onClick={ouvrirCreationPrincipale}
          className="px-4 py-2 rounded-full text-white text-sm"
          style={{ background: "var(--accent)" }}
        >
          + Nouvelle catégorie principale
        </button>
      </div>

      {/* Message d'erreur en haut */}
      {messageErreur && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start justify-between gap-3">
          <span>⚠️ {messageErreur}</span>
          <button
            onClick={() => setMessageErreur(null)}
            className="text-red-500 hover:text-red-700 flex-shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      <div className="space-y-4">
        {principales.map((cat) => (
          <CategorieBloc
            key={cat.id}
            categorie={cat}
            sousCategories={getEnfants(cat.id)}
            nbPrestationsParCategorie={nbPrestationsParCategorie}
            nbTravailleusesParCategorie={nbTravailleusesParCategorie}
            getEnfants={getEnfants}
            onEdit={ouvrirEdition}
            onDelete={supprimer}
            onAddSous={ouvrirCreationSous}
            niveau={0}
          />
        ))}
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => !loading && setModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-light mb-6">
              {form.id
                ? "Modifier"
                : form.parent_id
                  ? "Nouvelle sous-catégorie"
                  : "Nouvelle catégorie principale"}
            </h2>

            <form onSubmit={sauvegarder} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Nom *</label>
                <input
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  required
                  placeholder="Ex : onglerie, Main, Pied…"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-neutral-400"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">
                  Ordre d&apos;affichage
                </label>
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

function CategorieBloc({
  categorie,
  sousCategories,
  nbPrestationsParCategorie,
  nbTravailleusesParCategorie,
  getEnfants,
  onEdit,
  onDelete,
  onAddSous,
  niveau,
}: {
  categorie: Categorie;
  sousCategories: Categorie[];
  nbPrestationsParCategorie: Record<string, number>;
  nbTravailleusesParCategorie: Record<string, number>;
  getEnfants: (parentId: string) => Categorie[];
  onEdit: (c: Categorie) => void;
  onDelete: (id: string, nom: string) => void;
  onAddSous: (parentId: string) => void;
  niveau: number;
}) {
  const [open, setOpen] = useState(true);
  const nbPrestations = nbPrestationsParCategorie[categorie.id] ?? 0;
  const nbTravailleuses = nbTravailleusesParCategorie[categorie.id] ?? 0;

  return (
    <div
      className="rounded-2xl border border-neutral-200 bg-white"
      style={{ marginLeft: niveau * 20 }}
    >
      <div className="p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {sousCategories.length > 0 ? (
            <button
              onClick={() => setOpen(!open)}
              className="text-lg w-6 text-center"
              style={{ color: "var(--muted)" }}
            >
              {open ? "▾" : "▸"}
            </button>
          ) : (
            <span className="w-6" />
          )}
          <div className="flex-1 min-w-0">
            <p
              className="text-base font-medium"
              style={{ opacity: niveau === 0 ? 1 : 0.75 }}
            >
              {categorie.nom}
            </p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {nbPrestations} prestation{nbPrestations > 1 ? "s" : ""}
              {niveau === 0 && nbTravailleuses > 0 && (
                <>
                  {" "}
                  · {nbTravailleuses} travailleuse
                  {nbTravailleuses > 1 ? "s" : ""}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          {niveau === 0 && (
            <button
              onClick={() => onAddSous(categorie.id)}
              className="text-xs px-3 py-1 rounded-full border border-neutral-200 hover:border-neutral-400"
            >
              + Sous-catégorie
            </button>
          )}
          <button
            onClick={() => onEdit(categorie)}
            className="text-xs px-3 py-1 rounded-full border border-neutral-200 hover:border-neutral-400"
          >
            Modifier
          </button>
          <button
            onClick={() => onDelete(categorie.id, categorie.nom)}
            className="text-xs px-3 py-1 rounded-full"
            style={{ background: "#fee2e2", color: "#b91c1c" }}
          >
            Suppr.
          </button>
        </div>
      </div>

      {open && sousCategories.length > 0 && (
        <div className="px-4 pb-3 space-y-2">
          {sousCategories.map((sub) => (
            <CategorieBloc
              key={sub.id}
              categorie={sub}
              sousCategories={getEnfants(sub.id)}
              nbPrestationsParCategorie={nbPrestationsParCategorie}
              nbTravailleusesParCategorie={nbTravailleusesParCategorie}
              getEnfants={getEnfants}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddSous={onAddSous}
              niveau={niveau + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}