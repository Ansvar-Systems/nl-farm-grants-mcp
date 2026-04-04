# Tools Reference

## Meta Tools

### `about`

Get server metadata: name, version, coverage, data sources, and links.

**Parameters:** None

**Returns:** Server name, version, jurisdiction list, data source names, tool count, homepage/repository links.

---

### `list_sources`

List all data sources with authority, URL, license, and freshness info.

**Parameters:** None

**Returns:** Array of data sources, each with `name`, `authority`, `official_url`, `retrieval_method`, `update_frequency`, `license`, `coverage`, `last_retrieved`.

---

### `check_data_freshness`

Check when data was last ingested, staleness status, and how to trigger a refresh.

**Parameters:** None

**Returns:** `status` (fresh/stale/unknown), `last_ingest`, `days_since_ingest`, `staleness_threshold_days`, `refresh_command`.

---

## Domain Tools

### `search_grants`

Search Dutch farm grants by keyword. Covers ISDE, SDE++, JOLA, MIT, WBSO, Sbv, Stoppersregeling, Borgstellingsfonds, and more.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Free-text search query (e.g. "warmtepomp", "stikstof", "jonge landbouwer") |
| `grant_type` | string | No | Filter by grant type (e.g. capital, revenue, tax_credit, buyout) |
| `min_value` | number | No | Minimum grant value in EUR |
| `jurisdiction` | string | No | ISO 3166-1 alpha-2 code (default: NL) |
| `limit` | number | No | Max results (default: 20, max: 50) |

**Example:** `{ "query": "warmtepomp subsidie" }`

---

### `get_grant_details`

Get full details for a specific grant scheme: budget, eligibility, deadlines, match funding.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `grant_id` | string | Yes | Grant ID (e.g. isde, sde-plus-plus, jola, stoppersregeling) |
| `jurisdiction` | string | No | ISO 3166-1 alpha-2 code (default: NL) |

**Returns:** Grant name, type, authority, budget, status, dates, description, eligibility, match funding requirement, eligible items count.

**Example:** `{ "grant_id": "isde" }`

---

### `check_deadlines`

List open and upcoming grant deadlines, sorted by urgency. Shows days remaining and closing status.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `grant_type` | string | No | Filter by grant type (e.g. capital, revenue, tax_credit, buyout) |
| `jurisdiction` | string | No | ISO 3166-1 alpha-2 code (default: NL) |

**Returns:** Array of grants with `status`, `open_date`, `close_date`, `days_remaining`, `urgency` (closing soon / approaching / open / rolling).

---

### `get_eligible_items`

List eligible items for a grant with codes, values, and specifications. Filter by category.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `grant_id` | string | Yes | Grant ID (e.g. isde, mit, jola) |
| `category` | string | No | Filter by item category (e.g. warmtepomp, isolatie, zonneboiler, innovatie) |
| `jurisdiction` | string | No | ISO 3166-1 alpha-2 code (default: NL) |

**Returns:** Items grouped by category, each with `item_code`, `name`, `description`, `specification`, `grant_value`, `grant_unit`, `score`.

**Example:** `{ "grant_id": "isde", "category": "warmtepomp" }`

---

### `check_stacking`

Check whether multiple grants can be combined (stacked). Checks all pair combinations and returns compatibility matrix.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `grant_ids` | string[] | Yes | Array of grant IDs to check compatibility (minimum 2) |
| `jurisdiction` | string | No | ISO 3166-1 alpha-2 code (default: NL) |

**Returns:** `all_compatible` flag, array of pair results with `compatible`, `conditions`.

**Example:** `{ "grant_ids": ["isde", "sde-plus-plus", "jola"] }`

---

### `get_application_process`

Get step-by-step application guidance for a grant, including evidence requirements and portal links.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `grant_id` | string | Yes | Grant ID (e.g. isde, jola, stoppersregeling) |
| `jurisdiction` | string | No | ISO 3166-1 alpha-2 code (default: NL) |

**Returns:** Ordered steps with `description`, `evidence_required`, `portal` URL.

**Example:** `{ "grant_id": "isde" }`

---

### `estimate_grant_value`

Calculate total grant value from selected items. Applies grant cap and calculates match-funding requirement.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `grant_id` | string | Yes | Grant ID (e.g. isde, jola, borgstellingsfonds) |
| `items` | string[] | No | Array of item codes to include. If omitted, includes all items |
| `area_ha` | number | No | Area in hectares (for per-hectare payment items) |
| `jurisdiction` | string | No | ISO 3166-1 alpha-2 code (default: NL) |

**Returns:** Item breakdown, subtotal, grant cap, capped value, match-funding percentage and amount, total project cost (EUR).

**Example:** `{ "grant_id": "isde", "items": ["ISDE-WP-LW", "ISDE-ISO-DAK"] }`
