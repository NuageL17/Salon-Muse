import { requireGerante } from "@/lib/auth";
import { FormulaireNotif } from "./FormulaireNotif";

export default async function AdminNotificationsPage() {
  const { supabase } = await requireGerante();

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("cliente_id");

  const clientsUniques = new Set(
    (subscriptions ?? []).map((s) => s.cliente_id)
  );

  return (
    <section className="p-6 md:p-10 max-w-2xl mx-auto">
      <p
        className="text-sm tracking-[0.2em] uppercase mb-3"
        style={{ color: "var(--muted)" }}
      >
        Communication
      </p>
      <h1 className="text-4xl font-light mb-4">Envoyer une notification</h1>
      <p className="text-sm mb-10" style={{ color: "var(--muted)" }}>
        {clientsUniques.size} cliente{clientsUniques.size > 1 ? "s" : ""}{" "}
        {clientsUniques.size > 1 ? "recevront" : "recevra"} votre message.
      </p>

      <FormulaireNotif />
    </section>
  );
}