export default function StaticPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro?: string;
  sections: { h: string; p: string }[];
}) {
  return (
    <div className="wrap py-10">
      <div className="mx-auto max-w-[760px]">
        <h1 className="mb-2 font-display text-[1.8rem] font-extrabold text-gray-900">{title}</h1>
        {intro && <p className="mb-8 text-[.95rem] text-gray-500">{intro}</p>}
        <div className="space-y-6">
          {sections.map((s) => (
            <section key={s.h} className="rounded-lg border-[1.5px] border-gray-100 bg-white p-5">
              <h2 className="mb-2 font-display text-[1.05rem] font-bold text-green">{s.h}</h2>
              <p className="whitespace-pre-line text-[.9rem] leading-loose text-gray-700">{s.p}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
