# Weaviate Verification Reference

## Weaviate Configuration

- **URL**: `http://localhost:9000`
- **Class**: `Knowledge` (multi-tenant)
- **Tenant naming**: `org_<orgId>-prj_<projectId>-<versionId>`

## Schema Structure

The `Knowledge` class has these properties:
- `chunk_external_id`: Unique identifier for the chunk
- `organization_id`: Organization ID
- `project_id`: Project ID
- `version`: Version name
- `source`: Source identifier (tenant ID, document ID, etc.)
- `title`: Title of the content
- `text`: The actual content text (vectorized)
- `metadata`: Object with `totalChunks`, `chunkNumber`, `fromLine`, `toLine`
- `accessParams`: Object with `sourceType`, `fileName`, `filePath`

## Verification Commands

### List All Tenants

```bash
curl -s http://localhost:9000/v1/schema/Knowledge/tenants | python3 -m json.tool
```

### Get Latest Tenant

```bash
LATEST_TENANT=$(curl -s http://localhost:9000/v1/schema/Knowledge/tenants | \
  grep -oE '"name":"[^"]+"' | tail -1 | cut -d'"' -f4)
echo "Latest tenant: $LATEST_TENANT"
```

### Count Objects in Tenant

```bash
curl -s http://localhost:9000/v1/graphql \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"{ Aggregate { Knowledge(tenant: \\\"$LATEST_TENANT\\\") { meta { count } } } }\"
  }" | python3 -m json.tool
```

### Get Sample Objects

```bash
curl -s http://localhost:9000/v1/graphql \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"{ Get { Knowledge(tenant: \\\"$LATEST_TENANT\\\", limit: 10) { title text source metadata { chunkNumber totalChunks } } } }\"
  }" | python3 -m json.tool
```

### Search for Specific Text

```bash
SEARCH_TEXT="your search term"
curl -s http://localhost:9000/v1/graphql \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"{ Get { Knowledge(tenant: \\\"$LATEST_TENANT\\\", limit: 5, where: {path: [\\\"text\\\"], operator: Like, valueText: \\\"*$SEARCH_TEXT*\\\"}) { title text source } } }\"
  }" | python3 -m json.tool
```

### Filter by Source (Tenant ID)

```bash
SOURCE_ID="tenant-slug"
curl -s http://localhost:9000/v1/graphql \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"{ Get { Knowledge(tenant: \\\"$LATEST_TENANT\\\", limit: 10, where: {path: [\\\"source\\\"], operator: Equal, valueText: \\\"$SOURCE_ID\\\"}) { title text } } }\"
  }" | python3 -m json.tool
```

### Semantic Search (Near Text)

```bash
QUERY="restaurant food menu"
curl -s http://localhost:9000/v1/graphql \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"{ Get { Knowledge(tenant: \\\"$LATEST_TENANT\\\", limit: 5, nearText: {concepts: [\\\"$QUERY\\\"]}) { title text source _additional { certainty distance } } } }\"
  }" | python3 -m json.tool
```

## Verification Checklist

After publication, verify:

1. **Tenant Exists**
   ```bash
   curl -s http://localhost:9000/v1/schema/Knowledge/tenants | grep -c "name"
   # Should return a count > 0
   ```

2. **Objects Count > 0**
   ```bash
   COUNT=$(curl -s http://localhost:9000/v1/graphql \
     -H "Content-Type: application/json" \
     -d "{\"query\": \"{ Aggregate { Knowledge(tenant: \\\"$LATEST_TENANT\\\") { meta { count } } } }\"}" | \
     grep -oE '"count":[0-9]+' | cut -d: -f2)
   echo "Object count: $COUNT"
   # Should be > 0
   ```

3. **Tenant Data Contains Expected Content**
   ```bash
   # Search for a known tenant name
   curl -s http://localhost:9000/v1/graphql \
     -H "Content-Type: application/json" \
     -d "{\"query\": \"{ Get { Knowledge(tenant: \\\"$LATEST_TENANT\\\", limit: 1, where: {path: [\\\"source\\\"], operator: Equal, valueText: \\\"test-tenant-e2e\\\"}) { title text } } }\"}"
   # Should return the tenant data
   ```

4. **Promotions Indexed**
   ```bash
   # Check if promotions are in the index
   curl -s http://localhost:9000/v1/graphql \
     -H "Content-Type: application/json" \
     -d "{\"query\": \"{ Get { Knowledge(tenant: \\\"$LATEST_TENANT\\\", limit: 5, where: {path: [\\\"text\\\"], operator: Like, valueText: \\\"*promotion*\\\"}) { title text source } } }\"}"
   ```

## Common Issues

**Empty results after publish:**
- Wait 5-10 seconds for indexing to complete
- Verify publication status is "completed" not "running"
- Check the correct tenant name (latest one)

**Tenant not found:**
- List all tenants to verify naming
- Publication may have failed - check Publications page

**Search returns no results:**
- Use `Like` operator with wildcards for partial matches
- Check if the text is actually in the indexed content
- Verify the tenant name is correct
