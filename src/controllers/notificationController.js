const fcmService = require('../services/fcmService');
const telegramService = require('../services/telegramService');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

class NotificationController {
    /**
     * Send notification to a specific user
     */
    async sendToUser(req, res) {
        const { userId, title, body, data } = req.body;

        if (!userId || !title || !body) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        try {
            // Get user's FCM token from Supabase
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('fcm_token')
                .eq('id', userId)
                .single();

            if (error || !profile?.fcm_token) {
                return res.status(404).json({ error: 'User FCM token not found' });
            }

            const result = await fcmService.sendNotification(
                profile.fcm_token,
                title,
                body,
                data
            );

            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Send notification to a topic
     */
    async sendToTopic(req, res) {
        const { topic, title, body, data } = req.body;

        if (!topic || !title || !body) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        try {
            const result = await fcmService.sendToTopic(topic, title, body, data);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Send notification to multiple users
     */
    async sendToMultipleUsers(req, res) {
        const { userIds, title, body, data } = req.body;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ error: 'userIds must be a non-empty array' });
        }

        if (!title || !body) {
            return res.status(400).json({ error: 'Missing title or body' });
        }

        try {
            // Get FCM tokens for all selected users
            const { data: profiles, error } = await supabase
                .from('profiles')
                .select('id, fcm_token, first_name, last_name')
                .in('id', userIds);

            if (error) {
                return res.status(500).json({ error: error.message });
            }

            // Filter out users without FCM tokens
            const validProfiles = profiles.filter(p => p.fcm_token);
            const tokens = validProfiles.map(p => p.fcm_token);

            if (tokens.length === 0) {
                return res.status(404).json({ error: 'No valid FCM tokens found for selected users' });
            }

            // Send notifications
            const result = await fcmService.sendToMultipleUsers(tokens, title, body, data);

            // Send notification to Telegram
            const userNames = validProfiles.map(p => `${p.first_name || ''} ${p.last_name || ''}`.trim());
            await telegramService.sendNotificationBroadcast({
                title,
                message: body,
                userCount: validProfiles.length,
                userNames
            });

            res.json({
                ...result,
                totalUsers: userIds.length,
                validTokens: tokens.length,
                invalidTokens: userIds.length - tokens.length
            });
        } catch (error) {
            console.error('Error sending notifications:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new NotificationController();
