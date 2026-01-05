const cron = require('node-cron');
const NewsService = require('../services/newsService');

class NewsScheduler {
    constructor() {
        this.task = null;
    }

    /**
     * Start the daily news fetch scheduler
     * Runs every day at 9:00 AM Turkey time (GMT+3)
     */
    start() {
        // Cron expression: "0 9 * * *" = Every day at 9:00 AM
        // For testing, you can use "*/5 * * * *" = Every 5 minutes

        this.task = cron.schedule('0 9 * * *', async () => {
            try {
                console.log('🕐 Scheduled news fetch triggered at', new Date().toISOString());
                await NewsService.dailyNewsFetch();
                console.log('✅ Scheduled news fetch completed successfully');
            } catch (error) {
                console.error('❌ Scheduled news fetch failed:', error);
            }
        }, {
            scheduled: true,
            timezone: "Europe/Istanbul"
        });

        console.log('📅 Daily news scheduler started - Will run every day at 9:00 AM Turkey time');

        // Optional: Run immediately on startup (for testing)
        // this.runImmediately();
    }

    /**
     * Stop the scheduler
     */
    stop() {
        if (this.task) {
            this.task.stop();
            console.log('⏹️  Daily news scheduler stopped');
        }
    }

    /**
     * Run the news fetch immediately (for testing)
     */
    async runImmediately() {
        try {
            console.log('▶️  Running news fetch immediately...');
            await NewsService.dailyNewsFetch();
            console.log('✅ Immediate news fetch completed');
        } catch (error) {
            console.error('❌ Immediate news fetch failed:', error);
        }
    }
}

module.exports = new NewsScheduler();
