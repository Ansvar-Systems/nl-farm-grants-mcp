import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { handleEstimateGrantValue } from '../../src/tools/estimate-grant-value.js';
import { createSeededDatabase } from '../helpers/seed-db.js';
import type { Database } from '../../src/db.js';
import { existsSync, unlinkSync } from 'fs';

const TEST_DB = 'tests/test-estimate-value.db';

describe('estimate_grant_value tool', () => {
  let db: Database;

  beforeAll(() => {
    db = createSeededDatabase(TEST_DB);
  });

  afterAll(() => {
    db.close();
    if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
  });

  test('calculates total for selected ISDE items', () => {
    const result = handleEstimateGrantValue(db, {
      grant_id: 'isde',
      items: ['ISDE-WP-LW', 'ISDE-WP-LW-PLUS'],
    });
    // 1500 + 3150 = 4650
    expect((result as { grant_value: number }).grant_value).toBe(4650);
    expect((result as { items_selected: number }).items_selected).toBe(2);
    expect((result as { match_funding_required: number }).match_funding_required).toBe(0);
  });

  test('calculates all items when none specified', () => {
    const result = handleEstimateGrantValue(db, {
      grant_id: 'isde',
    });
    // 1500 + 3150 + 4 = 4654 (no cap on ISDE)
    expect((result as { subtotal: number }).subtotal).toBe(4654);
    expect((result as { capped: boolean }).capped).toBe(false);
  });

  test('applies grant cap for JOLA', () => {
    const result = handleEstimateGrantValue(db, {
      grant_id: 'jola',
    });
    // JOLA: 6000 value, cap 6000, match_funding_pct 70
    expect((result as { grant_value: number }).grant_value).toBe(6000);
    expect((result as { match_funding_pct: number }).match_funding_pct).toBe(70);
  });

  test('returns EUR currency', () => {
    const result = handleEstimateGrantValue(db, {
      grant_id: 'isde',
      items: ['ISDE-WP-LW'],
    });
    expect((result as { currency: string }).currency).toBe('EUR');
  });

  test('returns error for unknown grant', () => {
    const result = handleEstimateGrantValue(db, { grant_id: 'nonexistent' });
    expect(result).toHaveProperty('error', 'grant_not_found');
  });

  test('rejects unsupported jurisdiction', () => {
    const result = handleEstimateGrantValue(db, { grant_id: 'isde', jurisdiction: 'GB' });
    expect(result).toHaveProperty('error', 'jurisdiction_not_supported');
  });
});
