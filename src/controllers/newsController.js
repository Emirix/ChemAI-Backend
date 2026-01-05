const NewsService = require('../services/newsService');

/**
 * Get news from database
 */
const getNews = async (req, res) => {
    try {
        const { limit, offset, category, language } = req.query;

        const options = {
            limit: parseInt(limit) || 20,
            offset: parseInt(offset) || 0,
            category: category || null,
            language: language || 'tr'
        };

        console.log('Fetching news with options:', options);

        const news = await NewsService.getNews(options);

        res.json({
            success: true,
            data: news,
            count: news.length
        });
    } catch (error) {
        console.error('Error in getNews controller:', error);
        res.status(500).json({
            success: false,
            error: 'Haberler getirilirken bir hata oluştu.',
            message: error.message
        });
    }
};

/**
 * Manually trigger daily news fetch (admin/debug endpoint)
 */
const fetchDailyNews = async (req, res) => {
    try {
        console.log('Manual daily news fetch triggered');

        const result = await NewsService.dailyNewsFetch();

        res.json({
            success: true,
            message: 'Günlük haber çekme işlemi tamamlandı',
            data: result
        });
    } catch (error) {
        console.error('Error in fetchDailyNews controller:', error);
        res.status(500).json({
            success: false,
            error: 'Günlük haber çekme işlemi başarısız oldu.',
            message: error.message
        });
    }
};

/**
 * Get news categories
 */
const getCategories = async (req, res) => {
    try {
        const categories = [
            { id: 'general_chemistry', name: 'Genel Kimya', nameEn: 'General Chemistry' },
            { id: 'biochemistry', name: 'Biyokimya', nameEn: 'Biochemistry' },
            { id: 'materials', name: 'Malzeme Bilimi', nameEn: 'Materials Science' },
            { id: 'organic_chemistry', name: 'Organik Kimya', nameEn: 'Organic Chemistry' }
        ];

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Error in getCategories controller:', error);
        res.status(500).json({
            success: false,
            error: 'Kategoriler getirilirken bir hata oluştu.',
            message: error.message
        });
    }
};

module.exports = {
    getNews,
    fetchDailyNews,
    getCategories
};
