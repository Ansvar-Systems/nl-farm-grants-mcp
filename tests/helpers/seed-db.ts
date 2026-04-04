import { createDatabase, type Database } from '../../src/db.js';

export function createSeededDatabase(dbPath: string): Database {
  const db = createDatabase(dbPath);

  // Grants
  db.run(
    `INSERT INTO grants (id, name, grant_type, authority, budget, status, open_date, close_date, description, eligible_applicants, match_funding_pct, max_grant_value, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['isde', 'ISDE (Investeringssubsidie Duurzame Energie en Energiebesparing)', 'capital', 'RVO', 'Doorlopend budget', 'rolling', null, null, 'Subsidie voor warmtepompen, zonneboilers en isolatie.', 'Particulieren, VvE\'s, verhuurders en zakelijke gebruikers.', 0, null, 'NL']
  );
  db.run(
    `INSERT INTO grants (id, name, grant_type, authority, budget, status, open_date, close_date, description, eligible_applicants, match_funding_pct, max_grant_value, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['sde-plus-plus', 'SDE++ (Stimulering Duurzame Energieproductie)', 'revenue', 'RVO', 'Ca. 8 miljard EUR', 'upcoming', '2026-06-01', '2026-06-30', 'Exploitatiesubsidie voor hernieuwbare energie.', 'Bedrijven en instellingen.', 0, null, 'NL']
  );
  db.run(
    `INSERT INTO grants (id, name, grant_type, authority, budget, status, open_date, close_date, description, eligible_applicants, match_funding_pct, max_grant_value, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['jola', 'Subsidie Jonge Landbouwers (JOLA)', 'capital', 'RVO', 'Jaarlijks vastgesteld', 'upcoming', '2026-06-01', '2026-07-15', 'Investeringssubsidie voor jonge landbouwers.', 'Landbouwers jonger dan 41 jaar.', 70, 6000, 'NL']
  );
  db.run(
    `INSERT INTO grants (id, name, grant_type, authority, budget, status, open_date, close_date, description, eligible_applicants, match_funding_pct, max_grant_value, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['stoppersregeling', 'Stoppersregeling (Lbv / Lbv-plus)', 'buyout', 'RVO / Ministerie van LNV', 'Ca. 1,5 miljard EUR', 'open', '2026-01-15', null, 'Uitkoopregeling piekbelasters nabij Natura 2000.', 'Veehouderijen als piekbelaster aangemerkt.', 0, null, 'NL']
  );

  // Grant items (ISDE warmtepompen + isolatie)
  db.run(
    `INSERT INTO grant_items (id, grant_id, item_code, name, description, specification, grant_value, grant_unit, category, score, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['isde-wp-lw-01', 'isde', 'ISDE-WP-LW', 'Warmtepomp lucht-water (basis)', 'Lucht-water warmtepomp', 'SCOP >= 3.8', 1500, 'per woning', 'warmtepomp', null, 'NL']
  );
  db.run(
    `INSERT INTO grant_items (id, grant_id, item_code, name, description, specification, grant_value, grant_unit, category, score, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['isde-wp-lw-02', 'isde', 'ISDE-WP-LW-PLUS', 'Warmtepomp lucht-water (hoog vermogen)', 'Lucht-water warmtepomp hoog vermogen', 'SCOP >= 3.8, > 10 kW', 3150, 'per woning', 'warmtepomp', null, 'NL']
  );
  db.run(
    `INSERT INTO grant_items (id, grant_id, item_code, name, description, specification, grant_value, grant_unit, category, score, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['isde-iso-dak', 'isde', 'ISDE-ISO-DAK', 'Dakisolatie', 'Isolatie van het dak', 'Rd >= 3.5', 4, 'per m2', 'isolatie', null, 'NL']
  );
  db.run(
    `INSERT INTO grant_items (id, grant_id, item_code, name, description, specification, grant_value, grant_unit, category, score, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['jola-inv', 'jola', 'JOLA-INV', 'Investeringssubsidie jonge landbouwer', 'Subsidie voor duurzame investeringen', 'Max 20.000 EUR, 30% subsidie', 6000, 'per aanvraag', 'bedrijfsovername', null, 'NL']
  );

  // Stacking rules
  db.run(
    `INSERT INTO stacking_rules (grant_a, grant_b, compatible, conditions, jurisdiction)
     VALUES (?, ?, ?, ?, ?)`,
    ['isde', 'sde-plus-plus', 0, 'Niet combineerbaar voor dezelfde installatie.', 'NL']
  );
  db.run(
    `INSERT INTO stacking_rules (grant_a, grant_b, compatible, conditions, jurisdiction)
     VALUES (?, ?, ?, ?, ?)`,
    ['jola', 'isde', 1, 'Combineerbaar. Verschillende subsidiedoelen.', 'NL']
  );
  db.run(
    `INSERT INTO stacking_rules (grant_a, grant_b, compatible, conditions, jurisdiction)
     VALUES (?, ?, ?, ?, ?)`,
    ['stoppersregeling', 'jola', 0, 'Niet combineerbaar. Stoppersregeling vereist bedrijfsbeeindiging.', 'NL']
  );

  // Application guidance
  db.run(
    `INSERT INTO application_guidance (grant_id, step_order, description, evidence_required, portal, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['isde', 1, 'Koop en installeer de maatregel door een erkend installateur.', 'Factuur, bewijs van installatie', null, 'NL']
  );
  db.run(
    `INSERT INTO application_guidance (grant_id, step_order, description, evidence_required, portal, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['isde', 2, 'Log in op mijn.rvo.nl en vul het ISDE-aanvraagformulier in.', 'eHerkenning of DigiD', 'https://mijn.rvo.nl/isde', 'NL']
  );

  // FTS5 search index
  db.run(
    `INSERT INTO search_index (title, body, grant_type, jurisdiction) VALUES (?, ?, ?, ?)`,
    ['ISDE (Investeringssubsidie Duurzame Energie en Energiebesparing)', 'Subsidie voor warmtepompen, zonneboilers en isolatie. Doorlopend aanvragen via mijn.rvo.nl.', 'capital', 'NL']
  );
  db.run(
    `INSERT INTO search_index (title, body, grant_type, jurisdiction) VALUES (?, ?, ?, ?)`,
    ['Warmtepomp lucht-water -- ISDE', 'Lucht-water warmtepomp voor ruimteverwarming. SCOP >= 3.8. Subsidie 1.500-3.150 EUR.', 'capital', 'NL']
  );
  db.run(
    `INSERT INTO search_index (title, body, grant_type, jurisdiction) VALUES (?, ?, ?, ?)`,
    ['Dakisolatie -- ISDE', 'Isolatie van het dak of zoldervloer. Rd >= 3.5. Subsidie 4 EUR per m2.', 'capital', 'NL']
  );
  db.run(
    `INSERT INTO search_index (title, body, grant_type, jurisdiction) VALUES (?, ?, ?, ?)`,
    ['SDE++ (Stimulering Duurzame Energieproductie)', 'Exploitatiesubsidie hernieuwbare energie: zon-PV, wind, biomassa, geothermie.', 'revenue', 'NL']
  );
  db.run(
    `INSERT INTO search_index (title, body, grant_type, jurisdiction) VALUES (?, ?, ?, ?)`,
    ['Stoppersregeling (Lbv / Lbv-plus)', 'Uitkoopregeling piekbelasters nabij Natura 2000 stikstof.', 'buyout', 'NL']
  );

  // Metadata
  db.run("INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('last_ingest', ?)", [new Date().toISOString().split('T')[0]]);

  return db;
}
