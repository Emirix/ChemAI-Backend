const { modelConfig } = require('../config/gemini');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class ChatService {
    constructor() {
        // Create a custom config for Chat to return plain text
        this.model = genAI.getGenerativeModel({
            ...modelConfig,
            generationConfig: {
                ...modelConfig.generationConfig,
                responseMimeType: "text/plain"
            }
        });
    }

    async getChatResponse(history, message, language = 'Turkish') {
        const systemPrompt = `You are a professional chemical expert and lab assistant. 
        Your goal is to help users with chemical reactions, safety data, materials, and experimental protocols.
        Always prioritize safety. If a combination is dangerous, warn the user explicitly.
        Provide accurate, scientific information.
        Maintain a helpful, professional, and formal tone.
        Respond in ${language}.
        
        IMPORTANT: After your main answer, suggest 2-3 relevant follow-up questions that the user might want to ask.
        Format them at the end of your response like this:
        
        ---
        **İlgili Sorular:**
        - [Question 1]
        - [Question 2]
        - [Question 3]`;

        console.log('Raw History Length1:', history ? history.length : 0);

        // 1. Clean and Validate History
        let validHistory = [];
        if (history && history.length > 0) {
            let lastRole = null;
            for (const turn of history) {
                // Validate turn structure
                if (!turn.role || !turn.parts) continue;

                // Skip if first message is not 'user'
                if (validHistory.length === 0 && turn.role !== 'user') continue;

                // Ensure alternating roles (Simple deduplication)
                if (turn.role !== lastRole) {
                    validHistory.push(turn);
                    lastRole = turn.role;
                }
            }
        }

        // CRITICAL: History passed to startChat MUST end with 'model' if we are about to send a 'user' message.
        // If the last item in history is 'user', it means the model hasn't replied to it yet (or we are re-sending).
        // Sending another user message now would cause "User, User" sequence which is invalid.
        if (validHistory.length > 0 && validHistory[validHistory.length - 1].role === 'user') {
            console.log('Fixing History: Dropping last USER message to allow new prompt.');
            validHistory.pop();
        }

        console.log('Valid History Length:', validHistory.length);

        const chat = this.model.startChat({
            history: validHistory,
            generationConfig: modelConfig.generationConfig,
        });

        // Prepend system prompt to the first message of a new chat
        const fullMessage = validHistory.length === 0
            ? `${systemPrompt}\n\nUser Question: ${message}`
            : message;

        const result = await chat.sendMessage(fullMessage);
        const response = await result.response;

        // Extract the actual text content from the response
        let text = response.text();
        console.log('AI Response:', text);

        // Parse suggested questions from the response
        const suggestedQuestions = this.extractSuggestedQuestions(text);

        // Remove the suggested questions section from the main text
        text = this.removeSuggestedQuestionsFromText(text);

        return {
            text: text,
            suggestedQuestions: suggestedQuestions
        };
    }

    removeSuggestedQuestionsFromText(text) {
        // Find and remove the "İlgili Sorular" or "Related Questions" section
        const patterns = [
            /---\s*\*\*İlgili Sorular:\*\*[\s\S]*$/i,
            /---\s*\*\*Related Questions:\*\*[\s\S]*$/i,
            /\*\*İlgili Sorular:\*\*[\s\S]*$/i,
            /\*\*Related Questions:\*\*[\s\S]*$/i,
        ];

        let cleanedText = text;
        for (const pattern of patterns) {
            cleanedText = cleanedText.replace(pattern, '').trim();
        }

        return cleanedText;
    }

    extractSuggestedQuestions(text) {
        const questions = [];
        const lines = text.split('\n');
        let inQuestionSection = false;

        for (const line of lines) {
            if (line.includes('İlgili Sorular:') || line.includes('Related Questions:')) {
                inQuestionSection = true;
                continue;
            }

            if (inQuestionSection && line.trim().startsWith('-')) {
                const question = line.trim().substring(1).trim();
                if (question && !question.startsWith('[') && !question.endsWith(']')) {
                    questions.push(question);
                }
            }
        }

        return questions.slice(0, 3); // Max 3 questions
    }

    async generateChatMetadata(messages) {
        // Create a summary of the conversation
        const conversationSummary = messages.map((msg, idx) => {
            const role = msg.role === 'user' ? 'Kullanıcı' : 'AI';
            const content = msg.parts[0]?.text || '';
            return `${role}: ${content.substring(0, 150)}${content.length > 150 ? '...' : ''}`;
        }).join('\n');

        const prompt = `Aşağıdaki kimya/laboratuvar konuşmasını analiz et ve şunları öner:

1. Kısa, açıklayıcı bir başlık (maksimum 4-5 kelime)
2. Google Material Icons'dan uygun bir icon ismi (örn: science, biotech, warning, eco, lab_profile, vial, chemistry, experiment, safety, etc.)

Konuşma:
${conversationSummary}

Yanıtını SADECE şu JSON formatında ver, başka hiçbir açıklama ekleme:
{
  "title": "Başlık buraya",
  "icon": "icon_ismi_buraya"
}`;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text().trim();

            // Try to parse JSON from the response
            // Remove markdown code blocks if present
            let jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

            const metadata = JSON.parse(jsonText);

            // Validate the response
            if (!metadata.title || !metadata.icon) {
                throw new Error('Invalid metadata format');
            }

            return {
                title: metadata.title,
                icon: metadata.icon
            };
        } catch (error) {
            console.error('Error generating chat metadata:', error);
            // Return default values if AI fails
            return {
                title: 'Kimya Konuşması',
                icon: 'science'
            };
        }
    }
}

module.exports = new ChatService();
