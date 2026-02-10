import DOMPurify from "dompurify";

/**
 * Sanitize HTML for safe rendering via dangerouslySetInnerHTML.
 * Allows basic formatting tags from TipTap but strips scripts, event handlers, etc.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "u", "s", "del",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li",
      "blockquote", "pre", "code",
      "a", "mark", "span", "div",
      "hr",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "class"],
  });
}

/** Hex color regex: #RGB or #RRGGBB */
const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** Validate a string is a valid hex color. Returns the color or a fallback. */
export function sanitizeColor(color: unknown, fallback: string): string {
  if (typeof color === "string" && HEX_COLOR_RE.test(color)) {
    return color;
  }
  return fallback;
}

/**
 * Escape FTS5 special characters from user input to prevent query injection.
 * Wraps each word in double quotes to treat it as a literal phrase token.
 */
export function escapeFts5Query(input: string): string {
  // Strip characters that have special meaning in FTS5
  const cleaned = input.replace(/[*"():^{}[\]]/g, "");
  // Split on whitespace, wrap each token in quotes, join with spaces (implicit AND)
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return '""';
  return tokens.map((t) => `"${t}"`).join(" ");
}

/**
 * Escape LIKE metacharacters (%, _, \) for safe use in SQL LIKE patterns.
 */
export function escapeLikePattern(input: string): string {
  return input.replace(/[%_\\]/g, "\\$&");
}

/**
 * Parse a pagination integer from a query param string.
 * Returns the value clamped to [min, max], or the default on NaN.
 */
export function parsePaginationInt(
  value: string | null,
  defaultVal: number,
  min: number,
  max: number,
): number {
  const parsed = parseInt(value || String(defaultVal), 10);
  if (isNaN(parsed)) return defaultVal;
  return Math.max(min, Math.min(max, parsed));
}
