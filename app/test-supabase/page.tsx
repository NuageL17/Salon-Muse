import { createClient } from "@/lib/supabase/server";

export default async function TestSupabasePage() {
  const supabase = await createClient();

  // On teste la connexion en listant les tables accessibles.
  // Sans session, ce test retourne un tableau vide, pas une erreur.
  const { error } = await supabase.from("prestations").select("*").limit(1);

  // Cas particuliers :
  // - Si la table n'existe pas encore → erreur PGRST205 → c'est normal à ce stade
  // - Sinon → connexion OK
  const tableManquante =
    error?.code === "PGRST205" || error?.message?.includes("schema cache");

  const connexionOK = !error || tableManquante;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "(non définie)";
  const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <main className="p-12 max-w-2xl mx-auto">
      <h1 className="text-3xl font-light mb-8">Test Supabase</h1>

      {connexionOK ? (
        <div className="p-6 rounded-2xl bg-green-50 border border-green-200 mb-6">
          <p className="font-medium text-green-700 mb-2">
            ✅ Connexion Supabase OK
          </p>
          {tableManquante ? (
            <p className="text-sm text-green-800">
              La table <code>prestations</code> n&apos;existe pas encore — c&apos;est
              normal, on va la créer à l&apos;étape suivante.
            </p>
          ) : (
            <p className="text-sm text-green-800">
              La base répond parfaitement.
            </p>
          )}
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 mb-6">
          <p className="font-medium text-red-700 mb-2">❌ Erreur</p>
          <pre className="text-sm text-red-600 whitespace-pre-wrap">
            {error?.message}
          </pre>
        </div>
      )}

      <div className="p-6 rounded-2xl border border-neutral-200 bg-white space-y-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
            URL Supabase
          </p>
          <p className="font-mono text-sm break-all">{url}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
            Clé anon
          </p>
          <p className="font-mono text-sm">
            {hasAnonKey ? "✅ présente" : "❌ manquante"}
          </p>
        </div>
      </div>
    </main>
  );
}