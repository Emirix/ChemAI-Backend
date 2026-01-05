# ChemAI API - Sohbet ve AI Asistanı 💬

Yapay zeka destekli sohbet ve meta veri üretimi servisleridir.

## 1. AI ile Mesajlaş
Gemini AI asistanı ile kimya odaklı sohbet gerçekleştirir.

- **URL:** `/api/chat`
- **Metot:** `POST`
- **Body:**
  ```json
  {
    "message": "Nitrilosetik asit nedir?",
    "language": "Turkish",
    "history": [
      { "role": "user", "parts": [{ "text": "Selam" }] },
      { "role": "model", "parts": [{ "text": "Merhaba! Size nasıl yardımcı olabilirim?" }] }
    ]
  }
  ```
- **Başarılı Yanıt (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "content": "Nitrilosetik asit (NTA), bir aminopolikarboksilik asittir...",
      "suggestedQuestions": ["NTA nerelerde kullanılır?", "NTA zararlı mıdır?"]
    }
  }
  ```

## 2. Sohbet Meta Verisi Oluştur
Sohbet geçmişine dayanarak otomatik olarak bir başlık ve uygun bir simge (emoji/icon) önerir.

- **URL:** `/api/chat/generate-metadata`
- **Metot:** `POST`
- **Body:**
  ```json
  {
    "messages": [ ... sohbet mesajları ... ]
  }
  ```
- **Başarılı Yanıt (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "title": "NTA Hakkında Bilgi",
      "icon": "🧪"
    }
  }
  ```
