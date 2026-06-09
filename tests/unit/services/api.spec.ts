import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { APIError, authAPI, clearToken, getToken, membersAPI, setToken, teamsAPI, votingAPI, healthAPI } from '@/services/api'

type FetchMockResponse = {
  ok: boolean
  status: number
  json: () => Promise<unknown>
}

const mockResponse = (body: unknown, opts: { ok?: boolean; status?: number } = {}): FetchMockResponse => ({
  ok: opts.ok ?? true,
  status: opts.status ?? (opts.ok === false ? 400 : 200),
  json: async () => body,
})

describe('services/api', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    localStorage.clear()
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    clearToken()
  })

  it('uses bearer token when present for token-authenticated requests', async () => {
    setToken('test-token')
    fetchMock.mockResolvedValueOnce(mockResponse({ sent: true }))

    await authAPI.sendMagicLink('user@example.com')

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(options.headers).toEqual(
      expect.objectContaining({
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
      })
    )
  })

  it('stores token returned from verify and clears token after logout', async () => {
    fetchMock
      .mockResolvedValueOnce(
        mockResponse({
          token: 'verified-token',
          user: { id: 'u1', email: 'user@example.com', name: 'User' },
        })
      )
      .mockResolvedValueOnce(mockResponse({ success: true }))

    const verifyResult = await authAPI.verify('user@example.com', '123456')
    expect(verifyResult.token).toBe('verified-token')
    expect(getToken()).toBe('verified-token')

    await authAPI.logout()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(getToken()).toBeNull()
  })

  it('throws APIError when API returns a non-success status', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse({ error: 'Bad request' }, { ok: false, status: 400 }))

    await expect(authAPI.getMe()).rejects.toMatchObject({
      name: 'APIError',
      status: 400,
      message: 'Bad request',
    })
  })

  it('maps teams APIs to expected endpoints and HTTP methods', async () => {
    const teamId = 'team-1'
    const memberId = 'member-1'

    const assertions = [
      { path: '/api/teams', method: undefined, body: undefined, invoke: () => teamsAPI.list() },
      { path: '/api/teams', method: undefined, body: undefined, invoke: () => teamsAPI.getTeams() },
      {
        path: '/api/teams',
        method: 'POST',
        body: JSON.stringify({ name: 'Test Team', emoji: '🍜', color: '#ffcc00' }),
        invoke: () => teamsAPI.create({ name: 'Test Team', emoji: '🍜', color: '#ffcc00' }),
      },
      {
        path: '/api/teams',
        method: 'POST',
        body: JSON.stringify({ name: 'Alias Team', emoji: '🍣', color: '#00ccff' }),
        invoke: () => teamsAPI.createTeam({ name: 'Alias Team', emoji: '🍣', color: '#00ccff' }),
      },
      { path: `/api/teams/${teamId}`, method: undefined, body: undefined, invoke: () => teamsAPI.get(teamId) },
      {
        path: `/api/teams/${teamId}`,
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Team', isHolidayMode: true }),
        invoke: () => teamsAPI.update(teamId, { name: 'Updated Team', isHolidayMode: true }),
      },
      {
        path: '/api/teams/join',
        method: 'POST',
        body: JSON.stringify({ inviteCode: 'INVITE' }),
        invoke: () => teamsAPI.join('INVITE'),
      },
      {
        path: '/api/teams/join',
        method: 'POST',
        body: JSON.stringify({ inviteCode: 'ALIAS' }),
        invoke: () => teamsAPI.joinTeam('ALIAS'),
      },
      { path: `/api/teams/${teamId}/leave`, method: 'DELETE', body: undefined, invoke: () => teamsAPI.leave(teamId) },
      {
        path: `/api/teams/${teamId}/members`,
        method: undefined,
        body: undefined,
        invoke: () => teamsAPI.getMembers(teamId),
      },
      {
        path: `/api/teams/${teamId}/members`,
        method: undefined,
        body: undefined,
        invoke: () => teamsAPI.getTeamMembers(teamId),
      },
      {
        path: `/api/teams/${teamId}/next-organizer`,
        method: undefined,
        body: undefined,
        invoke: () => teamsAPI.getNextOrganizer(teamId),
      },
      {
        path: `/api/teams/${teamId}/regenerate-invite`,
        method: 'POST',
        body: undefined,
        invoke: () => teamsAPI.regenerateInviteCode(teamId),
      },
      {
        path: `/api/teams/${teamId}`,
        method: 'PUT',
        body: JSON.stringify({ name: 'Alias Team', isHolidayMode: false }),
        invoke: () => teamsAPI.updateTeam(teamId, { name: 'Alias Team', isHolidayMode: false }),
      },
      {
        path: `/api/members/teams/${teamId}/members`,
        method: 'POST',
        body: JSON.stringify({ email: 'member@example.com' }),
        invoke: () => teamsAPI.addMember(teamId, { email: 'member@example.com' }),
      },
      {
        path: `/api/members/teams/${teamId}/members/${memberId}`,
        method: 'DELETE',
        body: undefined,
        invoke: () => teamsAPI.removeMember(teamId, memberId),
      },
      {
        path: `/api/members/teams/${teamId}/members/${memberId}/away`,
        method: 'PUT',
        body: JSON.stringify({ isAway: true }),
        invoke: () => teamsAPI.updateMember(teamId, memberId, { isAway: true }),
      },
    ]

    fetchMock.mockImplementation(async () => mockResponse({}))
    for (const assertion of assertions) {
      await assertion.invoke()
    }

    assertions.forEach((assertion, index) => {
      const [url, options] = fetchMock.mock.calls[index] as [string, RequestInit]
      expect(url).toBe(assertion.path)
      if (assertion.method) {
        expect(options.method).toBe(assertion.method)
      } else {
        expect(options.method).toBeUndefined()
      }
      expect(options.body).toBe(assertion.body)
    })
  })

  it('maps voting APIs to expected endpoints and HTTP methods', async () => {
    const teamId = 'team-1'
    const periodId = 'period-1'

    const assertions = [
      {
        path: `/api/voting/teams/${teamId}/period`,
        method: undefined,
        body: undefined,
        invoke: () => votingAPI.getCurrentPeriod(teamId),
      },
      {
        path: `/api/voting/teams/${teamId}/period`,
        method: 'POST',
        body: JSON.stringify({ votingDays: 3 }),
        invoke: () => votingAPI.startPeriod(teamId),
      },
      {
        path: `/api/voting/teams/${teamId}/period`,
        method: 'POST',
        body: JSON.stringify({ votingDays: 7 }),
        invoke: () => votingAPI.startPeriod(teamId, 7),
      },
      {
        path: `/api/voting/periods/${periodId}/venues`,
        method: 'POST',
        body: JSON.stringify({ name: 'Pizza', description: 'Cheese' }),
        invoke: () => votingAPI.proposeVenue(periodId, { name: 'Pizza', description: 'Cheese' }),
      },
      {
        path: `/api/voting/periods/${periodId}/start-voting`,
        method: 'POST',
        body: undefined,
        invoke: () => votingAPI.startVoting(periodId),
      },
      {
        path: `/api/voting/periods/${periodId}/vote`,
        method: 'POST',
        body: JSON.stringify({ venueId: 'venue-1' }),
        invoke: () => votingAPI.vote(periodId, 'venue-1'),
      },
      {
        path: `/api/voting/periods/${periodId}/vote`,
        method: 'POST',
        body: JSON.stringify({ venueId: 'venue-2' }),
        invoke: () => votingAPI.castVote(periodId, 'venue-2'),
      },
      {
        path: `/api/voting/periods/${periodId}/complete`,
        method: 'POST',
        body: undefined,
        invoke: () => votingAPI.completePeriod(periodId),
      },
      {
        path: `/api/voting/teams/${teamId}/history?limit=10&offset=0`,
        method: undefined,
        body: undefined,
        invoke: () => votingAPI.getHistory(teamId),
      },
      {
        path: `/api/voting/teams/${teamId}/history?limit=10&offset=0`,
        method: undefined,
        body: undefined,
        invoke: () => votingAPI.getPeriodHistory(teamId),
      },
    ]

    fetchMock.mockImplementation(async () => mockResponse({}))
    for (const assertion of assertions) {
      await assertion.invoke()
    }

    assertions.forEach((assertion, index) => {
      const [url, options] = fetchMock.mock.calls[index] as [string, RequestInit]
      expect(url).toBe(assertion.path)
      if (assertion.method) {
        expect(options.method).toBe(assertion.method)
      } else {
        expect(options.method).toBeUndefined()
      }
      expect(options.body).toBe(assertion.body)
    })
  })

  it('maps member APIs to expected endpoints and HTTP methods', async () => {
    const teamId = 'team-1'
    const memberId = 'member-1'

    const assertions = [
      {
        path: `/api/members/teams/${teamId}/members`,
        method: 'POST',
        body: JSON.stringify({ email: 'member@example.com' }),
        invoke: () => membersAPI.addMember(teamId, 'member@example.com'),
      },
      {
        path: `/api/members/teams/${teamId}/members/${memberId}`,
        method: 'DELETE',
        body: undefined,
        invoke: () => membersAPI.removeMember(teamId, memberId),
      },
      {
        path: `/api/members/teams/${teamId}/members/${memberId}/away`,
        method: 'PUT',
        body: JSON.stringify({ isAway: false }),
        invoke: () => membersAPI.updateAwayStatus(teamId, memberId, false),
      },
      {
        path: `/api/members/teams/${teamId}/members/${memberId}/stats`,
        method: undefined,
        body: undefined,
        invoke: () => membersAPI.getStats(teamId, memberId),
      },
      {
        path: `/api/members/teams/${teamId}/members/${memberId}/name`,
        method: 'PUT',
        body: JSON.stringify({ name: 'Renamed Member' }),
        invoke: () => membersAPI.updateName(teamId, memberId, 'Renamed Member'),
      },
    ]

    fetchMock.mockImplementation(async () => mockResponse({}))
    for (const assertion of assertions) {
      await assertion.invoke()
    }

    assertions.forEach((assertion, index) => {
      const [url, options] = fetchMock.mock.calls[index] as [string, RequestInit]
      expect(url).toBe(assertion.path)
      if (assertion.method) {
        expect(options.method).toBe(assertion.method)
      } else {
        expect(options.method).toBeUndefined()
      }
      expect(options.body).toBe(assertion.body)
    })
  })

  it('hits health check endpoint', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse({ status: 'ok', service: 'api', environment: 'test' }))

    await healthAPI.check()

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/health')
    expect(options.method).toBeUndefined()
  })
})
