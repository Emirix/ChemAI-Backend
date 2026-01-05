const supabase = require('../config/supabase');
const GeminiService = require('../services/geminiService');

exports.getRawMaterialDetails = async (req, res) => {
    try {
        const { productName, language } = req.body;

        if (!productName) {
            return res.status(400).json({ error: 'Product name is required' });
        }

        const lang = language || 'English';

        // 1. Check Supabase for existing data
        // We assume a table 'raw_material_details' exists with columns: id, product_name, language, data (jsonb)
        // Since we can't create it via MCP currently, we'll try to query.
        const { data: existingData, error: dbError } = await supabase
            .from('raw_material_details')
            .select('*')
            .ilike('product_name', productName) // Case insensitive match
            .eq('language', lang)
            .maybeSingle(); // Use maybeSingle to avoid error if not found

        if (existingData) {
            console.log(`Found data for ${productName} in DB.`);
            return res.json({
                success: true,
                data: existingData.data,
                cached: true
            });
        }

        // 2. If not found (or DB error which might mean table missing, but we proceed to AI), generate with AI
        console.log(`Data for ${productName} not found in DB. Generating with AI...`);
        const aiData = await GeminiService.generateProductDetails(productName, lang);

        // 3. Save to Supabase (if table exists)
        // We try to insert. If it fails (e.g. table missing), we just log it and return the data.
        try {
            await supabase
                .from('raw_material_details')
                .insert({
                    product_name: productName,
                    language: lang,
                    data: aiData
                });
            console.log(`Saved ${productName} to DB.`);
        } catch (saveError) {
            console.error("Failed to save to DB:", saveError.message);
        }

        return res.json({
            success: true,
            data: aiData,
            cached: false
        });

    } catch (error) {
        console.error("Controller Error:", error.message);
        res.status(500).json({ error: "Failed to retrieve raw material details", details: error.message });
    }
};
