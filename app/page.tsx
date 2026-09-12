import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Header */}
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
            <Link href="/connexion" className="hover:opacity-60">
              Connexion
            </Link>
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

      {/* Hero */}
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
        <Link
          href="/reservation"
          className="inline-block px-8 py-4 rounded-full text-white text-lg transition hover:opacity-90"
          style={{ background: "var(--accent)" }}
        >
          Réserver maintenant
        </Link>
      </section>
    </main>
  );
}