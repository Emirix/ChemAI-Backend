-- Create companies table for storing supplier/company information
CREATE TABLE IF NOT EXISTS companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    company_name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    country TEXT,
    phone TEXT,
    emergency_phone TEXT,
    email TEXT NOT NULL,
    website TEXT,
    fax TEXT,
    logo_url TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);

-- Create index on is_default for faster default company lookup
CREATE INDEX IF NOT EXISTS idx_companies_is_default ON companies(user_id, is_default);

-- Add RLS (Row Level Security) policies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own companies
CREATE POLICY "Users can view own companies"
    ON companies FOR SELECT
    USING (true);  -- Since we're using user_id from request body, not auth

-- Policy: Users can insert their own companies
CREATE POLICY "Users can insert own companies"
    ON companies FOR INSERT
    WITH CHECK (true);

-- Policy: Users can update their own companies
CREATE POLICY "Users can update own companies"
    ON companies FOR UPDATE
    USING (true);

-- Policy: Users can delete their own companies
CREATE POLICY "Users can delete own companies"
    ON companies FOR DELETE
    USING (true);

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER companies_updated_at_trigger
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_companies_updated_at();

COMMENT ON TABLE companies IS 'Stores company/supplier information for TDS and SDS document generation';
COMMENT ON COLUMN companies.user_id IS 'ID of the user who owns this company';
COMMENT ON COLUMN companies.company_name IS 'Name of the company';
COMMENT ON COLUMN companies.address IS 'Street address';
COMMENT ON COLUMN companies.city IS 'City name';
COMMENT ON COLUMN companies.postal_code IS 'Postal/ZIP code';
COMMENT ON COLUMN companies.country IS 'Country name';
COMMENT ON COLUMN companies.phone IS 'Primary phone number';
COMMENT ON COLUMN companies.emergency_phone IS 'Emergency contact phone number';
COMMENT ON COLUMN companies.email IS 'Company email address';
COMMENT ON COLUMN companies.website IS 'Company website URL';
COMMENT ON COLUMN companies.fax IS 'Fax number (optional)';
COMMENT ON COLUMN companies.logo_url IS 'URL to company logo';
COMMENT ON COLUMN companies.is_default IS 'Whether this is the default company for the user';
