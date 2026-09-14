import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MenuProfil } from "@/components/layout/MenuProfil";
import { PopupNotifications } from "@/components/notifications/PopupNotifications";
import { BoutonReserver } from "@/components/layout/BoutonReserver";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: {
    role: string;
    prenom: string | null;
    points_fidelite: number | null;
  } | null = null;

  if (user) {
    const supabaseAdmin = createAdminClient();
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("role, prenom, points_fidelite")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  const estConnectee = !!user && profile?.role === "cliente";
  const estGerante = profile?.role === "gerante";

  return (
    <main className="min-h-screen">
      {estConnectee && <PopupNotifications />}

      {estGerante && (
        <div
          className="text-center text-sm py-3"
          style={{ background: "#c9a87c", color: "white" }}
        >
          Vous êtes connectée en tant que gérante ·{" "}
          <Link href="/admin" className="underline font-medium">
            Accéder au dashboard
          </Link>
        </div>
      )}

      <header className="border-b border-neutral-200">
        <nav className="mx-auto max-w-6xl flex items-center justify-between p-6">
          <Link href="/" className="text-xl font-medium tracking-wide">
            Salon Muse
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/prestations" className="hover:opacity-60">
              Prestations
            </Link>
            <Link href="/galerie" className="hover:opacity-60">
              Galerie
            </Link>
            <Link href="/contact" className="hover:opacity-60">
              Contact
            </Link>

            {user && profile ? (
              <MenuProfil
                prenom={profile.prenom}
                pointsFidelite={profile.points_fidelite ?? 0}
              />
            ) : (
              <Link href="/connexion" className="hover:opacity-60">
                Connexion
              </Link>
            )}

            <BoutonReserver
              estConnectee={estConnectee}
              className="px-4 py-2 rounded-full text-white"
              style={{ background: "var(--accent)" }}
            >
              Prendre RDV
            </BoutonReserver>
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <p
          className="text-sm tracking-[0.2em] uppercase mb-4"
          style={{ color: "var(--muted)" }}
        >
          Beauté &amp; bien-être
        </p>
        <h1 className="text-5xl md:text-6xl font-light leading-tight mb-6">
          Prenez soin de vous,
          <br />
          <span style={{ color: "var(--accent-dark)" }}>
            on s&apos;occupe du reste.
          </span>
        </h1>
        <p className="text-lg mb-10" style={{ color: "var(--muted)" }}>
          Réservez votre soin en ligne en moins de 30 secondes.
        </p>

        <BoutonReserver
          estConnectee={estConnectee}
          className="inline-block px-8 py-4 rounded-full text-white text-lg transition hover:opacity-90"
          style={{ background: "var(--accent)" }}
        >
          Réserver maintenant
        </BoutonReserver>
      </section>
    </main>
  );
}