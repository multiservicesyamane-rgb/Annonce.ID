import Link from "next/link";
import { COUNTRIES } from "@/lib/constants";

/** Footer sombre + SÉLECTEUR 27 PAYS en bas (exigence du brief). */
export default function Footer() {
  return (
    <footer className="bg-dark-900 px-4 pb-6 pt-10 text-white/60">
      <div className="mx-auto grid max-w-[1320px] gap-8 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div>
          <span className="inline-flex items-center rounded-lg bg-white px-2.5 py-1.5 shadow-sm">
            <img src="/logo-full.jpg" alt="Wanteermako" className="h-8 w-auto object-contain" />
          </span>
          <p className="mt-2.5 max-w-[230px] text-[.8rem] leading-relaxed">
            La première plateforme de petites annonces premium d'Afrique de l'Ouest. Simple, rapide, de confiance.
          </p>
          <div className="mt-3 flex gap-2">
            {[
              { s: "💬", label: "Chaîne WhatsApp", href: "https://whatsapp.com/channel/0029Vb7qR3c6RGJAcYWa8L1I" },
              { s: "✈️", label: "Telegram", href: "https://t.me/wanteermako" },
              { s: "📘", label: "Facebook", href: "https://www.facebook.com/wanteermako" },
            ].map((it) => (
              <a
                key={it.label}
                href={it.href}
                target="_blank"
                rel="noopener noreferrer"
                title={it.label}
                aria-label={it.label}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-white/10 transition hover:bg-gold hover:shadow-glow-gold"
              >
                {it.s}
              </a>
            ))}
          </div>
        </div>

        <FooterCol title="Catégories">
          <FooterLink href="/categorie/immobilier">Immobilier</FooterLink>
          <FooterLink href="/categorie/vehicules">Véhicules</FooterLink>
          <FooterLink href="/categorie/electronique">Électronique</FooterLink>
          <FooterLink href="/categorie/emploi">Emploi</FooterLink>
        </FooterCol>

        <FooterCol title="Aide & Actualités">
          <FooterLink href="/aide">Comment publier</FooterLink>
          <FooterLink href="/securite">Sécurité</FooterLink>
          <FooterLink href="/blog">Blog & Actualités</FooterLink>
          <FooterLink href="/cgu">CGU</FooterLink>
        </FooterCol>

        <FooterCol title="Compte">
          <FooterLink href="/connexion">Connexion</FooterLink>
          <FooterLink href="/dashboard">Mes annonces</FooterLink>
          <FooterLink href="/boutiques">Boutiques</FooterLink>
          <FooterLink href="/publier">✦ Premium</FooterLink>
        </FooterCol>
      </div>



      <div className="mx-auto mt-8 flex max-w-[1320px] flex-wrap items-center justify-between gap-3 border-t border-dark-border pt-4 text-[.75rem]">
        <p>© {new Date().getFullYear()} Wanteermako by YamaneTech · Tous droits réservés</p>
        <p className="text-white/30">FCFA · Français</p>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-3 font-display text-[.85rem] font-bold text-white">{title}</h4>
      <ul className="flex flex-col gap-1.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-[.8rem] transition hover:text-neon-gold">
        {children}
      </Link>
    </li>
  );
}
