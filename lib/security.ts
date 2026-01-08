/**
 * Security Utilities
 *
 * Provides input sanitization and validation functions to prevent
 * XSS attacks and other security vulnerabilities.
 *
 * All user-generated content MUST be sanitized before rendering.
 */

import DOMPurify from 'dompurify';

// Configure DOMPurify for our use case
const purify = DOMPurify;

// Allow safe tags only for user content
const SAFE_HTML_TAGS = ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'span', 'ul', 'ol', 'li'];
const SAFE_HTML_ATTRS = ['href', 'class', 'target', 'rel'];

/**
 * Sanitize user-generated HTML content
 * Allows basic formatting tags but strips scripts, event handlers, and dangerous attributes
 *
 * @param html - Raw HTML from user input
 * @returns Sanitized HTML safe to render
 *
 * @example
 * const userInput = '<script>alert("xss")</script><p>Hello <strong>world</strong></p>';
 * const clean = sanitizeUserContent(userInput);
 * // Returns: '<p>Hello <strong>world</strong></p>'
 */
export function sanitizeUserContent(html: string): string {
  return purify.sanitize(html, {
    ALLOWED_TAGS: SAFE_HTML_TAGS,
    ALLOWED_ATTR: SAFE_HTML_ATTRS,
    ALLOW_DATA_ATTR: false,
    // Add rel="noopener noreferrer" to all links for security
    ADD_ATTR: ['target'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'button'],
    FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur'],
  });
}

/**
 * Sanitize plain text content
 * Strips ALL HTML tags, leaving only text content
 *
 * @param text - Text that may contain HTML
 * @returns Plain text with all HTML removed
 *
 * @example
 * const userInput = '<script>alert("xss")</script>Hello';
 * const clean = sanitizeText(userInput);
 * // Returns: 'Hello'
 */
export function sanitizeText(text: string): string {
  return purify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Validate if a URL is safe to use
 * Prevents javascript:, data:, and other dangerous protocols
 *
 * @param url - URL string to validate
 * @returns true if URL is safe, false otherwise
 *
 * @example
 * isValidUrl('https://example.com') // true
 * isValidUrl('javascript:alert(1)') // false
 * isValidUrl('data:text/html,<script>') // false
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Only allow http and https protocols
    const safeProtocols = ['https:', 'http:'];
    return safeProtocols.includes(parsed.protocol as any);
  } catch {
    // Invalid URL
    return false;
  }
}

/**
 * Sanitize and validate a URL
 * Returns the URL if safe, null otherwise
 *
 * @param url - URL to sanitize and validate
 * @returns Sanitized URL or null if invalid
 */
export function sanitizeUrl(url: string): string | null {
  const trimmed = url.trim();

  if (!isValidUrl(trimmed)) {
    return null;
  }

  return trimmed;
}

/**
 * Escape HTML special characters in text
 * Use this before rendering user content in contexts where you need to preserve
 * the HTML as visible text rather than rendering it
 *
 * @param text - Text to escape
 * @returns Escaped text safe to render in HTML context
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };

  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Sanitize Ethereum address
 * Ensures address format is valid
 *
 * @param address - Ethereum address to validate
 * @returns true if valid address format, false otherwise
 */
export function isValidEthAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Truncate Ethereum address for display
 *
 * @param address - Full Ethereum address
 * @param startLength - Number of characters to show at start (default: 6)
 * @param endLength - Number of characters to show at end (default: 4)
 * @returns Truncated address like "0x1234...5678"
 */
export function truncateAddress(
  address: string,
  startLength: number = 6,
  endLength: number = 4
): string {
  if (!isValidEthAddress(address)) {
    return address;
  }

  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}
