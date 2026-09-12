"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function InscriptionPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeParrain, setCodeParrain] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const prenom = String(form.get("prenom") ?? "").trim();
    const nom = String(form.get("nom") ?? "").trim();
    const telephone = String(form.get("telephone") ?? "").trim();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          prenom,
          nom,
          telephone,
          code_parrainage: codeParrain.trim().toUpperCase() || null,
        },
      },
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

        <h1 className="text-3xl font-light mb-2 text-center">
          Créer un compte
        </h1>
        <p
          className="text-sm text-center mb-10"
          style={{ color: "var(--muted)" }}
        >
          Réservez vos soins en 2 clics.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Prénom</label>
              <input
                name="prenom"
                required
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:border-neutral-400"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Nom</label>
              <input
                name="nom"
                required
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:border-neutral-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Téléphone</label>
            <input
              name="telephone"
              type="tel"
              required
              placeholder="+213 5XX XX XX XX"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:border-neutral-400"
            />
          </div>

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
            <label className="block text-sm mb-1">
              Code de parrainage{" "}
              <span style={{ color: "var(--muted)" }}>(optionnel)</span>
            </label>
            <input
              name="code_parrainage"
              value={codeParrain}
              onChange={(e) => setCodeParrain(e.target.value.toUpperCase())}
              placeholder="Ex : A3F9B2C1"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:border-neutral-400 font-mono tracking-wider"
            />
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
              Si une amie vous a parrainée, collez son code ici pour gagner des points.
            </p>
          </div>

          <div>
            <label className="block text-sm mb-1">Mot de passe</label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:border-neutral-400"
            />
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
              6 caractères minimum
            </p>
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
            {loading ? "Création..." : "Créer mon compte"}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: "var(--muted)" }}>
          Déjà un compte ?{" "}
          <Link href="/connexion" className="underline">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}