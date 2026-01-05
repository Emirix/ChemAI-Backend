const supabase = require('../config/supabase');

class SupplierController {
    async searchSuppliers(req, res) {
        try {
            const { query } = req.body;

            if (!query) {
                return res.json({
                    success: true,
                    data: []
                });
            }

            console.log(`Searching suppliers for product: ${query}`);

            console.log(`Searching suppliers for product via RPC: ${query}`);

            const { data, error } = await supabase.rpc('search_suppliers', {
                p_query: query
            });

            if (error) {
                console.error("RPC Search Error:", error);
                throw error;
            }

            console.log(`RPC returned ${data?.length || 0} results`);

            if (!data || data.length === 0) {
                return res.json({
                    success: true,
                    data: []
                });
            }

            // Group by supplier to match previous structure
            // The RPC returns flattened rows (one row per match), so a supplier might appear multiple times
            // We need to aggregate the products for each supplier

            const suppliersMap = new Map();

            data.forEach(row => {
                if (!suppliersMap.has(row.tid)) {
                    suppliersMap.set(row.tid, {
                        tedarikci_id: row.tedarikci_id,
                        tid: row.tid,
                        firma_adi: row.firma_adi,
                        il: row.il,
                        adres: row.adres,
                        web: row.web,
                        matched_products: []
                    });
                }
                // Add product to the list if not already there
                const supplier = suppliersMap.get(row.tid);
                if (!supplier.matched_products.includes(row.matched_product)) {
                    supplier.matched_products.push(row.matched_product);
                }
            });

            const results = Array.from(suppliersMap.values());

            res.json({
                success: true,
                data: results
            });

        } catch (error) {
            console.error("Supplier Search Error:", error);
            res.status(500).json({
                success: false,
                error: error.message || 'Internal Server Error'
            });
        }
    }

    async getSupplierDetails(req, res) {
        try {
            const { tid } = req.params;

            if (!tid) {
                return res.status(400).json({
                    success: false,
                    error: 'Supplier ID (tid) is required'
                });
            }

            const tidInt = parseInt(tid, 10);
            console.log(`Fetching details for supplier tid: ${tidInt}`);

            // Get supplier basic info
            const { data: supplierData, error: supplierError } = await supabase
                .from('tedarikciler')
                .select('*')
                .eq('tid', tidInt)
                .single();

            if (supplierError) {
                console.error("Supplier fetch error:", supplierError);
                throw supplierError;
            }

            if (!supplierData) {
                return res.status(404).json({
                    success: false,
                    error: 'Supplier not found'
                });
            }

            // Get contact persons (yetkililer) for this supplier
            const { data: contactsData, error: contactsError } = await supabase
                .from('yetkililer')
                .select('*')
                .eq('to_cari', tidInt);

            if (contactsError) {
                console.error("Contacts fetch error:", contactsError);
                // Don't fail if contacts not found, just log it
                console.log("No contacts found or error fetching contacts");
            }

            // Get all products for this supplier
            console.log(`Fetching products for tid: ${tidInt}`);

            // Try fetching by to_tid first
            let { data: productsData, error: productsError } = await supabase
                .from('tedarikciler_urunler')
                .select('urun_adi')
                .eq('to_tid', tidInt)
                .order('urun_adi', { ascending: true });

            // If no data or error, attempt with to_cari (aligning with yetkililer check)
            if ((!productsData || productsData.length === 0) && !productsError) {
                console.log(`No products found with to_tid, trying to_cari for tid: ${tidInt}`);
                const { data: altProductsData, error: altProductsError } = await supabase
                    .from('tedarikciler_urunler')
                    .select('urun_adi')
                    .eq('to_cari', tidInt)
                    .order('urun_adi', { ascending: true });

                if (!altProductsError && altProductsData && altProductsData.length > 0) {
                    productsData = altProductsData;
                    console.log(`Found ${productsData.length} products using to_cari`);
                }
            }

            if (productsError) {
                console.error("Products fetch error:", productsError);
            }

            // Extract unique product names and sort alphabetically
            const uniqueProducts = productsData
                ? [...new Set(productsData.map(p => p.urun_adi).filter(Boolean))].sort()
                : [];

            console.log(`Found ${uniqueProducts.length} unique products for tid ${tidInt}`);
            console.log(`First few unique products:`, uniqueProducts.slice(0, 5));

            // Combine data
            const result = {
                ...supplierData,
                contacts: (contactsData && contactsData.length > 0) ? [contactsData[0]] : [],
                all_products: uniqueProducts
            };

            res.json({
                success: true,
                data: result
            });

        } catch (error) {
            console.error("Supplier Details Error:", error);
            res.status(500).json({
                success: false,
                error: error.message || 'Internal Server Error'
            });
        }
    }
}

module.exports = new SupplierController();
