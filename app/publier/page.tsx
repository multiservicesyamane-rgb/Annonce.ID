import type { Metadata } from "next";
import { Suspense } from "react";
import PublishWizard from "@/components/PublishWizard";

export const metadata: Metadata = {
  title: "Publier une annonce",
  description: "Publiez votre annonce gratuitement en 5 étapes sur Annonce.ID.",
};

export default function PublierPage() {
  return (
    <div className="mx-auto my-6 w-full max-w-[1600px] px-4 lg:px-8 xl:px-12">
      <Suspense fallback={<div className="p-10 text-center animate-pulse">Chargement de l'éditeur...</div>}>
        <PublishWizard />
      </Suspense>
    </div>
  );
}
