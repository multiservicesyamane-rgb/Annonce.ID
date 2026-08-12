// Lecture serveur des documents partagés par lien public (devis, factures).
//
// Ces pages n'ont PAS de session : c'est le jeton de 48 caractères hexadécimaux
// du lien qui fait autorité. On passe donc par la clé service_role, en filtrant
// sur ce seul jeton, et on ne renvoie que les champs nécessaires à l'affichage.

import { createClient } from "@supabase/supabase-js";
import type { PrintParty } from "@/components/pro/PrintableDocument";

const TOKEN_RE = /^[a-f0-9]{48}$/;

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

/** Identité du prestataire : réglages professionnels, complétés par le profil. */
async function fetchSeller(sb: ReturnType<typeof admin>, userId: string): Promise<PrintParty> {
  if (!sb) return { name: "Votre prestataire" };

  // `pro_settings` peut ne pas exister si la migration n'a pas encore tourné :
  // on retombe alors sur le seul profil, sans faire échouer le document.
  const [{ data: profile }, settingsRes] = await Promise.all([
    sb.from("profiles").select("full_name, avatar_url, phone, city, location, is_verified").eq("id", userId).maybeSingle(),
    sb.from("pro_settings").select("*").eq("user_id", userId).maybeSingle(),
  ]);
  const settings = settingsRes?.data || null;

  return {
    name: profile?.full_name || "Votre prestataire",
    company: settings?.business_name || null,
    phone: settings?.phone || profile?.phone || null,
    email: settings?.email || null,
    address: settings?.address || profile?.location || profile?.city || null,
    // NINEA seulement si le compte se declare immatricule : imprimer un
    // numero saisi puis abandonne serait une fausse mention.
    tax_id: settings?.business_status === "formel" ? settings?.tax_id || null : null,
    status: settings?.business_status === "formel" ? "formel" : "informel",
    doc_title: settings?.invoice_title || null,
    // Logo professionnel s'il est réglé ; sinon l'avatar de la boutique
    // d'annonces tient lieu d'en-tête, faute de mieux.
    logo: settings?.logo_url || profile?.avatar_url || null,
    signature: settings?.signature_url || null,
    stamp: settings?.stamp_url || null,
    signature_label: settings?.signature_label || null,
    template: settings?.doc_template || null,
    accent: settings?.doc_accent || null,
  };
}

/** Coordonnées de facturation du client (raison sociale si elle est renseignée). */
function toParty(client: any): PrintParty | null {
  if (!client) return null;
  return {
    name: client.name,
    company: client.billing_name || client.company || null,
    phone: client.phone || null,
    email: client.email || null,
    address: client.address || client.city || null,
    tax_id: client.tax_id || null,
  };
}

export async function fetchPublicQuote(token: string) {
  if (!TOKEN_RE.test(token)) return null;
  const sb = admin();
  if (!sb) return null;

  const { data } = await sb.from("pro_quotes").select("*").eq("public_token", token).maybeSingle();
  if (!data) return null;

  // Client rattaché en seconde requête, pour ne charger que les champs utiles
  // à l'affichage du document.
  let client: any = null;
  if (data.client_id) {
    const { data: c } = await sb
      .from("pro_clients")
      .select("name, company, billing_name, phone, email, address, city, tax_id, tracking_code")
      .eq("id", data.client_id)
      .maybeSingle();
    client = c || null;
  }

  const [seller, avatar] = await Promise.all([
    fetchSeller(sb, data.user_id),
    sb.from("profiles").select("avatar_url, is_verified, full_name").eq("id", data.user_id).maybeSingle(),
  ]);

  return {
    quote: data,
    client,
    party: toParty(client),
    seller,
    profile: avatar?.data || null,
  };
}

export async function fetchPublicInvoice(token: string) {
  if (!TOKEN_RE.test(token)) return null;
  const sb = admin();
  if (!sb) return null;

  const { data } = await sb.from("pro_invoices").select("*").eq("public_token", token).maybeSingle();
  if (!data) return null;

  let client: any = null;
  if (data.client_id) {
    const { data: c } = await sb
      .from("pro_clients")
      .select("name, company, billing_name, phone, email, address, city, tax_id, tracking_code")
      .eq("id", data.client_id)
      .maybeSingle();
    client = c || null;
  }

  const [seller, avatar, payments] = await Promise.all([
    fetchSeller(sb, data.user_id),
    sb.from("profiles").select("avatar_url, is_verified, full_name").eq("id", data.user_id).maybeSingle(),
    sb.from("pro_payments").select("amount, method, paid_at").eq("invoice_id", data.id).order("paid_at", { ascending: false }),
  ]);

  // Les réglages portent aussi les coordonnées de paiement à afficher au client.
  const { data: settings } = await sb
    .from("pro_settings").select("payment_details").eq("user_id", data.user_id).maybeSingle();

  return {
    invoice: data,
    client,
    party: toParty(client),
    seller,
    profile: avatar?.data || null,
    payments: payments?.data || [],
    paymentDetails: settings?.payment_details || null,
  };
}
