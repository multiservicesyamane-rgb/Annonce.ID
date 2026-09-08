-- ============================================================
-- Espace Pro — imprimer sur son propre papier a en-tete
--
-- Beaucoup d'entreprises d'ici ont deja du papier a en-tete pre-imprime,
-- commande chez un imprimeur. Leur imposer l'en-tete genere par le site les
-- oblige a choisir entre leur identite et l'outil. Trois modes desormais :
--
--   genere  Le document dessine son en-tete et son pied de page (defaut,
--           comportement actuel — rien ne change pour l'existant).
--   papier  Aucun en-tete, aucun pied : le document reserve des zones vides
--           en haut et en bas, et s'imprime sur la feuille pre-imprimee.
--   scan    Comme « papier », plus le scan de l'en-tete pose en fond de page,
--           pour ceux qui n'ont pas de papier pre-imprime sous la main.
--
-- Les deux marges sont en MILLIMETRES et reglables : aucun papier a en-tete
-- ne mesure pareil, et une valeur figee garantirait un chevauchement chez la
-- moitie des utilisateurs.
-- ============================================================

alter table pro_settings
  add column if not exists entete_mode    text     not null default 'genere',
  add column if not exists entete_url     text,
  -- 45 mm et 25 mm : les hauteurs les plus courantes d'un en-tete et d'un
  -- pied imprimes en Afrique de l'Ouest. Ce sont des valeurs de depart, que
  -- l'utilisateur ajuste en regardant l'apercu.
  add column if not exists entete_haut_mm smallint not null default 45,
  add column if not exists entete_bas_mm  smallint not null default 25;

-- Le mode part dans le rendu du document : il ne peut pas etre une chaine
-- libre. La contrainte double la validation applicative, jamais l'inverse.
alter table pro_settings drop constraint if exists pro_settings_entete_mode_chk;
alter table pro_settings add  constraint pro_settings_entete_mode_chk
  check (entete_mode in ('genere', 'papier', 'scan'));

-- Bornes des marges. En dessous de 0 le contenu sortirait de la feuille ;
-- au-dela de 120 mm il ne resterait plus de place pour la facture elle-meme.
alter table pro_settings drop constraint if exists pro_settings_entete_haut_chk;
alter table pro_settings add  constraint pro_settings_entete_haut_chk
  check (entete_haut_mm between 0 and 120);

alter table pro_settings drop constraint if exists pro_settings_entete_bas_chk;
alter table pro_settings add  constraint pro_settings_entete_bas_chk
  check (entete_bas_mm between 0 and 80);

comment on column pro_settings.entete_mode is
  'genere | papier | scan — voir MIGRATION_ENTETE_PAPIER.sql';
comment on column pro_settings.entete_url is
  'Scan de l''en-tete, bucket pro-docs uniquement. Utilise par le mode scan.';
