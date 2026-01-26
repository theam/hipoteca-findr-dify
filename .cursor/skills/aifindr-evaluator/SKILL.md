---
name: aifindr-evaluator
description: "Comprehensive evaluation of AIFindr agents against their knowledge base. Use when asked to evaluate an AIFindr agent, test agent responses, run evaluations from a W&B dataset, or generate evaluation reports. Supports single queries, multiple queries, or full dataset evaluation. Generates markdown reports and XLSX files."
---

# AIFindr Evaluator

Evaluate AIFindr agent responses against a knowledge base.

## Input Options

The user can provide queries in three ways:

| Input Type | Description |
|------------|-------------|
| **Single query** | One question to test |
| **Multiple queries** | A list of questions |
| **W&B Dataset** | A Weave dataset reference (e.g., `dataset_name:latest`) |

## Output

For every evaluation, generate:

1. **Responses JSONL** (`responses.jsonl`): Raw agent responses saved BEFORE evaluation (for auditing and re-evaluation)
2. **Markdown Report** (`report.md`): Complete evaluation report with summary, results table, issues found, and recommendations
3. **XLSX File** (`results.xlsx`): Spreadsheet with all queries, responses, verdicts, and details for easy navigation

## Workflow

### Step 1: Gather Inputs

Collect from the user:
- AIFindr project ID (e.g., `prj_SXUxbt9NZGkE8eVBRsBZ7k`)
- Knowledge base path (e.g., `evals/project/knowledge-base/`)
- Queries: single, multiple, or W&B dataset reference

### Step 2: Create Run Folder

Create a timestamped run folder:
```
evals/{project}/runs/{YYYY-MM-DD}_{HH-MM-SS}/
```

Example: `evals/pacifico-corredores/runs/2026-01-21_14-30-45/`

### Step 3: Fetch Responses

For each query, use `scripts/fetch_response.py`:

```bash
python scripts/fetch_response.py "query here" \
    --project prj_xxx \
    --show-sources \
    --json
```

Collect all responses into a list.

### Step 4: Save Responses to JSONL

**Before evaluating**, save all raw responses to `responses.jsonl`:

```python
import json
from pathlib import Path

def save_responses_jsonl(responses: list[dict], output_path: str):
    """Save responses to JSONL file (one JSON object per line)."""
    with open(output_path, 'w', encoding='utf-8') as f:
        for resp in responses:
            f.write(json.dumps(resp, ensure_ascii=False) + '\n')

# Each response object should contain:
responses = [
    {
        "id": 1,
        "query": "¿Qué cubre SCTR salud?",
        "response": "SCTR Salud cubre...",
        "sources": ["doc1.pdf", "doc2.pdf"],
        "num_sources": 2,
        "latency_s": 12.0,
        "timestamp": "2026-01-21T14:30:45"
    }
]

save_responses_jsonl(responses, f"{run_folder}/responses.jsonl")
```

This allows:
- Re-evaluating without re-fetching
- Auditing raw agent outputs
- Comparing responses across runs

### Step 5: Evaluate Against Knowledge Base

For each response:
1. Read the relevant document from the knowledge base
2. Compare response to ground truth
3. Assign verdict:
   - `PASS`: Accurate and complete
   - `PARTIAL`: Correct but incomplete
   - `FAIL`: Contains errors
   - `NO_RETRIEVAL`: Sources don't contain the answer

### Step 6: Generate Reports

Use `scripts/generate_report.py` to create reports with consistent styling:

```python
from scripts.generate_report import generate_reports, get_run_folder_name

results = [
    {
        "id": 1,
        "query": "¿Qué cubre SCTR salud?",
        "expected": "Cláusula 4.3: a) Asistencia preventiva...",
        "response": "SCTR Salud cubre prestaciones de salud...",
        "verdict": "PASS",
        "num_sources": 10,
        "latency_s": 12.0,
        "notes": "Respuesta correcta, cita cláusulas correctas"
    }
]

metadata = {
    "project": "prj_SXUxbt9NZGkE8eVBRsBZ7k",
    "knowledge_base": "evals/pacifico-corredores/knowledge-base/",
    "date": "2026-01-21 14:30"
}

output_dir = f"evals/pacifico-corredores/runs/{get_run_folder_name()}"
md_path, xlsx_path = generate_reports(results, output_dir, metadata)
```

Or via CLI:
```bash
python scripts/generate_report.py \
    --results results.json \
    --output-dir evals/project/runs/2026-01-21_14-30-45/ \
    --project prj_xxx \
    --knowledge-base evals/project/knowledge-base/
```

### Report Formats

#### Markdown Report (`report.md`)

Contains:
- Metadata (project, date, queries count, knowledge base)
- Summary table with verdict counts and percentages
- Results table with all queries
- Detailed results with full responses
- Issues found section
- Recommendations

#### XLSX File (`results.xlsx`)

Two sheets with consistent styling:

**Sheet 1: Summary**
- Project metadata
- Verdict counts with color-coded cells

**Sheet 2: Evaluation Results**
| Column | Description |
|--------|-------------|
| id | Query number |
| query | The question |
| expected | Expected response from knowledge base |
| response | Agent's actual response (COMPLETE, without truncation) |
| verdict | PASS/PARTIAL/FAIL/NO_RETRIEVAL (color-coded) |
| num_sources | Sources retrieved |
| latency_s | Response time |
| notes | Evaluation notes |

XLSX styling:
- Header row: Blue background (#2F5496), white text, frozen
- PASS cells: Green background (#C6EFCE)
- FAIL cells: Red background (#FFC7CE)
- PARTIAL cells: Yellow background (#FFEB9C)
- NO_RETRIEVAL cells: Gray background (#D9D9D9)
- Alternating row colors for readability
- Auto-filter enabled
- Column widths optimized for content

### Output Structure

```
evals/{project}/runs/{YYYY-MM-DD}_{HH-MM-SS}/
├── responses.jsonl # Raw responses (saved BEFORE evaluation)
├── report.md       # Markdown report (after evaluation)
└── results.xlsx    # XLSX report (after evaluation)
```

## Verdicts Reference

| Verdict | When to use | Color |
|---------|-------------|-------|
| `PASS` | Response matches knowledge base, all key points covered | Green |
| `PARTIAL` | Response is correct but missing some information | Yellow |
| `FAIL` | Response contains factual errors | Red |
| `NO_RETRIEVAL` | Retrieved sources don't contain the answer | Gray |

## Debugging Retrieval Issues

When a query gets `NO_RETRIEVAL` or wrong answer:

1. Check the sources - do they contain the answer?
2. Try the exact terminology from the document
3. If exact terms work but natural language doesn't → semantic gap
4. Document the gap for chunking/embedding improvements
