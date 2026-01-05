require('dotenv').config();
const fcmService = require('./src/services/fcmService');

/**
 * Bu betik Firebase Push Notification sistemini test etmek için kullanılır.
 * Kullanımı: node send-test-notification.js <FCM_TOKEN_BURAYA>
 */

async function sendTest() {
    const token = process.argv[2];

    if (!token) {
        console.log('\n❌ Hata: FCM Token belirtilmedi!');
        console.log('Kullanım: node send-test-notification.js <FCM_TOKEN>\n');
        console.log('İpucu: Uygulamayı çalıştırdığınızda terminalde/loglarda FCM Token görünecektir.\n');
        process.exit(1);
    }

    console.log('🚀 Test bildirimi gönderiliyor...');
    console.log('Hedef Token:', token);

    const result = await fcmService.sendNotification(
        token,
        'ChemAI Test Bildirimi 🧪',
        'Bu bir test bildirimidir. Firebase altyapısı başarıyla kuruldu!',
        {
            type: 'test',
            click_action: 'FLUTTER_NOTIFICATION_CLICK',
            timestamp: new Date().toISOString()
        }
    );

    if (result.success) {
        console.log('✅ Bildirim başarıyla gönderildi!');
        console.log('Message ID:', result.messageId);
    } else {
        console.log('❌ Bildirim gönderilemedi!');
        console.log('Hata:', result.error);
    }
}

sendTest();
