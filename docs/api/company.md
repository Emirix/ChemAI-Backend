# ChemAI API - Şirket Yönetimi 📦

Kullanıcıların şirket profillerini yönetmek için kullanılan servislerdir.

## 1. Şirketleri Listele
Kullanıcıya ait tüm şirket profillerini getirir.

- **URL:** `/api/companies`
- **Metot:** `POST`
- **Body:** `{ "userId": "uuid" }`

## 2. Şirket Oluştur
Yeni bir şirket profili ekler. `isDefault` true ise kullanıcının diğer varsayılan şirketlerini false yapar.

- **URL:** `/api/companies/create`
- **Metot:** `POST`
- **Body:**
  ```json
  {
    "userId": "uuid",
    "companyName": "ChemTech Ltd",
    "email": "info@chemtech.com",
    "address": "İstanbul, Türkiye",
    "isDefault": true
  }
  ```

## 3. Şirket Güncelle
Mevcut bir şirket profilini düzenler.

- **URL:** `/api/companies/update`
- **Metot:** `POST`
- **Body:** `{ "companyId": "...", "userId": "...", ... updates ... }`

## 4. Şirket Sil
Şirket profilini kalıcı olarak siler.

- **URL:** `/api/companies/delete`
- **Metot:** `POST`
- **Body:** `{ "companyId": "...", "userId": "..." }`

## 5. Varsayılan Şirketi Belirle / Getir
- **URL (Set):** `/api/companies/set-default` (POST)
- **URL (Get):** `/api/companies/default` (POST)
