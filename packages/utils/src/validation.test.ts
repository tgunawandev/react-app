import { describe, it, expect } from 'vitest';
import { isEmail, isUrl, isEmpty, isNumeric, isAlphanumeric } from './validation';

describe('isEmail', () => {
  it('should return true for valid emails', () => {
    expect(isEmail('test@example.com')).toBe(true);
    expect(isEmail('user.name@domain.org')).toBe(true);
  });

  it('should return false for invalid emails', () => {
    expect(isEmail('invalid')).toBe(false);
    expect(isEmail('missing@')).toBe(false);
    expect(isEmail('@nodomain.com')).toBe(false);
  });
});

describe('isUrl', () => {
  it('should return true for valid URLs', () => {
    expect(isUrl('https://example.com')).toBe(true);
    expect(isUrl('http://localhost:3000')).toBe(true);
  });

  it('should return false for invalid URLs', () => {
    expect(isUrl('not-a-url')).toBe(false);
    expect(isUrl('example.com')).toBe(false);
  });
});

describe('isEmpty', () => {
  it('should return true for empty values', () => {
    expect(isEmpty(null)).toBe(true);
    expect(isEmpty(undefined)).toBe(true);
    expect(isEmpty('')).toBe(true);
    expect(isEmpty('   ')).toBe(true);
    expect(isEmpty([])).toBe(true);
    expect(isEmpty({})).toBe(true);
  });

  it('should return false for non-empty values', () => {
    expect(isEmpty('hello')).toBe(false);
    expect(isEmpty([1, 2, 3])).toBe(false);
    expect(isEmpty({ key: 'value' })).toBe(false);
  });
});

describe('isNumeric', () => {
  it('should return true for numeric strings', () => {
    expect(isNumeric('123')).toBe(true);
    expect(isNumeric('0')).toBe(true);
  });

  it('should return false for non-numeric strings', () => {
    expect(isNumeric('abc')).toBe(false);
    expect(isNumeric('12.34')).toBe(false);
    expect(isNumeric('12a')).toBe(false);
  });
});

describe('isAlphanumeric', () => {
  it('should return true for alphanumeric strings', () => {
    expect(isAlphanumeric('abc123')).toBe(true);
    expect(isAlphanumeric('ABC')).toBe(true);
  });

  it('should return false for non-alphanumeric strings', () => {
    expect(isAlphanumeric('abc-123')).toBe(false);
    expect(isAlphanumeric('hello world')).toBe(false);
  });
});
