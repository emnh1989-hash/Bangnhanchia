

export interface User {
    name: string;
    class: string;
}

export interface QuizQuestion {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
}

export interface QuestionConfig {
    startTable: number;
    endTable: number;
    difficulty: 'easy' | 'medium' | 'hard';
    questionCount: number;
    operations: ('mul' | 'div')[];
    questionTypes: string[];
}

export interface Question {
    type: string;
    operator: string;
    valA: number;
    valB: number;
    correct: number | string | boolean;
    display?: any;
    options?: any[];
    displayAnswer?: number;
    compareVal?: number;
    questionText?: string;
}

export interface QuestionResult {
    question: Question;
    userAnswer: any;
    isCorrect: boolean;
}

export interface HistoryItem {
    date: string;
    score: number;
    questions: number;
    config: QuestionConfig;
    userName: string;
    results: QuestionResult[];
}

export interface VoiceSettings {
    speed: number;
    mode: 'ai' | 'custom';
    gender: 'female' | 'male';
    customAudios: Record<string, string>;
}

// Declare global variable for confetti
declare global {
    var confetti: any;
}
