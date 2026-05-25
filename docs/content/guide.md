# راهنمای پنل s3_policy_gen

راهنمای تصویری و گام‌به‌گام **همهٔ بخش‌های رابط** برای ساخت Bucket Policy، CORS و Lifecycle روی [فضای ذخیره‌سازی ابری آروان](https://www.arvancloud.ir/fa/products/cloud-storage).

> **آموزش عمیق:** [Bucket Policy](policy.html) · [CORS](cors.html) · [Lifecycle](lifecycle.html) · [اعمال با کلاینت‌ها](clients.html)

---

## نمای کلی صفحه

صفحه از بالا به پایین شامل این بخش‌هاست:

| # | بخش | کار |
|---|------|-----|
| ۱ | سربرگ (Hero) | عنوان، پوستهٔ روشن/تیره |
| ۲ | اتصال اختیاری | کلید S3 — **فقط localhost** |
| ۳ | نام Bucket | مشترک بین هر سه تب |
| ۴ | تب‌ها | Policy · CORS · Lifecycle |
| ۵ | ستون چپ | فرم و لیست قوانین |
| ۶ | ستون راست | خروجی، کپی، دانلود، اعمال |

<figure class="figure">
<img src="assets/img/ui-overview.png" alt="نمای کلی پنل s3_policy_gen" />
<figcaption>شکل ۱ — چیدمان کلی: سربرگ، bucket، تب‌ها، فرم و خروجی</figcaption>
</figure>

---

## سربرگ و پوسته

- دکمه **پوسته** (ماه/خورشید): تم روشن یا تیره — در `localStorage` ذخیره می‌شود.
- نشان **ابر آروان · ذخیره‌سازی ابری** زیر عنوان است.

---

## فیلد Bucket (مشترک)

1. نام bucket را در فیلد **Bucket** وارد کنید (`dir="ltr"`).
2. پس از اتصال لوکال، فهرست کشویی bucketها ظاهر می‌شود.
3. این نام در ARNهای Policy و در XMLهای CORS/Lifecycle استفاده می‌شود.

> همهٔ تب‌ها روی **یک bucket** کار می‌کنند؛ قبل از تعویض bucket خروجی را ذخیره کنید.

---

## اتصال اختیاری (لوکال)

فقط وقتی صفحه روی `http://localhost` و `python3 server.py` (یا `make serve`) در حال اجراست:

<figure class="figure">
<img src="assets/img/ui-connect.png" alt="بخش اتصال اختیاری به فضای ذخیره‌سازی" />
<figcaption>شکل ۲ — اتصال: کلاستر، Access Key، Secret Key</figcaption>
</figure>

### مراحل

1. بخش **اتصال اختیاری** را باز کنید (کلیک روی summary).
2. **کلاستر / Endpoint** را انتخاب کنید — زیر فیلد، URL کامل نمایش داده می‌شود.
3. **Access Key** و **Secret Key** را وارد کنید.
4. **اتصال و دریافت bucketها** — وضعیت به «متصل» تغییر می‌کند.
5. bucket را از لیست یا دستی انتخاب کنید — Policy/CORS/LC موجود **بارگذاری** می‌شود.

### امنیت

- Secret در `localStorage` **ذخیره نمی‌شود**.
- **قطع اتصال** Secret را از حافظه پاک می‌کند.
- روی bucket استاتیک عمومی، فیلدها **غیرفعال** و پیام راهنما نمایش داده می‌شود.

---

## تب Bucket Policy

<figure class="figure">
<img src="assets/img/ui-policy.png" alt="تب Bucket Policy — الگوها و افزودن قانون" />
<figcaption>شکل ۳ — Policy: Account ID، الگوها، فرم قانون، لیست Statement</figcaption>
</figure>

### گام ۱ — Account ID

- شناسهٔ مالک bucket در آروان.
- یک قانون **دسترسی کامل مالک** خودکار به JSON اضافه می‌شود.

### گام ۲ — الگو یا قانون دستی

**الگو:** دکمهٔ chip (مثلاً خواندن عمومی) → فرم پر می‌شود → **افزودن قانون**.

**دستی:**

| فیلد | انتخاب |
|------|--------|
| نوع دسترسی | Allow / Deny |
| برای چه کسی | ARN / `*` / authenticated |
| روی چه بخشی | فایل / bucket / هر دو |
| کارهای مجاز | checklist یا preset |
| شرط | + شرط (IP، prefix) |

### گام ۳ — لیست قوانین

- قوانین از **بالا به پایین** در JSON نهایی.
- **پاک‌کردن همه** یا حذف تکی.
- Denyهای مهم را **بالا** بگذارید.

### گام ۴ — خروجی

- JSON در textarea ستون راست.
- **کپی** / **دانلود** `bucket-policy.json`.

جزئیات مفهومی: [آموزش Bucket Policy](policy.html)

---

## تب CORS

<figure class="figure">
<img src="assets/img/ui-cors.png" alt="تب CORS — Origin، متدها و ترتیب قوانین" />
<figcaption>شکل ۴ — CORS: ترتیب قوانین، Origin، Method، preflight</figcaption>
</figure>

1. کارت **ترتیب قوانین** را بخوانید — `*` را آخر بگذارید.
2. الگوی «وب‌اپ» یا «فقط خواندن» را بزنید.
3. **Origin** — هر خط یک آدرس.
4. **متدهای مجاز** — برای آپلود: GET, PUT, HEAD, **OPTIONS**.
5. **افزودن قانون** — ترتیب = ترتیب اضافه‌کردن.
6. خروجی XML — `cors-configuration.xml`.

جزئیات: [آموزش CORS](cors.html)

---

## تب Lifecycle

<figure class="figure">
<img src="assets/img/ui-lifecycle.png" alt="تب Lifecycle — انقضا و پاک‌سازی multipart" />
<figcaption>شکل ۵ — Lifecycle: ID، prefix، انقضا، multipart</figcaption>
</figure>

1. **شناسهٔ قانون** یکتا (مثلاً `expire-logs`).
2. **مسیر پوشه** اختیاری — `logs/` فقط روی آن prefix.
3. **حذف بعد از (روز)** و/یا **پاک‌سازی multipart**.
4. فیلدهای Transition در آروان **غیرفعال** — پیام در فرم.
5. **افزودن قانون** — چند Rule مجاز است.

جزئیات: [آموزش Lifecycle](lifecycle.html)

---

## خروجی و اعمال

<figure class="figure">
<img src="assets/img/ui-output.png" alt="پنل خروجی — JSON و دکمه‌های کپی و دانلود" />
<figcaption>شکل ۶ — خروجی: کپی، دانلود و انتخاب روش اعمال</figcaption>
</figure>

| عمل | شرط |
|-----|------|
| **کپی / دانلود** | همیشه (استاتیک و لوکال) |
| **راهنمای CLI** | انتخاب aws / s3cmd / rclone / MinIO — [آموزش کامل کلاینت‌ها](clients.html) |
| **اعمال مستقیم** | localhost + اتصال + تأیید مسئولیت |
| **حذف از آروان** | همان تنظیم از bucket بارگذاری شده + لوکال |

### راهنمای کلاینت (AWS CLI، mc، …)

پس از انتخاب یکی از دکمه‌های کلاینت (مثلاً **MinIO Client** یا **AWS CLI**)، پنجرهٔ راهنما باز می‌شود: نصب، تنظیم alias/endpoint آروان، ذخیرهٔ فایل خروجی و دستور اجرا.

<figure class="figure">
<img src="assets/img/ui-apply-client.png" alt="پنجره راهنمای اعمال با MinIO Client یا AWS CLI" />
<figcaption>شکل ۷ — راهنمای CLI: alias، فایل خروجی و دستور put-bucket-policy</figcaption>
</figure>

### اعمال مستقیم روی آروان

با **اعمال مستقیم روی آروان** (فقط `localhost` + `server.py`) ابتدا توضیحات امنیتی و پیش‌نیازها نمایش داده می‌شود؛ پس از **ادامه — تأیید و اعمال**، Policy/CORS/Lifecycle روی bucket اعمال می‌شود.

<figure class="figure">
<img src="assets/img/ui-apply-arvan.png" alt="پنجره تأیید اعمال مستقیم روی آروان" />
<figcaption>شکل ۸ — اعمال مستقیم: کلیدها، پیش‌نیاز localhost و تأیید مسئولیت</figcaption>
</figure>

---

## جریان کار پیشنهادی

1. ابزار را باز کنید → نام **bucket** را وارد کنید.
2. تب **Policy** / **CORS** / **Lifecycle** را انتخاب کنید.
3. قوانین را بسازید → **کپی** یا **دانلود**.
4. اگر `make serve` دارید: اتصال → **اعمال مستقیم**؛ وگرنه فایل را در پنل آروان یا CLI بگذارید.

---

## عیب‌یابی سریع

| مشکل | راه‌حل |
|------|--------|
| بدون CSS | `make deploy` یا `make fix-mime`؛ Hard Refresh |
| اسکریپت لود نشد | `make serve`؛ آدرس `localhost:8080` |
| CORS در مرورگر خطا | ترتیب Origin؛ OPTIONS؛ [آموزش CORS](cors.html) |
| 403 با CORS درست | [Policy](policy.html) یا کلید |
| اعمال غیرفعال | فقط localhost + `server.py` |

---

## گام بعدی

- [آموزش اعمال با کلاینت‌ها](clients.html)
- [استقرار](deploy.html)
- [امنیت](security.html)
- [باز کردن ابزار](https://policygen.s3-website.ir-thr-at1.arvanstorage.ir)
