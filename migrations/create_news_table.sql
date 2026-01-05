-- Create news table for storing daily chemistry news
CREATE TABLE IF NOT EXISTS news (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    title_en TEXT,
    description TEXT NOT NULL,
    description_en TEXT,
    content TEXT,
    source VARCHAR(255) NOT NULL,
    source_link TEXT NOT NULL,
    image_url TEXT,
    published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    category VARCHAR(100) DEFAULT 'chemistry',
    tags TEXT[],
    
    -- For uniqueness
    UNIQUE(source_link)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_news_published_at ON news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_is_active ON news(is_active);
CREATE INDEX IF NOT EXISTS idx_news_category ON news(category);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_news_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_news_updated_at
    BEFORE UPDATE ON news
    FOR EACH ROW
    EXECUTE FUNCTION update_news_updated_at();

-- Comments
COMMENT ON TABLE news IS 'Stores daily chemistry news articles';
COMMENT ON COLUMN news.title IS 'News title in Turkish';
COMMENT ON COLUMN news.title_en IS 'News title in English (original)';
COMMENT ON COLUMN news.description IS 'News summary/description in Turkish';
COMMENT ON COLUMN news.description_en IS 'News summary/description in English (original)';
COMMENT ON COLUMN news.source_link IS 'Original source URL (unique)';
