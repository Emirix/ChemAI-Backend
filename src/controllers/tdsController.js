const GeminiService = require('../services/geminiService');
const supabase = require('../config/supabase');

class TdsController {
    async clearCache(req, res) {
        try {
            console.log('Clearing TDS cache...');
            const { error } = await supabase
                .from('tds_cache')
                .delete()
                .neq('search_query', '__impossible_value__'); // Delete all

            if (error) throw error;

            console.log('TDS cache cleared successfully');
            res.json({
                success: true,
                message: 'TDS cache cleared successfully'
            });
        } catch (error) {
            console.error('Error clearing TDS cache:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async getTdsData(req, res) {
        try {
            const { productName, language, userId } = req.body;

            if (!productName) {
                return res.status(400).json({
                    success: false,
                    error: 'Product name is required'
                });
            }

            const searchKey = productName.trim().toLowerCase();
            const searchLang = language || 'Turkish';

            console.log(`Searching TDS cache for: ${searchKey} [${searchLang}]`);

            // 1. Check Cache
            const { data: cachedData, error: cacheError } = await supabase
                .from('tds_cache')
                .select('tds_data')
                .eq('search_query', searchKey)
                .eq('language', searchLang)
                .single();

            if (cachedData) {
                console.log(`TDS Cache HIT for: ${searchKey}`);
                return res.json({
                    success: true,
                    data: cachedData.tds_data,
                    cached: true
                });
            }

            if (cacheError && cacheError.code !== 'PGRST116') {
                console.warn("TDS Cache query error:", cacheError.message);
            }

            console.log(`TDS Cache MISS. Analyzing with Gemini: ${productName} in ${searchLang}`);

            // 2. Call AI
            const aiData = await GeminiService.generateTdsData(productName, searchLang);

            // 3. Save to Cache
            try {
                await supabase
                    .from('tds_cache')
                    .insert({
                        search_query: searchKey,
                        language: searchLang,
                        tds_data: aiData
                    });
                console.log(`Successfully cached TDS data for: ${searchKey}`);
            } catch (saveError) {
                console.error("Error saving TDS to cache:", saveError.message);
            }

            // 4. Send Notification if userId is provided
            if (userId) {
                try {
                    const FCMService = require('../services/fcmService');
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('fcm_token')
                        .eq('id', userId)
                        .single();

                    if (profile && profile.fcm_token) {
                        await FCMService.sendNotification(
                            profile.fcm_token,
                            'TDS Belgeniz Hazır 📄',
                            `${productName} için Teknik Bilgi Formu analizi tamamlandı.`,
                            { type: 'tds', product_name: productName }
                        );
                        console.log(`🔔 TDS notification sent to user ${userId}`);
                    }
                } catch (notiError) {
                    console.warn('⚠️ Error sending TDS notification:', notiError.message);
                }
            }

            res.json({
                success: true,
                data: aiData,
                cached: false
            });

        } catch (error) {
            console.error("TDS Controller Error:", error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new TdsController();
