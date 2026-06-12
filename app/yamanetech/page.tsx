import type { Metadata } from "next";
import AdminApp from "@/components/AdminApp";

export const metadata: Metadata = {
  title: "YamaneTech Admin",
  robots: { index: false, follow: false }, // route secrète : pas d'indexation
};

export default function YamaneTechPage() {
  return <AdminApp />;
}
