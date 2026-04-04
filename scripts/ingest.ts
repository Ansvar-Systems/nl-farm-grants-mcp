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
 *   - Provinciale subsidieportalen
 *   - POP3+ (Plattelandsontwikkelingsprogramma)
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
  // ── Existing 10 grants ────────────────────────────────────────────────
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

  // ── New national grants ───────────────────────────────────────────────
  {
    id: 'svm',
    name: 'Subsidie Verduurzaming MKB (SVM)',
    grant_type: 'capital',
    authority: 'RVO',
    budget: 'Ca. 128 mln EUR (2026)',
    status: 'open',
    open_date: '2026-01-01',
    close_date: '2026-12-31',
    description:
      'Subsidie voor MKB-bedrijven (inclusief agrarische MKB) om een energieadvies te krijgen en ' +
      'verduurzamingsmaatregelen door te voeren. Stap 1: energieadvies (subsidie tot 2.500 EUR). ' +
      'Stap 2: uitvoering maatregelen uit het advies (subsidie tot 2.500 EUR). Totaal max 5.000 EUR per bedrijf.',
    eligible_applicants:
      'MKB-ondernemingen met een jaarlijks energieverbruik van minimaal 10.000 kWh of 5.000 m3 aardgas.',
    match_funding_pct: 50,
    max_grant_value: 5000,
  },
  {
    id: 'pop3-innovatie',
    name: 'POP3+ Openstelling Innovatie',
    grant_type: 'capital',
    authority: 'RVO / Provincies',
    budget: 'Varieert per openstelling en provincie',
    status: 'upcoming',
    open_date: '2026-05-01',
    close_date: '2026-09-30',
    description:
      'Subsidie uit het Plattelandsontwikkelingsprogramma (POP3+) voor innovatieve projecten in de ' +
      'landbouw. Richt zich op nieuwe technieken, processen en producten die bijdragen aan verduurzaming, ' +
      'klimaatadaptatie of biodiversiteit. Samenwerking met kennisinstellingen vereist.',
    eligible_applicants:
      'Landbouwbedrijven, samenwerkingsverbanden van agrariërs, en consortia met kennisinstellingen.',
    match_funding_pct: 60,
    max_grant_value: 500000,
  },
  {
    id: 'pop3-kennis',
    name: 'POP3+ Openstelling Kennis en Advies',
    grant_type: 'capital',
    authority: 'RVO / Provincies',
    budget: 'Varieert per openstelling',
    status: 'upcoming',
    open_date: '2026-04-15',
    close_date: '2026-08-31',
    description:
      'POP3+ subsidie voor kennisoverdracht en advies aan agrarische ondernemers. Financiert cursussen, ' +
      'workshops, demonstratieactiviteiten en individueel bedrijfsadvies gericht op verduurzaming. ' +
      'Maximaal 100% subsidie voor niet-productieve investeringen.',
    eligible_applicants:
      'Adviesorganisaties, brancheorganisaties en samenwerkingsverbanden die kennis overdragen aan agrariërs.',
    match_funding_pct: 0,
    max_grant_value: 200000,
  },
  {
    id: 'pop3-samenwerking',
    name: 'POP3+ Openstelling Samenwerking',
    grant_type: 'capital',
    authority: 'RVO / Provincies',
    budget: 'Varieert per openstelling',
    status: 'upcoming',
    open_date: '2026-05-01',
    close_date: '2026-10-31',
    description:
      'POP3+ subsidie voor samenwerkingsprojecten in de agrarische sector. Stimuleert samenwerking ' +
      'tussen agrariërs, onderzoekers, ketenpartijen en maatschappelijke organisaties. Projecten gericht ' +
      'op innovatie, korte ketens, klimaatadaptatie of biodiversiteitsherstel.',
    eligible_applicants:
      'Samenwerkingsverbanden van minimaal 2 partijen waarvan ten minste 1 agrarisch bedrijf.',
    match_funding_pct: 50,
    max_grant_value: 500000,
  },
  {
    id: 'leader',
    name: 'LEADER Subsidies (per regio)',
    grant_type: 'capital',
    authority: 'Lokale Actiegroepen (LAG) / Provincies',
    budget: 'Regionaal budget per LAG-gebied',
    status: 'rolling',
    open_date: null,
    close_date: null,
    description:
      'Bottom-up subsidie voor plattelandsontwikkeling via lokale actiegroepen (LAG). Projecten moeten ' +
      'passen binnen de regionale ontwikkelstrategie (LOS). Richt zich op leefbaarheid, economische ' +
      'vitaliteit, innovatie en duurzaamheid van het platteland. Per regio verschillende prioriteiten.',
    eligible_applicants:
      'Lokale organisaties, agrariërs, MKB-bedrijven, stichtingen en gemeenten in een LAG-gebied.',
    match_funding_pct: 50,
    max_grant_value: 200000,
  },
  {
    id: 'lbv-plus',
    name: 'Regeling Vermindering Veestapel (Lbv-plus)',
    grant_type: 'buyout',
    authority: 'RVO / Ministerie van LNV',
    budget: 'Ca. 975 mln EUR (piekbelasters)',
    status: 'open',
    open_date: '2025-07-01',
    close_date: null,
    description:
      'Aanvulling op de Lbv-regeling specifiek voor piekbelasters. Hogere vergoeding dan standaard Lbv: ' +
      '120% van de forfaitaire waarde productiecapaciteit. Vereist definitieve beeindiging veehouderijactiviteiten ' +
      'en doorhaling productierechten. Beroepsverbod op dezelfde locatie.',
    eligible_applicants:
      'Veehouderijen aangemerkt als piekbelaster (hoge stikstofbelasting op Natura 2000-gebieden).',
    match_funding_pct: 0,
    max_grant_value: null,
  },
  {
    id: 'stikstofreductie-natuur',
    name: 'Maatregelen Stikstofreductie en Natuurherstel',
    grant_type: 'capital',
    authority: 'Ministerie van LNV / Provincies',
    budget: 'Onderdeel Transitiefonds (ca. 24,3 miljard EUR totaal)',
    status: 'open',
    open_date: '2025-01-01',
    close_date: null,
    description:
      'Breed pakket maatregelen voor stikstofreductie in de landbouw: managementmaatregelen (voer, ' +
      'bemesting), technische maatregelen (luchtwassers, emissiearme vloeren) en gebiedsgerichte aanpak. ' +
      'Provincies voeren regie op gebiedsniveau. Subsidies beschikbaar via provinciale en rijksregelingen.',
    eligible_applicants:
      'Agrarische bedrijven in gebieden met hoge stikstofbelasting, in overleg met provincie.',
    match_funding_pct: 40,
    max_grant_value: null,
  },
  {
    id: 'ehf-landbouw',
    name: 'EHF/RRF Middelen Landbouw (Europees Herstelfonds)',
    grant_type: 'capital',
    authority: 'Ministerie van LNV / RVO',
    budget: 'Ca. 811 mln EUR (NL allocatie landbouw)',
    status: 'open',
    open_date: '2025-01-01',
    close_date: '2026-12-31',
    description:
      'Middelen uit het Europees Herstelfonds (Recovery and Resilience Facility) bestemd voor ' +
      'verduurzaming van de Nederlandse landbouw. Financiert investeringen in klimaatadaptatie, ' +
      'precisielandbouw, kringlooplandbouw en vermindering afhankelijkheid van fossiele brandstoffen.',
    eligible_applicants:
      'Agrarische bedrijven die investeren in verduurzaming en klimaatadaptatie conform het nationaal herstelplan.',
    match_funding_pct: 40,
    max_grant_value: 500000,
  },
  {
    id: 'agroforestry-pilots',
    name: 'Subsidie Agroforestry Pilots',
    grant_type: 'capital',
    authority: 'RVO / Ministerie van LNV',
    budget: 'Ca. 6 mln EUR (pilotfase)',
    status: 'upcoming',
    open_date: '2026-09-01',
    close_date: '2026-12-31',
    description:
      'Subsidie voor pilotprojecten met agroforestry (bomenteelt gecombineerd met landbouw). ' +
      'Financiert aanplant van bomen en struiken op landbouwpercelen, ontwerpkosten en monitoring. ' +
      'Doel: koolstofvastlegging, biodiversiteit en aanvullend inkomen uit hout, noten of fruit.',
    eligible_applicants:
      'Landbouwbedrijven die agroforestry willen toepassen op minimaal 0,5 hectare landbouwgrond.',
    match_funding_pct: 40,
    max_grant_value: 50000,
  },
  {
    id: 'zeldzame-huisdierrassen',
    name: 'Regeling Zeldzame Huisdierrassen',
    grant_type: 'capital',
    authority: 'RVO',
    budget: 'Ca. 1,5 mln EUR per jaar',
    status: 'rolling',
    open_date: null,
    close_date: null,
    description:
      'Subsidie voor het in stand houden van zeldzame Nederlandse huisdierrassen (landbouwhuisdieren). ' +
      'Vergoeding per dier voor het houden van rassen op de rassenlijst van de Stichting Zeldzame ' +
      'Huisdierrassen. Jaarlijkse uitbetaling op basis van veestapeltelling.',
    eligible_applicants:
      'Houders van dieren die voorkomen op de rassenlijst zeldzame huisdierrassen (SZH).',
    match_funding_pct: 0,
    max_grant_value: 20000,
  },
  {
    id: 'precisie-landbouw-demo',
    name: 'Demonstratieprojecten Precisie-landbouw',
    grant_type: 'capital',
    authority: 'RVO / Topsector Agri & Food',
    budget: 'Ca. 10 mln EUR',
    status: 'upcoming',
    open_date: '2026-06-01',
    close_date: '2026-11-30',
    description:
      'Subsidie voor demonstratieprojecten die precisielandbouwtechnieken tonen aan andere agrariërs. ' +
      'Financiert demonstratie van GPS-besturing, variabel doseren, drones voor gewasbescherming, ' +
      'bodemscans en sensorgestuurde beregening. Kennisdeling is verplicht onderdeel.',
    eligible_applicants:
      'Agrarische bedrijven die precisielandbouwtechnieken demonstreren, bij voorkeur in samenwerking met leveranciers of kennisinstellingen.',
    match_funding_pct: 50,
    max_grant_value: 100000,
  },
  {
    id: 'srv',
    name: 'Regeling Sanering Varkenshouderij (Srv)',
    grant_type: 'buyout',
    authority: 'RVO / Ministerie van LNV',
    budget: 'Ca. 455 mln EUR',
    status: 'open',
    open_date: '2025-01-01',
    close_date: null,
    description:
      'Saneringsregeling voor varkenshouderijen in veedichte gebieden (concentratiegebieden Zuid en Oost). ' +
      'Vergoeding voor het definitief beëindigen van de varkenshouderijtak en het slopen van stallen. ' +
      'Deelname aan Srv sluit deelname aan Lbv-plus uit.',
    eligible_applicants:
      'Varkenshouders in de concentratiegebieden Zuid en Oost met geldige varkensrechten.',
    match_funding_pct: 0,
    max_grant_value: null,
  },
  {
    id: 'toekomstbestendige-stallen',
    name: 'Toekomstbestendige Stallen Regeling',
    grant_type: 'capital',
    authority: 'RVO / Ministerie van LNV',
    budget: 'Ca. 172 mln EUR',
    status: 'upcoming',
    open_date: '2026-04-01',
    close_date: '2026-10-31',
    description:
      'Subsidie voor het bouwen of verbouwen van stallen die voldoen aan toekomstbestendige normen: ' +
      'integraal lagere emissies (ammoniak, fijnstof, geur, methaan), verbeterd dierenwelzijn en ' +
      'brandveiligheid. Hogere subsidiepercentages voor integraal duurzame concepten.',
    eligible_applicants:
      'Veehouders die investeren in nieuwbouw of ingrijpende renovatie van stalsystemen.',
    match_funding_pct: 40,
    max_grant_value: 750000,
  },

  // ── Provincial grants (12 provinces) ──────────────────────────────────
  {
    id: 'prov-brabant-stal',
    name: 'Noord-Brabant: Stal-innovatie en Emissiebeperking',
    grant_type: 'capital',
    authority: 'Provincie Noord-Brabant',
    budget: 'Ca. 40 mln EUR (provinciaal)',
    status: 'open',
    open_date: '2025-01-01',
    close_date: '2026-12-31',
    description:
      'Provinciale subsidie voor innovatieve stalsystemen in Noord-Brabant. Aanvullend op Sbv-rijksregeling. ' +
      'Specifieke aandacht voor gecombineerde emissiebeperking (ammoniak + fijnstof + geur). ' +
      'Voorrang voor bedrijven nabij Natura 2000 en woonkernen.',
    eligible_applicants:
      'Veehouders in Noord-Brabant die investeren in emissiebeperkende staltechnologie.',
    match_funding_pct: 40,
    max_grant_value: 200000,
  },
  {
    id: 'prov-gelderland-stikstof',
    name: 'Gelderland: Stikstofbank en Innovatieregeling',
    grant_type: 'capital',
    authority: 'Provincie Gelderland',
    budget: 'Ca. 65 mln EUR (provinciaal stikstoffonds)',
    status: 'open',
    open_date: '2025-01-01',
    close_date: null,
    description:
      'Gelderse stikstofbank-regeling: bedrijven die emissies reduceren kunnen stikstofruimte ' +
      'beschikbaar stellen voor gebiedsontwikkeling. Daarnaast innovatiesubsidies voor agrariërs ' +
      'die bovenwettelijke emissiereductie realiseren.',
    eligible_applicants:
      'Agrarische bedrijven in Gelderland, in het bijzonder nabij Natura 2000-gebieden op de Veluwe.',
    match_funding_pct: 50,
    max_grant_value: 300000,
  },
  {
    id: 'prov-noord-holland-weidevogel',
    name: 'Noord-Holland: Weidevogelbeheer en Agrarisch Natuurbeheer',
    grant_type: 'revenue',
    authority: 'Provincie Noord-Holland',
    budget: 'Ca. 15 mln EUR per jaar',
    status: 'rolling',
    open_date: null,
    close_date: null,
    description:
      'Vergoeding voor agrarisch weidevogelbeheer in aangewezen weidevogelkerngebieden. Beheerpakketten: ' +
      'uitgesteld maaien, plasdras, kruidenrijk grasland, rustperiodes. Contracten via agrarische collectieven ' +
      'voor 6 jaar. Vergoeding per hectare per beheerpakket.',
    eligible_applicants:
      'Agrariërs in Noord-Hollandse weidevogelkerngebieden, deelname via agrarisch collectief.',
    match_funding_pct: 0,
    max_grant_value: null,
  },
  {
    id: 'prov-friesland-veenweide',
    name: 'Friesland: Veenweideprogramma',
    grant_type: 'capital',
    authority: 'Provincie Fryslân',
    budget: 'Ca. 100 mln EUR (programmaperiode)',
    status: 'open',
    open_date: '2025-01-01',
    close_date: '2028-12-31',
    description:
      'Subsidie voor maatregelen tegen bodemdaling in het Friese veenweidegebied. Waterinfiltratiesystemen, ' +
      'onderwaterdrainage, aanpassing waterpeil, omschakeling naar natte teelten (paludicultuur). ' +
      'Combinatie van investeringssubsidie en beheervergoeding.',
    eligible_applicants:
      'Agrariërs en grondeigenaren in het Friese veenweidegebied (aangewezen gebieden).',
    match_funding_pct: 50,
    max_grant_value: 150000,
  },
  {
    id: 'prov-overijssel-natuur-inclusief',
    name: 'Overijssel: Natuur-inclusieve Landbouw',
    grant_type: 'capital',
    authority: 'Provincie Overijssel',
    budget: 'Ca. 20 mln EUR',
    status: 'open',
    open_date: '2025-06-01',
    close_date: '2026-12-31',
    description:
      'Provinciale subsidie voor de transitie naar natuur-inclusieve landbouw. Financiert aanleg van ' +
      'landschapselementen (hagen, poelen, akkerranden), omschakeling naar biologisch, extensivering ' +
      'en ontwikkeling van korte ketens. Combineerbaar met ANLb-beheervergoedingen.',
    eligible_applicants:
      'Agrariërs in Overijssel die stappen zetten richting natuur-inclusieve bedrijfsvoering.',
    match_funding_pct: 50,
    max_grant_value: 75000,
  },
  {
    id: 'prov-utrecht-duurzame-energie',
    name: 'Utrecht: Duurzame Energie in de Landbouw',
    grant_type: 'capital',
    authority: 'Provincie Utrecht',
    budget: 'Ca. 8 mln EUR',
    status: 'open',
    open_date: '2025-01-01',
    close_date: '2026-12-31',
    description:
      'Subsidie voor energiebesparende en -opwekkende investeringen op agrarische bedrijven in Utrecht. ' +
      'Aanvullend op ISDE en SDE++: dekt investeringen die niet onder rijksregelingen vallen, zoals ' +
      'energieopslag, slimme netten en warmtekoudeopslag voor glastuinbouw.',
    eligible_applicants:
      'Agrarische bedrijven gevestigd in de provincie Utrecht.',
    match_funding_pct: 40,
    max_grant_value: 50000,
  },
  {
    id: 'prov-limburg-boomgaarden',
    name: 'Limburg: Boomgaarden en Biodiversiteit',
    grant_type: 'capital',
    authority: 'Provincie Limburg',
    budget: 'Ca. 5 mln EUR',
    status: 'open',
    open_date: '2025-03-01',
    close_date: '2026-12-31',
    description:
      'Subsidie voor aanplant, herstel en onderhoud van hoogstamboomgaarden in Zuid-Limburg. ' +
      'Financiert fruitbomen (oude rassen), onderbegroeiing, nestkasten en ecologisch beheer. ' +
      'Onderdeel van het Limburgse biodiversiteitsprogramma.',
    eligible_applicants:
      'Agrariërs, landgoedeigenaren en stichtingen in Zuid-Limburg met minimaal 0,3 hectare boomgaard.',
    match_funding_pct: 60,
    max_grant_value: 25000,
  },
  {
    id: 'prov-zeeland-zilte-teelt',
    name: 'Zeeland: Zilte Teelt en Klimaatadaptatie',
    grant_type: 'capital',
    authority: 'Provincie Zeeland',
    budget: 'Ca. 4 mln EUR',
    status: 'upcoming',
    open_date: '2026-04-01',
    close_date: '2026-11-30',
    description:
      'Subsidie voor pilotprojecten met zilte teelt en zouttolerant gewasonderzoek in Zeeland. ' +
      'Financiert teelt van zeekraal, lamsoor, zeeaster en zilte aardappelrassen. Ondersteunt ' +
      'klimaatadaptatie in gebieden met toenemende verzilting.',
    eligible_applicants:
      'Agrariërs in Zeeuwse kustgebieden en onderzoekers die zilte gewassen ontwikkelen.',
    match_funding_pct: 60,
    max_grant_value: 40000,
  },
  {
    id: 'prov-drenthe-erfgoed',
    name: 'Drenthe: Agrarisch Erfgoed en Landschap',
    grant_type: 'capital',
    authority: 'Provincie Drenthe',
    budget: 'Ca. 3 mln EUR',
    status: 'open',
    open_date: '2025-01-01',
    close_date: '2026-12-31',
    description:
      'Subsidie voor behoud en herstel van agrarisch erfgoed in Drenthe: historische boerderijen, ' +
      'esgehuchten, schaapskooien en authentieke landschapselementen. Combinatie van restauratie ' +
      'en herbestemming voor agrarisch gebruik of agrotoerisme.',
    eligible_applicants:
      'Eigenaren van agrarisch erfgoed in Drenthe (monumenten en karakteristieke boerderijen).',
    match_funding_pct: 50,
    max_grant_value: 50000,
  },
  {
    id: 'prov-flevoland-schaalvergroting',
    name: 'Flevoland: Schaalvergroting en Innovatie',
    grant_type: 'capital',
    authority: 'Provincie Flevoland',
    budget: 'Ca. 12 mln EUR',
    status: 'open',
    open_date: '2025-01-01',
    close_date: '2026-12-31',
    description:
      'Subsidie voor innovatieve grootschalige landbouwprojecten in Flevoland. Richt zich op ' +
      'precisielandbouw, robotisering, autonome voertuigen en datagedreven akkerbouw. Stimuleert ' +
      'schaalvoordelen in combinatie met duurzaamheidswinst.',
    eligible_applicants:
      'Akkerbouwers en veehouders in Flevoland die investeren in schaalbare innovatietechnologie.',
    match_funding_pct: 40,
    max_grant_value: 200000,
  },
  {
    id: 'prov-groningen-aardbevingsbestendig',
    name: 'Groningen: Aardbevingsbestendig Boeren',
    grant_type: 'capital',
    authority: 'Provincie Groningen / Nationaal Programma Groningen',
    budget: 'Ca. 30 mln EUR',
    status: 'open',
    open_date: '2025-01-01',
    close_date: '2027-12-31',
    description:
      'Subsidie voor aardbevingsbestendige aanpassingen aan agrarische gebouwen en infrastructuur ' +
      'in het Groninger aardbevingsgebied. Versterking stallen, schuren, opslagloodsen. Combineerbaar ' +
      'met verduurzamingsinvesteringen (isolatie, zonnepanelen) bij herbouw.',
    eligible_applicants:
      'Agrariërs in het Groninger aardbevingsgebied met gebouwen die versterking nodig hebben.',
    match_funding_pct: 0,
    max_grant_value: 500000,
  },
  {
    id: 'prov-zuid-holland-groene-hart',
    name: 'Zuid-Holland: Groene Hart Landbouwtransitie',
    grant_type: 'capital',
    authority: 'Provincie Zuid-Holland',
    budget: 'Ca. 25 mln EUR',
    status: 'open',
    open_date: '2025-01-01',
    close_date: '2027-12-31',
    description:
      'Subsidie voor landbouwtransitie in het Groene Hart: extensivering melkveehouderij, ' +
      'verhoging waterpeil veenweide, natte teelten en korte-keteninitiatieven. Onderdeel van ' +
      'het Nationaal Programma Landelijk Gebied (NPLG) voor Zuid-Holland.',
    eligible_applicants:
      'Melkveehouders en akkerbouwers in het Groene Hart-gebied van Zuid-Holland.',
    match_funding_pct: 50,
    max_grant_value: 200000,
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
// 2. ELIGIBLE ITEMS
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
  // ── ISDE — Warmtepompen ───────────────────────────────────────────────
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
  {
    id: 'isde-wp-ll-01',
    grant_id: 'isde',
    item_code: 'ISDE-WP-LL',
    name: 'Warmtepomp lucht-lucht',
    description: 'Lucht-lucht warmtepomp (split-unit) voor ruimteverwarming',
    specification: 'SCOP ≥ 3.8, minimaal energielabel A+++, KEYMARK gecertificeerd',
    grant_value: 1200,
    grant_unit: 'per woning',
    category: 'warmtepomp',
    score: null,
  },
  {
    id: 'isde-wp-hybrid-01',
    grant_id: 'isde',
    item_code: 'ISDE-WP-HYB',
    name: 'Hybride warmtepomp',
    description: 'Hybride warmtepomp die samenwerkt met bestaande cv-ketel',
    specification: 'SCOP ≥ 3.6, geschikt voor bestaande radiatoren, KEYMARK gecertificeerd',
    grant_value: 1700,
    grant_unit: 'per woning',
    category: 'warmtepomp',
    score: null,
  },

  // ── ISDE — Zonneboilers ──────────────────────────────────────────────
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

  // ── ISDE — Isolatie ──────────────────────────────────────────────────
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
    name: 'Gevelisolatie (spouwmuurisolatie)',
    description: 'Isolatie van de buitengevel (spouwmuur of buitenzijde)',
    specification: 'Minimale Rd-waarde ≥ 3.5 m²·K/W',
    grant_value: 7,
    grant_unit: 'per m²',
    category: 'isolatie',
    score: null,
  },
  {
    id: 'isde-iso-hr-glas',
    grant_id: 'isde',
    item_code: 'ISDE-ISO-HR',
    name: 'HR++ beglazing',
    description: 'Vervanging van enkel of dubbelglas door HR++ of triple glas',
    specification: 'U-waarde ≤ 1.2 W/m²·K voor HR++, ≤ 0.7 voor triple glas',
    grant_value: 36,
    grant_unit: 'per m²',
    category: 'isolatie',
    score: null,
  },

  // ── SDE++ — Categorieën ──────────────────────────────────────────────
  {
    id: 'sde-zon-pv-klein',
    grant_id: 'sde-plus-plus',
    item_code: 'SDE-ZON-PV-S',
    name: 'Zon-PV (< 15 kWp)',
    description: 'Zonnepanelen installatie kleiner dan 15 kWp op dak of grond',
    specification: 'Aansluiting op elektriciteitsnet, transportindicatie netbeheerder vereist',
    grant_value: 0.057,
    grant_unit: 'EUR/kWh (basisbedrag)',
    category: 'zon-pv',
    score: null,
  },
  {
    id: 'sde-zon-pv-mid',
    grant_id: 'sde-plus-plus',
    item_code: 'SDE-ZON-PV-M',
    name: 'Zon-PV (15-100 kWp)',
    description: 'Middelgroot zonnestroomsysteem voor agrarisch of zakelijk dak',
    specification: '15-100 kWp, omgevingsvergunning indien > 50 kWp, EAN-code vereist',
    grant_value: 0.052,
    grant_unit: 'EUR/kWh (basisbedrag)',
    category: 'zon-pv',
    score: null,
  },
  {
    id: 'sde-zon-pv-groot',
    grant_id: 'sde-plus-plus',
    item_code: 'SDE-ZON-PV-L',
    name: 'Zon-PV (> 100 kWp)',
    description: 'Grootschalig zonnestroomsysteem (zonnepark of groot dak)',
    specification: '> 100 kWp, omgevingsvergunning, SDE-haalbaarheidsstudie, transportindicatie',
    grant_value: 0.047,
    grant_unit: 'EUR/kWh (basisbedrag)',
    category: 'zon-pv',
    score: null,
  },
  {
    id: 'sde-wind-klein',
    grant_id: 'sde-plus-plus',
    item_code: 'SDE-WIND-S',
    name: 'Windturbine (< 500 kW)',
    description: 'Kleine windturbine voor agrarisch gebruik',
    specification: 'Ashoogte < 15 m of vermogen < 500 kW, IEC 61400 gecertificeerd',
    grant_value: 0.065,
    grant_unit: 'EUR/kWh (basisbedrag)',
    category: 'wind',
    score: null,
  },
  {
    id: 'sde-wind-groot',
    grant_id: 'sde-plus-plus',
    item_code: 'SDE-WIND-L',
    name: 'Windturbine (≥ 500 kW)',
    description: 'Grotere windturbine voor coöperatie of agrarisch bedrijf',
    specification: 'Vermogen ≥ 500 kW, omgevingsvergunning, geluids- en slagschaduwrapport',
    grant_value: 0.048,
    grant_unit: 'EUR/kWh (basisbedrag)',
    category: 'wind',
    score: null,
  },
  {
    id: 'sde-mono-mestvergisting',
    grant_id: 'sde-plus-plus',
    item_code: 'SDE-MEST',
    name: 'Mono-mestvergisting',
    description: 'Vergisting van uitsluitend dierlijke mest voor biogas/groengas-productie',
    specification: 'Minimaal 80% dierlijke mest als invoer, WKK of groengas-opwerking',
    grant_value: 0.128,
    grant_unit: 'EUR/kWh (basisbedrag)',
    category: 'biomassa',
    score: null,
  },
  {
    id: 'sde-biomassa-ketel',
    grant_id: 'sde-plus-plus',
    item_code: 'SDE-BIO-K',
    name: 'Biomassaketel (industrieel)',
    description: 'Biomassa verwarmingsketel voor industrieel of agrarisch gebruik',
    specification: 'NTA 8003 gecertificeerd, emissie-eisen conform Activiteitenbesluit',
    grant_value: 0.035,
    grant_unit: 'EUR/kWh (basisbedrag)',
    category: 'biomassa',
    score: null,
  },
  {
    id: 'sde-geothermie',
    grant_id: 'sde-plus-plus',
    item_code: 'SDE-GEO',
    name: 'Geothermie (aardwarmte)',
    description: 'Geothermische warmtewinning uit diepe ondergrond (> 500 m)',
    specification: 'SodM-vergunning, seismisch risicorapport, minimaal 5 MW thermisch',
    grant_value: 0.058,
    grant_unit: 'EUR/kWh (basisbedrag)',
    category: 'geothermie',
    score: null,
  },
  {
    id: 'sde-aquathermie',
    grant_id: 'sde-plus-plus',
    item_code: 'SDE-AQUA',
    name: 'Aquathermie (thermische energie uit water)',
    description: 'Warmtewinning uit oppervlaktewater, afvalwater of drinkwater',
    specification: 'Minimaal COP 4.0, waterschapsvergunning, haalbaarheidsstudie',
    grant_value: 0.042,
    grant_unit: 'EUR/kWh (basisbedrag)',
    category: 'aquathermie',
    score: null,
  },

  // ── Sbv — Emissiereductie stallen ────────────────────────────────────
  {
    id: 'sbv-emissiearme-vloer',
    grant_id: 'sbv',
    item_code: 'SBV-VLOER',
    name: 'Emissiearme stalvloer',
    description: 'Stalvloersysteem met bewezen ammoniakemissiereductie',
    specification: 'Opgenomen in RAV-lijst (Regeling ammoniak en veehouderij), min. 50% emissiereductie',
    grant_value: 100,
    grant_unit: 'per m² staloppervlak',
    category: 'stalverduurzaming',
    score: null,
  },
  {
    id: 'sbv-luchtwasser-chem',
    grant_id: 'sbv',
    item_code: 'SBV-LW-CHEM',
    name: 'Luchtwasser (chemisch)',
    description: 'Chemische luchtwasser (zure wasser) voor ammoniakverwijdering uit stallucht',
    specification: 'Minimaal 90% ammoniakverwijdering, BWL-erkenning, zuurverbruik monitoring',
    grant_value: 30000,
    grant_unit: 'per installatie',
    category: 'stalverduurzaming',
    score: null,
  },
  {
    id: 'sbv-luchtwasser-bio',
    grant_id: 'sbv',
    item_code: 'SBV-LW-BIO',
    name: 'Luchtwasser (biologisch)',
    description: 'Biologische luchtwasser die ammoniak omzet via bacterieën',
    specification: 'Minimaal 70% ammoniakverwijdering, BWL-erkenning, spuiwater afvoer',
    grant_value: 40000,
    grant_unit: 'per installatie',
    category: 'stalverduurzaming',
    score: null,
  },
  {
    id: 'sbv-luchtwasser-combi',
    grant_id: 'sbv',
    item_code: 'SBV-LW-COMBI',
    name: 'Luchtwasser (gecombineerd)',
    description: 'Gecombineerde luchtwasser (chemisch + biologisch + waterwasstap)',
    specification: 'Minimaal 85% ammoniak, 80% geur, 80% fijnstof reductie, BWL-erkenning',
    grant_value: 55000,
    grant_unit: 'per installatie',
    category: 'stalverduurzaming',
    score: null,
  },
  {
    id: 'sbv-mestscheiding',
    grant_id: 'sbv',
    item_code: 'SBV-MSCH',
    name: 'Mestscheidingsinstallatie',
    description: 'Scheiding van mest in een dunne en dikke fractie ter vermindering van emissies',
    specification: 'Scheiding > 60% fosfaat in dikke fractie, mestopslag gesloten',
    grant_value: 25000,
    grant_unit: 'per installatie',
    category: 'stalverduurzaming',
    score: null,
  },
  {
    id: 'sbv-methaan',
    grant_id: 'sbv',
    item_code: 'SBV-CH4',
    name: 'Methaanreductie-installatie',
    description: 'Systeem voor afvang of oxidatie van methaanuitstoot uit mestopslag',
    specification: 'Bewezen methaanreductie ≥ 50%, monitoring-protocol vereist',
    grant_value: 35000,
    grant_unit: 'per installatie',
    category: 'stalverduurzaming',
    score: null,
  },

  // ── JOLA items ───────────────────────────────────────────────────────
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
  {
    id: 'jola-precisie',
    grant_id: 'jola',
    item_code: 'JOLA-PREC',
    name: 'Precisiebemestingsapparatuur',
    description: 'GPS-gestuurde bemestingsapparatuur voor variabele dosering',
    specification: 'RTK-GPS nauwkeurigheid ≤ 2 cm, automatische sectieafsluiting',
    grant_value: 5000,
    grant_unit: 'per systeem',
    category: 'precisielandbouw',
    score: 4,
  },
  {
    id: 'jola-gps',
    grant_id: 'jola',
    item_code: 'JOLA-GPS',
    name: 'GPS-besturingssysteem (RTK)',
    description: 'RTK-GPS besturingssysteem voor trekker of zelfrijder',
    specification: 'RTK-correctiesignaal, nauwkeurigheid ≤ 2 cm, universele ISO 11783 koppeling',
    grant_value: 4500,
    grant_unit: 'per systeem',
    category: 'precisielandbouw',
    score: 5,
  },
  {
    id: 'jola-drone',
    grant_id: 'jola',
    item_code: 'JOLA-DRONE',
    name: 'Drone voor gewasinspectie',
    description: 'Drone met multispectrale camera voor gewasmonitoring en ziektedetectie',
    specification: 'Minimaal NDVI-sensor, vluchttijd ≥ 30 min, CE-markering, ROC-light certificering',
    grant_value: 3000,
    grant_unit: 'per systeem',
    category: 'precisielandbouw',
    score: 3,
  },
  {
    id: 'jola-mechanisch-onkruid',
    grant_id: 'jola',
    item_code: 'JOLA-MECH',
    name: 'Mechanische onkruidbestrijding',
    description: 'Schoffelmachine, wiedeg of rijenspuit met camera-geleiding',
    specification: 'Camera-geleiding of GPS-besturing, geschikt voor rijgewassen',
    grant_value: 4000,
    grant_unit: 'per machine',
    category: 'precisielandbouw',
    score: 3,
  },

  // ── MIT items ────────────────────────────────────────────────────────
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

  // ── Borgstellingsfonds ───────────────────────────────────────────────
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

  // ── SVM items ────────────────────────────────────────────────────────
  {
    id: 'svm-energieadvies',
    grant_id: 'svm',
    item_code: 'SVM-ADV',
    name: 'Energieadvies MKB',
    description: 'Professioneel energieadvies door gecertificeerde adviseur',
    specification: 'Adviseur geregistreerd bij RVO, rapport conform SVM-format',
    grant_value: 2500,
    grant_unit: 'per bedrijf',
    category: 'advies',
    score: null,
  },
  {
    id: 'svm-uitvoering',
    grant_id: 'svm',
    item_code: 'SVM-UITV',
    name: 'Uitvoering verduurzamingsmaatregelen (SVM)',
    description: 'Uitvoering van maatregelen uit het energieadvies',
    specification: 'Maatregelen moeten voortkomen uit goedgekeurd SVM-energieadvies',
    grant_value: 2500,
    grant_unit: 'per bedrijf',
    category: 'verduurzaming',
    score: null,
  },

  // ── Agroforestry items ───────────────────────────────────────────────
  {
    id: 'agro-aanplant',
    grant_id: 'agroforestry-pilots',
    item_code: 'AGRO-PLANT',
    name: 'Aanplant bomen en struiken op landbouwperceel',
    description: 'Aanplantkosten voor agroforestry-systeem (bomenrijen, hagen, voedselbossen)',
    specification: 'Minimaal 30 bomen per hectare, inheemse of productieve soorten',
    grant_value: 3000,
    grant_unit: 'per hectare',
    category: 'agroforestry',
    score: null,
  },
  {
    id: 'agro-ontwerp',
    grant_id: 'agroforestry-pilots',
    item_code: 'AGRO-ONTW',
    name: 'Ontwerpkosten agroforestry-systeem',
    description: 'Professioneel ontwerp van agroforestry-perceelinrichting',
    specification: 'Ontwerp door erkend adviseur, inclusief bodemanalyse',
    grant_value: 5000,
    grant_unit: 'per project',
    category: 'agroforestry',
    score: null,
  },

  // ── Precisie-landbouw demo items ─────────────────────────────────────
  {
    id: 'demo-variabel-doseren',
    grant_id: 'precisie-landbouw-demo',
    item_code: 'DEMO-VD',
    name: 'Demonstratie variabel doseren',
    description: 'Demonstratie van variabele dosering gewasbescherming of bemesting op basis van taakkaarten',
    specification: 'Taakkaart op basis van satelliet- of dronebeelden, openbare demonstratie verplicht',
    grant_value: 15000,
    grant_unit: 'per demonstratieproject',
    category: 'precisielandbouw',
    score: null,
  },
  {
    id: 'demo-bodemscan',
    grant_id: 'precisie-landbouw-demo',
    item_code: 'DEMO-SCAN',
    name: 'Demonstratie bodemscan-technologie',
    description: 'Demonstratie van elektrische of elektromagnetische bodemscanner voor perceelkartering',
    specification: 'Meting van geleidbaarheid, pH en organische stof, koppeling aan bemestingsadvies',
    grant_value: 10000,
    grant_unit: 'per demonstratieproject',
    category: 'precisielandbouw',
    score: null,
  },

  // ── Toekomstbestendige stallen items ─────────────────────────────────
  {
    id: 'ts-integraal-concept',
    grant_id: 'toekomstbestendige-stallen',
    item_code: 'TS-INTEGRAAL',
    name: 'Integraal duurzaam stalconcept',
    description: 'Nieuw stalconcept met gecombineerde emissie-, dierenwelzijn- en brandveiligheidsmaatregelen',
    specification: 'Voldoet aan Maatlat Duurzame Veehouderij (MDV) criteria voor alle categorieën',
    grant_value: 500000,
    grant_unit: 'per stalproject',
    category: 'stalverduurzaming',
    score: null,
  },
  {
    id: 'ts-brandveiligheid',
    grant_id: 'toekomstbestendige-stallen',
    item_code: 'TS-BRAND',
    name: 'Brandveiligheidsvoorzieningen stal',
    description: 'Branddetectie, compartimentering en vluchtmogelijkheden voor dieren',
    specification: 'Brandmeldinstallatie NEN 2535, compartimenten max 2.500 m², noodopening per afdeling',
    grant_value: 75000,
    grant_unit: 'per stal',
    category: 'stalverduurzaming',
    score: null,
  },

  // ── Zeldzame huisdierrassen items ────────────────────────────────────
  {
    id: 'zhr-rund',
    grant_id: 'zeldzame-huisdierrassen',
    item_code: 'ZHR-RUND',
    name: 'Zeldzaam runderras (per dier)',
    description: 'Vergoeding voor het houden van zeldzame Nederlandse runderrassen',
    specification: 'Ras op SZH-lijst (bijv. Brandrood, Lakenvelder, Fries Hollands), stamboekregistratie vereist',
    grant_value: 150,
    grant_unit: 'per dier per jaar',
    category: 'genetische bronnen',
    score: null,
  },
  {
    id: 'zhr-schaap',
    grant_id: 'zeldzame-huisdierrassen',
    item_code: 'ZHR-SCHAAP',
    name: 'Zeldzaam schapenras (per dier)',
    description: 'Vergoeding voor het houden van zeldzame Nederlandse schapenrassen',
    specification: 'Ras op SZH-lijst (bijv. Schoonebeeker, Veluws Heideschaap), stamboekregistratie vereist',
    grant_value: 40,
    grant_unit: 'per dier per jaar',
    category: 'genetische bronnen',
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
  // ── Original 10 rules ────────────────────────────────────────────────
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

  // ── New stacking rules ───────────────────────────────────────────────
  {
    grant_a: 'svm',
    grant_b: 'isde',
    compatible: 1,
    conditions: 'Combineerbaar. SVM voor energieadvies en kleine maatregelen, ISDE voor specifieke warmtepompen en isolatie. Kosten mogen niet overlappen.',
  },
  {
    grant_a: 'svm',
    grant_b: 'sde-plus-plus',
    compatible: 1,
    conditions: 'Combineerbaar. SVM voor advies en kleine investeringen, SDE++ voor exploitatiesubsidie op grotere installaties.',
  },
  {
    grant_a: 'lbv-plus',
    grant_b: 'srv',
    compatible: 0,
    conditions: 'Niet combineerbaar. Beide regelingen vereisen definitieve beeindiging van de veehouderijtak. Kies een van beide.',
  },
  {
    grant_a: 'lbv-plus',
    grant_b: 'sbv',
    compatible: 0,
    conditions: 'Niet combineerbaar. Lbv-plus vereist definitieve bedrijfsbeeindiging; Sbv is voor voortzettende bedrijven.',
  },
  {
    grant_a: 'srv',
    grant_b: 'borgstellingsfonds',
    compatible: 0,
    conditions: 'Niet combineerbaar. Srv vereist definitieve beeindiging varkenshouderijtak.',
  },
  {
    grant_a: 'sbv',
    grant_b: 'toekomstbestendige-stallen',
    compatible: 1,
    conditions: 'Combineerbaar mits voor verschillende stalonderdelen. Sbv voor emissiereducerende techniek, Toekomstbestendige Stallen voor integraal stalconcept. Cumulatief max 60% subsidie op dezelfde kostenpost.',
  },
  {
    grant_a: 'pop3-innovatie',
    grant_b: 'mit',
    compatible: 0,
    conditions: 'Niet combineerbaar voor hetzelfde project. Beide financieren innovatie; kies POP3+ (agrarisch gericht) of MIT (topsector-breed).',
  },
  {
    grant_a: 'pop3-innovatie',
    grant_b: 'wbso',
    compatible: 1,
    conditions: 'Combineerbaar. POP3+ voor projectkosten, WBSO voor loonkosten R&D-personeel. Geen dubbele financiering.',
  },
  {
    grant_a: 'agroforestry-pilots',
    grant_b: 'regeling-groenprojecten',
    compatible: 1,
    conditions: 'Combineerbaar. Agroforestry-subsidie voor aanplant, Regeling Groenprojecten voor gunstige financiering van resterende kosten.',
  },
  {
    grant_a: 'jola',
    grant_b: 'pop3-innovatie',
    compatible: 1,
    conditions: 'Combineerbaar. JOLA voor bedrijfsinvestering jonge landbouwer, POP3+ Innovatie voor specifiek innovatieproject. Verschillende kostenposten.',
  },
  {
    grant_a: 'ehf-landbouw',
    grant_b: 'isde',
    compatible: 1,
    conditions: 'Combineerbaar. EHF voor bredere verduurzaming, ISDE voor specifieke energiemaatregelen. Cumulatiemaximum: totale subsidie mag niet meer dan 80% van investering bedragen.',
  },
  {
    grant_a: 'ehf-landbouw',
    grant_b: 'sbv',
    compatible: 1,
    conditions: 'Combineerbaar. EHF voor bredere bedrijfsverduurzaming, Sbv voor specifieke staltechniek. Cumulatiemaximum van toepassing.',
  },
  {
    grant_a: 'prov-brabant-stal',
    grant_b: 'sbv',
    compatible: 1,
    conditions: 'Combineerbaar. Provinciale en rijkssubsidie stapelbaar voor staltechnologie. Cumulatiemaximum: max 60% totale subsidie op dezelfde investering.',
  },
  {
    grant_a: 'prov-gelderland-stikstof',
    grant_b: 'stikstofreductie-natuur',
    compatible: 1,
    conditions: 'Combineerbaar. Provinciale en rijksmiddelen voor stikstof stapelbaar. Provinciale regeling als aanvulling op rijksregeling.',
  },
  {
    grant_a: 'prov-friesland-veenweide',
    grant_b: 'pop3-samenwerking',
    compatible: 1,
    conditions: 'Combineerbaar. Veenweideprogramma voor gebiedsinvestering, POP3+ voor samenwerkingskosten. Gescheiden kostenposten.',
  },
  {
    grant_a: 'prov-groningen-aardbevingsbestendig',
    grant_b: 'isde',
    compatible: 1,
    conditions: 'Combineerbaar. Aardbevingsversterking gecombineerd met energiebesparing bij herbouw. ISDE voor warmtepompen/isolatie.',
  },
  {
    grant_a: 'prov-zuid-holland-groene-hart',
    grant_b: 'prov-friesland-veenweide',
    compatible: 0,
    conditions: 'Niet combineerbaar. Provinciale regelingen zijn gebiedsgebonden; een bedrijf valt onder de provincie van vestiging.',
  },
  {
    grant_a: 'zeldzame-huisdierrassen',
    grant_b: 'jola',
    compatible: 1,
    conditions: 'Combineerbaar. Zeldzame huisdierrassen als beheervergoeding, JOLA als investeringssubsidie. Geen overlap.',
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
  // ── ISDE (4 steps) ──────────────────────────────────────────────────
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

  // ── SDE++ (4 steps) ─────────────────────────────────────────────────
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

  // ── JOLA (4 steps) ──────────────────────────────────────────────────
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

  // ── Stoppersregeling (4 steps) ──────────────────────────────────────
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

  // ── Borgstellingsfonds (3 steps) ────────────────────────────────────
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

  // ── SVM (4 steps) ───────────────────────────────────────────────────
  {
    grant_id: 'svm',
    step_order: 1,
    description: 'Controleer of uw bedrijf voldoet aan de SVM-criteria (MKB, min. 10.000 kWh of 5.000 m3 gas per jaar).',
    evidence_required: 'KvK-uittreksel, energiefacturen van het afgelopen jaar',
    portal: null,
  },
  {
    grant_id: 'svm',
    step_order: 2,
    description: 'Vraag een SVM-energieadvies aan bij een geregistreerde adviseur via mijn.rvo.nl.',
    evidence_required: 'Offerte van SVM-geregistreerde adviseur',
    portal: 'https://mijn.rvo.nl/svm',
  },
  {
    grant_id: 'svm',
    step_order: 3,
    description: 'Ontvang het energieadvies en kies welke maatregelen u wilt uitvoeren.',
    evidence_required: 'Goedgekeurd energieadviesrapport',
    portal: null,
  },
  {
    grant_id: 'svm',
    step_order: 4,
    description: 'Voer de maatregelen uit en dien het vaststellingsverzoek in met facturen.',
    evidence_required: 'Facturen van uitgevoerde maatregelen, foto-bewijs',
    portal: 'https://mijn.rvo.nl/svm',
  },

  // ── POP3+ Innovatie (4 steps) ───────────────────────────────────────
  {
    grant_id: 'pop3-innovatie',
    step_order: 1,
    description: 'Stel een projectplan op met innovatiedoelstelling, begroting en samenwerkingspartners.',
    evidence_required: 'Projectplan, begroting, samenwerkingsovereenkomst met kennisinstelling',
    portal: null,
  },
  {
    grant_id: 'pop3-innovatie',
    step_order: 2,
    description: 'Dien de aanvraag in tijdens de provinciale openstelling via mijn.rvo.nl of het provinciale subsidieloket.',
    evidence_required: 'Volledig aanvraagformulier, KvK-uittreksel, de-minimisverklaring',
    portal: 'https://mijn.rvo.nl/pop3',
  },
  {
    grant_id: 'pop3-innovatie',
    step_order: 3,
    description: 'Beoordeling op innovatiewaarde, haalbaarheid en bijdrage aan verduurzaming. Rangschikking bij overtekening.',
    evidence_required: null,
    portal: null,
  },
  {
    grant_id: 'pop3-innovatie',
    step_order: 4,
    description: 'Voer het project uit conform plan en dien tussentijdse voortgangsrapportages en eindverantwoording in.',
    evidence_required: 'Voortgangsrapportages, financieel eindverslag, accountantsverklaring (bij > 125.000 EUR)',
    portal: 'https://mijn.rvo.nl',
  },

  // ── LEADER (3 steps) ────────────────────────────────────────────────
  {
    grant_id: 'leader',
    step_order: 1,
    description: 'Neem contact op met uw lokale actiegroep (LAG) en toets uw projectidee aan de regionale ontwikkelstrategie.',
    evidence_required: 'Projectschets, aansluiting bij LOS (Lokale Ontwikkelstrategie)',
    portal: null,
  },
  {
    grant_id: 'leader',
    step_order: 2,
    description: 'Dien een volledige aanvraag in bij de LAG. De LAG beoordeelt en rangschikt projecten.',
    evidence_required: 'Projectplan, begroting, bewijs lokaal draagvlak (bijv. steunverklaringen)',
    portal: null,
  },
  {
    grant_id: 'leader',
    step_order: 3,
    description: 'Na goedkeuring door LAG en provincie: uitvoering project en financiële verantwoording.',
    evidence_required: 'Facturen, bewijsmateriaal projectresultaten, eindrapportage',
    portal: null,
  },

  // ── Lbv-plus (4 steps) ─────────────────────────────────────────────
  {
    grant_id: 'lbv-plus',
    step_order: 1,
    description: 'Controleer via de AERIUS-check of uw bedrijf als piekbelaster wordt aangemerkt.',
    evidence_required: 'AERIUS-berekening (actueel), bedrijfsgegevens',
    portal: 'https://www.aerius.nl',
  },
  {
    grant_id: 'lbv-plus',
    step_order: 2,
    description: 'Dien de aanvraag in bij RVO. Laat productiecapaciteit en bedrijfsmiddelen taxeren.',
    evidence_required: 'Taxatierapport, bewijs productierechten, KvK-uittreksel',
    portal: 'https://mijn.rvo.nl/lbv-plus',
  },
  {
    grant_id: 'lbv-plus',
    step_order: 3,
    description: 'Beoordeling door RVO. Bij goedkeuring: ondertekening overeenkomst met vergoedingsbedrag (120% forfaitaire waarde).',
    evidence_required: 'Getekende overeenkomst',
    portal: null,
  },
  {
    grant_id: 'lbv-plus',
    step_order: 4,
    description: 'Beeindig veehouderijactiviteiten, lever productierechten in en sloop stallen conform overeenkomst.',
    evidence_required: 'Bewijs beeindiging activiteiten, sloopmelding, doorhaling productierechten',
    portal: null,
  },

  // ── Srv (4 steps) ──────────────────────────────────────────────────
  {
    grant_id: 'srv',
    step_order: 1,
    description: 'Controleer of uw varkenshouderij in een concentratiegebied (Zuid of Oost) ligt en geldige varkensrechten heeft.',
    evidence_required: 'Bewijs varkensrechten, locatiegegevens bedrijf',
    portal: null,
  },
  {
    grant_id: 'srv',
    step_order: 2,
    description: 'Dien de aanvraag in bij RVO. Geef aan welke stallen u wilt slopen.',
    evidence_required: 'Plattegrond bedrijf, stalregistratie, sloopplan',
    portal: 'https://mijn.rvo.nl/srv',
  },
  {
    grant_id: 'srv',
    step_order: 3,
    description: 'Beoordeling en taxatie door RVO. Vergoeding op basis van varkensrechten en sloopkosten.',
    evidence_required: 'Taxatierapport',
    portal: null,
  },
  {
    grant_id: 'srv',
    step_order: 4,
    description: 'Sloop stallen, lever varkensrechten in en dien vaststellingsverzoek in.',
    evidence_required: 'Sloopbewijs, doorhaling varkensrechten, foto-documentatie',
    portal: null,
  },

  // ── Toekomstbestendige Stallen (4 steps) ───────────────────────────
  {
    grant_id: 'toekomstbestendige-stallen',
    step_order: 1,
    description: 'Stel een integraal stalplan op dat voldoet aan de Maatlat Duurzame Veehouderij (MDV) criteria.',
    evidence_required: 'Stalontwerp, MDV-toetsing, omgevingsvergunning',
    portal: null,
  },
  {
    grant_id: 'toekomstbestendige-stallen',
    step_order: 2,
    description: 'Dien de subsidieaanvraag in bij RVO tijdens de openstelling.',
    evidence_required: 'Aanvraagformulier, begroting, MDV-certificaat, omgevingsvergunning',
    portal: 'https://mijn.rvo.nl/toekomstbestendige-stallen',
  },
  {
    grant_id: 'toekomstbestendige-stallen',
    step_order: 3,
    description: 'Beoordeling op integraliteit: emissie, dierenwelzijn, brandveiligheid. Hogere score geeft hogere subsidie.',
    evidence_required: null,
    portal: null,
  },
  {
    grant_id: 'toekomstbestendige-stallen',
    step_order: 4,
    description: 'Realiseer de stal conform plan en dien vaststellingsverzoek in na ingebruikname.',
    evidence_required: 'Oplevering, facturen, certificaten technische installaties, inspectie dierenwelzijn',
    portal: 'https://mijn.rvo.nl',
  },

  // ── Agroforestry Pilots (3 steps) ──────────────────────────────────
  {
    grant_id: 'agroforestry-pilots',
    step_order: 1,
    description: 'Stel een agroforestry-ontwerp op voor uw perceel met een erkende adviseur.',
    evidence_required: 'Perceelkaart, boomsoortenselectie, bodemanalyse',
    portal: null,
  },
  {
    grant_id: 'agroforestry-pilots',
    step_order: 2,
    description: 'Dien de subsidieaanvraag in bij RVO met ontwerp, begroting en monitoringsplan.',
    evidence_required: 'Aanvraagformulier, agroforestry-ontwerp, begroting, monitoringsplan',
    portal: 'https://mijn.rvo.nl',
  },
  {
    grant_id: 'agroforestry-pilots',
    step_order: 3,
    description: 'Plant bomen en struiken conform ontwerp en rapporteer over de eerste 3 groeiseizoenen.',
    evidence_required: 'Plantbewijs, foto-documentatie, jaarlijkse monitoringsrapportage',
    portal: null,
  },

  // ── Bezwaar en beroep (generic — applies to all) ───────────────────
  {
    grant_id: 'isde',
    step_order: 10,
    description: 'Bezwaar en beroep: bij afwijzing kunt u binnen 6 weken bezwaar maken bij RVO. Daarna beroep bij de rechtbank.',
    evidence_required: 'Bezwaarschrift met motivering, kopie afwijzingsbesluit',
    portal: 'https://www.rvo.nl/bezwaar',
  },
  {
    grant_id: 'sde-plus-plus',
    step_order: 10,
    description: 'Bezwaar en beroep: bij afwijzing kunt u binnen 6 weken bezwaar maken bij RVO. Daarna beroep bij College van Beroep voor het bedrijfsleven (CBb).',
    evidence_required: 'Bezwaarschrift, kopie afwijzingsbesluit, projectdocumentatie',
    portal: 'https://www.rvo.nl/bezwaar',
  },
  {
    grant_id: 'jola',
    step_order: 10,
    description: 'Bezwaar en beroep: bij afwijzing of lagere rangschikking kunt u binnen 6 weken bezwaar maken bij RVO.',
    evidence_required: 'Bezwaarschrift, motivering, kopie rangschikkingsbesluit',
    portal: 'https://www.rvo.nl/bezwaar',
  },

  // ── Subsidie-adviseur guidance ────────────────────────────────────
  {
    grant_id: 'sbv',
    step_order: 1,
    description: 'Schakel een gespecialiseerde subsidie-adviseur in voor Sbv. Veel subsidie-adviesbureaus bieden no-cure-no-pay trajecten aan.',
    evidence_required: null,
    portal: null,
  },
  {
    grant_id: 'sbv',
    step_order: 2,
    description: 'Laat de adviseur een stalconcept-scan uitvoeren en de RAV-beoordeling voorbereiden.',
    evidence_required: 'Stalgegevens, huidige emissiefactoren, gewenste techniek',
    portal: null,
  },
  {
    grant_id: 'sbv',
    step_order: 3,
    description: 'Dien de aanvraag in via mijn.rvo.nl met alle technische onderbouwing.',
    evidence_required: 'Aanvraagformulier, technisch rapport, RAV-code, offertes, omgevingsvergunning',
    portal: 'https://mijn.rvo.nl/sbv',
  },
  {
    grant_id: 'sbv',
    step_order: 4,
    description: 'Na goedkeuring: installeer de techniek en dien vaststellingsverzoek in.',
    evidence_required: 'Facturen, inbedrijfstellingsrapport, emissie-meting na installatie',
    portal: 'https://mijn.rvo.nl',
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
    body: 'Regelingen voor veehouders in het kader van stikstofproblematiek. Stoppersregeling (Lbv/Lbv-plus) voor piekbelasters, Maatregel Gerichte Opkoop (MGO) nabij Natura 2000. Regeling sanering varkenshouderij (Srv) in veedichte gebieden. Vrijwillige uitkoop, productierechten inleveren.',
    grant_type: 'buyout',
  },
  {
    title: 'Duurzame energie in de landbouw',
    body: 'Subsidies voor energietransitie: ISDE voor warmtepompen, zonneboilers en isolatie. SDE++ voor grootschalige energieproductie (zon-PV, wind, mono-mestvergisting, biomassa, geothermie, aquathermie). SVM voor energieadvies MKB. Regeling Groenprojecten voor gunstige financiering.',
    grant_type: 'capital',
  },
  {
    title: 'Innovatie en precisielandbouw',
    body: 'Subsidies voor agrarische innovatie: MIT voor haalbaarheidsstudies en R&D-samenwerking, WBSO voor fiscaal voordeel op R&D. POP3+ voor innovatie, kennis en samenwerking. Demonstratieprojecten precisielandbouw: GPS, drones, variabel doseren, bodemscans, mechanische onkruidbestrijding.',
    grant_type: 'tax_credit',
  },
  {
    title: 'Jonge boeren en bedrijfsovername',
    body: 'JOLA (Subsidie Jonge Landbouwers) voor boeren onder 41 jaar die een bedrijf hebben overgenomen. Borgstellingsfonds voor financiering van bedrijfsovername of uitbreiding. POP3+ Kennis en Advies voor bedrijfsbegeleiding.',
    grant_type: 'capital',
  },
  {
    title: 'Emissiereductie en stallen',
    body: 'Subsidiemodules Brongerichte Verduurzaming Stal (Sbv): emissiearme vloeren, luchtwassers (chemisch, biologisch, gecombineerd), mestscheiding, methaanreductie. Toekomstbestendige Stallen voor integraal duurzame nieuwbouw. Brabantse stal-innovatieregeling. Combineerbaar met ISDE.',
    grant_type: 'capital',
  },
  {
    title: 'Provinciale subsidies landbouw',
    body: 'Provinciale regelingen: Noord-Brabant stal-innovatie, Gelderland stikstofbank, Noord-Holland weidevogelbeheer, Friesland veenweideprogramma, Overijssel natuur-inclusief, Utrecht duurzame energie, Limburg boomgaarden, Zeeland zilte teelt, Drenthe agrarisch erfgoed, Flevoland innovatie, Groningen aardbevingsbestendig, Zuid-Holland Groene Hart.',
    grant_type: 'capital',
  },
  {
    title: 'Plattelandsontwikkeling en LEADER',
    body: 'POP3+ regelingen voor plattelandsontwikkeling: innovatie, kennis, samenwerking. LEADER subsidies via lokale actiegroepen (LAG) voor regionale projecten. Bottom-up benadering, aansluiting bij lokale ontwikkelstrategie.',
    grant_type: 'capital',
  },
  {
    title: 'Kringlooplandbouw en verduurzaming',
    body: 'Subsidies voor circulaire landbouw: EHF/RRF middelen voor klimaatadaptatie, agroforestry pilots, SVM voor MKB-verduurzaming, Regeling Groenprojecten. Provinciale regelingen voor natuur-inclusief boeren, veenweide, zilte teelt.',
    grant_type: 'capital',
  },
  {
    title: 'Zeldzame rassen en genetische bronnen',
    body: 'Regeling Zeldzame Huisdierrassen: vergoeding per dier voor zeldzame Nederlandse landbouwhuisdierrassen. Runderen (Brandrood, Lakenvelder, Fries Hollands), schapen (Schoonebeeker, Veluws Heideschaap). Stamboekregistratie vereist.',
    grant_type: 'capital',
  },
  {
    title: 'Veenweide en bodemdaling',
    body: 'Programmas tegen bodemdaling in veenweidegebieden: Friesland veenweideprogramma, Zuid-Holland Groene Hart transitie. Maatregelen: onderwaterdrainage, waterinfiltratiesystemen, natte teelten (paludicultuur), extensivering.',
    grant_type: 'capital',
  },
  {
    title: 'Bezwaar en beroep subsidies',
    body: 'Procedure bij afwijzing subsidieaanvraag: binnen 6 weken bezwaar maken bij RVO. Bezwaarschrift met motivering en kopie afwijzingsbesluit. Daarna beroep bij rechtbank of College van Beroep voor het bedrijfsleven (CBb). Subsidie-adviseurs en intermediairs kunnen bijstaan.',
    grant_type: 'capital',
  },
  {
    title: 'Subsidie stapelen en cumulatie',
    body: 'Combineren van subsidies: provinciale en rijkssubsidies stapelbaar tot cumulatiemaximum (vaak 60-80% van investering). ISDE + Sbv combineerbaar voor stallenverduurzaming. WBSO + MIT voor innovatie. Stoppersregeling en Srv sluiten andere subsidies uit.',
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

const totalRows = grants.length + grantItems.length + stackingRules.length + applicationSteps.length;
console.log('');
console.log(`Ingestion complete: ${grants.length} grants, ${grantItems.length} items, ${stackingRules.length} stacking rules, ${applicationSteps.length} application steps.`);
console.log(`Total data rows: ${totalRows}`);
console.log(`FTS5 index: ${grants.length + grantItems.length + thematicEntries.length} entries.`);
console.log(`Database written to data/database.db`);
