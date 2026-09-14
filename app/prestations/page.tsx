import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Prestation } from "@/lib/types/database";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Categorie = {
  id: string;
  nom: string;
  parent_id: string | null;
  ordre_affichage: number;
};

type PrestationAvecCat = Prestation & { categorie_id: string | null };

export default async function PrestationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profileRole: string | null = null;
  if (user) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    profileRole = data?.role ?? null;
  }

  const admin = createAdminClient();

  const { data: prestations } = await admin
    .from("prestations")
    .select("*")
    .eq("actif", true)
    .order("ordre_affichage", { ascending: true });

  const { data: categories } = await admin
    .from("categories")
    .select("id, nom, parent_id, ordre_affichage")
    .order("ordre_affichage", { ascending: true });

  const listeCat = (categories ?? []) as Categorie[];
  const listePresta = (prestations ?? []) as PrestationAvecCat[];

  // Grouper les prestations par catégorie principale
  function getCatPrincipale(catId: string | null): Categorie | null {
    if (!catId) return null;
    let currentId: string | null = catId;
    let current = listeCat.find((c) => c.id === currentId);

    while (current && current.parent_id) {
      currentId = current.parent_id;
      current = listeCat.find((c) => c.id === currentId);
    }

    return current ?? null;
  }

  const principales = listeCat
    .filter((c) => !c.parent_id)
    .sort((a, b) => a.ordre_affichage - b.ordre_affichage);

  // Grouper les prestations par catégorie principale
  const prestaParPrincipale = new Map<string, PrestationAvecCat[]>();
  for (const p of listePresta) {
    const principale = getCatPrincipale(p.categorie_id);
    if (!principale) continue;
    const arr = prestaParPrincipale.get(principale.id) ?? [];
    arr.push(p);
    prestaParPrincipale.set(principale.id, arr);
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-neutral-200">
        <nav className="mx-auto max-w-6xl flex items-center justify-between p-6">
          <Link href="/" className="text-xl font-medium tracking-wide">
            Salon Muse
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/prestations" className="opacity-60">
              Prestations
            </Link>
            <Link href="/galerie" className="hover:opacity-60">
              Galerie
            </Link>
            <Link href="/contact" className="hover:opacity-60">
              Contact
            </Link>
            {user && profileRole ? (
              <Link
                href={profileRole === "gerante" ? "/admin" : "/mon-compte"}
                className="hover:opacity-60"
              >
                {profileRole === "gerante" ? "Dashboard" : "Mon compte"}
              </Link>
            ) : (
              <Link href="/connexion" className="hover:opacity-60">
                Connexion
              </Link>
            )}
            <Link
              href="/reservation"
              className="px-4 py-2 rounded-full text-white"
              style={{ background: "var(--accent)" }}
            >
              Prendre RDV
            </Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <p
          className="text-sm tracking-[0.2em] uppercase mb-4"
          style={{ color: "var(--muted)" }}
        >
          Nos soins
        </p>
        <h1 className="text-4xl md:text-5xl font-light mb-4">
          Nos prestations
        </h1>
        <p className="text-lg mb-12" style={{ color: "var(--muted)" }}>
          {listePresta.length} soin{listePresta.length > 1 ? "s" : ""}{" "}
          disponible{listePresta.length > 1 ? "s" : ""}
        </p>

        <div className="space-y-8">
          {principales.map((cat) => {
            const prestas = prestaParPrincipale.get(cat.id) ?? [];
            if (prestas.length === 0) return null;

            return (
              <div key={cat.id}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-light capitalize">
                    {cat.nom}
                  </h2>
                  <span
                    className="text-xs px-2 py-1 rounded-full"
                    style={{
                      background: "#f5f0e8",
                      color: "var(--accent-dark)",
                    }}
                  >
                    {prestas.length} soin{prestas.length > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {prestas.map((p) => {
                    const sousCat = listeCat.find(
                      (c) => c.id === p.categorie_id && c.parent_id
                    );
                    return (
                      <article
                        key={p.id}
                        className="p-6 rounded-2xl border border-neutral-200 bg-white flex flex-col"
                      >
                        {sousCat && (
                          <p
                            className="text-xs tracking-[0.15em] uppercase mb-1"
                            style={{ color: "var(--accent-dark)" }}
                          >
                            {sousCat.nom}
                          </p>
                        )}
                        <h3 className="text-xl mb-2">{p.nom}</h3>
                        <p
                          className="text-sm mb-4 flex-1"
                          style={{ color: "var(--muted)" }}
                        >
                          {p.description}
                        </p>
                        <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                          <span
                            className="text-sm"
                            style={{ color: "var(--muted)" }}
                          >
                            {p.duree_min} min
                          </span>
                          <span
                            className="text-lg font-medium"
                            style={{ color: "var(--accent-dark)" }}
                          >
                            {p.prix} DA
                          </span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}