import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MultiplicationTable, DivisionTable } from './components/MultiplicationTable';
import { GoogleGenAI } from "@google/genai";

// Default "Correct" Sound set to Electronic (8-bit)
const DEFAULT_CORRECT_SOUND = "https://assets.mixkit.co/active_storage/sfx/270/270-preview.mp3";

// Default "Incorrect" Sound set to Low Thud
const DEFAULT_INCORRECT_SOUND = "https://assets.mixkit.co/active_storage/sfx/2043/2043-preview.mp3";

// Sound Options - Limited to new defaults only
const CORRECT_SOUND_OPTIONS = [
    { name: 'Điện tử (8-bit)', value: DEFAULT_CORRECT_SOUND },
];

const INCORRECT_SOUND_OPTIONS = [
    { name: 'Trầm thấp (Thud)', value: DEFAULT_INCORRECT_SOUND },
];


const googleFonts = [
  { name: 'Roboto', value: "'Roboto', sans-serif" },
  { name: 'Open Sans', value: "'Open Sans', sans-serif" },
  { name: 'Lato', value: "'Lato', sans-serif" },
  { name: 'Montserrat', value: "'Montserrat', sans-serif" },
  { name: 'Poppins', value: "'Poppins', sans-serif" },
];

const themes = {
  default: {
    name: 'Mặc định',
    colors: {
      titleColor: '#4f46e5',
      resultColor: '#4338ca',
      cardBgColor: '#ffffff',
      hideAllButtonColor: '#ef4444',
      showAllButtonColor: '#22c55e',
    },
    font: googleFonts[0].value,
  },
  dark: {
    name: 'Tối',
    colors: {
      titleColor: '#e0f2fe',
      resultColor: '#bae6fd',
      cardBgColor: '#1e293b', // Slate 800
      hideAllButtonColor: '#f87171',
      showAllButtonColor: '#2dd4bf',
    },
    font: googleFonts[0].value,
  }
};

const tableBackgroundColors = [
    { name: 'Mặc định', value: '#ffffff' },
    { name: 'Oải Hương', value: '#885A89' },
    { name: 'Xanh Mờ', value: '#8AA8A1' },
    { name: 'Đá Nhạt', value: '#CBCBD4' },
    { name: 'Nâu Nhạt', value: '#D1B490' },
    { name: 'Bí Ngô', value: '#EE7B30' },
];

const achievements = {
    PERFECT_SCORE_10: { name: "Ong Thợ Chăm Chỉ", description: "Đạt điểm tuyệt đối trong bài kiểm tra 10 câu.", icon: "⭐" },
    PERFECT_SCORE_20: { name: "Siêu Sao Toán Học", description: "Đạt điểm tuyệt đối trong bài kiểm tra 20 câu.", icon: "🏆" },
    STREAK_5: { name: "Bé Tính Nhanh", description: "Trả lời đúng 5 câu liên tiếp.", icon: "🔥" },
    STREAK_10: { name: "Kiện Tướng Tính Nhẩm", description: "Trả lời đúng 10 câu liên tiếp.", icon: "🚀" },
    TOTAL_CORRECT_25: { name: "Nhà Bác Học Nhí", description: "Trả lời đúng tổng cộng 25 câu hỏi.", icon: "✅" },
    TOTAL_CORRECT_50: { name: "Chăm Ngoan Học Giỏi", description: "Trả lời đúng tổng cộng 50 câu hỏi.", icon: "🎓" },
};

type AchievementId = keyof typeof achievements;

// Helper function to determine text color based on background
const getContrastingTextColor = (hexColor: string): string => {
    if (!hexColor || hexColor.length < 7) return '#374151'; // Default dark
    const r = parseInt(hexColor.substring(1, 3), 16);
    const g = parseInt(hexColor.substring(3, 5), 16);
    const b = parseInt(hexColor.substring(5, 7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#374151' : '#f9fafb'; // gray-700 or gray-50
};

// Helper to darken/lighten color for shadow generation
const adjustBrightness = (hex: string, amount: number) => {
    if (!hex) return '#000000';
    return '#' + hex.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
}

type ExerciseType = 'CALCULATION' | 'MISSING_NUMBER' | 'COMPARISON' | 'TRUE_FALSE' | 'FIND_OPERANDS' | 'MULTIPLE_CHOICE';

type Question = {
  type: ExerciseType;
  display: string; // The text shown to the user, e.g., "5 x ? = 20"
  answer: number | string | boolean; // The correct answer (or target value for FIND_OPERANDS)
  correctExpression: string; // The full correct expression for the results screen
  options?: (number | string)[]; // Options for multiple choice
};

type Difficulty = 'easy' | 'medium' | 'hard';

const exerciseTypeLabels: Record<keyof typeof exerciseTypesConfig, string> = {
    CALCULATION: 'Tính toán (a × b = ?)',
    MISSING_NUMBER: 'Tìm số còn thiếu (? × b = c)',
    COMPARISON: 'So sánh (<, >, =)',
    TRUE_FALSE: 'Đúng / Sai',
    FIND_OPERANDS: 'Tìm hai số (? × ? = c)',
    MULTIPLE_CHOICE: 'Trắc nghiệm',
};

const exerciseTypesConfig = {
    CALCULATION: true,
    MISSING_NUMBER: true,
    COMPARISON: true,
    TRUE_FALSE: true,
    FIND_OPERANDS: true,
    MULTIPLE_CHOICE: true,
};

type ExerciseTypes = typeof exerciseTypesConfig;

interface SelectedCalculation {
    type: 'mul' | 'div';
    num1: number;
    num2: number;
    result: number;
}

interface VisualizationMask {
    num1: boolean;
    num2: boolean;
    result: boolean;
}

// Interface for Chat Messages
interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

const App: React.FC = () => {
  const multipliers = [2, 3, 4, 5, 6, 7, 8, 9];

  // App mode
  const [mode, setMode] = useState<'tables' | 'quiz' | 'achievements'>('tables');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Table settings
  const [titleColor, setTitleColor] = useState(themes.default.colors.titleColor); 
  const [resultColor, setResultColor] = useState(themes.default.colors.resultColor); 
  const [cardBgColor, setCardBgColor] = useState(themes.default.colors.cardBgColor); 
  const [font, setFont] = useState(themes.default.font);
  const [rowSpacing, setRowSpacing] = useState(2); // Default to 2 (0.5rem)
  const [hideAllButtonColor, setHideAllButtonColor] = useState(themes.default.colors.hideAllButtonColor); 
  const [showAllButtonColor, setShowAllButtonColor] = useState(themes.default.colors.showAllButtonColor); 
  const [startMultiplier, setStartMultiplier] = useState(2);
  const [endMultiplier, setEndMultiplier] = useState(9);

  // Initialize tableVisibility directly from localStorage to ensure persistence
  const [tableVisibility, setTableVisibility] = useState<{
    mul: Record<number, boolean>;
    div: Record<number, boolean>;
  }>(() => {
    const saved = localStorage.getItem('multiplicationTableVisibility');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (parsed && typeof parsed === 'object' && parsed.mul && parsed.div) {
                return parsed;
            }
        } catch (e) {
            console.error("Error parsing tableVisibility", e);
        }
    }
    // Default: All hidden
    const initial: { mul: Record<number, boolean>; div: Record<number, boolean> } = { mul: {}, div: {} };
    multipliers.forEach(m => {
      initial.mul[m] = false;
      initial.div[m] = false;
    });
    return initial;
  });

  // Quiz settings & state
  const [quizState, setQuizState] = useState<'setup' | 'active' | 'results'>('setup');
  const [numQuestions, setNumQuestions] = useState(() => {
      const saved = localStorage.getItem('multiplicationTableNumQuestions');
      return saved ? parseInt(saved, 10) : 10;
  });
  const [exerciseTypes, setExerciseTypes] = useState<ExerciseTypes>(exerciseTypesConfig);
  const [quizOperations, setQuizOperations] = useState<{ mul: boolean; div: boolean }>({ mul: true, div: true });
  
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(string | number | boolean)[]>([]);
  const [score, setScore] = useState(0);
  
  // Initialize Sound State with Priority: Saved Selection > Saved Custom Upload > Default
  const [correctSound, setCorrectSound] = useState(() => {
      const savedSelection = localStorage.getItem('multiplicationTableCorrectSound');
      const savedCustom = localStorage.getItem('multiplicationTableSavedCustomCorrect');
      return savedSelection || savedCustom || DEFAULT_CORRECT_SOUND;
  }); 
  const [incorrectSound, setIncorrectSound] = useState(() => {
      const savedSelection = localStorage.getItem('multiplicationTableIncorrectSound');
      const savedCustom = localStorage.getItem('multiplicationTableSavedCustomIncorrect');
      return savedSelection || savedCustom || DEFAULT_INCORRECT_SOUND;
  });
  
  // State for storing custom uploaded sounds persistently
  const [savedCustomCorrectSound, setSavedCustomCorrectSound] = useState<string | null>(() => localStorage.getItem('multiplicationTableSavedCustomCorrect'));
  const [savedCustomIncorrectSound, setSavedCustomIncorrectSound] = useState<string | null>(() => localStorage.getItem('multiplicationTableSavedCustomIncorrect'));

  const [correctAnswerColor, setCorrectAnswerColor] = useState('#22c55e'); // Green default
  const [incorrectAnswerColor, setIncorrectAnswerColor] = useState('#ef4444'); // Red default
  const [quizCardBgColor, setQuizCardBgColor] = useState('#ffffff');
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const quizInputRef = useRef<HTMLInputElement>(null);
  const operand1Ref = useRef<HTMLInputElement>(null);
  const operand2Ref = useRef<HTMLInputElement>(null);

  // Gamification state
  const [unlockedAchievements, setUnlockedAchievements] = useState<Set<AchievementId>>(new Set());
  const [totalCorrectAnswers, setTotalCorrectAnswers] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [recentlyUnlocked, setRecentlyUnlocked] = useState<AchievementId | null>(null);

  // Visual Formation State & Interaction
  // Initialize to 0 for num2/result to show blank state initially
  const [selectedCalculation, setSelectedCalculation] = useState<SelectedCalculation | null>({ type: 'mul', num1: 2, num2: 0, result: 0 });
  const [divisionStep, setDivisionStep] = useState(0);
  const [clickedStars, setClickedStars] = useState<Set<string>>(new Set());
  
  // Initialize showVisualization directly from localStorage
  const [showVisualization, setShowVisualization] = useState(() => {
      const saved = localStorage.getItem('multiplicationTableShowVisualization');
      return saved ? JSON.parse(saved) : false;
  });

  const [visualizationMask, setVisualizationMask] = useState<VisualizationMask>({ num1: true, num2: true, result: true });

  // TTS State
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speechSettings, setSpeechSettings] = useState({ voiceURI: '', rate: 1, pitch: 1 });
  const [speakingIdentifier, setSpeakingIdentifier] = useState<string | null>(null);

  // Load settings from localStorage
  useEffect(() => {
    const saved = {
      titleColor: localStorage.getItem('multiplicationTableTitleColor'),
      resultColor: localStorage.getItem('multiplicationTableResultColor'),
      cardBgColor: localStorage.getItem('multiplicationTableCardBgColor'),
      font: localStorage.getItem('multiplicationTableFont'),
      rowSpacing: localStorage.getItem('multiplicationTableRowSpacing'),
      hideAllColor: localStorage.getItem('multiplicationTableHideAllButtonColor'),
      showAllColor: localStorage.getItem('multiplicationTableShowAllButtonColor'),
      startMultiplier: localStorage.getItem('multiplicationTableStartMultiplier'),
      endMultiplier: localStorage.getItem('multiplicationTableEndMultiplier'),
      correctSound: localStorage.getItem('multiplicationTableCorrectSound'),
      incorrectSound: localStorage.getItem('multiplicationTableIncorrectSound'),
      unlockedAchievements: localStorage.getItem('multiplicationTableUnlockedAchievements'),
      totalCorrectAnswers: localStorage.getItem('multiplicationTableTotalCorrect'),
      difficulty: localStorage.getItem('multiplicationTableDifficulty'),
      // numQuestions loaded directly in useState
      correctAnswerColor: localStorage.getItem('multiplicationTableCorrectAnswerColor'),
      incorrectAnswerColor: localStorage.getItem('multiplicationTableIncorrectAnswerColor'),
      quizCardBgColor: localStorage.getItem('multiplicationTableQuizCardBgColor'),
      exerciseTypes: localStorage.getItem('multiplicationTableExerciseTypes'),
      quizOperations: localStorage.getItem('multiplicationTableQuizOperations'),
      speechSettings: localStorage.getItem('multiplicationTableSpeechSettings'),
    };

    if (saved.titleColor) setTitleColor(saved.titleColor);
    if (saved.resultColor) setResultColor(saved.resultColor);
    if (saved.cardBgColor) setCardBgColor(saved.cardBgColor);
    if (saved.font) setFont(saved.font);
    if (saved.rowSpacing) setRowSpacing(parseInt(saved.rowSpacing, 10));
    if (saved.hideAllColor) setHideAllButtonColor(saved.hideAllColor);
    if (saved.showAllColor) setShowAllButtonColor(saved.showAllColor);
    if (saved.startMultiplier) setStartMultiplier(parseInt(saved.startMultiplier, 10));
    if (saved.endMultiplier) setEndMultiplier(parseInt(saved.endMultiplier, 10));
    if (saved.correctSound) setCorrectSound(saved.correctSound);
    if (saved.incorrectSound) setIncorrectSound(saved.incorrectSound);
    if (saved.unlockedAchievements) setUnlockedAchievements(new Set(JSON.parse(saved.unlockedAchievements)));
    if (saved.totalCorrectAnswers) setTotalCorrectAnswers(parseInt(saved.totalCorrectAnswers, 10));
    if (saved.difficulty) setDifficulty(saved.difficulty as Difficulty);
    if (saved.correctAnswerColor) setCorrectAnswerColor(saved.correctAnswerColor);
    if (saved.incorrectAnswerColor) setIncorrectAnswerColor(saved.incorrectAnswerColor);
    if (saved.quizCardBgColor) setQuizCardBgColor(saved.quizCardBgColor);
    if (saved.exerciseTypes) setExerciseTypes(JSON.parse(saved.exerciseTypes));
    if (saved.quizOperations) setQuizOperations(JSON.parse(saved.quizOperations));
    if (saved.speechSettings) setSpeechSettings(JSON.parse(saved.speechSettings));
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('multiplicationTableTitleColor', titleColor);
    localStorage.setItem('multiplicationTableResultColor', resultColor);
    localStorage.setItem('multiplicationTableCardBgColor', cardBgColor);
    localStorage.setItem('multiplicationTableFont', font);
    localStorage.setItem('multiplicationTableRowSpacing', rowSpacing.toString());
    localStorage.setItem('multiplicationTableHideAllButtonColor', hideAllButtonColor);
    localStorage.setItem('multiplicationTableShowAllButtonColor', showAllButtonColor);
    localStorage.setItem('multiplicationTableStartMultiplier', startMultiplier.toString());
    localStorage.setItem('multiplicationTableEndMultiplier', endMultiplier.toString());
    localStorage.setItem('multiplicationTableCorrectSound', correctSound);
    localStorage.setItem('multiplicationTableIncorrectSound', incorrectSound);
    localStorage.setItem('multiplicationTableUnlockedAchievements', JSON.stringify(Array.from(unlockedAchievements)));
    localStorage.setItem('multiplicationTableTotalCorrect', totalCorrectAnswers.toString());
    localStorage.setItem('multiplicationTableDifficulty', difficulty);
    localStorage.setItem('multiplicationTableNumQuestions', numQuestions.toString());
    localStorage.setItem('multiplicationTableCorrectAnswerColor', correctAnswerColor);
    localStorage.setItem('multiplicationTableIncorrectAnswerColor', incorrectAnswerColor);
    localStorage.setItem('multiplicationTableQuizCardBgColor', quizCardBgColor);
    localStorage.setItem('multiplicationTableVisibility', JSON.stringify(tableVisibility));
    localStorage.setItem('multiplicationTableExerciseTypes', JSON.stringify(exerciseTypes));
    localStorage.setItem('multiplicationTableQuizOperations', JSON.stringify(quizOperations));
    localStorage.setItem('multiplicationTableSpeechSettings', JSON.stringify(speechSettings));
    localStorage.setItem('multiplicationTableShowVisualization', JSON.stringify(showVisualization));
  }, [titleColor, resultColor, cardBgColor, font, rowSpacing, hideAllButtonColor, showAllButtonColor, startMultiplier, endMultiplier, correctSound, incorrectSound, unlockedAchievements, totalCorrectAnswers, difficulty, numQuestions, correctAnswerColor, incorrectAnswerColor, quizCardBgColor, tableVisibility, exerciseTypes, quizOperations, speechSettings, showVisualization]);
  
  // Reset interactive states when calculation changes
  useEffect(() => {
    setDivisionStep(0);
    setClickedStars(new Set());
  }, [selectedCalculation]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  // Effect 1: Populate and manage the voice list.
  useEffect(() => {
    const populateVoiceList = () => {
        if (!window.speechSynthesis) {
            console.warn("Speech Synthesis not supported");
            return;
        }
        const allVoices = window.speechSynthesis.getVoices();
        const vnVoices = allVoices.filter(v => v.lang.includes('vi'));
        setVoices(vnVoices.length > 0 ? vnVoices : allVoices);
    };

    populateVoiceList();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = populateVoiceList;
    }
    }, []);

  // --- Function Defs ---

  const toggleFullScreen = () => {
      if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(e => console.error(e));
      } else {
          if (document.exitFullscreen) {
              document.exitFullscreen();
          }
      }
  };

  const playSound = (soundSource: string) => {
      try {
          const audio = new Audio(soundSource);
          audio.onerror = (e) => console.warn("Audio playback error", e);
          audio.play().catch(e => console.warn("Autoplay prevented or error", e));
      } catch (e) {
          console.warn("Could not init audio", e);
      }
  };

  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'correct' | 'incorrect') => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (file.size > 750000) { // 750KB limit to support some wavs
          alert("File quá lớn! Vui lòng chọn file nhỏ hơn 750KB.");
          return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
          const result = e.target?.result as string;
          if (type === 'correct') {
              setCorrectSound(result);
              setSavedCustomCorrectSound(result);
              try {
                localStorage.setItem('multiplicationTableSavedCustomCorrect', result);
              } catch (err) {
                 alert("File đã được lưu cho phiên này (do dung lượng lớn nên không lưu vĩnh viễn vào bộ nhớ trình duyệt).");
              }
          } else {
              setIncorrectSound(result);
              setSavedCustomIncorrectSound(result);
              try {
                localStorage.setItem('multiplicationTableSavedCustomIncorrect', result);
              } catch (err) {
                 alert("File đã được lưu cho phiên này (do dung lượng lớn nên không lưu vĩnh viễn vào bộ nhớ trình duyệt).");
              }
          }
      };
      reader.readAsDataURL(file);
  };

  const speakText = useCallback((text: string, tableId: string, rowIndex?: number) => {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();

      setSpeakingIdentifier(rowIndex !== undefined ? `${tableId}-row-${rowIndex}` : tableId);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      if (speechSettings.voiceURI) {
          const voice = voices.find(v => v.voiceURI === speechSettings.voiceURI);
          if (voice) utterance.voice = voice;
      }
      utterance.rate = speechSettings.rate;
      utterance.pitch = speechSettings.pitch;

      utterance.onend = () => {
          setSpeakingIdentifier(null);
      };
      
      utterance.onerror = () => {
          setSpeakingIdentifier(null);
      };

      window.speechSynthesis.speak(utterance);
  }, [speechSettings, voices]);

  const stopSpeech = useCallback(() => {
      if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
          setSpeakingIdentifier(null);
      }
  }, []);

  const handleTableVisibilityChange = (type: 'mul' | 'div', num: number) => {
      setTableVisibility(prev => {
          const newVisibility = { ...prev };
          
          if (showVisualization) {
               // If visualization is ON, enforce single table view
               // Close all others first
               multipliers.forEach(m => {
                   newVisibility.mul[m] = false;
                   newVisibility.div[m] = false;
               });
               // Open the selected one
               newVisibility[type][num] = !prev[type][num]; // Toggle current
          } else {
              // Normal toggle
              newVisibility[type][num] = !newVisibility[type][num];
          }

          if (newVisibility[type][num]) {
              // If opening a table, update visualization to match
              if (type === 'mul') {
                  // Initialize with N x 0 = 0
                  setSelectedCalculation({ type: 'mul', num1: num, num2: 0, result: 0 });
              } else {
                  // Initialize with 0 : N = 0
                  setSelectedCalculation({ type: 'div', num1: 0, num2: num, result: 0 });
              }
              // Reset mask to hide calculation details initially
              setVisualizationMask({ num1: true, num2: true, result: true });
          }

          return newVisibility;
      });
  };

  const toggleAllTables = () => {
      const hasAnyVisible = multipliers.some(m => tableVisibility.mul[m] || tableVisibility.div[m]);
      const targetState = !hasAnyVisible;

      if (targetState && showVisualization) {
          // If we are showing all, we must disable visualization as it requires single view
          setShowVisualization(false);
      }

      const newVisibility: { mul: Record<number, boolean>; div: Record<number, boolean> } = { mul: {}, div: {} };
      multipliers.forEach(m => {
          newVisibility.mul[m] = targetState;
          newVisibility.div[m] = targetState;
      });
      setTableVisibility(newVisibility);
  };

  const generateQuestions = () => {
    const newQuestions: Question[] = [];
    
    // Determine range from settings
    const validMultipliers = multipliers.filter(m => m >= startMultiplier && m <= endMultiplier);
    if (validMultipliers.length === 0) {
        alert("Phạm vi bảng đã chọn không hợp lệ.");
        return;
    }

    // Determine operations from settings
    const ops: ('mul' | 'div')[] = [];
    if (quizOperations.mul) ops.push('mul');
    if (quizOperations.div) ops.push('div');
    if (ops.length === 0) {
        alert("Vui lòng chọn ít nhất một phép tính (Nhân hoặc Chia).");
        return;
    }

    // Check consistency of start/end multiplier
    if (startMultiplier > endMultiplier) {
        alert("Bảng bắt đầu phải nhỏ hơn hoặc bằng bảng kết thúc.");
        return;
    }

    for (let i = 0; i < numQuestions; i++) {
      const typeKey = (Object.keys(exerciseTypes) as (keyof ExerciseTypes)[])
        .filter(k => exerciseTypes[k])
        [Math.floor(Math.random() * Object.keys(exerciseTypes).filter(k => exerciseTypes[k as keyof ExerciseTypes]).length)];

      const operation = ops[Math.floor(Math.random() * ops.length)];
      const num1 = validMultipliers[Math.floor(Math.random() * validMultipliers.length)];
      
      // Difficulty controls the second operand size
      let maxMultiplicand = 10;
      if (difficulty === 'easy') maxMultiplicand = 5;
      if (difficulty === 'hard') maxMultiplicand = 12;

      const num2 = Math.floor(Math.random() * maxMultiplicand) + 1;
      const result = num1 * num2;

      let question: Question;

      if (operation === 'mul') {
          // Multiplication Logic
          switch (typeKey) {
            case 'MISSING_NUMBER':
               question = { type: 'MISSING_NUMBER', display: `${num1} × ? = ${result}`, answer: num2, correctExpression: `${num1} × ${num2} = ${result}` };
               break;
            case 'COMPARISON':
               const offset = Math.floor(Math.random() * 5) - 2; 
               const compareVal = result + (offset === 0 ? 1 : offset);
               let compAns = '=';
               if (result > compareVal) compAns = '>';
               if (result < compareVal) compAns = '<';
               question = { type: 'COMPARISON', display: `${num1} × ${num2} ... ${compareVal}`, answer: compAns, correctExpression: `${num1} × ${num2} ${compAns} ${compareVal}` };
               break;
            case 'TRUE_FALSE':
               const isCorrect = Math.random() > 0.5;
               const tfVal = isCorrect ? result : result + (Math.floor(Math.random() * 5) + 1) * (Math.random() > 0.5 ? 1 : -1);
               question = { type: 'TRUE_FALSE', display: `${num1} × ${num2} = ${tfVal}`, answer: isCorrect, correctExpression: `${num1} × ${num2} = ${result}` };
               break;
            case 'FIND_OPERANDS':
                question = { type: 'FIND_OPERANDS', display: `? × ? = ${result}`, answer: result, correctExpression: `${num1} × ${num2} = ${result}` };
                break;
            case 'MULTIPLE_CHOICE':
                 const options = new Set<number>();
                 options.add(result);
                 while(options.size < 4) {
                     const distractor = result + (Math.floor(Math.random() * 10) - 5);
                     if(distractor > 0 && distractor !== result) options.add(distractor);
                 }
                 question = { type: 'MULTIPLE_CHOICE', display: `${num1} × ${num2} = ?`, answer: result, correctExpression: `${num1} × ${num2} = ${result}`, options: Array.from(options).sort(() => Math.random() - 0.5) };
                 break;
            case 'CALCULATION':
            default:
               question = { type: 'CALCULATION', display: `${num1} × ${num2} = ?`, answer: result, correctExpression: `${num1} × ${num2} = ${result}` };
          }
      } else {
          // Division Logic
           switch (typeKey) {
            case 'MISSING_NUMBER':
               question = { type: 'MISSING_NUMBER', display: `${result} : ? = ${num1}`, answer: num2, correctExpression: `${result} : ${num2} = ${num1}` };
               break;
            case 'COMPARISON':
               const offset = Math.floor(Math.random() * 3) - 1; 
               const compareVal = num2 + (offset === 0 ? 1 : offset);
               let compAns = '=';
               if (num2 > compareVal) compAns = '>';
               if (num2 < compareVal) compAns = '<';
               question = { type: 'COMPARISON', display: `${result} : ${num1} ... ${compareVal}`, answer: compAns, correctExpression: `${result} : ${num1} ${compAns} ${compareVal}` };
               break;
            case 'TRUE_FALSE':
               const isCorrect = Math.random() > 0.5;
               const tfVal = isCorrect ? num2 : num2 + (Math.floor(Math.random() * 3) + 1);
               question = { type: 'TRUE_FALSE', display: `${result} : ${num1} = ${tfVal}`, answer: isCorrect, correctExpression: `${result} : ${num1} = ${num2}` };
               break;
            case 'FIND_OPERANDS':
                // For division FIND_OPERANDS: ? : ? = quotient (num2)
                question = { type: 'FIND_OPERANDS', display: `? : ? = ${num2}`, answer: num2, correctExpression: `${result} : ${num1} = ${num2}` };
                break;
             case 'MULTIPLE_CHOICE':
                 const options = new Set<number>();
                 options.add(num2);
                 while(options.size < 4) {
                     const distractor = num2 + (Math.floor(Math.random() * 5) - 2);
                     if(distractor > 0 && distractor !== num2) options.add(distractor);
                 }
                 question = { type: 'MULTIPLE_CHOICE', display: `${result} : ${num1} = ?`, answer: num2, correctExpression: `${result} : ${num1} = ${num2}`, options: Array.from(options).sort(() => Math.random() - 0.5) };
                 break;
            case 'CALCULATION':
            default:
               question = { type: 'CALCULATION', display: `${result} : ${num1} = ?`, answer: num2, correctExpression: `${result} : ${num1} = ${num2}` };
          }
      }

      newQuestions.push(question);
    }
    setQuestions(newQuestions);
    setQuizState('active');
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setScore(0);
    setShowCorrectAnswer(false);
  };

  const handleQuizAnswer = (answer: string | number | boolean) => {
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = currentQuestion.answer === answer;

    if (isCorrect) {
      setScore(prev => prev + 1);
      playSound(correctSound);
      setTotalCorrectAnswers(prev => prev + 1);
      setCurrentStreak(prev => prev + 1);
      checkAchievements(totalCorrectAnswers + 1, currentStreak + 1, score + 1);
    } else {
      playSound(incorrectSound);
      setCurrentStreak(0);
      setShowCorrectAnswer(true); // Show correct answer on fail
      
      // Delay next question if showing error
      const newUserAnswers = [...userAnswers];
      newUserAnswers[currentQuestionIndex] = answer;
      setUserAnswers(newUserAnswers);
    }

    if (!isCorrect) {
         setTimeout(() => {
             setShowCorrectAnswer(false);
             moveToNextQuestion(answer);
         }, 2000);
    } else {
         moveToNextQuestion(answer);
    }
  };
  
  const moveToNextQuestion = (answer: string | number | boolean) => {
      const newUserAnswers = [...userAnswers];
      // Check if index exists, if not push
      if (newUserAnswers.length <= currentQuestionIndex) {
          newUserAnswers.push(answer);
      } else {
          newUserAnswers[currentQuestionIndex] = answer;
      }
      setUserAnswers(newUserAnswers);

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        // Focus input if exists
        setTimeout(() => {
            if (quizInputRef.current) {
                quizInputRef.current.value = '';
                quizInputRef.current.focus();
            }
            if (operand1Ref.current) operand1Ref.current.value = '';
            if (operand2Ref.current) operand2Ref.current.value = '';
        }, 50);
      } else {
        setQuizState('results');
      }
  }

  const handleDualInputSubmit = () => {
      const currentQuestion = questions[currentQuestionIndex];
      const val1 = parseInt(operand1Ref.current?.value || '0');
      const val2 = parseInt(operand2Ref.current?.value || '0');
      
      if (isNaN(val1) || isNaN(val2)) return;

      let isCorrect = false;
      const userString = `${val1} ${currentQuestion.display.includes(':') ? ':' : '×'} ${val2}`;

      if (currentQuestion.display.includes('×')) {
          // Check product
          if (val1 * val2 === currentQuestion.answer) isCorrect = true;
      } else {
          // Check division: val1 : val2 = answer
          if (val2 !== 0 && val1 / val2 === (currentQuestion.answer as number)) isCorrect = true;
      }
      
      if (isCorrect) {
          handleQuizAnswer(currentQuestion.answer);
      } else {
          handleQuizAnswer(userString);
      }
  }

  const checkAchievements = (total: number, streak: number, currentScore: number) => {
      const newUnlocked = new Set(unlockedAchievements);
      let justUnlocked: AchievementId | null = null;

      if (streak >= 5 && !newUnlocked.has('STREAK_5')) { newUnlocked.add('STREAK_5'); justUnlocked = 'STREAK_5'; }
      if (streak >= 10 && !newUnlocked.has('STREAK_10')) { newUnlocked.add('STREAK_10'); justUnlocked = 'STREAK_10'; }
      if (total >= 25 && !newUnlocked.has('TOTAL_CORRECT_25')) { newUnlocked.add('TOTAL_CORRECT_25'); justUnlocked = 'TOTAL_CORRECT_25'; }
      if (total >= 50 && !newUnlocked.has('TOTAL_CORRECT_50')) { newUnlocked.add('TOTAL_CORRECT_50'); justUnlocked = 'TOTAL_CORRECT_50'; }
      
      if (justUnlocked) {
          setUnlockedAchievements(newUnlocked);
          setRecentlyUnlocked(justUnlocked);
          playSound(DEFAULT_CORRECT_SOUND); // Celebration sound
          setTimeout(() => setRecentlyUnlocked(null), 3000);
      }
  };
  
  // --- Renderers ---

  const renderSettingsModal = () => {
    if (!isSettingsOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-white/50">
           <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-10">
             <h2 className="text-2xl font-bold text-gray-800">Cài Đặt</h2>
             <button onClick={() => setIsSettingsOpen(false)} className="p-2 rounded-full hover:bg-gray-100 transition">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
           </div>
           
           <div className="p-6 space-y-8">
             
             {/* Common Settings */}
             <section>
               <h3 className="text-lg font-semibold text-indigo-600 mb-3 flex items-center gap-2"><span className="text-xl">🎨</span> Giao diện</h3>
               <div className="grid grid-cols-2 gap-3">
                 {Object.entries(themes).map(([key, theme]) => (
                   <button
                     key={key}
                     onClick={() => {
                       setTitleColor(theme.colors.titleColor);
                       setResultColor(theme.colors.resultColor);
                       setCardBgColor(theme.colors.cardBgColor);
                       setFont(theme.font);
                       setHideAllButtonColor(theme.colors.hideAllButtonColor);
                       setShowAllButtonColor(theme.colors.showAllButtonColor);
                     }}
                     className={`p-3 rounded-xl border-2 transition-all text-sm font-bold shadow-[0_4px_0_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-[4px] duration-150 ease-out ${titleColor === theme.colors.titleColor ? 'border-indigo-500 bg-indigo-50' : 'border-transparent bg-gray-100 hover:bg-gray-200 hover:brightness-105'}`}
                   >
                     {theme.name}
                   </button>
                 ))}
               </div>
             </section>

             {/* Mode Specific Settings */}
             {mode === 'tables' && (
                 <section className="space-y-4">
                   <h3 className="text-lg font-semibold text-pink-600 mb-3 flex items-center gap-2"><span className="text-xl">📋</span> Tùy chọn Bảng</h3>
                   
                   {/* Table Background Color Picker */}
                   <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                      <label className="block text-sm font-medium text-gray-700 mb-3">Màu nền bảng</label>
                      <div className="grid grid-cols-3 gap-3">
                          {tableBackgroundColors.map((color) => (
                              <button
                                  key={color.value}
                                  onClick={() => setCardBgColor(color.value)}
                                  className={`
                                      h-12 rounded-xl border-2 transition-all duration-150 relative overflow-hidden group
                                      ${cardBgColor === color.value ? 'border-indigo-500 ring-2 ring-indigo-200 ring-offset-1 scale-105' : 'border-transparent hover:scale-105'}
                                      shadow-[0_4px_0_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-[4px]
                                  `}
                                  style={{ backgroundColor: color.value }}
                                  title={color.name}
                              >
                                  {cardBgColor === color.value && (
                                      <span className="absolute inset-0 flex items-center justify-center text-white drop-shadow-md">
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                          </svg>
                                      </span>
                                  )}
                              </button>
                          ))}
                      </div>
                   </div>

                   <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                     <label className="block text-sm font-medium text-gray-700 mb-2">Khoảng cách dòng</label>
                     <input 
                       type="range" min="1" max="4" step="0.5" 
                       value={rowSpacing} 
                       onChange={(e) => setRowSpacing(parseFloat(e.target.value))}
                       className="w-full accent-pink-500"
                     />
                   </div>

                   <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                     <label className="flex items-center justify-between cursor-pointer">
                       <span className="text-sm font-medium text-gray-700">Hiện Minh Họa Phép Tính</span>
                       <div className="relative">
                         <input type="checkbox" className="sr-only peer" checked={showVisualization} onChange={(e) => setShowVisualization(e.target.checked)} />
                         <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
                       </div>
                     </label>
                   </div>
                   
                   <section className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                       <h3 className="text-sm font-medium text-gray-700 mb-3">Giọng đọc (TTS)</h3>
                       <div className="space-y-3">
                           <div>
                               <label className="text-xs text-gray-500">Chọn giọng đọc</label>
                               <select 
                                   className="w-full mt-1 p-2 rounded-lg border border-gray-200 text-sm shadow-sm"
                                   value={speechSettings.voiceURI}
                                   onChange={(e) => setSpeechSettings({...speechSettings, voiceURI: e.target.value})}
                               >
                                   {voices.map(v => (
                                       <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>
                                   ))}
                               </select>
                           </div>
                           <div className="flex gap-4">
                               <div className="flex-1">
                                   <label className="text-xs text-gray-500">Tốc độ ({speechSettings.rate}x)</label>
                                   <input type="range" min="0.5" max="2" step="0.1" value={speechSettings.rate} onChange={(e) => setSpeechSettings({...speechSettings, rate: parseFloat(e.target.value)})} className="w-full accent-indigo-500 h-2 rounded-lg appearance-none bg-gray-200" />
                               </div>
                               <div className="flex-1">
                                   <label className="text-xs text-gray-500">Cao độ ({speechSettings.pitch})</label>
                                   <input type="range" min="0.5" max="2" step="0.1" value={speechSettings.pitch} onChange={(e) => setSpeechSettings({...speechSettings, pitch: parseFloat(e.target.value)})} className="w-full accent-indigo-500 h-2 rounded-lg appearance-none bg-gray-200" />
                               </div>
                           </div>
                       </div>
                   </section>
                 </section>
             )}

             {mode === 'quiz' && (
                 <div className="space-y-6 animate-fadeIn">
                    <h3 className="text-xl font-bold text-blue-700 flex items-center gap-2 pb-2 border-b border-blue-100">
                        <span>🎮</span> Tùy chọn Luyện Tập
                    </h3>

                    {/* 2. Visuals & Audio */}
                    <section className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Giao diện & Âm thanh</h4>

                        {/* Color Settings */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-bold text-gray-700 block mb-1">Màu Đúng</label>
                                <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                                    <input type="color" value={correctAnswerColor} onChange={e => setCorrectAnswerColor(e.target.value)} className="h-8 w-12 rounded cursor-pointer border-0" />
                                    <span className="text-xs font-mono text-gray-500">{correctAnswerColor}</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-gray-700 block mb-1">Màu Sai</label>
                                <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                                    <input type="color" value={incorrectAnswerColor} onChange={e => setIncorrectAnswerColor(e.target.value)} className="h-8 w-12 rounded cursor-pointer border-0" />
                                    <span className="text-xs font-mono text-gray-500">{incorrectAnswerColor}</span>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-4 space-y-4">
                            {/* Correct Sound */}
                            <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-bold text-green-700">Âm thanh: Đúng</label>
                                    <button onClick={() => playSound(correctSound)} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md font-bold hover:bg-green-200">🔊 Thử</button>
                                </div>
                                <div className="flex gap-2">
                                    <select 
                                        value={correctSound} 
                                        onChange={(e) => setCorrectSound(e.target.value)}
                                        className="flex-1 p-2 rounded-lg border border-gray-300 text-sm bg-white"
                                    >
                                        {CORRECT_SOUND_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.name}</option>)}
                                        {savedCustomCorrectSound && !CORRECT_SOUND_OPTIONS.find(o => o.value === savedCustomCorrectSound) && <option value={savedCustomCorrectSound}>♫ File của tôi</option>}
                                    </select>
                                    <label className="p-2 bg-gray-100 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200" title="Tải file lên">
                                        <span className="text-lg">📂</span>
                                        <input type="file" accept=".mp3,.wav,audio/*" onChange={(e) => handleAudioUpload(e, 'correct')} className="hidden" />
                                    </label>
                                </div>
                            </div>

                            {/* Incorrect Sound */}
                            <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-bold text-red-700">Âm thanh: Sai</label>
                                    <button onClick={() => playSound(incorrectSound)} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-md font-bold hover:bg-red-200">🔊 Thử</button>
                                </div>
                                <div className="flex gap-2">
                                    <select 
                                        value={incorrectSound} 
                                        onChange={(e) => setIncorrectSound(e.target.value)}
                                        className="flex-1 p-2 rounded-lg border border-gray-300 text-sm bg-white"
                                    >
                                        {INCORRECT_SOUND_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.name}</option>)}
                                        {savedCustomIncorrectSound && !INCORRECT_SOUND_OPTIONS.find(o => o.value === savedCustomIncorrectSound) && <option value={savedCustomIncorrectSound}>♫ File của tôi</option>}
                                    </select>
                                    <label className="p-2 bg-gray-100 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200" title="Tải file lên">
                                        <span className="text-lg">📂</span>
                                        <input type="file" accept=".mp3,.wav,audio/*" onChange={(e) => handleAudioUpload(e, 'incorrect')} className="hidden" />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </section>
                 </div>
             )}

             {mode === 'achievements' && (
                 <section>
                     <h3 className="text-lg font-semibold text-yellow-600 mb-3 flex items-center gap-2"><span className="text-xl">🏆</span> Dữ liệu</h3>
                     <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                         <p className="text-sm text-red-600 mb-3">Hành động này sẽ xóa toàn bộ thành tích, điểm số và chuỗi thắng của bạn.</p>
                         <button 
                           onClick={() => {
                               if (confirm('Bạn có chắc chắn muốn xóa toàn bộ dữ liệu thành tích không?')) {
                                   setUnlockedAchievements(new Set());
                                   setTotalCorrectAnswers(0);
                                   setCurrentStreak(0);
                                   localStorage.removeItem('multiplicationTableUnlockedAchievements');
                                   localStorage.removeItem('multiplicationTableTotalCorrect');
                               }
                           }}
                           className="w-full py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold shadow-[0_6px_0_#991b1b] active:shadow-none active:translate-y-[6px] transition-all duration-150 ease-out hover:brightness-110"
                         >
                             Đặt lại dữ liệu
                         </button>
                     </div>
                 </section>
             )}

           </div>
        </div>
      </div>
    );
  };
  
  const renderExitConfirmModal = () => {
    if (!showExitConfirm) return null;

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-sm border border-white/50 text-center">
           <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounceIn text-3xl shadow-inner">
             ⚠️
           </div>
           <h3 className="text-xl font-bold text-gray-800 mb-2">Dừng làm bài?</h3>
           <p className="text-gray-500 mb-8 text-sm leading-relaxed">Kết quả hiện tại sẽ không được lưu. Bạn có chắc chắn muốn thoát không?</p>
           
           <div className="grid grid-cols-2 gap-3">
             <button 
               onClick={() => setShowExitConfirm(false)}
               className="py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
             >
               Hủy
             </button>
             <button 
               onClick={() => {
                   setQuizState('setup');
                   setShowExitConfirm(false);
               }}
               className="py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-[0_4px_0_#991b1b] active:shadow-none active:translate-y-[4px] transition-all"
             >
               Thoát
             </button>
           </div>
        </div>
      </div>
    );
  };

  const renderQuiz = () => {
    if (quizState === 'setup') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-8 animate-fadeIn">
           <h2 className="text-2xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 drop-shadow-sm text-center">Cài Đặt Bài Luyện Tập</h2>
           
           <div className="bg-white/60 backdrop-blur-xl p-4 sm:p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/50 w-full max-w-2xl">
               
               {/* New Range Selector Section */}
               <div className="mb-8 space-y-4 border-b border-gray-200 pb-8">
                   <label className="block text-gray-700 font-bold text-base sm:text-lg">Phạm vi bảng (Từ - Đến)</label>
                   <div className="flex items-center gap-4">
                        <select 
                            value={startMultiplier}
                            onChange={(e) => setStartMultiplier(Number(e.target.value))}
                            className="flex-1 p-3 rounded-xl border border-gray-200 bg-white font-bold text-gray-700 shadow-[0_4px_0_#e5e7eb] focus:outline-none transition-all active:translate-y-[2px] active:shadow-none"
                        >
                            {multipliers.map(m => <option key={m} value={m}>Bảng {m}</option>)}
                        </select>
                        <span className="font-bold text-gray-400 text-xl">➜</span>
                        <select 
                            value={endMultiplier}
                            onChange={(e) => setEndMultiplier(Number(e.target.value))}
                            className="flex-1 p-3 rounded-xl border border-gray-200 bg-white font-bold text-gray-700 shadow-[0_4px_0_#e5e7eb] focus:outline-none transition-all active:translate-y-[2px] active:shadow-none"
                        >
                            {multipliers.filter(m => m >= startMultiplier).map(m => <option key={m} value={m}>Bảng {m}</option>)}
                        </select>
                   </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                   <div className="space-y-4">
                       <label className="block text-gray-700 font-bold text-base sm:text-lg">Độ khó</label>
                       <div className="flex gap-2">
                           {(['easy', 'medium', 'hard'] as const).map(d => (
                               <button 
                                 key={d} 
                                 onClick={() => setDifficulty(d)}
                                 className={`flex-1 py-3 rounded-xl font-bold transition-all duration-150 ease-out capitalize active:translate-y-[6px] active:shadow-none text-sm sm:text-base ${difficulty === d ? 'bg-indigo-500 text-white shadow-[0_6px_0_#3730a3] hover:brightness-110' : 'bg-white text-gray-600 shadow-[0_6px_0_#e5e7eb] hover:bg-gray-50'}`}
                               >
                                   {{easy: 'Dễ', medium: 'Vừa', hard: 'Khó'}[d]}
                               </button>
                           ))}
                       </div>
                   </div>

                   <div className="space-y-4">
                       <label className="block text-gray-700 font-bold text-base sm:text-lg">Số câu hỏi</label>
                       <div className="flex gap-2">
                           {[5, 10, 20, 30].map(n => (
                               <button 
                                 key={n} 
                                 onClick={() => setNumQuestions(n)}
                                 className={`flex-1 py-3 rounded-xl font-bold transition-all duration-150 ease-out active:translate-y-[6px] active:shadow-none text-sm sm:text-base ${numQuestions === n ? 'bg-pink-500 text-white shadow-[0_6px_0_#be185d] hover:brightness-110' : 'bg-white text-gray-600 shadow-[0_6px_0_#e5e7eb] hover:bg-gray-50'}`}
                               >
                                   {n}
                               </button>
                           ))}
                       </div>
                   </div>
               </div>
               
               <div className="mt-8 space-y-4">
                    <label className="block text-gray-700 font-bold text-base sm:text-lg">Phép tính</label>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <label className={`flex-1 cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-3 shadow-sm active:scale-95 duration-150 ${quizOperations.mul ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
                            <input type="checkbox" className="w-5 h-5 accent-blue-500" checked={quizOperations.mul} onChange={(e) => setQuizOperations({...quizOperations, mul: e.target.checked})} />
                            <span className="font-bold text-blue-700">Phép Nhân (×)</span>
                        </label>
                        <label className={`flex-1 cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-3 shadow-sm active:scale-95 duration-150 ${quizOperations.div ? 'border-pink-500 bg-pink-50' : 'border-gray-200 bg-gray-50'}`}>
                            <input type="checkbox" className="w-5 h-5 accent-pink-500" checked={quizOperations.div} onChange={(e) => setQuizOperations({...quizOperations, div: e.target.checked})} />
                            <span className="font-bold text-pink-700">Phép Chia (:)</span>
                        </label>
                    </div>
               </div>

               <div className="mt-8 space-y-4">
                   <label className="block text-gray-700 font-bold text-base sm:text-lg">Dạng bài tập</label>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       {(Object.keys(exerciseTypesConfig) as Array<keyof ExerciseTypes>).map(type => (
                           <label key={type} className={`flex items-center p-3 rounded-xl border transition-all cursor-pointer hover:bg-indigo-50 shadow-sm active:scale-95 duration-150 ${exerciseTypes[type] ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-300' : 'bg-gray-50 border-gray-200'}`}>
                               <input 
                                 type="checkbox" 
                                 checked={exerciseTypes[type]} 
                                 onChange={(e) => setExerciseTypes(prev => ({...prev, [type]: e.target.checked}))}
                                 className="w-5 h-5 accent-indigo-600 rounded mr-3"
                               />
                               <span className="text-gray-700 font-medium text-sm sm:text-base">{exerciseTypeLabels[type]}</span>
                           </label>
                       ))}
                   </div>
               </div>

               <button 
                 onClick={generateQuestions}
                 className="w-full mt-10 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-lg sm:text-xl font-extrabold rounded-2xl shadow-[0_8px_0_#15803d] active:shadow-none active:translate-y-[8px] transition-all duration-150 ease-out hover:brightness-110"
               >
                   BẮT ĐẦU LÀM BÀI
               </button>
           </div>
        </div>
      );
    }

    if (quizState === 'results') {
      const percentage = Math.round((score / questions.length) * 100);
      let message = "Cố gắng hơn nhé!";
      if (percentage >= 50) message = "Làm tốt lắm!";
      if (percentage >= 80) message = "Tuyệt vời!";
      if (percentage === 100) message = "Hoàn hảo!";

      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-popIn p-4">
          <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-10 rounded-[2.5rem] shadow-2xl text-center max-w-3xl w-full border border-white/60 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"></div>
            <div className="text-6xl mb-4">
                {percentage === 100 ? '🏆' : percentage >= 80 ? '🌟' : percentage >= 50 ? '👍' : '🌱'}
            </div>
            <h2 className="text-5xl font-black text-gray-800 mb-2">{percentage}%</h2>
            <p className="text-2xl text-indigo-600 font-bold mb-8">{message}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-8 text-lg">
                <div className="bg-green-100 p-4 rounded-2xl text-green-800 font-bold border border-green-200">
                    ✅ Đúng: {score}
                </div>
                <div className="bg-red-100 p-4 rounded-2xl text-red-800 font-bold border border-red-200">
                    ❌ Sai: {questions.length - score}
                </div>
            </div>
            
            {/* Detailed Breakdown */}
            <div className="text-left mb-8 bg-gray-50 rounded-2xl p-4 max-h-60 overflow-y-auto border border-gray-200 shadow-inner">
                <h3 className="font-bold text-gray-700 mb-3 sticky top-0 bg-gray-50 pb-2 border-b border-gray-200">Chi tiết bài làm:</h3>
                <ul className="space-y-3">
                    {questions.map((q, idx) => {
                        const userAns = userAnswers[idx];
                        // Safe guard userAns
                        const displayAnsVal = (userAns !== undefined && userAns !== null) ? userAns : '';
                        
                        const isCorrect = userAns === q.answer || (typeof userAns === 'string' && typeof q.answer === 'number' && parseInt(userAns) === q.answer); 
                        
                        let displayUserAns = displayAnsVal.toString();
                        if (displayUserAns === '') displayUserAns = '(Bỏ qua)';

                        if (q.type === 'TRUE_FALSE') displayUserAns = userAns ? 'Đúng' : 'Sai';
                        
                        return (
                            <li key={idx} className={`flex items-start gap-3 p-3 rounded-xl border ${isCorrect ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                                <span className="mt-0.5">{isCorrect ? '✅' : '❌'}</span>
                                <div>
                                    <p className="font-bold text-gray-800 text-sm sm:text-base">{q.display}</p>
                                    <div className="text-xs sm:text-sm mt-1">
                                        <span className={isCorrect ? 'text-green-700' : 'text-red-700'}>
                                            Bạn chọn: <strong>{displayUserAns}</strong>
                                        </span>
                                        {!isCorrect && (
                                            <span className="text-gray-500 ml-3">
                                                | Đáp án: <strong>{q.type === 'TRUE_FALSE' ? (q.answer ? 'Đúng' : 'Sai') : q.answer}</strong>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            </div>

            <button 
              onClick={() => setQuizState('setup')}
              className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-[0_8px_0_#3730a3] active:shadow-none active:translate-y-[8px] transition-all duration-150 ease-out text-xl hover:brightness-110"
            >
              Làm bài khác
            </button>
          </div>
        </div>
      );
    }

    const currentQuestion = questions[currentQuestionIndex];
    // Check if currentQuestion is defined to prevent crash
    if (!currentQuestion) return <div>Loading...</div>;

    const inputType = (currentQuestion.type === 'TRUE_FALSE' || currentQuestion.type === 'MULTIPLE_CHOICE' || currentQuestion.type === 'COMPARISON') ? 'button' : (currentQuestion.type === 'FIND_OPERANDS' ? 'dual' : 'text');

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-5xl mx-auto">
        <div 
            className="bg-white/90 backdrop-blur-2xl p-6 sm:p-8 md:p-12 rounded-[2.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.15)] w-full border border-white/60 relative overflow-hidden"
            style={{ backgroundColor: quizCardBgColor !== '#ffffff' ? quizCardBgColor : undefined }}
        >
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-3 bg-gray-200">
              <div 
                className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-500 ease-out"
                style={{ width: `${((currentQuestionIndex) / questions.length) * 100}%` }}
              ></div>
          </div>

          <div className="flex justify-between items-center mb-6 sm:mb-10 mt-6 relative z-10 text-gray-500 font-bold text-base sm:text-lg">
             <button 
                onClick={() => setShowExitConfirm(true)}
                className="flex items-center gap-1 sm:gap-2 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 hover:text-red-500 transition-colors text-xs sm:text-sm"
                title="Quay lại cài đặt"
             >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                 </svg>
                 <span className="hidden sm:inline">Thoát</span>
             </button>

             <span>Câu {currentQuestionIndex + 1} / {questions.length}</span>

             <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full">
                 <span>🔥</span>
                 <span>{currentStreak}</span>
             </div>
          </div>

          <div className="text-center space-y-6 sm:space-y-10">
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-gray-800 tracking-tight drop-shadow-sm animate-scaleIn break-words">
              {currentQuestion.display}
            </h2>
            
            {showCorrectAnswer && currentQuestion && (
                 <div 
                    className="animate-shake inline-block px-6 py-3 rounded-xl text-white font-bold text-lg sm:text-xl shadow-lg"
                    style={{ backgroundColor: correctAnswerColor }}
                 >
                     Đáp án đúng: {currentQuestion.answer?.toString()}
                 </div>
            )}

            <div className="flex justify-center gap-4 flex-wrap">
              {inputType === 'button' ? (
                currentQuestion.type === 'COMPARISON' ? (
                    <div className="flex justify-center gap-4 sm:gap-8 w-full">
                        {['>', '=', '<'].map((symbol) => (
                            <button
                                key={symbol}
                                onClick={() => handleQuizAnswer(symbol)}
                                className="w-20 h-20 sm:w-32 sm:h-32 text-5xl sm:text-7xl font-black bg-white text-gray-700 rounded-3xl shadow-[0_8px_0_#e5e7eb] border-2 border-gray-100 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-[0_8px_0_#c7d2fe] active:shadow-none active:translate-y-[8px] transition-all duration-150 ease-out"
                            >
                                {symbol}
                            </button>
                        ))}
                    </div>
                ) : currentQuestion.type === 'MULTIPLE_CHOICE' ? (
                    <div className="grid grid-cols-2 gap-4 w-full max-w-2xl mx-auto">
                        {currentQuestion.options?.map((opt, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleQuizAnswer(opt)}
                                className="py-4 sm:py-6 text-xl sm:text-2xl md:text-3xl font-bold bg-white text-gray-700 rounded-2xl shadow-[0_6px_0_#e5e7eb] border border-gray-100 hover:bg-indigo-50 hover:text-indigo-600 active:shadow-none active:translate-y-[6px] transition-all duration-150 ease-out hover:brightness-105"
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <button 
                            onClick={() => handleQuizAnswer(true)}
                            className="px-8 sm:px-12 py-4 sm:py-5 bg-green-500 hover:bg-green-600 text-white text-xl sm:text-2xl font-bold rounded-2xl shadow-[0_8px_0_#15803d] active:shadow-none active:translate-y-[8px] transition-all duration-150 ease-out hover:brightness-110 w-full sm:w-auto"
                            style={{ backgroundColor: correctAnswerColor, boxShadow: `0 8px 0 ${adjustBrightness(correctAnswerColor, -40)}` }}
                        >
                        Đúng
                        </button>
                        <button 
                            onClick={() => handleQuizAnswer(false)}
                            className="px-8 sm:px-12 py-4 sm:py-5 bg-red-500 hover:bg-red-600 text-white text-xl sm:text-2xl font-bold rounded-2xl shadow-[0_8px_0_#b91c1c] active:shadow-none active:translate-y-[8px] transition-all duration-150 ease-out hover:brightness-110 w-full sm:w-auto"
                            style={{ backgroundColor: incorrectAnswerColor, boxShadow: `0 8px 0 ${adjustBrightness(incorrectAnswerColor, -40)}` }}
                        >
                        Sai
                        </button>
                    </div>
                )
              ) : inputType === 'dual' ? (
                 <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
                     <input
                        ref={operand1Ref}
                        type="number"
                        className="w-24 sm:w-32 h-16 sm:h-20 text-center text-3xl sm:text-4xl font-bold border-b-4 border-gray-300 rounded-xl bg-gray-50 focus:border-indigo-500 focus:bg-white focus:outline-none shadow-inner transition-all"
                        placeholder="?"
                        autoFocus
                     />
                     <span className="text-3xl sm:text-4xl font-bold text-gray-400">{currentQuestion.display.includes(':') ? ':' : '×'}</span>
                     <input
                        ref={operand2Ref}
                        type="number"
                        className="w-24 sm:w-32 h-16 sm:h-20 text-center text-3xl sm:text-4xl font-bold border-b-4 border-gray-300 rounded-xl bg-gray-50 focus:border-indigo-500 focus:bg-white focus:outline-none shadow-inner transition-all"
                        placeholder="?"
                        onKeyDown={(e) => e.key === 'Enter' && handleDualInputSubmit()}
                     />
                     <button
                        onClick={handleDualInputSubmit}
                         className="ml-0 sm:ml-4 p-4 sm:p-5 bg-indigo-600 text-white rounded-2xl shadow-[0_6px_0_#3730a3] active:shadow-none active:translate-y-[6px] hover:bg-indigo-700 transition-all duration-150 ease-out hover:brightness-110 w-full sm:w-auto flex justify-center"
                     >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                     </button>
                 </div>
              ) : (
                <div className="relative w-full max-w-xs mx-auto">
                    <input
                    ref={quizInputRef}
                    type="number" // Use number input for mobile keypad
                    className="w-full h-20 sm:h-24 text-center text-4xl sm:text-5xl font-black border-b-4 border-gray-300 rounded-2xl bg-gray-50 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:outline-none shadow-inner transition-all"
                    placeholder="?"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                        const val = parseInt(e.currentTarget.value);
                        if (!isNaN(val)) handleQuizAnswer(val);
                        }
                    }}
                    autoFocus
                    />
                    <button 
                        onClick={() => {
                            const val = parseInt(quizInputRef.current?.value || '');
                            if(!isNaN(val)) handleQuizAnswer(val);
                        }}
                        className="absolute right-[-60px] sm:right-[-80px] top-2 bottom-2 w-14 sm:w-16 bg-indigo-600 text-white rounded-xl shadow-[0_4px_0_#3730a3] active:shadow-none active:translate-y-[4px] flex items-center justify-center hover:bg-indigo-700 transition-all duration-150 ease-out hover:brightness-110"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderVisualization = () => {
      if (!selectedCalculation) return null;
      if (!showVisualization) return null; // Only show if enabled

      const { type, num1, num2, result } = selectedCalculation;
      
      const groupCount = type === 'mul' ? num2 : result; // For Div: Result is group count
      const itemsPerGroup = type === 'mul' ? num1 : num2; // For Div: Divisor is items per group

      return (
          <div className="relative bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] p-4 sm:p-6 border-t border-l border-white/90 border-b border-r border-white/30 mb-6 overflow-hidden flex flex-col animate-slideDown h-full">
              
              {/* Header / Toolbar */}
              <div className="flex justify-between items-start mb-4 sm:mb-6">
                   <div className="flex items-center gap-4 bg-gray-100 p-2 rounded-2xl shadow-inner">
                       {/* Controls for manipulating the numbers */}
                       <div className="flex flex-col items-center">
                           <button 
                                onClick={() => {
                                    const n = type === 'mul' ? num2 + 1 : num1 + num2; 
                                    if (type === 'mul') {
                                        if (num2 < 10) setSelectedCalculation({...selectedCalculation, num2: num2 + 1, result: num1 * (num2 + 1)});
                                    } else {
                                        if (result < 10) setSelectedCalculation({...selectedCalculation, num1: num1 + num2, result: result + 1});
                                    }
                                    setVisualizationMask({ num1: true, num2: true, result: true });
                                }}
                                className="p-1 hover:bg-gray-200 rounded-lg transition active:scale-95"
                           >
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                           </button>
                           <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{type === 'mul' ? 'Lần' : 'Kết quả'}</span>
                           <button 
                                onClick={() => {
                                    if (type === 'mul') {
                                        if (num2 > 0) setSelectedCalculation({...selectedCalculation, num2: num2 - 1, result: num1 * (num2 - 1)});
                                    } else {
                                        if (result > 0) setSelectedCalculation({...selectedCalculation, num1: num1 - num2, result: result - 1});
                                    }
                                    setVisualizationMask({ num1: true, num2: true, result: true });
                                }}
                                className="p-1 hover:bg-gray-200 rounded-lg transition active:scale-95"
                           >
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                           </button>
                       </div>
                   </div>
                    
                   {/* Swap Button */}
                   {type === 'mul' && (
                        <button
                            onClick={() => {
                                setSelectedCalculation({
                                    ...selectedCalculation,
                                    num1: num2,
                                    num2: num1
                                });
                                setVisualizationMask({ num1: true, num2: true, result: true });
                            }}
                            className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-xl font-bold text-sm transition-all shadow-[0_4px_0_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-[4px]"
                        >
                            Hoán đổi
                        </button>
                   )}

                   {/* Close Button */}
                   <button 
                    onClick={() => setShowVisualization(false)}
                    className="p-2 bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 rounded-full transition-colors"
                    title="Đóng minh họa"
                   >
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                   </button>
              </div>

              {/* Calculation Display (Clickable to reveal) */}
              <div className="flex items-center justify-center gap-2 sm:gap-4 text-3xl sm:text-5xl md:text-6xl font-black text-gray-800 mb-4 sm:mb-6 select-none flex-wrap">
                  {/* Number 1 */}
                  <div 
                    className="relative cursor-pointer hover:scale-110 transition-transform"
                    onClick={() => setVisualizationMask(prev => ({...prev, num1: !prev.num1}))}
                  >
                      <span className={`transition-opacity duration-300 ${visualizationMask.num1 ? 'opacity-0' : 'opacity-100'}`}>{num1}</span>
                      <span className={`absolute inset-0 flex items-center justify-center text-gray-300 transition-opacity duration-300 ${visualizationMask.num1 ? 'opacity-100' : 'opacity-0'}`}>?</span>
                  </div>

                  {/* Operator */}
                  <span className={type === 'mul' ? 'text-blue-500' : 'text-pink-500'}>{type === 'mul' ? '×' : ':'}</span>

                  {/* Number 2 */}
                  <div 
                    className="relative cursor-pointer hover:scale-110 transition-transform"
                    onClick={() => setVisualizationMask(prev => ({...prev, num2: !prev.num2}))}
                  >
                      <span className={`transition-opacity duration-300 ${visualizationMask.num2 ? 'opacity-0' : 'opacity-100'}`}>{num2}</span>
                      <span className={`absolute inset-0 flex items-center justify-center text-gray-300 transition-opacity duration-300 ${visualizationMask.num2 ? 'opacity-100' : 'opacity-0'}`}>?</span>
                  </div>

                  <span>=</span>

                  {/* Result */}
                  <div 
                    className="relative cursor-pointer hover:scale-110 transition-transform text-indigo-600"
                    onClick={() => setVisualizationMask(prev => ({...prev, result: !prev.result}))}
                  >
                      <span className={`transition-opacity duration-300 ${visualizationMask.result ? 'opacity-0' : 'opacity-100'}`}>{result}</span>
                      <span className={`absolute inset-0 flex items-center justify-center text-gray-300 transition-opacity duration-300 ${visualizationMask.result ? 'opacity-100' : 'opacity-0'}`}>?</span>
                  </div>
              </div>

              {/* Explanation Text */}
              <div className="text-center mb-8">
                  <p className="text-base sm:text-xl text-gray-600 font-medium bg-white/50 inline-block px-4 sm:px-6 py-2 rounded-full shadow-sm">
                      {type === 'mul' 
                        ? <><span className="font-bold text-blue-600">{num1}</span> được lấy <span className="font-bold text-purple-600">{num2}</span> lần</>
                        : <><span className="font-bold text-red-600">{num1}</span> chia cho <span className="font-bold text-blue-600">{num2}</span> (Mỗi nhóm {num2} ngôi sao)</>
                      }
                  </p>
                  
                  {/* Repeated Addition Visualization for Multiplication */}
                  {type === 'mul' && (
                      <div className="mt-3 flex flex-wrap justify-center items-center gap-2 font-bold text-lg sm:text-2xl text-gray-600 animate-fadeIn">
                          {Array.from({length: num2}).map((_, index) => (
                              <React.Fragment key={index}>
                                  <span className="text-blue-600">{num1}</span>
                                  {index < num2 - 1 && <span className="text-gray-400">+</span>}
                              </React.Fragment>
                          ))}
                          <span className="text-gray-400">=</span>
                          <span className="text-indigo-600">{result}</span>
                      </div>
                  )}
              </div>

              {/* Visual Representation */}
              <div className="flex-grow flex flex-wrap justify-center gap-2 sm:gap-3 items-start content-start overflow-y-auto p-1 sm:p-2 min-h-[120px]">
                  {type === 'mul' ? (
                      // Multiplication Visualization: Groups of items
                      Array.from({ length: groupCount }).map((_, grpIdx) => (
                          <div key={grpIdx} className="relative bg-blue-50 border-2 border-blue-200 rounded-xl p-1.5 sm:p-2 min-w-[50px] sm:min-w-[70px] min-h-[50px] sm:min-h-[70px] flex flex-col items-center justify-center shadow-sm animate-popIn" style={{ animationDelay: `${grpIdx * 100}ms` }}>
                              <div className="absolute top-1 left-2 text-xs font-bold text-blue-400">{grpIdx + 1}</div>
                              <div className="flex flex-wrap gap-0.5 justify-center">
                                  {Array.from({ length: itemsPerGroup }).map((_, itmIdx) => {
                                      return (
                                        <span 
                                            key={itmIdx} 
                                            className={`
                                                text-lg sm:text-3xl select-none
                                                transition-all duration-200 ease-out
                                                hover:scale-125 hover:-rotate-12 
                                                opacity-100 scale-110 drop-shadow-[0_3px_0_#b45309] contrast-125 brightness-110 saturate-150
                                            `}
                                            style={{
                                                textShadow: '0 0 20px rgba(253, 224, 71, 0.9)',
                                            }}
                                        >
                                            ⭐
                                        </span>
                                      )
                                  })}
                              </div>
                          </div>
                      ))
                  ) : (
                      // Division Visualization: Animated Distribution (Quotitive/Measurement Model)
                      <div className="w-full flex flex-col items-center gap-4 sm:gap-6">
                           {/* Target Groups (Only render formed groups) */}
                           <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                               {Array.from({ length: divisionStep }).map((_, grpIdx) => (
                                    <div key={grpIdx} className="relative bg-indigo-50 border-2 border-indigo-200 rounded-xl p-1.5 sm:p-2 min-w-[50px] sm:min-w-[70px] min-h-[50px] sm:min-h-[70px] flex flex-col items-center justify-center shadow-sm transition-all animate-popIn">
                                        <div className="absolute top-1 left-2 text-xs font-bold text-indigo-400">{grpIdx + 1}</div>
                                        <div className="flex flex-wrap justify-center gap-0.5 pt-3 sm:pt-4">
                                            {Array.from({ length: itemsPerGroup }).map((_, i) => (
                                                <span 
                                                    key={i} 
                                                    className={`
                                                        text-lg sm:text-3xl select-none
                                                        transition-all duration-200 ease-out
                                                        hover:scale-125 hover:-rotate-12 
                                                        opacity-100 scale-110 drop-shadow-[0_3px_0_#b45309] contrast-125 brightness-110 saturate-150 animate-bounceIn
                                                    `}
                                                    style={{
                                                        textShadow: '0 0 20px rgba(253, 224, 71, 0.9)',
                                                    }}
                                                >
                                                    ⭐
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                               ))}
                           </div>

                           {divisionStep >= groupCount && groupCount > 0 && (
                               <div className="text-green-600 font-bold text-lg animate-bounce">🎉 Đã chia xong!</div>
                           )}

                           {/* Action Button (Arrow Pointing UP to groups) */}
                           {divisionStep < groupCount && (
                               <button 
                                    onClick={() => setDivisionStep(prev => prev + 1)}
                                    className="px-6 py-2 bg-pink-500 text-white font-bold rounded-xl shadow-[0_6px_0_#be185d] active:shadow-none active:translate-y-[6px] hover:bg-pink-600 transition-all duration-150 ease-out hover:brightness-110"
                               >
                                   Lấy {itemsPerGroup} ngôi sao 👆
                               </button>
                           )}
                          
                          {/* Source Pool (Moved to Bottom & Always Visible with count badge) */}
                           <div className="relative bg-red-50 border-2 border-red-200 p-2 rounded-2xl flex gap-1 flex-wrap justify-center max-w-md shadow-inner min-h-[60px] w-full transition-all">
                               <div className="absolute top-2 right-2 bg-red-100 text-red-600 px-2 py-1 rounded-lg text-xs font-bold shadow-sm border border-red-200">
                                   {num1 - (divisionStep * itemsPerGroup)}
                               </div>
                               
                               {Array.from({ length: num1 - (divisionStep * itemsPerGroup) }).map((_, i) => (
                                   <span key={i} 
                                    className={`
                                        text-xl sm:text-3xl select-none
                                        transition-all duration-200 ease-out
                                        hover:scale-125 hover:-rotate-12 
                                        opacity-100 scale-110 drop-shadow-[0_5px_0_#b45309] contrast-125 brightness-110 saturate-150 animate-pulse
                                    `}
                                    style={{
                                        textShadow: '0 0 20px rgba(253, 224, 71, 0.9)',
                                    }}
                                   >⭐</span>
                               ))}
                           </div>
                      </div>
                  )}
              </div>
          </div>
      )
  }
  
  const renderAchievements = () => (
      <div className="p-4 animate-fadeIn">
          <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-white/60">
              <div className="text-center mb-10">
                  <h2 className="text-3xl sm:text-4xl font-black text-yellow-500 drop-shadow-sm mb-2">Thành Tích Của Bạn</h2>
                  <p className="text-gray-500 text-base sm:text-lg">Hãy sưu tập tất cả các huy hiệu nhé!</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Object.entries(achievements).map(([id, ach]) => {
                      const isUnlocked = unlockedAchievements.has(id as AchievementId);
                      return (
                          <div key={id} className={`relative p-6 rounded-3xl border-2 transition-all duration-300 overflow-hidden group ${isUnlocked ? 'bg-yellow-50 border-yellow-400 shadow-[0_8px_0_#eab308] hover:-translate-y-1' : 'bg-gray-100 border-gray-200 grayscale opacity-70'}`}>
                              <div className="text-5xl sm:text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-300">{ach.icon}</div>
                              <h3 className={`font-bold text-lg sm:text-xl mb-2 ${isUnlocked ? 'text-yellow-700' : 'text-gray-500'}`}>{ach.name}</h3>
                              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{ach.description}</p>
                              {!isUnlocked && <div className="absolute inset-0 bg-gray-200/30 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold text-gray-600">Chưa đạt</div>}
                          </div>
                      )
                  })}
              </div>
          </div>
      </div>
  )

  const renderTables = () => {
      // Filter visible tables
      const activeMul = multipliers.filter(m => tableVisibility.mul[m]);
      const activeDiv = multipliers.filter(m => tableVisibility.div[m]);
      const activeCount = activeMul.length + activeDiv.length;
      const isSingleView = activeCount === 1;

      return (
        <div className={`transition-all duration-500 ${isSingleView ? 'flex justify-center items-center w-full' : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 w-full'}`}>
             {activeCount === 0 && !showVisualization && (
                 <div className="col-span-full flex flex-col items-center justify-center text-gray-400 py-20 w-full text-center px-4">
                     <div className="text-6xl mb-4">👆</div>
                     <p className="text-lg sm:text-xl font-medium">Chọn một bảng bên phải để bắt đầu học nhé!</p>
                 </div>
             )}

             {activeMul.map(m => (
               <div key={`mul-${m}`} className={isSingleView ? 'w-full animate-zoomIn' : 'animate-fadeIn'}>
                 <MultiplicationTable 
                   multiplier={m}
                   titleColor={titleColor}
                   resultColor={resultColor}
                   rowSpacing={rowSpacing}
                   cardBgColor={cardBgColor}
                   hideAllButtonColor={hideAllButtonColor}
                   showAllButtonColor={showAllButtonColor}
                   speakText={speakText}
                   stopSpeech={stopSpeech}
                   speakingIdentifier={speakingIdentifier}
                 />
               </div>
             ))}
             {activeDiv.map(d => (
               <div key={`div-${d}`} className={isSingleView ? 'w-full animate-zoomIn' : 'animate-fadeIn'}>
                 <DivisionTable
                   divisor={d}
                   titleColor="#db2777" // Hardcoded Pink as requested
                   resultColor={resultColor}
                   rowSpacing={rowSpacing}
                   cardBgColor={cardBgColor}
                   hideAllButtonColor={hideAllButtonColor}
                   showAllButtonColor={showAllButtonColor}
                   speakText={speakText}
                   stopSpeech={stopSpeech}
                   speakingIdentifier={speakingIdentifier}
                 />
               </div>
             ))}
        </div>
      )
  }

  // Calculate Active Count for main layout logic
  const activeMul = multipliers.filter(m => tableVisibility.mul[m]);
  const activeDiv = multipliers.filter(m => tableVisibility.div[m]);
  const activeCount = activeMul.length + activeDiv.length;
  const isSingleView = activeCount === 1;

  // Check if any table is visible for "Hide/Show All" toggle
  const hasAnyVisible = activeCount > 0;

  return (
    <div className={`min-h-screen font-sans text-slate-800 selection:bg-indigo-100 selection:text-indigo-700 transition-all duration-300 ${mode === 'quiz' ? 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50' : 'bg-[url("https://www.transparenttextures.com/patterns/cubes.png")] bg-fixed bg-slate-50'}`}>
      
      {/* Settings Modal */}
      {renderSettingsModal()}

      {/* Exit Confirmation Modal */}
      {renderExitConfirmModal()}

      {/* User Guide Modal */}
      {isHelpOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-white/50">
                  <div className="p-6 border-b flex justify-between items-center bg-white/50 sticky top-0 backdrop-blur-md">
                      <h2 className="text-2xl font-bold text-indigo-800">Hướng Dẫn Sử Dụng</h2>
                      <button onClick={() => setIsHelpOpen(false)} className="p-2 hover:bg-gray-200 rounded-full">✕</button>
                  </div>
                  <div className="p-8 space-y-8 text-gray-700 leading-relaxed">
                      <p className="text-lg font-medium text-center italic text-indigo-600">
                          "Ứng dụng hỗ trợ thầy cô giảng dạy và giúp các em học sinh luyện tập bảng nhân chia một cách vui vẻ, hiệu quả!"
                      </p>
                      
                      <div className="grid md:grid-cols-2 gap-8">
                          <div className="bg-blue-50 p-6 rounded-3xl">
                              <h3 className="font-bold text-xl text-blue-700 mb-3">📚 Học Bảng</h3>
                              <ul className="list-disc pl-5 space-y-2">
                                  <li>Chọn bảng số ở cột bên phải để mở.</li>
                                  <li>Bấm vào từng dòng để nghe đọc to.</li>
                                  <li>Sử dụng nút <strong>Hiện Minh Họa</strong> để xem hình ảnh trực quan về phép tính.</li>
                                  <li>Bấm vào các số ?? để tự kiểm tra trí nhớ.</li>
                              </ul>
                          </div>
                          <div className="bg-pink-50 p-6 rounded-3xl">
                              <h3 className="font-bold text-xl text-pink-700 mb-3">🎮 Luyện Tập</h3>
                              <ul className="list-disc pl-5 space-y-2">
                                  <li>Vào Cài Đặt để chọn độ khó, số lượng câu và phép tính (Nhân/Chia).</li>
                                  <li>Trả lời đúng liên tiếp để mở khóa huy hiệu.</li>
                                  <li>Bạn có thể tải lên âm thanh vui nhộn của riêng mình cho lúc trả lời đúng/sai!</li>
                              </ul>
                          </div>
                      </div>
                      <div className="bg-yellow-50 p-6 rounded-3xl">
                          <h3 className="font-bold text-xl text-yellow-700 mb-3">💡 Mẹo Nhỏ</h3>
                          <p>Sử dụng chế độ <strong>Toàn Màn Hình</strong> để tập trung tốt hơn. Bấm vào biểu tượng bánh răng ⚙️ để thay đổi màu sắc và giao diện theo sở thích của bạn.</p>
                      </div>
                  </div>
              </div>
          </div>
      )}
      
      <div className={`container mx-auto transition-all duration-500 ${isFullScreen ? 'max-w-[98%] py-2' : 'max-w-7xl py-4 sm:py-8 px-2 sm:px-4'}`}>
        
        {/* Header */}
        <header className="mb-6 sm:mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                <div className="animate-bounceIn">
                  <img 
                      src="./robiki.png?v=4" 
                      alt="Robiki Mascot" 
                      className="w-24 h-24 sm:w-32 sm:h-32 object-contain drop-shadow-2xl animate-float"
                      onError={(e) => {
                          e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/4712/4712109.png";
                      }}
                  />
                </div>
                <div className="text-center md:text-left">
                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tighter drop-shadow-sm text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-pink-600 animate-gradient-x pb-2">
                        Bảng Nhân Chia
                    </h1>
                    <p className="text-slate-500 font-medium text-xs sm:text-sm md:text-base mt-1 bg-white/60 inline-block px-4 py-1 rounded-full shadow-sm backdrop-blur-sm border border-white/50">
                       Tác giả: Nguyễn Hoàng Em - SĐT: 0933474843
                    </p>
                </div>
            </div>

            {/* Top Actions */}
            <div className="flex items-center gap-3">
                {mode === 'tables' && !showVisualization && (
                    <button 
                        onClick={() => {
                            setShowVisualization(true);
                            // Auto-open table 2 if none open
                            const hasOpen = multipliers.some(m => tableVisibility.mul[m] || tableVisibility.div[m]);
                            if (!hasOpen) handleTableVisibilityChange('mul', 2);
                        }}
                        className="hidden md:flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-2xl shadow-[0_6px_0_#be185d] active:shadow-none active:translate-y-[6px] transition-all duration-150 ease-out hover:brightness-110"
                    >
                        <span>✨</span> Hiện Minh Họa
                    </button>
                )}

                <button onClick={() => setIsHelpOpen(true)} className="p-3 bg-white text-indigo-600 rounded-2xl shadow-[0_4px_0_#e2e8f0] active:shadow-none active:translate-y-[4px] border border-gray-100 transition-all duration-150 ease-out font-bold text-xl w-12 h-12 flex items-center justify-center group hover:brightness-105" title="Hướng dẫn">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 group-hover:animate-wiggle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>
                <button onClick={() => setIsSettingsOpen(true)} className="p-3 bg-white text-gray-600 rounded-2xl shadow-[0_4px_0_#e2e8f0] active:shadow-none active:translate-y-[4px] border border-gray-100 transition-all duration-150 ease-out group hover:brightness-105" title="Cài đặt">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:rotate-90 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
                <button onClick={toggleFullScreen} className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl shadow-[0_4px_0_#c7d2fe] active:shadow-none active:translate-y-[4px] border border-indigo-200 transition-all duration-150 ease-out group hover:brightness-105" title={isFullScreen ? "Thoát toàn màn hình" : "Toàn màn hình"}>
                    {isFullScreen ? (
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:animate-wiggle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4l5 5m0 0v-3.5m0 3.5h-3.5 M20 4l-5 5m0 0v-3.5m0 3.5h3.5 M20 20l-5 -5m0 0v3.5m0 -3.5h3.5 M4 20l5 -5m0 0v3.5m0 -3.5h-3.5" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:animate-wiggle" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                    )}
                </button>
            </div>
        </header>

        {/* Mode Tabs */}
        <nav className="flex justify-center mb-6 sm:mb-8 gap-2 sm:gap-4 md:gap-8 flex-wrap">
            {[
                { id: 'tables', label: 'Học Bảng', icon: '📚', color: 'blue' },
                { id: 'quiz', label: 'Luyện Tập', icon: '🎮', color: 'indigo' },
                { id: 'achievements', label: 'Thành Tích', icon: '🏆', color: 'yellow' }
            ].map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setMode(tab.id as any)}
                    className={`
                        px-3 py-2 sm:px-6 sm:py-4 rounded-2xl font-black text-sm sm:text-lg md:text-xl flex items-center gap-2 sm:gap-3 transition-all duration-150 ease-out active:translate-y-[6px] active:shadow-none group
                        ${mode === tab.id 
                            ? `bg-white text-${tab.color}-600 border-${tab.color}-200 shadow-[0_6px_0_rgba(0,0,0,0.1)] scale-105 z-10` 
                            : 'bg-white/50 text-gray-500 shadow-sm hover:bg-white hover:shadow-md'}
                    `}
                    style={mode === tab.id ? { boxShadow: `0 6px 0 ${tab.color === 'blue' ? '#bfdbfe' : tab.color === 'indigo' ? '#c7d2fe' : '#fef08a'}` } : {}}
                >
                    <span className="text-lg sm:text-2xl group-hover:animate-wiggle">{tab.icon}</span>
                    <span className="inline">{tab.label}</span>
                </button>
            ))}
        </nav>

        {/* Main Content Grid */}
        <div className={`grid grid-cols-1 ${mode === 'tables' ? 'lg:grid-cols-[1fr_260px]' : 'lg:grid-cols-1'} gap-4 sm:gap-8 items-start ${isFullScreen ? 'min-h-[85vh]' : ''}`}>
            
            {/* Left/Center Content Panel */}
            <main className={`transition-all duration-500 bg-white/40 backdrop-blur-3xl rounded-[2rem] sm:rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/60 p-4 sm:p-6 md:p-10 relative overflow-hidden min-w-0`}>
                {/* Soft light effect */}
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-400/20 rounded-full blur-[80px]"></div>
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-400/20 rounded-full blur-[80px]"></div>

                {mode === 'tables' && (
                    <div className={`space-y-8 ${isSingleView && showVisualization ? 'flex flex-col lg:flex-row items-start gap-4 sm:gap-8 space-y-0' : ''}`}>
                        
                        {/* Table Section (Left if single view) */}
                        <div className={`${isSingleView && showVisualization ? 'w-full lg:w-1/3 lg:order-1' : 'w-full order-2'}`}>
                            {renderTables()}
                        </div>
                        
                        {/* Visualization Section (Right if single view) */}
                        {showVisualization && selectedCalculation && (
                             <div className={`${isSingleView && showVisualization ? 'w-full lg:w-2/3 lg:order-2' : 'w-full order-1'}`}>
                                {renderVisualization()}
                             </div>
                        )}
                    </div>
                )}

                {mode === 'quiz' && renderQuiz()}
                {mode === 'achievements' && renderAchievements()}
            </main>

            {/* Right Sidebar (Only visible in Tables mode) */}
            {mode === 'tables' && (
                <aside className="space-y-4 animate-slideLeft w-full">
                    
                    {/* Table Selector */}
                    <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-4 shadow-[0_10px_40px_rgba(0,0,0,0.05)] border border-white/50 sticky top-4">
                        
                        {/* Toggle All Button */}
                        <button
                            onClick={toggleAllTables}
                            className={`w-full py-2 px-4 mb-4 rounded-xl font-bold text-sm transition-all duration-150 ease-out active:translate-y-[4px] active:shadow-none shadow-[0_4px_0_rgba(0,0,0,0.1)] ${hasAnyVisible ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                        >
                            {hasAnyVisible ? 'Ẩn tất cả' : 'Hiện tất cả'}
                        </button>

                        <h3 className="font-bold text-gray-400 uppercase text-[10px] tracking-wider mb-2 pl-1">Bảng Nhân (×)</h3>
                        <div className="grid grid-cols-4 gap-2 mb-4">
                            {multipliers.map(m => (
                                <button
                                    key={`sel-mul-${m}`}
                                    onClick={() => handleTableVisibilityChange('mul', m)}
                                    className={`
                                        aspect-square rounded-lg font-bold text-base transition-all duration-150 ease-out active:translate-y-[3px] active:shadow-none group
                                        ${tableVisibility.mul[m] ? 'bg-blue-500 text-white shadow-[0_3px_0_#1e40af] hover:brightness-110' : 'bg-white text-gray-600 shadow-[0_3px_0_#e2e8f0] hover:bg-blue-50'}
                                    `}
                                >
                                    <span className="group-hover:animate-wiggle inline-block">{m}</span>
                                </button>
                            ))}
                        </div>

                        <h3 className="font-bold text-gray-400 uppercase text-[10px] tracking-wider mb-2 pl-1">Bảng Chia (:)</h3>
                        <div className="grid grid-cols-4 gap-2">
                            {multipliers.map(d => (
                                <button
                                    key={`sel-div-${d}`}
                                    onClick={() => handleTableVisibilityChange('div', d)}
                                    className={`
                                        aspect-square rounded-lg font-bold text-base transition-all duration-150 ease-out active:translate-y-[3px] active:shadow-none group
                                        ${tableVisibility.div[d] ? 'bg-pink-500 text-white shadow-[0_3px_0_#be185d] hover:brightness-110' : 'bg-white text-gray-600 shadow-[0_3px_0_#e2e8f0] hover:bg-pink-50'}
                                    `}
                                >
                                    <span className="group-hover:animate-wiggle inline-block">{d}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>
            )}

        </div>

      </div>
      
    </div>
  );
};

export default App;