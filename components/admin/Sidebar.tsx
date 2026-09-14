"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/admin", label: "Planning", icon: "📅" },
  { href: "/admin/prestations", label: "Prestations", icon: "🌸" },
  { href: "/admin/categories", label: "Catégories", icon: "🏷️" },
  { href: "/admin/equipe", label: "Équipe", icon: "👥" },
  { href: "/admin/clienteles", label: "Clientèles", icon: "🙋‍♀️" },
  { href: "/admin/finances", label: "Finances", icon: "💰" },
  { href: "/admin/horaires", label: "Horaires", icon: "⏰" },
  { href: "/admin/notifications", label: "Notifications", icon: "🔔" },
];

export function Sidebar() {
  const pathname = usePathname();
  const supabase = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [deconnexion, setDeconnexion] = useState(false);

  async function handleSignout() {
    setDeconnexion(true);
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-[60] md:hidden w-10 h-10 rounded-full bg-white border border-neutral-200 flex items-center justify-center shadow-sm"
      >
        {mobileOpen ? "✕" : "☰"}
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[50] md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-white border-r border-neutral-200 z-[55] flex flex-col transition-transform md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-neutral-100">
          <Link href="/" className="text-lg font-medium tracking-wide">
            Salon Muse
          </Link>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
            Espace gérante
          </p>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const actif =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-6 py-3 text-sm transition"
                style={{
                  background: actif ? "var(--accent)" : "transparent",
                  color: actif ? "white" : "var(--foreground)",
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-neutral-100 p-4">
          <Link
            href="/"
            className="block text-sm py-2 hover:opacity-60"
            style={{ color: "var(--muted)" }}
          >
            ← Retour au site
          </Link>
          <button
            onClick={handleSignout}
            disabled={deconnexion}
            className="w-full text-left text-sm py-2 hover:opacity-60 disabled:opacity-50"
            style={{ color: "#b91c1c" }}
          >
            {deconnexion ? "Déconnexion…" : "Se déconnecter"}
          </button>
        </div>
      </aside>
    </>
  );
}