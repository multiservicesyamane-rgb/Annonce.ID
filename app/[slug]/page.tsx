import { redirect, notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

// Lien court professionnel : wanteermako.com/<slug>
// Retrouve l'annonce par son slug et redirige vers la fiche canonique
// /annonce/<id>/<slug>. Les routes statiques (/contact, /blog, …) restent
// prioritaires : seules les URLs inconnues d'un seul segment arrivent ici.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

type Props = { params: { slug: string } };

export default async function ShortLink({ params }: Props) {
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
