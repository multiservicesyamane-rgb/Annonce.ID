import type { Metadata } from "next";
import { Suspense } from "react";
import Dashboard from "@/components/Dashboard";

export const metadata: Metadata = { title: "Tableau de bord vendeur" };

// Page authentifiée personnelle : jamais prérendue statiquement
export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Chargement…</div>}>
      <Dashboard />
    </Suspense>
  );
}
