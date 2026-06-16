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
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-wa w-full py-3.5 text-[1.05rem] font-bold">
              💬 Discuter sur WhatsApp
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
