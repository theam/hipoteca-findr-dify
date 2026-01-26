---
name: e2e-testing-knowledge-base
description: Execute comprehensive E2E tests for aifindr-knowledge-base application using agent-browser. Use this skill when asked to test the knowledge base app, verify UI functionality, test CRUD operations (tenants, promotions, documents, web URLs), test the publish workflow, or verify data ingestion in Weaviate. Creates a new project for test isolation, uses XLSX test data with images, verifies image uploads display correctly, and tests cascade delete of promotions when tenant is deleted.
---

# E2E Testing for aifindr-knowledge-base

## Overview

Test aifindr-knowledge-base using `agent-browser` CLI with **real data from XLSX including images**. Each test run creates a **new project** for isolation. Tests verify image uploads display correctly, cascade deletes work, and Web URL management functions properly.

## Execution Flow

```
1. Prerequisites       → Verify services running
2. Load XLSX Data      → Extract tenants, promotions, images
3. Authentication      → Manual login + start trace
4. Create Test Project → New project for test isolation
5. Navigation          → Verify all pages load
6. Web URL CRUD        → Test URL management (add, verify, delete)
7. Create Tenant A     → Full data + images + VERIFY images display
8. Create Tenant B     → For delete test
9. Create Promotions   → Multiple promotions for Tenant A (for cascade test)
10. Create Document    → Text document
11. Pre-publish Delete → Delete Tenant B, verify UI removal
12. First Publication  → Publish and wait for completion
13. Weaviate Check #1  → Verify created data indexed, deleted absent
14. Cascade Delete Test→ Delete Tenant A, verify promotions also deleted from UI
15. Second Publication → Publish deletion
16. Weaviate Check #2  → Verify tenant AND promotions removed from Weaviate
17. Cleanup + Report   → Stop trace, generate report
```

## Phase 1: Prerequisites

```bash
curl -s http://localhost:3010 | head -1          # Knowledge-base
curl -s http://localhost:9000/v1/schema | head -1 # Weaviate
npx agent-browser --version                       # agent-browser
```

## Phase 2: Load XLSX Test Data (MANDATORY)

```bash
cd aifindr-knowledge-base
npx tsx e2e/seed/extract-xlsx.ts
```

**Select from seed-data.json:**
1. **Tenant A** - one with images and promotions (e.g., AMPHORA)
2. **Tenant B** - for pre-publish delete (e.g., 4D)
3. **2+ Promotions** - to test cascade delete
4. **Document** - text content
5. **Web URL** - for Web CRUD test

## Phase 3: Authentication + Recording

```bash
mkdir -p e2e/reports
npx agent-browser open http://localhost:3010 --headed --session e2e

# LOGIN MANUALLY in the browser

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
echo $TIMESTAMP > /tmp/e2e-timestamp.txt
npx agent-browser trace start ./e2e/reports/e2e-trace-$TIMESTAMP.zip --session e2e
```

## Phase 4: Create Test Project (NEW - For Isolation)

Each E2E run should create a new project to ensure test isolation:

```bash
# Click project selector
npx agent-browser snapshot -i --session e2e
npx agent-browser click "@eX" --session e2e  # Project selector button

# Look for "New project" or "Create project" option
npx agent-browser snapshot -i --session e2e
npx agent-browser click "text=New project" --session e2e

# Fill project name with unique identifier
npx agent-browser fill "@eX" "E2E Test $(date +%Y%m%d-%H%M%S)" --session e2e
npx agent-browser click "text=Create" --session e2e
sleep 2

# Verify new project is selected
npx agent-browser snapshot --session e2e | grep "E2E Test"
```

**If project creation is not available**, use an existing test project but document this limitation.

## Phase 5: Navigation Tests

Test all 5 main pages load:

```bash
npx agent-browser goto "http://localhost:3010/tenants" --session e2e
npx agent-browser snapshot --session e2e | grep -i "Tenants"

npx agent-browser goto "http://localhost:3010/promotions" --session e2e
npx agent-browser snapshot --session e2e | grep -i "Promotions"

npx agent-browser goto "http://localhost:3010/documents" --session e2e
npx agent-browser snapshot --session e2e | grep -i "Documents"

npx agent-browser goto "http://localhost:3010/publications" --session e2e
npx agent-browser snapshot --session e2e | grep -i "Publications"

npx agent-browser goto "http://localhost:3010/web" --session e2e
npx agent-browser snapshot --session e2e | grep -i "Web"
```

## Phase 6: Web URL CRUD Tests (NEW)

Test the Web page URL management:

### 6.1 Add URL

```bash
npx agent-browser goto "http://localhost:3010/web" --session e2e
npx agent-browser snapshot -i --session e2e
npx agent-browser click "@eX" --session e2e  # "Add URL" button

# Fill URL form
npx agent-browser snapshot -i --session e2e
npx agent-browser fill "@eX" "https://example-e2e-test.com" --session e2e
npx agent-browser click "text=Save" --session e2e
sleep 2

# Verify URL appears in list
npx agent-browser snapshot --session e2e | grep "example-e2e-test.com"
```

### 6.2 Verify URL in List

```bash
# Check URL displays with expected elements (edit/delete buttons)
npx agent-browser snapshot -i --session e2e | grep -A2 "example-e2e-test"
```

### 6.3 Delete URL

```bash
# Find delete button for the test URL
npx agent-browser snapshot -i --session e2e
npx agent-browser click "@eX" --session e2e  # Delete button for test URL
sleep 1

# Verify URL removed
npx agent-browser snapshot --session e2e | grep "example-e2e-test" || echo "✅ URL deleted"
```

## Phase 7: Create Tenant A (Full Data + Images + VERIFICATION)

### 7.1 Fill Form and Upload Images

```bash
npx agent-browser goto "http://localhost:3010/tenants" --session e2e
npx agent-browser click "@eX" --session e2e  # New tenant button
sleep 1

# Fill basic fields
npx agent-browser fill "@eX" "AMPHORA" --session e2e          # Name
npx agent-browser fill "@eX" "Nave Central, Nivel 1" --session e2e  # Location
npx agent-browser fill "@eX" "Venta de accesorios..." --session e2e  # Description
npx agent-browser fill "@eX" "11:00 - 22:00" --session e2e    # Schedule

# Download and upload images
curl -o /tmp/facade1.jpg "https://jpform.datalabs.pe/storage/images/..."
npx agent-browser upload "input[type='file']" /tmp/facade1.jpg --session e2e
sleep 2

# Add extra information (Facebook, Instagram, Category)
npx agent-browser click "text=Add Information" --session e2e
# ... fill extra info fields

npx agent-browser click "text=Create tenant" --session e2e
sleep 2
```

### 7.2 VERIFY Image Upload (CRITICAL)

**After creating tenant, verify images display correctly:**

```bash
# Take snapshot and check for image elements
npx agent-browser snapshot -i --session e2e

# Look for img elements with actual src (not broken)
# Expected: img "AMPHORA facade" with valid src attribute
# If broken: img will have no src or error indicator

# Click on tenant to open details
npx agent-browser click "text=AMPHORA" --session e2e
sleep 1
npx agent-browser snapshot -i --session e2e

# Verify image is visible in detail view
# Look for: img [ref=eX] with description containing "facade" or tenant name
# Take screenshot for visual verification
npx agent-browser screenshot ./e2e/reports/tenant-images-$TIMESTAMP.png --session e2e
```

**Image verification checklist:**
- [ ] Tenant card shows image thumbnail (not "No facade" placeholder)
- [ ] Detail dialog shows full image
- [ ] Image src is a valid URL (not blob: or empty)

**If images are broken:**
1. Check upload command succeeded (no error output)
2. Verify file exists at path before upload
3. Check browser console for upload errors
4. Document as issue in report

## Phase 8: Create Tenant B (For Delete Test)

```bash
# Same process, simpler data
npx agent-browser click "@eX" --session e2e  # New tenant
npx agent-browser fill "@eX" "E2E Delete Test" --session e2e
npx agent-browser fill "@eX" "Test Location" --session e2e
npx agent-browser click "text=Create tenant" --session e2e
```

## Phase 9: Create Multiple Promotions (For Cascade Delete Test)

Create 2+ promotions for Tenant A to verify cascade delete:

### 9.1 Promotion 1

```bash
npx agent-browser goto "http://localhost:3010/promotions" --session e2e
npx agent-browser click "@eX" --session e2e  # New promotion

# Select Tenant A
npx agent-browser click "@eX" --session e2e  # Tenant combobox
npx agent-browser click "text=AMPHORA" --session e2e

npx agent-browser fill "@eX" "Promo 1 - 50% OFF" --session e2e
npx agent-browser fill "@eX" "First promotion for cascade test" --session e2e
npx agent-browser click "text=Save" --session e2e
```

### 9.2 Promotion 2

```bash
npx agent-browser click "@eX" --session e2e  # New promotion
npx agent-browser click "@eX" --session e2e  # Tenant combobox
npx agent-browser click "text=AMPHORA" --session e2e

npx agent-browser fill "@eX" "Promo 2 - 30% OFF" --session e2e
npx agent-browser fill "@eX" "Second promotion for cascade test" --session e2e
npx agent-browser click "text=Save" --session e2e
```

### 9.3 Verify Promotions Created

```bash
npx agent-browser snapshot --session e2e | grep -E "Promo 1|Promo 2|AMPHORA"
# Should show both promotions linked to AMPHORA
```

## Phase 10: Create Document

```bash
npx agent-browser goto "http://localhost:3010/documents" --session e2e
npx agent-browser click "@eX" --session e2e  # New document

# Select Text content type
npx agent-browser click "@eX" --session e2e  # Type combobox
npx agent-browser click "text=Text content" --session e2e

npx agent-browser fill "@eX" "E2E Test Document" --session e2e
npx agent-browser fill "@eX" "Test content for E2E verification" --session e2e
npx agent-browser click "text=Save" --session e2e
```

## Phase 11: Pre-Publication Delete Test

Delete Tenant B before publishing:

```bash
npx agent-browser goto "http://localhost:3010/tenants" --session e2e
# Find and click delete for "E2E Delete Test"
npx agent-browser snapshot -i --session e2e
npx agent-browser click "@eX" --session e2e  # Delete button

# Verify removed
npx agent-browser snapshot --session e2e | grep "E2E Delete Test" || echo "✅ Tenant B deleted"
```

## Phase 12: First Publication

```bash
npx agent-browser click "text=Publish" --session e2e
sleep 1
npx agent-browser click "@eX" --session e2e  # Confirm button

npx agent-browser goto "http://localhost:3010/publications" --session e2e

# Poll for completion
for i in {1..30}; do
  content=$(npx agent-browser snapshot --session e2e 2>/dev/null)
  if echo "$content" | grep -q "In Progress"; then
    sleep 3
  else
    echo "Publication completed!"
    break
  fi
done
```

## Phase 13: Weaviate Verification #1

```bash
# Find correct tenant namespace
TENANT=$(curl -s http://localhost:9000/v1/schema/Knowledge/tenants | \
  python3 -c "import json,sys; d=json.load(sys.stdin); print(sorted([t['name'] for t in d], reverse=True)[0])")

# List all content
curl -s http://localhost:9000/v1/graphql -H "Content-Type: application/json" \
  -d "{\"query\": \"{ Get { Knowledge(tenant: \\\"$TENANT\\\", limit: 50) { source } } }\"}"
```

**Verify:**
- ✅ AMPHORA tenant indexed
- ✅ Promo 1 and Promo 2 indexed
- ✅ Document indexed
- ✅ Tenant B NOT present (deleted before publish)

## Phase 14: Cascade Delete Test (CRITICAL)

### 14.1 Count Promotions Before Delete

```bash
npx agent-browser goto "http://localhost:3010/promotions" --session e2e
npx agent-browser snapshot --session e2e > /tmp/promos-before.txt
grep -c "AMPHORA" /tmp/promos-before.txt  # Should be 2
```

### 14.2 Delete Tenant A

```bash
npx agent-browser goto "http://localhost:3010/tenants" --session e2e
npx agent-browser snapshot -i --session e2e
# Find AMPHORA delete button
npx agent-browser click "@eX" --session e2e  # Delete button for AMPHORA
sleep 2
```

### 14.3 Verify Promotions Also Deleted from UI

```bash
npx agent-browser goto "http://localhost:3010/promotions" --session e2e
npx agent-browser snapshot --session e2e > /tmp/promos-after.txt

# Check AMPHORA promotions are gone
if grep -q "AMPHORA" /tmp/promos-after.txt; then
  echo "❌ FAIL: Promotions still exist after tenant delete"
else
  echo "✅ PASS: Promotions cascade deleted with tenant"
fi
```

## Phase 15: Second Publication

```bash
npx agent-browser click "text=Publish" --session e2e
sleep 1
npx agent-browser click "@eX" --session e2e  # Confirm

# Wait for completion
# ... same polling as Phase 12
```

## Phase 16: Weaviate Verification #2

Verify tenant AND all its promotions are removed:

```bash
# Get new tenant namespace
TENANT=$(curl -s http://localhost:9000/v1/schema/Knowledge/tenants | \
  python3 -c "import json,sys; d=json.load(sys.stdin); print(sorted([t['name'] for t in d], reverse=True)[0])")

# Search for AMPHORA - should NOT be found
curl -s http://localhost:9000/v1/graphql -H "Content-Type: application/json" \
  -d "{\"query\": \"{ Get { Knowledge(tenant: \\\"$TENANT\\\", limit: 50) { source } } }\"}" | \
  python3 -c "
import json,sys
d=json.load(sys.stdin)
for obj in d['data']['Get']['Knowledge']:
    if 'amphora' in obj['source'].lower() or 'promo' in obj['source'].lower():
        print('❌ FAIL: Found deleted content:', obj['source'])
        sys.exit(1)
print('✅ PASS: Tenant and promotions removed from Weaviate')
"
```

## Phase 17: Cleanup + Report

```bash
TIMESTAMP=$(cat /tmp/e2e-timestamp.txt)
npx agent-browser trace stop ./e2e/reports/e2e-trace-$TIMESTAMP.zip --session e2e
npx agent-browser close --session e2e
```

Generate report at `e2e/reports/e2e-report-$TIMESTAMP.md` with:

```markdown
# E2E Test Report

## Test Summary
| Test | Status | Notes |
|------|--------|-------|
| Project Creation | ✅/❌ | New project created/used existing |
| Navigation | ✅/❌ | All 5 pages |
| Web URL CRUD | ✅/❌ | Add, verify, delete |
| Tenant + Images | ✅/❌ | **Images displayed correctly: YES/NO** |
| Promotions | ✅/❌ | Multiple created |
| Cascade Delete | ✅/❌ | Promotions deleted with tenant |
| Weaviate Sync | ✅/❌ | Data indexed/removed correctly |

## Image Upload Verification
| Tenant | Upload Status | Display Status | Screenshot |
|--------|---------------|----------------|------------|
| AMPHORA | ✅/❌ | ✅ Displayed / ❌ Broken | tenant-images-XXX.png |

## Cascade Delete Verification
| Before Delete | After Delete | Status |
|---------------|--------------|--------|
| 2 promotions for AMPHORA | 0 promotions for AMPHORA | ✅/❌ |

## Web URL CRUD
| Action | Status |
|--------|--------|
| Add URL | ✅/❌ |
| URL displayed | ✅/❌ |
| Delete URL | ✅/❌ |

## Issues Found
1. **[SEVERITY] Issue**
   - Expected: ...
   - Actual: ...
```

## Troubleshooting

### Images Show as Broken

1. **Check upload command output** - Look for errors
2. **Verify file path** - Use absolute paths
3. **Check file exists** - `ls -la /tmp/facade1.jpg`
4. **Check file size** - Should be > 0 bytes
5. **Try different image** - Create simple test image:
   ```bash
   # If ImageMagick available:
   convert -size 100x100 xc:red /tmp/test.png
   # Otherwise download from a reliable source
   ```
6. **Check browser console** - May show upload errors
7. **Document in report** - Note as known issue

### Promotions Not Cascade Deleted

1. Check backend implements cascade delete
2. May be a UI refresh issue - reload page
3. Check Weaviate separately from UI
4. Document discrepancy in report

### Project Creation Not Available

1. Use existing test project
2. Clean up data before test
3. Document limitation in report
