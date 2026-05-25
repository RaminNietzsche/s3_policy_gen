/**
 * راهنمای اعمال تنظیمات با کلاینت‌های مختلف + اعمال مستقیم روی آروان.
 */

export const PANEL_APPLY_ID = 'pivest';

/** عنوان یکسان مودال‌های اعمال مستقیم */
export const PIVEST_MODAL_TITLE = 'اعمال مستقیم روی آروان';

export const APPLY_CLIENTS = [
  {
    id: PANEL_APPLY_ID,
    name: 'اعمال مستقیم روی آروان',
    short: 'از همین پنل',
    description: 'اعمال خروجی روی bucket با اتصال لوکال و کلیدهای همین صفحه',
    isPanel: true,
  },
  {
    id: 'aws',
    name: 'AWS CLI',
    short: 'aws',
    description: 'ابزار رسمی AWS — سازگار با API آروان',
  },
  {
    id: 'mc',
    name: 'MinIO Client',
    short: 'mc',
    description: 'کلاینت mc برای S3 و MinIO',
  },
  {
    id: 's3cmd',
    name: 's3cmd',
    short: 's3cmd',
    description: 'کلاینت خط فرمان محبوب S3',
  },
  {
    id: 'rclone',
    name: 'rclone',
    short: 'rclone',
    description: 'همگام‌سازی و مدیریت فایل — محدود برای Policy',
  },
];

const CONFIG_META = {
  policy: {
    label: 'Bucket Policy',
    file: 'bucket-policy.json',
    panelAction: 'putBucketPolicy',
  },
  cors: {
    label: 'CORS',
    file: 'cors-configuration.xml',
    panelAction: 'putBucketCors',
  },
  lifecycle: {
    label: 'Lifecycle',
    file: 'lifecycle-configuration.xml',
    panelAction: 'putBucketLifecycle',
  },
};

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stepHtml(title, bodyHtml) {
  return `<section class="guide-step"><h3>${esc(title)}</h3>${bodyHtml}</section>`;
}

function preHtml(code) {
  return `<pre class="guide-code" dir="ltr"><code>${esc(code)}</code></pre>`;
}

function listHtml(items) {
  return `<ul class="guide-list">${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
}

/**
 * @param {string} clientId
 * @param {{ bucket: string, endpoint: string, configType: string, outputText: string }} ctx
 */
export function buildClientGuideHtml(clientId, ctx) {
  const meta = CONFIG_META[ctx.configType] || CONFIG_META.policy;
  const bucket = ctx.bucket || 'BUCKET';
  const endpoint = ctx.endpoint || 'https://s3.example.arvanstorage.ir';
  const file = meta.file;

  if (clientId === PANEL_APPLY_ID) {
    return buildPivestGuide(meta, bucket, endpoint, ctx);
  }
  if (clientId === 'aws') {
    return buildAwsGuide(meta, bucket, endpoint, file);
  }
  if (clientId === 'mc') {
    return buildMcGuide(meta, bucket, endpoint, file);
  }
  if (clientId === 's3cmd') {
    return buildS3cmdGuide(meta, bucket, endpoint, file);
  }
  if (clientId === 'rclone') {
    return buildRcloneGuide(meta, bucket, endpoint, file);
  }
  return '<p>راهنما یافت نشد.</p>';
}

/** هشدار مشترک اجرای لوکال — بخش اتصال، راهنما و مودال تأیید */
export function buildPivestLocalWarningHtml(isLocal, devServerReady = false) {
  let statusLine;
  if (!isLocal) {
    statusLine =
      '<p class="pivest-local-bad">آدرس فعلی localhost نیست — اعمال مستقیم و وارد کردن کلید در این حالت فعال نیست.</p>';
  } else if (!devServerReady) {
    statusLine =
      '<p class="pivest-local-bad">آدرس <code dir="ltr">localhost</code> است اما <code dir="ltr">python3 server.py</code> در حال اجرا نیست — ورود Access Key / Secret غیرفعال است.</p>';
  } else {
    statusLine =
      '<p class="pivest-local-ok">آدرس <code dir="ltr">localhost</code> و سرور <code dir="ltr">server.py</code> فعال است.</p>';
  }

  return `
    <div class="pivest-local-banner" role="alert">
      <p class="pivest-local-title"><strong>فقط اجرای لوکال روی سیستم خودتان</strong></p>
      <p class="guide-p">اعمال مستقیم روی آروان و فیلدهای Access Key / Secret Key <strong>فقط</strong> وقتی کار می‌کنند که:</p>
      <ul class="guide-list">
        <li>پروژه را از <strong>گیت</strong> روی <strong>سیستم خودتان</strong> کلون کرده باشید؛</li>
        <li>در همان پوشه <code dir="ltr">python3 server.py</code> را اجرا کرده باشید؛</li>
        <li>صفحه را در مرورگر با <code dir="ltr">http://localhost:8080</code> (یا پورت همان سرور) باز کرده باشید.</li>
      </ul>
      <p class="guide-p">اگر صفحه را از هاست آنلاین، فایل خام HTML یا سرور دیگر باز کرده‌اید، کلید وارد نکنید — اعمال مستقیم هم کار نمی‌کند.</p>
      ${statusLine}
    </div>`;
}

/** متن رفع مسئولیت — مشترک در مودال تأیید */
export function buildPivestDisclaimerHtml() {
  return `
    <div class="pivest-disclaimer-box" role="note">
      <p class="pivest-disclaimer-title"><strong>رفع مسئولیت و هشدار</strong></p>
      <ul class="guide-list">
        <li>این ابزار <strong>فقط کمکی</strong> است برای ساختن و پیش‌نمایش تنظیمات؛ جایگزین بررسی امنیتی یا مشاورهٔ تخصصی نیست.</li>
        <li>خروجی و اعمال مستقیم ممکن است <strong>ناقص، نادرست یا نامناسب</strong> برای bucket و داده‌های شما باشد.</li>
        <li><strong>شما</strong> مسئول خواندن خروجی، آزمایش روی bucket غیرحیاتی و پیامدهای اعمال روی داده‌های واقعی هستید.</li>
        <li>قبل از اعمال در محیط تولید، تنظیمات را در پنل آروان یا با ابزار دیگر مقایسه و اعتبارسنجی کنید.</li>
      </ul>
    </div>`;
}

/** خلاصهٔ آنچه اعمال می‌شود */
export function buildPivestApplySummaryHtml(meta, bucket, endpoint) {
  return `
    <div class="pivest-apply-summary">
      <p class="guide-p"><strong>خلاصهٔ اعمال:</strong></p>
      <ul class="guide-list pivest-apply-summary-list">
        <li>نوع تنظیمات: <strong>${esc(meta.label)}</strong></li>
        <li>Bucket: <code dir="ltr">${esc(bucket)}</code></li>
        <li>Endpoint: <code dir="ltr">${esc(endpoint)}</code></li>
      </ul>
    </div>`;
}

/** بدنهٔ مودال تأیید قبل از اعمال */
export function buildPivestConfirmBodyHtml(ctx) {
  const meta = CONFIG_META[ctx.configType] || CONFIG_META.policy;
  const bucket = ctx.bucket || '—';
  const endpoint = ctx.endpoint || '—';
  const isLocalHost = Boolean(ctx?.isLocalHost ?? ctx?.isLocal);
  const devServerReady = Boolean(ctx?.devServerReady);

  return [
    buildPivestLocalWarningHtml(isLocalHost, devServerReady),
    buildPivestDisclaimerHtml(),
    buildPivestApplySummaryHtml(meta, bucket, endpoint),
  ].join('');
}

/** برچسب چک‌باکس پذیرش مسئولیت — اعمال */
export function buildPivestAcceptLabel(bucket) {
  const name = bucket?.trim() || '—';
  return `متن رفع مسئولیت را خواندم و مسئولیت بررسی خروجی و اعمال روی bucket «${name}» را می‌پذیرم.`;
}

/** خلاصهٔ آنچه حذف می‌شود */
export function buildPivestDeleteSummaryHtml(meta, bucket, endpoint) {
  return `
    <div class="pivest-apply-summary pivest-delete-summary">
      <p class="guide-p"><strong>خلاصهٔ حذف:</strong></p>
      <ul class="guide-list pivest-apply-summary-list">
        <li>حذف کامل: <strong>${esc(meta.label)}</strong> روی bucket</li>
        <li>Bucket: <code dir="ltr">${esc(bucket)}</code></li>
        <li>Endpoint: <code dir="ltr">${esc(endpoint)}</code></li>
      </ul>
      <p class="guide-p card-hint">پس از حذف، bucket دیگر این تنظیم را روی آروان نخواهد داشت (تا دوباره اعمال کنید).</p>
    </div>`;
}

/** بدنهٔ مودال تأیید قبل از حذف */
export function buildPivestDeleteBodyHtml(ctx) {
  const meta = CONFIG_META[ctx.configType] || CONFIG_META.policy;
  const bucket = ctx.bucket || '—';
  const endpoint = ctx.endpoint || '—';
  const isLocalHost = Boolean(ctx?.isLocalHost ?? ctx?.isLocal);
  const devServerReady = Boolean(ctx?.devServerReady);

  return [
    buildPivestLocalWarningHtml(isLocalHost, devServerReady),
    buildPivestDisclaimerHtml(),
    buildPivestDeleteSummaryHtml(meta, bucket, endpoint),
  ].join('');
}

/** برچسب چک‌باکس پذیرش مسئولیت — حذف */
export function buildPivestDeleteAcceptLabel(bucket, configLabel) {
  const name = bucket?.trim() || '—';
  return `می‌دانم ${configLabel} روی bucket «${name}» حذف می‌شود و مسئولیت این کار را می‌پذیرم.`;
}

function buildPivestGuide(meta, bucket, endpoint, ctx) {
  const isLocalHost = Boolean(ctx?.isLocalHost ?? ctx?.isLocal);
  const devServerReady = Boolean(ctx?.devServerReady);
  const canUseLocal = Boolean(ctx?.isLocal);

  return [
    buildPivestLocalWarningHtml(isLocalHost, devServerReady),
    stepHtml('اعمال مستقیم روی آروان چیست؟', `
      <p class="guide-p">با <strong>اعمال مستقیم روی آروان</strong> همان ${esc(meta.label)}ی که در پنل ساخته‌اید، بدون نصب کلاینت جدا، روی bucket در فضای ذخیره‌سازی آروان اعمال می‌شود.</p>
      <p class="guide-p">درخواست از مرورگر شما به پروکسی همان <code dir="ltr">server.py</code> روی لوکال می‌رود و از آنجا به endpoint آروان ارسال می‌شود.</p>
    `),
    stepHtml('Access Key و Secret Key', `
      <p class="guide-p"><strong>فقط در همین حالت لوکال</strong> کلیدها را در بخش «اتصال اختیاری» وارد کنید:</p>
      ${listHtml([
        'کلیدها فقط در <strong>حافظهٔ همین تب</strong> می‌مانند؛ Secret در localStorage ذخیره نمی‌شود.',
        'با بستن تب یا «قطع اتصال»، Secret از حافظه پاک می‌شود.',
        'روی سایت عمومی، CDN یا نسخهٔ آپلودشدهٔ HTML کلید وارد <strong>نکنید</strong>.',
        'از کلیدهای محدود به همان bucket و دسترسی Put/Delete برای Policy، CORS و Lifecycle استفاده کنید.',
      ])}
    `),
    stepHtml('پیش‌نیاز', listHtml([
      canUseLocal
        ? 'محیط لوکال (localhost + server.py) تأیید شده باشد.'
        : isLocalHost && !devServerReady
          ? 'ابتدا python3 server.py را در پوشهٔ پروژه اجرا کنید.'
          : 'ابتدا پروژه را لوکال اجرا کنید — در این آدرس اعمال مستقیم روی آروان کار نمی‌کند.',
      'Access Key و Secret Key را فقط پس از اجرای لوکال وارد کرده و <strong>متصل</strong> شده باشید.',
      `نام bucket (<code dir="ltr">${esc(bucket)}</code>) و endpoint (<code dir="ltr">${esc(endpoint)}</code>) درست باشد.`,
      `خروجی ${esc(meta.label)} در جعبهٔ پایین پر باشد.`,
    ])),
    stepHtml('اعمال و حذف', `
      <p class="guide-p">پس از بررسی موارد بالا، <strong>ادامه — تأیید و اعمال</strong> را بزنید. در مرحلهٔ بعد متن رفع مسئولیت را می‌خوانید و با تیک زدن، اعمال انجام می‌شود.</p>
      <p class="guide-p">برای <strong>حذف کامل</strong> ${esc(meta.label)} از bucket (بدون جایگزین)، از دکمهٔ <strong>حذف از آروان</strong> در بخش خروجی استفاده کنید.</p>
      <p class="guide-p card-hint">پیش از اعمال در محیط واقعی، خروجی را در bucket آزمایشی تست کنید.</p>
    `),
  ].join('');
}

function buildAwsGuide(meta, bucket, endpoint, file) {
  const sub = ctxSubresource(meta);
  const cmd = awsPutCommand(meta, bucket, endpoint, file);

  return [
    stepHtml('نصب', listHtml([
      'macOS: <code dir="ltr">brew install awscli</code>',
      'Linux: بستهٔ <code dir="ltr">awscli</code> توزیع خود یا <a href="https://aws.amazon.com/cli/" target="_blank" rel="noopener">دانلود AWS CLI v2</a>',
      'بررسی: <code dir="ltr">aws --version</code>',
    ])),
    stepHtml('تنظیم', `
      <p class="guide-p">پروفایل جدا برای آروان بسازید (کلیدها را جایگزین کنید):</p>
      ${preHtml(`aws configure --profile arvan
# AWS Access Key ID: <ACCESS_KEY>
# AWS Secret Access Key: <SECRET_KEY>
# Default region: us-east-1
# Default output format: json`)}
      <p class="guide-p">برای S3 سازگار با آروان، نسخهٔ امضا v4 کافی است.</p>
    `),
    stepHtml('ذخیرهٔ خروجی', `
      <p class="guide-p">محتوای جعبهٔ خروجی را در فایل زیر ذخیره کنید:</p>
      ${preHtml(file)}
    `),
    stepHtml('اجرا', `
      <p class="guide-p">از پوشهٔ همان فایل:</p>
      ${preHtml(cmd)}
      <p class="guide-p card-hint">ساب‌ریسورس: <code dir="ltr">?${esc(sub)}</code></p>
    `),
  ].join('');
}

function buildMcGuide(meta, bucket, endpoint, file) {
  const alias = 'arvan';
  const epHost = endpoint.replace(/^https?:\/\//, '');

  let runBlock = '';
  if (meta.panelAction === 'putBucketLifecycle') {
    runBlock = preHtml(
      `mc ilm import ${alias}/${bucket} ${file}\n# یا پس از ساخت alias:\nmc alias set ${alias} ${endpoint} <ACCESS_KEY> <SECRET_KEY>`,
    );
  } else if (meta.panelAction === 'putBucketCors') {
    runBlock = preHtml(
      `# CORS با mc (نسخه‌های جدید)\nmc cors set ${alias}/${bucket} ${file}\n\n# alias:\nmc alias set ${alias} ${endpoint} <ACCESS_KEY> <SECRET_KEY>`,
    );
  } else {
    runBlock = preHtml(
      `# Bucket Policy — توصیه: AWS CLI یا اعمال مستقیم روی آروان\naws s3api put-bucket-policy --bucket ${bucket} --policy file://${file} --endpoint-url ${endpoint} --profile arvan`,
    );
  }

  return [
    stepHtml('نصب', listHtml([
      '<a href="https://min.io/docs/minio/linux/reference/minio-mc.html" target="_blank" rel="noopener">دانلود mc</a>',
      'macOS: <code dir="ltr">brew install minio/stable/mc</code>',
      'بررسی: <code dir="ltr">mc --version</code>',
    ])),
    stepHtml('تنظیم alias', `
      <p class="guide-p">اتصال به endpoint آروان:</p>
      ${preHtml(`mc alias set ${alias} ${endpoint} <ACCESS_KEY> <SECRET_KEY>\nmc alias list`)}
      <p class="guide-p">میزبان: <code dir="ltr">${esc(epHost)}</code></p>
    `),
    stepHtml('ذخیرهٔ خروجی', preHtml(file)),
    stepHtml('اجرا', runBlock),
  ].join('');
}

function buildS3cmdGuide(meta, bucket, endpoint, file) {
  const epHost = endpoint.replace(/^https?:\/\//, '');
  let cmd = '';
  if (meta.panelAction === 'putBucketPolicy') {
    cmd = `s3cmd setpolicy ${file} s3://${bucket}`;
  } else if (meta.panelAction === 'putBucketCors') {
    cmd = `s3cmd setcors ${file} s3://${bucket}`;
  } else {
    cmd = `s3cmd setlifecycle ${file} s3://${bucket}`;
  }

  return [
    stepHtml('نصب', listHtml([
      'Debian/Ubuntu: <code dir="ltr">sudo apt install s3cmd</code>',
      'macOS: <code dir="ltr">brew install s3cmd</code>',
      'یا: <code dir="ltr">pip install s3cmd</code>',
    ])),
    stepHtml('تنظیم', `
      <p class="guide-p">فایل <code dir="ltr">~/.s3cfg</code>:</p>
      ${preHtml(`[default]
access_key = <ACCESS_KEY>
secret_key = <SECRET_KEY>
host_base = ${epHost}
host_bucket = %(bucket)s.${epHost}
use_https = True
signature_v2 = False
website_endpoint =`)}
      <p class="guide-p">یا یک‌بار: <code dir="ltr">s3cmd --configure</code></p>
    `),
    stepHtml('ذخیرهٔ خروجی', preHtml(file)),
    stepHtml('اجرا', `
      ${preHtml(cmd)}
      <p class="guide-p">در صورت خطای SSL/endpoint، <code dir="ltr">host_base</code> را با endpoint کلاستر خود هماهنگ کنید.</p>
    `),
  ].join('');
}

function buildRcloneGuide(meta, bucket, endpoint, file) {
  const remote = 'arvan';
  const note =
    meta.panelAction === 'putBucketPolicy'
      ? 'rclone برای Bucket Policy JSON ابزار مستقیم ندارد؛ از <strong>اعمال مستقیم روی آروان</strong> یا AWS CLI استفاده کنید.'
      : meta.panelAction === 'putBucketCors'
        ? 'تنظیم CORS سطح bucket در rclone محدود است؛ AWS CLI یا s3cmd توصیه می‌شود.'
        : 'Lifecycle سطح bucket در rclone پشتیبانی نمی‌شود؛ AWS CLI، s3cmd یا mc (ilm) مناسب‌ترند.';

  return [
    stepHtml('نصب', listHtml([
      '<a href="https://rclone.org/install/" target="_blank" rel="noopener">rclone.org/install</a>',
      'macOS: <code dir="ltr">brew install rclone</code>',
    ])),
    stepHtml('تنظیم remote', `
      ${preHtml(`rclone config\n# n) New remote\n# name: ${remote}\n# Storage: s3\n# provider: Other\n# endpoint: ${endpoint.replace(/^https?:\/\//, '')}\n# access_key_id / secret_access_key`)}
    `),
    stepHtml('محدودیت', `<p class="guide-p">${note}</p>`),
    stepHtml('جایگزین', `
      <p class="guide-p">فایل خروجی: <code dir="ltr">${esc(file)}</code> — با AWS CLI:</p>
      ${preHtml(awsPutCommand(meta, bucket, endpoint, file))}
    `),
  ].join('');
}

function ctxSubresource(meta) {
  if (meta.panelAction === 'putBucketCors') return 'cors';
  if (meta.panelAction === 'putBucketLifecycle') return 'lifecycle';
  return 'policy';
}

function awsPutCommand(meta, bucket, endpoint, file) {
  if (meta.panelAction === 'putBucketPolicy') {
    return `aws s3api put-bucket-policy \\
  --bucket ${bucket} \\
  --policy file://${file} \\
  --endpoint-url ${endpoint} \\
  --profile arvan`;
  }
  if (meta.panelAction === 'putBucketCors') {
    return `aws s3api put-bucket-cors \\
  --bucket ${bucket} \\
  --cors-configuration file://${file} \\
  --endpoint-url ${endpoint} \\
  --profile arvan`;
  }
  return `aws s3api put-bucket-lifecycle-configuration \\
  --bucket ${bucket} \\
  --lifecycle-configuration file://${file} \\
  --endpoint-url ${endpoint} \\
  --profile arvan`;
}

export function getConfigMeta(configType) {
  return CONFIG_META[configType] || CONFIG_META.policy;
}
