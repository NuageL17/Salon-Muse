import { requireGerante } from "@/lib/auth";
import { ListePrestations } from "@/components/admin/ListePrestations";
import type { Prestation } from "@/lib/types/database";

export default async function PrestationsAdminPage() {
  const { supabase } = await requireGerante();

  const { data: prestations, error } = await supabase
    .from("prestations")
    .select("*")
    .order("ordre_affichage", { ascending: true });

  return (
    <section className="p-6 md:p-10 max-w-5xl mx-auto">
      <p
        className="text-sm tracking-[0.2em] uppercase mb-3"
        style={{ color: "var(--muted)" }}
      >
        Gestion
      </p>
      <h1 className="text-4xl font-light mb-8">Prestations</h1>

      {error ? (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error.message}
        </div>
      ) : (
        <ListePrestations
          prestations={(prestations ?? []) as Prestation[]}
        />
      )}
    </section>
  );
}