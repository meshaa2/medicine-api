# Medicine Inventory & Expiry Tracking API

## Overview
Medication stockouts, overstocking, and expired medicines are routine operational risks in small to medium healthcare facilities (pharmacies, clinics, and hospitals). These issues can delay care, increase waste, and complicate compliance and audit readiness.  
This project is a conceptual, GET-focused REST API that demonstrates how an inventory service can:

- Centralize medicine and batch records
- Detect expired and soon-to-expire batches using deterministic UTC date handling
- Flag low-stock and out-of-stock items using per-medicine reorder levels
- Provide simple transaction visibility for traceability

The API uses mock JSON data (no database) to keep the implementation lightweight and submission-friendly for ZIP-based coursework.

## Quickstart

### Prerequisites
- Node.js (LTS recommended)
- npm

### Install & run
```bash
npm install
npm run dev
```

### Base URL
- Default: `http://localhost:3000`
- Optional port override:
  - PowerShell: `setx PORT 4000` (new terminal) or `$env:PORT=4000; npm run dev`
  - macOS/Linux: `PORT=4000 npm run dev`

## Key Features
- GET-focused REST endpoints for medicines, batches, and transactions
- Pagination via `limit` and `offset`
- Query filtering for medicines: `q`, `category`, `status`
- Expiry detection via `within_days`
- Deterministic UTC date handling (`YYYY-MM-DD`)
- Validation utilities (integers, enums, date format, date ranges)
- Consistent JSON error responses + global 404
- Clean, modular structure (`routes/`, `utils/`, `data/`)

## Pagination
List endpoints return a consistent wrapper:
```json
{
  "meta": { "limit": 20, "offset": 0, "total": 123 },
  "data": [ /* items */ ]
}
```

- `limit`: items per page (1–100)
- `offset`: number of items to skip (0+)
- `total`: total items available (after filtering)

Example:
```bash
curl "http://localhost:3000/medicines?limit=3&offset=0"
```

## Error Format
Errors are returned as JSON with a stable shape:
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Endpoint not found"
  }
}
```

Common error codes:
- `BAD_REQUEST` (400): validation / query parameter errors
- `NOT_FOUND` (404): unknown endpoint or missing resource
- `INTERNAL_SERVER_ERROR` (500): unexpected server error

## Endpoints

### Health & metadata

#### `GET /health`
Health check endpoint.
```bash
curl "http://localhost:3000/health"
```

#### `GET /`
API overview + available endpoints.
```bash
curl "http://localhost:3000/"
```

### Medicines

#### `GET /medicines`
List medicines with computed stock status and pagination.

Query parameters:
- `q` (string): case-insensitive name search (substring match)
- `category` (string): exact match category filter
- `status` (enum): `available | low_stock | out_of_stock | inactive`
- `limit` (int): 1–100
- `offset` (int): 0+

```bash
curl "http://localhost:3000/medicines?q=para&limit=3&offset=0"
```

#### `GET /medicines/:id`
Fetch a single medicine by `medicine_id` (e.g., `MED-0101`), including computed stock status.
```bash
curl "http://localhost:3000/medicines/MED-0101"
```

#### `GET /medicines/:id/batches`
List batches for a medicine, including expiry classification.

Response adds:
- `days_to_expiry` (int): days until expiry (UTC)
- `expiry_status` (enum): `expired | expiring_soon | valid`

```bash
curl "http://localhost:3000/medicines/MED-0101/batches"
```

#### `GET /medicines/low-stock`
List medicines currently flagged as `low_stock`.

Optional query:
- `threshold` (int): additionally restrict to items where `total_quantity <= threshold`

```bash
curl "http://localhost:3000/medicines/low-stock"
curl "http://localhost:3000/medicines/low-stock?threshold=25"
```

#### `GET /medicines/expiring-soon`
List batches expiring within `within_days` (default 30), using deterministic UTC date comparison.

Query parameters:
- `within_days` (int): 1–365 (default 30)

```bash
curl "http://localhost:3000/medicines/expiring-soon?within_days=30"
```

#### `GET /medicines/expiry-summary`
High-level overview for quick reporting:
- low stock count
- out of stock count
- batches expiring within 30 days
- expired batches

```bash
curl "http://localhost:3000/medicines/expiry-summary"
```

### Transactions

#### `GET /transactions`
List inventory transactions with pagination and filtering.

Query parameters:
- `medicine_id` (string): filter by medicine
- `type` (enum): `restock | dispense | adjust`
- `from` (date): `YYYY-MM-DD` (inclusive)
- `to` (date): `YYYY-MM-DD` (inclusive)
- `limit` (int): 1–100
- `offset` (int): 0+

```bash
curl "http://localhost:3000/transactions?medicine_id=MED-0101&type=dispense"
curl "http://localhost:3000/transactions?from=2025-11-01&to=2026-02-28"
```

#### `GET /transactions/:id`
Fetch a single transaction by `transaction_id` (e.g., `TRX-70003`).
```bash
curl "http://localhost:3000/transactions/TRX-70003"
```

## Demo Flow (2–3 minutes)
Use this as a short presentation script:

1. **Prove the API is running**: `GET /health`
2. **Show browse + pagination**: `GET /medicines?limit=3&offset=0`
3. **Show search/filtering**: `GET /medicines?q=para`
4. **Show a detail view**: `GET /medicines/MED-0101`
5. **Explain batch-level expiry monitoring**: `GET /medicines/MED-0101/batches`
6. **Show expiry risk list**: `GET /medicines/expiring-soon?within_days=30`
7. **Show managerial summary**: `GET /medicines/expiry-summary`
8. **Show traceability via transactions**: `GET /transactions?medicine_id=MED-0101&type=dispense`

## Project Structure
```
src/
  server.js
  routes/
    index.js
    medicines.routes.js
    transactions.routes.js
  utils/
    dataStore.js
    date.js
    pagination.js
    response.js
    validate.js
  data/
    medicines.json
    batches.json
    transactions.json
```

## Notes (ZIP Submission)
- Include: `src/`, `package.json`, and (recommended) `package-lock.json`
- Exclude: `node_modules/`

To run on another machine:
```bash
npm install
npm run dev
```

