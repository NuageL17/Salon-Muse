import Link from "next/link";
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
    <main className="min-h-screen">
      <header className="border-b border-neutral-200">
        <nav className="mx-auto max-w-6xl flex items-center justify-between p-6">
          <Link href="/admin" className="text-xl font-medium tracking-wide">
            Salon Muse <span className="text-xs opacity-60">· Admin</span>
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/admin" className="hover:opacity-60">
              Planning
            </Link>
            <Link href="/mon-compte" className="hover:opacity-60">
              Mon espace
            </Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-2xl px-6 py-16">
        <p
          className="text-sm tracking-[0.2em] uppercase mb-4"
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
    </main>
  );
}