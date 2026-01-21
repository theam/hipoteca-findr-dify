'use client';

interface WelcomeScreenProps {
    onSuggestionClick: (suggestion: string) => void;
}

const suggestions = [
    {
        icon: '💰',
        title: 'CAPACIDAD',
        query: 'Si gano 2.500€ al mes y tengo 40.000€ ahorrados, ¿qué hipoteca puedo pedir?',
    },
    {
        icon: '📊',
        title: 'FIJO VS VARIABLE',
        query: '¿Me conviene más tipo fijo o variable con el Euríbor actual?',
    },
    {
        icon: '🏢',
        title: 'BANCOS',
        query: 'Compara las hipotecas de los principales bancos para mi perfil',
    },
];

export function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
    return (
        <div className="flex flex-col items-start justify-center text-left py-12">
            {/* Minimal Logo/Title */}
            <h2 className="text-4xl font-bold text-[#404040] mb-6 leading-tight">
                Encuentra tu hipoteca,<br />
                <span className="text-gray-300">sin letra pequeña.</span>
            </h2>

            <p className="text-[#666666] text-lg mb-12 max-w-sm">
                Pregunta lo que necesites sobre el mercado hipotecario español.
            </p>

            {/* Suggestions List */}
            <div className="space-y-3 w-full max-w-md">
                <p className="text-[10px] font-bold tracking-[0.2em] text-gray-300 uppercase mb-4">Sugerencias</p>
                {suggestions.map((suggestion, index) => (
                    <button
                        key={index}
                        onClick={() => onSuggestionClick(suggestion.query)}
                        className="
              group
              flex items-center gap-4 
              w-full p-4 
              border border-gray-100
              hover:border-gray-300
              rounded-2xl 
              text-left
              transition-all duration-200
            "
                    >
                        <span className="text-xl grayscale group-hover:grayscale-0 transition-all">{suggestion.icon}</span>
                        <span className="text-xs font-bold tracking-widest text-gray-400 group-hover:text-black transition-colors uppercase">
                            {suggestion.title}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
