import React from "react";

/**
 * Composant Placeholder pour Google AdSense.
 * En production, remplacez le contenu par le code snippet fourni par Google AdSense.
 */
export default function AdSensePlaceholder({
  slotId,
  format = "auto",
  className = "",
}: {
  slotId: string;
  format?: "auto" | "fluid" | "rectangle";
  className?: string;
}) {
  return (
    <div className={`w-full flex justify-center items-center overflow-hidden rounded-lg bg-gray-100 dark:bg-dark-900 border-[1.5px] border-dashed border-gray-300 dark:border-dark-border p-4 my-6 text-center ${className}`}>
      <div className="flex flex-col items-center opacity-60">
        <span className="text-[1.5rem] mb-1">📢</span>
        <span className="text-[.75rem] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Espace Publicitaire AdSense</span>
        <span className="text-[.65rem] text-gray-400 dark:text-gray-500 mt-1">Slot: {slotId} ({format})</span>
      </div>
      
      {/* 
        TODO: En production, insérez le script AdSense ici. Exemple :
        <ins className="adsbygoogle"
             style={{ display: "block" }}
             data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
             data-ad-slot={slotId}
             data-ad-format={format}
             data-full-width-responsive="true"></ins>
        <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
      */}
    </div>
  );
}
