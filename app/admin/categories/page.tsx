import { requireGerante } from "@/lib/auth";
import { GestionCategories } from "@/components/admin/GestionCategories";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CategoriesAdminPage() {
  const { supabase } = await requireGerante();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, nom, parent_id, ordre_affichage")
    .order("ordre_affichage", { ascending: true });

  const { data: prestations } = await supabase
    .from("prestations")
    .select("id, categorie_id");

  // Compter les prestations par catégorie
  const nbPrestationsParCategorie: Record<string, number> = {};
  (prestations ?? []).forEach((p) => {
    if (p.categorie_id) {
      nbPrestationsParCategorie[p.categorie_id] =
        (nbPrestationsParCategorie[p.categorie_id] ?? 0) + 1;
    }
  });

  // Compter les travailleuses par catégorie
  const { data: travailleuses } = await supabase
    .from("profiles")
    .select("id, categorie_id")
    .eq("role", "travailleuse");

  const nbTravailleusesParCategorie: Record<string, number> = {};
  (travailleuses ?? []).forEach((t) => {
    if (t.categorie_id) {
      nbTravailleusesParCategorie[t.categorie_id] =
        (nbTravailleusesParCategorie[t.categorie_id] ?? 0) + 1;
    }
  });

  return (
    <section className="p-6 md:p-10 max-w-4xl mx-auto">
      <p
        className="text-sm tracking-[0.2em] uppercase mb-3"
        style={{ color: "var(--muted)" }}
      >
        Configuration
      </p>
      <h1 className="text-4xl font-light mb-2">Catégories</h1>
      <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>
        Organisez vos prestations en catégories et sous-catégories.
      </p>

      <GestionCategories
        categories={categories ?? []}
        nbPrestationsParCategorie={nbPrestationsParCategorie}
        nbTravailleusesParCategorie={nbTravailleusesParCategorie}
      />
    </section>
  );
}