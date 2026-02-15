const { sanitizeHtml } = require('./src/lib/sanitize.ts');

try {
  const clean = sanitizeHtml('<script>alert(1)</script><p>Hello</p>');
  console.log('Sanitized:', clean);
} catch (e) {
  console.error('Error:', e);
  process.exit(1);
}
