# ChemAI API - Bildirimler (Notification) 🔔

Firebase (FCM) ve Telegram üzerinden bildirim gönderme servisleridir.

## 1. Kullanıcıya Bildirim Gönder
Belirli bir kullanıcıya FCM üzerinden push bildirimi gönderir.

- **URL:** `/api/notifications/send-to-user`
- **Metot:** `POST`
- **Body:**
  ```json
  {
    "userId": "uuid",
    "title": "Dokümanınız Hazır",
    "body": "Talep ettiğiniz SDS analizi başarıyla tamamlandı.",
    "data": { "type": "sds", "id": "123" }
  }
  ```

## 2. Toplu Bildirim (Topic)
Belirli bir konuya (topic) abone olan tüm kullanıcılara bildirim gönderir.

- **URL:** `/api/notifications/broadcast`
- **Metot:** `POST`
- **Body:**
  ```json
  {
    "topic": "all_users",
    "title": "Sistem Güncellemesi",
    "body": "Yeni hammadde analiz özellikleri eklendi!"
  }
  ```

## 3. Çoklu Kullanıcıya Bildirim (Admin)
Seçilen birden fazla kullanıcıya hem FCM hem de Telegram üzerinden bildirim gönderir.

- **URL:** `/api/notifications/send-to-multiple`
- **Metot:** `POST`
- **Body:**
  ```json
  {
    "userIds": ["uuid1", "uuid2"],
    "title": "Duyuru",
    "body": "Kimya zirvesi yarın başlıyor."
  }
  ```
