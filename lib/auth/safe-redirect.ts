/**
 * Constrains a user-supplied `next` parameter to a same-origin relative path.
 *
 * Without this the auth callback is an open redirect: an attacker sends
 * /auth/callback?next=https://evil.example and the victim lands there
 * already signed in.
 */
export function safeNextPath(
  next: string | null | undefined,
  fallback = '/dashboard',
): string {
  if (!next) return fallback
  // The WHATWG URL parser strips ASCII tab and newline characters from
  // anywhere in the string before parsing, not just from the edges. That
  // means "/\t/evil.example" is parsed by a browser as "//evil.example" —
  // a protocol-relative URL — which a check that only inspects the raw
  // prefix would miss. Reject tabs and CR/LF outright, both to close that
  // bypass and to block header-injection payloads riding along in `next`.
  if (/[\t\r\n]/.test(next)) return fallback
  if (!next.startsWith('/')) return fallback
  // `//host` is protocol-relative; `/\host` is normalised to `//host` by
  // several browsers. Both leave the origin.
  if (next.startsWith('//') || next.startsWith('/\\')) return fallback
  return next
}
