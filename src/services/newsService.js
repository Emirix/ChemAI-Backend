const GeminiService = require('./geminiService');
const supabase = require('../config/supabase');
const Parser = require('rss-parser');

class NewsService {
    constructor() {
        this.parser = new Parser({
            customFields: {
                item: [
                    ['media:thumbnail', 'mediaThumbnail'],
                    ['media:content', 'mediaContent']
                ]
            }
        });
    }

    /**
     * Fetch latest chemistry news from RSS feeds
     * @returns {Promise<Array>} Array of news items
     */
    async fetchLatestNews() {
        try {
            console.log('Fetching chemistry news from multiple sources...');

            const sources = [
                {
                    name: 'ScienceDaily Chemistry',
                    url: 'https://www.sciencedaily.com/rss/matter_energy/chemistry.xml',
                    category: 'general_chemistry'
                },
                {
                    name: 'ScienceDaily Biochemistry',
                    url: 'https://www.sciencedaily.com/rss/matter_energy/biochemistry.xml',
                    category: 'biochemistry'
                },
                {
                    name: 'ScienceDaily Materials',
                    url: 'https://www.sciencedaily.com/rss/matter_energy/materials_science.xml',
                    category: 'materials'
                }
            ];

            const allNews = [];

            for (const source of sources) {
                try {
                    const feed = await this.parser.parseURL(source.url);
                    const items = feed.items.slice(0, 4).map(item => {
                        // Extract image from RSS feed
                        let imageUrl = null;

                        // Try media:content
                        if (item.mediaContent && item.mediaContent.$ && item.mediaContent.$.url) {
                            imageUrl = item.mediaContent.$.url;
                        }
                        // Try media:thumbnail
                        else if (item.mediaThumbnail && item.mediaThumbnail.$ && item.mediaThumbnail.$.url) {
                            imageUrl = item.mediaThumbnail.$.url;
                        }
                        // Try enclosure
                        else if (item.enclosure && item.enclosure.url) {
                            imageUrl = item.enclosure.url;
                        }

                        return {
                            ...item,
                            sourceName: source.name,
                            category: source.category,
                            extractedImage: imageUrl
                        };
                    });
                    allNews.push(...items);
                } catch (err) {
                    console.error(`Failed to fetch from ${source.name}:`, err.message);
                }
            }

            console.log(`Fetched ${allNews.length} total news items`);

            // Sort by pubDate and take top 10
            const sortedNews = allNews
                .sort((a, b) => new Date(b.pubDate || b.isoDate) - new Date(a.pubDate || a.isoDate))
                .slice(0, 10);

            return sortedNews;
        } catch (error) {
            console.error('Error fetching news:', error);
            throw error;
        }
    }

    /**
     * Translate news to multiple languages using Gemini
     * @param {Array} newsItems Raw news items
     * @param {String} targetLang Target language code
     * @returns {Promise<Array>} Translated news
     */
    async translateNewsToLanguage(newsItems, targetLang = 'tr') {
        const langNames = {
            'tr': 'Turkish',
            'en': 'English'
        };

        const langName = langNames[targetLang] || 'Turkish';

        try {
            const newsInput = newsItems.map((item, index) => `
Item ${index + 1}:
Title: ${item.title}
Summary: ${item.contentSnippet || item.content || 'No summary available'}
Link: ${item.link}
Category: ${item.category || 'chemistry'}
Date: ${item.pubDate || item.isoDate || new Date().toISOString()}
Image: ${item.extractedImage || 'none'}
      `).join('\n\n');

            const prompt = `
Role: Expert Science News Translator for ${langName} audience.

Task: Translate the following chemistry/science news articles to ${langName}.

Input News:
${newsInput}

CRITICAL JSON FORMATTING RULES:
1. Return ONLY valid JSON array - NO markdown, NO explanations
2. Replace ALL quotes (") inside strings with single quotes (')
3. Replace ALL newlines with spaces
4. Use simple ${langName} without special characters
5. Each description: 2-3 clear sentences maximum

JSON Structure:
[
  {
    "title": "${langName} Title",
    "description": "${langName} Summary (2-3 sentences)",
    "sourceLink": "Original URL",
    "source": "Source Name",
    "publishedAt": "YYYY-MM-DDTHH:mm:ssZ",
    "imageUrl": "Use provided Image URL or fallback to https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=80",
    "category": "chemistry|biochemistry|materials",
    "tags": ["tag1", "tag2"]
  }
]

Process exactly ${newsItems.length} items.
      `;

            console.log(`Translating ${newsItems.length} news items to ${langName}...`);

            const result = await GeminiService.model.generateContent(prompt);
            const response = await result.response;
            let text = response.text().trim();

            // 1. Basic Cleaning
            text = text.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();
            text = text.replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, "'");
            text = text.replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'");

            // 2. Structural Cleanup: Find the first [ and last ]
            const firstBracket = text.indexOf('[');
            const lastBracket = text.lastIndexOf(']');

            if (firstBracket === -1 || lastBracket === -1) {
                console.error(`Invalid JSON format for ${langName}. Snippet: ${text.substring(0, 100)}`);
                throw new Error('No JSON array found in response');
            }

            text = text.substring(firstBracket, lastBracket + 1);

            // 3. Robust Parsing
            let parsedData;
            try {
                parsedData = JSON.parse(text);
            } catch (e) {
                console.warn(`JSON parse failed for ${langName}, trying aggressive cleanup...`);
                try {
                    let cleaned = text.replace(/[\r\n\t]/g, ' ').replace(/\s+/g, ' ').trim();
                    cleaned = cleaned.replace(/,\s*([\}\]])/g, '$1');
                    parsedData = JSON.parse(cleaned);
                } catch (e2) {
                    console.error(`Cleanup failed for ${langName}: ${e2.message}`);
                    throw e;
                }
            }

            if (!Array.isArray(parsedData)) {
                throw new Error('Response is not an array');
            }

            const cleanString = (str) => {
                if (!str) return '';
                return str
                    .replace(/[\r\n\t]/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
            };

            return parsedData.map((item, index) => ({
                title: cleanString(item.title || `News ${index + 1}`),
                description: cleanString(item.description || 'No description'),
                sourceLink: item.sourceLink || newsItems[index]?.link || '',
                source: item.source || 'ScienceDaily',
                publishedAt: item.publishedAt || new Date().toISOString(),
                imageUrl: item.imageUrl || newsItems[index]?.extractedImage || 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=80',
                category: item.category || newsItems[index]?.category || 'chemistry',
                tags: Array.isArray(item.tags) ? item.tags : []
            }));
        } catch (error) {
            console.error(`Error translating to ${langName}:`, error.message);

            // Fallback
            return newsItems.map((item, index) => ({
                title: item.title || `News ${index + 1}`,
                description: item.contentSnippet || item.content || 'No description',
                sourceLink: item.link || '',
                source: 'ScienceDaily',
                publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
                imageUrl: item.extractedImage || 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=80',
                category: item.category || 'chemistry',
                tags: []
            }));
        }
    }

    /**
     * Translate and format news for all supported languages
     * @param {Array} newsItems Raw news items
     * @returns {Promise<Object>} Translations for all languages
     */
    async translateAndFormatNews(newsItems) {
        try {
            const translations = {};

            // Translate to Turkish
            translations['tr'] = await this.translateNewsToLanguage(newsItems, 'tr');

            // Keep English original
            translations['en'] = newsItems.map((item, index) => ({
                title: item.title || `News ${index + 1}`,
                description: item.contentSnippet || item.content || 'No description',
                sourceLink: item.link || '',
                source: 'ScienceDaily',
                publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
                imageUrl: item.extractedImage || 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=80',
                category: item.category || 'chemistry',
                tags: []
            }));

            return translations;
        } catch (error) {
            console.error('Error in translateAndFormatNews:', error);
            throw error;
        }
    }

    /**
     * Save news to database with multilingual support
     * @param {Object} translations Translations object with language keys
     * @returns {Promise<Object>} Result summary
     */
    async saveNewsToDatabase(translations) {
        try {
            const trNews = translations['tr'] || [];
            const enNews = translations['en'] || [];

            console.log(`Saving ${trNews.length} news items to database (TR & EN)...`);

            const inserted = [];
            const skipped = [];

            for (let i = 0; i < trNews.length; i++) {
                const { data, error } = await supabase
                    .from('news')
                    .upsert({
                        // Turkish (primary)
                        title: trNews[i]?.title || enNews[i]?.title,
                        description: trNews[i]?.description || enNews[i]?.description,

                        // English
                        title_en: enNews[i]?.title,
                        description_en: enNews[i]?.description,

                        // Common fields
                        source: enNews[i]?.source || 'ScienceDaily',
                        source_link: enNews[i]?.sourceLink,
                        image_url: enNews[i]?.imageUrl,
                        published_at: enNews[i]?.publishedAt,
                        category: enNews[i]?.category || 'chemistry',
                        tags: enNews[i]?.tags || [],
                        is_active: true
                    }, {
                        onConflict: 'source_link',
                        ignoreDuplicates: true
                    })
                    .select();

                if (error) {
                    console.error('Error inserting news item:', error.message);
                    skipped.push({ item: enNews[i], error: error.message });
                } else if (data && data.length > 0) {
                    inserted.push(data[0]);
                } else {
                    skipped.push({ item: enNews[i], reason: 'duplicate' });
                }
            }

            console.log(`✅ Inserted: ${inserted.length}, ⏭️  Skipped: ${skipped.length}`);

            // Send Push Notification if new news inserted
            if (inserted.length > 0) {
                try {
                    const FCMService = require('./fcmService');
                    const firstNews = inserted[0];
                    await FCMService.sendToTopic(
                        'news',
                        'Yeni Kimya Gelişmeleri! 🧪',
                        `${inserted.length} yeni haber eklendi. Sektöre dair son gelişmeleri hemen inceleyin.`,
                        {
                            type: 'news',
                            news_id: firstNews.id.toString()
                        }
                    );
                    console.log('🔔 News push notification triggered');
                } catch (pushError) {
                    console.warn('⚠️ Could not send news push notification:', pushError.message);
                }
            }

            return {
                success: true,
                inserted: inserted.length,
                skipped: skipped.length,
                total: trNews.length
            };
        } catch (error) {
            console.error('Error saving news to database:', error);
            throw error;
        }
    }

    /**
     * Get news from database
     * @param {Object} options Query options
     * @returns {Promise<Array>} News items
     */
    async getNews(options = {}) {
        try {
            const {
                limit = 20,
                offset = 0,
                category = null,
                language = 'tr'
            } = options;

            let query = supabase
                .from('news')
                .select('*')
                .eq('is_active', true)
                .order('published_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (category) {
                query = query.eq('category', category);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Language field mapping
            const langMap = {
                'tr': { title: 'title', desc: 'description' },
                'en': { title: 'title_en', desc: 'description_en' }
            };

            const fields = langMap[language] || langMap['tr'];

            // Format for frontend
            return data.map(item => ({
                id: item.id,
                title: item[fields.title] || item.title_en || item.title,
                description: item[fields.desc] || item.description_en || item.description,
                source: item.source,
                sourceLink: item.source_link,
                imageUrl: item.image_url,
                publishedAt: item.published_at,
                category: item.category,
                tags: item.tags || [],
                createdAt: item.created_at,
                contentFull: item.content_full
            }));
        } catch (error) {
            console.error('Error getting news from database:', error);
            throw error;
        }
    }

    /**
     * Daily news fetch job - to be called by scheduler
     */
    async dailyNewsFetch() {
        try {
            console.log('🔄 Starting daily news fetch job...');

            // 1. Fetch latest news from RSS
            const rawNews = await this.fetchLatestNews();

            if (rawNews.length === 0) {
                console.log('⚠️  No news items fetched');
                return { success: false, message: 'No news items fetched' };
            }

            // 2. Translate and format
            const formattedNews = await this.translateAndFormatNews(rawNews);

            // 3. Save to database
            const result = await this.saveNewsToDatabase(formattedNews);

            console.log('✅ Daily news fetch completed:', result);
            return result;
        } catch (error) {
            console.error('❌ Daily news fetch failed:', error);
            throw error;
        }
    }
}

module.exports = new NewsService();
