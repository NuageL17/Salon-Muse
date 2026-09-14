type Props = {
  titre: string;
  description: string;
};

export function EnConstruction({ titre, description }: Props) {
  return (
    <section className="p-6 md:p-10 max-w-4xl mx-auto">
      <p
        className="text-sm tracking-[0.2em] uppercase mb-3"
        style={{ color: "var(--muted)" }}
      >
        Section
      </p>
      <h1 className="text-4xl font-light mb-6">{titre}</h1>

      <div className="p-10 rounded-2xl border border-dashed border-neutral-300 text-center">
        <p className="text-3xl mb-4">🚧</p>
        <p className="text-base mb-2">Bientôt disponible</p>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {description}
        </p>
      </div>
    </section>
  );
}