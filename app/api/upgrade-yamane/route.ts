import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  let html = "";
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    let supabase;
    let methodUsed = "";

    if (supabaseUrl && supabaseServiceKey) {
      supabase = createClient(supabaseUrl, supabaseServiceKey);
      methodUsed = "Service Role Admin (Contourne RLS)";
    } else {
      supabase = createServerClient();
      methodUsed = "Client Session Utilisateur (Dépend des cookies de connexion)";
    }

    if (!supabase) {
      throw new Error("Impossible d'initialiser le client Supabase.");
    }

    // Diagnostics : Tester la connexion de base
    const { data: testData, error: testError } = await supabase.from("profiles").select("email").limit(5);

    if (testError) {
      html = `
        <div style="font-family: sans-serif; padding: 30px; max-width: 600px; margin: 50px auto; border: 1px solid #ffcccc; background-color: #fff5f5; border-radius: 12px;">
          <h2 style="color: #d32f2f;">Erreur de connexion à Supabase</h2>
          <p>Le serveur n'a pas pu se connecter ou exécuter la requête sur la table <strong>profiles</strong>.</p>
          <pre style="background: #eee; padding: 15px; border-radius: 6px; overflow-x: auto; font-family: monospace;">
Code d'erreur: ${testError.code || "aucun"}
Message: ${testError.message || "aucun"}
Détails: ${testError.details || "aucun"}
URL Supabase: ${supabaseUrl || "Non définie"}
Clé Anon présente: ${supabaseAnonKey ? "Oui" : "Non"}
Clé Admin présente: ${supabaseServiceKey ? "Oui" : "Non"}
          </pre>
          <p style="font-size: 0.9em; color: #666;">Méthode : ${methodUsed}</p>
        </div>
      `;
      return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    // 1. Détecter l'utilisateur connecté ou rechercher le profil
    let targetUserId = "";
    let userEmail = "";
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userEmail = user.email || "";
      targetUserId = user.id;
    }

    // Si pas d'utilisateur connecté ou si ce n'est pas le bon, on cherche dans les profils
    if (userEmail !== "multiservicesyamane@gmail.com") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", "multiservicesyamane@gmail.com")
        .single();
      
      if (profile) {
        targetUserId = profile.id;
        userEmail = "multiservicesyamane@gmail.com";
      }
    }

    if (!targetUserId) {
      const emailsList = testData?.map(p => p.email).join(", ") || "Aucun profil trouvé dans la table (table vide)";

      html = `
        <div style="font-family: sans-serif; padding: 30px; max-width: 600px; margin: 50px auto; border: 1px solid #ffcccc; background-color: #fff5f5; border-radius: 12px; text-align: center;">
          <h2 style="color: #d32f2f;">Erreur : Profil non trouvé</h2>
          <p>Le compte <strong>multiservicesyamane@gmail.com</strong> n'a pas été trouvé dans la base de données.</p>
          <p style="font-size: 0.9em; color: #666;">Méthode : ${methodUsed}</p>
          <p style="font-size: 0.95em; margin-top: 20px;"><strong>Profils récents enregistrés en base :</strong><br>${emailsList}</p>
          <p style="margin-top: 30px;"><a href="/connexion" style="background-color: #2e7d32; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold;">Se connecter d'abord</a></p>
        </div>
      `;
      return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    // 2. Mettre à jour toutes les annonces de cet utilisateur
    const { data: updatedListings, error: updateError } = await supabase
      .from("listings")
      .update({
        status: "active",
        premium: true,
        is_premium: true,
        featured: true,
        is_featured: true
      })
      .eq("user_id", targetUserId)
      .select();

    if (updateError) {
      html = `
        <div style="font-family: sans-serif; padding: 30px; max-width: 600px; margin: 50px auto; border: 1px solid #ffcccc; background-color: #fff5f5; border-radius: 12px;">
          <h2 style="color: #d32f2f;">Erreur de mise à jour des annonces</h2>
          <p>La base de données a rejeté la mise à jour (RLS active).</p>
          <pre style="background: #eee; padding: 15px; border-radius: 6px; overflow-x: auto;">${JSON.stringify(updateError, null, 2)}</pre>
          <p style="font-size: 0.9em; color: #666;">Méthode : ${methodUsed}</p>
        </div>
      `;
      return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    html = `
      <div style="font-family: sans-serif; padding: 30px; max-width: 600px; margin: 50px auto; border: 1px solid #c8e6c9; background-color: #e8f5e9; border-radius: 12px; text-align: center;">
        <h2 style="color: #2e7d32;">✅ Succès !</h2>
        <p>Toutes les annonces du compte <strong>${userEmail}</strong> ont été mises à jour.</p>
        <div style="margin: 20px 0; background: white; padding: 15px; border-radius: 8px; font-weight: bold; font-size: 1.1em; border: 1px solid #a5d6a7;">
          ${updatedListings?.length || 0} annonce(s) passée(s) au statut Premium et À la Une.
        </div>
        <p style="font-size: 0.85em; color: #666;">Méthode utilisée : ${methodUsed}</p>
        <p style="margin-top: 30px;"><a href="/" style="background-color: #2e7d32; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold;">Retourner à l'accueil</a></p>
      </div>
    `;
    return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });

  } catch (err: any) {
    html = `
      <div style="font-family: sans-serif; padding: 30px; max-width: 600px; margin: 50px auto; border: 1px solid #ffcccc; background-color: #fff5f5; border-radius: 12px;">
        <h2 style="color: #d32f2f;">Erreur système</h2>
        <p>${err.message || "Une erreur inconnue est survenue."}</p>
      </div>
    `;
    return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
}
