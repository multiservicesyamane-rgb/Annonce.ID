import { redirect, notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

// Lien court professionnel : wanteermako.com/<slug>
// Retrouve l'annonce par son slug et redirige vers la fiche canonique
// /annonce/<id>/<slug>. Les routes statiques (/contact, /blog, …) restent
// prioritaires : seules les URLs inconnues d'un seul segment arrivent ici.

// Force server-side rendering at request time — this page hits Supabase
// at runtime so it must never be statically pre-rendered at build time.
export const dynamic = "force-dynamic";

type Props = { params: { slug: string } };

export default async function ShortLink({ params }: Props) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Env vars are missing at build time — treat as not found rather than crashing.
  if (!supabaseUrl || !supabaseKey) notFound();

  const supabase = createClient(supabaseUrl, supabaseKey);

  const slug = decodeURIComponent(params.slug || "");
  if (!slug) notFound();

  const { data } = await supabase
    .from("listings")
    .select("id, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (!data) notFound();
  redirect(`/annonce/${data.id}/${data.slug}`);
}
