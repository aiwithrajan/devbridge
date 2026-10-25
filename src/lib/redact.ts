// Redaction utility per PRD §7.2:
// Matches and redacts API keys, tokens, connection strings, and secrets before LLM ingestion or display.

const SECRET_PATTERNS = [
  // JWT Tokens
  /eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g,
  // Bearer tokens
  /Bearer\s+[a-zA-Z0-9_\-\.]{20,}/gi,
  // Generic API Keys (e.g. sk-..., key-..., fl-...)
  /(?:api[_-]?key|secret|token|password|auth)['"]?\s*[:=]\s*['"]([a-zA-Z0-9_\-\.]{16,})['"]/gi,
  // Database connection strings
  /(?:postgres|postgresql|mysql|mongodb|redis):\/\/[^\s"']+/gi,
  // Private keys
  /-----BEGIN [A-Z ]+ PRIVATE KEY-----[^-]+-----END [A-Z ]+ PRIVATE KEY-----/gs,
];

export function redactSecrets(input: string): string {
  if (!input) return "";
  let redacted = input;

  for (const pattern of SECRET_PATTERNS) {
    redacted = redacted.replace(pattern, (match) => {
      if (match.startsWith("Bearer ")) {
        return "Bearer «redacted»";
      }
      return "«redacted»";
    });
  }

  return redacted;
}
