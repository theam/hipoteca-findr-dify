#!/usr/bin/env python3
"""
Fetch agent response for a given query using SSE streaming.

Usage:
    python fetch_response.py "¿Qué es el SCTR?" --project prj_xxx --show-sources
    python fetch_response.py --query "¿Qué coberturas tiene?" --json

Required environment variables:
    AIFINDR_ORG_ID: Organization ID
    AIFINDR_API_KEY: API key
"""

import argparse
import os
import json
import time
import httpx
from typing import Tuple, List, Dict, Any


def get_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"Environment variable {name} must be set.")
    return value


def ask_with_sse(
    client: httpx.Client,
    headers: dict,
    api_base_url: str,
    conv_id: str,
    query: str
) -> Tuple[str, str, str, List[Dict[str, Any]]]:
    """
    Ask a question using SSE streaming.
    Returns: (text_response, product, reasoning, retrieved_sources)
    """
    retrieved_sources = []
    full_response = ""
    current_event = None

    with client.stream(
        'POST',
        f'{api_base_url}/ask',
        headers=headers,
        json={'conversationId': conv_id, 'query': query, 'stream': True}
    ) as response:
        response.raise_for_status()
        for line in response.iter_lines():
            if not line:
                continue

            if line.startswith('event:'):
                current_event = line[6:].strip()
            elif line.startswith('data:'):
                data_str = line[5:].strip()

                if current_event == 'search-workflow-knowledge-retrieved':
                    try:
                        retrieved_sources = json.loads(data_str)
                    except json.JSONDecodeError:
                        pass
                elif current_event == 'search-workflow-answer-delta-generated':
                    try:
                        delta_data = json.loads(data_str)
                        full_response += delta_data.get('delta', '')
                    except json.JSONDecodeError:
                        pass

    # Parse the final response JSON
    text_response = ""
    product = ""
    reasoning = ""
    try:
        response_json = json.loads(full_response)
        text_response = response_json.get('text_response', '')
        product = response_json.get('product', '')
        reasoning = response_json.get('reasoning', '')
    except json.JSONDecodeError:
        text_response = full_response[:500]

    return text_response, product, reasoning, retrieved_sources


def fetch_response(
    project_id: str,
    query: str,
    org_id: str = None,
    api_key: str = None,
    show_sources: bool = False
) -> Dict[str, Any]:
    """
    Fetch response from an AIFindr agent.

    Args:
        project_id: AIFindr project ID (e.g., prj_xxx)
        query: The query to send to the agent
        org_id: Organization ID (defaults to env AIFINDR_ORG_ID)
        api_key: API key (defaults to env AIFINDR_API_KEY)
        show_sources: Whether to include source details

    Returns:
        Dict with query, product, response, reasoning, sources info
    """
    org_id = org_id or get_env('AIFINDR_ORG_ID')
    api_key = api_key or get_env('AIFINDR_API_KEY')

    api_base_url = f'https://api.saas.aifindr.ai/api/widget/projects/{project_id}'

    headers = {
        'X-Organization-Id': org_id,
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json',
    }

    client = httpx.Client(timeout=120.0)

    try:
        # Create conversation
        resp = client.post(f'{api_base_url}/conversations', headers=headers, json={})
        resp.raise_for_status()
        conv_id = resp.json()['conversationId']

        # Ask question with SSE streaming
        start_time = time.time()
        text_response, product, reasoning, sources = ask_with_sse(
            client, headers, api_base_url, conv_id, query
        )
        latency = time.time() - start_time

        output = {
            'query': query,
            'product': product,
            'response': text_response,
            'reasoning': reasoning,
            'num_sources': len(sources),
            'latency_s': round(latency, 2),
        }

        if show_sources:
            output['sources'] = [
                {
                    'chunk_id': s.get('chunk_external_id', ''),
                    'distance': s.get('_additional', {}).get('distance', 0),
                    'text': s.get('text', '')[:300]
                }
                for s in sources
            ]

        return output

    finally:
        client.close()


def main():
    parser = argparse.ArgumentParser(description="Fetch agent response for a query")
    parser.add_argument("query", nargs="?", help="The query to ask the agent")
    parser.add_argument("--query", "-q", dest="query_flag", help="The query (alternative)")
    parser.add_argument("--project", "-p", required=True, help="AIFindr project ID")
    parser.add_argument("--show-sources", "-s", action="store_true", help="Show retrieved sources")
    parser.add_argument("--json", "-j", action="store_true", help="Output as JSON")
    args = parser.parse_args()

    query = args.query or args.query_flag
    if not query:
        parser.error("Query is required")

    try:
        result = fetch_response(args.project, query, show_sources=args.show_sources)

        if args.json:
            print(json.dumps(result, ensure_ascii=False, indent=2))
        else:
            print(f"Query: {result['query']}")
            print(f"Product: {result['product']}")
            print(f"Latency: {result['latency_s']:.2f}s")
            print(f"Sources: {result['num_sources']}")
            print()
            print("=" * 60)
            print("RESPONSE:")
            print("=" * 60)
            print(result['response'])

            if result.get('reasoning'):
                print()
                print("-" * 60)
                print(f"Reasoning: {result['reasoning']}")

            if args.show_sources and result.get('sources'):
                print()
                print("=" * 60)
                print("SOURCES:")
                print("=" * 60)
                for i, s in enumerate(result['sources']):
                    text = s['text'][:150].replace('\n', ' ')
                    print(f"\n{i+1}. [{s['distance']:.4f}] {s['chunk_id']}")
                    print(f"   {text}...")

    except Exception as e:
        if args.json:
            print(json.dumps({'error': str(e)}, ensure_ascii=False))
        else:
            print(f"ERROR: {e}")
        return 1

    return 0


if __name__ == "__main__":
    exit(main())
