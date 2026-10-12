import { describe, it, expect, vi } from 'vitest'

/**
 * INV-104 — the basics asked before the design: names or a title, date, time,
 * the event's own timezone and a place. Every check against "now" goes through
 * the event's zone, never the browser's, and the payload carries the wall
 * clock and the zone separately so the server derives the instant.
 */

vi.mock('@/services/auth.service', () => ({ getUsername: () => null }))

const {
  DEFAULT_TIMEZONE, zonedWallClockToEpoch, epochToZonedWallClock, isPastInZone,
  validateBasics, normalizeBasics, basicsToInvitationInfo, basicsDisplayName,
  rsvpDeadlineProblem, isValidTimeZone, usesCoupleNames, hasBasics,
} = await import('@/utils/eventBasics')
const { buildEventFullPayload } = await import('@/utils/buildEventFullPayload')

const wedding = {
  brideName: 'Ана', groomName: 'Марко', title: '',
  date: '2027-06-12', time: '17:30', timezone: 'Europe/Skopje',
  location: { name: 'Хотел Александар Палас', address: 'Скопје' },
}

describe('wall clock in the event zone', () => {
  it('is the instant of that wall clock in Skopje, summer and winter', () => {
    // CEST (UTC+2) in June, CET (UTC+1) in January.
    expect(zonedWallClockToEpoch('2027-06-12', '17:30', 'Europe/Skopje')).toBe(Date.UTC(2027, 5, 12, 15, 30))
    expect(zonedWallClockToEpoch('2027-01-15', '17:30', 'Europe/Skopje')).toBe(Date.UTC(2027, 0, 15, 16, 30))
  })

  it('is a different instant for the same wall clock in another zone', () => {
    expect(zonedWallClockToEpoch('2027-01-15', '18:00', 'America/New_York')).toBe(Date.UTC(2027, 0, 15, 23, 0))
  })

  it('round-trips an instant to the wall clock where the event is', () => {
    const start = new Date(Date.UTC(2027, 5, 12, 15, 30)).toISOString()
    expect(epochToZonedWallClock(start, 'Europe/Skopje')).toBe('2027-06-12T17:30:00')
    expect(epochToZonedWallClock(start, 'Europe/London')).toBe('2027-06-12T16:30:00')
  })

  it('decides "in the past" in the event zone, not the browser one', () => {
    // 20:30 UTC: 22:30 in Skopje, 16:30 in New York.
    const now = Date.UTC(2027, 5, 12, 20, 30)
    expect(isPastInZone('2027-06-12', '21:00', 'Europe/Skopje', now)).toBe(true)
    expect(isPastInZone('2027-06-12', '21:00', 'America/New_York', now)).toBe(false)
  })

  it('accepts IANA regions only — a fixed offset has no daylight saving', () => {
    expect(isValidTimeZone('Europe/Skopje')).toBe(true)
    expect(isValidTimeZone('+02:00')).toBe(false)
    expect(isValidTimeZone('Mars/Olympus')).toBe(false)
    expect(isValidTimeZone('')).toBe(false)
  })
})

describe('validating the basics', () => {
  const before = Date.UTC(2027, 0, 1)

  it('accepts a complete wedding', () => {
    expect(validateBasics(wedding, 'WEDDING', before)).toEqual({})
    expect(hasBasics(wedding, 'WEDDING')).toBe(true)
  })

  it('asks a couple for both names and anything else for a title', () => {
    expect(usesCoupleNames('WEDDING')).toBe(true)
    expect(usesCoupleNames('BIRTHDAY')).toBe(false)
    const errors = validateBasics({ ...wedding, groomName: ' ' }, 'WEDDING', before)
    expect(Object.keys(errors)).toEqual(['groomName'])

    const birthday = { ...wedding, brideName: '', groomName: '', title: '' }
    expect(Object.keys(validateBasics(birthday, 'BIRTHDAY', before))).toEqual(['title'])
    expect(validateBasics({ ...birthday, title: 'Мила 30' }, 'BIRTHDAY', before)).toEqual({})
  })

  it('requires date, time, a valid zone and a venue', () => {
    const errors = validateBasics({ ...wedding, date: '', time: '', timezone: 'Nope/Nope', location: { name: '' } }, 'WEDDING', before)
    expect(Object.keys(errors).sort()).toEqual(['date', 'location', 'time', 'timezone'])
  })

  it('refuses a start that has passed where the event is', () => {
    const now = Date.UTC(2027, 5, 12, 16, 0) // 18:00 in Skopje
    expect(validateBasics(wedding, 'WEDDING', now).date).toBe('onboarding.eventBasics.errors.past')
    expect(validateBasics({ ...wedding, timezone: 'America/New_York' }, 'WEDDING', now)).toEqual({})
  })

  it('reads the older saved shape (location as text, no time or zone)', () => {
    const old = normalizeBasics({ brideName: 'Ана', groomName: 'Марко', date: '2027-06-12', location: 'Охрид' })
    expect(old.location).toEqual({ name: 'Охрид', address: '' })
    expect(old.timezone).toBe(DEFAULT_TIMEZONE)
    expect(old.time).toBe('')
  })
})

describe('basics in the invitation', () => {
  it('becomes the editor info block with the wall clock and the zone', () => {
    expect(basicsToInvitationInfo(wedding, 'WEDDING')).toEqual({
      brideName: 'Ана',
      groomName: 'Марко',
      weddingDateTime: '2027-06-12T17:30:00',
      eventTimezone: 'Europe/Skopje',
      venue: 'Хотел Александар Палас',
      location: 'Скопје',
    })
    expect(basicsDisplayName(wedding, 'WEDDING')).toBe('Ана & Марко')
  })

  it('puts a title where the names go, with no second name', () => {
    const info = basicsToInvitationInfo({ ...wedding, title: 'Мила 30' }, 'BIRTHDAY')
    expect(info.brideName).toBe('Мила 30')
    expect(info.groomName).toBe('')
  })

  it('sends date, time and zone separately, with the chosen category', () => {
    const payload = buildEventFullPayload({
      config: {
        brideName: 'Мила 30', groomName: '', weddingDateTime: '2027-06-12T17:30:00',
        eventTimezone: 'Europe/Skopje', venue: 'Клуб', location: '',
      },
      categoryType: 'BIRTHDAY',
      typeCode: 'BIRTHDAY_ADULT',
      timezone: 'Europe/Skopje',
      sectionOrder: [], sectionVisibility: {}, sectionLayouts: {},
    })
    expect(payload).toMatchObject({
      name: 'Мила 30',
      categoryType: 'BIRTHDAY',
      typeCode: 'BIRTHDAY_ADULT',
      date: '2027-06-12',
      time: '17:30',
      timezone: 'Europe/Skopje',
    })
  })

  it('keeps the couple name and the wedding default for older callers', () => {
    const payload = buildEventFullPayload({
      config: { brideName: 'Ана', groomName: 'Марко', weddingDateTime: '2027-06-12' },
      sectionOrder: [], sectionVisibility: {}, sectionLayouts: {},
    })
    expect(payload.name).toBe('Ана & Марко')
    expect(payload.categoryType).toBe('WEDDING')
    expect(payload.timezone).toBe('Europe/Skopje')
    expect(payload).not.toHaveProperty('time')
  })
})

describe('the RSVP deadline in the event zone', () => {
  it('is past once the end of that day has passed where the event is', () => {
    // 22:30 UTC on 1 June = 00:30 on 2 June in Skopje.
    const now = Date.UTC(2027, 5, 1, 22, 30)
    expect(rsvpDeadlineProblem('2027-06-01', '2027-06-12', '17:30', 'Europe/Skopje', now)).toBe('past')
    expect(rsvpDeadlineProblem('2027-06-01', '2027-06-12', '17:30', 'America/New_York', now)).toBe(null)
  })

  it('cannot be after the event starts', () => {
    const now = Date.UTC(2027, 0, 1)
    expect(rsvpDeadlineProblem('2027-06-13', '2027-06-12', '17:30', 'Europe/Skopje', now)).toBe('afterEvent')
    expect(rsvpDeadlineProblem('2027-06-12', '2027-06-12', '17:30', 'Europe/Skopje', now)).toBe(null)
    expect(rsvpDeadlineProblem('', '2027-06-12', '17:30', 'Europe/Skopje', now)).toBe(null)
  })
})
