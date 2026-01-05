# ChemAI API - Güvenlik ve SDS İşlemleri 🛡️

Kimyasal madde güvenlik verileri (SDS/MSDS) oluşturma ve analiz etme servisleridir.

## 1. Güvenlik Verilerini Getir (Cache Destekli)
Belirtilen ürün adı için kimyasal güvenlik bilgilerini döndürür. Veri önbellekte yoksa Gemini AI tarafından üretilir ve önbelleğe alınır.

- **URL:** `/api/safety-data`
- **Metot:** `POST`
- **Body:**
  ```json
  {
    "productName": "Sülfürik Asit",
    "language": "Turkish",
    "userId": "uuid-v4-kullanici-id"
  }
  ```
- **Başarılı Yanıt (200 OK):**
  ```json
  {
    "success": true,
    "data": { ... chemical details ... },
    "cached": true
  }
  ```

## 2. SDS Dosyası Analiz Et
Yüklenen bir SDS belgesini (PDF veya Görsel) analiz ederek içindeki kimyasal verileri çıkarır.

- **URL:** `/api/analyze-sds`
- **Metot:** `POST`
- **Content-Type:** `multipart/form-data`
- **Parametre:** 
  - `file`: (Dosya) PDF, JPEG, PNG veya WebP formatında belge.
- **Başarılı Yanıt (200 OK):**
  ```json
  {
    "chemicalName": "...",
    "casNumber": "...",
    "hazards": [ ... ]
  }
  ```

## 3. Metinden Kimyasal Tanımla (OCR Analizi)
Ham metin içerisinden ürün adını ve kimyasal özelliklerini tanımlar.

- **URL:** `/api/identify-chemical`
- **Metot:** `POST`
- **Body:**
  ```json
  {
    "text": "Ürün içeriği: Sodyum Hipoklorit çözeltisidir...",
    "language": "Turkish"
  }
  ```
- **Başarılı Yanıt (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "chemicalName": "Sodyum Hipoklorit",
      "properties": { ... }
    }
  }
  ```
