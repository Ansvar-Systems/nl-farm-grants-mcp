# Netherlands Farm Grants MCP

[![CI](https://github.com/Ansvar-Systems/nl-farm-grants-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/Ansvar-Systems/nl-farm-grants-mcp/actions/workflows/ci.yml)
[![GHCR](https://github.com/Ansvar-Systems/nl-farm-grants-mcp/actions/workflows/ghcr-build.yml/badge.svg)](https://github.com/Ansvar-Systems/nl-farm-grants-mcp/actions/workflows/ghcr-build.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Dutch agricultural grants and subsidies via the [Model Context Protocol](https://modelcontextprotocol.io). Query ISDE, SDE++, JOLA, MIT, WBSO, Stoppersregeling, Borgstellingsfonds -- deadlines, eligible items, stacking rules, and application guidance -- all from your AI assistant.

Part of [Ansvar Open Agriculture](https://ansvar.eu/open-agriculture).

## Why This Exists

Dutch farmers and agricultural businesses miss available funding because subsidy information is spread across RVO.nl, Rijksoverheid.nl, provincial portals, and PDF publications. This MCP server puts it all in one place, queryable by AI. Ask about deadlines, check which equipment qualifies for ISDE, find out which grants can be combined, and estimate your funding before you apply.

## Quick Start

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "nl-farm-grants": {
      "command": "npx",
      "args": ["-y", "@ansvar/nl-farm-grants-mcp"]
    }
  }
}
```

### Claude Code

```bash
claude mcp add nl-farm-grants npx @ansvar/nl-farm-grants-mcp
```

### Streamable HTTP (remote)

```
https://mcp.ansvar.eu/nl-farm-grants/mcp
```

### Docker (self-hosted)

```bash
docker run -p 3000:3000 ghcr.io/ansvar-systems/nl-farm-grants-mcp:latest
```

### npm (stdio)

```bash
npx @ansvar/nl-farm-grants-mcp
```

## Example Queries

Ask your AI assistant:

- "Welke subsidies zijn er voor warmtepompen?"
- "Kan ik ISDE combineren met SDE++?"
- "Wat zijn de voorwaarden voor de Subsidie Jonge Landbouwers?"
- "Hoe vraag ik ISDE aan?"
- "Welke stoppersregelingen zijn er voor veehouderijen nabij Natura 2000?"
- "Wat is het maximale borgstellingsbedrag voor agrarische leningen?"
- "Welke innovatiesubsidies zijn er voor precisielandbouw?"

## Stats

| Metric | Value |
|--------|-------|
| Tools | 10 (3 meta + 7 domain) |
| Jurisdiction | NL |
| Grants covered | ISDE, SDE++, JOLA, MIT, WBSO, Regeling Groenprojecten, Stoppersregeling, MGO, Sbv, Borgstellingsfonds |
| Grant items | 13 eligible items (ISDE warmtepompen, zonneboilers, isolatie; MIT; JOLA; Borgstellingsfonds) |
| Stacking rules | 10 combination rules |
| Data sources | RVO, Ministerie van LNV, Rijksoverheid.nl |
| License (data) | Rijksoverheid - publieke informatie |
| License (code) | Apache-2.0 |
| Transport | stdio + Streamable HTTP |

## Tools

| Tool | Description |
|------|-------------|
| `about` | Server metadata and links |
| `list_sources` | Data sources with freshness info |
| `check_data_freshness` | Staleness status and refresh command |
| `search_grants` | FTS5 search across grants and eligible items |
| `get_grant_details` | Full grant scheme details with eligibility |
| `check_deadlines` | Open and upcoming deadlines with urgency |
| `get_eligible_items` | Eligible items with codes, values, specs |
| `check_stacking` | Grant combination compatibility matrix |
| `get_application_process` | Step-by-step application guidance |
| `estimate_grant_value` | Total grant estimate with match-funding |

See [TOOLS.md](TOOLS.md) for full parameter documentation.

## Security Scanning

This repository runs security checks on every push:

- **CodeQL** -- static analysis for JavaScript/TypeScript
- **Gitleaks** -- secret detection across full history
- **Dependency review** -- via Dependabot
- **Container scanning** -- via GHCR build pipeline

See [SECURITY.md](SECURITY.md) for reporting policy.

## Disclaimer

This tool provides reference data for informational purposes only. It is not professional financial or agricultural advice. Grant details change -- always verify on rvo.nl before applying. See [DISCLAIMER.md](DISCLAIMER.md).

## Contributing

Issues and pull requests welcome. For security vulnerabilities, email security@ansvar.eu (do not open a public issue).

## License

Apache-2.0. Data sourced from Rijksoverheid (public information).
