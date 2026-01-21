export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export interface ChatState {
    messages: ChatMessage[];
    isLoading: boolean;
    error: string | null;
    conversationId: string | null;
}

export interface DifySSEEvent {
    event: string;
    conversation_id?: string;
    message_id?: string;
    answer?: string;
    thought?: string;
    message?: string;
    created_at?: number;
    data?: {
        outputs?: {
            text?: string;
            [key: string]: unknown;
        };
        [key: string]: unknown;
    };
}
