import React from 'react';

type CandyColor = 'blue' | 'purple' | 'pink' | 'green' | 'yellow' | 'white' | 'orange' | 'red' | 'sky' | 'teal';

interface CandyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    color?: CandyColor;
}

const colorStyles: Record<CandyColor, { bg: string; shadow: string; text: string; border: string; dark: string }> = {
    blue: { bg: 'bg-gradient-to-b from-blue-400 to-blue-600', shadow: 'shadow-blue-900/20', text: 'text-white', border: 'border-blue-300', dark: '#1d4ed8' },
    purple: { bg: 'bg-gradient-to-b from-violet-400 to-violet-600', shadow: 'shadow-violet-900/20', text: 'text-white', border: 'border-violet-300', dark: '#6d28d9' },
    pink: { bg: 'bg-gradient-to-b from-pink-400 to-pink-600', shadow: 'shadow-pink-900/20', text: 'text-white', border: 'border-pink-300', dark: '#be185d' },
    green: { bg: 'bg-gradient-to-b from-emerald-400 to-emerald-600', shadow: 'shadow-emerald-900/20', text: 'text-white', border: 'border-emerald-300', dark: '#047857' },
    yellow: { bg: 'bg-gradient-to-b from-yellow-300 to-yellow-500', shadow: 'shadow-yellow-900/20', text: 'text-yellow-950', border: 'border-yellow-200', dark: '#a16207' },
    white: { bg: 'bg-gradient-to-b from-white via-slate-50 to-slate-100', shadow: 'shadow-slate-400/20', text: 'text-slate-700', border: 'border-white', dark: '#94a3b8' },
    orange: { bg: 'bg-gradient-to-b from-orange-400 to-orange-600', shadow: 'shadow-orange-900/20', text: 'text-white', border: 'border-orange-300', dark: '#c2410c' },
    red: { bg: 'bg-gradient-to-b from-rose-400 to-rose-600', shadow: 'shadow-rose-900/20', text: 'text-white', border: 'border-rose-300', dark: '#be123c' },
    sky: { bg: 'bg-gradient-to-b from-sky-400 to-sky-600', shadow: 'shadow-sky-900/20', text: 'text-white', border: 'border-sky-300', dark: '#0369a1' },
    teal: { bg: 'bg-gradient-to-b from-teal-400 to-teal-600', shadow: 'shadow-teal-900/20', text: 'text-white', border: 'border-teal-300', dark: '#0f766e' },
};

export const CandyButton: React.FC<CandyButtonProps> = ({ color = 'white', className = '', children, disabled, style, ...props }) => {
    const styleConfig = colorStyles[color];
    
    return (
        <button
            disabled={disabled}
            className={`
                relative outline-none font-extrabold cursor-pointer
                transition-all duration-150 ease-out transform translate-y-0
                rounded-[20px] flex items-center justify-center text-center overflow-hidden
                ${styleConfig.bg} ${styleConfig.text}
                
                /* Tactical 3D Block Shadow */
                border-t-[1px] ${styleConfig.border}
                shadow-[0_6px_0_0_var(--button-dark),0_12px_20px_-4px_rgba(0,0,0,0.15)]
                ${styleConfig.shadow}
                
                shine-effect

                hover:-translate-y-[4px]
                hover:shadow-[0_10px_0_0_var(--button-dark),0_20px_30px_-5px_rgba(0,0,0,0.2)]
                
                active:not(:disabled):translate-y-[4px]
                active:not(:disabled):shadow-[0_2px_0_0_var(--button-dark),0_4px_8px_-2px_rgba(0,0,0,0.2)]
                
                disabled:opacity-50 disabled:cursor-not-allowed disabled:filter disabled:grayscale disabled:translate-y-[0px] disabled:shadow-none
                
                group
                ${className}
            `}
            style={{ '--button-dark': styleConfig.dark } as React.CSSProperties}
            {...props}
        >
            {/* Top Gloss Highlight */}
            <span className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/40 to-transparent pointer-events-none rounded-t-[20px]"></span>
            
            {/* Content Wrapper - Animation classes removed here to keep text still */}
            <span className="relative drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)] flex items-center gap-2.5 justify-center w-full h-full pointer-events-none z-10 px-2 py-1 transition-all duration-300 ease-out">
                {children}
            </span>
        </button>
    );
};