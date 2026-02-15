import DOMPurify from "dompurify";

// Add a hook to ensure target="_blank" links have rel="noopener noreferrer"
// to prevent reverse tabnabbing attacks.
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A") {
    const target = node.getAttribute("target");
    if (target) {
      const t = target.toLowerCase();
      // Apply to all targets that open a new browsing context (or might),
      // excluding those that strictly stay in the same/parent/top frame.
      if (t !== "_self" && t !== "_parent" && t !== "_top") {
        const rel = node.getAttribute("rel") || "";
        const parts = rel.split(/\s+/).filter(Boolean);

        let changed = false;
        if (!parts.includes("noopener")) {
          parts.push("noopener");
          changed = true;
        }
        if (!parts.includes("noreferrer")) {
          parts.push("noreferrer");
          changed = true;
        }

        if (changed) {
          node.setAttribute("rel", parts.join(" "));
        }
      }
    }
  }
});

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
