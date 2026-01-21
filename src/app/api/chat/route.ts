import { NextRequest } from 'next/server';

/**
 * Dify Chat API Integration
 * Proxies requests to Dify to keep API key secure
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationId, user } = body;

    if (!message) {
      return Response.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.DIFY_API_KEY;
    const apiUrl = process.env.DIFY_API_URL || 'https://api.dify.ai/v1';

    if (!apiKey) {
      return Response.json(
        { error: 'Dify API key not configured' },
        { status: 500 }
      );
    }

    // Call Dify API with streaming
    const response = await fetch(`${apiUrl}/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {},
        query: message,
        response_mode: 'streaming',
        conversation_id: conversationId || '',
        user: user || 'anonymous',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Dify API error:', errorText);
      return Response.json(
        { error: 'Failed to get response from Dify' },
        { status: response.status }
      );
    }

    // Return the SSE stream directly
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
