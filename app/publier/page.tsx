import type { Metadata } from "next";
import { Suspense } from "react";
import PublishWizard from "@/components/PublishWizard";

export const metadata: Metadata = {
  title: "Publier une annonce",
  description: "Publiez votre annonce gratuitement en 5 étapes sur Annonce.ID.",
};

export default function PublierPage() {
  return (
    <div className="mx-auto my-2 md:my-6 w-full max-w-[1600px] px-2 md:px-4 lg:px-8">
      <Suspense fallback={<div className="p-6 text-center animate-pulse text-gray-500">Chargement...</div>}>
        <PublishWizard />
      </Suspense>
    </div>
  );
}
