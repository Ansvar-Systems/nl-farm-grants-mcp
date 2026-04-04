import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { handleGetEligibleItems } from '../../src/tools/get-eligible-items.js';
import { createSeededDatabase } from '../helpers/seed-db.js';
import type { Database } from '../../src/db.js';
import { existsSync, unlinkSync } from 'fs';

const TEST_DB = 'tests/test-eligible-items.db';

describe('get_eligible_items tool', () => {
  let db: Database;

  beforeAll(() => {
    db = createSeededDatabase(TEST_DB);
  });

  afterAll(() => {
    db.close();
    if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
  });

  test('returns items for ISDE', () => {
    const result = handleGetEligibleItems(db, { grant_id: 'isde' });
    expect(result).toHaveProperty('total_items');
    expect((result as { total_items: number }).total_items).toBe(3);
  });

  test('filters by category', () => {
    const result = handleGetEligibleItems(db, { grant_id: 'isde', category: 'warmtepomp' });
    expect((result as { total_items: number }).total_items).toBe(2);
  });

  test('returns error for unknown grant', () => {
    const result = handleGetEligibleItems(db, { grant_id: 'nonexistent-grant' });
    expect(result).toHaveProperty('error', 'grant_not_found');
  });

  test('returns null max_grant_value for uncapped grants', () => {
    const result = handleGetEligibleItems(db, { grant_id: 'isde' });
    expect((result as { max_grant_value: number | null }).max_grant_value).toBeNull();
  });

  test('rejects unsupported jurisdiction', () => {
    const result = handleGetEligibleItems(db, { grant_id: 'isde', jurisdiction: 'SE' });
    expect(result).toHaveProperty('error', 'jurisdiction_not_supported');
  });
});
