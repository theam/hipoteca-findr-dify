'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, ChatState } from '@/types/chat';
import { sendMessage } from '@/lib/dify-client';

export function useChat() {
    const [state, setState] = useState<ChatState>({
        messages: [],
        isLoading: false,
        error: null,
        conversationId: null,
    });

    const abortControllerRef = useRef<AbortController | null>(null);

    const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
        const newMessage: ChatMessage = {
            ...message,
            id: crypto.randomUUID(),
            timestamp: new Date(),
        };
        setState((prev) => ({
            ...prev,
            messages: [...prev.messages, newMessage],
        }));
        return newMessage.id;
    }, []);

    const updateMessage = useCallback((id: string, content: string) => {
        setState((prev) => ({
            ...prev,
            messages: prev.messages.map((msg) =>
                msg.id === id ? { ...msg, content } : msg
            ),
        }));
    }, []);

    const send = useCallback(async (content: string) => {
        if (!content.trim() || state.isLoading) return;

        // Add user message
        addMessage({ role: 'user', content });

        // Create placeholder for assistant message
        const assistantMessageId = addMessage({ role: 'assistant', content: '' });

        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        // Create abort controller for this request
        abortControllerRef.current = new AbortController();

        try {
            let fullContent = '';
            let newConversationId = state.conversationId;

            await sendMessage(
                content,
                state.conversationId,
                (chunk) => {
                    fullContent += chunk;
                    updateMessage(assistantMessageId, fullContent);
                },
                (convId) => {
                    newConversationId = convId;
                },
                abortControllerRef.current.signal
            );

            setState((prev) => ({
                ...prev,
                isLoading: false,
                conversationId: newConversationId,
            }));
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                // Request was cancelled, don't update state
                return;
            }

            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setState((prev) => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }));

            // Update the assistant message with error
            updateMessage(assistantMessageId, 'Lo siento, ha ocurrido un error. Por favor, inténtalo de nuevo.');
        }
    }, [state.isLoading, state.conversationId, addMessage, updateMessage]);

    const stop = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setState((prev) => ({ ...prev, isLoading: false }));
        }
    }, []);

    const reset = useCallback(() => {
        stop();
        setState({
            messages: [],
            isLoading: false,
            error: null,
            conversationId: null,
        });
    }, [stop]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            abortControllerRef.current?.abort();
        };
    }, []);

    return {
        messages: state.messages,
        isLoading: state.isLoading,
        error: state.error,
        send,
        stop,
        reset,
    };
}
