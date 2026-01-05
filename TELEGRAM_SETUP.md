# Telegram Bot Kurulum Rehberi

ChemAI uygulamasında kullanıcı geri bildirimlerini Telegram üzerinden almak için aşağıdaki adımları takip edin.

## 1. Telegram Bot Oluşturma

### Adım 1: BotFather ile Bot Oluşturun
1. Telegram'da [@BotFather](https://t.me/BotFather) botunu açın
2. `/newbot` komutunu gönderin
3. Bot için bir isim girin (örn: "ChemAI Feedback Bot")
4. Bot için bir kullanıcı adı girin (örn: "chemai_feedback_bot")
5. BotFather size bir **Bot Token** verecek. Bu token'ı kaydedin!
   ```
   Örnek: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   ```

### Adım 2: Chat ID'nizi Bulun

#### Yöntem 1: Kişisel Chat ID
1. [@userinfobot](https://t.me/userinfobot) botunu açın
2. `/start` komutunu gönderin
3. Bot size Chat ID'nizi verecek (örn: `123456789`)

#### Yöntem 2: Grup Chat ID (Grup için geri bildirim almak isterseniz)
1. Yeni bir grup oluşturun veya mevcut bir grubu kullanın
2. Botunuzu gruba ekleyin
3. [@RawDataBot](https://t.me/RawDataBot) botunu gruba ekleyin
4. Grupta herhangi bir mesaj gönderin
5. RawDataBot size JSON formatında bilgi verecek
6. `"chat": {"id": -1001234567890}` kısmındaki ID'yi kaydedin

## 2. Backend Konfigürasyonu

`.env` dosyanızı açın ve aşağıdaki değerleri ekleyin:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789
```

**Önemli Notlar:**
- `TELEGRAM_BOT_TOKEN`: BotFather'dan aldığınız token
- `TELEGRAM_CHAT_ID`: Kişisel chat ID'niz veya grup chat ID'si
- Grup chat ID'leri genellikle negatif sayıdır (örn: `-1001234567890`)

## 3. Test Etme

### Backend'i Başlatın
```bash
cd backend
npm run dev
```

### Telegram Bağlantısını Test Edin

#### Yöntem 1: API Endpoint ile Test
```bash
curl http://localhost:3006/api/feedback/test-telegram
```

Başarılı yanıt:
```json
{
  "success": true,
  "message": "Telegram connection successful",
  "bot": {
    "id": 1234567890,
    "is_bot": true,
    "first_name": "ChemAI Feedback Bot",
    "username": "chemai_feedback_bot"
  }
}
```

#### Yöntem 2: Uygulama Üzerinden Test
1. Flutter uygulamasını çalıştırın
2. Profil ekranına gidin
3. "Geri Bildirim Gönder" seçeneğine tıklayın
4. Bir test geri bildirimi gönderin
5. Telegram'da mesajı kontrol edin

## 4. Geri Bildirim Mesaj Formatı

Telegram'a gönderilen mesajlar şu formatta olacak:

```
🐛 Yeni Geri Bildirim

Tip: Hata Bildirimi
Konu: Uygulama çöküyor

Mesaj:
SDS oluştururken uygulama kapanıyor. 
Lütfen düzeltebilir misiniz?

Kullanıcı Bilgileri:
👤 Ahmet Yılmaz
📧 ahmet@example.com
🆔 abc123-def456-ghi789

⏰ 04.01.2026 17:45:30
```

## 5. Geri Bildirim Türleri

- 🐛 **Hata Bildirimi** (bug)
- 💡 **Özellik İsteği** (feature)
- ⚡ **İyileştirme Önerisi** (improvement)
- ❓ **Soru** (question)
- 💬 **Diğer** (other)

## 6. Veritabanı Kurulumu

Supabase SQL Editor'de aşağıdaki migration'ı çalıştırın:

```bash
backend/migrations/create_feedback_table.sql
```

Bu migration:
- `feedback` tablosunu oluşturur
- Gerekli indeksleri ekler
- RLS (Row Level Security) politikalarını ayarlar
- Kullanıcılar kendi geri bildirimlerini görebilir
- Adminler tüm geri bildirimleri yönetebilir

## 7. Sorun Giderme

### Bot mesaj gönderemiyor
- Bot token'ın doğru olduğundan emin olun
- Chat ID'nin doğru olduğundan emin olun
- Grup kullanıyorsanız, botun grupta olduğundan emin olun
- Botun mesaj gönderme izni olduğundan emin olun

### "Chat not found" hatası
- Chat ID'nin doğru olduğundan emin olun
- Önce bota `/start` mesajı gönderin
- Grup için: Botu gruba ekleyin ve admin yapın

### Backend'de hata
- `.env` dosyasının doğru konumda olduğundan emin olun
- `npm install` komutunu çalıştırın
- Backend loglarını kontrol edin

## 8. Güvenlik Notları

⚠️ **Önemli:**
- Bot token'ınızı asla paylaşmayın
- `.env` dosyasını Git'e commit etmeyin
- Production'da environment variables kullanın
- Bot token'ı düzenli olarak yenileyin (BotFather > /revoke)

## 9. Gelişmiş Özellikler

### Telegram Bot Komutları (Opsiyonel)
BotFather'da botunuza komutlar ekleyebilirsiniz:

```
/start - Botu başlat
/help - Yardım mesajı
/stats - İstatistikler (admin)
```

### Webhook Kullanımı (Opsiyonel)
Polling yerine webhook kullanmak için:
```javascript
// backend/src/services/telegramService.js
async setWebhook(url) {
  await axios.post(`${this.baseUrl}/setWebhook`, {
    url: url
  });
}
```

## 10. Destek

Sorun yaşıyorsanız:
1. Backend loglarını kontrol edin
2. Telegram bot token ve chat ID'yi doğrulayın
3. Test endpoint'ini kullanarak bağlantıyı test edin
4. Supabase'de feedback tablosunun oluşturulduğundan emin olun
