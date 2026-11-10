const test = require('node:test');
const assert = require('node:assert/strict');
const { validateSnippet } = require('../lib/headerCode');

const validSnippet = {
  name: 'Analytics',
  type: 'JavaScript',
  location: 'HEAD',
  code: 'window.analyticsReady = true;',
  description: 'Site analytics',
  active: true
};

test('accepts a complete snippet and preserves its code', () => {
  const result = validateSnippet(validSnippet);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.value, validSnippet);
});

test('defaults new snippets to inactive with an empty description', () => {
  const { value, errors } = validateSnippet({
    name: 'Analytics',
    type: 'HTML',
    location: 'BODY_END',
    code: '<div>Analytics</div>'
  });
  assert.deepEqual(errors, []);
  assert.equal(value.active, false);
  assert.equal(value.description, '');
});

test('rejects invalid types, locations, and non-boolean status', () => {
  const { errors } = validateSnippet({
    ...validSnippet,
    type: 'SVG',
    location: 'FOOTER',
    active: 'true'
  });
  assert.equal(errors.length, 3);
});

test('rejects oversized fields and empty code', () => {
  const emptyCode = validateSnippet({ ...validSnippet, code: '  ' });
  assert.ok(emptyCode.errors.includes('Code is required.'));
  const oversized = validateSnippet({ ...validSnippet, name: 'x'.repeat(121) });
  assert.ok(oversized.errors.includes('Name must be 120 characters or fewer.'));
  const oversizedCode = validateSnippet({ ...validSnippet, code: 'x'.repeat(100001) });
  assert.ok(oversizedCode.errors.includes('Code must be 100,000 characters or fewer.'));
});

test('partial updates validate only supplied fields and reject empty updates', () => {
  assert.deepEqual(validateSnippet({ active: false }, { partial: true }).errors, []);
  assert.ok(validateSnippet({}, { partial: true }).errors.length > 0);
  assert.ok(validateSnippet({ active: 'false' }, { partial: true }).errors.length > 0);
});

test('ignores unknown fields and strips control characters from metadata', () => {
  const { value, errors } = validateSnippet({
    ...validSnippet,
    name: '\u0000 Analytics \u0007',
    isAdmin: true
  });
  assert.deepEqual(errors, []);
  assert.equal(value.name, 'Analytics');
  assert.equal('isAdmin' in value, false);
});
