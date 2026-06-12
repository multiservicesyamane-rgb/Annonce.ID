import Link from "next/link";
import SearchBar from "./SearchBar";

/** Header sticky sombre translucide. Le sélecteur pays est discret (détail en footer). */
export default function Header() {
  return (
    <header className="sticky top-0 z-[900] border-b border-dark-border bg-dark-900/95 backdrop-blur-md">
      <div className="mx-auto flex min-h-[64px] max-w-[1320px] flex-wrap items-center gap-3 px-4 py-2 md:flex-nowrap">
        <Link href="/" className="flex shrink-0 items-center gap-1.5 font-display text-[1.3rem] font-extrabold text-white">
          Annonce<span className="text-neon-gold">.ID</span>
          <span className="rounded-[5px] bg-grad-gold px-1.5 py-0.5 text-[.62rem] font-bold tracking-wide text-dark-900">
            27 PAYS
          </span>
        </Link>

        <div className="order-3 w-full md:order-none md:flex-1">
          <SearchBar variant="header" />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Link
            href="/connexion"
            className="btn btn-outline btn-sm hidden border-dark-border !text-white md:inline-flex"
          >
            Connexion
          </Link>
          <Link href="/publier" className="btn btn-gold btn-sm">
            + Publier
          </Link>
        </div>
      </div>
    </header>
  );
}
