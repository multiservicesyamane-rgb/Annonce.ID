"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function FavorisRedirect() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace("/dashboard?panel=favorites");
      } else {
        router.replace("/connexion");
      }
    });
  }, [router, supabase]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-neon-magenta"></div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Chargement de vos favoris…</p>
      </div>
    </div>
  );
}
