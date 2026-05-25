# آموزش CORS

**CORS** (Cross-Origin Resource Sharing) مجموعه‌ای از هدرهای HTTP است که به **مرورگر** می‌گوید آیا اجازه دارد از یک **Origin** (مثلاً `https://app.example.com`) به **دامنهٔ دیگر** (endpoint bucket شما) درخواست بفرستد.

> CORS **جایگزین Bucket Policy نیست**. Policy به S3 می‌گوید درخواست را بپذیرد؛ CORS به مرورگر می‌گوید درخواست را **اصلاً بفرستد** یا نه. برای آپلود/دانلود از JS معمولاً **Policy + CORS + (در صورت نیاز) کلید یا pre-signed URL** لازم است.

---

## چه زمانی CORS لازم است؟

| سناریو | نیاز به CORS |
|--------|----------------|
| فایل از `<img src="https://bucket.../file.jpg">` | معمولاً **خیر** (درخواست ساده) |
| `fetch` / `XHR` / آپلود از JS در دامنهٔ دیگر | **بله** |
| اپ React/Vue روی `localhost:3000` به bucket | **بله** |
| CLI، backend، `curl` | **خیر** (مرورگر نیست) |

---

## ساختار XML خروجی

```xml
<CORSConfiguration>
  <CORSRule>
    <AllowedOrigin>https://app.example.com</AllowedOrigin>
    <AllowedMethod>GET</AllowedMethod>
    <AllowedMethod>PUT</AllowedMethod>
    <AllowedMethod>HEAD</AllowedMethod>
    <AllowedMethod>OPTIONS</AllowedMethod>
    <AllowedHeader>*</AllowedHeader>
    <ExposeHeader>ETag</ExposeHeader>
    <MaxAgeSeconds>3000</MaxAgeSeconds>
  </CORSRule>
</CORSConfiguration>
```

---

## فیلدهای هر قانون

| فیلد | توضیح |
|------|--------|
| **AllowedOrigin** | هر خط یک Origin — `https://site.com` یا `*` (همه) |
| **AllowedMethod** | `GET`, `PUT`, `POST`, `DELETE`, `HEAD`, `OPTIONS` |
| **AllowedHeader** | هدرهایی که کلاینت در preflight اعلام می‌کند — اغلب `*` |
| **ExposeHeader** | هدرهای پاسخی که JS می‌تواند بخواند — مثلاً `ETag` |
| **MaxAgeSeconds** | کش جواب preflight در مرورگر (ثانیه) |

---

## ترتیب قوانین — بسیار مهم

S3 قوانین CORS را **از بالا به پایین** می‌خواند؛ **اولین قانونی** که با Origin و Method درخواست جور باشد اعمال می‌شود و بقیه نادیده گرفته می‌شوند.

**پیشنهاد:**

1. Originهای **مشخص** (پنل، اپ production)
2. Originهای **عمومی‌تر**
3. در آخر در صورت نیاز `*`

اگر `*` را **بالا** بگذارید، قوانین دقیق‌تر پایین **هرگز** اجرا نمی‌شوند.

<figure class="figure">
<img src="assets/img/ui-cors.png" alt="تب CORS در s3_policy_gen" />
<figcaption>شکل ۱ — تب CORS: راهنمای ترتیب، فرم قانون، لیست قوانین</figcaption>
</figure>

---

## Preflight (درخواست OPTIONS)

برای درخواست‌های «غیرساده» (مثلاً `PUT` با هدر `Authorization` یا `Content-Type: application/xml`) مرورگر ابتدا **OPTIONS** می‌فرستد:

**جریان:** مرورگر → `OPTIONS` (preflight) → S3 جواب `Access-Control-*` → سپس `PUT`/`GET` واقعی.

**نکات:**

- **AllowedMethod** باید شامل متد واقعی باشد (`PUT` برای آپلود).
- **OPTIONS** را در قوانین فراموش نکنید.
- **MaxAgeSeconds** باعث می‌شود مرورگر همان جواب را چند ثانیه/ساعت تکرار نکند.

---

## الگوهای آماده در پنل

| الگو | محتوا |
|------|--------|
| وب‌اپ (آپلود از مرورگر) | Origin مشخص، GET/PUT/HEAD/OPTIONS، هدر `*` |
| فقط خواندن عمومی | GET/HEAD برای CDN یا فایل استاتیک |

---

## تفاوت CORS و Policy — جدول

| | CORS | Bucket Policy |
|---|------|----------------|
| مخاطب | مرورگر | سرور S3 |
| فرمت | XML | JSON |
| کنترل IP | خیر | بله (Condition) |
| کنترل IAM/کلید | خیر | بله |
| `*` برای همه | فقط Origin در CORS | Principal در Policy |

---

## خطاهای رایج در مرورگر

| خطا | علت احتمالی |
|-----|----------------|
| `No 'Access-Control-Allow-Origin'` | Origin در CORS نیست یا ترتیب قوانین اشتباه |
| preflight failed | `OPTIONS` یا Method در CORS نیست |
| درخواست رد شد ولی CORS OK | Policy یا کلید — S3 با 403 جواب داده |

---

## گام‌های پنل

1. تب **CORS** را باز کنید.
2. باکس «ترتیب قوانین» را بخوانید.
3. الگو انتخاب کنید یا Origin/Method/Header را دستی پر کنید.
4. **افزودن قانون** — برای تغییر ترتیب، قوانین را پاک و از بالا دوباره اضافه کنید.
5. XML را از **خروجی** کپی یا `cors-configuration.xml` دانلود کنید.
6. با CLI: `aws s3api put-bucket-cors` یا اعمال مستقیم در localhost.

بیشتر: [راهنمای پنل](guide.html) · [اعمال با کلاینت‌ها](clients.html) · [آموزش Policy](policy.html)
