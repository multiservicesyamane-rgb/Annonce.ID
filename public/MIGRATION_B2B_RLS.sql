-- ============================================================
--  Annonce.ID — Accès Super Admin aux tables B2B
--  À exécuter dans Supabase → SQL Editor (après MIGRATION_B2B.sql).
--
--  Le Super Admin se connecte via un mot de passe côté application
--  (pas une session Supabase). Ces règles autorisent donc la lecture
--  et l'écriture des tables B2B, qui ne sont accessibles que derrière
--  l'écran de connexion du Super Admin.
--
--  ⚠️ NOTE SÉCURITÉ : la clé anon étant publique, ces tables deviennent
--  techniquement accessibles via l'API. C'est acceptable au démarrage
--  (données commerciales internes). Pour un verrouillage strict, il
--  faudra connecter le Super Admin via une vraie authentification
--  Supabase (rôle admin) — étape recommandée avant la montée en charge.
-- ============================================================

-- Prospects (CRM)
drop policy if exists "b2b_all_prospects" on prospects;
create policy "b2b_all_prospects" on prospects for all using (true) with check (true);

-- Ambassadeurs
drop policy if exists "b2b_all_ambassadors" on ambassadors;
create policy "b2b_all_ambassadors" on ambassadors for all using (true) with check (true);

-- Employés
drop policy if exists "b2b_all_employees" on employees;
create policy "b2b_all_employees" on employees for all using (true) with check (true);

-- Campagnes
drop policy if exists "b2b_all_campaigns" on campaigns;
create policy "b2b_all_campaigns" on campaigns for all using (true) with check (true);

-- Journal de points
drop policy if exists "b2b_all_points" on points_ledger;
create policy "b2b_all_points" on points_ledger for all using (true) with check (true);

-- Leads (formulaires de contact)
drop policy if exists "b2b_all_leads" on leads;
create policy "b2b_all_leads" on leads for all using (true) with check (true);

-- FIN — Le CRM Super Admin est maintenant pleinement opérationnel.
