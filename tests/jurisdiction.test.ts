import { describe, test, expect } from 'vitest';
import { validateJurisdiction, SUPPORTED_JURISDICTIONS } from '../src/jurisdiction.js';

describe('jurisdiction validation', () => {
  test('accepts GB', () => {
    const result = validateJurisdiction('NL');
    expect(result).toEqual({ valid: true, jurisdiction: 'NL' });
  });

  test('defaults to GB when undefined', () => {
    const result = validateJurisdiction(undefined);
    expect(result).toEqual({ valid: true, jurisdiction: 'NL' });
  });

  test('rejects unsupported jurisdiction', () => {
    const result = validateJurisdiction('SE');
    expect(result).toEqual({
      valid: false,
      error: {
        error: 'jurisdiction_not_supported',
        supported: ['NL'],
        message: 'This server currently covers Netherlands. More jurisdictions are planned.',
      },
    });
  });

  test('normalises lowercase input', () => {
    const result = validateJurisdiction('nl');
    expect(result).toEqual({ valid: true, jurisdiction: 'NL' });
  });

  test('SUPPORTED_JURISDICTIONS contains GB', () => {
    expect(SUPPORTED_JURISDICTIONS).toContain('NL');
  });
});
