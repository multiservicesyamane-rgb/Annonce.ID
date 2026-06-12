import type { Metadata } from "next";
import PublishWizard from "@/components/PublishWizard";

export const metadata: Metadata = {
  title: "Publier une annonce",
  description: "Publiez votre annonce gratuitement en 5 étapes sur Annonce.ID.",
};

export default function PublierPage() {
  return (
    <div className="mx-auto my-6 max-w-[760px] px-4">
      <PublishWizard />
    </div>
  );
}
