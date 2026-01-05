// Temporary script to clear TDS cache after model update
const supabase = require('./src/config/supabase');

async function clearTdsCache() {
    try {
        console.log('🗑️  Clearing TDS cache...');

        const { error } = await supabase
            .from('tds_cache')
            .delete()
            .neq('search_query', '__impossible_value__'); // Delete all rows

        if (error) {
            console.error('❌ Error:', error);
            throw error;
        }

        console.log('✅ TDS cache cleared successfully!');
        console.log('📝 All new TDS requests will use updated model with regulatory compliance.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to clear cache:', error.message);
        process.exit(1);
    }
}

clearTdsCache();
