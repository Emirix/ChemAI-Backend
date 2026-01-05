const ChatService = require('../services/chatService');
const supabase = require('../config/supabase');

class ChatController {
    async sendMessage(req, res) {
        try {
            const { message, language, history } = req.body;

            if (!message) {
                return res.status(400).json({ success: false, error: 'Message is required' });
            }

            // Get AI Response from Gemini
            const aiResult = await ChatService.getChatResponse(history || [], message, language);

            res.json({
                success: true,
                data: {
                    content: aiResult.text,
                    suggestedQuestions: aiResult.suggestedQuestions || []
                }
            });
        } catch (error) {
            console.error('Chat AI Error:', error);
            res.status(500).json({
                success: false,
                error: 'An error occurred while getting AI response'
            });
        }
    }

    async generateChatMetadata(req, res) {
        try {
            const { messages } = req.body;

            if (!messages || messages.length === 0) {
                return res.status(400).json({ success: false, error: 'Messages are required' });
            }

            // Get title and icon suggestion from Gemini
            const metadata = await ChatService.generateChatMetadata(messages);

            res.json({
                success: true,
                data: metadata
            });
        } catch (error) {
            console.error('Generate Chat Metadata Error:', error);
            res.status(500).json({
                success: false,
                error: 'An error occurred while generating chat metadata'
            });
        }
    }
}

module.exports = new ChatController();
