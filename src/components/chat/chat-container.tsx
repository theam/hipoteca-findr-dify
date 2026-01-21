'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@/hooks/use-chat';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { WelcomeScreen } from './welcome-screen';

export function ChatContainer() {
    const { messages, isLoading, error, send, stop, reset } = useChat();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [inputValue, setInputValue] = useState('');

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSend = () => {
        if (inputValue.trim()) {
            send(inputValue);
            setInputValue('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        send(suggestion);
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center font-sans">
            {/* Container 640px centered */}
            <div className="w-[640px] flex-1 flex flex-col py-8 px-4 sm:px-0">

                {/* Minimal Header */}
                <div className="flex justify-between items-center mb-12">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-black rounded-full" />
                        <span className="text-xs font-bold tracking-widest uppercase text-black">Hipoteca Findr</span>
                    </div>
                    {messages.length > 0 && (
                        <button
                            onClick={reset}
                            className="text-[10px] uppercase tracking-wider font-bold text-gray-400 hover:text-black transition-colors"
                        >
                            Nueva consulta
                        </button>
                    )}
                </div>

                {/* Messages Area */}
                <div className="flex-1 space-y-8 pb-40">
                    {messages.length === 0 ? (
                        <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
                    ) : (
                        <>
                            {messages.map((message) => (
                                <ChatMessage key={message.id} message={message} />
                            ))}

                            {isLoading && (
                                <div className="ml-[60px]">
                                    <span className="inline-block w-2 h-5 bg-[#404040] animate-pulse"></span>
                                </div>
                            )}
                        </>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-500 text-xs rounded-xl border border-red-100 animate-fade-in">
                        {error}
                    </div>
                )}

            </div>

            {/* Input Area - Fixed at bottom */}
            <div className="fixed bottom-0 left-0 right-0 bg-white pt-4 pb-8">
                <div className="w-[640px] mx-auto px-4 sm:px-0">
                    <ChatInput
                        value={inputValue}
                        onChange={setInputValue}
                        onSend={handleSend}
                        onKeyDown={handleKeyDown}
                        onStop={stop}
                        isLoading={isLoading}
                        disabled={isLoading}
                    />
                    <p className="text-center text-[10px] text-gray-300 mt-4 uppercase tracking-widest">
                        Información orientativa • Hipoteca Findr
                    </p>
                </div>
            </div>
        </div>
    );
}
