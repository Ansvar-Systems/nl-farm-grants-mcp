import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { handleCheckStacking } from '../../src/tools/check-stacking.js';
import { createSeededDatabase } from '../helpers/seed-db.js';
import type { Database } from '../../src/db.js';
import { existsSync, unlinkSync } from 'fs';

const TEST_DB = 'tests/test-check-stacking.db';

describe('check_stacking tool', () => {
  let db: Database;

  beforeAll(() => {
    db = createSeededDatabase(TEST_DB);
  });

  afterAll(() => {
    db.close();
    if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
  });

  test('detects incompatible grants', () => {
    const result = handleCheckStacking(db, { grant_ids: ['isde', 'sde-plus-plus'] });
    expect(result).toHaveProperty('all_compatible', false);
    const results = (result as { results: { compatible: boolean }[] }).results;
    expect(results[0].compatible).toBe(false);
  });

  test('detects compatible grants', () => {
    const result = handleCheckStacking(db, { grant_ids: ['jola', 'isde'] });
    expect(result).toHaveProperty('all_compatible', true);
    const results = (result as { results: { compatible: boolean }[] }).results;
    expect(results[0].compatible).toBe(true);
  });

  test('checks all pairs in a 3-grant combination', () => {
    const result = handleCheckStacking(db, { grant_ids: ['isde', 'sde-plus-plus', 'jola'] });
    // 3 grants = 3 pairs
    expect((result as { pairs_checked: number }).pairs_checked).toBe(3);
    // Should not be all compatible because ISDE + SDE++ is incompatible
    expect(result).toHaveProperty('all_compatible', false);
  });

  test('returns error for single grant', () => {
    const result = handleCheckStacking(db, { grant_ids: ['isde'] });
    expect(result).toHaveProperty('error', 'insufficient_grants');
  });

  test('returns error for unknown grant ID', () => {
    const result = handleCheckStacking(db, { grant_ids: ['isde', 'nonexistent'] });
    expect(result).toHaveProperty('error', 'grants_not_found');
  });

  test('rejects unsupported jurisdiction', () => {
    const result = handleCheckStacking(db, { grant_ids: ['isde', 'jola'], jurisdiction: 'US' });
    expect(result).toHaveProperty('error', 'jurisdiction_not_supported');
  });
});
