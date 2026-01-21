'use client';

import { ChatMessage as ChatMessageType } from '@/types/chat';

interface ChatMessageProps {
    message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
    const isUser = message.role === 'user';

    const formatInlineText = (text: string) => {
        return text
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.*?)\*/g, "<em>$1</em>")
            .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded font-mono text-[0.9em]">$1</code>')
            .replace(
                /\[([^\]]+)\]\(([^)]+)\)/g,
                '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">$1</a>'
            );
    };

    const formatContent = (content: string) => {
        return content.split("\n").map((line, index) => {
            const trimmedLine = line.trim();

            // Títulos h1, h2, h3
            if (trimmedLine.startsWith("# ") || trimmedLine.startsWith("## ") || trimmedLine.startsWith("### ")) {
                const text = trimmedLine.replace(/^#+\s+/, "");
                return (
                    <h3 key={index} className="text-lg font-bold mb-2 mt-4 first:mt-0 text-[#404040]">
                        {text}
                    </h3>
                );
            }

            // Títulos en negrita que ocupan toda la línea (común en respuestas RAG)
            if (trimmedLine.startsWith("**") && trimmedLine.endsWith("**") && trimmedLine.length > 4) {
                const text = trimmedLine.replace(/\*\*/g, "");
                return (
                    <h4 key={index} className="text-sm font-bold mb-2 mt-4 text-[#404040] uppercase tracking-wider">
                        {text}
                    </h4>
                );
            }

            // Lista con bullet points
            if (trimmedLine.startsWith("• ") || trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ")) {
                const text = trimmedLine.replace(/^[•\-*]\s+/, "");
                return (
                    <div key={index} className="flex items-start mb-2 ml-2">
                        <span className="mr-2 opacity-60 text-xs mt-1">●</span>
                        <span className="flex-1" dangerouslySetInnerHTML={{ __html: formatInlineText(text) }} />
                    </div>
                );
            }

            // Líneas vacías
            if (trimmedLine === "") {
                return <div key={index} className="h-2" />;
            }

            // Texto normal
            return (
                <p key={index} className="mb-2 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formatInlineText(line) }}
                />
            );
        });
    };

    return (
        <div className="text-left ml-[60px] relative">
            {isUser ? (
                <>
                    <div className="absolute -left-[40px] top-2 w-3 h-3 bg-black rounded-full" />
                    <div className="text-[#404040] text-lg leading-relaxed max-w-[500px] uppercase" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 700 }}>
                        {message.content}
                    </div>
                </>
            ) : (
                <div className="text-[#404040] text-sm leading-relaxed max-w-[500px]">
                    {formatContent(message.content)}
                </div>
            )}
        </div>
    );
}
