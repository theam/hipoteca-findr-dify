import { DifySSEEvent } from '@/types/chat';

/**
 * Parse Server-Sent Events from Dify API
 */
function parseSSEEvent(line: string): DifySSEEvent | null {
    if (!line.startsWith('data:')) return null;

    try {
        const jsonStr = line.slice(5).trim();
        if (!jsonStr) return null;
        return JSON.parse(jsonStr);
    } catch (e) {
        console.warn('Failed to parse SSE event:', line, e);
        return null;
    }
}

/**
 * Send a message to the chat API and stream the response
 */
export async function sendMessage(
    message: string,
    conversationId: string | null,
    onChunk: (text: string) => void,
    onConversationId: (id: string) => void,
    signal?: AbortSignal
): Promise<void> {
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message,
            conversationId: conversationId || undefined,
            user: getUserId(),
        }),
        signal,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || 'Failed to send message');
    }

    if (!response.body) {
        throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process complete lines
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (!trimmedLine) continue;

                const event = parseSSEEvent(trimmedLine);
                if (!event) continue;

                // DEBUG: Log all events to identify duplication source
                console.log('[Dify Event]', event.event, {
                    answer: event.answer?.substring(0, 50),
                    hasAnswer: !!event.answer,
                    answerLength: event.answer?.length,
                });

                // Handle different event types from Dify
                // See: https://docs.dify.ai/guides/application-publishing/developing-with-apis
                switch (event.event) {
                    case 'message':
                        // Standard chat message - streaming text
                        if (event.answer) {
                            onChunk(event.answer);
                        }
                        if (event.conversation_id) {
                            onConversationId(event.conversation_id);
                        }
                        break;

                    case 'agent_message':
                        // Agent mode - streaming text (same as message)
                        if (event.answer) {
                            onChunk(event.answer);
                        }
                        if (event.conversation_id) {
                            onConversationId(event.conversation_id);
                        }
                        break;

                    case 'agent_thought':
                        // Agent thinking - ignore, answer comes via agent_message
                        break;

                    case 'node_finished':
                        // Workflow node completed.
                        // We ignore text outputs here to avoid duplication with streaming.
                        break;

                    case 'message_end':
                        // Message complete - only capture conversation_id
                        // DO NOT process event.answer here - it contains the full text
                        // and would cause duplication with streaming chunks
                        if (event.conversation_id) {
                            onConversationId(event.conversation_id);
                        }
                        break;

                    case 'workflow_finished':
                        // Workflow complete - ignore to avoid duplication
                        break;

                    case 'error':
                        console.error('Dify API error:', event);
                        throw new Error(event.message || 'Error from Dify API');

                    case 'ping':
                        // Keep-alive, ignore
                        break;

                    default:
                        // Log unknown events for debugging
                        console.log('Unknown Dify event:', event.event, event);
                }
            }
        }

        // Process any remaining buffer content
        if (buffer.trim()) {
            const event = parseSSEEvent(buffer.trim());
            if (event?.answer) {
                onChunk(event.answer);
            }
        }
    } finally {
        reader.releaseLock();
    }
}

/**
 * Get or create a user ID for the session
 */
function getUserId(): string {
    if (typeof window === 'undefined') return 'anonymous';

    let userId = localStorage.getItem('hipoteca-findr-user-id');
    if (!userId) {
        userId = `user-${crypto.randomUUID()}`;
        localStorage.setItem('hipoteca-findr-user-id', userId);
    }
    return userId;
}

