"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ConnexionPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/mon-compte");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="block text-center text-xl font-medium tracking-wide mb-10"
        >
          Salon Muse
        </Link>

        <h1 className="text-3xl font-light mb-2 text-center">Connexion</h1>
        <p
          className="text-sm text-center mb-10"
          style={{ color: "var(--muted)" }}
        >
          Accédez à votre espace cliente.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:border-neutral-400"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Mot de passe</label>
            <input
              name="password"
              type="password"
              required
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:border-neutral-400"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-full text-white text-lg transition hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--accent)" }}
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: "var(--muted)" }}>
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </main>
  );
}