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
-- 3) LE DOCUMENT VIDE
--
-- L'enregistrement de Ma Carriere est automatique. Il partait des l'ouverture
-- de l'editeur : venir regarder les modeles puis ressortir creait un CV vide,
-- sans nom, et consommait le document gratuit du mois.
--
-- Ces fantomes existent deja en base. Sans le filtre qui suit, la reprise
-- ci-dessous les inscrirait au registre — et le quota du mois serait
-- consomme, pour de bon, par des documents que personne n'a ecrits.
--
-- La fonction reprend la regle de `documentVide` (lib/carriere.ts). Elle ne
-- sert qu'ici et a la section 5 ; un `drop` est propose a la fin.
-- ------------------------------------------------------------
create or replace function carriere_document_vide(c jsonb) returns boolean as $$
  -- Un tableau non vide compte comme du contenu. Une ligne ajoutee puis
  -- laissee blanche compte donc a tort — c'est volontaire : dans le doute on
  -- garde le document, on ne le jette pas.
  select not (
       coalesce(c->'personalInfo'->>'firstName', '') <> ''
    or coalesce(c->'personalInfo'->>'lastName',  '') <> ''
    or coalesce(c->'personalInfo'->>'title',     '') <> ''
    or coalesce(c->'personalInfo'->>'email',     '') <> ''
    or coalesce(c->'personalInfo'->>'phone',     '') <> ''
    or coalesce(c->'personalInfo'->>'location',  '') <> ''
    or coalesce(c->'personalInfo'->>'linkedin',  '') <> ''
    or coalesce(c->'personalInfo'->>'photoUrl',  '') <> ''
    or coalesce(c->>'summary', '') <> ''
    -- Lettre et courrier de demarche
    or coalesce(c->'from'->>'name',  '') <> ''
    or coalesce(c->'from'->>'phone', '') <> ''
    or coalesce(c->'from'->>'email', '') <> ''
    or coalesce(c->'from'->>'city',  '') <> ''
    or coalesce(c->>'company',   '') <> ''
    or coalesce(c->>'targetJob', '') <> ''
    or coalesce(c->>'recruiter', '') <> ''
    or coalesce(c->>'why',       '') <> ''
    or coalesce(c->>'body',      '') <> ''
    or coalesce(c->>'to',        '') <> ''
    or coalesce(c->>'objet',     '') <> ''
    -- Les listes du CV
    or (select coalesce(sum(n), 0) from (values
          (case when jsonb_typeof(c->'experiences')    = 'array' then jsonb_array_length(c->'experiences')    else 0 end),
          (case when jsonb_typeof(c->'education')      = 'array' then jsonb_array_length(c->'education')      else 0 end),
          (case when jsonb_typeof(c->'certifications') = 'array' then jsonb_array_length(c->'certifications') else 0 end),
          (case when jsonb_typeof(c->'skills')         = 'array' then jsonb_array_length(c->'skills')         else 0 end),
          (case when jsonb_typeof(c->'atouts')         = 'array' then jsonb_array_length(c->'atouts')         else 0 end),
          (case when jsonb_typeof(c->'languages')      = 'array' then jsonb_array_length(c->'languages')      else 0 end)
        ) as t(n)) > 0
    -- Les reponses d'un courrier de demarche.
    --
    -- Le `case` est dans l'argument et non dans un `and` qui precede :
    -- PostgreSQL n'evalue pas les conditions de gauche a droite, et un
    -- garde-fou pose a cote aurait pu etre saute — `jsonb_each_text` sur
    -- autre chose qu'un objet leve une erreur.
    or (
      select count(*) from jsonb_each_text(
        case when jsonb_typeof(c->'reponses') = 'object' then c->'reponses' else '{}'::jsonb end
      ) where value <> ''
    ) > 0
  );
$$ language sql immutable;

-- ------------------------------------------------------------
-- 4) REPRISE DE L'EXISTANT
--
-- Sans cette reprise, tous ceux qui ont deja cree un document ce mois-ci
-- verraient leur compteur revenir a zero le jour du deploiement : le registre
-- serait vide, et le mois offert une seconde fois.
--
-- Les documents VIDES en sont exclus : ils viennent d'un bug de
-- l'enregistrement automatique, pas d'un usage. Les compter reviendrait a
-- faire payer aux gens une erreur qui n'est pas la leur.
--
-- `on conflict` est inutile ici — le registre n'a pas de clef metier — donc
-- la reprise est protegee par un `not exists` qui la rend rejouable : la
-- relancer deux fois ne double pas les lignes.
-- ------------------------------------------------------------
insert into quota_ledger (user_id, module, kind, ref, created_at)
select d.user_id, 'carriere', d.kind, d.id::text, d.created_at
from career_documents d
where d.created_at >= date_trunc('month', now() at time zone 'utc')
  and not carriere_document_vide(d.content)
  and not exists (
    select 1 from quota_ledger l
    where l.module = 'carriere' and l.ref = d.id::text
  );

-- Une facture ne peut pas etre vide : la route exige un objet et au moins une
-- ligne avant de l'enregistrer. Aucun filtre necessaire de ce cote.
insert into quota_ledger (user_id, module, kind, ref, created_at)
select i.user_id, 'pro', 'facture', i.id::text, i.created_at
from pro_invoices i
where i.created_at >= date_trunc('month', now() at time zone 'utc')
  and not exists (
    select 1 from quota_ledger l
    where l.module = 'pro' and l.ref = i.id::text
  );

-- ------------------------------------------------------------
-- 5) RLS
--
-- Meme regle que partout ailleurs : aucune policy publique. Les routes
-- serveur s'authentifient avec la session du navigateur, puis ecrivent avec
-- la clef service_role en filtrant toujours sur user_id. Le navigateur ne
-- touche jamais cette table — un compteur de quota que le client pourrait
-- ecrire ne compterait rien.
-- ------------------------------------------------------------
alter table quota_ledger enable row level security;

-- ------------------------------------------------------------
-- 6) LE MENAGE DES DOCUMENTS FANTOMES  —  FACULTATIF
--
-- Le bug est corrige : plus aucun document vide ne sera cree. Ceux qui
-- existent deja restent la, et encombrent « Mes documents » de CV sans nom.
--
-- Ils ne consomment plus de quota — la section 4 les a exclus du registre.
-- Les supprimer n'est donc PAS necessaire : c'est du confort.
--
-- ⚠️  REGARDER AVANT D'EFFACER. Lancer d'abord le compte :
--
--     select count(*) as fantomes
--     from career_documents
--     where carriere_document_vide(content);
--
-- Si le nombre parait juste, alors seulement :
--
--     delete from career_documents where carriere_document_vide(content);
--
-- Une fois le menage fini, la fonction ne sert plus a rien :
--
--     drop function if exists carriere_document_vide(jsonb);
--
-- Les trois lignes restent en commentaire a dessein : une migration ne doit
-- pas effacer les documents de quelqu'un sans qu'il l'ait decide.
-- ------------------------------------------------------------
