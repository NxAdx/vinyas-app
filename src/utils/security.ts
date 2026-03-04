function xorText(text: string, key: string): string {
  if (!key.length) {
    return text;
  }

  const keyLength = key.length;
  let output = '';

  for (let i = 0; i < text.length; i += 1) {
    const textCode = text.charCodeAt(i);
    const keyCode = key.charCodeAt(i % keyLength);
    output += String.fromCharCode(textCode ^ keyCode);
  }

  return output;
}

function toHex(text: string): string {
  return Array.from(text)
    .map((char) => char.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('');
}

function fromHex(hex: string): string {
  let output = '';
  for (let i = 0; i < hex.length; i += 2) {
    output += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
  }
  return output;
}

export function hashPasscode(passcode: string): string {
  let hash = 0;
  for (let i = 0; i < passcode.length; i += 1) {
    hash = (hash << 5) - hash + passcode.charCodeAt(i);
    hash |= 0;
  }
  return `h${Math.abs(hash).toString(16)}`;
}

export function encryptPayload(payload: string, passcodeHash: string): string {
  return toHex(xorText(payload, passcodeHash));
}

export function decryptPayload(encrypted: string, passcodeHash: string): string {
  return xorText(fromHex(encrypted), passcodeHash);
}
