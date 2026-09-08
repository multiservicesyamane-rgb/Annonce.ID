-- ============================================================
-- LE VERROU DU PLAN GRATUIT
--
-- A executer dans Supabase > SQL Editor. Re-executable sans risque.
--
-- ── Le trou que ce script bouche ─────────────────────────────────────────
-- Jusqu'ici le peage ne portait QUE sur la creation : un compte gratuit
-- creait un document par mois, puis le remodifiait indefiniment. Un chercheur
-- d'emploi n'avait besoin que d'un seul CV : il changeait le poste vise avant
-- chaque candidature et ne payait jamais. Le commentaire de la route le
-- disait sans en tirer les consequences : « une fois le document ouvert, on
-- ecrit et on recommence sans limite. »
--
-- Deux fuites, et non une :
--   1. la MODIFICATION sans fin d'un document deja produit ;
--   2. la SUPPRESSION, qui rendait le quota du mois. Creer, telecharger,
--      supprimer, recreer : le compteur repartait de zero a chaque tour.
--
-- Fermer la premiere sans la seconde n'aurait servi a rien.
-- ============================================================

-- ------------------------------------------------------------
-- 1) LA DATE DE FINALISATION
--
-- Un document devient « fini » au premier telechargement — le moment ou il a
-- une valeur entre les mains de son auteur, et pas avant. Le choix n'est pas
-- anodin : l'enregistrement de Ma Carriere est AUTOMATIQUE, 1,2 s apres la
-- premiere frappe. Verrouiller « des la creation », au pied de la lettre,
-- aurait fige un CV vide contenant une seule lettre du prenom.
--
-- Avant ce moment, on modifie autant qu'on veut. Apres, l'abonnement decide.
-- La colonne est horodatee et non booleenne : « quand » repond a un
-- utilisateur qui conteste, « oui » ne repond rien.
-- ------------------------------------------------------------
alter table career_documents
  add column if not exists finalise_at timestamptz;

comment on column career_documents.finalise_at is
  'Premier telechargement. Tant qu''elle est nulle, le document se modifie librement.';

-- Meme colonne du cote des factures. Le moment de la remise y est plus riche
-- que pour un CV : une facture est « donnee au client » des qu'elle est
-- envoyee, que son lien public est copie, ou que son PDF est telecharge. Les
-- trois gestes finalisent.
--
-- Sur ce marche, la voie normale n'est pas le bouton « Envoyer » mais le PDF
-- expedie a la main par WhatsApp. Se contenter du statut aurait laisse la
-- porte grande ouverte sur le chemin que TOUT LE MONDE emprunte.
alter table pro_invoices
  add column if not exists finalise_at timestamptz;

comment on column pro_invoices.finalise_at is
  'Premiere remise au client (envoi, lien copie ou PDF). Avant, la facture se corrige librement.';

-- ------------------------------------------------------------
-- 2) LE REGISTRE DES CREATIONS
--
-- Le quota se comptait en denombrant les lignes existantes. Supprimer un
-- document rendait donc l'unite consommee — le compteur mesurait ce qui
-- RESTE, alors qu'un quota mesure ce qui a ete PRIS.
--
-- Ce registre n'est jamais efface. Il porte une ligne par creation, il
-- survit a la suppression du document, et c'est lui qui fait foi.
--
-- Une seule table pour les deux modules : Ma Carriere et l'Espace Pro
-- comptent la meme chose de la meme facon, et deux tables jumelles auraient
-- fini par diverger.
-- ------------------------------------------------------------
create table if not exists quota_ledger (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  -- 'carriere' | 'pro'
  module      text not null,
  -- 'cv' | 'lettre' | 'demande' | 'facture'
  kind        text not null,
  -- L'identifiant de la piece creee. Purement indicatif : le document
  -- peut avoir ete supprime depuis, c'est tout l'interet du registre.
  ref         text not null default '',
  created_at  timestamptz not null default now()
);

-- La lecture est toujours la meme : ce compte, ce module, depuis le 1er du
-- mois. C'est exactement l'index pose ici.
create index if not exists quota_ledger_user_idx
  on quota_ledger (user_id, module, created_at desc);

-- ------------------------------------------------------------
-- 3) REPRISE DE L'EXISTANT
--
-- Sans cette reprise, tous ceux qui ont deja cree un document ce mois-ci
-- verraient leur compteur revenir a zero le jour du deploiement : le registre
-- serait vide, et le mois offert une seconde fois.
--
-- `on conflict` est inutile ici — le registre n'a pas de clef metier — donc
-- la reprise est protegee par un `not exists` qui la rend rejouable : la
-- relancer deux fois ne double pas les lignes.
-- ------------------------------------------------------------
insert into quota_ledger (user_id, module, kind, ref, created_at)
select d.user_id, 'carriere', d.kind, d.id::text, d.created_at
from career_documents d
where d.created_at >= date_trunc('month', now() at time zone 'utc')
  and not exists (
    select 1 from quota_ledger l
    where l.module = 'carriere' and l.ref = d.id::text
  );

insert into quota_ledger (user_id, module, kind, ref, created_at)
select i.user_id, 'pro', 'facture', i.id::text, i.created_at
from pro_invoices i
where i.created_at >= date_trunc('month', now() at time zone 'utc')
  and not exists (
    select 1 from quota_ledger l
    where l.module = 'pro' and l.ref = i.id::text
  );

-- ------------------------------------------------------------
-- 4) RLS
--
-- Meme regle que partout ailleurs : aucune policy publique. Les routes
-- serveur s'authentifient avec la session du navigateur, puis ecrivent avec
-- la clef service_role en filtrant toujours sur user_id. Le navigateur ne
-- touche jamais cette table — un compteur de quota que le client pourrait
-- ecrire ne compterait rien.
-- ------------------------------------------------------------
alter table quota_ledger enable row level security;
