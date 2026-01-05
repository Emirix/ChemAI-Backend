const supabase = require('../config/supabase');

class AdminController {
    async getUsers(req, res) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*');

            if (error) throw error;
            res.json(data);
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({ error: 'Kullanıcılar getirilirken hata oluştu' });
        }
    }

    async getLogs(req, res) {
        try {
            const { limit = 100, offset = 0 } = req.query;
            const { data, error } = await supabase
                .from('audit_logs')
                .select(`
                    *,
                    profiles:user_id (first_name, last_name)
                `)
                .order('created_at', { ascending: false })
                .range(offset, parseInt(offset) + parseInt(limit) - 1);

            if (error) throw error;
            res.json(data);
        } catch (error) {
            console.error('Error fetching logs:', error);
            res.status(500).json({ error: 'Loglar getirilirken hata oluştu' });
        }
    }

    async getStats(req, res) {
        try {
            const [usersCount, logsCount, chatCount] = await Promise.all([
                supabase.from('profiles').select('id', { count: 'exact', head: true }),
                supabase.from('audit_logs').select('id', { count: 'exact', head: true }),
                supabase.from('chat_messages').select('id', { count: 'exact', head: true })
            ]);

            res.json({
                totalUsers: usersCount.count,
                totalLogs: logsCount.count,
                totalChats: chatCount.count
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
            res.status(500).json({ error: 'İstatistikler getirilirken hata oluştu' });
        }
    }
}

module.exports = new AdminController();
