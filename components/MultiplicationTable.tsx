import React, { useState, memo, useCallback } from 'react';

interface SharedTableProps {
  titleColor: string;
  resultColor: string;
  rowSpacing: number;
  cardBgColor: string;
  hideAllButtonColor: string;
  showAllButtonColor: string;
  speakText: (text: string, tableId: string, rowIndex?: number) => void;
  stopSpeech: () => void;
  speakingIdentifier: string | null;
}

interface MultiplicationTableProps extends SharedTableProps {
  multiplier: number;
}

interface DivisionTableProps extends SharedTableProps {
  divisor: number;
}

// Helper function to determine if text should be light or dark based on background
const getContrastingTextColor = (hexColor: string): string => {
    if (!hexColor || hexColor.length < 7) return '#374151'; // Default to dark text
    const r = parseInt(hexColor.substring(1, 3), 16);
    const g = parseInt(hexColor.substring(3, 5), 16);
    const b = parseInt(hexColor.substring(5, 7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#374151' : '#f9fafb'; // Tailwind's gray-700 or gray-50
};

// --- Optimized Row Component ---

interface TableRowProps {
  num1: number;
  operator: string;
  num2: number;
  result: number;
  tableId: string;
  rowIndex: number;
  textColor: string;
  colors: { col1: string; col2: string; col3: string };
  isSpeaking: boolean;
  visibility: { col1: boolean; col2: boolean; col3: boolean };
  onToggle: (index: number, part: 'col1' | 'col2' | 'col3') => void;
  onSpeak: (text: string, tableId: string, rowIndex: number) => void;
  onStop: () => void;
}

const TableRow = memo(({ 
  num1, operator, num2, result, 
  tableId, rowIndex, textColor, colors, 
  isSpeaking, visibility, 
  onToggle, onSpeak, onStop 
}: TableRowProps) => {
  
  // State for triggering visual animation on click
  const [animatingPart, setAnimatingPart] = useState<'col1' | 'col2' | 'col3' | null>(null);

  const buttonStyle = (color: string): React.CSSProperties => ({ color: color } as React.CSSProperties);

  const handleRowClick = useCallback(() => {
    if (isSpeaking) {
      onStop();
    } else {
      // Construct text based on operator for natural reading
      const text = operator === '×' 
        ? `${num1} nhân ${num2} bằng ${result}`
        : `${num1} chia ${num2} bằng ${result}`;
      onSpeak(text, tableId, rowIndex);
    }
  }, [isSpeaking, onStop, onSpeak, operator, num1, num2, result, tableId, rowIndex]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleRowClick();
    }
  }, [handleRowClick]);

  // Handle individual part click (number/result)
  const handlePartClick = useCallback((e: React.MouseEvent, part: 'col1' | 'col2' | 'col3') => {
    e.stopPropagation(); // Prevent row click (read aloud)
    setAnimatingPart(part);
    onToggle(rowIndex, part);
    setTimeout(() => setAnimatingPart(null), 400); // 400ms matches animate-clickShake duration
  }, [onToggle, rowIndex]);

  // Generate CSS classes dynamically
  const getPartClasses = (part: 'col1' | 'col2' | 'col3') => {
      const isAnimating = animatingPart === part;
      const base = "relative font-bold focus:outline-none rounded px-1 py-0.5 inline-block w-10 sm:w-14 text-center transition-colors duration-200 hover:bg-black/10";
      // If animating, apply clickShake. If not, apply active scale effect.
      return `${base} ${isAnimating ? 'animate-clickShake z-10' : 'active:scale-95'}`;
  };

  return (
    <div
      className={`flex items-center justify-center text-xl sm:text-2xl md:text-3xl w-full p-0.5 rounded-xl transition-all duration-200 cursor-pointer hover:bg-white/60 hover:shadow-sm hover:scale-[1.02] active:scale-95 ${isSpeaking ? 'bg-indigo-100/80 font-semibold ring-2 ring-indigo-200' : ''}`}
      style={{ color: textColor }}
      onClick={handleRowClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={isSpeaking ? 'Dừng đọc' : `Đọc phép tính`}
    >
      <span className="drop-shadow-sm whitespace-nowrap">
        {/* First Number */}
        <button
          onClick={(e) => handlePartClick(e, 'col1')}
          className={getPartClasses('col1')}
          style={buttonStyle(colors.col1)}
        >
          <span className={`transition-opacity duration-300 ease-in-out ${visibility.col1 ? 'opacity-0' : 'opacity-100'}`}>{num1}</span>
          <span className={`transition-opacity duration-300 ease-in-out absolute left-0 right-0 top-0 bottom-0 flex items-center justify-center ${visibility.col1 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>??</span>
        </button>
        
        {' '}{operator === '×' ? '×' : ':'}{' '}
        
        {/* Second Number */}
        <button
          onClick={(e) => handlePartClick(e, 'col2')}
          className={getPartClasses('col2')}
          style={buttonStyle(colors.col2)}
        >
          <span className={`transition-opacity duration-300 ease-in-out ${visibility.col2 ? 'opacity-0' : 'opacity-100'}`}>{num2}</span>
          <span className={`transition-opacity duration-300 ease-in-out absolute left-0 right-0 top-0 bottom-0 flex items-center justify-center ${visibility.col2 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>??</span>
        </button>
        
        {' '}= {' '}
        
        {/* Result */}
        <button
          onClick={(e) => handlePartClick(e, 'col3')}
          className={getPartClasses('col3')}
          style={buttonStyle(colors.col3)}
        >
          <span className={`transition-opacity duration-300 ease-in-out ${visibility.col3 ? 'opacity-0' : 'opacity-100'}`}>{result}</span>
          <span className={`transition-opacity duration-300 ease-in-out absolute left-0 right-0 top-0 bottom-0 flex items-center justify-center ${visibility.col3 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>??</span>
        </button>
      </span>
    </div>
  );
});

// --- Multiplication Table ---

interface VisibilityState {
  col1: boolean; // multiplier / dividend
  col2: boolean; // multiplicand / divisor
  col3: boolean; // result / quotient
}

export const MultiplicationTable: React.FC<MultiplicationTableProps> = memo(({ 
  multiplier, 
  titleColor, 
  resultColor, 
  rowSpacing, 
  cardBgColor, 
  hideAllButtonColor,
  showAllButtonColor,
  speakText,
  stopSpeech,
  speakingIdentifier,
}) => {
  const calculations = Array.from({ length: 10 }, (_, i) => i + 1);
  const textColor = getContrastingTextColor(cardBgColor);
  const [visibility, setVisibility] = useState<Record<number, VisibilityState>>({});
  const tableId = `mul-${multiplier}`;

  // Colors
  const colors = {
    col1: '#3b82f6', // Blue
    col2: '#8b5cf6', // Purple
    col3: '#ef4444'  // Red
  };

  const togglePartVisibility = useCallback((index: number, part: 'col1' | 'col2' | 'col3') => {
    setVisibility(prev => {
      const currentVisibility = prev[index] || { col1: false, col2: false, col3: false };
      return {
        ...prev,
        [index]: { ...currentVisibility, [part]: !currentVisibility[part] }
      };
    });
  }, []);

  const handleReadAloud = useCallback(() => {
    const textToSpeak = `Bảng nhân ${multiplier}. ` + calculations.map(i => `${multiplier} nhân ${i} bằng ${multiplier * i}`).join('. ');
    speakText(textToSpeak, tableId);
  }, [multiplier, calculations, speakText, tableId]);

  const hideAll = useCallback(() => {
    const newVisibility: Record<number, VisibilityState> = {};
    calculations.forEach(i => {
      newVisibility[i] = { col1: true, col2: true, col3: true };
    });
    setVisibility(newVisibility);
  }, [calculations]);

  const showAll = useCallback(() => {
    setVisibility({});
  }, []);

  const isThisTableSpeaking = speakingIdentifier?.startsWith(tableId);

  return (
    <div 
      className="rounded-3xl bg-gradient-to-br from-white to-white/40 border-t border-l border-white/80 border-b border-r border-white/30 shadow-[0_20px_50px_rgba(0,0,0,0.2)] backdrop-blur-sm p-4 flex flex-col transform transition-all hover:shadow-[0_35px_60px_rgba(0,0,0,0.3)] hover:-translate-y-1 relative overflow-hidden"
      style={{ 
        backgroundColor: cardBgColor !== '#ffffff' ? `${cardBgColor}40` : undefined,
      }}
    >
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/80 via-transparent to-transparent pointer-events-none"></div>

      <h2 
        className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-center mb-4 relative z-10 drop-shadow-sm"
        style={{ color: titleColor }}
      >
        Bảng nhân {multiplier}
      </h2>
      <div 
        className="flex flex-col items-center flex-grow relative z-10"
        style={{ gap: `${rowSpacing * 0.25}rem` }}
      >
        {calculations.map((i) => {
          const result = multiplier * i;
          const rowVis = visibility[i] || { col1: false, col2: false, col3: false };
          const rowIdentifier = `${tableId}-row-${i}`;
          
          return (
            <TableRow
              key={i}
              num1={multiplier}
              operator="×"
              num2={i}
              result={result}
              tableId={tableId}
              rowIndex={i}
              textColor={textColor}
              colors={colors}
              isSpeaking={speakingIdentifier === rowIdentifier}
              visibility={rowVis}
              onToggle={togglePartVisibility}
              onSpeak={speakText}
              onStop={stopSpeech}
            />
          );
        })}
      </div>
      <TableFooter 
        isSpeaking={isThisTableSpeaking || false} 
        onRead={handleReadAloud} 
        onStop={stopSpeech} 
        onHideAll={hideAll} 
        onShowAll={showAll} 
      />
    </div>
  );
});

// --- Division Table ---

export const DivisionTable: React.FC<DivisionTableProps> = memo(({
  divisor,
  titleColor,
  resultColor,
  rowSpacing,
  cardBgColor,
  hideAllButtonColor,
  showAllButtonColor,
  speakText,
  stopSpeech,
  speakingIdentifier,
}) => {
  const calculations = Array.from({ length: 10 }, (_, i) => i + 1);
  const textColor = getContrastingTextColor(cardBgColor);
  const [visibility, setVisibility] = useState<Record<number, VisibilityState>>({});
  const tableId = `div-${divisor}`;

  // Colors
  const colors = {
    col1: '#ef4444', // Red (Dividend matches Product)
    col2: '#3b82f6', // Blue (Divisor matches Multiplier)
    col3: '#8b5cf6'  // Purple (Quotient matches Multiplicand)
  };

  const togglePartVisibility = useCallback((index: number, part: 'col1' | 'col2' | 'col3') => {
    setVisibility(prev => {
      const currentVisibility = prev[index] || { col1: false, col2: false, col3: false };
      return {
        ...prev,
        [index]: { ...currentVisibility, [part]: !currentVisibility[part] }
      };
    });
  }, []);

  const handleReadAloud = useCallback(() => {
    const textToSpeak = `Bảng chia ${divisor}. ` + calculations.map(i => `${divisor * i} chia ${divisor} bằng ${i}`).join('. ');
    speakText(textToSpeak, tableId);
  }, [divisor, calculations, speakText, tableId]);

  const hideAll = useCallback(() => {
    const newVisibility: Record<number, VisibilityState> = {};
    calculations.forEach(i => {
      newVisibility[i] = { col1: true, col2: true, col3: true };
    });
    setVisibility(newVisibility);
  }, [calculations]);

  const showAll = useCallback(() => {
    setVisibility({});
  }, []);

  const isThisTableSpeaking = speakingIdentifier?.startsWith(tableId);

  return (
    <div
      className="rounded-3xl bg-gradient-to-br from-white to-white/40 border-t border-l border-white/80 border-b border-r border-white/30 shadow-[0_20px_50px_rgba(0,0,0,0.2)] backdrop-blur-sm p-4 flex flex-col transform transition-all hover:shadow-[0_35px_60px_rgba(0,0,0,0.3)] hover:-translate-y-1 relative overflow-hidden"
      style={{ 
        backgroundColor: cardBgColor !== '#ffffff' ? `${cardBgColor}40` : undefined,
      }}
    >
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/80 via-transparent to-transparent pointer-events-none"></div>

      <h2
        className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-center mb-4 relative z-10 drop-shadow-sm"
        style={{ color: titleColor }}
      >
        Bảng chia {divisor}
      </h2>
      <div
        className="flex flex-col items-center flex-grow relative z-10"
        style={{ gap: `${rowSpacing * 0.25}rem` }}
      >
        {calculations.map((i) => {
          const dividend = divisor * i;
          const quotient = i;
          const rowVis = visibility[i] || { col1: false, col2: false, col3: false };
          const rowIdentifier = `${tableId}-row-${i}`;

          return (
            <TableRow
              key={i}
              num1={dividend}
              operator=":"
              num2={divisor}
              result={quotient}
              tableId={tableId}
              rowIndex={i}
              textColor={textColor}
              colors={colors}
              isSpeaking={speakingIdentifier === rowIdentifier}
              visibility={rowVis}
              onToggle={togglePartVisibility}
              onSpeak={speakText}
              onStop={stopSpeech}
            />
          );
        })}
      </div>
      <TableFooter 
        isSpeaking={isThisTableSpeaking || false} 
        onRead={handleReadAloud} 
        onStop={stopSpeech} 
        onHideAll={hideAll} 
        onShowAll={showAll} 
      />
    </div>
  );
});

// --- Footer Component for reuse ---

const TableFooter = memo(({ isSpeaking, onRead, onStop, onHideAll, onShowAll }: { 
    isSpeaking: boolean; 
    onRead: () => void; 
    onStop: () => void; 
    onHideAll: () => void; 
    onShowAll: () => void;
}) => (
  <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 mt-6 pt-4 border-t border-black/5 relative z-10">
    <button 
      onClick={isSpeaking ? onStop : onRead} 
      className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-150 ease-out flex items-center gap-2 group active:translate-y-[6px] active:shadow-none hover:brightness-110"
      style={{ 
        backgroundColor: isSpeaking ? '#f59e0b' : '#3b82f6', 
        color: 'white',
        boxShadow: isSpeaking ? '0 6px 0 #b45309' : '0 6px 0 #1e40af'
      }}
    >
      {isSpeaking ? (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 group-hover:animate-wiggle" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          Dừng
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 group-hover:animate-wiggle" viewBox="0 0 20 20" fill="currentColor"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>
          Đọc
        </>
      )}
    </button>
    <button 
      onClick={onHideAll} 
      className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-150 ease-out bg-slate-100 text-slate-600 hover:bg-slate-200 shadow-[0_6px_0_#cbd5e1] active:shadow-none active:translate-y-[6px] hover:brightness-105"
    >
      Ẩn hết
    </button>
    <button 
      onClick={onShowAll}
      className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-150 ease-out bg-green-100 text-green-700 hover:bg-green-200 shadow-[0_6px_0_#86efac] active:shadow-none active:translate-y-[6px] hover:brightness-105"
    >
      Hiện hết
    </button>
  </div>
));