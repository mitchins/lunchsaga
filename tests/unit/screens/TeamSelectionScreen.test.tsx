import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TeamSelectionScreen } from '@/screens/TeamSelectionScreen'
import { Team } from '@/lib/types'
import * as helpers from '@/lib/helpers'
import { TEAM_COLORS, TEAM_EMOJIS } from '@/lib/helpers'

const team: Team = {
  id: 'team-1',
  name: 'Guild One',
  emoji: TEAM_EMOJIS[1],
  color: TEAM_COLORS[0].value,
  ownerId: 'owner-1',
  inviteCode: 'JOIN123',
  isHolidayMode: false,
  createdAt: 1,
}

const user = {
  id: 'user-1',
  name: 'Captain',
  email: 'captain@example.com',
  createdAt: 1,
}

const sonnerMock = vi.hoisted(() => ({
  success: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: sonnerMock,
}))

type TeamSelectionTestSetupOptions = {
  teams?: Team[]
  userData?: {
    id: string
    name: string
    email: string
    createdAt: number
  }
}

const setupTeamSelectionScreen = (options: TeamSelectionTestSetupOptions = {}) => {
  const userEventClient = userEvent.setup()
  const onSelectTeam = vi.fn()
  const onCreateTeam = vi.fn()
  const onJoinTeam = vi.fn()

  render(
    <TeamSelectionScreen
      user={options.userData ?? user}
      teams={options.teams ?? [team]}
      onSelectTeam={onSelectTeam}
      onCreateTeam={onCreateTeam}
      onJoinTeam={onJoinTeam}
    />,
  )

  return {
    userEventClient,
    onSelectTeam,
    onCreateTeam,
    onJoinTeam,
  }
}

describe('TeamSelectionScreen', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows empty state text when no teams exist and creates a team', async () => {
    const { userEventClient, onCreateTeam } = setupTeamSelectionScreen({ teams: [] })

    vi.spyOn(helpers, 'generateId').mockReturnValue('generated-team-id')

    expect(screen.getByText('Gather your fellowship and begin your culinary saga')).toBeInTheDocument()
    expect(screen.queryByText('Your Teams')).not.toBeInTheDocument()

    await userEventClient.click(screen.getByText('Forge New Fellowship'))

    const createDialog = await screen.findByRole('dialog')
    const teamNameInput = within(createDialog).getByLabelText('Team Name')
    const createButton = within(createDialog).getByRole('button', { name: 'Create Team' })

    expect(createButton).toBeDisabled()
    await userEventClient.type(teamNameInput, 'New Team')
    expect(createButton).toBeEnabled()
    await userEventClient.click(createButton)

    await waitFor(() =>
      expect(onCreateTeam).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'generated-team-id',
          name: 'New Team',
          ownerId: 'user-1',
          emoji: TEAM_EMOJIS[0],
          color: TEAM_COLORS[0].value,
          inviteCode: '',
          createdAt: expect.any(Number),
        }),
      ),
    )
    expect(sonnerMock.success).toHaveBeenCalledWith(`${TEAM_EMOJIS[0]} New Team created!`)
  })

  it('joins a team with a validated, uppercase invite code', async () => {
    const { userEventClient, onSelectTeam, onJoinTeam } = setupTeamSelectionScreen()

    expect(screen.getByText('Your Teams')).toBeInTheDocument()
    await userEventClient.click(screen.getByText('Guild One'))
    expect(onSelectTeam).toHaveBeenCalledWith(team)

    await userEventClient.click(screen.getByText('Join Fellowship'))

    const joinDialog = await screen.findByRole('dialog')
    const inviteInput = within(joinDialog).getByLabelText('Invite Code')
    const joinButton = within(joinDialog).getByRole('button', { name: 'Join Team' })

    await userEventClient.type(inviteInput, 'abc123')
    expect(joinButton).toBeDisabled()

    await userEventClient.clear(inviteInput)
    await userEventClient.type(inviteInput, 'abcd1234')
    expect((inviteInput as HTMLInputElement).value).toBe('ABCD1234')
    expect(joinButton).toBeEnabled()
    await userEventClient.click(joinButton)

    expect(onJoinTeam).toHaveBeenCalledWith('ABCD1234')
  })

  it('renders team list and lets members switch teams', async () => {
    const { userEventClient, onSelectTeam } = setupTeamSelectionScreen()

    await userEventClient.click(screen.getByText('Guild One'))
    expect(onSelectTeam).toHaveBeenCalledWith(team)
  })

  it('shows Member label for teams owned by another user', async () => {
    const otherOwnerTeam: Team = {
      ...team,
      id: 'team-2',
      name: 'Guild Two',
      ownerId: 'someone-else',
    }

    const { userEventClient, onSelectTeam } = setupTeamSelectionScreen({ teams: [otherOwnerTeam] })

    expect(screen.getByText('Member')).toBeInTheDocument()
    expect(screen.queryByText('Guild Master')).not.toBeInTheDocument()

    await userEventClient.click(screen.getByText('Guild Two'))
    expect(onSelectTeam).toHaveBeenCalledWith(otherOwnerTeam)
  })

  it('shows Guild Master label for teams owned by the current user', async () => {
    const ownedTeam: Team = {
      ...team,
      id: 'team-3',
      name: 'Guild Three',
      ownerId: 'user-1',
    }

    const { userEventClient, onSelectTeam } = setupTeamSelectionScreen({ teams: [ownedTeam] })

    expect(screen.getByText('Guild Master')).toBeInTheDocument()
    expect(screen.queryByText('Member')).not.toBeInTheDocument()

    await userEventClient.click(screen.getByText('Guild Three'))
    expect(onSelectTeam).toHaveBeenCalledWith(ownedTeam)
  })

  it('can close the create-team dialog without creating a team', async () => {
    const { userEventClient, onCreateTeam } = setupTeamSelectionScreen()

    await userEventClient.click(screen.getByText('Forge New Fellowship'))
    const createDialog = await screen.findByRole('dialog')
    await userEventClient.click(within(createDialog).getByRole('button', { name: 'Cancel' }))

    expect(onCreateTeam).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('can close the join-team dialog without joining', async () => {
    const { userEventClient, onJoinTeam } = setupTeamSelectionScreen()

    await userEventClient.click(screen.getByText('Join Fellowship'))
    const joinDialog = await screen.findByRole('dialog')
    await userEventClient.click(within(joinDialog).getByRole('button', { name: 'Cancel' }))

    expect(onJoinTeam).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('does not submit create-team when team name is blank', async () => {
    const { userEventClient, onCreateTeam } = setupTeamSelectionScreen()

    await userEventClient.click(screen.getByText('Forge New Fellowship'))
    const createDialog = await screen.findByRole('dialog')
    const form = createDialog.querySelector('form')
    if (form) {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    }

    expect(onCreateTeam).not.toHaveBeenCalled()
  })

  it('does not submit join-team when invite code is blank', async () => {
    const { userEventClient, onJoinTeam } = setupTeamSelectionScreen()

    await userEventClient.click(screen.getByText('Join Fellowship'))
    const joinDialog = await screen.findByRole('dialog')
    const form = joinDialog.querySelector('form')
    if (form) {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    }

    expect(onJoinTeam).not.toHaveBeenCalled()
  })
})
