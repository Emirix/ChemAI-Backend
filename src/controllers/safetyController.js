const GeminiService = require('../services/geminiService');
const supabase = require('../config/supabase');

class SafetyController {
    async getSafetyData(req, res) {
        console.log('GeminiService import:', GeminiService);
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

            console.log(`Searching cache for: ${searchKey} [${searchLang}]`);

            // 1. Check Cache
            const { data: cachedData, error: cacheError } = await supabase
                .from('chemical_safety_cache')
                .select('chemical_data')
                .eq('search_query', searchKey)
                .eq('language', searchLang)
                .single();

            if (cachedData) {
                console.log(`Cache HIT for: ${searchKey}`);
                return res.json({
                    success: true,
                    data: cachedData.chemical_data,
                    cached: true
                });
            }

            if (cacheError && cacheError.code !== 'PGRST116') { // PGRST116 is "no rows found"
                console.warn("Cache query error:", cacheError.message);
            }

            console.log(`Cache MISS. Analyzing with Gemini: ${productName} in ${searchLang}`);

            // 2. Call AI
            const aiData = await GeminiService.generateSafetyData(productName, searchLang);

            // 3. Save to Cache (Fire and forget or wait depends on preference, let's wait to ensure it's saved)
            try {
                await supabase
                    .from('chemical_safety_cache')
                    .insert({
                        search_query: searchKey,
                        language: searchLang,
                        chemical_data: aiData
                    });
                console.log(`Successfully cached data for: ${searchKey}`);
            } catch (saveError) {
                console.error("Error saving to cache:", saveError.message);
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
                            'SDS Belgeniz Hazır ✅',
                            `${productName} için talep ettiğiniz Güvenlik Bilgi Formu AI tarafından oluşturuldu.`,
                            { type: 'sds', product_name: productName }
                        );
                        console.log(`🔔 SDS notification sent to user ${userId}`);
                    }
                } catch (notiError) {
                    console.warn('⚠️ Error sending SDS notification:', notiError.message);
                }
            }

            res.json({
                success: true,
                data: aiData,
                cached: false
            });

        } catch (error) {
            console.error("Controller Error:", error);
            if (!GeminiService) {
                console.error("CRITICAL: GeminiService is undefined!");
            }
            res.status(500).json({
                success: false,
                error: error.message || 'Internal Server Error'
            });
        }
    }
}

module.exports = new SafetyController();
