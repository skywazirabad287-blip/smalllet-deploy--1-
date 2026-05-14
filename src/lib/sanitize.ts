/**
 * Input sanitization utilities
 * Prevents XSS and injection attacks
 */

const XSS_PATTERNS = [
  /<script[^>]*>[\s\S]*?<\/script>/gi,
  /<[^>]+on\w+=["']?[^"'>]+/gi,
  /javascript:/gi,
  /data:text\/html/gi,
  /expression\(/gi,
];

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string | null | undefined): string {
  if (!input) return "";

  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .replace(/`/g, "&#96;");
}

/**
 * Strip HTML tags from input
 */
export function stripHtml(input: string | null | undefined): string {
  if (!input) return "";
  return input.replace(/<[^>]*>/g, "");
}

/**
 * Check for XSS patterns in input
 */
export function containsXSS(input: string | null | undefined): boolean {
  if (!input) return false;
  return XSS_PATTERNS.some((pattern) => pattern.test(input));
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = Array.isArray(value) 
        ? value.map((item) => typeof item === "string" ? sanitizeString(item) : item)
        : sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * Validate file upload
 */
export function validateFileUpload(
  file: File,
  options: {
    maxSize?: number;        // in bytes
    allowedTypes?: string[]; // MIME types
    allowedExtensions?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const {
    maxSize = 16 * 1024 * 1024, // 16MB default
    allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"],
    allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".pdf"],
  } = options;

  if (file.size > maxSize) {
    return { valid: false, error: `File size exceeds ${maxSize / 1024 / 1024}MB limit` };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `File type ${file.type} not allowed` };
  }

  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  if (!allowedExtensions.includes(ext)) {
    return { valid: false, error: `File extension ${ext} not allowed` };
  }

  return { valid: true };
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }

  return result;
}

/**
 * Hash sensitive data (one-way)
 * Use for logging or comparison, not for passwords
 */
export async function hashSensitive(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
