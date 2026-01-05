const supabase = require('../config/supabase');


class CompanyController {
    /**
     * Get all companies for a user
     */
    static async getCompanies(req, res) {
        try {
            const { userId } = req.body;

            if (!userId) {
                return res.status(400).json({
                    error: 'userId is required'
                });
            }

            const { data, error } = await supabase
                .from('companies')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching companies:', error);
                return res.status(500).json({
                    error: 'Failed to fetch companies'
                });
            }

            res.json({ companies: data || [] });

        } catch (error) {
            console.error('Error in getCompanies:', error);
            res.status(500).json({
                error: 'Internal server error'
            });
        }
    }

    /**
     * Get a single company by ID
     */
    static async getCompanyById(req, res) {
        try {
            const { companyId, userId } = req.body;

            if (!companyId || !userId) {
                return res.status(400).json({
                    error: 'companyId and userId are required'
                });
            }

            const { data, error } = await supabase
                .from('companies')
                .select('*')
                .eq('id', companyId)
                .eq('user_id', userId)
                .single();

            if (error) {
                console.error('Error fetching company:', error);
                return res.status(404).json({
                    error: 'Company not found'
                });
            }

            res.json({ company: data });

        } catch (error) {
            console.error('Error in getCompanyById:', error);
            res.status(500).json({
                error: 'Internal server error'
            });
        }
    }

    /**
     * Create a new company
     */
    static async createCompany(req, res) {
        try {
            const {
                userId,
                companyName,
                address,
                city,
                postalCode,
                country,
                phone,
                emergencyPhone,
                email,
                website,
                fax,
                logoUrl,
                signatureUrl,
                isDefault
            } = req.body;

            // Validate required fields
            if (!userId || !companyName || !email) {
                return res.status(400).json({
                    error: 'userId, companyName, and email are required'
                });
            }

            // If this is set as default, unset other defaults first
            if (isDefault) {
                await supabase
                    .from('companies')
                    .update({ is_default: false })
                    .eq('user_id', userId);
            }

            const companyData = {
                user_id: userId,
                company_name: companyName,
                address: address || null,
                city: city || null,
                postal_code: postalCode || null,
                country: country || null,
                phone: phone || null,
                emergency_phone: emergencyPhone || null,
                email: email,
                website: website || null,
                fax: fax || null,
                logo_url: logoUrl || null,
                signature_url: signatureUrl || null,
                is_default: isDefault || false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('companies')
                .insert([companyData])
                .select()
                .single();

            if (error) {
                console.error('Error creating company:', error);
                return res.status(500).json({
                    error: 'Failed to create company'
                });
            }

            res.status(201).json({
                message: 'Company created successfully',
                company: data
            });

        } catch (error) {
            console.error('Error in createCompany:', error);
            res.status(500).json({
                error: 'Internal server error'
            });
        }
    }

    /**
     * Update an existing company
     */
    static async updateCompany(req, res) {
        try {
            const {
                companyId,
                userId,
                companyName,
                address,
                city,
                postalCode,
                country,
                phone,
                emergencyPhone,
                email,
                website,
                fax,
                logoUrl,
                signatureUrl,
                isDefault
            } = req.body;

            if (!companyId || !userId) {
                return res.status(400).json({
                    error: 'companyId and userId are required'
                });
            }

            // If this is set as default, unset other defaults first
            if (isDefault) {
                await supabase
                    .from('companies')
                    .update({ is_default: false })
                    .eq('user_id', userId)
                    .neq('id', companyId);
            }

            const updateData = {
                updated_at: new Date().toISOString()
            };

            if (companyName !== undefined) updateData.company_name = companyName;
            if (address !== undefined) updateData.address = address;
            if (city !== undefined) updateData.city = city;
            if (postalCode !== undefined) updateData.postal_code = postalCode;
            if (country !== undefined) updateData.country = country;
            if (phone !== undefined) updateData.phone = phone;
            if (emergencyPhone !== undefined) updateData.emergency_phone = emergencyPhone;
            if (email !== undefined) updateData.email = email;
            if (website !== undefined) updateData.website = website;
            if (fax !== undefined) updateData.fax = fax;
            if (logoUrl !== undefined) updateData.logo_url = logoUrl;
            if (signatureUrl !== undefined) updateData.signature_url = signatureUrl;
            if (isDefault !== undefined) updateData.is_default = isDefault;

            const { data, error } = await supabase
                .from('companies')
                .update(updateData)
                .eq('id', companyId)
                .eq('user_id', userId)
                .select()
                .single();

            if (error) {
                console.error('Error updating company:', error);
                return res.status(500).json({
                    error: 'Failed to update company'
                });
            }

            res.json({
                message: 'Company updated successfully',
                company: data
            });

        } catch (error) {
            console.error('Error in updateCompany:', error);
            res.status(500).json({
                error: 'Internal server error'
            });
        }
    }

    /**
     * Delete a company
     */
    static async deleteCompany(req, res) {
        try {
            const { companyId, userId } = req.body;

            if (!companyId || !userId) {
                return res.status(400).json({
                    error: 'companyId and userId are required'
                });
            }

            const { error } = await supabase
                .from('companies')
                .delete()
                .eq('id', companyId)
                .eq('user_id', userId);

            if (error) {
                console.error('Error deleting company:', error);
                return res.status(500).json({
                    error: 'Failed to delete company'
                });
            }

            res.json({
                message: 'Company deleted successfully'
            });

        } catch (error) {
            console.error('Error in deleteCompany:', error);
            res.status(500).json({
                error: 'Internal server error'
            });
        }
    }

    /**
     * Set a company as default
     */
    static async setDefaultCompany(req, res) {
        try {
            const { companyId, userId } = req.body;

            if (!companyId || !userId) {
                return res.status(400).json({
                    error: 'companyId and userId are required'
                });
            }

            // Unset all defaults first
            await supabase
                .from('companies')
                .update({ is_default: false })
                .eq('user_id', userId);

            // Set the new default
            const { data, error } = await supabase
                .from('companies')
                .update({
                    is_default: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', companyId)
                .eq('user_id', userId)
                .select()
                .single();

            if (error) {
                console.error('Error setting default company:', error);
                return res.status(500).json({
                    error: 'Failed to set default company'
                });
            }

            res.json({
                message: 'Default company set successfully',
                company: data
            });

        } catch (error) {
            console.error('Error in setDefaultCompany:', error);
            res.status(500).json({
                error: 'Internal server error'
            });
        }
    }

    /**
     * Get the default company for a user
     */
    static async getDefaultCompany(req, res) {
        try {
            const { userId } = req.body;

            if (!userId) {
                return res.status(400).json({
                    error: 'userId is required'
                });
            }

            const { data, error } = await supabase
                .from('companies')
                .select('*')
                .eq('user_id', userId)
                .eq('is_default', true)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
                console.error('Error fetching default company:', error);
                return res.status(500).json({
                    error: 'Failed to fetch default company'
                });
            }

            res.json({ company: data || null });

        } catch (error) {
            console.error('Error in getDefaultCompany:', error);
            res.status(500).json({
                error: 'Internal server error'
            });
        }
    }
}

module.exports = CompanyController;
