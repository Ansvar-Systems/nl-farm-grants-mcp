import { buildMeta } from '../metadata.js';
import type { Database } from '../db.js';

interface Source {
  name: string;
  authority: string;
  official_url: string;
  retrieval_method: string;
  update_frequency: string;
  license: string;
  coverage: string;
  last_retrieved?: string;
}

export function handleListSources(db: Database): { sources: Source[]; _meta: ReturnType<typeof buildMeta> } {
  const lastIngest = db.get<{ value: string }>('SELECT value FROM db_metadata WHERE key = ?', ['last_ingest']);

  const sources: Source[] = [
    {
      name: 'RVO Subsidiewijzer',
      authority: 'Rijksdienst voor Ondernemend Nederland (RVO)',
      official_url: 'https://www.rvo.nl/subsidies-financiering',
      retrieval_method: 'MANUAL_EXTRACTION',
      update_frequency: 'per subsidieronde',
      license: 'Rijksoverheid - publieke informatie',
      coverage: 'Subsidies, regelingen, voorwaarden, bedragen, deadlines',
      last_retrieved: lastIngest?.value,
    },
    {
      name: 'Ministerie van LNV',
      authority: 'Ministerie van Landbouw, Natuur en Voedselkwaliteit',
      official_url: 'https://www.rijksoverheid.nl/ministeries/ministerie-van-lnv',
      retrieval_method: 'MANUAL_EXTRACTION',
      update_frequency: 'bij beleidswijzigingen',
      license: 'Rijksoverheid - publieke informatie',
      coverage: 'Landbouwbeleid, stikstofmaatregelen, transitiefonds',
      last_retrieved: lastIngest?.value,
    },
    {
      name: 'Rijksoverheid.nl',
      authority: 'Rijksoverheid',
      official_url: 'https://www.rijksoverheid.nl/onderwerpen/landbouw-en-tuinbouw',
      retrieval_method: 'MANUAL_EXTRACTION',
      update_frequency: 'doorlopend',
      license: 'Rijksoverheid - publieke informatie',
      coverage: 'Overkoepelend beleid, stikstofaanpak, duurzame landbouw',
      last_retrieved: lastIngest?.value,
    },
  ];

  return {
    sources,
    _meta: buildMeta({ source_url: 'https://www.rvo.nl/subsidies-financiering' }),
  };
}
