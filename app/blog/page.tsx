import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog & Actualités | Annonces.sn",
  description: "Dernières actualités sur les prix, les produits et le marché en Afrique de l'Ouest.",
};

// Revalidate every hour
export const revalidate = 3600;

interface Article {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  description: string;
}

async function fetchGoogleNews(): Promise<Article[]> {
  try {
    const url = "https://news.google.com/rss/search?q=prix+produits+marche+senegal+afrique&hl=fr&gl=SN&ceid=SN:fr";
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) return [];

    const xmlText = await response.text();
    
    // Simple regex parser for RSS XML
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const items: string[] = [];
    let match;
    while ((match = itemRegex.exec(xmlText)) !== null) {
      items.push(match[1]);
    }

    const articles = items.map(item => {
      const getTagContent = (tag: string) => {
        const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`);
        const m = item.match(regex);
        if (!m) return "";
        let content = m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
        // Clean up basic HTML tags if any
        content = content.replace(/<\/?[^>]+(>|$)/g, "");
        return content.trim();
      };

      return {
        title: getTagContent("title"),
        link: getTagContent("link"),
        pubDate: getTagContent("pubDate"),
        source: getTagContent("source"),
        description: getTagContent("description").substring(0, 150) + "..."
      };
    });

    return articles;
  } catch (error) {
    console.error("Erreur lors de la récupération des actualités:", error);
    return [];
  }
}

export default async function BlogIndexPage() {
  const articles = await fetchGoogleNews();

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 pb-20">
      <div className="mb-10 text-center">
        <h1 className="font-display text-[2.5rem] font-black text-gray-900 dark:text-white mb-3">Blog & Actualités</h1>
        <p className="text-gray-500 text-[1.1rem]">Actualités en temps réel sur les prix, produits et le marché au Sénégal et en Afrique.</p>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-20 text-gray-500 dark:text-gray-400">
          <span className="text-4xl mb-4 block">📰</span>
          <p>Aucune actualité disponible pour le moment. Réessayez plus tard.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, index) => {
            const dateObj = new Date(article.pubDate);
            const formattedDate = isNaN(dateObj.getTime()) 
              ? article.pubDate 
              : new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(dateObj);

            return (
              <a 
                key={index} 
                href={article.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex flex-col bg-white dark:bg-dark-800 rounded-2xl border-[1.5px] border-gray-100 dark:border-dark-border overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex justify-between items-center mb-4 text-[.75rem] font-bold">
                    <span className="text-green uppercase tracking-wider bg-green/10 px-2 py-1 rounded">
                      {article.source || "Google Actualités"}
                    </span>
                    <span className="text-gray-400 dark:text-gray-500">
                      {formattedDate}
                    </span>
                  </div>
                  
                  <h2 className="font-display text-[1.1rem] font-bold leading-snug mb-3 text-gray-900 dark:text-white group-hover:text-green transition-colors line-clamp-3">
                    {article.title}
                  </h2>
                  
                  <p className="text-gray-500 text-[.9rem] mb-4 line-clamp-3 flex-1">
                    {article.description}
                  </p>
                  
                  <div className="flex items-center text-[.8rem] text-dark-900 dark:text-white mt-auto border-t border-gray-50 dark:border-dark-border pt-4 font-bold group-hover:text-green transition-colors">
                    Lire l'article complet 
                    <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
