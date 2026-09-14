"use client";

import { useState, useMemo } from "react";
import { ActionsAdminRdv } from "@/components/rdv/ActionsAdminRdv";

type RdvAdmin = {
  id: string;
  debut: string;
  fin: string;
  statut: string;
  prix_applique: number | null;
  notes: string | null;
  reference_photo_url: string | null;
  raison_annulation: string | null;
  clientes: {
    prenom: string | null;
    nom: string | null;
    telephone: string | null;
  } | null;
  travailleuse: {
    prenom: string | null;
    nom: string | null;
  } | null;
  prestations: {
    nom: string;
    categorie: string | null;
    duree_min: number;
  } | null;
};

type Categorie = {
  id: string;
  nom: string;
};

type Props = {
  rdvs: RdvAdmin[];
  categories: Categorie[];
};

function formatDateHeure(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
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
      return { label: "Annulé (salon)", bg: "#fee2e2", color: "#b91c1c" };
    case "annule_cliente":
      return { label: "Annulé (cliente)", bg: "#fee2e2", color: "#b91c1c" };
    case "en_attente":
    default:
      return { label: "En attente", bg: "#fff8e1", color: "#a07900" };
  }
}

type FiltreStatut =
  | "tous"
  | "en_attente"
  | "confirme"
  | "annule"
  | "termine";

type FiltrePeriode = "tous" | "aujourdhui" | "semaine" | "mois" | "passe";

export function FiltresPlanning({ rdvs, categories }: Props) {
  const [statut, setStatut] = useState<FiltreStatut>("tous");
  const [categorie, setCategorie] = useState<string>("toutes");
  const [periode, setPeriode] = useState<FiltrePeriode>("tous");
  const [recherche, setRecherche] = useState("");
  const [prixMin, setPrixMin] = useState("");
  const [prixMax, setPrixMax] = useState("");

  // Liste unique des travailleuses pour le filtre
  const travailleuses = useMemo(() => {
    const set = new Set<string>();
    rdvs.forEach((r) => {
      if (r.travailleuse?.prenom) set.add(r.travailleuse.prenom);
    });
    return Array.from(set).sort();
  }, [rdvs]);

  const [travailleuseFiltre, setTravailleuseFiltre] = useState<string>("toutes");

  const rdvsFiltres = useMemo(() => {
    const maintenant = new Date();
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    const demain = new Date(aujourdhui);
    demain.setDate(demain.getDate() + 1);
    const dans7jours = new Date(aujourdhui);
    dans7jours.setDate(dans7jours.getDate() + 7);
    const dans30jours = new Date(aujourdhui);
    dans30jours.setDate(dans30jours.getDate() + 30);
    const il7jours = new Date(aujourdhui);
    il7jours.setDate(il7jours.getDate() - 7);

    return rdvs.filter((r) => {
      // Filtre statut
      if (statut === "en_attente" && r.statut !== "en_attente") return false;
      if (statut === "confirme" && r.statut !== "confirme") return false;
      if (
        statut === "annule" &&
        !["annule_salon", "annule_cliente"].includes(r.statut)
      )
        return false;
      if (statut === "termine" && r.statut !== "termine") return false;

      // Filtre catégorie
      if (
        categorie !== "toutes" &&
        r.prestations?.categorie !== categorie
      )
        return false;

      // Filtre travailleuse
      if (
        travailleuseFiltre !== "toutes" &&
        r.travailleuse?.prenom !== travailleuseFiltre
      )
        return false;

      // Filtre période
      const d = new Date(r.debut);
      if (periode === "aujourdhui" && (d < aujourdhui || d >= demain))
        return false;
      if (periode === "semaine" && (d < aujourdhui || d >= dans7jours))
        return false;
      if (periode === "mois" && (d < aujourdhui || d >= dans30jours))
        return false;
      if (periode === "passe" && d >= maintenant) return false;

      // Filtre recherche (nom cliente / prestation)
      if (recherche.trim()) {
        const q = recherche.toLowerCase().trim();
        const nom = `${r.clientes?.prenom ?? ""} ${r.clientes?.nom ?? ""}`.toLowerCase();
        const presta = (r.prestations?.nom ?? "").toLowerCase();
        const tel = r.clientes?.telephone ?? "";
        if (!nom.includes(q) && !presta.includes(q) && !tel.includes(q))
          return false;
      }

      // Filtre prix
      const p = r.prix_applique ?? 0;
      if (prixMin && p < Number(prixMin)) return false;
      if (prixMax && p > Number(prixMax)) return false;

      return true;
    });
  }, [rdvs, statut, categorie, travailleuseFiltre, periode, recherche, prixMin, prixMax]);

  function resetFiltres() {
    setStatut("tous");
    setCategorie("toutes");
    setTravailleuseFiltre("toutes");
    setPeriode("tous");
    setRecherche("");
    setPrixMin("");
    setPrixMax("");
  }

  const filtresActifs =
    statut !== "tous" ||
    categorie !== "toutes" ||
    travailleuseFiltre !== "toutes" ||
    periode !== "tous" ||
    recherche.trim() !== "" ||
    prixMin !== "" ||
    prixMax !== "";

  const caFiltre = rdvsFiltres.reduce(
    (sum, r) => sum + (r.prix_applique ?? 0),
    0
  );

  return (
    <>
      {/* Barre de filtres */}
      <div className="p-5 rounded-2xl border border-neutral-200 bg-white mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium">🔍 Filtres</p>
          {filtresActifs && (
            <button
              onClick={resetFiltres}
              className="text-xs hover:opacity-60"
              style={{ color: "var(--accent-dark)" }}
            >
              ✕ Réinitialiser
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          {/* Recherche */}
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--muted)" }}>
              Recherche
            </label>
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Nom, tél., soin…"
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-neutral-400"
            />
          </div>

          {/* Statut */}
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--muted)" }}>
              Statut
            </label>
            <select
              value={statut}
              onChange={(e) => setStatut(e.target.value as FiltreStatut)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm bg-white focus:outline-none focus:border-neutral-400"
            >
              <option value="tous">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="confirme">Confirmés</option>
              <option value="termine">Terminés</option>
              <option value="annule">Annulés</option>
            </select>
          </div>

          {/* Catégorie */}
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--muted)" }}>
              Catégorie
            </label>
            <select
              value={categorie}
              onChange={(e) => setCategorie(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm bg-white focus:outline-none focus:border-neutral-400"
            >
              <option value="toutes">Toutes les catégories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.nom}>
                  {c.nom}
                </option>
              ))}
            </select>
          </div>

          {/* Travailleuse */}
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--muted)" }}>
              Travailleuse
            </label>
            <select
              value={travailleuseFiltre}
              onChange={(e) => setTravailleuseFiltre(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm bg-white focus:outline-none focus:border-neutral-400"
            >
              <option value="toutes">Toutes</option>
              {travailleuses.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Période */}
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--muted)" }}>
              Période
            </label>
            <select
              value={periode}
              onChange={(e) => setPeriode(e.target.value as FiltrePeriode)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm bg-white focus:outline-none focus:border-neutral-400"
            >
              <option value="tous">Toutes les dates</option>
              <option value="aujourdhui">Aujourd&apos;hui</option>
              <option value="semaine">7 prochains jours</option>
              <option value="mois">30 prochains jours</option>
              <option value="passe">Passés</option>
            </select>
          </div>

          {/* Prix */}
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--muted)" }}>
              Prix (DA)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={prixMin}
                onChange={(e) => setPrixMin(e.target.value)}
                placeholder="Min"
                min={0}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-neutral-400"
              />
              <span style={{ color: "var(--muted)" }}>–</span>
              <input
                type="number"
                value={prixMax}
                onChange={(e) => setPrixMax(e.target.value)}
                placeholder="Max"
                min={0}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-neutral-400"
              />
            </div>
          </div>
        </div>

        {/* Résumé */}
        <div
          className="pt-3 mt-3 border-t border-neutral-100 flex items-center justify-between text-sm"
          style={{ color: "var(--muted)" }}
        >
          <span>
            <strong style={{ color: "var(--foreground)" }}>
              {rdvsFiltres.length}
            </strong>{" "}
            résultat{rdvsFiltres.length > 1 ? "s" : ""}
          </span>
          <span>
            CA filtré :{" "}
            <strong style={{ color: "var(--accent-dark)" }}>
              {caFiltre} DA
            </strong>
          </span>
        </div>
      </div>

      {/* Liste filtrée */}
      {rdvsFiltres.length === 0 ? (
        <div className="p-12 rounded-2xl border border-dashed border-neutral-300 text-center">
          <p className="mb-2">Aucun rendez-vous ne correspond aux filtres.</p>
          {filtresActifs && (
            <button
              onClick={resetFiltres}
              className="text-sm underline"
              style={{ color: "var(--accent-dark)" }}
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {rdvsFiltres.map((rdv) => (
            <RdvCarte key={rdv.id} rdv={rdv} />
          ))}
        </div>
      )}
    </>
  );
}

function RdvCarte({ rdv }: { rdv: RdvAdmin }) {
  const badge = badgeStatut(rdv.statut);
  const estAnnule = ["annule_salon", "annule_cliente"].includes(rdv.statut);
  const estTermine = rdv.statut === "termine";

  return (
    <div
      className="p-5 rounded-2xl border border-neutral-200 bg-white"
      style={{ opacity: estAnnule ? 0.6 : 1 }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-shrink-0 w-32">
          <p
            className="text-xs uppercase tracking-wide"
            style={{ color: "var(--muted)" }}
          >
            {formatDateHeure(rdv.debut)}
          </p>
          <p className="text-sm mt-1">{rdv.prestations?.duree_min} min</p>
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="text-xs uppercase tracking-wide mb-1"
            style={{ color: "var(--muted)" }}
          >
            {rdv.prestations?.categorie}
          </p>
          <h3 className="text-lg mb-1">
            {rdv.prestations?.nom ?? "Prestation"}
          </h3>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            👤 {rdv.clientes?.prenom ?? "?"} {rdv.clientes?.nom ?? ""}
            {rdv.clientes?.telephone && ` · ${rdv.clientes.telephone}`}
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            💅 {rdv.travailleuse?.prenom ?? "Non assignée"}{" "}
            {rdv.travailleuse?.nom ?? ""}
          </p>
          {rdv.notes && (
            <p
              className="text-xs mt-2 italic"
              style={{ color: "var(--muted)" }}
            >
              « {rdv.notes} »
            </p>
          )}
          {rdv.raison_annulation && (
            <p
              className="text-xs mt-2 px-3 py-2 rounded-lg"
              style={{ background: "#fee2e2", color: "#b91c1c" }}
            >
              <strong>Raison d&apos;annulation :</strong>{" "}
              {rdv.raison_annulation}
            </p>
          )}
          {rdv.reference_photo_url && (
            <a
              href={rdv.reference_photo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3"
            >
              <img
                src={rdv.reference_photo_url}
                alt="Référence"
                className="w-24 h-24 object-cover rounded-xl border border-neutral-200 hover:opacity-80 transition"
              />
            </a>
          )}
          {!estAnnule && !estTermine && (
            <ActionsAdminRdv rdvId={rdv.id} statut={rdv.statut} />
          )}
        </div>

        <div className="flex-shrink-0 text-right">
          <p
            className="text-lg font-medium mb-2"
            style={{ color: "var(--accent-dark)" }}
          >
            {rdv.prix_applique} DA
          </p>
          <span
            className="inline-block text-xs px-2 py-1 rounded-full"
            style={{ background: badge.bg, color: badge.color }}
          >
            {badge.label}
          </span>
        </div>
      </div>
    </div>
  );
}