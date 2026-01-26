#!/usr/bin/env python3
"""
Upload a query with variants to a W&B Weave dataset.

Usage:
    python upload_query.py \
        --query "¿Cuántos sueldos cubre el Vida Ley?" \
        --expected "Muerte natural: 16 remuneraciones. Muerte accidental: 32 remuneraciones." \
        --dataset dataset_feedback_variants \
        --project entity/project-name

    # Without variants
    python upload_query.py \
        --query "¿Qué es el SCTR?" \
        --expected "El SCTR es..." \
        --no-variants

    # Dry run (preview without uploading)
    python upload_query.py \
        --query "..." \
        --expected "..." \
        --dry-run

Required environment variables:
    WEAVE_API_KEY or WANDB_API_KEY: W&B API key
    OPENAI_API_KEY: OpenAI API key (for variant generation)
"""

import argparse
import json
import os
from datetime import datetime

import weave
from openai import OpenAI


SYSTEM_PROMPT = """Eres un experto en parafrasear preguntas en español.

Tu tarea es generar exactamente 3 variantes de la pregunta dada. Cada variante debe:
1. Mantener EXACTAMENTE el mismo significado e intención
2. Usar palabras diferentes o estructura gramatical diferente
3. Ser natural y fluida en español
4. Mantener el mismo nivel de formalidad
5. Si la pregunta menciona un producto o término específico, DEBE mantenerlo

IMPORTANTE:
- NO cambies el significado de la pregunta
- NO agregues información nueva
- NO quites información relevante
- Mantén los términos técnicos o nombres de productos exactamente igual

Responde SOLO con un JSON array de 3 strings, sin explicaciones adicionales."""

USER_PROMPT_TEMPLATE = """Genera 3 variantes de esta pregunta:

"{query}"

Responde solo con un JSON array de 3 strings."""


def generate_variants(client: OpenAI, query: str) -> list[str]:
    """Generate 3 variants of a query using OpenAI."""
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": USER_PROMPT_TEMPLATE.format(query=query)},
            ],
            temperature=0.7,
            max_tokens=500,
        )

        content = response.choices[0].message.content.strip()
        # Parse JSON response
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]

        variants = json.loads(content)
        if isinstance(variants, list) and len(variants) >= 3:
            return variants[:3]
        return []
    except Exception as e:
        print(f"Error generating variants: {e}")
        return []


def get_next_id(existing_rows: list) -> int:
    """Get the next available ID from existing rows."""
    max_id = 0
    for row in existing_rows:
        meta_id = row.get('meta.id', 0)
        if isinstance(meta_id, int) and meta_id > max_id:
            max_id = meta_id
        elif isinstance(meta_id, str) and meta_id.isdigit():
            max_id = max(max_id, int(meta_id))
    return max_id + 1


def upload_query(
    query: str,
    expected: str,
    dataset_name: str,
    project: str,
    product: str = "",
    feedback_type: str = "test",
    generate_variants_flag: bool = True,
    dry_run: bool = False
) -> dict:
    """
    Upload a query with variants to a W&B Weave dataset.

    Args:
        query: The query to add
        expected: Expected response
        dataset_name: W&B dataset name
        project: W&B project (entity/project-name)
        product: Product name (optional)
        feedback_type: Feedback type (default: test)
        generate_variants_flag: Whether to generate variants
        dry_run: If True, only preview without uploading

    Returns:
        Dict with upload results
    """
    # Initialize Weave
    os.environ.setdefault("WANDB_API_KEY", os.environ.get("WEAVE_API_KEY", ""))
    weave.init(project)

    # Fetch existing dataset
    print(f"Fetching dataset: {dataset_name}")
    try:
        existing_ref = weave.ref(f"{dataset_name}:latest")
        existing_dataset = existing_ref.get()
        existing_rows = list(existing_dataset.rows)
        print(f"Found {len(existing_rows)} existing rows")
    except Exception as e:
        print(f"Could not fetch existing dataset ({e}), will create new one")
        existing_rows = []

    # Get next ID
    next_id = get_next_id(existing_rows)
    print(f"Next ID: {next_id}")

    # Build rows to add
    new_rows = []
    date_str = datetime.now().strftime("%Y-%m-%d")

    # Original query
    original_row = {
        "query": query,
        "expected_response": expected,
        "meta.id": next_id,
        "meta.date": date_str,
        "meta.feedback_type": feedback_type,
        "variant_type": "original",
        "variant_group": next_id,
    }
    if product:
        original_row["meta.product"] = product
    new_rows.append(original_row)

    # Generate variants
    if generate_variants_flag:
        print(f"\nGenerating variants for: {query[:50]}...")
        openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        variants = generate_variants(openai_client, query)

        if variants:
            print(f"Generated {len(variants)} variants:")
            for i, variant in enumerate(variants):
                print(f"  {i+1}. {variant}")
                variant_row = {
                    "query": variant,
                    "expected_response": expected,
                    "meta.id": next_id,
                    "meta.date": date_str,
                    "meta.feedback_type": feedback_type,
                    "variant_type": f"variant_{i+1}",
                    "variant_group": next_id,
                }
                if product:
                    variant_row["meta.product"] = product
                new_rows.append(variant_row)
        else:
            print("No variants generated")

    # Print summary
    print(f"\nRows to add: {len(new_rows)}")
    for row in new_rows:
        print(f"  [{row['variant_type']}] {row['query'][:60]}...")

    if dry_run:
        print("\n[DRY RUN] Not uploading to W&B")
        return {
            "status": "dry_run",
            "rows": new_rows,
            "next_id": next_id,
        }

    # Combine and publish
    all_rows = existing_rows + new_rows
    print(f"\nPublishing dataset with {len(all_rows)} total rows...")

    dataset = weave.Dataset(name=dataset_name, rows=all_rows)
    ref = weave.publish(dataset)

    print(f"\nDataset published successfully!")
    print(f"Reference: {ref}")
    print(f"New rows added: {len(new_rows)}")
    print(f"Total rows: {len(all_rows)}")

    return {
        "status": "success",
        "reference": str(ref),
        "new_rows": len(new_rows),
        "total_rows": len(all_rows),
        "next_id": next_id,
    }


def main():
    parser = argparse.ArgumentParser(description="Upload query with variants to W&B dataset")
    parser.add_argument("--query", "-q", required=True, help="The query to add")
    parser.add_argument("--expected", "-e", required=True, help="Expected response")
    parser.add_argument("--dataset", "-d", required=True, help="W&B dataset name")
    parser.add_argument("--project", "-p", required=True, help="W&B project (entity/project-name)")
    parser.add_argument("--product", default="", help="Product name")
    parser.add_argument("--feedback-type", default="test", help="Feedback type (default: test)")
    parser.add_argument("--no-variants", action="store_true", help="Skip variant generation")
    parser.add_argument("--dry-run", action="store_true", help="Preview without uploading")
    args = parser.parse_args()

    result = upload_query(
        query=args.query,
        expected=args.expected,
        dataset_name=args.dataset,
        project=args.project,
        product=args.product,
        feedback_type=args.feedback_type,
        generate_variants_flag=not args.no_variants,
        dry_run=args.dry_run,
    )

    if args.dry_run:
        print("\nRows that would be added:")
        print(json.dumps(result["rows"], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
