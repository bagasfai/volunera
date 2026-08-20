export function SectionHead({
  eyebrow,
  title,
  lede,
  id,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  id?: string;
}) {
  return (
    <header className="section-head">
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id}>{title}</h2>
      {lede && <p className="section-head__lede">{lede}</p>}
    </header>
  );
}
