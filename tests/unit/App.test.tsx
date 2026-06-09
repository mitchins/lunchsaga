import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'

// Mock all API modules FIRST before importing App
vi.mock('@/services/api', () => ({
  getToken: () => null,
  clearToken: vi.fn(),
  authAPI: {
    login: vi.fn(),
    verifyCode: vi.fn(),
  },
  teamsAPI: {
    getTeams: vi.fn().mockResolvedValue([]),
    getTeam: vi.fn().mockResolvedValue(null),
    createTeam: vi.fn(),
  },
  votingAPI: {
    getVotingState: vi.fn().mockResolvedValue(null),
    submitVote: vi.fn(),
  },
  membersAPI: {
    getMembers: vi.fn().mockResolvedValue([]),
  },
}))

// Mock react-router-dom completely
vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => React.createElement('div', null, children),
  Routes: ({ children }: { children: React.ReactNode }) => React.createElement('div', null, children),
  Route: () => React.createElement('div'),
  useMatch: () => ({ params: {} }),
  matchPath: () => null,
  useNavigate: () => vi.fn(),
  useParams: () => ({ teamId: undefined }),
  Navigate: () => React.createElement('div'),
}))

// Now import App after mocks are set up
import App from '@/App'

describe('App Component', () => {
  it('renders the app component', () => {
    const { container } = render(<App />)
    // App should render something
    expect(container).toBeTruthy()
  })

  it('App component exports a valid component', () => {
    // Validate that App is a valid React component
    expect(App).toBeDefined()
    expect(typeof App).toBe('function')
  })
})
