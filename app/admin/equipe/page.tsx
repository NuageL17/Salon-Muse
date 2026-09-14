import { requireGerante } from "@/lib/auth";
import { ListeTravailleuses } from "@/components/admin/ListeTravailleuses";

type TravailleuseDB = {
  id: string;
  prenom: string | null;
  nom: string | null;
  telephone: string | null;
  categorie_id: string | null;
};

export default async function EquipeAdminPage() {
  const { supabase } = await requireGerante();

  const { data: travailleuses } = await supabase
    .from("profiles")
    .select("id, prenom, nom, telephone, categorie_id")
    .eq("role", "travailleuse")
    .order("prenom", { ascending: true });

  const { data: categories } = await supabase
    .from("categories")
    .select("id, nom")
    .order("ordre_affichage", { ascending: true });

  const catMap = new Map(
    (categories ?? []).map((c) => [c.id, c.nom])
  );

  const liste = (travailleuses ?? []).map((t: TravailleuseDB) => ({
    ...t,
    categorie_nom: t.categorie_id ? catMap.get(t.categorie_id) ?? null : null,
  }));

  return (
    <section className="p-6 md:p-10 max-w-4xl mx-auto">
      <p
        className="text-sm tracking-[0.2em] uppercase mb-3"
        style={{ color: "var(--muted)" }}
      >
        Équipe
      </p>
      <h1 className="text-4xl font-light mb-8">Mes travailleuses</h1>

      <ListeTravailleuses
        travailleuses={liste}
        categories={categories ?? []}
      />
    </section>
  );
}