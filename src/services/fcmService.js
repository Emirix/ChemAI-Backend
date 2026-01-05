const admin = require('firebase-admin');
const path = require('path');

class FCMService {
    constructor() {
        this.initialized = false;
        this.init();
    }

    init() {
        // Try Environment Variables first
        try {
            const projectId = process.env.FIREBASE_PROJECT_ID;
            const privateKey = process.env.FIREBASE_PRIVATE_KEY;
            const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

            if (projectId && privateKey && clientEmail) {
                try {
                    admin.initializeApp({
                        credential: admin.credential.cert({
                            projectId: projectId,
                            privateKey: privateKey.replace(/\\n/g, '\n'),
                            clientEmail: clientEmail,
                        })
                    });
                    this.initialized = true;
                    console.log('✅ Firebase Admin initialized from environment variables');
                    return;
                } catch (envError) {
                    console.warn('⚠️ Failed to initialize Firebase from env vars:', envError.message);
                    // Continue to fallback
                }
            }
        } catch (e) {
            // Ignore env reading errors
        }

        // Fallback to service account file
        try {
            const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');
            if (require('fs').existsSync(serviceAccountPath)) {
                // If already initialized (e.g. partial success?), skip. 
                // But admin.apps.length check is better.
                if (admin.apps.length === 0) {
                    admin.initializeApp({
                        credential: admin.credential.cert(require(serviceAccountPath))
                    });
                    this.initialized = true;
                    console.log('✅ Firebase Admin initialized from service account file');
                }
            } else {
                console.warn('⚠️ Firebase configuration not found. FCM Service disabled.');
            }
        } catch (fileError) {
            console.error('❌ Error initializing Firebase from file:', fileError.message);
        }
    }

    /**
     * Send a notification to a specific user
     * @param {string} token - FCM token of the user
     * @param {string} title - Notification title
     * @param {string} body - Notification body
     * @param {object} data - Optional data payload
     */
    async sendNotification(token, title, body, data = {}) {
        if (!this.initialized) {
            console.error('❌ FCM Service not initialized');
            return { success: false, error: 'FCM Service not initialized' };
        }

        const message = {
            notification: {
                title: title,
                body: body,
            },
            data: data,
            token: token,
        };

        try {
            const response = await admin.messaging().send(message);
            return { success: true, messageId: response };
        } catch (error) {
            console.error('❌ Error sending FCM message:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send notification to a topic
     * @param {string} topic - Topic name
     * @param {string} title - Notification title
     * @param {string} body - Notification body
     */
    async sendToTopic(topic, title, body, data = {}) {
        if (!this.initialized) return;

        const message = {
            notification: { title, body },
            data,
            topic: topic
        };

        try {
            await admin.messaging().send(message);
            return { success: true };
        } catch (error) {
            console.error(`❌ Error sending to topic ${topic}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send notification to multiple users
     * @param {Array<string>} tokens - Array of FCM tokens
     * @param {string} title - Notification title
     * @param {string} body - Notification body
     * @param {object} data - Optional data payload
     */
    async sendToMultipleUsers(tokens, title, body, data = {}) {
        if (!this.initialized) {
            console.error('❌ FCM Service not initialized');
            return { success: false, error: 'FCM Service not initialized' };
        }

        if (!tokens || tokens.length === 0) {
            return { success: false, error: 'No tokens provided' };
        }

        const message = {
            notification: {
                title: title,
                body: body,
            },
            data: data,
        };

        try {
            // Firebase allows sending to max 500 tokens at once
            const batchSize = 500;
            const results = {
                success: true,
                successCount: 0,
                failureCount: 0,
                errors: []
            };

            for (let i = 0; i < tokens.length; i += batchSize) {
                const batch = tokens.slice(i, i + batchSize);

                try {
                    const response = await admin.messaging().sendEachForMulticast({
                        ...message,
                        tokens: batch
                    });

                    results.successCount += response.successCount;
                    results.failureCount += response.failureCount;

                    // Collect errors
                    response.responses.forEach((resp, idx) => {
                        if (!resp.success) {
                            results.errors.push({
                                token: batch[idx],
                                error: resp.error?.message || 'Unknown error'
                            });
                        }
                    });
                } catch (error) {
                    console.error('❌ Error sending batch:', error.message);
                    results.failureCount += batch.length;
                    results.errors.push({
                        batch: i / batchSize,
                        error: error.message
                    });
                }
            }

            console.log(`📊 Notification sent: ${results.successCount} success, ${results.failureCount} failures`);
            return results;
        } catch (error) {
            console.error('❌ Error sending FCM messages:', error.message);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new FCMService();
