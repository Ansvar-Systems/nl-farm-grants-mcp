import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { handleSearchGrants } from '../../src/tools/search-grants.js';
import { createSeededDatabase } from '../helpers/seed-db.js';
import type { Database } from '../../src/db.js';
import { existsSync, unlinkSync } from 'fs';

const TEST_DB = 'tests/test-search-grants.db';

describe('search_grants tool', () => {
  let db: Database;

  beforeAll(() => {
    db = createSeededDatabase(TEST_DB);
  });

  afterAll(() => {
    db.close();
    if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
  });

  test('returns results for warmtepomp query', () => {
    const result = handleSearchGrants(db, { query: 'warmtepomp' });
    expect(result).toHaveProperty('results_count');
    expect((result as { results_count: number }).results_count).toBeGreaterThan(0);
  });

  test('returns results for isolatie query', () => {
    const result = handleSearchGrants(db, { query: 'isolatie' });
    expect(result).toHaveProperty('results_count');
    expect((result as { results_count: number }).results_count).toBeGreaterThan(0);
  });

  test('respects grant_type filter', () => {
    const result = handleSearchGrants(db, { query: 'subsidie energie warmtepomp', grant_type: 'capital' });
    if ('results' in result) {
      for (const r of (result as { results: { grant_type: string }[] }).results) {
        expect(r.grant_type).toBe('capital');
      }
    }
  });

  test('rejects unsupported jurisdiction', () => {
    const result = handleSearchGrants(db, { query: 'warmtepomp', jurisdiction: 'FR' });
    expect(result).toHaveProperty('error', 'jurisdiction_not_supported');
  });
});
