import { describe, it, expect } from 'vitest'
import { findCurrentEntry, findNextEntry, sortedRotation, getInitials, formatDutyDate } from '../../client/composables/useCiDuty.js'

function entry(lead, workgroup, startDate, endDate) {
  return { lead, workgroup, startDate, endDate }
}

const TODAY = '2026-09-16'

describe('findCurrentEntry', () => {
  it('matches on the exact start date', () => {
    const e = entry('A', 'CaaS', '2026-09-16', '2026-09-22')
    expect(findCurrentEntry([e], TODAY)).toBe(e)
  })

  it('matches on the exact end date', () => {
    const e = entry('A', 'CaaS', '2026-09-10', '2026-09-16')
    expect(findCurrentEntry([e], TODAY)).toBe(e)
  })

  it('does not match the day before start', () => {
    const e = entry('A', 'CaaS', '2026-09-17', '2026-09-22')
    expect(findCurrentEntry([e], TODAY)).toBeNull()
  })

  it('does not match the day after end', () => {
    const e = entry('A', 'CaaS', '2026-09-01', '2026-09-15')
    expect(findCurrentEntry([e], TODAY)).toBeNull()
  })

  it('returns null in a gap between two entries', () => {
    const before = entry('A', 'CaaS', '2026-09-01', '2026-09-10')
    const after = entry('B', 'CaaS', '2026-09-20', '2026-09-25')
    expect(findCurrentEntry([before, after], TODAY)).toBeNull()
  })

  it('returns null before the first entry', () => {
    const e = entry('A', 'CaaS', '2026-10-01', '2026-10-07')
    expect(findCurrentEntry([e], TODAY)).toBeNull()
  })

  it('returns null after the last entry', () => {
    const e = entry('A', 'CaaS', '2026-08-01', '2026-08-07')
    expect(findCurrentEntry([e], TODAY)).toBeNull()
  })

  it('returns null for an empty roster', () => {
    expect(findCurrentEntry([], TODAY)).toBeNull()
  })

  it('prefers the entry with the latest startDate among overlapping matches', () => {
    const older = entry('A', 'CaaS', '2026-09-01', '2026-09-20')
    const newer = entry('B', 'Networking', '2026-09-10', '2026-09-18')
    expect(findCurrentEntry([older, newer], TODAY)).toBe(newer)
  })
})

describe('findNextEntry', () => {
  it('returns the entry with the earliest future startDate', () => {
    const soon = entry('A', 'CaaS', '2026-09-23', '2026-09-29')
    const later = entry('B', 'CaaS', '2026-09-30', '2026-10-06')
    expect(findNextEntry([later, soon], TODAY)).toBe(soon)
  })

  it('excludes the current entry', () => {
    const current = entry('A', 'CaaS', '2026-09-16', '2026-09-22')
    expect(findNextEntry([current], TODAY)).toBeNull()
  })

  it('returns null when today is after the last known entry (no next duty)', () => {
    const past = entry('A', 'CaaS', '2026-08-01', '2026-08-07')
    expect(findNextEntry([past], TODAY)).toBeNull()
  })

  it('returns null for an empty roster', () => {
    expect(findNextEntry([], TODAY)).toBeNull()
  })
})

describe('sortedRotation', () => {
  it('sorts entries by startDate ascending', () => {
    const late = entry('B', 'CaaS', '2026-09-30', '2026-10-06')
    const early = entry('A', 'CaaS', '2026-09-01', '2026-09-07')
    expect(sortedRotation([late, early])).toEqual([early, late])
  })

  it('does not mutate the input array', () => {
    const original = [entry('B', 'CaaS', '2026-09-30', '2026-10-06'), entry('A', 'CaaS', '2026-09-01', '2026-09-07')]
    const copy = [...original]
    sortedRotation(original)
    expect(original).toEqual(copy)
  })
})

describe('getInitials', () => {
  it('takes the first letter of the first and last word', () => {
    expect(getInitials('Riccardo Piccoli')).toBe('RP')
  })

  it('handles a single-word name', () => {
    expect(getInitials('Cher')).toBe('CH')
  })

  it('handles a missing name', () => {
    expect(getInitials('')).toBe('?')
    expect(getInitials(null)).toBe('?')
  })

  it('handles names with more than two words by using first and last', () => {
    expect(getInitials('Mary Jane Watson')).toBe('MW')
  })
})

describe('formatDutyDate', () => {
  it('formats a YYYY-MM-DD string without a timezone-dependent day shift', () => {
    expect(formatDutyDate('2026-09-16')).toBe('Sep 16, 2026')
  })

  it('handles a missing date', () => {
    expect(formatDutyDate(null)).toBe('—')
  })
})
