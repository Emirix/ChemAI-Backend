const axios = require('axios');

class TelegramService {
    constructor() {
        this.botToken = process.env.TELEGRAM_BOT_TOKEN;
        this.chatId = process.env.TELEGRAM_CHAT_ID;
        this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
    }

    /**
     * Send a message to Telegram
     * @param {string} message - The message to send
     * @param {object} options - Additional options (parse_mode, etc.)
     * @returns {Promise<object>} - Telegram API response
     */
    async sendMessage(message, options = {}) {
        if (!this.botToken || this.botToken === 'your_bot_token_here') {
            console.warn('⚠️ Telegram bot token not configured. Skipping message send.');
            return { success: false, error: 'Bot token not configured' };
        }

        if (!this.chatId || this.chatId === 'your_chat_id_here') {
            console.warn('⚠️ Telegram chat ID not configured. Skipping message send.');
            return { success: false, error: 'Chat ID not configured' };
        }

        try {
            const response = await axios.post(`${this.baseUrl}/sendMessage`, {
                chat_id: this.chatId,
                text: message,
                parse_mode: options.parse_mode || 'HTML',
                disable_web_page_preview: options.disable_web_page_preview || false,
            });

            return { success: true, data: response.data };
        } catch (error) {
            console.error('❌ Error sending Telegram message:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send feedback notification to Telegram
     * @param {object} feedback - Feedback data
     * @returns {Promise<object>}
     */
    async sendFeedback(feedback) {
        const { user_id, user_email, user_name, type, subject, message, created_at } = feedback;

        // Emoji mapping for feedback types
        const typeEmojis = {
            bug: '🐛',
            feature: '💡',
            improvement: '⚡',
            question: '❓',
            other: '💬',
        };

        const emoji = typeEmojis[type] || '📝';
        const timestamp = new Date(created_at).toLocaleString('tr-TR', {
            timeZone: 'Europe/Istanbul',
        });

        const telegramMessage = `
${emoji} <b>Yeni Geri Bildirim</b>

<b>Tip:</b> ${this.getFeedbackTypeLabel(type)}
<b>Konu:</b> ${subject}

<b>Mesaj:</b>
${message}

<b>Kullanıcı Bilgileri:</b>
👤 ${user_name}
📧 ${user_email !== 'E-posta yok' ? `<code>${user_email}</code>` : user_email}
🆔 <code>${user_id}</code>

⏰ ${timestamp}
    `.trim();

        return await this.sendMessage(telegramMessage);
    }

    /**
     * Get Turkish label for feedback type
     * @param {string} type
     * @returns {string}
     */
    getFeedbackTypeLabel(type) {
        const labels = {
            bug: 'Hata Bildirimi',
            feature: 'Özellik İsteği',
            improvement: 'İyileştirme Önerisi',
            question: 'Soru',
            other: 'Diğer',
        };
        return labels[type] || 'Bilinmiyor';
    }

    /**
     * Send system notification to Telegram
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     * @param {string} level - Notification level (info, warning, error)
     * @returns {Promise<object>}
     */
    async sendSystemNotification(title, message, level = 'info') {
        const levelEmojis = {
            info: 'ℹ️',
            warning: '⚠️',
            error: '❌',
            success: '✅',
        };

        const emoji = levelEmojis[level] || 'ℹ️';
        const timestamp = new Date().toLocaleString('tr-TR', {
            timeZone: 'Europe/Istanbul',
        });

        const telegramMessage = `
${emoji} <b>${title}</b>

${message}

⏰ ${timestamp}
    `.trim();

        return await this.sendMessage(telegramMessage);
    }

    /**
     * Test Telegram connection
     * @returns {Promise<object>}
     */
    async testConnection() {
        try {
            const response = await axios.get(`${this.baseUrl}/getMe`);
            return { success: true, bot: response.data.result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Send notification broadcast to Telegram
     * @param {object} notificationData - Notification data
     * @returns {Promise<object>}
     */
    async sendNotificationBroadcast(notificationData) {
        const { title, message, userCount, userNames } = notificationData;

        const timestamp = new Date().toLocaleString('tr-TR', {
            timeZone: 'Europe/Istanbul',
        });

        const telegramMessage = `
📢 <b>Yeni Bildirim Gönderildi</b>

<b>Başlık:</b> ${title}

<b>Mesaj:</b>
${message}

<b>Alıcı Sayısı:</b> ${userCount} kullanıcı
${userNames && userNames.length > 0 ? `\n<b>Alıcılar:</b>\n${userNames.slice(0, 10).map(name => `• ${name}`).join('\n')}${userNames.length > 10 ? `\n... ve ${userNames.length - 10} kişi daha` : ''}` : ''}

⏰ ${timestamp}
    `.trim();

        return await this.sendMessage(telegramMessage);
    }
}

module.exports = new TelegramService();
