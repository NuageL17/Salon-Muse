"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Travailleuse = {
  id: string;
  prenom: string | null;
  nom: string | null;
  telephone: string | null;
  categorie_id: string | null;
  categorie_nom: string | null;
};

type Categorie = {
  id: string;
  nom: string;
};

type Props = {
  travailleuses: Travailleuse[];
  categories: Categorie[];
};

type FormState = {
  id?: string;
  prenom: string;
  nom: string;
  telephone: string;
  categorie_id: string;
  email: string;
  password: string;
};

const EMPTY_FORM: FormState = {
  prenom: "",
  nom: "",
  telephone: "",
  categorie_id: "",
  email: "",
  password: "",
};

export function ListeTravailleuses({ travailleuses, categories }: Props) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  function ouvrirCreation() {
    setForm({ ...EMPTY_FORM, categorie_id: categories[0]?.id ?? "" });
    setErreur(null);
    setModalOpen(true);
  }

  function ouvrirEdition(t: Travailleuse) {
    setForm({
      id: t.id,
      prenom: t.prenom ?? "",
      nom: t.nom ?? "",
      telephone: t.telephone ?? "",
      categorie_id: t.categorie_id ?? "",
      email: "",
      password: "",
    });
    setErreur(null);
    setModalOpen(true);
  }

  async function sauvegarder(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErreur(null);

    try {
      if (form.id) {
        // Modification
        const res = await fetch("/api/admin/travailleuses", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: form.id,
            prenom: form.prenom,
            nom: form.nom,
            telephone: form.telephone,
            categorie_id: form.categorie_id,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
      } else {
        // Création
        const res = await fetch("/api/admin/travailleuses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
      }

      setModalOpen(false);
      router.refresh();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function supprimer(id: string, prenom: string | null) {
    if (
      !confirm(
        `Supprimer définitivement ${prenom ?? "cette personne"} ? Cette action est irréversible.`
      )
    )
      return;

    try {
      const res = await fetch(`/api/admin/travailleuses?id=${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
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
          {travailleuses.length} membre
          {travailleuses.length > 1 ? "s" : ""} dans l&apos;équipe
        </p>
        <button
          onClick={ouvrirCreation}
          className="px-4 py-2 rounded-full text-white text-sm"
          style={{ background: "var(--accent)" }}
        >
          + Ajouter une travailleuse
        </button>
      </div>

      {travailleuses.length === 0 ? (
        <div className="p-12 rounded-2xl border border-dashed border-neutral-300 text-center">
          <p className="text-base mb-1">Aucune travailleuse</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Commencez par ajouter les membres de votre équipe.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {travailleuses.map((t) => (
            <div
              key={t.id}
              className="p-5 rounded-2xl border border-neutral-200 bg-white flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-base font-medium"
                  style={{ background: "var(--accent)" }}
                >
                  {(t.prenom?.[0] ?? "?").toUpperCase()}
                </div>
                <div>
                  <p className="text-lg">
                    {t.prenom ?? "—"} {t.nom ?? ""}
                  </p>
                  <p className="text-sm" style={{ color: "var(--muted)" }}>
                    {t.categorie_nom ?? "Sans catégorie"} ·{" "}
                    {t.telephone ?? "Pas de tél."}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => ouvrirEdition(t)}
                  className="text-xs px-3 py-1 rounded-full border border-neutral-200 hover:border-neutral-400"
                >
                  Modifier
                </button>
                <button
                  onClick={() => supprimer(t.id, t.prenom)}
                  className="text-xs px-3 py-1 rounded-full"
                  style={{ background: "#fee2e2", color: "#b91c1c" }}
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
              {form.id ? "Modifier la travailleuse" : "Nouvelle travailleuse"}
            </h2>

            <form onSubmit={sauvegarder} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Prénom *</label>
                  <input
                    value={form.prenom}
                    onChange={(e) =>
                      setForm({ ...form, prenom: e.target.value })
                    }
                    required
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-neutral-400"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Nom</label>
                  <input
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-neutral-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={form.telephone}
                  onChange={(e) =>
                    setForm({ ...form, telephone: e.target.value })
                  }
                  placeholder="+213 5XX XX XX XX"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-neutral-400"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Catégorie *</label>
                <select
                  value={form.categorie_id}
                  onChange={(e) =>
                    setForm({ ...form, categorie_id: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-neutral-400 bg-white"
                >
                  <option value="">— Choisir —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nom}
                    </option>
                  ))}
                </select>
              </div>

              {!form.id && (
                <>
                  <div className="pt-4 border-t border-neutral-100">
                    <p className="text-xs uppercase tracking-wide mb-3" style={{ color: "var(--muted)" }}>
                      Identifiants de connexion
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Email *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      required
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-neutral-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-1">
                      Mot de passe * (min. 6 caractères)
                    </label>
                    <input
                      type="text"
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                      required
                      minLength={6}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-neutral-400 font-mono"
                    />
                    <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                      Notez ce mot de passe et transmettez-le à la personne.
                    </p>
                  </div>
                </>
              )}

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