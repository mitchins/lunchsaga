/**
 * LunchSaga API Client
 *
 * Type-safe API client for communicating with the backend.
 * Uses fetch with automatic JWT token handling.
 */

// Types matching the backend responses
export interface User {
  id: string
  email: string
  name: string
  avatar?: string | null
}

export interface Team {
  id: string
  name: string
  emoji: string
  color: string
  ownerId: string
  inviteCode: string
  isHolidayMode: boolean
  createdAt: number
}

export interface TeamMember {
  id: string
  teamId: string
  userId: string
  name: string
  points: number
  reputationScore: number
  totalVenuesProposed: number
  totalWins: number
  isAway: boolean
  joinedAt: number
}

export interface VenueOption {
  id: string
  name: string
  description: string
  proposedBy: string
  votes: string[]
}

export interface LunchPeriod {
  id: string
  teamId: string
  organizerId: string
  startDate: number
  endDate: number | null
  status: 'proposing' | 'voting' | 'completed'
  votingDeadline: number | null
  winningVenueId: string | null
  venueOptions: VenueOption[]
}

export interface Achievement {
  type: string
  earnedAt: number
  metadata: Record<string, unknown>
}

export interface MemberStats extends TeamMember {
  achievements: Achievement[]
}

// API Error class
export class APIError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

// Token management
const TOKEN_KEY = 'lunchsaga_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

// Base fetch function with auth
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()

  const additionalHeaders = options.headers as Record<string, string> | undefined
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...additionalHeaders,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new APIError(response.status, data.error || 'An error occurred')
  }

  return data
}

// Auth API
export const authAPI = {
  /**
   * Send magic link email with OTP code
   */
  sendMagicLink: (email: string) =>
    fetchAPI<{ sent: boolean; email: string }>('/auth/magic-link', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  /**
   * Verify OTP code and get JWT token
   */
  verify: async (email: string, code: string) => {
    const result = await fetchAPI<{ token: string; user: User }>('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    })
    // Store token on successful verification
    setToken(result.token)
    return result
  },

  /**
   * Get current authenticated user
   */
  getMe: () => fetchAPI<{ user: User }>('/auth/me'),

  /**
   * Update current user's profile
   */
  updateMe: (updates: { name?: string; avatar?: string }) =>
    fetchAPI<{ user: User }>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  /**
   * Logout and clear token
   */
  logout: async () => {
    try {
      await fetchAPI<{ success: boolean }>('/auth/logout', {
        method: 'POST',
      })
    } finally {
      clearToken()
    }
  },
}

// Teams API
export const teamsAPI = {
  /**
   * List all teams the user is a member of
   */
  list: () => fetchAPI<{ teams: Team[] }>('/teams'),
  // Alias for App.tsx compatibility
  getTeams: () => fetchAPI<{ teams: Team[] }>('/teams'),

  /**
   * Create a new team
   */
  create: (data: { name: string; emoji?: string; color?: string }) =>
    fetchAPI<{ team: Team }>('/teams', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  // Alias for App.tsx compatibility
  createTeam: (data: { name: string; emoji?: string; color?: string }) =>
    fetchAPI<{ team: Team }>('/teams', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Get team details
   */
  get: (teamId: string) => fetchAPI<{ team: Team }>(`/teams/${teamId}`),

  /**
   * Update team details (owner only)
   */
  update: (teamId: string, updates: Partial<Pick<Team, 'name' | 'emoji' | 'color' | 'isHolidayMode'>>) =>
    fetchAPI<{ team: Team }>(`/teams/${teamId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  /**
   * Join a team using invite code
   */
  join: (inviteCode: string) =>
    fetchAPI<{ team: Team; alreadyMember: boolean }>('/teams/join', {
      method: 'POST',
      body: JSON.stringify({ inviteCode }),
    }),
  // Alias for App.tsx compatibility
  joinTeam: (inviteCode: string) =>
    fetchAPI<{ team: Team; alreadyMember: boolean }>('/teams/join', {
      method: 'POST',
      body: JSON.stringify({ inviteCode }),
    }),

  /**
   * Leave a team
   */
  leave: (teamId: string) =>
    fetchAPI<{ success: boolean }>(`/teams/${teamId}/leave`, {
      method: 'DELETE',
    }),

  /**
   * Get team members
   */
  getMembers: (teamId: string) =>
    fetchAPI<{ members: TeamMember[] }>(`/teams/${teamId}/members`),
  // Alias for App.tsx compatibility
  getTeamMembers: (teamId: string) =>
    fetchAPI<{ members: TeamMember[] }>(`/teams/${teamId}/members`),

  /**
   * Get next organizer
   */
  getNextOrganizer: (teamId: string) =>
    fetchAPI<{ organizer: TeamMember | null }>(`/teams/${teamId}/next-organizer`),

  /**
   * Regenerate invite code (owner only)
   */
  regenerateInviteCode: (teamId: string) =>
    fetchAPI<{ inviteCode: string }>(`/teams/${teamId}/regenerate-invite`, {
      method: 'POST',
    }),

  // Aliases for App.tsx compatibility
  updateTeam: (teamId: string, updates: Partial<Pick<Team, 'name' | 'emoji' | 'color' | 'isHolidayMode'>>) =>
    fetchAPI<{ team: Team }>(`/teams/${teamId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  addMember: (teamId: string, data: { name: string }) =>
    fetchAPI<{ member: TeamMember }>(`/members/teams/${teamId}/members`, {
      method: 'POST',
      body: JSON.stringify({ email: data.name }), // API expects email, frontend sends name
    }),

  removeMember: (teamId: string, memberId: string) =>
    fetchAPI<{ success: boolean }>(`/members/teams/${teamId}/members/${memberId}`, {
      method: 'DELETE',
    }),

  updateMember: (teamId: string, memberId: string, updates: { isAway?: boolean }) =>
    fetchAPI<{ member: TeamMember }>(`/members/teams/${teamId}/members/${memberId}/away`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
}

// Voting API
export const votingAPI = {
  /**
   * Get current lunch period for a team
   */
  getCurrentPeriod: (teamId: string) =>
    fetchAPI<{ period: LunchPeriod | null }>(`/voting/teams/${teamId}/period`),

  /**
   * Start a new lunch period
   */
  startPeriod: (teamId: string, votingDays?: number) =>
    fetchAPI<{ period: LunchPeriod }>(`/voting/teams/${teamId}/period`, {
      method: 'POST',
      body: JSON.stringify({ votingDays: votingDays || 3 }),
    }),

  /**
   * Propose a venue for a period
   */
  proposeVenue: (periodId: string, data: { name: string; description?: string }) =>
    fetchAPI<{ venue: VenueOption }>(`/voting/periods/${periodId}/venues`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Start voting phase (organizer only)
   */
  startVoting: (periodId: string) =>
    fetchAPI<{ success: boolean }>(`/voting/periods/${periodId}/start-voting`, {
      method: 'POST',
    }),

  /**
   * Cast or toggle a vote
   */
  vote: (periodId: string, venueId: string) =>
    fetchAPI<{ voted: boolean; action: 'added' | 'changed' | 'removed' }>(`/voting/periods/${periodId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ venueId }),
    }),
  // Alias for App.tsx compatibility - returns period for UI update
  castVote: (periodId: string, venueId: string) =>
    fetchAPI<{ period: LunchPeriod }>(`/voting/periods/${periodId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ venueId }),
    }),

  /**
   * Complete voting and determine winner (organizer only)
   */
  completePeriod: (periodId: string) =>
    fetchAPI<{ period: LunchPeriod }>(`/voting/periods/${periodId}/complete`, {
      method: 'POST',
    }),

  /**
   * Get completed periods history
   */
  getHistory: (teamId: string, limit = 10, offset = 0) =>
    fetchAPI<{ history: LunchPeriod[] }>(`/voting/teams/${teamId}/history?limit=${limit}&offset=${offset}`),
  // Alias for App.tsx compatibility
  getPeriodHistory: (teamId: string) =>
    fetchAPI<{ periods: LunchPeriod[] }>(`/voting/teams/${teamId}/history?limit=10&offset=0`),
}

// Members API
export const membersAPI = {
  /**
   * Add a member to a team by email (owner only)
   */
  addMember: (teamId: string, email: string) =>
    fetchAPI<{ member: TeamMember }>(`/members/teams/${teamId}/members`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  /**
   * Remove a member from a team (owner only)
   */
  removeMember: (teamId: string, memberId: string) =>
    fetchAPI<{ success: boolean }>(`/members/teams/${teamId}/members/${memberId}`, {
      method: 'DELETE',
    }),

  /**
   * Update member's away status
   */
  updateAwayStatus: (teamId: string, memberId: string, isAway: boolean) =>
    fetchAPI<{ member: TeamMember }>(`/members/teams/${teamId}/members/${memberId}/away`, {
      method: 'PUT',
      body: JSON.stringify({ isAway }),
    }),

  /**
   * Get detailed stats for a member
   */
  getStats: (teamId: string, memberId: string) =>
    fetchAPI<{ stats: MemberStats }>(`/members/teams/${teamId}/members/${memberId}/stats`),

  /**
   * Update member's display name
   */
  updateName: (teamId: string, memberId: string, name: string) =>
    fetchAPI<{ member: TeamMember }>(`/members/teams/${teamId}/members/${memberId}/name`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    }),
}

// Health check
export const healthAPI = {
  check: () => fetchAPI<{ status: string; service: string; environment: string }>('/health'),
}
