# ChemAI Backend API Documentation 🧪

ChemAI, kimyasal madde güvenlik verileri (SDS/MSDS), teknik veri formları (TDS) ve hammadde analizleri için yapay zeka destekli bir backend servisidir. Google Gemini AI entegrasyonu ile kimyasal verileri analiz eder ve kullanıcılar için anlamlı raporlar oluşturur.

## 🚀 Teknolojiler

- **Node.js & Express**: Backend API sunucusu.
- **Google Gemini AI**: Metin ve görsel analizi, veri üretimi.
- **Supabase (PostgreSQL)**: Veritabanı ve kimlik doğrulama.
- **Firebase Cloud Messaging (FCM)**: Push bildirimleri.
- **Telegram Bot API**: Geri bildirim ve admin bildirimleri.
- **Multer**: Dosya yükleme yönetimi.

---

## 🛠️ Kurulum

1. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

2. `.env` dosyasını oluşturun ve aşağıdaki değişkenleri tanımlayın:
   - `GEMINI_API_KEY`: Google Gemini API anahtarı.
   - `SUPABASE_URL` & `SUPABASE_KEY`: Supabase proje bilgileri.
   - `TELEGRAM_BOT_TOKEN` & `TELEGRAM_CHAT_ID`: Admin bildirimleri için.
   - `FIREBASE_SERVICE_ACCOUNT`: FCM bildirimleri için gerekli JSON yolu.

3. Sunucuyu başlatın:
   ```bash
   npm start
   ```

---

## 📡 API Uç Noktaları (Endpoints)

Tüm API istekleri `/api` ön eki ile başlar. Detaylı dökümanlar için aşağıdaki bağlantıları takip edebilirsiniz:

- 🛡️ [Güvenlik ve SDS İşlemleri](./docs/api/safety.md)
- 📄 [Teknik Veri Formları (TDS)](./docs/api/safety.md#📄-teknik-veri-formları-tds) *(Not: Safety içerisinde veya ayrı dosyada detaylandırılabilir)*
- 💬 [Sohbet ve AI Asistanı](./docs/api/chat.md)
- 📦 [Şirket Yönetimi](./docs/api/company.md)
- 🔔 [Bildirim Servisleri](./docs/api/notifications.md)
- 📰 [Haberler & Hammadde](./docs/api/safety.md) *(Geliştirilmeye devam ediyor)*

### Temel Endpoint Özetleri
| Metot | Uç Nokta | Açıklama |
| :--- | :--- | :--- |
| `POST` | `/api/safety-data` | Kimyasal güvenlik verilerini getirir. |
| `POST` | `/api/analyze-sds` | SDS belgesini analiz eder. |
| `POST` | `/api/chat` | AI asistanı ile mesajlaşma. |
| `POST` | `/api/tds-data` | TDS formunu oluşturur. |

### 📦 Hammadde ve Şirket Yönetimi
| Metot | Uç Nokta | Açıklama | Gönderilecek Veri (JSON) |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/raw-material-details` | Hammadde detaylarını getirir. | `{ productName, language }` |
| `POST` | `/api/companies` | Kullanıcının şirketlerini listeler. | `{ userId }` |
| `POST` | `/api/companies/create` | Yeni bir şirket profili oluşturur. | `{ userId, companyName, email, ... }` |

### 📰 Haberler
| Metot | Uç Nokta | Açıklama | Parametreler (Query) |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/news` | Kimya dünyasından haberleri listeler. | `limit, offset, category` |
| `GET` | `/api/news/categories` | Mevcut haber kategorilerini getirir. | - |

### 🔔 Bildirimler
| Metot | Uç Nokta | Açıklama | Gönderilecek Veri (JSON) |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/notifications/send-to-user` | Belirli bir kullanıcıya bildirim gönderir. | `{ userId, title, body, data }` |
| `POST` | `/api/notifications/broadcast` | (Admin) Tüm kullanıcılara bildirim gönderir. | `{ topic, title, body }` |

### ⚙️ Yönetim (Admin)
*Bu uç noktalar `isAdmin` middleware ile korunmaktadır.*
| Metot | Uç Nokta | Açıklama |
| :--- | :--- | :--- |
| `GET` | `/api/admin/users` | Tüm kullanıcı profillerini listeler. |
| `GET` | `/api/admin/logs` | Sistem kullanım loglarını getirir. |
| `GET` | `/api/admin/stats` | Genel sistem istatistiklerini (Kullanıcı, Log, Sohbet sayısı) getirir. |

### 💬 Geri Bildirim (Feedback)
| Metot | Uç Nokta | Açıklama |
| :--- | :--- | :--- |
| `POST` | `/api/feedback/submit` | Kullanıcı geri bildirimi gönderir (Telegram bildirimi tetikler). |
| `GET` | `/api/feedback/all` | (Admin) Tüm geri bildirimleri listeler. |

---

## 🔒 Güvenlik
Admin yetkisi gerektiren işlemler için `isAdmin` middleware'i kullanılır. Bu middleware, isteği yapan kullanıcının veritabanındaki `profiles.is_admin` alanını kontrol eder.

---

## 📦 Veritabanı Şeması (Temel Tablolar)
- `profiles`: Kullanıcı bilgileri ve ayarları.
- `chemical_safety_cache`: Gemini tarafından üretilen SDS verilerinin önbelleği.
- `tds_cache`: TDS verilerinin önbelleği.
- `companies`: Kullanıcı şirket profilleri.
- `audit_logs`: Sistem üzerindeki kritik işlemlerin kaydı.
- `news`: Kimyasal haber verileri.

---

Created with ❤️ by **ChemAI Team**
