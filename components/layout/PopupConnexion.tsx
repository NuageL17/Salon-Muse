"use client";

import Link from "next/link";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function PopupConnexion({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-4">
          <div className="text-4xl mb-3">🌸</div>
          <h2 className="text-2xl font-light mb-2">
            Un instant…
          </h2>
          <p
            className="text-sm"
            style={{ color: "var(--muted)" }}
          >
            Pour réserver votre soin, connectez-vous ou créez un compte. Cela
            prend moins de 30 secondes.
          </p>
        </div>

        <div className="space-y-3 mt-6">
          <Link
            href="/inscription"
            className="block w-full py-4 rounded-full text-white text-center text-base transition hover:opacity-90"
            style={{ background: "var(--accent)" }}
          >
            Créer un compte
          </Link>

          <Link
            href="/connexion"
            className="block w-full py-4 rounded-full text-center text-base border border-neutral-200 transition hover:bg-neutral-50"
          >
            J&apos;ai déjà un compte
          </Link>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-2 text-sm transition hover:opacity-60"
          style={{ color: "var(--muted)" }}
        >
          Annuler
        </button>
      </div>
    </div>
  );
}