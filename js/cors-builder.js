function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function listXml(tag, values) {
  return (values || [])
    .map((v) => v?.trim())
    .filter(Boolean)
    .map((v) => `    <${tag}>${escapeXml(v)}</${tag}>`)
    .join('\n');
}

/**
 * @param {Array<{
 *   allowedOrigins: string[],
 *   allowedMethods: string[],
 *   allowedHeaders?: string[],
 *   exposeHeaders?: string[],
 *   maxAgeSeconds?: number,
 * }>} rules
 */
export function buildCorsXml(rules) {
  const valid = (rules || []).filter((r) => r.allowedOrigins?.length && r.allowedMethods?.length);
  if (!valid.length) throw new Error('حداقل یک قانون CORS با سایت و متد تعریف کنید.');

  const rulesXml = valid
    .map((rule) => {
      const parts = [
        listXml('AllowedOrigin', rule.allowedOrigins),
        listXml('AllowedMethod', rule.allowedMethods),
      ];
      const headers = rule.allowedHeaders?.length ? rule.allowedHeaders : ['*'];
      parts.push(listXml('AllowedHeader', headers));
      if (rule.exposeHeaders?.length) {
        parts.push(listXml('ExposeHeader', rule.exposeHeaders));
      }
      if (rule.maxAgeSeconds != null && rule.maxAgeSeconds !== '') {
        parts.push(`    <MaxAgeSeconds>${Number(rule.maxAgeSeconds)}</MaxAgeSeconds>`);
      }
      return `  <CORSRule>\n${parts.join('\n')}\n  </CORSRule>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">\n${rulesXml}\n</CORSConfiguration>`;
}

export function formatCorsXml(xml, pretty = true) {
  if (!pretty) return xml;
  return xml;
}

function readXmlError(doc) {
  const code = doc.querySelector('Error Code, Code')?.textContent;
  const msg = doc.querySelector('Error Message, Message')?.textContent;
  if (code || msg) throw new Error(`${code || 'Error'}: ${msg || ''}`.trim());
}

/** @param {string} xml */
export function parseCorsConfigurationXml(xml) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  readXmlError(doc);

  return [...doc.querySelectorAll('CORSConfiguration > CORSRule, CORSRule')].map((ruleEl) => {
    const origins = [...ruleEl.querySelectorAll('AllowedOrigin')].map((n) => n.textContent?.trim()).filter(Boolean);
    const methods = [...ruleEl.querySelectorAll('AllowedMethod')].map((n) => n.textContent?.trim()).filter(Boolean);
    const headers = [...ruleEl.querySelectorAll('AllowedHeader')].map((n) => n.textContent?.trim()).filter(Boolean);
    const expose = [...ruleEl.querySelectorAll('ExposeHeader')].map((n) => n.textContent?.trim()).filter(Boolean);
    const maxAgeRaw = ruleEl.querySelector('MaxAgeSeconds')?.textContent?.trim();

    const rule = {
      allowedOrigins: origins,
      allowedMethods: methods,
    };
    if (headers.length) rule.allowedHeaders = headers;
    if (expose.length) rule.exposeHeaders = expose;
    if (maxAgeRaw != null && maxAgeRaw !== '') {
      rule.maxAgeSeconds = Number(maxAgeRaw);
    }
    return rule;
  });
}
