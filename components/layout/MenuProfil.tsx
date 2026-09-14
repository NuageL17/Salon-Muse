"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Props = {
  prenom: string | null;
  pointsFidelite: number;
};

export function MenuProfil({ prenom, pointsFidelite }: Props) {
  const [open, setOpen] = useState(false);
  const [deconnexion, setDeconnexion] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignout() {
    setDeconnexion(true);
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const initiale = (prenom?.[0] ?? "?").toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 hover:opacity-80 transition"
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium"
          style={{ background: "var(--accent)" }}
        >
          {initiale}
        </div>
        <svg
          className="w-4 h-4 transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0)" }}
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M5 7.5L10 12l5-4.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-neutral-200 bg-white shadow-lg overflow-hidden z-50">
          <div className="p-4 border-b border-neutral-100">
            <p className="text-sm font-medium">Bonjour {prenom}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              {pointsFidelite} point{pointsFidelite > 1 ? "s" : ""} fidélité
            </p>
          </div>

          <div className="py-2">
            <Link
              href="/mon-compte"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-neutral-50 transition"
            >
              <span>👤</span>
              <span>Profil</span>
            </Link>
            <Link
              href="/mon-compte"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-neutral-50 transition"
            >
              <span>⭐</span>
              <span>Points & Parrainage</span>
            </Link>
            <Link
              href="/mon-compte"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-neutral-50 transition"
            >
              <span>📅</span>
              <span>Mes réservations</span>
            </Link>
            <Link
              href="/mon-compte"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-neutral-50 transition"
            >
              <span>⚙️</span>
              <span>Paramètres</span>
            </Link>
          </div>

          <div className="border-t border-neutral-100">
            <button
              onClick={handleSignout}
              disabled={deconnexion}
              className="w-full text-left px-4 py-3 text-sm hover:bg-red-50 transition disabled:opacity-50"
              style={{ color: "#b91c1c" }}
            >
              {deconnexion ? "Déconnexion…" : "Se déconnecter"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}