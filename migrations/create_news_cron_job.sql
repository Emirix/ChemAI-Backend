-- Supabase pg_cron için günlük haber çekme zamanlayıcı
-- Edge Function kullanarak backend'i tetikler

-- 1. pg_cron extension'ı aktifleştir (Supabase Dashboard'dan SQL Editor'de çalıştırın)
-- Not: pg_cron Supabase Pro plan ve üzerinde kullanılabilir

-- Extension'ı aktifleştir
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Sabah 09:00 (Turkey Time = UTC+3, yani 06:00 UTC) için cron job
SELECT cron.schedule(
    'fetch-chemistry-news-morning',  -- Job adı
    '0 6 * * *',                     -- Her gün saat 06:00 UTC (09:00 Turkey Time)
    $$
    SELECT
      net.http_post(
          url := 'https://[your-project-ref].supabase.co/functions/v1/fetch-daily-news',
          headers := '{"Authorization": "Bearer [your-anon-key]"}'::jsonb
      ) as request_id;
    $$
);

-- 3. Akşam 21:00 (Turkey Time = UTC+3, yani 18:00 UTC) için cron job
SELECT cron.schedule(
    'fetch-chemistry-news-evening',  -- Job adı
    '0 18 * * *',                    -- Her gün saat 18:00 UTC (21:00 Turkey Time)
    $$
    SELECT
      net.http_post(
          url := 'https://[your-project-ref].supabase.co/functions/v1/fetch-daily-news',
          headers := '{"Authorization": "Bearer [your-anon-key]"}'::jsonb
      ) as request_id;
    $$
);

-- 4. Zamanlanmış işleri görüntüleme
SELECT * FROM cron.job ORDER BY jobid;

-- 5. Zamanlanmış işlerin geçmişini görüntüleme
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- 6. İşleri kaldırmak için (gerekirse):
-- SELECT cron.unschedule('fetch-chemistry-news-morning');
-- SELECT cron.unschedule('fetch-chemistry-news-evening');

/*
KURULUM TALİMATLARI:

1. Supabase Dashboard'a gidin
2. SQL Editor'ü açın
3. Yukarıdaki SQL'i yapıştırın
4. [your-project-ref] ve [your-anon-key] değerlerini kendi değerlerinizle değiştirin:
   - Project Ref: Project Settings > General > Reference ID
   - Anon Key: Project Settings > API > Project API keys > anon/public key

5. Edge Function'ı deploy edin:
   ```bash
   supabase functions deploy fetch-daily-news
   ```

6. Environment variable ekleyin:
   ```bash
   supabase secrets set BACKEND_URL=http://[your-backend-url]:3006
   ```

NOT: 
- pg_cron UTC saatini kullanır
- Turkey Time UTC+3 olduğu için:
  - 09:00 Turkey Time = 06:00 UTC
  - 21:00 Turkey Time = 18:00 UTC
- Supabase Free tier'da pg_cron kullanılamaz, Pro plan gerekir
*/
