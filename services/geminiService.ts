
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { QuizQuestion } from "../types";

/**
 * Tạo câu hỏi trắc nghiệm tự động
 */
export const generateQuiz = async (topic: string, difficulty: string): Promise<QuizQuestion[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Tạo bài trắc nghiệm về ${topic}, độ khó ${difficulty}. Trả về 5 câu dưới dạng JSON.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            question: { type: Type.STRING },
                            options: { type: Type.ARRAY, items: { type: Type.STRING } },
                            correctAnswer: { type: Type.STRING },
                            explanation: { type: Type.STRING },
                        },
                        required: ["question", "options", "correctAnswer", "explanation"],
                    },
                },
            },
        });
        return JSON.parse(response.text || '[]');
    } catch (error) {
        console.error("Quiz Error:", error);
        return [];
    }
};

/**
 * Gia sư AI giải đáp thắc mắc
 */
export const chatWithTutor = async (history: any[], message: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const contents = [...history, { role: 'user', parts: [{ text: message }] }];
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: contents,
            config: {
                systemInstruction: "Bạn là một gia sư toán học cho trẻ em. Hãy giải thích các phép tính nhân chia một cách vui nhộn, dễ hiểu và dùng các ví dụ thực tế như kẹo, trái cây.",
            }
        });
        return response.text || "Xin lỗi em, Thầy chưa nghĩ ra cách giải thích này. Em hỏi lại nhé!";
    } catch (error) {
        console.error("Chat Error:", error);
        return "Xin lỗi em, Thầy đang bận một chút. Em thử hỏi lại sau nhé!";
    }
};

/**
 * Phân tích hình ảnh bài toán
 */
export const analyzeMathImage = async (dataUrl: string, mimeType: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const base64Data = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        const imagePart = {
            inlineData: { mimeType: mimeType, data: base64Data },
        };
        const textPart = {
            text: "Hãy giải bài toán trong ảnh này và giải thích các bước giải cho học sinh tiểu học một cách dễ hiểu, thân thiện."
        };
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [imagePart, textPart] },
        });
        return response.text || "Thầy không đọc được bài toán này, em chụp lại rõ hơn nhé!";
    } catch (error) {
        console.error("Analyze Error:", error);
        return "Thầy không đọc được ảnh này, em chụp lại rõ hơn nhé!";
    }
};

/**
 * Chuyển văn bản thành giọng nói (TTS) cho bảng tính
 */
export const generateTableSpeech = async (text: string): Promise<string | undefined> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        // Chỉ thị trực tiếp trong prompt để tối ưu hóa Modality.AUDIO
        const prompt = `Bạn là một giáo viên tiểu học. Hãy đọc to bảng tính sau một cách chậm rãi, rõ ràng và truyền cảm: ${text}`;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' }, 
                    },
                },
            },
        });
        return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (error) {
        console.error("TTS Error:", error);
        return undefined;
    }
};
