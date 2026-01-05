const supabase = require('../config/supabase');

const isAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Yetkisiz erişim' });
        }

        const token = authHeader.split(' ')[1];
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Geçersiz token' });
        }

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        if (profileError || !profile?.is_admin) {
            return res.status(403).json({ error: 'Yönetici yetkisi gerekli' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Admin check error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
};

module.exports = { isAdmin };
