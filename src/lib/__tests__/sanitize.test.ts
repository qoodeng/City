import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from '../sanitize';

describe('sanitizeHtml', () => {
  it('should add rel="noopener noreferrer" to target="_blank" links', () => {
    const input = '<a href="http://example.com" target="_blank">Link</a>';
    const output = sanitizeHtml(input);
    expect(output).toContain('rel="noopener noreferrer"');
  });

  it('should handle target attribute case insensitively', () => {
    const input = '<a href="http://example.com" target="_BLANK">Link</a>';
    const output = sanitizeHtml(input);
    expect(output).toContain('rel="noopener noreferrer"');
  });

  it('should add rel="noopener noreferrer" to named targets', () => {
    const input = '<a href="http://example.com" target="my-frame">Link</a>';
    const output = sanitizeHtml(input);
    expect(output).toContain('rel="noopener noreferrer"');
  });

  it('should preserve existing rel attributes', () => {
    const input = '<a href="http://example.com" target="_blank" rel="nofollow">Link</a>';
    const output = sanitizeHtml(input);
    // We expect existing rel to be preserved and new values appended
    expect(output).toContain('rel="nofollow noopener noreferrer"');
  });

  it('should ensure both noopener and noreferrer are present', () => {
    const input = '<a href="http://example.com" target="_blank" rel="noopener">Link</a>';
    const output = sanitizeHtml(input);
    expect(output).toContain('noopener');
    expect(output).toContain('noreferrer');
  });

  it('should not add rel to target="_self"', () => {
    const input = '<a href="http://example.com" target="_self">Link</a>';
    const output = sanitizeHtml(input);
    // target="_self" does not open new window, so no need for noopener
    // However, if the implementation adds it to all targets except... wait.
    // If I implement exclusion list, it won't be there.
    expect(output).not.toContain('noopener');
    expect(output).not.toContain('noreferrer');
  });

  it('should allow normal links', () => {
    const input = '<a href="http://example.com">Link</a>';
    const output = sanitizeHtml(input);
    expect(output).toContain('href="http://example.com"');
  });

  it('should strip script tags', () => {
    const input = '<script>alert("xss")</script>';
    const output = sanitizeHtml(input);
    expect(output).not.toContain('<script>');
  });
});
