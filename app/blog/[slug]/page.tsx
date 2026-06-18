import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ARTICLES } from "@/lib/blogData";
import ShareButton from "@/components/ShareButton";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = ARTICLES.find((a) => a.slug === params.slug);
  if (!article) return { title: "Article introuvable" };
  
  return {
    title: `${article.title} | Blog Wanteermako`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      images: [{ url: article.image }],
      type: "article",
    },
  };
}

export default function BlogPostPage({ params }: Props) {
  const article = ARTICLES.find((a) => a.slug === params.slug);
  if (!article) notFound();

  // Basic markdown-to-html conversion for the blog content
  const htmlContent = article.content
    .replace(/^### (.*$)/gim, '<h3 class="font-display text-[1.4rem] font-bold mt-8 mb-4 text-gray-900 dark:text-white">$1</h3>')
    .replace(/^\- (.*$)/gim, '<li class="ml-4 mb-2 list-disc">$1</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');

  const related = ARTICLES.filter(a => a.slug !== article.slug).slice(0, 3);

  return (
    <div className="mx-auto max-w-[800px] px-4 py-8 md:py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 text-[.85rem] text-gray-500">
        <Link href="/" className="text-green hover:underline">Accueil</Link> ›{" "}
        <Link href="/blog" className="text-green hover:underline">Blog</Link> ›{" "}
        <span className="text-gray-900 dark:text-white">{article.title}</span>
      </nav>

      {/* Header */}
      <div className="mb-8 text-center">
        <div className="text-[.85rem] font-bold text-gold uppercase tracking-wider mb-3">{article.category}</div>
        <h1 className="font-display text-[2rem] md:text-[3rem] font-black leading-tight text-gray-900 dark:text-white mb-6">
          {article.title}
        </h1>
        <div className="flex items-center justify-center gap-4 text-gray-500 text-[.9rem]">
          <span>📅 {article.date}</span>
          <span>✍️ Équipe Wanteermako</span>
          <ShareButton title={article.title} />
        </div>
      </div>

      {/* Featured Image */}
      <div className="w-full aspect-video rounded-2xl overflow-hidden mb-10 shadow-lg">
        <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
      </div>

      {/* Content */}
      <article 
         className="prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />

      {/* CTA Box */}
      <div className="mt-12 bg-green/10 dark:bg-green/5 border border-green/20 rounded-2xl p-8 text-center">
        <h3 className="font-bold text-[1.4rem] text-gray-900 dark:text-white mb-3">Prêt à faire de bonnes affaires ?</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">Rejoignez des milliers de Sénégalais qui vendent et achètent chaque jour sur Wanteermako.</p>
        <Link href="/publier" className="btn btn-green shadow-xl">Publier une annonce gratuite</Link>
      </div>

      {/* Related Articles */}
      <div className="mt-16 pt-10 border-t border-gray-100 dark:border-dark-border">
        <h3 className="font-display text-[1.5rem] font-bold mb-6 text-gray-900 dark:text-white">Derniers articles</h3>
        <div className="grid sm:grid-cols-3 gap-6">
          {related.map(r => (
            <Link key={r.slug} href={`/blog/${r.slug}`} className="group">
              <div className="aspect-video rounded-xl overflow-hidden mb-3">
                <img src={r.image} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
              <h4 className="font-bold text-[1rem] leading-snug group-hover:text-green transition-colors">{r.title}</h4>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
