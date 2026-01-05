const GeminiService = require('./src/services/geminiService');
const Parser = require('rss-parser');
require('dotenv').config();

const parser = new Parser();

async function testNews() {
    try {
        console.log('Fetching chemistry news from RSS...');
        const feed = await parser.parseURL('https://www.sciencedaily.com/rss/matter_energy/chemistry.xml');

        console.log(`Fetched ${feed.items.length} items. Taking top 3 for test...`);

        const newsItems = feed.items.slice(0, 3);

        console.log('Sending to GeminiService...');
        const processedNews = await GeminiService.translateAndFormatNews(newsItems);

        console.log('Result:');
        console.log(JSON.stringify(processedNews, null, 2));

    } catch (error) {
        console.error('Test Error:', error);
    }
}

testNews();
