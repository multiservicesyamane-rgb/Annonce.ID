"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { MapPoint } from "@/lib/geo";

function fullPrice(raw: string): string {
  const n = Number(String(raw || "").replace(/\D/g, "")) || 0;
  return n ? `${n.toLocaleString("fr-FR")} FCFA` : "Prix sur demande";
}

const escapeHtml = (s: string) =>
  String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Icône + couleur par catégorie (marqueurs en goutte, façon annuaire). */
const CATEGORY_PIN: Record<string, { icon: string; color: string }> = {
  vehicules: { icon: "🚗", color: "#E91E63" },
  immobilier: { icon: "🏠", color: "#3F51B5" },
  electronique: { icon: "📱", color: "#E040FB" },
  maison: { icon: "🛋️", color: "#009688" },
  mode: { icon: "👗", color: "#FF5722" },
  emploi: { icon: "💼", color: "#607D8B" },
  services: { icon: "🔧", color: "#03A9F4" },
  sport: { icon: "⚽", color: "#4CAF50" },
  "equipements-pro": { icon: "🏗️", color: "#795548" },
  agriculture: { icon: "🌾", color: "#8BC34A" },
  animaux: { icon: "🐾", color: "#FF9800" },
  entreprises: { icon: "🏢", color: "#9C27B0" },
  alimentation: { icon: "☕", color: "#6D4C41" },
  numerique: { icon: "💻", color: "#00BCD4" },
};
const DEFAULT_PIN = { icon: "🏷️", color: "#16a34a" };
const pinFor = (slug: string) => CATEGORY_PIN[String(slug || "").toLowerCase()] || DEFAULT_PIN;

/**
 * Carte des annonces (Leaflet + tuiles OpenStreetMap, sans clé API).
 * Une pastille PRIX par annonce ; la photo n'est chargée qu'au clic, dans la
 * bulle — les images ne pèsent donc pas sur le chargement de la page.
 * Leaflet est importé dynamiquement et la hauteur est fixée (pas de CLS).
 */
export default function ListingsMap({ points }: { points: MapPoint[] }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const roRef = useRef<ResizeObserver | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !boxRef.current || mapRef.current) return;

      // Bulle plus étroite sur petit écran pour ne pas recouvrir la carte.
      const isSmall = typeof window !== "undefined" && window.innerWidth < 480;
      const popupWidth = isSmall ? 250 : 290;

      const map = L.map(boxRef.current, {
        scrollWheelZoom: false, // ne capture pas le scroll de la page
        zoomControl: true,
      });
      mapRef.current = map;

      // Leaflet ne se redessine pas tout seul quand son conteneur change de
      // taille (rotation de l'écran, passage mobile/desktop) → tuiles grises.
      if (typeof ResizeObserver !== "undefined") {
        const ro = new ResizeObserver(() => mapRef.current?.invalidateSize());
        ro.observe(boxRef.current);
        roRef.current = ro;
      }

      // Fond « Plan » : CartoDB Voyager — même données OpenStreetMap, mais une
      // cartographie bien plus lisible (commerces, rues, quartiers). Gratuit,
      // sans clé API. On n'active PAS les tuiles retina (@2x) : 4x plus de
      // données, inadapté à une audience majoritairement en 4G.
      const plan = L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CARTO',
        subdomains: "abcd",
        maxZoom: 20,
      }).addTo(map);

      const satellite = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { attribution: "Imagerie &copy; Esri", maxZoom: 19 },
      );

      L.control.layers({ Plan: plan, Satellite: satellite }, undefined, { position: "topright" }).addTo(map);

      const coords: [number, number][] = [];

      for (const p of points) {
        const pin = pinFor(p.categorySlug);
        // Marqueur en goutte : cercle dont un coin est carré, pivoté de 45°.
        const icon = L.divIcon({
          className: "",
          iconSize: [40, 52],
          iconAnchor: [20, 50],
          popupAnchor: [0, -46],
          html: `<div style="position:relative;width:40px;height:52px">
                   <div style="position:absolute;top:0;left:0;width:40px;height:40px;
                        background:${pin.color};border:3px solid #fff;
                        border-radius:50% 50% 50% 0;transform:rotate(-45deg);
                        box-shadow:0 3px 10px rgba(0,0,0,.35)"></div>
                   <div style="position:absolute;top:0;left:0;width:40px;height:40px;
                        display:flex;align-items:center;justify-content:center;
                        font-size:17px;line-height:1">${pin.icon}</div>
                 </div>`,
        });

        const href = `/annonce/${p.id}/${p.slug}`;
        // La photo est dans le HTML de la bulle : le navigateur ne la télécharge
        // qu'à l'ouverture de celle-ci (au clic). Vignette compacte : elle doit
        // rester lisible sur petit écran sans manger toute la carte.
        // Bulle horizontale : photo à gauche, informations à droite.
        const popup = `
          <a href="${href}" style="display:flex;gap:10px;align-items:center;text-decoration:none;
             color:inherit;font-family:system-ui,sans-serif;width:100%">
            ${
              p.image
                ? `<img src="${escapeHtml(p.image)}" alt="" loading="lazy"
                     style="width:86px;height:86px;flex:0 0 86px;object-fit:cover;border-radius:8px;
                     border:1px solid #eee;display:block"/>`
                : ""
            }
            <div style="min-width:0;flex:1">
              <div style="font-weight:700;font-size:13px;line-height:1.3;color:#111;
                          display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">
                ${escapeHtml(p.title)}
              </div>
              <div style="font-weight:800;font-size:14px;color:#16a34a;margin-top:4px">${fullPrice(p.price)}</div>
              <div style="font-size:11px;color:#888;margin-top:3px">
                ${pin.icon} ${escapeHtml(p.category || "Annonce")}
              </div>
              <div style="font-size:11px;color:#888;margin-top:1px">📍 ${escapeHtml(p.zone)}</div>
            </div>
          </a>`;

        L.marker([p.lat, p.lng], { icon, title: p.title })
          .addTo(map)
          .bindPopup(popup, { minWidth: popupWidth, maxWidth: popupWidth, autoPanPadding: [12, 12] });

        coords.push([p.lat, p.lng]);
      }

      if (coords.length > 1) map.fitBounds(coords, { padding: [45, 45], maxZoom: 13 });
      else if (coords.length === 1) map.setView(coords[0], 13);
      else map.setView([14.6928, -17.4467], 10); // Dakar par défaut

      setReady(true);
    })();

    return () => {
      cancelled = true;
      roRef.current?.disconnect();
      roRef.current = null;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [points]);

  const zones = new Set(points.map((p) => p.zone)).size;

  return (
    <div className="relative w-full overflow-hidden bg-[#0D1420]">
      {/* Carte plein cadre. Hauteur fixée par palier : la place est réservée
          dès le premier rendu (pas de décalage / CLS). */}
      <div ref={boxRef} className="h-[420px] w-full sm:h-[440px] md:h-[500px]" />

      {!ready && (
        <div className="absolute inset-0 z-[1200] flex items-center justify-center bg-[#0D1420] text-[.75rem] text-gray-400">
          Chargement de la carte…
        </div>
      )}

      {/* Compteur discret, posé sur la carte (au-dessus des contrôles Leaflet) */}
      <div className="pointer-events-none absolute bottom-2 left-2 z-[1100] rounded-full bg-black/65 px-2.5 py-1 text-[.65rem] font-semibold text-white backdrop-blur-sm">
        {points.length} annonce{points.length > 1 ? "s" : ""} · {zones} zone{zones > 1 ? "s" : ""}
      </div>
    </div>
  );
}
