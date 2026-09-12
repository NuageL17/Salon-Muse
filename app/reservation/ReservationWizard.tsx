"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Prestation } from "@/lib/types/database";

type Props = {
  prestations: Prestation[];
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

export function ReservationWizard({ prestations }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [prestation, setPrestation] = useState<Prestation | null>(null);
  const [date, setDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [slot, setSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const days = getNextDays(14);

  async function handleSelectDate(d: Date) {
    if (!prestation) return;
    setDate(d);
    setSlot(null);
    setLoadingSlots(true);
    setError(null);

    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    try {
      const res = await fetch(
        `/api/creneaux?prestation_id=${prestation.id}&date=${dateStr}`
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSlots(json.slots ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  async function handleConfirm() {
    if (!prestation || !slot) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/rdv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prestation_id: prestation.id,
          debut: slot,
          notes: notes.trim() || null,
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

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-center gap-2 mb-12">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
              style={{
                background: step >= n ? "var(--accent)" : "#e5e5e5",
                color: step >= n ? "white" : "#888",
              }}
            >
              {n}
            </div>
            {n < 3 && (
              <div
                className="w-12 h-px"
                style={{
                  background: step > n ? "var(--accent)" : "#e5e5e5",
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

      {step === 1 && (
        <div>
          <h2 className="text-2xl font-light mb-2">
            Quel soin souhaitez-vous ?
          </h2>
          <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>
            Sélectionnez une prestation pour continuer.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            {prestations.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setPrestation(p);
                  setStep(2);
                }}
                className="text-left p-5 rounded-2xl border bg-white transition hover:border-neutral-400"
                style={{ borderColor: "#e5e5e5" }}
              >
                <p
                  className="text-xs uppercase tracking-wide mb-1"
                  style={{ color: "var(--muted)" }}
                >
                  {p.categorie}
                </p>
                <h3 className="text-lg mb-1">{p.nom}</h3>
                <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>
                  {p.duree_min} min
                </p>
                <p
                  className="text-lg font-medium"
                  style={{ color: "var(--accent-dark)" }}
                >
                  {p.prix} €
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && prestation && (
        <div>
          <button
            onClick={() => {
              setStep(1);
              setSlots([]);
              setSlot(null);
              setDate(null);
            }}
            className="text-sm mb-6 hover:opacity-60"
            style={{ color: "var(--muted)" }}
          >
            ← Changer de soin
          </button>

          <h2 className="text-2xl font-light mb-2">
            Quand souhaitez-vous venir ?
          </h2>
          <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>
            {prestation.nom} · {prestation.duree_min} min · {prestation.prix} €
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
                  className="shrink-0 px-4 py-3 rounded-xl border text-sm transition"
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
                Créneaux disponibles
              </p>

              {loadingSlots ? (
                <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>
                  Chargement…
                </p>
              ) : slots.length === 0 ? (
                <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>
                  Aucun créneau disponible ce jour-là. Essayez une autre date.
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
            onClick={() => setStep(3)}
            className="w-full py-4 rounded-full text-white text-lg transition hover:opacity-90 disabled:opacity-30"
            style={{ background: "var(--accent)" }}
          >
            Continuer
          </button>
        </div>
      )}

      {step === 3 && prestation && date && slot && (
        <div>
          <button
            onClick={() => setStep(2)}
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
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--muted)" }}>Durée</span>
              <span>{prestation.duree_min} min</span>
            </div>
            <div className="flex justify-between text-sm pt-3 border-t border-neutral-100">
              <span style={{ color: "var(--muted)" }}>Total</span>
              <span
                className="font-medium"
                style={{ color: "var(--accent-dark)" }}
              >
                {prestation.prix} €
              </span>
            </div>
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