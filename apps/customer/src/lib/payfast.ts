import crypto from 'crypto';

/**
 * Generate PayFast MD5 signature
 * Parameters are sorted alphabetically, formatted into a query string,
 * appended with the passphrase, and hashed using MD5.
 */
export function generatePayfastSignature(data: Record<string, string>, passphrase?: string): string {
  // Sort parameters alphabetically
  const sortedKeys = Object.keys(data).sort();

  // Create query string. PayFast expects parameters to be encoded correctly
  const pfParamString = sortedKeys
    .map((key) => {
      // PayFast expects spaces as '+' instead of '%20'
      const val = encodeURIComponent(data[key] || '')
        .replace(/%20/g, '+')
        .replace(/%21/g, '!')
        .replace(/%27/g, "'")
        .replace(/%28/g, '(')
        .replace(/%29/g, ')')
        .replace(/%2A/g, '*');
      return `${key}=${val}`;
    })
    .join('&');

  let finalString = pfParamString;
  if (passphrase) {
    // PayFast expects the passphrase to be appended and also encoded if it contains special characters
    const encodedPass = encodeURIComponent(passphrase)
      .replace(/%20/g, '+')
      .replace(/%21/g, '!')
      .replace(/%27/g, "'")
      .replace(/%28/g, '(')
      .replace(/%29/g, ')')
      .replace(/%2A/g, '*');
    finalString += `&passphrase=${encodedPass}`;
  }

  const hash = crypto.createHash('md5').update(finalString).digest('hex');
  return hash;
}
