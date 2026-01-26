---
name: aifindr-dataset-builder
description: "Build evaluation datasets for AIFindr agents by adding queries with expected responses extracted from a knowledge base. Use when asked to add queries to a W&B dataset, create evaluation test cases, or build ground truth datasets from documents. Requires W&B dataset name, project, query, and knowledge base path."
---

# AIFindr Dataset Builder

Add evaluation queries to W&B Weave datasets with expected responses extracted from a knowledge base.

## Prerequisites

| Parameter | Description | Example |
|-----------|-------------|---------|
| `dataset` | W&B dataset name | `dataset_feedback_variants` |
| `project` | W&B project (entity/project) | `the-agile-monkeys/pacifico-corredores` |
| `knowledge_base` | Path to source documents | `/path/to/files/` |
| `query` | The query to add | `¿Cuántos sueldos cubre el Vida Ley?` |

Environment variables:
```bash
export WEAVE_API_KEY="your_wandb_api_key"
export OPENAI_API_KEY="your_openai_api_key"  # For variant generation
```

## Workflow

### Step 1: Understand the Query

Analyze the user's query to identify:
- **Topic**: What information is being requested?
- **Product/Category**: Which product or document section is relevant?
- **Key terms**: What terms should appear in the knowledge base?

Example:
```
Query: "¿Cuántos sueldos cubre el Vida Ley?"
Topic: Coverage amounts for Vida Ley insurance
Product: Vida Ley
Key terms: sueldos, remuneraciones, cobertura, muerte, invalidez
```

### Step 2: Search the Knowledge Base

Search the knowledge base directory to find relevant documents:

1. **List available documents**:
   ```bash
   ls -la /path/to/knowledge-base/
   ```

2. **Identify relevant files** based on query topic:
   - For "Vida Ley" queries → look for files with "VL", "Vida Ley" in name
   - For "SCTR" queries → look for files with "SCTR" in name
   - For general queries → check Q&A files or product documentation

3. **Read the relevant document(s)** to find the answer

### Step 3: Extract the Expected Response

Read the document and extract the factual answer. The expected response should be:

- **Factual**: Based directly on the document content
- **Complete**: Include all relevant information
- **Concise**: Only the essential facts, not verbose explanations

Example extraction:
```
Document section (Vida Ley Condiciones Particulares):
"4. COBERTURAS Y SUMAS ASEGURADAS
- Muerte Natural: 16 Remuneraciones Mensuales Asegurables
- Muerte Accidental: 32 Remuneraciones Mensuales Asegurables
- Invalidez Total y Permanente por Accidente: 32 Remuneraciones Mensuales Asegurables"

Expected response:
"Muerte natural: 16 remuneraciones mensuales asegurables. Muerte accidental: 32 remuneraciones. Invalidez total y permanente por accidente: 32 remuneraciones."
```

### Step 4: Determine the Product (Optional)

If the knowledge base has multiple products, identify which one applies:
- Read the document to confirm the product name
- Use consistent naming (e.g., "Vida Ley", "SCTR Salud", "SCTR Pensión")

### Step 5: Upload to Dataset

Use `scripts/upload_query.py`:

```bash
python scripts/upload_query.py \
    --query "¿Cuántos sueldos cubre el Vida Ley?" \
    --expected "Muerte natural: 16 remuneraciones. Muerte accidental: 32 remuneraciones. Invalidez total y permanente por accidente: 32 remuneraciones." \
    --dataset dataset_feedback_variants \
    --project the-agile-monkeys/pacifico-corredores \
    --product "Vida Ley"
```

**Options:**
- `--dry-run`: Preview without uploading
- `--no-variants`: Skip variant generation
- `--product`: Associate with a specific product
- `--feedback-type`: Tag the type (default: "test")

## Expected Response Guidelines

### DO:
- Quote exact figures, dates, and terms from documents
- Include all relevant data points
- Use the document's terminology

### DON'T:
- Paraphrase or interpret the information
- Add information not in the document
- Include marketing language or opinions

### Examples:

**Good expected response:**
```
"El deducible del SCTR Salud es de $50 por evento. El límite anual es de $100,000."
```

**Bad expected response:**
```
"El SCTR Salud tiene un deducible muy bajo y excelente cobertura que protege a los trabajadores."
```

## Batch Processing

For multiple queries, repeat the workflow for each:

1. Receive query from user
2. Search knowledge base for answer
3. Extract expected response
4. Upload with `--dry-run` first to verify
5. Upload without `--dry-run` to publish

## Output

The script outputs:
- Assigned ID for the new query
- Generated variants (3 paraphrased versions)
- Confirmation of upload to W&B

View the dataset at:
```
https://wandb.ai/{entity}/{project}/weave/objects/{dataset}
```
