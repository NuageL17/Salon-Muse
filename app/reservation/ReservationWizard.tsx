"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Prestation } from "@/lib/types/database";
import { createClient } from "@/lib/supabase/client";

type Categorie = {
  id: string;
  nom: string;
  parent_id: string | null;
  ordre_affichage: number;
};

type PrestationAvecCat = Prestation & { categorie_id: string | null };

type Travailleuse = {
  id: string;
  prenom: string;
  nom: string | null;
  categorie_id: string;
};

type Props = {
  prestations: PrestationAvecCat[];
  categories: Categorie[];
};

function formatDateFR(d: Date): string {
  return d.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatTimeFR(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getNextDays(n: number): Date[] {
  const days: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

type Etape = "categorie" | "sous-categorie" | "prestation" | "travailleuse" | "creneau" | "confirmation";

export function ReservationWizard({ prestations, categories }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [etape, setEtape] = useState<Etape>("categorie");

  // Sélections
  const [categoriePrincipale, setCategoriePrincipale] = useState<Categorie | null>(null);
  const [sousCategorie, setSousCategorie] = useState<Categorie | null>(null);
  const [prestation, setPrestation] = useState<PrestationAvecCat | null>(null);
  const [travailleuse, setTravailleuse] = useState<Travailleuse | null>(null);
  const [date, setDate] = useState<Date | null>(null);
  const [slot, setSlot] = useState<string | null>(null);

  // Chargement
  const [travailleuses, setTravailleuses] = useState<Travailleuse[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingTravailleuses, setLoadingTravailleuses] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Confirmation
  const [notes, setNotes] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const days = getNextDays(14);

  // Catégories principales
  const principales = categories
    .filter((c) => !c.parent_id)
    .sort((a, b) => a.ordre_affichage - b.ordre_affichage);

  // Vérifier si une catégorie a des sous-catégories
  function getSousCategories(parentId: string): Categorie[] {
    return categories
      .filter((c) => c.parent_id === parentId)
      .sort((a, b) => a.ordre_affichage - b.ordre_affichage);
  }

  // Prestations dans une catégorie (directement)
  function getPrestationsDansCategorie(catId: string): PrestationAvecCat[] {
    return prestations.filter((p) => p.categorie_id === catId);
  }

  // Prestations rattachées à une catégorie principale ou à ses sous-catégories
  function getAllPrestationsPrincipale(principaleId: string): PrestationAvecCat[] {
    const sousCats = getSousCategories(principaleId).map((c) => c.id);
    const allCatIds = [principaleId, ...sousCats];
    return prestations.filter(
      (p) => p.categorie_id && allCatIds.includes(p.categorie_id)
    );
  }

  // === Sélections ===

  function choisirCategoriePrincipale(cat: Categorie) {
    setCategoriePrincipale(cat);
    setSousCategorie(null);
    setPrestation(null);

    const sousCats = getSousCategories(cat.id);
    const prestasDirectes = getPrestationsDansCategorie(cat.id);
    const prestasTotal = getAllPrestationsPrincipale(cat.id);

    // Si la catégorie a des sous-catégories :
    if (sousCats.length > 0) {
      setEtape("sous-categorie");
      return;
    }

    // Sinon si elle a des prestations directes → aller à la prestation
    if (prestasDirectes.length > 0) {
      setEtape("prestation");
      return;
    }

    // Sinon rien à afficher
    if (prestasTotal.length === 0) {
      setError("Aucune prestation dans cette catégorie.");
    }
  }

  function choisirSousCategorie(sub: Categorie | null) {
    setSousCategorie(sub);
    setPrestation(null);
    setEtape("prestation");
  }

  async function choisirPrestation(p: PrestationAvecCat) {
    setPrestation(p);
    setEtape("travailleuse");
    setLoadingTravailleuses(true);
    setError(null);
    setTravailleuse(null);

    try {
      const res = await fetch(
        `/api/travailleuses?prestation_id=${p.id}`,
        { cache: "no-store" }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setTravailleuses(json.travailleuses ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setTravailleuses([]);
    } finally {
      setLoadingTravailleuses(false);
    }
  }

  function choisirTravailleuse(t: Travailleuse) {
    setTravailleuse(t);
    setEtape("creneau");
    setDate(null);
    setSlots([]);
    setSlot(null);
  }

  async function handleSelectDate(d: Date) {
    if (!prestation || !travailleuse) return;
    setDate(d);
    setSlot(null);
    setLoadingSlots(true);
    setError(null);

    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    try {
      const res = await fetch(
        `/api/creneaux?prestation_id=${prestation.id}&travailleuse_id=${travailleuse.id}&date=${dateStr}`,
        { cache: "no-store" }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSlots(json.slots ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setPhotoFile(null);
      setPhotoPreview(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("La photo ne doit pas dépasser 5 MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Seules les images sont acceptées");
      return;
    }
    setError(null);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function retirerPhoto() {
    setPhotoFile(null);
    setPhotoPreview(null);
  }

  async function uploadPhoto(): Promise<string | null> {
    if (!photoFile) return null;
    const ext = photoFile.name.split(".").pop() ?? "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("references-rdv")
      .upload(fileName, photoFile);
    if (uploadError) throw new Error("Erreur upload photo : " + uploadError.message);
    const { data: urlData } = supabase.storage
      .from("references-rdv")
      .getPublicUrl(fileName);
    return urlData.publicUrl;
  }

  async function handleConfirm() {
    if (!prestation || !travailleuse || !slot) return;
    setSubmitting(true);
    setError(null);
    try {
      let photoUrl: string | null = null;
      if (photoFile) photoUrl = await uploadPhoto();

      const res = await fetch("/api/rdv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prestation_id: prestation.id,
          travailleuse_id: travailleuse.id,
          debut: slot,
          notes: notes.trim() || null,
          reference_photo_url: photoUrl,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      router.push("/mon-compte");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setSubmitting(false);
    }
  }

  // === Rendu progression ===
  const etapesActives: Etape[] = ["categorie"];
  if (categoriePrincipale) {
    if (getSousCategories(categoriePrincipale.id).length > 0) {
      etapesActives.push("sous-categorie");
    }
    etapesActives.push("prestation", "travailleuse", "creneau", "confirmation");
  }
  const idx = etapesActives.indexOf(etape);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progression */}
      <div className="flex items-center justify-center gap-1 mb-12 flex-wrap">
        {etapesActives.map((e, i) => (
          <div key={e} className="flex items-center gap-1">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs"
              style={{
                background: idx >= i ? "var(--accent)" : "#e5e5e5",
                color: idx >= i ? "white" : "#888",
              }}
            >
              {i + 1}
            </div>
            {i < etapesActives.length - 1 && (
              <div
                className="w-5 h-px"
                style={{
                  background: idx > i ? "var(--accent)" : "#e5e5e5",
                }}
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* === ÉTAPE CATÉGORIE === */}
      {etape === "categorie" && (
        <div>
          <h2 className="text-2xl font-light mb-2">
            Quel type de soin ?
          </h2>
          <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>
            Choisissez une catégorie pour commencer.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {principales.map((cat) => {
              const nbPrestas = getAllPrestationsPrincipale(cat.id).length;
              if (nbPrestas === 0) return null;
              return (
                <button
                  key={cat.id}
                  onClick={() => choisirCategoriePrincipale(cat)}
                  className="p-5 rounded-2xl border border-neutral-200 bg-white hover:border-neutral-400 transition text-center"
                >
                  <p className="text-lg font-medium capitalize mb-1">
                    {cat.nom}
                  </p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    {nbPrestas} soin{nbPrestas > 1 ? "s" : ""}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* === ÉTAPE SOUS-CATÉGORIE === */}
      {etape === "sous-categorie" && categoriePrincipale && (
        <div>
          <button
            onClick={() => {
              setEtape("categorie");
              setCategoriePrincipale(null);
            }}
            className="text-sm mb-6 hover:opacity-60"
            style={{ color: "var(--muted)" }}
          >
            ← Changer de catégorie
          </button>

          <h2 className="text-2xl font-light mb-2 capitalize">
            {categoriePrincipale.nom} — quelle zone ?
          </h2>
          <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>
            Choisissez une sous-catégorie.
          </p>

          <div className="space-y-3">
            {getSousCategories(categoriePrincipale.id).map((sub) => {
              const nb = getPrestationsDansCategorie(sub.id).length;
              if (nb === 0) return null;
              return (
                <button
                  key={sub.id}
                  onClick={() => choisirSousCategorie(sub)}
                  className="w-full text-left p-5 rounded-2xl border border-neutral-200 bg-white hover:border-neutral-400 transition flex items-center justify-between"
                >
                  <span className="text-lg font-medium">{sub.nom}</span>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>
                    {nb} soin{nb > 1 ? "s" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* === ÉTAPE PRESTATION === */}
      {etape === "prestation" && categoriePrincipale && (
        <div>
          <button
            onClick={() => {
              if (getSousCategories(categoriePrincipale.id).length > 0) {
                setEtape("sous-categorie");
              } else {
                setEtape("categorie");
                setCategoriePrincipale(null);
              }
            }}
            className="text-sm mb-6 hover:opacity-60"
            style={{ color: "var(--muted)" }}
          >
            ← Retour
          </button>

          <h2 className="text-2xl font-light mb-2">Quel soin ?</h2>
          <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>
            {categoriePrincipale.nom}
            {sousCategorie ? ` › ${sousCategorie.nom}` : ""}
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            {(sousCategorie
              ? getPrestationsDansCategorie(sousCategorie.id)
              : getPrestationsDansCategorie(categoriePrincipale.id)
            ).map((p) => (
              <button
                key={p.id}
                onClick={() => choisirPrestation(p)}
                className="text-left p-5 rounded-2xl border bg-white transition hover:border-neutral-400"
                style={{ borderColor: "#e5e5e5" }}
              >
                <h3 className="text-lg mb-1">{p.nom}</h3>
                <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>
                  {p.duree_min} min
                </p>
                <p
                  className="text-lg font-medium"
                  style={{ color: "var(--accent-dark)" }}
                >
                  {p.prix} DA
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* === ÉTAPE TRAVAILLEUSE === */}
      {etape === "travailleuse" && prestation && (
        <div>
          <button
            onClick={() => setEtape("prestation")}
            className="text-sm mb-6 hover:opacity-60"
            style={{ color: "var(--muted)" }}
          >
            ← Changer de soin
          </button>

          <h2 className="text-2xl font-light mb-2">
            Avec qui souhaitez-vous ce soin ?
          </h2>
          <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>
            {prestation.nom} · {prestation.duree_min} min · {prestation.prix} DA
          </p>

          {loadingTravailleuses ? (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Chargement…
            </p>
          ) : travailleuses.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-neutral-300 text-center">
              <p className="mb-2">
                Aucune travailleuse disponible pour ce type de soin.
              </p>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Contactez le salon pour plus d&apos;informations.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {travailleuses.map((t) => (
                <button
                  key={t.id}
                  onClick={() => choisirTravailleuse(t)}
                  className="w-full text-left p-5 rounded-2xl border bg-white transition hover:border-neutral-400 flex items-center gap-4"
                  style={{ borderColor: "#e5e5e5" }}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-medium"
                    style={{ background: "var(--accent)" }}
                  >
                    {t.prenom[0]?.toUpperCase()}
                  </div>
                  <p className="text-lg">
                    {t.prenom} {t.nom ?? ""}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* === ÉTAPE CRÉNEAU === */}
      {etape === "creneau" && prestation && travailleuse && (
        <div>
          <button
            onClick={() => setEtape("travailleuse")}
            className="text-sm mb-6 hover:opacity-60"
            style={{ color: "var(--muted)" }}
          >
            ← Changer de travailleuse
          </button>

          <h2 className="text-2xl font-light mb-2">
            Quand souhaitez-vous venir ?
          </h2>
          <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>
            {prestation.nom} avec <strong>{travailleuse.prenom}</strong>
          </p>

          <p
            className="text-xs uppercase tracking-wide mb-3"
            style={{ color: "var(--muted)" }}
          >
            Choisissez un jour
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
            {days.map((d) => {
              const isSelected =
                date && d.toDateString() === date.toDateString();
              const isSunday = d.getDay() === 0;
              return (
                <button
                  key={d.toISOString()}
                  onClick={() => !isSunday && handleSelectDate(d)}
                  disabled={isSunday}
                  className="flex-shrink-0 px-4 py-3 rounded-xl border text-sm transition"
                  style={{
                    borderColor: isSelected ? "var(--accent)" : "#e5e5e5",
                    background: isSelected ? "var(--accent)" : "white",
                    color: isSelected ? "white" : "var(--foreground)",
                    opacity: isSunday ? 0.3 : 1,
                  }}
                >
                  {formatDateFR(d)}
                </button>
              );
            })}
          </div>

          {date && (
            <>
              <p
                className="text-xs uppercase tracking-wide mb-3"
                style={{ color: "var(--muted)" }}
              >
                Créneaux avec {travailleuse.prenom}
              </p>
              {loadingSlots ? (
                <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>
                  Chargement…
                </p>
              ) : slots.length === 0 ? (
                <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>
                  Aucun créneau disponible ce jour-là.
                </p>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-8">
                  {slots.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSlot(s)}
                      className="px-3 py-2 rounded-xl border text-sm transition"
                      style={{
                        borderColor: slot === s ? "var(--accent)" : "#e5e5e5",
                        background: slot === s ? "var(--accent)" : "white",
                        color: slot === s ? "white" : "var(--foreground)",
                      }}
                    >
                      {formatTimeFR(s)}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          <button
            disabled={!slot}
            onClick={() => setEtape("confirmation")}
            className="w-full py-4 rounded-full text-white text-lg transition hover:opacity-90 disabled:opacity-30"
            style={{ background: "var(--accent)" }}
          >
            Continuer
          </button>
        </div>
      )}

      {/* === ÉTAPE CONFIRMATION === */}
      {etape === "confirmation" &&
        prestation &&
        travailleuse &&
        date &&
        slot && (
          <div>
            <button
              onClick={() => setEtape("creneau")}
              className="text-sm mb-6 hover:opacity-60"
              style={{ color: "var(--muted)" }}
            >
              ← Changer de créneau
            </button>

            <h2 className="text-2xl font-light mb-8">
              Confirmez votre réservation
            </h2>

            <div className="p-6 rounded-2xl border border-neutral-200 bg-white mb-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--muted)" }}>Prestation</span>
                <span>{prestation.nom}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--muted)" }}>Travailleuse</span>
                <span>
                  {travailleuse.prenom} {travailleuse.nom ?? ""}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--muted)" }}>Date</span>
                <span>
                  {date.toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--muted)" }}>Heure</span>
                <span>{formatTimeFR(slot)}</span>
              </div>
              <div className="flex justify-between text-sm pt-3 border-t border-neutral-100">
                <span style={{ color: "var(--muted)" }}>Total</span>
                <span
                  className="font-medium"
                  style={{ color: "var(--accent-dark)" }}
                >
                  {prestation.prix} DA
                </span>
              </div>
            </div>

            <div className="mb-6 p-5 rounded-2xl border border-neutral-200 bg-white">
              <label className="block text-sm font-medium mb-1">
                📸 Photo du modèle souhaité{" "}
                <span style={{ color: "var(--muted)", fontWeight: "normal" }}>
                  (optionnel)
                </span>
              </label>
              <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>
                Envoyez une photo pour que la travailleuse vérifie si c&apos;est
                réalisable.
              </p>

              {photoPreview ? (
                <div className="flex items-start gap-4">
                  <img
                    src={photoPreview}
                    alt="Aperçu"
                    className="w-32 h-32 object-cover rounded-xl border border-neutral-200"
                  />
                  <button
                    type="button"
                    onClick={retirerPhoto}
                    className="text-xs px-3 py-1 rounded-full"
                    style={{ background: "#fee2e2", color: "#b91c1c" }}
                  >
                    Retirer
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-neutral-300 rounded-xl cursor-pointer hover:border-neutral-400 transition">
                  <span className="text-2xl mb-2">📷</span>
                  <span className="text-sm" style={{ color: "var(--muted)" }}>
                    Cliquez pour ajouter une photo
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </label>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm mb-2">
                Une demande particulière ? (optionnel)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Allergies, préférences…"
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:border-neutral-400 resize-none"
              />
            </div>

            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="w-full py-4 rounded-full text-white text-lg transition hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--accent)" }}
            >
              {submitting ? "Réservation…" : "Confirmer ma réservation"}
            </button>
          </div>
        )}
    </div>
  );
}