export interface Meta {
  disclaimer: string;
  data_age: string;
  source_url: string;
  copyright: string;
  server: string;
  version: string;
}

const DISCLAIMER =
  'This server provides guidance on Dutch farm grants based on published RVO and LNV information. ' +
  'Grant details, deadlines, and payment rates may change. Always verify current terms on rvo.nl ' +
  'before applying. This is not a grant application service.';

export function buildMeta(overrides?: Partial<Meta>): Meta {
  return {
    disclaimer: DISCLAIMER,
    data_age: overrides?.data_age ?? 'unknown',
    source_url: overrides?.source_url ?? 'https://www.rvo.nl/subsidies-financiering',
    copyright: 'Data: Rijksoverheid / RVO (public information). Server: Apache-2.0 Ansvar Systems.',
    server: 'nl-farm-grants-mcp',
    version: '0.1.0',
    ...overrides,
  };
}
