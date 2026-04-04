import { buildMeta } from '../metadata.js';
import { SUPPORTED_JURISDICTIONS } from '../jurisdiction.js';

export function handleAbout() {
  return {
    name: 'Netherlands Farm Grants MCP',
    description:
      'Dutch agricultural grants and subsidies made queryable by AI. Covers ISDE, SDE++, JOLA, ' +
      'MIT, WBSO, Sbv, Stoppersregeling, Borgstellingsfonds, and more. Data sourced from RVO ' +
      '(Rijksdienst voor Ondernemend Nederland) and Ministerie van LNV.',
    version: '0.1.0',
    jurisdiction: [...SUPPORTED_JURISDICTIONS],
    data_sources: [
      'RVO Subsidiewijzer',
      'Ministerie van LNV',
      'Rijksoverheid.nl',
    ],
    tools_count: 10,
    links: {
      homepage: 'https://ansvar.eu/open-agriculture',
      repository: 'https://github.com/Ansvar-Systems/nl-farm-grants-mcp',
      mcp_network: 'https://ansvar.ai/mcp',
    },
    _meta: buildMeta(),
  };
}
