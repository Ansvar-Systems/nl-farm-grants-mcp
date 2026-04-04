/**
 * Netherlands Farm Grants MCP — Data Ingestion Script
 *
 * Ingests Dutch agricultural grant data from RVO Subsidiewijzer,
 * Rijksdienst voor Ondernemend Nederland, and related government sources.
 *
 * Sources:
 *   - RVO.nl (Rijksdienst voor Ondernemend Nederland)
 *   - Ministerie van Landbouw, Natuur en Voedselkwaliteit (LNV)
 *   - Rijksoverheid.nl
 *
 * Usage: npm run ingest
 */

import { createDatabase } from '../src/db.js';
import { mkdirSync, writeFileSync } from 'fs';

mkdirSync('data', { recursive: true });
const db = createDatabase('data/database.db');

const now = new Date().toISOString().split('T')[0];

// ---------------------------------------------------------------------------
// 1. GRANTS
// ---------------------------------------------------------------------------

interface Grant {
  id: string;
  name: string;
  grant_type: string;
  authority: string;
  budget: string;
  status: string;
  open_date: string | null;
  close_date: string | null;
  description: string;
  eligible_applicants: string;
  match_funding_pct: number;
  max_grant_value: number | null;
}

const grants: Grant[] = [
  {
    id: 'isde',
    name: 'ISDE (Investeringssubsidie Duurzame Energie en Energiebesparing)',
    grant_type: 'capital',
    authority: 'RVO',
    budget: 'Doorlopend budget (jaarlijks vastgesteld)',
    status: 'rolling',
    open_date: null,
    close_date: null,
    description:
      'Subsidie voor particulieren en zakelijke gebruikers die investeren in warmtepompen, zonneboilers, ' +
      'isolatie en andere energiebesparende maatregelen. Bedragen varieren per technologie en capaciteit. ' +
      'Aanvraag indienen na aanschaf via mijn.rvo.nl.',
    eligible_applicants:
      'Particuliere woningeigenaren, VvE\'s, verhuurders en zakelijke gebruikers (inclusief agrariërs).',
    match_funding_pct: 0,
    max_grant_value: null,
  },
  {
    id: 'sde-plus-plus',
    name: 'SDE++ (Stimulering Duurzame Energieproductie en Klimaattransitie)',
    grant_type: 'revenue',
    authority: 'RVO',
    budget: 'Jaarlijks tender-budget (2025: ca. 8 miljard EUR)',
    status: 'upcoming',
    open_date: '2026-06-01',
    close_date: '2026-06-30',
    description:
      'Exploitatiesubsidie voor hernieuwbare energieproductie en CO2-reductie. Categorieën: zon-PV, ' +
      'windenergie, biomassa, geothermie, aquathermie, waterstof, CCS. Tender-systematiek: laagste ' +
      'fasebedrag krijgt voorrang. Fasebedrag 2026 varieert per categorie.',
    eligible_applicants:
      'Bedrijven en (non-profit) instellingen die hernieuwbare energie produceren of CO2 reduceren.',
    match_funding_pct: 0,
    max_grant_value: null,
  },
  {
    id: 'jola',
    name: 'Subsidie Jonge Landbouwers (JOLA)',
    grant_type: 'capital',
    authority: 'RVO',
    budget: 'Jaarlijks vastgesteld per openstelling',
    status: 'upcoming',
    open_date: '2026-06-01',
    close_date: '2026-07-15',
    description:
      'Investeringssubsidie voor jonge landbouwers (onder 41 jaar) die recent een bedrijf hebben ' +
      'overgenomen. Maximaal 20.000 EUR subsidiabele investering, 30% subsidiepercentage (max 6.000 EUR). ' +
      'Rangschikking op punten bij overtekening.',
    eligible_applicants:
      'Landbouwers jonger dan 41 jaar op moment van aanvraag, bedrijfsovername in de laatste 5 jaar.',
    match_funding_pct: 70,
    max_grant_value: 6000,
  },
  {
    id: 'mit',
    name: 'MIT (MKB Innovatiestimulering Topsectoren)',
    grant_type: 'capital',
    authority: 'RVO',
    budget: 'Jaarlijks vastgesteld per topsector',
    status: 'open',
    open_date: '2026-04-01',
    close_date: '2026-09-30',
    description:
      'Subsidie voor MKB-bedrijven die innovatieprojecten uitvoeren binnen topsectoren (waaronder ' +
      'Agri & Food en Tuinbouw & Uitgangsmaterialen). Twee instrumenten: haalbaarheidsstudies (max ' +
      '20.000 EUR) en R&D-samenwerkingsprojecten (max 200.000 EUR per deelnemer).',
    eligible_applicants:
      'MKB-ondernemingen (inclusief agrarische bedrijven) binnen de topsectoren.',
    match_funding_pct: 60,
    max_grant_value: 200000,
  },
  {
    id: 'wbso',
    name: 'WBSO (Wet Bevordering Speur- en Ontwikkelingswerk)',
    grant_type: 'tax_credit',
    authority: 'RVO',
    budget: 'Ca. 1,4 miljard EUR per jaar',
    status: 'rolling',
    open_date: null,
    close_date: null,
    description:
      'Fiscaal voordeel (afdrachtvermindering loonbelasting) voor bedrijven die R&D uitvoeren. ' +
      'Relevant voor agrarische bedrijven in precisielandbouw, robotica, smart farming en ' +
      'biotechnologie. Drie aanvraagmomenten per jaar.',
    eligible_applicants:
      'Alle bedrijven en zelfstandigen die speur- en ontwikkelingswerk verrichten.',
    match_funding_pct: 0,
    max_grant_value: null,
  },
  {
    id: 'regeling-groenprojecten',
    name: 'Regeling Groenprojecten',
    grant_type: 'loan_subsidy',
    authority: 'RVO',
    budget: 'Doorlopend',
    status: 'rolling',
    open_date: null,
    close_date: null,
    description:
      'Groene lening met rentevoordeel voor duurzame investeringen. Banken verstrekken groene ' +
      'leningen tegen een lagere rente (ca. 0,5-1% voordeel). Geschikt voor duurzame stallen, ' +
      'energieopwekking, circulaire landbouw en natuurontwikkeling.',
    eligible_applicants:
      'Bedrijven en particulieren met duurzame investeringsprojecten die een Groenverklaring krijgen.',
    match_funding_pct: 0,
    max_grant_value: null,
  },
  {
    id: 'stoppersregeling',
    name: 'Stoppersregeling (Lbv / Lbv-plus)',
    grant_type: 'buyout',
    authority: 'RVO / Ministerie van LNV',
    budget: 'Ca. 1,5 miljard EUR (stikstoffonds)',
    status: 'open',
    open_date: '2026-01-15',
    close_date: null,
    description:
      'Vrijwillige uitkoopregeling voor piekbelasters nabij Natura 2000-gebieden. Vergoeding op ' +
      'basis van marktwaarde productiecapaciteit plus opslag. Voorwaarde: bedrijf definitief sluiten ' +
      'en productierechten inleveren. Doorlopend aanvragen mogelijk.',
    eligible_applicants:
      'Veehouderijen die als piekbelaster zijn aangemerkt nabij Natura 2000-gebieden (vrijwillig).',
    match_funding_pct: 0,
    max_grant_value: null,
  },
  {
    id: 'mgo-veehouderijen',
    name: 'Maatregel Gerichte Opkoop Veehouderijen (MGO)',
    grant_type: 'buyout',
    authority: 'Provincies / Ministerie van LNV',
    budget: 'Provinciaal budget, 500 mln EUR landelijk',
    status: 'open',
    open_date: '2025-01-01',
    close_date: null,
    description:
      'Gerichte opkoop van veehouderijen nabij Natura 2000-gebieden door provincies. Vergoeding: ' +
      '100% marktwaarde plus 3% opslag voor bedrijfsmiddelen. Productierechten worden ingenomen. ' +
      'Provincies benaderen bedrijven op basis van stikstofbelasting.',
    eligible_applicants:
      'Veehouderijen nabij Natura 2000-gebieden, geselecteerd door de provincie.',
    match_funding_pct: 0,
    max_grant_value: null,
  },
  {
    id: 'sbv',
    name: 'Subsidiemodules Brongerichte Verduurzaming Stal (Sbv)',
    grant_type: 'capital',
    authority: 'RVO',
    budget: 'Ca. 280 mln EUR',
    status: 'upcoming',
    open_date: '2026-03-01',
    close_date: '2026-12-31',
    description:
      'Subsidie voor innovatieve stalsystemen die emissies bij de bron verminderen. Maximaal 40% ' +
      'subsidie op investeringskosten voor bewezen emissiereducerende technieken. Combineerbaar met ' +
      'ISDE voor warmtepompen in stallen.',
    eligible_applicants:
      'Houders van landbouwhuisdieren die investeren in emissiearme stalsystemen.',
    match_funding_pct: 60,
    max_grant_value: null,
  },
  {
    id: 'borgstellingsfonds',
    name: 'Borgstellingsfonds (BL / BL-C)',
    grant_type: 'guarantee',
    authority: 'RVO',
    budget: 'Doorlopend borgstellingskrediet',
    status: 'rolling',
    open_date: null,
    close_date: null,
    description:
      'Overheidsgarantie voor bankleningen aan agrarische ondernemers. Maximaal 2,8 miljoen EUR ' +
      'borgstelling per bedrijf. De bank vraagt borgstelling aan bij RVO. Geschikt voor bedrijfsovername, ' +
      'uitbreiding en verduurzaming. BL-C variant voor corona-gerelateerde liquiditeitsproblemen.',
    eligible_applicants:
      'Agrarische ondernemers die een banklening nodig hebben voor investeringen of bedrijfsovername.',
    match_funding_pct: 0,
    max_grant_value: 2800000,
  },
];

for (const g of grants) {
  db.run(
    `INSERT OR REPLACE INTO grants (id, name, grant_type, authority, budget, status, open_date, close_date, description, eligible_applicants, match_funding_pct, max_grant_value, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [g.id, g.name, g.grant_type, g.authority, g.budget, g.status, g.open_date, g.close_date, g.description, g.eligible_applicants, g.match_funding_pct, g.max_grant_value, 'NL']
  );
}

console.log(`Inserted ${grants.length} grants.`);

// ---------------------------------------------------------------------------
// 2. ELIGIBLE ITEMS (ISDE selectie + other grant items)
// ---------------------------------------------------------------------------

interface GrantItem {
  id: string;
  grant_id: string;
  item_code: string;
  name: string;
  description: string;
  specification: string;
  grant_value: number;
  grant_unit: string;
  category: string;
  score: number | null;
}

const grantItems: GrantItem[] = [
  // ISDE — Warmtepompen
  {
    id: 'isde-wp-lw-01',
    grant_id: 'isde',
    item_code: 'ISDE-WP-LW',
    name: 'Warmtepomp lucht-water (basis)',
    description: 'Lucht-water warmtepomp voor ruimteverwarming en warm water',
    specification: 'SCOP ≥ 3.8, vermogen ≤ 10 kW, KEYMARK of gelijkwaardig gecertificeerd',
    grant_value: 1500,
    grant_unit: 'per woning',
    category: 'warmtepomp',
    score: null,
  },
  {
    id: 'isde-wp-lw-02',
    grant_id: 'isde',
    item_code: 'ISDE-WP-LW-PLUS',
    name: 'Warmtepomp lucht-water (hoog vermogen)',
    description: 'Lucht-water warmtepomp met hoger vermogen voor grotere woningen of utiliteit',
    specification: 'SCOP ≥ 3.8, vermogen > 10 kW, KEYMARK of gelijkwaardig gecertificeerd',
    grant_value: 3150,
    grant_unit: 'per woning',
    category: 'warmtepomp',
    score: null,
  },
  {
    id: 'isde-wp-bw-01',
    grant_id: 'isde',
    item_code: 'ISDE-WP-BW',
    name: 'Warmtepomp bodem-water (basis)',
    description: 'Bodem-water warmtepomp (gesloten of open bron)',
    specification: 'SCOP ≥ 4.3, KEYMARK of gelijkwaardig gecertificeerd',
    grant_value: 3000,
    grant_unit: 'per woning',
    category: 'warmtepomp',
    score: null,
  },
  {
    id: 'isde-wp-bw-02',
    grant_id: 'isde',
    item_code: 'ISDE-WP-BW-PLUS',
    name: 'Warmtepomp bodem-water (hoog vermogen)',
    description: 'Bodem-water warmtepomp met hoger vermogen',
    specification: 'SCOP ≥ 4.3, vermogen > 10 kW, KEYMARK gecertificeerd',
    grant_value: 6000,
    grant_unit: 'per woning',
    category: 'warmtepomp',
    score: null,
  },
  // ISDE — Zonneboiler
  {
    id: 'isde-zb-01',
    grant_id: 'isde',
    item_code: 'ISDE-ZB',
    name: 'Zonneboiler (basis)',
    description: 'Zonneboilersysteem voor warm tapwater',
    specification: 'Solar Keymark gecertificeerd, min. 2 m² collectoroppervlak',
    grant_value: 1000,
    grant_unit: 'per woning',
    category: 'zonneboiler',
    score: null,
  },
  {
    id: 'isde-zb-02',
    grant_id: 'isde',
    item_code: 'ISDE-ZB-PLUS',
    name: 'Zonneboiler (groot systeem)',
    description: 'Zonneboilersysteem met grotere capaciteit voor combi warm water en verwarming',
    specification: 'Solar Keymark gecertificeerd, min. 4 m² collectoroppervlak',
    grant_value: 2600,
    grant_unit: 'per woning',
    category: 'zonneboiler',
    score: null,
  },
  // ISDE — Isolatie
  {
    id: 'isde-iso-dak',
    grant_id: 'isde',
    item_code: 'ISDE-ISO-DAK',
    name: 'Dakisolatie',
    description: 'Isolatie van het dak of de zoldervloer',
    specification: 'Minimale Rd-waarde ≥ 3.5 m²·K/W',
    grant_value: 4,
    grant_unit: 'per m²',
    category: 'isolatie',
    score: null,
  },
  {
    id: 'isde-iso-vloer',
    grant_id: 'isde',
    item_code: 'ISDE-ISO-VLOER',
    name: 'Vloerisolatie',
    description: 'Isolatie van de begane grondvloer',
    specification: 'Minimale Rd-waarde ≥ 3.5 m²·K/W',
    grant_value: 5,
    grant_unit: 'per m²',
    category: 'isolatie',
    score: null,
  },
  {
    id: 'isde-iso-gevel',
    grant_id: 'isde',
    item_code: 'ISDE-ISO-GEVEL',
    name: 'Gevelisolatie',
    description: 'Isolatie van de buitengevel (spouwmuur of buitenzijde)',
    specification: 'Minimale Rd-waarde ≥ 3.5 m²·K/W',
    grant_value: 7,
    grant_unit: 'per m²',
    category: 'isolatie',
    score: null,
  },
  // MIT items
  {
    id: 'mit-haalbaarheid',
    grant_id: 'mit',
    item_code: 'MIT-HS',
    name: 'Haalbaarheidsstudie',
    description: 'Haalbaarheidsonderzoek voor innovatief project binnen topsector',
    specification: 'Maximaal 20.000 EUR subsidie, 40% van projectkosten',
    grant_value: 20000,
    grant_unit: 'per project',
    category: 'innovatie',
    score: null,
  },
  {
    id: 'mit-rd-samenwerking',
    grant_id: 'mit',
    item_code: 'MIT-RD',
    name: 'R&D-samenwerkingsproject',
    description: 'R&D-samenwerkingsproject met minimaal 2 MKB-bedrijven',
    specification: 'Maximaal 200.000 EUR per deelnemer, 35% van projectkosten',
    grant_value: 200000,
    grant_unit: 'per deelnemer',
    category: 'innovatie',
    score: null,
  },
  // JOLA items
  {
    id: 'jola-investering',
    grant_id: 'jola',
    item_code: 'JOLA-INV',
    name: 'Investeringssubsidie jonge landbouwer',
    description: 'Subsidie voor duurzame investeringen door jonge landbouwers',
    specification: 'Maximaal 20.000 EUR subsidiabele kosten, 30% subsidie',
    grant_value: 6000,
    grant_unit: 'per aanvraag',
    category: 'bedrijfsovername',
    score: null,
  },
  // Borgstellingsfonds
  {
    id: 'bf-borgstelling',
    grant_id: 'borgstellingsfonds',
    item_code: 'BF-BORG',
    name: 'Borgstelling landbouw',
    description: 'Overheidsgarantie op banklening voor agrarische investering',
    specification: 'Maximaal 2,8 mln EUR per bedrijf, provisie 3% per jaar over garantiebedrag',
    grant_value: 2800000,
    grant_unit: 'per bedrijf',
    category: 'financiering',
    score: null,
  },
];

for (const item of grantItems) {
  db.run(
    `INSERT OR REPLACE INTO grant_items (id, grant_id, item_code, name, description, specification, grant_value, grant_unit, category, score, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [item.id, item.grant_id, item.item_code, item.name, item.description, item.specification, item.grant_value, item.grant_unit, item.category, item.score, 'NL']
  );
}

console.log(`Inserted ${grantItems.length} grant items.`);

// ---------------------------------------------------------------------------
// 3. STACKING RULES
// ---------------------------------------------------------------------------

interface StackingRule {
  grant_a: string;
  grant_b: string;
  compatible: number;
  conditions: string;
}

const stackingRules: StackingRule[] = [
  {
    grant_a: 'isde',
    grant_b: 'sde-plus-plus',
    compatible: 0,
    conditions: 'Niet combineerbaar voor dezelfde installatie. Kies ISDE (eenmalig, kleinschalig) of SDE++ (exploitatie, grootschalig).',
  },
  {
    grant_a: 'jola',
    grant_b: 'sbv',
    compatible: 1,
    conditions: 'Combineerbaar. JOLA voor bedrijfsinvestering, Sbv voor emissiereducerende staltechniek. Kosten mogen niet dubbel worden opgevoerd.',
  },
  {
    grant_a: 'isde',
    grant_b: 'sbv',
    compatible: 1,
    conditions: 'Combineerbaar voor warmtepompen in stallen. ISDE voor de warmtepomp, Sbv voor het stalsysteem. Geen dubbele subsidiering van dezelfde kostenpost.',
  },
  {
    grant_a: 'stoppersregeling',
    grant_b: 'jola',
    compatible: 0,
    conditions: 'Niet combineerbaar. Stoppersregeling vereist definitieve bedrijfsbeeindiging.',
  },
  {
    grant_a: 'stoppersregeling',
    grant_b: 'sbv',
    compatible: 0,
    conditions: 'Niet combineerbaar. Stoppersregeling vereist definitieve bedrijfsbeeindiging, Sbv is voor voortzettende bedrijven.',
  },
  {
    grant_a: 'stoppersregeling',
    grant_b: 'borgstellingsfonds',
    compatible: 0,
    conditions: 'Niet combineerbaar. Stoppersregeling sluit andere agrarische subsidies uit.',
  },
  {
    grant_a: 'stoppersregeling',
    grant_b: 'mgo-veehouderijen',
    compatible: 0,
    conditions: 'Niet combineerbaar. Beide regelingen zijn uitkoopregelingen; slechts een kan worden benut.',
  },
  {
    grant_a: 'mit',
    grant_b: 'wbso',
    compatible: 1,
    conditions: 'Combineerbaar. WBSO voor loonkosten R&D-personeel, MIT voor projectkosten. Dezelfde kosten mogen niet dubbel worden opgevoerd.',
  },
  {
    grant_a: 'jola',
    grant_b: 'borgstellingsfonds',
    compatible: 1,
    conditions: 'Combineerbaar. Borgstellingsfonds voor de banklening, JOLA voor aanvullende investeringssubsidie.',
  },
  {
    grant_a: 'isde',
    grant_b: 'regeling-groenprojecten',
    compatible: 1,
    conditions: 'Combineerbaar. ISDE als investeringssubsidie, Regeling Groenprojecten als gunstige financiering.',
  },
];

for (const rule of stackingRules) {
  db.run(
    `INSERT INTO stacking_rules (grant_a, grant_b, compatible, conditions, jurisdiction)
     VALUES (?, ?, ?, ?, ?)`,
    [rule.grant_a, rule.grant_b, rule.compatible, rule.conditions, 'NL']
  );
}

console.log(`Inserted ${stackingRules.length} stacking rules.`);

// ---------------------------------------------------------------------------
// 4. APPLICATION PROCESSES
// ---------------------------------------------------------------------------

interface AppStep {
  grant_id: string;
  step_order: number;
  description: string;
  evidence_required: string | null;
  portal: string | null;
}

const applicationSteps: AppStep[] = [
  // ISDE
  {
    grant_id: 'isde',
    step_order: 1,
    description: 'Koop en installeer de maatregel (warmtepomp, zonneboiler of isolatie) door een erkend installateur.',
    evidence_required: 'Factuur van installateur, bewijs van installatie',
    portal: null,
  },
  {
    grant_id: 'isde',
    step_order: 2,
    description: 'Log in op mijn.rvo.nl met eHerkenning (zakelijk) of DigiD (particulier).',
    evidence_required: 'eHerkenning niveau 3 of DigiD',
    portal: 'https://mijn.rvo.nl',
  },
  {
    grant_id: 'isde',
    step_order: 3,
    description: 'Vul het aanvraagformulier ISDE in met productgegevens en factuurinformatie.',
    evidence_required: 'Factuur, productspecificaties, SCOP/Solar Keymark certificaat',
    portal: 'https://mijn.rvo.nl/isde',
  },
  {
    grant_id: 'isde',
    step_order: 4,
    description: 'Wacht op beoordeling door RVO. Uitbetaling binnen circa 8 weken na goedkeuring.',
    evidence_required: null,
    portal: null,
  },
  // SDE++
  {
    grant_id: 'sde-plus-plus',
    step_order: 1,
    description: 'Zorg voor alle benodigde vergunningen (omgevingsvergunning, SDE-haalbaarheidsstudie).',
    evidence_required: 'Omgevingsvergunning, transportindicatie netbeheerder, haalbaarheidsstudie',
    portal: null,
  },
  {
    grant_id: 'sde-plus-plus',
    step_order: 2,
    description: 'Dien aanvraag in tijdens de openstellingsronde (tender) via mijn.rvo.nl. Laagste fasebedrag krijgt voorrang.',
    evidence_required: 'Projectplan, financieringsplan, vergunningen, EAN-code',
    portal: 'https://mijn.rvo.nl/sde',
  },
  {
    grant_id: 'sde-plus-plus',
    step_order: 3,
    description: 'Na toekenning: realiseer het project binnen de gestelde termijn (meestal 3-4 jaar).',
    evidence_required: 'Voortgangsrapportages, inbedrijfstellingsverklaring',
    portal: null,
  },
  {
    grant_id: 'sde-plus-plus',
    step_order: 4,
    description: 'Jaarlijkse uitkering op basis van geproduceerde duurzame energie gedurende de subsidieperiode (12-15 jaar).',
    evidence_required: 'Meetgegevens energieproductie via CertiQ of vergelijkbaar',
    portal: null,
  },
  // JOLA
  {
    grant_id: 'jola',
    step_order: 1,
    description: 'Controleer of u voldoet aan de voorwaarden: jonger dan 41 jaar, bedrijfsovername in de laatste 5 jaar.',
    evidence_required: 'Identiteitsbewijs, KvK-uittreksel, overnameakte',
    portal: null,
  },
  {
    grant_id: 'jola',
    step_order: 2,
    description: 'Dien aanvraag in tijdens de jaarlijkse openstelling via mijn.rvo.nl.',
    evidence_required: 'Bedrijfsplan, offertes voor investering, bewijs bedrijfsovername',
    portal: 'https://mijn.rvo.nl/jola',
  },
  {
    grant_id: 'jola',
    step_order: 3,
    description: 'Rangschikking op basis van punten. Hoogst gerangschikte aanvragen worden gehonoreerd tot het budget op is.',
    evidence_required: null,
    portal: null,
  },
  {
    grant_id: 'jola',
    step_order: 4,
    description: 'Voer de investering uit en dien een vaststellingsverzoek in met facturen en betaalbewijzen.',
    evidence_required: 'Facturen, betaalbewijzen, foto\'s van investering',
    portal: 'https://mijn.rvo.nl',
  },
  // Stoppersregeling
  {
    grant_id: 'stoppersregeling',
    step_order: 1,
    description: 'Meld uw interesse bij RVO of het Nationaal Programma Landelijk Gebied (NPLG).',
    evidence_required: 'Bedrijfsgegevens, KvK-nummer, locatiegegevens',
    portal: 'https://www.rvo.nl/stoppersregeling',
  },
  {
    grant_id: 'stoppersregeling',
    step_order: 2,
    description: 'Onafhankelijke taxatie van de marktwaarde van uw productiecapaciteit en bedrijfsmiddelen.',
    evidence_required: 'Taxatierapport (door RVO aangewezen taxateur)',
    portal: null,
  },
  {
    grant_id: 'stoppersregeling',
    step_order: 3,
    description: 'Beoordeling door RVO en opstellen van een overeenkomst met vergoedingsbedrag.',
    evidence_required: 'Getekende overeenkomst',
    portal: null,
  },
  {
    grant_id: 'stoppersregeling',
    step_order: 4,
    description: 'Lever productierechten in, sloop bedrijfsgebouwen (indien vereist), en ontvang vergoeding.',
    evidence_required: 'Bewijs inlevering productierechten, sloopmelding indien van toepassing',
    portal: null,
  },
  // Borgstellingsfonds
  {
    grant_id: 'borgstellingsfonds',
    step_order: 1,
    description: 'Bespreek uw financieringsbehoefte met uw bank. De bank beoordeelt of borgstelling nodig is.',
    evidence_required: 'Ondernemingsplan, financieringsaanvraag',
    portal: null,
  },
  {
    grant_id: 'borgstellingsfonds',
    step_order: 2,
    description: 'Uw bank dient de borgstellingsaanvraag in bij RVO.',
    evidence_required: 'Bankformulier borgstelling, onderbouwing kredietbehoefte',
    portal: 'https://mijn.rvo.nl/borgstellingskrediet',
  },
  {
    grant_id: 'borgstellingsfonds',
    step_order: 3,
    description: 'RVO beoordeelt de aanvraag en verleent borgstelling. Provisie van 3% per jaar over het garantiebedrag.',
    evidence_required: null,
    portal: null,
  },
];

for (const step of applicationSteps) {
  db.run(
    `INSERT INTO application_guidance (grant_id, step_order, description, evidence_required, portal, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [step.grant_id, step.step_order, step.description, step.evidence_required, step.portal, 'NL']
  );
}

console.log(`Inserted ${applicationSteps.length} application guidance steps.`);

// ---------------------------------------------------------------------------
// 5. FTS5 SEARCH INDEX
// ---------------------------------------------------------------------------

// Drop and rebuild FTS5 index
db.run('DELETE FROM search_index');

// Index each grant
for (const g of grants) {
  db.run(
    `INSERT INTO search_index (title, body, grant_type, jurisdiction) VALUES (?, ?, ?, ?)`,
    [g.name, `${g.description} ${g.eligible_applicants}`, g.grant_type, 'NL']
  );
}

// Index each grant item
for (const item of grantItems) {
  const parentGrant = grants.find(g => g.id === item.grant_id);
  const parentName = parentGrant?.name ?? item.grant_id;
  db.run(
    `INSERT INTO search_index (title, body, grant_type, jurisdiction) VALUES (?, ?, ?, ?)`,
    [
      `${item.name} -- ${parentName}`,
      `${item.description}. ${item.specification}. Subsidie: ${item.grant_value} EUR ${item.grant_unit}. Categorie: ${item.category}.`,
      parentGrant?.grant_type ?? 'capital',
      'NL',
    ]
  );
}

// Add thematic search entries for common Dutch agricultural queries
const thematicEntries = [
  {
    title: 'Stikstof / stoppersregelingen',
    body: 'Regelingen voor veehouders in het kader van stikstofproblematiek. Stoppersregeling (Lbv/Lbv-plus) voor piekbelasters, Maatregel Gerichte Opkoop (MGO) nabij Natura 2000. Vrijwillige uitkoop, productierechten inleveren.',
    grant_type: 'buyout',
  },
  {
    title: 'Duurzame energie in de landbouw',
    body: 'Subsidies voor energietransitie: ISDE voor warmtepompen en isolatie, SDE++ voor grootschalige energieproductie (zon, wind, biomassa, geothermie). Regeling Groenprojecten voor gunstige financiering.',
    grant_type: 'capital',
  },
  {
    title: 'Innovatie en precisielandbouw',
    body: 'Subsidies voor agrarische innovatie: MIT voor haalbaarheidsstudies en R&D-samenwerking, WBSO voor fiscaal voordeel op R&D. Relevant voor precisielandbouw, robotica, smart farming, drones, sensortechnologie.',
    grant_type: 'tax_credit',
  },
  {
    title: 'Jonge boeren en bedrijfsovername',
    body: 'JOLA (Subsidie Jonge Landbouwers) voor boeren onder 41 jaar die een bedrijf hebben overgenomen. Borgstellingsfonds voor financiering van bedrijfsovername of uitbreiding.',
    grant_type: 'capital',
  },
  {
    title: 'Emissiereductie en stallen',
    body: 'Subsidiemodules Brongerichte Verduurzaming Stal (Sbv) voor innovatieve emissiearme stalsystemen. Combineerbaar met ISDE voor warmtepompen. Maximaal 40% subsidie op investeringskosten.',
    grant_type: 'capital',
  },
];

for (const entry of thematicEntries) {
  db.run(
    `INSERT INTO search_index (title, body, grant_type, jurisdiction) VALUES (?, ?, ?, ?)`,
    [entry.title, entry.body, entry.grant_type, 'NL']
  );
}

console.log(`Built FTS5 search index (${grants.length} grants + ${grantItems.length} items + ${thematicEntries.length} thematic entries).`);

// ---------------------------------------------------------------------------
// 6. METADATA
// ---------------------------------------------------------------------------

db.run("INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('last_ingest', ?)", [now]);
db.run("INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('build_date', ?)", [now]);
db.run("INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('schema_version', '1.0')");
db.run("INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('mcp_name', 'Netherlands Farm Grants MCP')");
db.run("INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('jurisdiction', 'NL')");
db.run("INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('grants_count', ?)", [String(grants.length)]);
db.run("INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('items_count', ?)", [String(grantItems.length)]);
db.run("INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('stacking_rules_count', ?)", [String(stackingRules.length)]);

// ---------------------------------------------------------------------------
// 7. COVERAGE FILE
// ---------------------------------------------------------------------------

writeFileSync('data/coverage.json', JSON.stringify({
  mcp_name: 'Netherlands Farm Grants MCP',
  jurisdiction: 'NL',
  build_date: now,
  status: 'populated',
  grants: grants.length,
  grant_items: grantItems.length,
  stacking_rules: stackingRules.length,
  application_guidance_steps: applicationSteps.length,
  fts_entries: grants.length + grantItems.length + thematicEntries.length,
  categories: {
    capital: grants.filter(g => g.grant_type === 'capital').length,
    revenue: grants.filter(g => g.grant_type === 'revenue').length,
    tax_credit: grants.filter(g => g.grant_type === 'tax_credit').length,
    loan_subsidy: grants.filter(g => g.grant_type === 'loan_subsidy').length,
    buyout: grants.filter(g => g.grant_type === 'buyout').length,
    guarantee: grants.filter(g => g.grant_type === 'guarantee').length,
  },
  grant_ids: grants.map(g => g.id),
}, null, 2));

db.close();

console.log('');
console.log(`Ingestion complete: ${grants.length} grants, ${grantItems.length} items, ${stackingRules.length} stacking rules, ${applicationSteps.length} application steps.`);
console.log(`FTS5 index: ${grants.length + grantItems.length + thematicEntries.length} entries.`);
console.log(`Database written to data/database.db`);
