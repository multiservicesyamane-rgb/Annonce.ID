import type { Metadata } from "next";
import { BRAND } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Maintenance en cours",
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gray-50 px-4 dark:bg-[#0D1117]">
      <div className="w-full max-w-[440px] rounded-[20px] border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#161B22]">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-[2rem]">
          🛠️
        </div>
        <h1 className="font-display text-[1.35rem] font-extrabold text-gray-900 dark:text-white">
          Site en maintenance
        </h1>
        <p className="mt-2 text-[.9rem] leading-relaxed text-gray-500 dark:text-gray-400">
          {BRAND.name} est momentanément indisponible, le temps d'une petite mise à jour.
          Merci de revenir dans quelques minutes.
        </p>
        <a
          href="https://wa.me/221776827851"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex min-h-[46px] items-center justify-center rounded-[10px] bg-[#25D366] px-5 text-[.9rem] font-bold text-white transition hover:bg-[#1da851]"
        >
          Nous contacter sur WhatsApp
        </a>
      </div>
    </div>
  );
}
