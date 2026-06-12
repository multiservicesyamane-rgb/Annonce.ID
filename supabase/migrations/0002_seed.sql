-- ════════════════════════════════════════════════════════════════
--  Annonce.ID — Données de référence (27 pays + 12 catégories)
-- ════════════════════════════════════════════════════════════════

insert into countries (code, name, dial_code, capital, currency, flag) values
('SN','Sénégal','+221','Dakar','FCFA','🇸🇳'),
('CI','Côte d''Ivoire','+225','Abidjan','FCFA','🇨🇮'),
('ML','Mali','+223','Bamako','FCFA','🇲🇱'),
('BJ','Bénin','+229','Cotonou','FCFA','🇧🇯'),
('BF','Burkina Faso','+226','Ouagadougou','FCFA','🇧🇫'),
('TG','Togo','+228','Lomé','FCFA','🇹🇬'),
('NE','Niger','+227','Niamey','FCFA','🇳🇪'),
('GN','Guinée','+224','Conakry','GNF','🇬🇳'),
('GW','Guinée-Bissau','+245','Bissau','FCFA','🇬🇼'),
('GH','Ghana','+233','Accra','GHS','🇬🇭'),
('NG','Nigéria','+234','Abuja','NGN','🇳🇬'),
('SL','Sierra Leone','+232','Freetown','SLL','🇸🇱'),
('LR','Liberia','+231','Monrovia','LRD','🇱🇷'),
('GM','Gambie','+220','Banjul','GMD','🇬🇲'),
('CV','Cap-Vert','+238','Praia','CVE','🇨🇻'),
('MR','Mauritanie','+222','Nouakchott','MRU','🇲🇷'),
('CM','Cameroun','+237','Yaoundé','FCFA','🇨🇲'),
('GA','Gabon','+241','Libreville','FCFA','🇬🇦'),
('CG','Congo','+242','Brazzaville','FCFA','🇨🇬'),
('CD','RD Congo','+243','Kinshasa','CDF','🇨🇩'),
('TD','Tchad','+235','N''Djaména','FCFA','🇹🇩'),
('CF','Centrafrique','+236','Bangui','FCFA','🇨🇫'),
('GQ','Guinée Équatoriale','+240','Malabo','FCFA','🇬🇶'),
('MA','Maroc','+212','Rabat','MAD','🇲🇦'),
('DZ','Algérie','+213','Alger','DZD','🇩🇿'),
('TN','Tunisie','+216','Tunis','TND','🇹🇳'),
('MG','Madagascar','+261','Antananarivo','MGA','🇲🇬')
on conflict (code) do nothing;

insert into categories (slug, name, icon, sort_order) values
('immobilier','Immobilier','🏠',1),
('vehicules','Véhicules','🚗',2),
('electronique','Électronique','📱',3),
('mode','Mode','👗',4),
('emploi','Emploi','💼',5),
('maison','Maison','🛋',6),
('alimentation','Alimentation','🍲',7),
('services','Services','🔧',8),
('animaux','Animaux','🐐',9),
('formation','Formation','📚',10),
('agriculture','Agriculture','🌿',11),
('sport','Sport','⚽',12)
on conflict (slug) do nothing;
