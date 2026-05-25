const DEFAULT_REGION = 'us-east-1';
const AWS4FETCH_URL = new URL('./vendor/aws4fetch.mjs', import.meta.url).href;
const S3_PROXY_PATH = '/s3-proxy';

/** In-memory only — never persisted. */
let activeClient = null;
let activeEndpoint = null;

export function isConnected() {
  return Boolean(activeClient && activeEndpoint);
}

export function getEndpoint() {
  return activeEndpoint;
}

/** آیا صفحه روی localhost باز شده است؟ */
export function isLocalDevRuntime() {
  if (typeof window === 'undefined') return false;
  const { hostname, protocol } = window.location;
  return (hostname === 'localhost' || hostname === '127.0.0.1') && protocol.startsWith('http');
}

/** آیا پروکسی server.py در دسترس است؟ */
export async function probeLocalDevServer() {
  if (!isLocalDevRuntime()) return false;
  try {
    const res = await fetch(S3_PROXY_PATH, { method: 'OPTIONS' });
    return res.status === 204;
  } catch {
    return false;
  }
}

/** @deprecated alias */
export function shouldUseS3Proxy() {
  return isLocalDevRuntime();
}

/**
 * @param {{ endpoint: string, accessKeyId: string, secretAccessKey: string, region?: string }} creds
 */
export async function connect(creds) {
  const endpoint = normalizeEndpoint(creds.endpoint);
  const accessKeyId = creds.accessKeyId?.trim();
  const secretAccessKey = creds.secretAccessKey?.trim();
  if (!endpoint) throw new Error('آدرس endpoint را وارد کنید.');
  if (!accessKeyId || !secretAccessKey) throw new Error('Access Key و Secret Key را وارد کنید.');

  const { AwsClient } = await import(AWS4FETCH_URL);
  activeEndpoint = endpoint;
  activeClient = new AwsClient({
    accessKeyId,
    secretAccessKey,
    region: creds.region?.trim() || DEFAULT_REGION,
    service: 's3',
  });
}

export function disconnect() {
  activeClient = null;
  activeEndpoint = null;
}

export function normalizeEndpoint(url) {
  const trimmed = url?.trim();
  if (!trimmed) return '';
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProto.replace(/\/+$/, '');
}

function resolveSignedUrl(signedRequest, fallbackUrl) {
  if (typeof signedRequest === 'string') return signedRequest;
  const u = signedRequest?.url;
  if (u && typeof u === 'string') return u;
  return fallbackUrl;
}

function parseS3ErrorMessage(text, status) {
  try {
    const doc = new DOMParser().parseFromString(text, 'application/xml');
    const code = doc.querySelector('Code')?.textContent;
    const msg = doc.querySelector('Message')?.textContent;
    if (code || msg) return `${code || 'Error'}: ${msg || ''}`.trim();
  } catch {
    /* ignore */
  }
  try {
    const j = JSON.parse(text);
    if (j.error) return j.error;
  } catch {
    /* ignore */
  }
  const snippet = text.slice(0, 240).replace(/\s+/g, ' ').trim();
  return snippet || `HTTP ${status}`;
}

async function fetchViaProxy(signedRequest, body, fallbackUrl) {
  const targetUrl = resolveSignedUrl(signedRequest, fallbackUrl);
  if (!targetUrl?.startsWith('http')) {
    throw new Error('آدرس S3 نامعتبر است. دوباره متصل شوید.');
  }

  const headers = {};
  signedRequest.headers?.forEach((value, key) => {
    headers[key] = value;
  });

  const payload = {
    url: targetUrl,
    method: signedRequest.method || 'GET',
    headers,
  };
  if (body != null && body !== '') {
    payload.body = typeof body === 'string' ? body : new TextDecoder().decode(body);
  }

  const res = await fetch(S3_PROXY_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) {
    const detail = parseS3ErrorMessage(text, res.status);
    const prefix = res.status === 400 && /Invalid target url/i.test(detail)
      ? 'پروکسی:'
      : 'S3';
    throw new Error(`خطای ${prefix} (${res.status}): ${detail}`);
  }
  return text;
}

/**
 * @param {string} pathAndQuery
 * @param {{ method?: string, body?: string, contentType?: string }} [options]
 */
export async function signedS3Request(pathAndQuery, options = {}) {
  if (!activeClient || !activeEndpoint) {
    throw new Error('ابتدا به فضای ذخیره‌سازی متصل شوید.');
  }

  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ?? null;
  const url = `${activeEndpoint}${pathAndQuery.startsWith('/') ? '' : '/'}${pathAndQuery}`;

  const signOpts = { method };
  if (body != null) {
    signOpts.body = body;
    signOpts.headers = {
      ...(options.contentType && { 'Content-Type': options.contentType }),
    };
  }

  try {
    if (shouldUseS3Proxy()) {
      const signed = await activeClient.sign(url, signOpts);
      return await fetchViaProxy(signed, body, url);
    }

    const signed = await activeClient.sign(url, signOpts);
    const res = await fetch(signed.url, {
      method: signed.method,
      headers: signed.headers,
      body: body ?? undefined,
    });
    const text = await res.text();
    if (!res.ok) {
      const snippet = text.slice(0, 200).replace(/\s+/g, ' ');
      throw new Error(`خطای S3 (${res.status}): ${snippet || res.statusText}`);
    }
    return text;
  } catch (err) {
    if (err instanceof TypeError || /failed to fetch/i.test(err.message)) {
      const hint = shouldUseS3Proxy()
        ? 'پروکسی S3 در دسترس نیست. سرور را با python3 server.py اجرا کنید.'
        : 'ارتباط با endpoint برقرار نشد (شبکه یا CORS).';
      throw new Error(hint);
    }
    throw err;
  }
}

export async function listBuckets() {
  return parseListBucketsXml(await signedS3Request('/'));
}

export async function listObjectKeys(bucket, maxKeys = 200) {
  const name = bucket?.trim();
  if (!name) return [];
  const q = `?list-type=2&max-keys=${maxKeys}`;
  return parseListObjectsXml(
    await signedS3Request(`/${encodeURIComponent(name)}${q}`),
  );
}

function isS3NotConfiguredError(err) {
  const msg = err?.message || '';
  return (
    /\b404\b/.test(msg) ||
    /NoSuchBucketPolicy/i.test(msg) ||
    /NoSuchCORSConfiguration/i.test(msg) ||
    /NoSuchLifecycleConfiguration/i.test(msg) ||
    /NotFound/i.test(msg)
  );
}

export async function getBucketPolicy(bucket) {
  const name = bucket?.trim();
  if (!name) throw new Error('نام bucket را وارد کنید.');
  try {
    return await signedS3Request(`/${encodeURIComponent(name)}?policy`);
  } catch (err) {
    if (isS3NotConfiguredError(err)) return null;
    throw err;
  }
}

export async function getBucketCors(bucket) {
  const name = bucket?.trim();
  if (!name) throw new Error('نام bucket را وارد کنید.');
  try {
    return await signedS3Request(`/${encodeURIComponent(name)}?cors`);
  } catch (err) {
    if (isS3NotConfiguredError(err)) return null;
    throw err;
  }
}

export async function getBucketLifecycle(bucket) {
  const name = bucket?.trim();
  if (!name) throw new Error('نام bucket را وارد کنید.');
  try {
    return await signedS3Request(`/${encodeURIComponent(name)}?lifecycle`);
  } catch (err) {
    if (isS3NotConfiguredError(err)) return null;
    throw err;
  }
}

export async function putBucketPolicy(bucket, policyDocument) {
  const name = bucket?.trim();
  if (!name) throw new Error('نام bucket را وارد کنید.');
  const body =
    typeof policyDocument === 'string' ? policyDocument : JSON.stringify(policyDocument);
  await signedS3Request(`/${encodeURIComponent(name)}?policy`, {
    method: 'PUT',
    body,
    contentType: 'application/json',
  });
}

export async function putBucketCors(bucket, corsXml) {
  const name = bucket?.trim();
  if (!name) throw new Error('نام bucket را وارد کنید.');
  const body = corsXml?.trim();
  if (!body) throw new Error('خروجی CORS خالی است.');
  await signedS3Request(`/${encodeURIComponent(name)}?cors`, {
    method: 'PUT',
    body,
    contentType: 'application/xml',
  });
}

export async function putBucketLifecycle(bucket, lifecycleXml) {
  const name = bucket?.trim();
  if (!name) throw new Error('نام bucket را وارد کنید.');
  const body = lifecycleXml?.trim();
  if (!body) throw new Error('خروجی Lifecycle خالی است.');
  await signedS3Request(`/${encodeURIComponent(name)}?lifecycle`, {
    method: 'PUT',
    body,
    contentType: 'application/xml',
  });
}

async function deleteBucketSubresource(bucket, query) {
  const name = bucket?.trim();
  if (!name) throw new Error('نام bucket را وارد کنید.');
  try {
    await signedS3Request(`/${encodeURIComponent(name)}?${query}`, { method: 'DELETE' });
  } catch (err) {
    if (isS3NotConfiguredError(err)) return;
    throw err;
  }
}

export async function deleteBucketPolicy(bucket) {
  return deleteBucketSubresource(bucket, 'policy');
}

export async function deleteBucketCors(bucket) {
  return deleteBucketSubresource(bucket, 'cors');
}

export async function deleteBucketLifecycle(bucket) {
  return deleteBucketSubresource(bucket, 'lifecycle');
}

function parseListBucketsXml(xml) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.querySelector('Error')) {
    const msg = doc.querySelector('Message')?.textContent || 'خطای ناشناخته';
    throw new Error(msg);
  }
  return [...doc.querySelectorAll('Bucket > Name')]
    .map((n) => n.textContent?.trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, 'fa'));
}

function parseListObjectsXml(xml) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.querySelector('Error')) {
    const msg = doc.querySelector('Message')?.textContent || 'خطای ناشناخته';
    throw new Error(msg);
  }
  return [...doc.querySelectorAll('Contents > Key')]
    .map((n) => n.textContent?.trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, 'fa'));
}
