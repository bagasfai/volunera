import { describe, expect, it } from 'vitest'
import { safeNextPath } from './safe-redirect'

describe('safeNextPath', () => {
  it('allows a plain relative path', () => {
    expect(safeNextPath('/dashboard')).toBe('/dashboard')
  })

  it('allows a relative path with a query string', () => {
    expect(safeNextPath('/dashboard?tab=sessions')).toBe('/dashboard?tab=sessions')
  })

  it('falls back when next is missing', () => {
    expect(safeNextPath(null)).toBe('/dashboard')
    expect(safeNextPath(undefined)).toBe('/dashboard')
    expect(safeNextPath('')).toBe('/dashboard')
  })

  it('rejects an absolute URL', () => {
    expect(safeNextPath('https://evil.example/steal')).toBe('/dashboard')
  })

  it('rejects a protocol-relative URL', () => {
    expect(safeNextPath('//evil.example/steal')).toBe('/dashboard')
  })

  it('rejects a backslash-prefixed path, which some browsers normalise to //', () => {
    expect(safeNextPath('/\\evil.example')).toBe('/dashboard')
    expect(safeNextPath('\\\\evil.example')).toBe('/dashboard')
  })

  it('rejects a path containing CR or LF', () => {
    expect(safeNextPath('/dashboard\r\nSet-Cookie: x=1')).toBe('/dashboard')
  })

  it('rejects a path with an embedded tab, which the WHATWG URL parser strips anywhere in the string — "/\\t/evil.example" collapses to the protocol-relative "//evil.example" once a browser parses it', () => {
    expect(safeNextPath('/\t/evil.example')).toBe('/dashboard')
  })

  it('rejects a scheme-relative javascript URI', () => {
    expect(safeNextPath('javascript:alert(1)')).toBe('/dashboard')
  })

  it('honours a custom fallback', () => {
    expect(safeNextPath('https://evil.example', '/login')).toBe('/login')
  })
})
