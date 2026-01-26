# XLSX Test Data Schema

## Source File

`test-knowledge-base.xlsx` in the project root contains real test data from a shopping mall.

## Sheet Structure

| Sheet Name | Rows | Content |
|------------|------|---------|
| Base de Conocimiento - Locatari | ~950 | Tenants/Stores |
| Descuentos y Promociones | ~2331 | Promotions |
| Eventos (Mkt) | ~904 | Marketing events |
| Extras | ~996 | Extra mall info |

## Tenant Mapping (Locatarios → App Tenant)

| XLSX Column | App Field | Transform |
|-------------|-----------|-----------|
| `name` | `name` | Direct |
| `name` | `id` | `slugify(name)` |
| `description` | `description` | Direct |
| `horario` | `schedule` | Direct |
| `position` | `location` | Direct |
| `ZONA` + `NIVEL` | `location` (alt) | Concatenate |
| `CATEGORIA + SUBCATEGORIA 2.0` | `category` | Direct |
| `multi_brand` | `isMultibrand` | `== 1` |
| `image_url_1_final` | `facadeImages[0]` | Download → Re-upload |
| `image_url_2_final` | `facadeImages[1]` | Download → Re-upload |
| `fan_page_facebook` | `urls[]` | Filter empty |
| `fan_page_instagram` | `urls[]` | Filter empty |
| `carta` | `urls[]` | Filter empty |
| `Estado` | (filter) | Only `"operando"` |

## Promotion Mapping (Descuentos → App Promotion)

| XLSX Column | App Field | Transform |
|-------------|-----------|-----------|
| `MARCA` | (link to tenant) | Match by name |
| `TÍTULO DE DESCUENTO` | `title` | Direct |
| `DETALLE DE DESCUENTO` | `description` | Direct |
| `MARCA TEMPORAL` | `validFrom/validTo` | Month → date range |

## Extraction Script

Located at `e2e/seed/extract-xlsx.ts`:

```typescript
import XLSX from "xlsx";

// Slugify helper
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 64);
}

// Month to date range
function monthToDateRange(month: string) {
  const months: Record<string, number> = {
    ENERO: 0, FEBRERO: 1, MARZO: 2, ABRIL: 3,
    MAYO: 4, JUNIO: 5, JULIO: 6, AGOSTO: 7,
    SEPTIEMBRE: 8, OCTUBRE: 9, NOVIEMBRE: 10, DICIEMBRE: 11
  };
  const m = months[month?.toUpperCase()];
  if (m === undefined) return {};
  const year = new Date().getFullYear();
  return {
    validFrom: new Date(year, m, 1).toISOString().split("T")[0],
    validTo: new Date(year, m + 1, 0).toISOString().split("T")[0]
  };
}
```

## Running Extraction

```bash
cd aifindr-knowledge-base
npx tsx e2e/seed/extract-xlsx.ts
```

Output: `e2e/seed/seed-data.json`

```json
{
  "tenants": [
    {
      "id": "cafe-central",
      "name": "Café Central",
      "description": "Cafetería gourmet...",
      "location": "Nivel 1, Local A-001",
      "category": "Restaurantes > Cafeterías",
      "schedule": "10:00 - 22:00",
      "urls": ["https://facebook.com/...", "https://instagram.com/..."],
      "originalImageUrls": ["https://..."],
      "facadeImages": [],
      "promotions": [
        {
          "id": "cafe-central-2x1-cafes",
          "title": "2x1 en Cafés",
          "description": "Aplica de lunes a viernes...",
          "validFrom": "2024-01-01",
          "validTo": "2024-01-31"
        }
      ]
    }
  ],
  "documents": []
}
```

## Using Extracted Data for Testing

1. **Read seed-data.json** to get test values:
   ```bash
   cat e2e/seed/seed-data.json | python3 -m json.tool | head -50
   ```

2. **Get a sample tenant for testing:**
   ```bash
   TENANT_NAME=$(cat e2e/seed/seed-data.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['tenants'][0]['name'])")
   TENANT_LOC=$(cat e2e/seed/seed-data.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['tenants'][0]['location'])")
   TENANT_DESC=$(cat e2e/seed/seed-data.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['tenants'][0]['description'])")
   ```

3. **Use values in agent-browser:**
   ```bash
   npx agent-browser fill "@e4" "$TENANT_NAME" --session $SESSION
   npx agent-browser fill "@e5" "$TENANT_LOC" --session $SESSION
   npx agent-browser fill "@e6" "$TENANT_DESC" --session $SESSION
   ```

4. **Verify in Weaviate:**
   ```bash
   # After publish, search for the tenant name
   curl -s http://localhost:9000/v1/graphql \
     -H "Content-Type: application/json" \
     -d "{\"query\": \"{ Get { Knowledge(tenant: \\\"$LATEST_TENANT\\\", limit: 5, where: {path: [\\\"text\\\"], operator: Like, valueText: \\\"*$TENANT_NAME*\\\"}) { title text source } } }\"}"
   ```

## Seed Data Limits

The extractor limits to 50 tenants by default for testing:
```typescript
const tenants = locatarios
  .filter(row => row.name && row.Estado === "operando")
  .slice(0, 50)  // Limit for testing
```

Modify `TENANT_LIMIT` env var or edit script for more/fewer.
