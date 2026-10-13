/**
 * Validate and normalize ISBN-10 / ISBN-13 strings.
 */

function clean(raw: string | null | undefined) {
  return String(raw ?? "").replace(/[-\s]/g, "").toUpperCase();
}

function checksum10(digits: string) {
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number(digits[i]) * (10 - i);
  }
  const check = (11 - (sum % 11)) % 11;
  const expected = check === 10 ? "X" : String(check);
  return digits[9] === expected;
}

function checksum13(digits: string) {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(digits[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return Number(digits[12]) === check;
}

export function isValidIsbn(raw: string | null | undefined) {
  const s = clean(raw);
  if (/^\d{9}[\dX]$/.test(s)) return checksum10(s);
  if (/^\d{13}$/.test(s)) return checksum13(s);
  return false;
}

export function toIsbn13(raw: string | null | undefined) {
  const s = clean(raw);
  if (!isValidIsbn(s)) return null;

  if (s.length === 13) return s;

  const body = s.slice(0, 9);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number(body[i]) * (10 - i);
  }
  const check10 = (11 - (sum % 11)) % 11;
  const isbn10 = body + (check10 === 10 ? "X" : String(check10));

  const core = "978" + isbn10.slice(0, 9);
  let sum13 = 0;
  for (let i = 0; i < 12; i++) {
    sum13 += Number(core[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const check13 = (10 - (sum13 % 10)) % 10;
  return core + String(check13);
}

export function formatIsbn(isbn13: string | null | undefined) {
  if (!isbn13 || isbn13.length !== 13) return isbn13 ?? "";
  return `${isbn13.slice(0, 3)}-${isbn13.slice(3, 4)}-${isbn13.slice(4, 9)}-${isbn13.slice(9, 12)}-${isbn13.slice(12)}`;
}

export function coverUrl(isbn13: string) {
  return `https://covers.openlibrary.org/b/isbn/${isbn13}-M.jpg`;
}
