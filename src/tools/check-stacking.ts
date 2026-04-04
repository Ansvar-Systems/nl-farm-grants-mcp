import { buildMeta } from '../metadata.js';
import { validateJurisdiction } from '../jurisdiction.js';
import type { Database } from '../db.js';

interface StackingArgs {
  grant_ids: string[];
  jurisdiction?: string;
}

interface PairResult {
  grant_a: string;
  grant_b: string;
  compatible: boolean;
  conditions: string | null;
}

export function handleCheckStacking(db: Database, args: StackingArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  if (!args.grant_ids || args.grant_ids.length < 2) {
    return {
      error: 'insufficient_grants',
      message: 'Provide at least 2 grant IDs to check stacking compatibility.',
    };
  }

  // Verify all grant IDs exist
  const validGrants: string[] = [];
  const invalidGrants: string[] = [];
  for (const gid of args.grant_ids) {
    const exists = db.get<{ id: string }>(
      `SELECT id FROM grants WHERE id = ? AND jurisdiction = ?`,
      [gid, jv.jurisdiction]
    );
    if (exists) {
      validGrants.push(gid);
    } else {
      invalidGrants.push(gid);
    }
  }

  if (invalidGrants.length > 0) {
    return {
      error: 'grants_not_found',
      message: `Grant IDs not found: ${invalidGrants.join(', ')}`,
      valid_grants: validGrants,
    };
  }

  // Check all pairs
  const pairs: PairResult[] = [];
  let allCompatible = true;

  for (let i = 0; i < validGrants.length; i++) {
    for (let j = i + 1; j < validGrants.length; j++) {
      const a = validGrants[i];
      const b = validGrants[j];

      const rule = db.get<{ compatible: number; conditions: string | null }>(
        `SELECT compatible, conditions FROM stacking_rules
         WHERE ((grant_a = ? AND grant_b = ?) OR (grant_a = ? AND grant_b = ?))
         AND jurisdiction = ?`,
        [a, b, b, a, jv.jurisdiction]
      );

      if (rule) {
        const isCompatible = rule.compatible === 1;
        if (!isCompatible) allCompatible = false;
        pairs.push({
          grant_a: a,
          grant_b: b,
          compatible: isCompatible,
          conditions: rule.conditions,
        });
      } else {
        // No rule found -- treat as unknown
        pairs.push({
          grant_a: a,
          grant_b: b,
          compatible: true,
          conditions: 'Geen specifieke stapelingsregel gevonden voor deze combinatie. Controleer rvo.nl voor actuele voorwaarden.',
        });
      }
    }
  }

  return {
    jurisdiction: jv.jurisdiction,
    grants_checked: validGrants,
    pairs_checked: pairs.length,
    all_compatible: allCompatible,
    results: pairs,
    note: 'Stapelingsregels zijn gebaseerd op gepubliceerde RVO-richtlijnen en kunnen wijzigen per subsidieronde. Controleer bij RVO voor actuele voorwaarden.',
    _meta: buildMeta(),
  };
}
