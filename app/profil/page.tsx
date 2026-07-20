"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getCurrentPathWithSearch, getLoginUrl } from "@/lib/authRedirect";

export default function ProfilRedirect() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace("/dashboard?panel=profile");
      } else {
        router.replace(getLoginUrl(getCurrentPathWithSearch()));
      }
    });
  }, [router, supabase]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-neon-magenta"></div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Redirection vers votre profil…</p>
      </div>
    </div>
  );
}
