# 🛡️ ChemAI Backend API Dokümantasyonu

ChemAI backend servisi, kimyasal güvenlik verilerini (MSDS) yapay zeka (Gemini 2.5 Flash) kullanarak dinamik olarak üretir.

## 🚀 Genel Bilgiler

- **Temel URL:** `http://localhost:3005/api`
- **Model:** `gemini-2.5-flash`
- **Format:** `application/json`

---

## 🔐 Kimlik Doğrulama
Şu an için API yerel ağda (local) çalışmaktadır ve ek bir API Key gerektirmez. Ancak Gemini API anahtarı backend tarafındaki `.env` dosyasında tanımlı olmalıdır.

---

## 📡 Rotalar (Endpoints)

### 1. Güvenlik Verisi Üretme
Kimyasal bir ürün hakkında detaylı güvenlik ve tehlike verilerini getirir.

- **URL:** `/safety-data`
- **Metot:** `POST`
- **İstek Gövdesi (Request Body):**

| Parametre | Tip | Zorunlu mu? | Açıklama |
| :--- | :--- | :--- | :--- |
| `productName` | String | Evet | Güvenlik verisi istenen kimyasalın adı veya CAS numarası. |
| `language` | String | Hayır | Yanıt dili (Varsayılan: "English"). Örn: "Turkish". |

**Örnek İstek:**
```json
{
  "productName": "Aseton",
  "language": "Turkish"
}
```

---

### 📥 Başarılı Yanıt (Success Response)

```json
{
  "success": true,
  "data": {
    "chemicalName": "Aseton",
    "casNumber": "67-64-1",
    "description": "Hızlı buharlaşan, yanıcı, renksiz bir sıvıdır.",
    "hazards": [
      {
        "type": "flammable",
        "label": "Yanıcı",
        "description": "Kolay alev alabilir sıvı ve buhar."
      }
    ],
    "ppe": [
      {
        "type": "goggles",
        "label": "Koruyucu Gözlük"
      }
    ],
    "properties": [
      { "label": "Kaynama Noktası", "value": "56.05 °C" }
    ],
    "handling": "İyi havalandırılan yerlerde kullanın. Statik deşarja karşı önlem alın.",
    "storage": "Sıkıca kapatılmış kapta, serin ve kuru bir yerde saklayın.",
    "firstAid": [
      "Göz teması: Bol su ile yıkayın."
    ],
    "firefighting": [
      "Su spreyi, alkole dayanıklı köpük veya kuru kimyasal kullanın."
    ],
    "riskAlert": {
      "hasAlert": true,
      "title": "Uyumsuz Karışım",
      "description": "Güçlü oksitleyici maddelerle karıştırmayın."
    }
  }
}
```

---

### ⚠️ Hata Yanıtları (Error Responses)

**400 Bad Request (Eksik Parametre):**
```json
{
  "success": false,
  "error": "Product name is required"
}
```

**500 Internal Server Error (Yapay Zeka Hatası):**
```json
{
  "success": false,
  "error": "AI Generation Failed: [Hata Mesajı]"
}
```

---

## 🛠️ Teknik Şema Detayları

### Hazard Types (Tehlike Türleri)
Yanıt içindeki `type` alanı şu değerlerden birini alabilir (Flutter'da ikon seçimi için):
- `flammable`, `irritant`, `toxic`, `corrosive`, `oxidizer`, `explosive`, `environmental`, `health_hazard`, `gas_cylinder`

### PPE Types (KKD Türleri)
- `goggles`, `gloves`, `lab_coat`, `mask`, `face_shield`, `respirator`

---

## 🖥️ Geliştirici Komutları

- **Sunucuyu Başlat (Production):** `npm start`
- **Geliştirici Modu (Nodemon):** `npm run dev`
- **Sağlık Kontrolü:** `GET http://localhost:3005/health`
