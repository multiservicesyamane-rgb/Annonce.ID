import type { Metadata } from "next";
import Dashboard from "@/components/Dashboard";

export const metadata: Metadata = { title: "Tableau de bord vendeur" };

export default function DashboardPage() {
  return <Dashboard />;
}
