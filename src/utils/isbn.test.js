import { describe, expect, it } from 'vitest';
import { formatIsbn, isValidIsbn, toIsbn13 } from './isbn.js';

describe('isbn utils', () => {
  it('validates ISBN-13', () => {
    expect(isValidIsbn('978-0-306-40615-7')).toBe(true);
    expect(isValidIsbn('9780306406157')).toBe(true);
  });

  it('rejects invalid checksum', () => {
    expect(isValidIsbn('9780306406150')).toBe(false);
  });

  it('normalizes ISBN-10 to ISBN-13', () => {
    expect(toIsbn13('0306406152')).toBe('9780306406157');
  });

  it('formats ISBN-13 for display', () => {
    expect(formatIsbn('9780306406157')).toBe('978-0-30640-615-7');
  });
});
