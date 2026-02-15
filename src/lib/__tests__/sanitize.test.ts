import { describe, it, expect } from "vitest";
import {
  sanitizeHtml,
  escapeFts5Query,
  escapeLikePattern,
  parsePaginationInt,
} from "../sanitize";

describe("sanitizeHtml", () => {
  it("allows basic formatting tags", () => {
    const html = "<p><strong>Bold</strong> and <em>Italic</em></p>";
    expect(sanitizeHtml(html)).toBe(html);
  });

  it("allows specific attributes", () => {
    const html = '<a href="https://example.com" target="_blank" rel="noopener" class="link">Link</a>';
    expect(sanitizeHtml(html)).toBe(html);
  });

  it("strips disallowed tags", () => {
    const html = "<script>alert('xss')</script><p>Content</p>";
    expect(sanitizeHtml(html)).toBe("<p>Content</p>");
  });

  it("strips disallowed attributes", () => {
    const html = '<p onclick="alert(\'xss\')">Content</p>';
    expect(sanitizeHtml(html)).toBe("<p>Content</p>");
  });

  it("handles complex nested structures", () => {
    const html = "<div><ul><li>Item 1</li><li>Item 2</li></ul></div>";
    expect(sanitizeHtml(html)).toBe(html);
  });

  it("allows specific heading tags", () => {
    const html = "<h1>Title</h1><h2>Subtitle</h2>";
    expect(sanitizeHtml(html)).toBe(html);
  });

  it("allows blockquote, pre, and code tags", () => {
      const html = "<blockquote>Quote</blockquote><pre><code>code</code></pre>";
      expect(sanitizeHtml(html)).toBe(html);
  });
});

describe("escapeFts5Query", () => {
  it("strips special FTS5 characters", () => {
    const input = 'search* "term" (group) {brace} [bracket] ^carrot :colon';
    // Expect special chars to be removed and tokens to be quoted
    // "search term group brace bracket carrot colon"
    expect(escapeFts5Query(input)).toBe('"search" "term" "group" "brace" "bracket" "carrot" "colon"');
  });

  it("splits and quotes multiple tokens", () => {
    const input = "hello world";
    expect(escapeFts5Query(input)).toBe('"hello" "world"');
  });

  it("handles empty input", () => {
    expect(escapeFts5Query("")).toBe('""');
    expect(escapeFts5Query("   ")).toBe('""');
  });

  it("handles input with only special characters", () => {
    expect(escapeFts5Query("*(){}")).toBe('""');
  });
});

describe("escapeLikePattern", () => {
  it("escapes % and _ and \\", () => {
    expect(escapeLikePattern("100%")).toBe("100\\%");
    expect(escapeLikePattern("user_name")).toBe("user\\_name");
    expect(escapeLikePattern("C:\\Path")).toBe("C:\\\\Path");
  });

  it("returns string unchanged if no special chars", () => {
    expect(escapeLikePattern("simple string")).toBe("simple string");
  });
});

describe("parsePaginationInt", () => {
  it("parses valid integer within range", () => {
    expect(parsePaginationInt("5", 1, 1, 10)).toBe(5);
  });

  it("returns default value for invalid input", () => {
    expect(parsePaginationInt("abc", 1, 1, 10)).toBe(1);
    expect(parsePaginationInt(null, 1, 1, 10)).toBe(1);
    // @ts-expect-error Testing undefined input
    expect(parsePaginationInt(undefined, 1, 1, 10)).toBe(1);
  });

  it("clamps value to min", () => {
    expect(parsePaginationInt("0", 1, 1, 10)).toBe(1);
    expect(parsePaginationInt("-5", 1, 1, 10)).toBe(1);
  });

  it("clamps value to max", () => {
    expect(parsePaginationInt("15", 1, 1, 10)).toBe(10);
    expect(parsePaginationInt("100", 1, 1, 10)).toBe(10);
  });
});
