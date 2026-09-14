import { requireGerante } from "@/lib/auth";
import { GestionHoraires } from "@/components/admin/GestionHoraires";

export default async function HorairesAdminPage() {
  const { supabase } = await requireGerante();

  const { data: horaires } = await supabase
    .from("horaires_salon")
    .select("*")
    .order("jour_semaine", { ascending: true });

  const { data: fermetures } = await supabase
    .from("fermetures_exceptionnelles")
    .select("*")
    .gte("date_fin", new Date().toISOString())
    .order("date_debut", { ascending: true });

  return (
    <section className="p-6 md:p-10 max-w-3xl mx-auto">
      <p
        className="text-sm tracking-[0.2em] uppercase mb-3"
        style={{ color: "var(--muted)" }}
      >
        Configuration
      </p>
      <h1 className="text-4xl font-light mb-8">Horaires &amp; congés</h1>

      <GestionHoraires
        horaires={horaires ?? []}
        fermetures={fermetures ?? []}
      />
    </section>
  );
}