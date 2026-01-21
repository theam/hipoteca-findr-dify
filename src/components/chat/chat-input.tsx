'use client';

interface ChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    onStop: () => void;
    isLoading: boolean;
    disabled: boolean;
}

export function ChatInput({
    value,
    onChange,
    onSend,
    onKeyDown,
    onStop,
    isLoading,
    disabled,
}: ChatInputProps) {
    return (
        <div className="relative w-full max-w-[600px] mx-auto">
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Pregunta lo que necesitas, encuentra lo que buscas."
                disabled={disabled}
                className="
          w-full px-6 py-4 pr-16 
          border border-gray-300 
          rounded-full 
          focus:outline-none focus:border-gray-400 
          text-base text-[#404040]
          bg-white
          transition-all duration-200
          disabled:opacity-50
        "
            />

            <button
                onClick={isLoading ? onStop : onSend}
                disabled={!isLoading && !value.trim()}
                className={`
          absolute right-2 top-1/2 transform -translate-y-1/2 
          w-10 h-10 
          rounded-full 
          flex items-center justify-center 
          transition-all duration-200 
          ${isLoading
                        ? "bg-red-100 text-red-600 hover:bg-red-200"
                        : value.trim()
                            ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }
        `}
            >
                {isLoading ? (
                    <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M12 19V5M5 12l7-7 7 7" />
                    </svg>
                )}
            </button>
        </div>
    );
}
