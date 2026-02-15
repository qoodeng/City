import DOMPurify from "dompurify";

let sanitizer: ReturnType<typeof DOMPurify> | null = null;

function getSanitizer() {
  if (sanitizer) return sanitizer;

  if (typeof window === "undefined") {
    // Server-side: use JSDOM if available, or a no-op/basic sanitizer.
    // Since we can't easily import JSDOM in client builds, we rely on
    // conditional logic or a separate server-only module.
    // For now, we return a simple mock if JSDOM is missing to prevent crashes.
    try {
      // Use dynamic require to avoid bundling issues
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const jsdom = require("jsdom");
      const { JSDOM } = jsdom;
      sanitizer = DOMPurify(new JSDOM("").window as unknown as Window);
    } catch {
      // Fallback: minimal sanitizer or throw?
      // For security, if we can't sanitize properly on server, we should probably
      // be very careful. But since this is likely just for initial render (SSR),
      // returning empty string or the input (risky!) is an option.
      // However, DOMPurify factory might work without window in recent versions? No.
      // If we are here, we are likely in a test environment or SSR without jsdom installed in deps.
      // Given the constraints, we will assume client-side sanitization is key.
      // But to avoid crashes, we return a dummy object if creation fails.
      // Wait, let's try to initialize it only if we can.
      // Actually, standard DOMPurify works in browser.
      // In Node, it is a factory.
      if (typeof DOMPurify === "function") {
         // It's the factory. We need a window.
         // If we can't get one, we can't sanitize.
         // We'll return a safe default: empty string?
         sanitizer = {
           sanitize: () => "",
           addHook: () => {},
         } as unknown as ReturnType<typeof DOMPurify>;
      } else {
        // It's already an instance (some environments?)
        sanitizer = DOMPurify;
      }
    }
  } else {
    // Client-side: use the default export which is the instance (or factory initialized with window)
    // DOMPurify 3.x exports a factory, but if window exists, it might auto-init?
    // Let's check.
    if (typeof DOMPurify === "function") {
      sanitizer = DOMPurify(window);
    } else {
      sanitizer = DOMPurify;
    }
  }

  // Configure the hook
  if (sanitizer && sanitizer.addHook) {
    // Remove existing hooks to avoid duplication if called multiple times (though we cache sanitizer)
    sanitizer.removeHook("afterSanitizeAttributes");

    sanitizer.addHook("afterSanitizeAttributes", (node) => {
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
  }

  return sanitizer;
}


/**
 * Sanitize HTML for safe rendering via dangerouslySetInnerHTML.
 * Allows basic formatting tags from TipTap but strips scripts, event handlers, etc.
 */
export function sanitizeHtml(dirty: string): string {
  const s = getSanitizer();
  return s.sanitize(dirty, {
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
