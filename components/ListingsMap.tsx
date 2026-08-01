"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { MapPoint } from "@/lib/geo";

/** Prix compact pour la pastille : 2 750 000 → « 2,7M », 450 000 → « 450K ». */
function compactPrice(raw: string): string {
  const n = Number(String(raw || "").replace(/\D/g, "")) || 0;
  if (!n) return "Voir";
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `${m >= 10 ? Math.round(m) : m.toFixed(1).replace(".0", "").replace(".", ",")}M`;
  }
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return String(n);
}

function fullPrice(raw: string): string {
  const n = Number(String(raw || "").replace(/\D/g, "")) || 0;
  return n ? `${n.toLocaleString("fr-FR")} FCFA` : "Prix sur demande";
}

const escapeHtml = (s: string) =>
  String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

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
      const popupWidth = isSmall ? 150 : 178;

      const map = L.map(boxRef.current, {
        scrollWheelZoom: false, // ne capture pas le scroll de la page
        zoomControl: !isSmall, // sur mobile on zoome aux doigts : plus de place
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
        const label = compactPrice(p.price);
        const icon = L.divIcon({
          className: "",
          iconSize: [58, 26],
          iconAnchor: [29, 26],
          html: `<div style="display:flex;align-items:center;justify-content:center;
                  height:24px;padding:0 9px;border-radius:9999px;white-space:nowrap;
                  background:linear-gradient(135deg,#22c55e,#F5A623);color:#0A0E14;
                  font-weight:800;font-size:11.5px;font-family:system-ui,sans-serif;
                  border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.4)">${escapeHtml(label)}</div>`,
        });

        const href = `/annonce/${p.id}/${p.slug}`;
        // La photo est dans le HTML de la bulle : le navigateur ne la télécharge
        // qu'à l'ouverture de celle-ci (au clic). Vignette compacte : elle doit
        // rester lisible sur petit écran sans manger toute la carte.
        const popup = `
          <div style="width:100%;font-family:system-ui,sans-serif">
            ${
              p.image
                ? `<a href="${href}"><img src="${escapeHtml(p.image)}" alt="" loading="lazy"
                     style="width:100%;height:78px;object-fit:cover;border-radius:8px;display:block"/></a>`
                : ""
            }
            <div style="font-weight:700;font-size:12px;line-height:1.25;margin-top:6px;color:#111;
                        display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">
              ${escapeHtml(p.title.slice(0, 60))}
            </div>
            <div style="font-weight:800;font-size:13px;color:#16a34a;margin-top:2px">${fullPrice(p.price)}</div>
            <div style="font-size:10.5px;color:#666;margin-top:1px">📍 ${escapeHtml(p.zone)}</div>
            <a href="${href}" style="display:block;text-align:center;margin-top:7px;background:#16a34a;
               color:#fff;padding:6px 10px;border-radius:7px;text-decoration:none;font-weight:700;font-size:11.5px">
              Voir l'annonce
            </a>
          </div>`;

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
    <div className="relative w-full overflow-hidden rounded-[14px] border border-white/10 bg-[#0D1420]">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 px-2.5 py-1.5 sm:px-3 sm:py-2">
        <span className="text-[.68rem] font-bold text-white sm:text-[.72rem]">📍 Les annonces près de vous</span>
        <span className="text-[.62rem] text-gray-400 sm:text-[.66rem]">
          {points.length} annonce{points.length > 1 ? "s" : ""} · {zones} zone{zones > 1 ? "s" : ""}
        </span>
      </div>
      <div className="relative">
        {/* Hauteur fixée par palier : réserve la place dès le départ (pas de CLS)
            tout en restant confortable au doigt sur mobile. */}
        <div ref={boxRef} className="h-[210px] w-full sm:h-[240px] md:h-[280px]" />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0D1420] text-[.72rem] text-gray-500">
            Chargement de la carte…
          </div>
        )}
      </div>
      <div className="px-2.5 pb-1.5 text-center text-[.6rem] leading-tight text-gray-500 sm:pb-2 sm:text-[.62rem]">
        Touchez une pastille pour voir la photo et le détail de l&apos;annonce
      </div>
    </div>
  );
}
