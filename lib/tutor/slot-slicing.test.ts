import { describe, expect, it } from 'vitest'
import { sliceIntoBookableStarts } from './slot-slicing'

describe('sliceIntoBookableStarts', () => {
  it('returns no starts for an empty window list', () => {
    expect(sliceIntoBookableStarts([], 45)).toEqual([])
  })

  it('slices a 2-hour window into 45-minute starts, dropping the trailing remainder', () => {
    const result = sliceIntoBookableStarts(
      [{ slotStart: '2026-09-01T09:00:00.000Z', slotEnd: '2026-09-01T11:00:00.000Z' }],
      45,
    )
    expect(result).toEqual(['2026-09-01T09:00:00.000Z', '2026-09-01T09:45:00.000Z'])
  })

  it('drops a window shorter than the session duration entirely', () => {
    const result = sliceIntoBookableStarts(
      [{ slotStart: '2026-09-01T09:00:00.000Z', slotEnd: '2026-09-01T09:30:00.000Z' }],
      45,
    )
    expect(result).toEqual([])
  })

  it('slices each window independently, not concatenated', () => {
    const result = sliceIntoBookableStarts(
      [
        { slotStart: '2026-09-01T09:00:00.000Z', slotEnd: '2026-09-01T10:00:00.000Z' },
        { slotStart: '2026-09-02T14:00:00.000Z', slotEnd: '2026-09-02T15:00:00.000Z' },
      ],
      45,
    )
    expect(result).toEqual(['2026-09-01T09:00:00.000Z', '2026-09-02T14:00:00.000Z'])
  })
})
