"use client";

import { useState } from "react";

/**
 * Enregistre l'onglet en vidéo (.webm) pendant `seconds` puis télécharge.
 * Utilise l'API du navigateur (getDisplayMedia + MediaRecorder). L'utilisateur
 * choisit « cet onglet » dans la fenêtre du navigateur. (Chrome/Edge recommandés.)
 */
export default function RecordButton({ filename, seconds = 24 }: { filename: string; seconds?: number }) {
  const [rec, setRec] = useState(false);
  const [left, setLeft] = useState(0);

  async function start() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getDisplayMedia) {
      alert("Votre navigateur ne supporte pas l'enregistrement. Utilisez Chrome/Edge sur PC, ou un enregistreur d'écran.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 } as MediaTrackConstraints, audio: false });
      const mime = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find((m) => MediaRecorder.isTypeSupported(m)) || "video/webm";
      const mr = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
      const chunks: BlobPart[] = [];
      mr.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `${filename}.webm`; a.click();
        URL.revokeObjectURL(url);
        setRec(false); setLeft(0);
      };
      setRec(true); setLeft(seconds);
      mr.start();
      const iv = setInterval(() => setLeft((v) => (v > 1 ? v - 1 : 0)), 1000);
      const stop = () => { clearInterval(iv); if (mr.state !== "inactive") mr.stop(); };
      setTimeout(stop, seconds * 1000);
      stream.getVideoTracks()[0].addEventListener("ended", stop); // si l'utilisateur arrête le partage
    } catch (e) {
      console.error("Enregistrement annulé:", e);
      setRec(false); setLeft(0);
    }
  }

  return (
    <button
      onClick={start}
      disabled={rec}
      className="rounded-lg bg-gradient-to-r from-[#FF2A6D] to-[#FFC93C] px-3.5 py-1.5 text-[.75rem] font-bold text-white shadow disabled:opacity-70"
    >
      {rec ? `⏺ Enregistrement… ${left}s` : "🎥 Télécharger la vidéo"}
    </button>
  );
}
