const { createClient } = require('@supabase/supabase-js');
const telegramService = require('../services/telegramService');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

/**
 * Submit user feedback
 */
async function submitFeedback(req, res) {
    try {
        const { user_id, type, subject, message } = req.body;

        // Validation
        if (!user_id || !type || !subject || !message) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: user_id, type, subject, message',
            });
        }

        // Validate feedback type
        const validTypes = ['bug', 'feature', 'improvement', 'question', 'other'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                error: `Invalid feedback type. Must be one of: ${validTypes.join(', ')}`,
            });
        }

        // Get user profile for additional info
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('email, first_name, last_name')
            .eq('id', user_id)
            .single();

        if (profileError) {
            console.error('Error fetching user profile:', profileError);
        }

        // Insert feedback into database
        const { data: feedback, error: insertError } = await supabase
            .from('feedback')
            .insert([
                {
                    user_id,
                    email: profile?.email,
                    type,
                    subject,
                    message,
                    status: 'pending',
                },
            ])
            .select()
            .single();

        if (insertError) {
            console.error('Error inserting feedback:', insertError);
            return res.status(500).json({
                success: false,
                error: 'Failed to save feedback',
            });
        }

        // Prepare feedback data for Telegram
        const fullName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : null;

        const feedbackData = {
            ...feedback,
            user_email: profile?.email || 'E-posta yok',
            user_name: fullName || 'İsim belirtilmemiş',
        };

        // Send to Telegram (non-blocking)
        telegramService.sendFeedback(feedbackData).catch((error) => {
            console.error('Error sending feedback to Telegram:', error);
        });

        return res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            data: feedback,
        });
    } catch (error) {
        console.error('Error in submitFeedback:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
}

/**
 * Get user's feedback history
 */
async function getUserFeedback(req, res) {
    try {
        const { user_id } = req.params;
        const { limit = 20, offset = 0 } = req.query;

        const { data: feedbacks, error } = await supabase
            .from('feedback')
            .select('*')
            .eq('user_id', user_id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching feedback:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch feedback',
            });
        }

        return res.status(200).json({
            success: true,
            data: feedbacks,
        });
    } catch (error) {
        console.error('Error in getUserFeedback:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
}

/**
 * Get all feedback (admin only)
 */
async function getAllFeedback(req, res) {
    try {
        const { status, type, limit = 50, offset = 0 } = req.query;

        let query = supabase
            .from('feedback')
            .select('*, profiles(email, first_name, last_name)')
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        if (type) {
            query = query.eq('type', type);
        }

        const { data: feedbacks, error } = await query.range(
            offset,
            offset + limit - 1
        );

        if (error) {
            console.error('Error fetching all feedback:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch feedback',
            });
        }

        return res.status(200).json({
            success: true,
            data: feedbacks,
        });
    } catch (error) {
        console.error('Error in getAllFeedback:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
}

/**
 * Update feedback status (admin only)
 */
async function updateFeedbackStatus(req, res) {
    try {
        const { id } = req.params;
        const { status, admin_notes } = req.body;

        const validStatuses = ['pending', 'in_progress', 'resolved', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
            });
        }

        const updateData = { status };
        if (admin_notes) {
            updateData.admin_notes = admin_notes;
        }

        const { data: feedback, error } = await supabase
            .from('feedback')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating feedback:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to update feedback',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Feedback updated successfully',
            data: feedback,
        });
    } catch (error) {
        console.error('Error in updateFeedbackStatus:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
}

/**
 * Test Telegram connection
 */
async function testTelegram(req, res) {
    try {
        const result = await telegramService.testConnection();

        if (result.success) {
            return res.status(200).json({
                success: true,
                message: 'Telegram connection successful',
                bot: result.bot,
            });
        } else {
            return res.status(500).json({
                success: false,
                error: result.error,
            });
        }
    } catch (error) {
        console.error('Error testing Telegram:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
}

module.exports = {
    submitFeedback,
    getUserFeedback,
    getAllFeedback,
    updateFeedbackStatus,
    testTelegram,
};
