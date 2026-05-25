function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** فیلتر اجباری برای S3 — بدون prefix کل bucket */
function buildFilterParts(prefix) {
  const p = prefix?.trim();
  if (p) {
    return ['    <Filter>', `      <Prefix>${escapeXml(p)}</Prefix>`, '    </Filter>'];
  }
  return ['    <Filter></Filter>'];
}

/**
 * @param {Array<{
 *   id: string,
 *   status: 'Enabled' | 'Disabled',
 *   prefix?: string,
 *   expirationDays?: number,
 *   transitionDays?: number,
 *   transitionStorageClass?: string,
 *   abortIncompleteDays?: number,
 * }>} rules
 */
export function buildLifecycleXml(rules) {
  const valid = (rules || []).filter((r) => r.id?.trim());
  if (!valid.length) throw new Error('حداقل یک قانون Lifecycle با شناسه تعریف کنید.');

  const rulesXml = valid
    .map((rule) => {
      const id = rule.id.trim();
      const status = rule.status === 'Disabled' ? 'Disabled' : 'Enabled';
      const parts = [
        `    <ID>${escapeXml(id)}</ID>`,
        `    <Status>${status}</Status>`,
      ];

      parts.push(...buildFilterParts(rule.prefix));

      if (rule.expirationDays != null && rule.expirationDays !== '') {
        parts.push(`    <Expiration><Days>${Number(rule.expirationDays)}</Days></Expiration>`);
      }

      if (
        rule.transitionDays != null &&
        rule.transitionDays !== '' &&
        rule.transitionStorageClass?.trim()
      ) {
        parts.push(
          '    <Transition>',
          `      <Days>${Number(rule.transitionDays)}</Days>`,
          `      <StorageClass>${escapeXml(rule.transitionStorageClass.trim())}</StorageClass>`,
          '    </Transition>',
        );
      }

      if (rule.abortIncompleteDays != null && rule.abortIncompleteDays !== '') {
        parts.push(
          '    <AbortIncompleteMultipartUpload>',
          `      <DaysAfterInitiation>${Number(rule.abortIncompleteDays)}</DaysAfterInitiation>`,
          '    </AbortIncompleteMultipartUpload>',
        );
      }

      const hasAction =
        (rule.expirationDays != null && rule.expirationDays !== '') ||
        (rule.transitionDays != null &&
          rule.transitionDays !== '' &&
          rule.transitionStorageClass?.trim()) ||
        (rule.abortIncompleteDays != null && rule.abortIncompleteDays !== '');

      if (!hasAction) {
        throw new Error(`قانون «${id}»: حداقل Expiration، Transition یا Abort multipart تنظیم کنید.`);
      }

      return `  <Rule>\n${parts.join('\n')}\n  </Rule>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<LifecycleConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">\n${rulesXml}\n</LifecycleConfiguration>`;
}

function readXmlError(doc) {
  const code = doc.querySelector('Error Code, Code')?.textContent;
  const msg = doc.querySelector('Error Message, Message')?.textContent;
  if (code || msg) throw new Error(`${code || 'Error'}: ${msg || ''}`.trim());
}

/** @param {string} xml */
export function parseLifecycleConfigurationXml(xml) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  readXmlError(doc);

  return [...doc.querySelectorAll('LifecycleConfiguration > Rule, Rule')].map((ruleEl) => {
    const id = ruleEl.querySelector('ID')?.textContent?.trim();
    if (!id) return null;

    const statusRaw = ruleEl.querySelector('Status')?.textContent?.trim();
    const prefix =
      ruleEl.querySelector('Filter Prefix')?.textContent?.trim() ||
      ruleEl.querySelector('Prefix')?.textContent?.trim() ||
      '';

    const expirationDays = ruleEl.querySelector('Expiration Days')?.textContent?.trim();
    const transitionDays = ruleEl.querySelector('Transition Days')?.textContent?.trim();
    const transitionClass = ruleEl.querySelector('Transition StorageClass')?.textContent?.trim();
    const abortDays = ruleEl
      .querySelector('AbortIncompleteMultipartUpload DaysAfterInitiation')
      ?.textContent?.trim();

    const rule = {
      id,
      status: statusRaw === 'Disabled' ? 'Disabled' : 'Enabled',
    };
    if (prefix) rule.prefix = prefix;
    if (expirationDays != null && expirationDays !== '') {
      rule.expirationDays = Number(expirationDays);
    }
    if (transitionDays != null && transitionDays !== '' && transitionClass) {
      rule.transitionDays = Number(transitionDays);
      rule.transitionStorageClass = transitionClass;
    }
    if (abortDays != null && abortDays !== '') {
      rule.abortIncompleteDays = Number(abortDays);
    }
    return rule;
  }).filter(Boolean);
}
