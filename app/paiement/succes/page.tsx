"use client";

import Link from "next/link";
import React from "react";

export default function PaymentSuccess({ searchParams }: { searchParams: { listing_id?: string } }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-gray-50 to-white py-10 transition-colors dark:from-[#06231a] dark:via-black dark:to-black sm:py-16">
      <div className="mx-auto max-w-[540px] px-3 sm:px-4">
        <div className="overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-[0_20px_60px_-20px_rgba(16,185,129,0.4)] dark:border-white/10 dark:bg-[#111722]/90 dark:backdrop-blur-xl animate-fadeUp">
          {/* En-tête */}
          <div className="relative bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 px-5 py-9 text-center text-white sm:px-8 sm:py-11">
            <div
              className="absolute inset-0 opacity-10"
              style={{ backgroundImage: "radial-gradient(circle at 15% 20%, #fff 1.5px, transparent 1.5px)", backgroundSize: "26px 26px" }}
            />
            <div className="relative">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-[2.6rem] ring-4 ring-white/25 backdrop-blur-sm animate-bounce">
                ✅
              </div>
              <h1 className="font-display text-[1.5rem] font-extrabold sm:text-[1.8rem]">Paiement réussi !</h1>
              <p className="mt-1 text-[.9rem] text-white/85">Merci pour votre confiance 🎉</p>
            </div>
          </div>

          {/* Corps */}
          <div className="p-5 sm:p-7">
            <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 sm:p-5 dark:border-white/5 dark:bg-white/5">
              <div className="mb-3 text-[.8rem] font-extrabold uppercase tracking-wider text-gray-400">
                Que se passe-t-il maintenant ?
              </div>
              <div className="space-y-3">
                {[
                  { n: "1", t: "Paiement reçu", d: "Votre paiement a bien été enregistré.", done: true },
                  { n: "2", t: "Vérification automatique", d: "Notre système confirme la transaction (quelques secondes à quelques minutes)." },
                  { n: "3", t: "Activation du boost", d: "Votre annonce est mise en avant automatiquement — rien à faire !" },
                ].map((s) => (
                  <div key={s.n} className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[.75rem] font-extrabold ${
                        s.done
                          ? "bg-emerald-500 text-white"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                      }`}
                    >
                      {s.done ? "✓" : s.n}
                    </span>
                    <div>
                      <div className="text-[.88rem] font-bold text-gray-800 dark:text-white">{s.t}</div>
                      <div className="text-[.78rem] text-gray-500 dark:text-gray-400">{s.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-4 text-center text-[.78rem] text-gray-400">
              🧾 Un reçu vous a été envoyé par email.
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard"
                className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3.5 text-center text-[.95rem] font-extrabold text-white shadow-lg shadow-emerald-500/30 transition-all hover:scale-[1.02]"
              >
                📊 Mon tableau de bord
              </Link>
              <Link
                href="/"
                className="flex-1 rounded-2xl border-2 border-gray-200 px-4 py-3.5 text-center text-[.95rem] font-extrabold text-gray-700 transition-all hover:border-emerald-400 hover:text-emerald-600 dark:border-white/10 dark:text-gray-200 dark:hover:border-emerald-400"
              >
                🏠 Accueil
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
