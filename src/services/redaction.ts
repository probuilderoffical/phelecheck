export function redactSensitiveText(input: string) {
  let text = input;

  // Preserve the type of credential signal while removing the secret value.
  text = text.replace(/\b(otp|one[- ]?time password|passcode)\s*[:=\-]?\s*\d{4,8}\b/gi, "$1 [REDACTED]");
  text = text.replace(/\b(pin)\s*[:=\-]?\s*\d{4,8}\b/gi, "$1 [REDACTED]");
  text = text.replace(/\b(cvv|cvc|security code)\s*[:=\-]?\s*\d{3,4}\b/gi, "$1 [REDACTED]");
  text = text.replace(/\b(password|passphrase)\s*[:=]\s*[^\s,;]{4,}/gi, "$1 [REDACTED]");

  // Common payment-card formatting: 13–19 digits with optional spaces/dashes.
  text = text.replace(/\b(?:\d[ -]*?){13,19}\b/g, "[REDACTED CARD NUMBER]");

  // Common long private-key/token-like values.
  text = text.replace(/\b(?:0x)?[a-f0-9]{64,128}\b/gi, "[REDACTED PRIVATE KEY]");
  text = text.replace(/\b(?:sk|pk)_[A-Za-z0-9_-]{20,}\b/g, "[REDACTED SECRET]");

  // If a seed/recovery phrase is explicitly labelled, remove the following phrase.
  text = text.replace(/\b(seed phrase|recovery phrase|wallet phrase)\s*[:=]\s*[a-z]+(?:\s+[a-z]+){5,23}/gi, "$1 [REDACTED]");

  return text;
}
