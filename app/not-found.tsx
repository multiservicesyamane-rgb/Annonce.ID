import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-grad-hero px-4 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(at_50%_30%,rgba(245,166,35,.2)_0,transparent_50%)]" />
      <div className="relative z-10">
        <div className="font-display text-[5rem] font-extrabold text-neon-gold [text-shadow:0_0_24px_rgba(255,201,60,.5)]">404</div>
        <h1 className="mb-2 font-display text-[1.4rem] font-bold text-white">Page introuvable</h1>
        <p className="mb-6 text-white/60">Cette annonce ou cette page n&apos;existe pas ou a expiré.</p>
        <Link href="/" className="btn btn-gold btn-lg">Retour à l&apos;accueil</Link>
      </div>
    </div>
  );
}
