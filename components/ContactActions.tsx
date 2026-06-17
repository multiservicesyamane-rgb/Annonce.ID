"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import FavButton from "./FavButton";

/** Boutons de contact direct (WhatsApp / Appel / Message) + partage/favori.
 *  PAS de panier — mise en relation directe (contrainte du brief). */
export default function ContactActions({ phone, title, adId, sellerId }: { phone?: string; title: string; adId?: string; sellerId?: string }) {
  const [toast, setToast] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Incrémenter les vues au montage du composant
  useEffect(() => {
    if (!adId) return;
    
    // On utilise une API route ou un simple update pour incrémenter les vues
    const incrementView = async () => {
      // Éviter de compter plusieurs fois dans la même session (et React StrictMode)
      const viewed = sessionStorage.getItem(`viewed_${adId}`);
      if (viewed) return;
      sessionStorage.setItem(`viewed_${adId}`, 'true');

      try {
        // Méthode fiable : fonction SQL atomique (SECURITY DEFINER) qui contourne
        // les règles RLS pour ce compteur. Voir la fonction increment_views en base.
        const { error } = await supabase.rpc('increment_views', { listing_id: adId });

        // Repli si la fonction n'existe pas encore en base (lecture + update)
        if (error) {
          const { data } = await supabase.from('listings').select('views').eq('id', adId).single();
          if (data) {
            await supabase.from('listings').update({ views: (data.views || 0) + 1 }).eq('id', adId);
          }
        }
      } catch (err) {
        console.error("Erreur incrementation vue:", err);
      }
    };
    
    incrementView();
  }, [adId, supabase]);

  const show = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2200);
  };
  
  const formattedPhone = phone ? phone.replace(/[^0-9+]/g, "") : "";
  const wa = formattedPhone ? `https://wa.me/${formattedPhone.replace("+", "")}?text=${encodeURIComponent(`Bonjour, votre annonce "${title}" est-elle toujours disponible ?`)}` : "#";

  const handleStartChat = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!sellerId || !adId) {
      show("Impossible de contacter le vendeur.");
      return;
    }
    
    setIsSending(true);
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData?.session) {
      router.push("/connexion");
      return;
    }

    // Auto-send the first message
    const msg = `Bonjour, l'annonce "${title}" m'intéresse. Est-elle toujours disponible ?`;
    
    const { error } = await supabase.from("messages").insert([{
      sender_id: sessionData.session.user.id,
      receiver_id: sellerId,
      listing_id: adId,
      content: msg,
      type: "text"
    }]);

    if (error) {
      show("Erreur SQL: " + error.message);
      setIsSending(false);
      return;
    }

    router.push("/dashboard?panel=messages");
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        {formattedPhone && (
          <>
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-wa w-full py-3.5 text-[1.05rem] font-bold flex items-center justify-center gap-2">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
              </svg>
              Acheter / Discuter (WhatsApp)
            </a>
            <a href={`tel:${formattedPhone}`} className="btn btn-green w-full py-3.5 text-[1.05rem] font-bold">
              📞 Appeler le vendeur
            </a>
          </>
        )}
        <button type="button" onClick={handleStartChat} disabled={isSending} className="btn w-full py-3.5 text-[1.05rem] font-bold border-2 border-green text-green hover:bg-green hover:text-white transition-colors flex items-center justify-center gap-2">
          {isSending ? "Ouverture..." : "✉ Discuter avec le vendeur"}
        </button>
      </div>

      <div className="flex gap-1.5 mt-3">
        <button
          type="button"
          onClick={() => {
            if (typeof navigator !== "undefined" && navigator.share) {
              navigator.share({ title, url: window.location.href }).catch(() => {});
            } else {
              navigator.clipboard?.writeText(window.location.href);
            }
            show("🔗 Lien copié");
          }}
          className="flex-1 rounded-lg border-[1.5px] border-gray-100 bg-white py-2 text-[.74rem] font-semibold text-gray-700 transition hover:border-gold hover:text-green flex items-center justify-center gap-1.5"
        >
          🔗 Partager
        </button>
        <div className="flex-1 flex items-center justify-center rounded-lg border-[1.5px] border-gray-100 bg-white py-2 text-[.74rem] font-semibold text-gray-700 transition hover:border-gold hover:text-red-500">
          <FavButton adId={adId} /> <span className="ml-1">Favoris</span>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-20 left-1/2 z-[9999] -translate-x-1/2 whitespace-nowrap rounded-[10px] border border-neon-gold bg-dark-900 px-5 py-2.5 text-[.88rem] font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </>
  );
}
